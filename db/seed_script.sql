-- 🔄 Очистка таблиць
DELETE FROM store;
DELETE FROM business;

-- 🏢 Додавання бізнесів
INSERT INTO business (business_name, business_type, description, website_url, logo_url, registration_number, legal_address)
VALUES 
('КАФЕ РИНОК', 'chain', 'Мережа кавʼярень у центрі Львова.', 'https://caferynok.ua', 'https://img.com/rynok_logo.png', 'UA12345678', 'вул. Площа Ринок, 1, Львів'),
('CoffeLab', 'chain', 'Інноваційна лабораторія кави у Львові.', 'https://coffeelab.ua', 'https://img.com/coffeelab_logo.png', 'UA87654321', 'вул. Галицька, 10, Львів'),
('Сімейна пекарня', 'multi_chain', 'Свіжа випічка з сімейними традиціями.', 'https://familybakery.ua', 'https://img.com/bakery_logo.png', 'UA99887766', 'вул. Зелена, 50, Львів');

-- 📍 Додавання закладів
WITH businesses AS (
    SELECT id, business_name FROM business
)
INSERT INTO store (id, business_id, address, city, location, description, store_image_url, box_image_url, opening_hours)
VALUES 
-- КАФЕ РИНОК
(1, (SELECT id FROM businesses WHERE business_name = 'КАФЕ РИНОК'), 'пл. Ринок, 12', 'Львів', ST_SetSRID(ST_MakePoint(24.0316, 49.8417), 4326), 'Кавʼярня з видом на площу', 'https://img.com/rynok12.png', 'https://img.com/rynok12_box.png', '{"mon-fri":"08:00-20:00","sat-sun":"09:00-21:00"}'),
(2, (SELECT id FROM businesses WHERE business_name = 'КАФЕ РИНОК'), 'вул. Валова, 15', 'Львів', ST_SetSRID(ST_MakePoint(24.0305, 49.8399), 4326), 'Місце для кави поруч з музеєм', 'https://img.com/valova15.png', 'https://img.com/valova15_box.png', '{"daily":"09:00-19:00"}'),
(3, (SELECT id FROM businesses WHERE business_name = 'КАФЕ РИНОК'), 'вул. Січових Стрільців, 8', 'Львів', ST_SetSRID(ST_MakePoint(24.0268, 49.8423), 4326), 'Атмосферне місце з вінтажним інтерʼєром', 'https://img.com/sichovi8.png', 'https://img.com/sichovi8_box.png', '{"mon-sat":"07:30-22:00"}'),
(4, (SELECT id FROM businesses WHERE business_name = 'CoffeLab'), 'вул. Ференца Ліста, 4', 'Львів', ST_SetSRID(ST_MakePoint(24.0274, 49.8443), 4326), 'Місце для кавових експериментів', 'https://img.com/lista4.png', 'https://img.com/lista4_box.png', '{"mon-fri":"08:00-18:00","sat":"09:00-14:00"}'),
(5, (SELECT id FROM businesses WHERE business_name = 'CoffeLab'), 'вул. Генерала Чупринки, 40', 'Львів', ST_SetSRID(ST_MakePoint(24.0057, 49.8389), 4326), 'Модерна кавʼярня для студентів', 'https://img.com/chuprynka40.png', 'https://img.com/chuprynka40_box.png', '{"daily":"08:00-20:00"}'),
(6, (SELECT id FROM businesses WHERE business_name = 'CoffeLab'), 'вул. Коперника, 21', 'Львів', ST_SetSRID(ST_MakePoint(24.0270, 49.8394), 4326), 'Заклад зі specialty кавою та мінімалізмом', 'https://img.com/kopernyka21.png', 'https://img.com/kopernyka21_box.png', '{"daily":"10:00-22:00"}'),
(7, (SELECT id FROM businesses WHERE business_name = 'Сімейна пекарня'), 'вул. Зелена, 109', 'Львів', ST_SetSRID(ST_MakePoint(24.0482, 49.8188), 4326), 'Сімейна пекарня з домашнім хлібом', 'https://img.com/zelena109.png', 'https://img.com/zelena109_box.png', '{"mon-sun":"07:00-19:00"}'),
(8, (SELECT id FROM businesses WHERE business_name = 'Сімейна пекарня'), 'вул. Пасічна, 71', 'Львів', ST_SetSRID(ST_MakePoint(24.0635, 49.8155), 4326), 'Затишне місце з ароматною випічкою', 'https://img.com/pasachna71.png', 'https://img.com/pasachna71_box.png', '{"daily":"08:00-20:00"}'),
(9, (SELECT id FROM businesses WHERE business_name = 'Сімейна пекарня'), 'вул. Наукова, 35', 'Львів', ST_SetSRID(ST_MakePoint(24.0129, 49.8079), 4326), 'Магазин хлібних традицій', 'https://img.com/naukova35.png', 'https://img.com/naukova35_box.png', '{"mon-sat":"06:30-18:30"}')
ON CONFLICT (id) DO NOTHING;

