-- ФУНКЦИЯ АТОМАРНОГО РЕЗЕРВИРОВАНИЯ (защита от race conditions) ====TESTED====
CREATE OR REPLACE FUNCTION reserve_surprise_box_atomic(
	p_box_id BIGINT,
	p_customer_id BIGINT,
	p_reservation_minutes INTEGER DEFAULT 5
) RETURNS TABLE (
	success BOOLEAN,
	message TEXT,
	expires_at TIMESTAMP
) AS $$
DECLARE
	v_expires_at TIMESTAMP;
	v_current_status TEXT;
	v_reserved_by BIGINT;
BEGIN
	v_expires_at := CURRENT_TIMESTAMP + (p_reservation_minutes || ' minutes')::INTERVAL;
	-- Атомарная проверка и резервирование
	UPDATE surprise_box 
	SET status = 'reserved',
		reserved_by = p_customer_id,
		reserved_at = CURRENT_TIMESTAMP,
		reservation_expires_at = v_expires_at,
		updated_at = CURRENT_TIMESTAMP	
	WHERE id = p_box_id AND status = 'active' 
	RETURNING status, reserved_by INTO v_current_status, v_reserved_by;
	
	IF NOT FOUND THEN
		-- Проверяем причину неудачи
		SELECT status, reserved_by INTO v_current_status, v_reserved_by
		FROM surprise_box WHERE id = p_box_id;
		
		IF v_current_status IS NULL THEN
			RETURN QUERY SELECT FALSE, 'Box not found'::TEXT, NULL::TIMESTAMP;
		ELSIF v_current_status = 'reserved' THEN
			RETURN QUERY SELECT FALSE, 'Box already reserved'::TEXT, NULL::TIMESTAMP;
		ELSIF v_current_status = 'sold' THEN
			RETURN QUERY SELECT FALSE, 'Box already sold'::TEXT, NULL::TIMESTAMP;
		ELSE
			RETURN QUERY SELECT FALSE, 'Box not available for reservation'::TEXT, NULL::TIMESTAMP;
		END IF;
		
		RETURN;
	END IF;
	
	RETURN QUERY SELECT TRUE, 'Reservation successful'::TEXT, v_expires_at;
END;
$$ LANGUAGE plpgsql;

-- ФУНКЦИЯ ОСВОБОЖДЕНИЯ ПРОСРОЧЕННЫХ РЕЗЕРВАЦИЙ   =====ADD CRON 3m=====
CREATE OR REPLACE FUNCTION cleanup_expired_reservations()
RETURNS INTEGER AS $$
DECLARE
	expired_count INTEGER;
BEGIN
	UPDATE surprise_box 
	SET status = 'active',
		reserved_by = NULL,
		reserved_at = NULL,
		reservation_expires_at = NULL,
		updated_at = CURRENT_TIMESTAMP
	WHERE status = 'reserved' 
	  AND reservation_expires_at < CURRENT_TIMESTAMP;
	
	GET DIAGNOSTICS expired_count = ROW_COUNT;
	RETURN expired_count;
END;
$$ LANGUAGE plpgsql;

-- Функция для генерации уникального pickup_code  ====TESTED====
CREATE OR REPLACE FUNCTION generate_pickup_code() 
RETURNS TEXT AS $$
DECLARE
    v_pickup_code TEXT;
    v_retry_count INT := 0;
    v_max_retries INT := 10;
BEGIN
    LOOP
        v_retry_count := v_retry_count + 1;
        
        -- Генерируем код из 8 заглавных символов
        v_pickup_code := upper(
            substr(
                encode(
                    sha256(
                        (random()::text || clock_timestamp()::text || v_retry_count::text)::bytea
                    ), 
                    'hex'
                ), 
                1, 8
            )
        );
        
        -- Проверяем уникальность
        IF NOT EXISTS (SELECT 1 FROM orders WHERE pickup_code = v_pickup_code) THEN
            RETURN v_pickup_code;
        END IF;
        
        -- Если достигли максимума попыток
        IF v_retry_count >= v_max_retries THEN
            RAISE EXCEPTION 'Failed to generate unique pickup code after % attempts', v_max_retries;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ФУНКЦИЯ ПОДТВЕРЖДЕНИЯ ЗАКАЗА  ====TESTED====
