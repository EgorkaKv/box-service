-- Создание расширения PostGIS для работы с геолокацией
CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TYPE CUSTOMER_GENDER AS ENUM ('male', 'female', 'other');

-- Таблица покупателей
CREATE TABLE IF NOT EXISTS customer (
	id BIGSERIAL PRIMARY KEY,
	firebase_uid TEXT UNIQUE,
	email TEXT UNIQUE,
	customer_name TEXT NOT NULL,
	phone TEXT UNIQUE,
	-- gender ('male', 'female', 'other')
	gender CUSTOMER_GENDER,
	profile_image_url TEXT,
	registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	last_login TIMESTAMP,
	push_notifications_enabled BOOLEAN DEFAULT TRUE,
	email_notifications_enabled BOOLEAN DEFAULT TRUE
);

create type BUSINESS_TYPE as ENUM('chain', 'single', 'multi_chain');

-- Таблица бизнеса/сети
CREATE TABLE IF NOT EXISTS business (
	id BIGSERIAL PRIMARY KEY,
	business_name TEXT NOT NULL,
	business_type BUSINESS_TYPE NOT NULL,
	description TEXT,
	website_url TEXT,
	logo_url TEXT,
	registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	last_login TIMESTAMP,
	registration_number TEXT,
	legal_address TEXT,
	updated_at TIMESTAMP
);