-- DELETE FROM category ;
INSERT INTO category (id, name, description, icon_url)
VALUES 
(1, 'Випічка', 'Свіжа хрустка випічка: хліб, круасани, булочки', 'https://img.example.com/icons/bakery.png'),
(2, 'Солодощі', 'Тістечка, торти, бісквіти, десерти до кави', 'https://img.example.com/icons/sweets.png'),
(3, 'Солона випічка', 'Кіш, піца, слойки з сиром, лаваші та сендвічі', 'https://img.example.com/icons/savory.png'),
(4, 'Сніданки', 'Готові сніданки: вівсянка, яйця, тости, йогурт', 'https://img.example.com/icons/breakfast.png'),
(5, 'Вегетаріанські страви', 'Безмʼясні готові страви: салати, випічка', 'https://img.example.com/icons/veggie.png'),
(6, 'Комбо-набори', 'Набори з декількох позицій для швидкого перекусу', 'https://img.example.com/icons/combo.png')
ON CONFLICT (id) DO NOTHING;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- КАФЕ РИНОК (store_id = 1)
INSERT INTO store_credential (id, store_id, employee_role, credentials, hash_credentials)
VALUES
(1, 1, 'staff', 'staff123', crypt('staff123', gen_salt('bf'))),
(2, 1, 'manager', 'admin123', crypt('admin123', gen_salt('bf')))
ON CONFLICT (id) DO NOTHING;

-- CoffeLab (store_id = 2)
INSERT INTO store_credential (id, store_id, employee_role, credentials, hash_credentials)
VALUES
(3, 2, 'staff', 'coffeestaff', crypt('coffeestaff', gen_salt('bf'))),
(4, 2, 'manager', 'coffeemanager', crypt('coffeemanager', gen_salt('bf')))
ON CONFLICT (id) DO NOTHING;

-- Сімейна пекарня (store_id = 3)
INSERT INTO store_credential (id, store_id, employee_role, credentials, hash_credentials)
VALUES
(5, 3, 'staff', 'piekarstaff', crypt('piekarstaff', gen_salt('bf'))),
(6, 3, 'manager', 'piekarmanager', crypt('piekarmanager', gen_salt('bf')))
ON CONFLICT (id) DO NOTHING;


INSERT INTO box_template 
(id, store_id, category_id, template_name, description, original_price, discounted_price, image_url, pickup_start_time, pickup_end_time, sale_start_time, sale_end_time)
VALUES (1, 1, 1, 'Смачна випічка від КАФЕ РИНОК', 
 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
 20000, 12000, 'https://img.com/box1.png', '2025-06-19 18:00:00', '2025-06-19 19:00:00', '2025-06-19 08:00:00', '2025-06-19 19:00:00'),