CREATE OR REPLACE FUNCTION confirm_box_order(
    p_box_id BIGINT,
    p_customer_id BIGINT,
    p_store_id BIGINT,
    p_payment_type PAYMENT_TYPE,
    p_fulfillment_type FULFILLMENT_TYPE,
    p_payment_method PAYMENT_METHOD,
    p_amount INT,
    p_transaction_id TEXT DEFAULT NULL,
    p_payment_gateway TEXT DEFAULT NULL,
    p_delivery_address TEXT DEFAULT NULL,
    p_delivery_service TEXT DEFAULT NULL,
    p_estimated_delivery_at TIMESTAMP DEFAULT NULL,
    p_tracking_code TEXT DEFAULT NULL
) RETURNS TABLE (
    success BOOLEAN,
    message TEXT,
    order_id BIGINT,
    pickup_code TEXT
) AS $$
DECLARE
    v_order_id BIGINT;
    v_pickup_code TEXT;
    v_delivery_id BIGINT;
    v_customer_exists BOOLEAN;
    v_store_exists BOOLEAN;
BEGIN
    -- Валидация входных данных
    IF p_amount <= 0 THEN
        RETURN QUERY SELECT FALSE, 'Invalid amount - must be positive'::TEXT, NULL::BIGINT, NULL::TEXT;
        RETURN;
    END IF;

    IF p_fulfillment_type = 'delivery' AND (p_delivery_address IS NULL OR trim(p_delivery_address) = '') THEN
        RETURN QUERY SELECT FALSE, 'Delivery address is required for delivery orders'::TEXT, NULL::BIGINT, NULL::TEXT;
        RETURN;
    END IF;

    -- Проверяем существование customer и store
    SELECT EXISTS(SELECT 1 FROM customer WHERE id = p_customer_id) INTO v_customer_exists;
    SELECT EXISTS(SELECT 1 FROM store WHERE id = p_store_id) INTO v_store_exists;
    
    IF NOT v_customer_exists THEN
        RETURN QUERY SELECT FALSE, 'Customer not found'::TEXT, NULL::BIGINT, NULL::TEXT;
        RETURN;
    END IF;
    
    IF NOT v_store_exists THEN
        RETURN QUERY SELECT FALSE, 'Store not found'::TEXT, NULL::BIGINT, NULL::TEXT;
        RETURN;
    END IF;

    -- Генерируем уникальный pickup_code
    v_pickup_code := generate_pickup_code();

    -- 1. Подтверждаем продажу box
    UPDATE surprise_box 
    SET status = 'sold', 
        updated_at = CURRENT_TIMESTAMP 
    WHERE id = p_box_id 
        AND status = 'reserved' 
        AND reserved_by = p_customer_id 
        AND reservation_expires_at > CURRENT_TIMESTAMP
				AND store_id = p_store_id;

    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, 'Unable to confirm order - box not reserved by this customer or reservation expired or box not from this store'::TEXT, NULL::BIGINT, NULL::TEXT;
        RETURN;
    END IF;

    -- 2. Создаем order
    INSERT INTO orders (
        customer_id,
        surprise_box_id,
        store_id,
        status,
        payment_type,
        fulfillment_type,
        pickup_code
    ) VALUES (
        p_customer_id,
        p_box_id,
        p_store_id,
        'paid',
        p_payment_type,
        p_fulfillment_type,
        v_pickup_code
    ) RETURNING id INTO v_order_id;

    -- 3. Создаем payment
    INSERT INTO payment (
        order_id,
        payment_method,
        amount,
        payment_status,
        transaction_id,
        payment_gateway,
        payment_date
    ) VALUES (
        v_order_id,
        p_payment_method,
        p_amount,
        'completed',
        p_transaction_id,
        p_payment_gateway,
        CURRENT_TIMESTAMP
    );

    -- 4. Если это доставка, создаем запись в delivery
    IF p_fulfillment_type = 'delivery' THEN
        INSERT INTO delivery (
            order_id,
					  delivery_service,
            delivery_address,
            estimated_delivery_at,
            tracking_code
        ) VALUES (
            v_order_id,
						p_delivery_service,
            trim(p_delivery_address),
            p_estimated_delivery_at,
					  p_tracking_code
        ) RETURNING id INTO v_delivery_id;
    END IF;

    RETURN QUERY SELECT TRUE, 'Order confirmed successfully'::TEXT, v_order_id, v_pickup_code;

EXCEPTION 
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error confirming order: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- ФУНКЦИЯ ДЛЯ АВТОМАТИЧЕСКОЙ СИНХРОНИЗАЦИИ ДЕНОРМАЛИЗОВАННЫХ ДАННЫХ ====TESTED====
-- Синхронизация данных магазина
CREATE OR REPLACE FUNCTION sync_surprise_box_store_data()
RETURNS TRIGGER AS $$
DECLARE
    v_business_name TEXT;
