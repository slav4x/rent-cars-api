CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    avatar_url TEXT,
    birth_date TEXT,
    auth_status TEXT NOT NULL DEFAULT 'inactive',
    role TEXT NOT NULL DEFAULT 'user',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    last_login_at TEXT,
    last_booking_at TEXT,
    last_activity_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

CREATE TABLE IF NOT EXISTS verification_requests (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    applicant_type TEXT NOT NULL DEFAULT 'citizen_rf',
    status TEXT NOT NULL DEFAULT 'draft',
    review_comment TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    submitted_at TEXT,
    reviewed_at TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_verification_requests_user_id
    ON verification_requests(user_id);

CREATE TABLE IF NOT EXISTS verification_files (
    id TEXT PRIMARY KEY,
    verification_request_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    type TEXT NOT NULL,
    file_url TEXT NOT NULL,
    original_name TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    size_bytes INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (verification_request_id) REFERENCES verification_requests(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_verification_files_request_id
    ON verification_files(verification_request_id);

CREATE TABLE IF NOT EXISTS user_favorites (
    user_id TEXT NOT NULL,
    car_id TEXT NOT NULL,
    created_at TEXT NOT NULL,
    PRIMARY KEY (user_id, car_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (car_id) REFERENCES cars(id)
);

CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id
    ON user_favorites(user_id);

CREATE TABLE IF NOT EXISTS car_categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0
);

INSERT INTO car_categories (id, name, sort_order) VALUES
    ('economy', 'Эконом', 1),
    ('comfort', 'Комфорт', 2),
    ('comfort_plus', 'Комфорт +', 3),
    ('business', 'Бизнес', 4),
    ('premium', 'Премиум', 5),
    ('suv', 'Внедорожники', 6),
    ('convertible', 'Кабриолеты', 7),
    ('sport', 'Спортивные', 8),
    ('muscle', 'Маслкары', 9),
    ('electric', 'Электро', 10),
    ('minivan', 'Минивэны', 11)
ON CONFLICT(id) DO UPDATE SET
    name = excluded.name,
    sort_order = excluded.sort_order;

CREATE TABLE IF NOT EXISTS car_cities (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0
);

INSERT INTO car_cities (id, name, sort_order) VALUES
    ('saint-petersburg', 'Санкт-Петербург', 1),
    ('moscow', 'Москва', 2),
    ('sochi', 'Сочи', 3),
    ('murmansk', 'Мурманск', 4)
ON CONFLICT(id) DO UPDATE SET
    name = excluded.name,
    sort_order = excluded.sort_order;

CREATE TABLE IF NOT EXISTS car_brands (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0
);

INSERT INTO car_brands (id, name, sort_order) VALUES
    ('opel', 'Opel', 1),
    ('mini', 'Mini', 2),
    ('ram', 'Ram', 3),
    ('skoda', 'Skoda', 4),
    ('lexus', 'Lexus', 5),
    ('chevrolet', 'Chevrolet', 6),
    ('land-rover', 'Land Rover', 7),
    ('toyota', 'Toyota', 8),
    ('lixiang', 'Lixiang', 9),
    ('ford', 'Ford', 10),
    ('bmw', 'BMW', 11),
    ('dodge', 'Dodge', 12),
    ('kia', 'Kia', 13),
    ('chery', 'Chery', 14),
    ('hyundai', 'Hyundai', 15),
    ('mercedes', 'Mercedes', 16),
    ('volkswagen', 'Volkswagen', 17),
    ('geely', 'Geely', 18),
    ('porsche', 'Porsche', 19),
    ('audi', 'Audi', 20),
    ('haval', 'Haval', 21),
    ('lada', 'Lada', 22),
    ('tesla', 'Tesla', 23),
    ('zeekr', 'Zeekr', 24),
    ('smart', 'Smart', 25),
    ('tank', 'Tank', 26),
    ('omoda', 'Omoda', 27)
ON CONFLICT(id) DO UPDATE SET
    name = excluded.name,
    sort_order = excluded.sort_order;

CREATE TABLE IF NOT EXISTS car_colors (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0
);

INSERT INTO car_colors (id, name, sort_order) VALUES
    ('black', 'Черный', 1),
    ('white', 'Белый', 2),
    ('gray', 'Серый', 3),
    ('blue', 'Синий', 4),
    ('red', 'Красный', 5)
ON CONFLICT(id) DO UPDATE SET
    name = excluded.name,
    sort_order = excluded.sort_order;

CREATE TABLE IF NOT EXISTS cars (
    id TEXT PRIMARY KEY,
    public_slug TEXT NOT NULL UNIQUE,
    rentprog_id TEXT,
    title TEXT NOT NULL,
    category_id TEXT NOT NULL,
    city_id TEXT NOT NULL,
    brand_id TEXT NOT NULL,
    color_id TEXT NOT NULL,
    video_url TEXT,
    horsepower INTEGER,
    zero_to_hundred REAL,
    fuel_type TEXT NOT NULL,
    transmission_type TEXT NOT NULL,
    description_html TEXT NOT NULL DEFAULT '<p></p>',
    price_per_day INTEGER NOT NULL DEFAULT 0,
    price_2_7_days INTEGER NOT NULL DEFAULT 0,
    price_from_7_days INTEGER NOT NULL DEFAULT 0,
    price_from_30_days INTEGER NOT NULL DEFAULT 0,
    price_from_60_days INTEGER NOT NULL DEFAULT 0,
    overage_price_per_km INTEGER NOT NULL DEFAULT 0,
    seo_title TEXT,
    seo_description_html TEXT NOT NULL DEFAULT '<p></p>',
    media_urls TEXT NOT NULL DEFAULT '[]',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (category_id) REFERENCES car_categories(id),
    FOREIGN KEY (city_id) REFERENCES car_cities(id),
    FOREIGN KEY (brand_id) REFERENCES car_brands(id),
    FOREIGN KEY (color_id) REFERENCES car_colors(id)
);

CREATE INDEX IF NOT EXISTS idx_cars_public_slug
    ON cars(public_slug);

CREATE INDEX IF NOT EXISTS idx_cars_city_id
    ON cars(city_id);