(2, 1, 2, 'Солодощі від КАФЕ РИНОК', 
 'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
 25000, 15000, 'https://img.com/box2.png', '2025-06-19 18:30:00', '2025-06-19 20:00:00', '2025-06-19 08:00:00', '2025-06-19 20:00:00'),
(3, 1, 3, 'Солона випічка від КАФЕ РИНОК', 
 'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
 30000, 18000, NULL, '2025-06-19 19:00:00', '2025-06-19 20:00:00', '2025-06-19 08:00:00', '2025-06-19 20:30:00'),
(4, 1, 4, 'Набір сніданків від КАФЕ РИНОК', 
 'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
 35000, 21000, 'https://img.com/box4.png', '2025-06-19 20:00:00', '2025-06-19 21:00:00', '2025-06-19 08:00:00', '2025-06-19 21:00:00'),
(5, 1, 6, 'Комбо-набір від КАФЕ РИНОК', 
 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla vitae elit libero, a pharetra augue.',
 40000, 24000, 'https://img.com/box5.png', '2025-06-19 19:30:00', '2025-06-19 21:00:00', '2025-06-19 08:00:00', '2025-06-19 21:30:00'),
(6, 2, 2, 'Солодощі від КАФЕ РИНОК', 
 'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium.',
 22000, 13300, 'https://img.com/box6.png', '2025-06-19 18:15:00', '2025-06-19 19:15:00', '2025-06-19 08:00:00', '2025-06-19 19:15:00'),
(7, 2, 5, 'Вегетаріанські страви від КАФЕ РИНОК', 
 'Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit.',
 28000, 16800, 'https://img.com/box7.png', '2025-06-19 18:45:00', '2025-06-19 20:15:00', '2025-06-19 08:00:00', '2025-06-19 20:15:00'),
(8, 2, 3, 'Солона випічка від КАФЕ РИНОК', 
 'Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit.',
 32000, 19200, 'https://img.com/box8.png', '2025-06-19 19:30:00', '2025-06-19 20:30:00', '2025-06-19 08:00:00', '2025-06-19 21:00:00'),
(9, 2, 1, 'Випічка від КАФЕ РИНОК', 
 'Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam.',
 26000, 15600, NULL, '2025-06-19 19:00:00', '2025-06-19 20:00:00', '2025-06-19 08:00:00', '2025-06-19 20:00:00'),
(10, 2, 4, 'Сніданки від КАФЕ РИНОК', 
 'Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur.',
 30000, 18000, 'https://img.com/box10.png', '2025-06-19 20:00:00', '2025-06-19 21:00:00', '2025-06-19 08:00:00', '2025-06-19 21:15:00'),
(11, 3, 6, 'Комбо-набір від КАФЕ РИНОК', 
 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus sagittis lacus vel augue laoreet rutrum faucibus dolor auctor.',
 35000, 17500, 'https://img.com/box11.png', '2025-06-19 18:30:00', '2025-06-19 19:30:00', '2025-06-19 08:00:00', '2025-06-19 19:30:00'),
(12, 3, 1, 'Випічка від КАФЕ РИНОК', 
 'Curabitur blandit tempus porttitor. Morbi leo risus, porta ac consectetur ac, vestibulum at eros.',
 18000, 12600, 'https://img.com/box12.png', '2025-06-19 19:00:00', '2025-06-19 20:00:00', '2025-06-19 08:00:00', '2025-06-19 20:00:00'),
(13, 3, 4, 'Набір сніданків від КАФЕ РИНОК', 
 'Aenean lacinia bibendum nulla sed consectetur. Donec sed odio dui. Nulla vitae elit libero, a pharetra augue.',
 30000, 18000, NULL, '2025-06-19 18:00:00', '2025-06-19 19:00:00', '2025-06-19 08:00:00', '2025-06-19 19:00:00'),