BEGIN
    -- Получаем имя бизнеса по store.business_id
    SELECT business_name INTO v_business_name FROM business WHERE id = NEW.business_id;

    -- Проверяем, изменилось ли что-либо из нужных полей
    IF ROW(NEW.address, NEW.city, NEW.location, v_business_name)
       IS DISTINCT FROM
       ROW(OLD.address, OLD.city, OLD.location,
           (SELECT business_name FROM business WHERE id = OLD.business_id)) THEN

        UPDATE surprise_box
        SET store_address = NEW.address,
            store_city = NEW.city,
            store_location = NEW.location,
            business_name = v_business_name,
            updated_at = CURRENT_TIMESTAMP
        WHERE store_id = NEW.id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ТРИГГЕР ДЛЯ АВТОМАТИЧЕСКОЙ СИНХРОНИЗАЦИИ ДЕНОРМАЛИЗОВАННЫХ ДАННЫХ
CREATE OR REPLACE TRIGGER trigger_sync_surprise_box_store_data
	AFTER UPDATE ON store
	FOR EACH ROW
	EXECUTE FUNCTION sync_surprise_box_store_data();

-- ФУНКЦИЯ ДЛЯ СОaЗДАНИЯ SURPRISE_BOX ИЗ ШАБЛОНА ====TESTED====
CREATE OR REPLACE FUNCTION create_surprise_box_from_template(
	p_template_id BIGINT,
	p_count INT DEFAULT 1
) RETURNS SETOF BIGINT AS $$
DECLARE
	v_data RECORD;
	v_count_limit INTEGER := 50;
BEGIN
	IF p_count < 1 THEN
			RAISE EXCEPTION 'count cant be less than 1';
		END IF;

		IF p_count > v_count_limit THEN
			RAISE EXCEPTION 'count cant be more than %', v_count_limit;
		END IF;

	-- Получаем данные `box_template` **один раз**
	SELECT bt.id, bt.store_id, bt.category_id, 
				b.business_name, s.address, s.city, s.location,
		    bt.template_name, bt.description, c.name, bt.original_price, bt.discounted_price, bt.image_url,
				bt.pickup_start_time, bt.pickup_end_time, bt.sale_start_time, bt.sale_end_time
	INTO v_data
	FROM box_template bt
	JOIN store s ON bt.store_id = s.id
	JOIN business b ON s.business_id = b.id
	JOIN category c ON bt.category_id = c.id
	WHERE bt.id = p_template_id AND bt.is_active = TRUE;

	-- Проверяем, найдены ли данные
	IF NOT FOUND THEN
		RAISE EXCEPTION 'Template not found or inactive';
	END IF;

	-- Вставляем `count` записей **атомарно**
		RETURN QUERY
	INSERT INTO surprise_box (
		box_template_id, store_id, category_id,
		business_name, store_address, store_city, store_location,
		title, description, category_name, original_price, discounted_price, image_url,
		pickup_start_time, pickup_end_time, sale_start_time, sale_end_time,
		status
	)
	SELECT v_data.id, v_data.store_id, v_data.category_id, 
				 v_data.business_name, v_data.address, v_data.city, v_data.location,
		   v_data.template_name, v_data.description, v_data.name, v_data.original_price, v_data.discounted_price, v_data.image_url,
		   v_data.pickup_start_time, v_data.pickup_end_time, v_data.sale_start_time, v_data.sale_end_time, 'active'
	FROM generate_series(1, p_count)
	RETURNING id;

END;
$$ LANGUAGE plpgsql;

-- ФУНКЦИЯ ДЛЯ УБОРКИ ИСТЕКШИХ БОКСОВ ====TESTED====
CREATE OR REPLACE FUNCTION expire_surprise_boxes()
RETURNS TABLE (
    success BOOLEAN,
    message TEXT,
    expired_count INTEGER,
    expired_box_ids BIGINT[]
) AS $$
DECLARE
    v_expired_count INTEGER := 0;
    v_expired_ids BIGINT[];
    v_current_time TIMESTAMP := CURRENT_TIMESTAMP;