-- Таблица торговых точек
CREATE TABLE IF NOT EXISTS store (
	id BIGSERIAL PRIMARY KEY,
	business_id BIGINT NOT NULL REFERENCES business(id) ON DELETE CASCADE,
	address TEXT NOT NULL,
	city TEXT NOT NULL,
	location GEOMETRY(POINT, 4326) NOT NULL,
	description TEXT,
	store_image_url TEXT,
	box_image_url TEXT,
	opening_hours JSONB,
	is_active BOOLEAN DEFAULT TRUE,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TYPE EMPLOYEE_ROLE AS ENUM ('staff', 'manager');

-- Таблица учетных данных сотрудников магазинов
CREATE TABLE IF NOT EXISTS store_credential (
	id BIGSERIAL PRIMARY KEY,
	store_id BIGINT NOT NULL REFERENCES store(id) ON DELETE CASCADE,
	  -- ('staff', 'manager')
	employee_role EMPLOYEE_ROLE NOT null,
	login TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	last_login TIMESTAMP,
    login_attempts INTEGER DEFAULT 0,
    last_failed_login TIMESTAMP,
	updated_at TIMESTAMP,
	UNIQUE(store_id, employee_role)
);

-- Таблица категорий
CREATE TABLE IF NOT EXISTS category (
	id SERIAL PRIMARY KEY,
	name TEXT NOT NULL,
	description TEXT,
	icon_url TEXT,
	is_active BOOLEAN DEFAULT TRUE,
	sort_order INTEGER DEFAULT 0
);

-- 1. СОЗДАНИЕ ТАБЛИЦЫ ШАБЛОНОВ
CREATE TABLE IF NOT EXISTS box_template (
	id BIGSERIAL PRIMARY KEY,
	store_id BIGINT NOT NULL REFERENCES store(id) ON DELETE CASCADE,
	category_id BIGINT NOT NULL REFERENCES category(id) ON DELETE RESTRICT,
	template_name TEXT NOT NULL,
	description TEXT,
	-- prices are in intenger *100 format
	original_price INT NOT NULL,
	discounted_price INT NOT NULL,
	image_url TEXT,
	pickup_start_time TIMESTAMP NOT NULL,
	pickup_end_time TIMESTAMP NOT NULL,
	sale_start_time TIMESTAMP NOT NULL,
	sale_end_time TIMESTAMP NOT NULL,
	usage_count INTEGER DEFAULT 0,
	is_active BOOLEAN DEFAULT TRUE,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TYPE BOX_STATUS AS ENUM('draft', 'active', 'reserved', 'sold', 'expired', 'cancelled');

-- 3. СОЗДАНИЕ ДЕНОРМАЛИЗОВАННОЙ ТАБЛИЦЫ SURPRISE_BOX
CREATE TABLE IF NOT EXISTS surprise_box (
	id BIGSERIAL PRIMARY KEY,
	-- Связи
	box_template_id BIGINT NOT NULL REFERENCES box_template(id) ON DELETE CASCADE,
	store_id BIGINT NOT NULL REFERENCES store(id) ON DELETE CASCADE,
	category_id BIGINT NOT NULL REFERENCES category(id) ON DELETE RESTRICT,
	
	-- Денормализованные данные магазина (для быстрого поиска)
	business_name TEXT NOT NULL,
	store_address TEXT NOT NULL,
	store_city TEXT NOT NULL,
	store_location GEOMETRY(POINT, 4326) NOT NULL,
	
	-- Данные из шаблона (могут быть переопределены)
	title TEXT NOT NULL,
	description TEXT,
	category_name TEXT,
	-- prices are in intenger *100 format
	original_price INT NOT NULL,
	discounted_price INT NOT NULL,
	image_url TEXT,
	
	-- Временные ограничения
	pickup_start_time TIMESTAMP NOT NULL,
	pickup_end_time TIMESTAMP NOT NULL,
	sale_start_time TIMESTAMP NOT NULL,
	sale_end_time TIMESTAMP NOT NULL,
	
	-- Статус и резервация (quantity всегда = 1)
	status BOX_STATUS DEFAULT 'draft',
	reserved_by BIGINT REFERENCES customer(id) ON DELETE SET NULL,
	reserved_at TIMESTAMP,
	reservation_expires_at TIMESTAMP,
	
	-- Метаданные
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TYPE ORDER_STATUS AS ENUM('pending', 'paid', 'ready_for_pickup', 'in_delivery', 'completed', 'cancelled', 'refunded');
CREATE TYPE FULFILLMENT_TYPE AS ENUM('pickup', 'delivery');
CREATE TYPE CANCELLER_TYPE AS ENUM('customer', 'store');
CREATE TYPE PAYMENT_TYPE AS ENUM('app', 'cash');

-- Таблица заказов
CREATE TABLE IF NOT EXISTS orders (
	id BIGSERIAL PRIMARY KEY,
	customer_id BIGINT NOT NULL REFERENCES customer(id) ON DELETE CASCADE,
	surprise_box_id BIGINT NOT NULL REFERENCES surprise_box(id) ON DELETE RESTRICT,
	store_id BIGINT NOT NULL REFERENCES store(id) ON DELETE RESTRICT,
	-- ('pending', 'paid', 'ready_for_pickup', 'in_delivery', 'completed', 'cancelled', 'refunded');
	status ORDER_STATUS DEFAULT 'pending',
	-- ('app', 'cash');
	payment_type PAYMENT_TYPE NOT NULL,
	-- ('pickup', 'delivery');
	fulfillment_type FULFILLMENT_TYPE NOT NULL,
	pickup_code TEXT UNIQUE NOT NULL,
	order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	pickuped_at TIMESTAMP,
	-- ('customer', 'store');
	cancelled_by CANCELLER_TYPE,
	cancelled_at TIMESTAMP,
	refund_amount INT DEFAULT 0,
);

CREATE TYPE PAYMENT_STATUS AS ENUM('pending', 'completed', 'failed', 'refunded', 'partially_refunded');
create type PAYMENT_METHOD as ENUM('card', 'digital_wallet', 'cash', 'app');

-- Таблица платежей
CREATE TABLE IF NOT EXISTS payment (
	id BIGSERIAL PRIMARY KEY,
	order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
	payment_method PAYMENT_METHOD NOT null,
	amount INT NOT NULL,
	currency TEXT DEFAULT 'UAH',
	-- ('pending', 'completed', 'failed', 'refunded', 'partially_refunded');
	payment_status PAYMENT_STATUS DEFAULT 'pending',
	transaction_id TEXT,
	payment_gateway TEXT,
	payment_date TIMESTAMP NOT NULL,
	refund_date TIMESTAMP,
	refund_amount INT DEFAULT 0,
	updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS delivery (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending_assignment' CHECK(status in ('pending_assignment', 'assigned', 'in_transit', 'delivered', 'failed', 'returned')),
    delivery_service TEXT NOT NULL,
    delivery_address TEXT NOT NULL,
    estimated_delivery_at TIMESTAMP,
    delivered_at TIMESTAMP,
    courier_name TEXT,
    courier_phone TEXT,
    tracking_code TEXT,
    delivery_fee INT DEFAULT 0,
    delivery_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TYPE REPORT_STATUS AS ENUM('pending', 'in_review', 'resolved', 'rejected');
CREATE TYPE REPORT_PRIORITY AS ENUM('low', 'medium', 'high', 'urgent');

-- Таблица жалоб пользователей
CREATE TABLE IF NOT EXISTS customer_report (
	id BIGSERIAL PRIMARY KEY,
	customer_id BIGINT NOT NULL REFERENCES customer(id) ON DELETE CASCADE,
	store_id BIGINT NOT NULL REFERENCES store(id) ON DELETE CASCADE,
	order_id BIGINT REFERENCES orders(id) ON DELETE SET NULL,
	report_type TEXT NOT NULL CHECK (report_type IN ('service_quality', 'food_quality', 'pickup_issue', 'delivery_issue', 'app_bug', 'other')),
	subject TEXT NOT NULL,
	description TEXT NOT NULL,
	-- ('pending', 'in_review', 'resolved', 'rejected')
	status REPORT_STATUS DEFAULT 'pending',
	-- ('low', 'medium', 'high', 'urgent')
	priority REPORT_PRIORITY DEFAULT 'medium',
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	resolved_at TIMESTAMP,
	admin_response TEXT
);

-- Таблица отзывов
CREATE TABLE IF NOT EXISTS review (
	id BIGSERIAL PRIMARY KEY, 
	order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
	rating SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
	review_comment TEXT,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	is_approved BOOLEAN DEFAULT TRUE
);

-- Индекс для box_template
CREATE INDEX idx_box_template_store_active 
ON box_template(store_id, is_active) 
WHERE is_active = TRUE;

-- Основной индекс для геопоиска активных боксов
CREATE INDEX idx_surprise_box_geo_active ON surprise_box 
USING GIST (store_location) 
WHERE status IN ('active');

CREATE INDEX idx_surprise_box_city_status ON surprise_box 
(store_city, status) 
WHERE status IN ('active');

CREATE INDEX idx_surprise_box_store_id ON surprise_box (store_id, status);

-- Уникальный частичный индекс для предотвращения двойного резервирования
CREATE UNIQUE INDEX idx_surprise_box_reserved_by ON surprise_box (id, reserved_by) 
WHERE status = 'reserved' AND reserved_by IS NOT NULL;

create index idx_business_name on business(business_name);

CREATE INDEX idx_store_business_id ON store(business_id);
CREATE INDEX idx_store_city ON store(city);
create index idx_credentials on store_credential(credentials);
CREATE INDEX idx_store_location ON store USING GIST (location);

CREATE INDEX idx_order_customer_id ON orders(customer_id);
CREATE INDEX idx_order_store_id ON orders(store_id);
CREATE INDEX idx_order_status ON orders(status);
CREATE INDEX idx_order_date ON orders(order_date);
CREATE INDEX idx_payment_order_id ON payment(order_id);

CREATE INDEX idx_delivery_order_id on delivery(order_id);
CREATE INDEX idx_delivery_tracking_code on delivery(tracking_code);

CREATE INDEX idx_customer_report_customer_id on customer_report(customer_id);
CREATE INDEX idx_customer_report_order_id on customer_report(order_id);
CREATE INDEX idx_customer_report_store_id on customer_report(store_id);
CREATE INDEX idx_customer_report_status on customer_report(status);

CREATE INDEX idx_review_order_id on review(order_id);
CREATE INDEX idx_review_rating on review(rating);