(14, 3, 3, 'Солона випічка від КАФЕ РИНОК', 
 'Integer posuere erat a ante venenatis dapibus posuere velit aliquet. Vivamus sagittis lacus vel augue laoreet rutrum.',
 31000, 18600, NULL, '2025-06-19 19:15:00', '2025-06-19 20:15:00', '2025-06-19 08:00:00', '2025-06-19 20:15:00'),
(15, 3, 2, 'Солодощі від КАФЕ РИНОК', 
 'Maecenas faucibus mollis interdum. Sed posuere consectetur est at lobortis. Morbi leo risus, porta ac consectetur ac.',
 27000, 13500, 'https://img.com/box15.png', '2025-06-19 20:00:00', '2025-06-19 21:00:00', '2025-06-19 08:00:00', '2025-06-19 21:00:00'),
(16, 4, 4, 'Сніданки від CoffeLab', 
 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed posuere consectetur est at lobortis.',
 24000, 14400, 'https://img.com/box16.png', '2025-06-19 18:30:00', '2025-06-19 19:30:00', '2025-06-19 08:00:00', '2025-06-19 19:00:00'),
(17, 4, 2, 'Солодощі від CoffeLab', 
 'Donec ullamcorper nulla non metus auctor fringilla. Vestibulum id ligula porta felis euismod semper.',
 26000, 13000, 'https://img.com/box17.png', '2025-06-19 19:00:00', '2025-06-19 20:00:00', '2025-06-19 08:00:00', '2025-06-19 20:00:00'),
(18, 4, 5, 'Вегетаріанські страви від CoffeLab', 
 'Nullam id dolor id nibh ultricies vehicula ut id elit. Cras mattis consectetur purus sit amet fermentum.',
 28000, 14000, 'https://img.com/box18.png', '2025-06-19 19:15:00', '2025-06-19 20:15:00', '2025-06-19 08:00:00', '2025-06-19 20:15:00'),
(19, 4, 6, 'Комбо-набір від CoffeLab', 
 'Curabitur blandit tempus porttitor. Praesent commodo cursus magna, vel scelerisque nisl consectetur et.',
 32000, 16000, NULL, '2025-06-19 20:00:00', '2025-06-19 21:00:00', '2025-06-19 08:00:00', '2025-06-19 21:00:00'),
(20, 4, 1, 'Випічка від CoffeLab', 
 'Morbi leo risus, porta ac consectetur ac, vestibulum at eros. Sed posuere consectetur est at lobortis.',
 22000, 11000, 'https://img.com/box20.png', '2025-06-19 18:00:00', '2025-06-19 19:00:00', '2025-06-19 08:00:00', '2025-06-19 19:30:00'),
(21, 5, 3, 'Солона випічка від CoffeLab', 
 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce dapibus, tellus ac cursus commodo.',
 28000, 14000, 'https://img.com/box21.png', '2025-06-19 18:45:00', '2025-06-19 19:45:00', '2025-06-19 08:00:00', '2025-06-19 19:45:00'),
(22, 5, 4, 'Сніданки від CoffeLab', 
 'Etiam porta sem malesuada magna mollis euismod. Nullam id dolor id nibh ultricies vehicula.',
 30000, 15000, NULL, '2025-06-19 19:00:00', '2025-06-19 20:00:00', '2025-06-19 08:00:00', '2025-06-19 20:00:00'),
(23, 5, 2, 'Солодощі від CoffeLab', 
 'Aenean eu leo quam. Pellentesque ornare sem lacinia quam venenatis vestibulum.',
 26000, 13000, 'https://img.com/box23.png', '2025-06-19 18:30:00', '2025-06-19 19:30:00', '2025-06-19 08:00:00', '2025-06-19 19:30:00'),
(24, 5, 5, 'Вегетаріанські страви від CoffeLab', 
 'Vivamus sagittis lacus vel augue laoreet rutrum faucibus dolor auctor. Vestibulum ante ipsum primis in faucibus.',
 32000, 16000, 'https://img.com/box24.png', '2025-06-19 19:15:00', '2025-06-19 20:15:00', '2025-06-19 08:00:00', '2025-06-19 20:30:00'),