BEGIN
    -- Получаем ID всех боксов, которые нужно просрочить
    SELECT array_agg(sb.id)
    INTO v_expired_ids
    FROM surprise_box sb
    JOIN box_template bt ON sb.box_template_id = bt.id
    WHERE bt.pickup_end_time < v_current_time
      AND sb.status IN ('active')
      AND bt.is_active = TRUE;

    -- Если нет боксов для обновления
    IF v_expired_ids IS NULL OR array_length(v_expired_ids, 1) = 0 THEN
        RETURN QUERY SELECT TRUE, 'No boxes to expire'::TEXT, 0, ARRAY[]::BIGINT[];
        RETURN;
    END IF;

    -- Обновляем статус просроченных боксов
    UPDATE surprise_box 
    SET status = 'expired',
        updated_at = v_current_time,
        -- Очищаем резервацию для зарезервированных боксов
        reserved_by = CASE 
            WHEN status = 'reserved' THEN NULL 
            ELSE reserved_by 
        END,
        reservation_expires_at = CASE 
            WHEN status = 'reserved' THEN NULL 
            ELSE reservation_expires_at 
        END
    WHERE id = ANY(v_expired_ids);

    -- Получаем количество обновленных записей
    GET DIAGNOSTICS v_expired_count = ROW_COUNT;

    -- Логируем результат (опционально, если есть таблица логов)
    -- INSERT INTO system_log (operation, details, created_at) 
    -- VALUES ('expire_boxes', format('Expired %s boxes: %s', v_expired_count, v_expired_ids::text), v_current_time);

    RETURN QUERY SELECT 
        TRUE, 
        format('Successfully expired %s surprise boxes', v_expired_count)::TEXT,
        v_expired_count,
        v_expired_ids;

EXCEPTION
    WHEN OTHERS THEN
        -- Логируем ошибку (опционально)
        -- INSERT INTO system_log (operation, details, error_message, created_at) 
        -- VALUES ('expire_boxes', 'Error during box expiration', SQLERRM, CURRENT_TIMESTAMP);
        
        RETURN QUERY SELECT 
            FALSE, 
            format('Error expiring boxes: %s', SQLERRM)::TEXT,
            0,
            ARRAY[]::BIGINT[];
END;
$$ LANGUAGE plpgsql;

-- ФУНКЦИЯ ДЛЯ СОЗДАНИЯ ШАБЛОНА BOX_TEMPLATE  ====TESTED====
CREATE OR REPLACE FUNCTION create_box_template(
    p_store_id BIGINT,
    p_category_id BIGINT,
    p_template_name TEXT,
    p_original_price INT,
    p_discounted_price INT,
    p_pickup_start_time TIMESTAMP,
    p_pickup_end_time TIMESTAMP,
    p_sale_start_time TIMESTAMP,
    p_sale_end_time TIMESTAMP,
    p_description TEXT DEFAULT NULL,
    p_image_url TEXT DEFAULT NULL
) RETURNS TABLE (
    success BOOLEAN,
    message TEXT,
    template_id BIGINT
) AS $$
	DECLARE
    v_template_id BIGINT;
    v_store_exists BOOLEAN;
    v_category_exists BOOLEAN;
    v_store_image_url TEXT;
-- выполнение 
	BEGIN
    -- Валидация входных параметров
    IF p_store_id IS NULL OR p_category_id IS NULL OR 
       p_template_name IS NULL OR trim(p_template_name) = '' OR
       p_original_price IS NULL OR p_discounted_price IS NULL OR
       p_pickup_start_time IS NULL OR p_pickup_end_time IS NULL OR
       p_sale_start_time IS NULL OR p_sale_end_time IS NULL THEN
        RETURN QUERY SELECT FALSE, 'Required parameters cannot be null or empty'::TEXT, NULL::BIGINT;
        RETURN;
    END IF;

    -- Проверка корректности цен
    IF p_original_price <= 0 OR p_discounted_price <= 0 THEN
        RETURN QUERY SELECT FALSE, 'Prices must be greater than 0'::TEXT, NULL::BIGINT;
        RETURN;
    END IF;

    IF p_discounted_price > p_original_price THEN
        RETURN QUERY SELECT FALSE, 'Discounted price cannot be greater than original price'::TEXT, NULL::BIGINT;
        RETURN;
    END IF;

    -- Валидация временных интервалов
    IF p_pickup_start_time >= p_pickup_end_time THEN
        RETURN QUERY SELECT FALSE, 'Pickup start time must be before pickup end time'::TEXT, NULL::BIGINT;
        RETURN;
    END IF;

    IF p_sale_start_time >= p_sale_end_time THEN
        RETURN QUERY SELECT FALSE, 'Sale start time must be before sale end time'::TEXT, NULL::BIGINT;
        RETURN;
    END IF;

    -- Проверка, что время продажи не выходит за рамки времени получения
    IF p_pickup_start_time < p_sale_start_time THEN
        RETURN QUERY SELECT FALSE, 'Pickup start time cannot be before sale start time'::TEXT, NULL::BIGINT;
        RETURN;
    END IF;

    IF p_pickup_end_time > p_sale_end_time THEN
        RETURN QUERY SELECT FALSE, 'Pickup end time cannot be after sale end time'::TEXT, NULL::BIGINT;
        RETURN;
    END IF;

    -- Проверка существования store и получение image_url
    SELECT EXISTS (SELECT 1 FROM store WHERE id = p_store_id), 
           COALESCE(box_image_url, '') 
    INTO v_store_exists, v_store_image_url
    FROM store 
    WHERE id = p_store_id;
    
    IF NOT v_store_exists THEN
        RETURN QUERY SELECT FALSE, 'Store not found'::TEXT, NULL::BIGINT;
        RETURN;
    END IF;

    -- Проверка существования category
    SELECT EXISTS (SELECT 1 FROM category WHERE id = p_category_id) INTO v_category_exists;
    IF NOT v_category_exists THEN
        RETURN QUERY SELECT FALSE, 'Category not found'::TEXT, NULL::BIGINT;
        RETURN;
    END IF;

    -- Создание записи box_template
    INSERT INTO box_template (
        store_id,
        category_id,
        template_name,
        description,
        original_price,
        discounted_price,
        image_url,
        pickup_start_time,
        pickup_end_time,
        sale_start_time,
        sale_end_time
    ) VALUES (
        p_store_id,
        p_category_id,
        trim(p_template_name),
        CASE WHEN p_description IS NOT NULL AND trim(p_description) != '' 
             THEN trim(p_description) 
             ELSE NULL END,
        p_original_price,
        p_discounted_price,
        CASE 
            WHEN p_image_url IS NOT NULL AND trim(p_image_url) != '' THEN trim(p_image_url)
            WHEN v_store_image_url IS NOT NULL AND trim(v_store_image_url) != '' THEN v_store_image_url
            ELSE NULL 
        END,
        p_pickup_start_time,
        p_pickup_end_time,
        p_sale_start_time,
        p_sale_end_time
    ) RETURNING id INTO v_template_id;

    RETURN QUERY SELECT TRUE, 'Box template created successfully'::TEXT, v_template_id;

