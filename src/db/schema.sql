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

CREATE TABLE IF NOT EXISTS auth_refresh_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    token_hash TEXT NOT NULL UNIQUE,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    revoked_at TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_auth_refresh_sessions_user_id
    ON auth_refresh_sessions(user_id);

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

CREATE TABLE IF NOT EXISTS car_categories (
    id TEXT PRIMARY KEY,
    slug TEXT UNIQUE,
    name TEXT NOT NULL,
    seo_title TEXT,
    seo_text TEXT NOT NULL DEFAULT '<p></p>',
    sort_order INTEGER NOT NULL DEFAULT 0
);

ALTER TABLE car_categories
    ADD COLUMN IF NOT EXISTS slug TEXT;

ALTER TABLE car_categories
    ADD COLUMN IF NOT EXISTS seo_title TEXT;

ALTER TABLE car_categories
    ADD COLUMN IF NOT EXISTS seo_text TEXT NOT NULL DEFAULT '<p></p>';

CREATE UNIQUE INDEX IF NOT EXISTS idx_car_categories_slug
    ON car_categories(slug)
    WHERE slug IS NOT NULL;

CREATE TABLE IF NOT EXISTS car_cities (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    subdomain TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0
);

ALTER TABLE car_cities
    ADD COLUMN IF NOT EXISTS subdomain TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_car_cities_subdomain
    ON car_cities(subdomain)
    WHERE subdomain IS NOT NULL;

CREATE TABLE IF NOT EXISTS car_brands (
    id TEXT PRIMARY KEY,
    slug TEXT UNIQUE,
    name TEXT NOT NULL,
    seo_title TEXT,
    seo_text TEXT NOT NULL DEFAULT '<p></p>',
    sort_order INTEGER NOT NULL DEFAULT 0
);

ALTER TABLE car_brands
    ADD COLUMN IF NOT EXISTS slug TEXT;

ALTER TABLE car_brands
    ADD COLUMN IF NOT EXISTS seo_title TEXT;

ALTER TABLE car_brands
    ADD COLUMN IF NOT EXISTS seo_text TEXT NOT NULL DEFAULT '<p></p>';

CREATE UNIQUE INDEX IF NOT EXISTS idx_car_brands_slug
    ON car_brands(slug)
    WHERE slug IS NOT NULL;

CREATE TABLE IF NOT EXISTS car_colors (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    hex TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0
);

ALTER TABLE car_colors
    ADD COLUMN IF NOT EXISTS hex TEXT;

CREATE TABLE IF NOT EXISTS car_body_types (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0
);

INSERT INTO car_body_types (id, name, sort_order) VALUES
    ('sedan', 'Седан', 1),
    ('coupe', 'Купе', 2),
    ('hatchback', 'Хэтчбек', 3),
    ('wagon', 'Универсал', 4),
    ('crossover', 'Кроссовер', 5),
    ('suv', 'Внедорожник', 6),
    ('convertible', 'Кабриолет', 7),
    ('roadster', 'Родстер', 8),
    ('pickup', 'Пикап', 9),
    ('minivan', 'Минивэн', 10)
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
    body_type_id TEXT,
    seat_count INTEGER,
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
    FOREIGN KEY (color_id) REFERENCES car_colors(id),
    FOREIGN KEY (body_type_id) REFERENCES car_body_types(id)
);

CREATE INDEX IF NOT EXISTS idx_cars_public_slug
    ON cars(public_slug);

CREATE INDEX IF NOT EXISTS idx_cars_city_id
    ON cars(city_id);

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