(25, 5, 1, 'Випічка від CoffeLab', 
 'Donec sed odio dui. Cras justo odio, dapibus ac facilisis in, egestas eget quam.',
 24000, 12000, 'https://img.com/box25.png', '2025-06-19 20:00:00', '2025-06-19 21:00:00', '2025-06-19 08:00:00', '2025-06-19 21:00:00'),
(26, 6, 6, 'Комбо-набір від CoffeLab', 
 'Nullam quis risus eget urna mollis ornare vel eu leo. Integer posuere erat a ante venenatis dapibus.',
 30000, 15000, NULL, '2025-06-19 18:15:00', '2025-06-19 19:15:00', '2025-06-19 08:00:00', '2025-06-19 19:15:00'),
(27, 6, 1, 'Випічка від CoffeLab', 
 'Maecenas sed diam eget risus varius blandit sit amet non magna. Fusce dapibus.',
 27000, 13500, 'https://img.com/box27.png', '2025-06-19 18:45:00', '2025-06-19 19:45:00', '2025-06-19 08:00:00', '2025-06-19 19:45:00'),
(28, 6, 3, 'Солона випічка від CoffeLab', 
 'Curabitur blandit tempus porttitor. Cras mattis consectetur purus sit amet fermentum.',
 31000, 15500, NULL, '2025-06-19 19:30:00', '2025-06-19 20:00:00', '2025-06-19 08:00:00', '2025-06-19 20:00:00'),
(29, 6, 2, 'Солодощі від CoffeLab', 
 'Praesent commodo cursus magna, vel scelerisque nisl consectetur et. Nulla vitae elit libero.',
 28000, 14000, 'https://img.com/box29.png', '2025-06-19 19:00:00', '2025-06-19 20:00:00', '2025-06-19 08:00:00', '2025-06-19 20:15:00'),
(30, 6, 5, 'Вегетаріанські страви від CoffeLab', 
 'Vivamus sagittis lacus vel augue laoreet rutrum faucibus dolor auctor. Sed posuere consectetur est.',
 32000, 16000, 'https://img.com/box30.png', '2025-06-19 20:00:00', '2025-06-19 21:00:00', '2025-06-19 08:00:00', '2025-06-19 21:15:00'),
(31, 7, 1, 'Смачна випічка від Сімейна пекарня', 
 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce dapibus turpis in lectus tincidunt, sed sodales nunc finibus.',
 25000, 12500, NULL, '2025-06-19 18:30:00', '2025-06-19 19:30:00', '2025-06-19 08:00:00', '2025-06-19 19:00:00'),
(32, 7, 3, 'Солона випічка від Сімейна пекарня', 
 'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque rem aperiam.',
 28000, 14000, 'https://img.com/box32.png', '2025-06-19 19:00:00', '2025-06-19 20:00:00', '2025-06-19 08:00:00', '2025-06-19 20:00:00'),
(33, 7, 2, 'Солодощі від Сімейна пекарня', 
 'At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque.',
 23000, 11500, NULL, '2025-06-19 18:00:00', '2025-06-19 19:00:00', '2025-06-19 08:00:00', '2025-06-19 19:00:00'),
(34, 7, 4, 'Сніданки від Сімейна пекарня', 
 'Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur.',
 26000, 13000, NULL, '2025-06-19 19:15:00', '2025-06-19 20:15:00', '2025-06-19 08:00:00', '2025-06-19 20:15:00'),
(35, 7, 6, 'Комбо-набір від Сімейна пекарня', 
 'Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil impedit quo minus id quod maxime placeat facere.',
 30000, 15000, 'https://img.com/box35.png', '2025-06-19 20:00:00', '2025-06-19 21:00:00', '2025-06-19 08:00:00', '2025-06-19 21:30:00'),