EXCEPTION
    WHEN foreign_key_violation THEN
        RETURN QUERY SELECT FALSE, 'Invalid store_id or category_id reference'::TEXT, NULL::BIGINT;
    WHEN unique_violation THEN
        RETURN QUERY SELECT FALSE, format('Unique violation: %s', SQLERRM)::TEXT, NULL::BIGINT;
    WHEN OTHERS THEN
        RETURN QUERY SELECT FALSE, format('Error creating box template: %s', SQLERRM)::TEXT, NULL::BIGINT;
END;
$$ LANGUAGE plpgsql;

-- =============================================

-- 9. ТРИГГЕР ДЛЯ УВЕЛИЧЕНИЯ СЧЕТЧИКА ИСПОЛЬЗОВАНИЯ ШАБЛОНА ====DONE====
CREATE OR REPLACE FUNCTION increment_template_usage()
RETURNS TRIGGER AS $$
BEGIN
	IF NEW.status = 'sold' AND OLD.status != 'sold' THEN
		UPDATE box_template 
		SET usage_count = usage_count + 1,
			updated_at = CURRENT_TIMESTAMP
		WHERE id = NEW.box_template_id;
	END IF;
	RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_increment_template_usage
	AFTER UPDATE ON surprise_box
	FOR EACH ROW
	EXECUTE FUNCTION increment_template_usage();

-- Функция для автоматического обновления updated_at  ====DONE====
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
	NEW.updated_at = CURRENT_TIMESTAMP;
	RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггеры для автоматического обновления updated_at в соответствующих таблицах
CREATE OR REPLACE TRIGGER trigger_update_business_updated_at
	BEFORE UPDATE ON business
	FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_store_updated_at 
    BEFORE UPDATE ON store 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_store_credential_updated_at 
    BEFORE UPDATE ON store_credential 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER trigger_update_box_template_updated_at
	BEFORE UPDATE ON box_template
	FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER trigger_update_surprise_box_updated_at
	BEFORE UPDATE ON surprise_box
	FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER trigger_update_payment_updated_at
	BEFORE UPDATE ON payment
	FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_review_updated_at 
    BEFORE UPDATE ON review 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ПОДКЛЮЧЕНИЕ pg_cron
--CREATE EXTENSION IF NOT EXISTS pg_cron;

--SELECT cron.schedule(
--  'cleanup_expired_reservations_every_3_min',
--  '*/3 * * * *',
--  $$SELECT cleanup_expired_reservations();$$
--);

--SELECT cron.schedule(
--  'expire_surprise_boxes_every_15_min',
--  '*/15 * * * *',
--  $$SELECT expire_surprise_boxes();$$
--);