(36, 8, 2, 'Солодощі від Сімейна пекарня', 
 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec ullamcorper nulla non metus auctor fringilla.',
 27000, 13500, 'https://img.com/box36.png', '2025-06-19 18:45:00', '2025-06-19 19:45:00', '2025-06-19 08:00:00', '2025-06-19 19:45:00'),
(37, 8, 5, 'Вегетаріанські страви від Сімейна пекарня', 
 'Curabitur blandit tempus porttitor. Sed posuere consectetur est at lobortis.',
 29000, 14500, 'https://img.com/box37.png', '2025-06-19 19:15:00', '2025-06-19 20:15:00', '2025-06-19 08:00:00', '2025-06-19 20:30:00'),
(38, 8, 1, 'Випічка від Сімейна пекарня', 
 'Integer posuere erat a ante venenatis dapibus posuere velit aliquet.',
 26000, 13000, NULL, '2025-06-19 18:30:00', '2025-06-19 19:30:00', '2025-06-19 08:00:00', '2025-06-19 19:30:00'),
(39, 8, 3, 'Солона випічка від Сімейна пекарня', 
 'Vestibulum id ligula porta felis euismod semper. Sed posuere consectetur est at lobortis.',
 28000, 14000, 'https://img.com/box39.png', '2025-06-19 19:00:00', '2025-06-19 20:00:00', '2025-06-19 08:00:00', '2025-06-19 20:15:00'),
(40, 8, 4, 'Сніданки від Сімейна пекарня', 
 'Maecenas sed diam eget risus varius blandit sit amet non magna.',
 30000, 15000, 'https://img.com/box40.png', '2025-06-19 20:00:00', '2025-06-19 21:00:00', '2025-06-19 08:00:00', '2025-06-19 21:00:00'),
(41, 9, 6, 'Комбо-набір від Сімейна пекарня', 
 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus sagittis lacus vel augue laoreet rutrum faucibus dolor auctor.',
 32000, 16000, NULL, '2025-06-19 18:15:00', '2025-06-19 19:15:00', '2025-06-19 08:00:00', '2025-06-19 19:15:00'),
(42, 9, 2, 'Солодощі від Сімейна пекарня', 
 'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium.',
 28000, 14000, 'https://img.com/box42.png', '2025-06-19 18:45:00', '2025-06-19 19:45:00', '2025-06-19 08:00:00', '2025-06-19 19:45:00'),
(43, 9, 5, 'Вегетаріанські страви від Сімейна пекарня', 
 'Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam.',
 30000, 15000, NULL, '2025-06-19 19:30:00', '2025-06-19 20:30:00', '2025-06-19 08:00:00', '2025-06-19 20:30:00'),
(44, 9, 1, 'Випічка від Сімейна пекарня', 
 'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
 26000, 13000, 'https://img.com/box44.png', '2025-06-19 20:00:00', '2025-06-19 21:00:00', '2025-06-19 08:00:00', '2025-06-19 21:00:00'),
(45, 9, 4, 'Сніданки від Сімейна пекарня', 
 'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
 31000, 15500, 'https://img.com/box45.png', '2025-06-19 20:15:00', '2025-06-19 21:15:00', '2025-06-19 08:00:00', '2025-06-19 21:15:00')
ON CONFLICT (id) DO NOTHING;



-- 🔁 Створення surprise box'ів із шаблонів
-- ⚠️ Працює лише якщо всі шаблони з id від 1 до 45 існують

-- PostgreSQL-специфічне використання random() для рандомного значення в межах 1-5
DO $$
DECLARE
    i INTEGER := 1;
    random_count INTEGER;
BEGIN
    WHILE i <= 45 LOOP
        random_count := floor(random() * 5 + 1); -- Випадкове число від 1 до 5
        PERFORM create_surprise_box_from_template(i, random_count);
        i := i + 1;
    END LOOP;
END $$;

