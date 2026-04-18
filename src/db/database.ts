import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { Pool, type PoolClient, type QueryResultRow } from "pg";

const defaultDatabaseUrl =
    "postgresql://rentcars:rentcars@localhost:5432/rentcars";
const databaseUrl = process.env.DATABASE_URL ?? defaultDatabaseUrl;

export const pool = new Pool({
    connectionString: databaseUrl,
    ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : false,
});

const schemaPath = resolve(process.cwd(), "src", "db", "schema.sql");
const schemaSql = readFileSync(schemaPath, "utf8");

export function getDatabasePath() {
    return databaseUrl;
}

export async function queryRows<T extends QueryResultRow = QueryResultRow>(
    text: string,
    params: unknown[] = [],
    client?: PoolClient,
) {
    const executor = client ?? pool;
    const result = await executor.query<T>(text, params);
    return result.rows;
}

export async function queryFirst<T extends QueryResultRow = QueryResultRow>(
    text: string,
    params: unknown[] = [],
    client?: PoolClient,
) {
    const rows = await queryRows<T>(text, params, client);
    return rows[0] ?? null;
}

export async function execute(
    text: string,
    params: unknown[] = [],
    client?: PoolClient,
) {
    const executor = client ?? pool;
    await executor.query(text, params);
}

export async function withTransaction<T>(callback: (client: PoolClient) => Promise<T>) {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");
        const result = await callback(client);
        await client.query("COMMIT");
        return result;
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
}

async function initializeDatabase() {
    const client = await pool.connect();

    try {
        await client.query(schemaSql);
        await syncCarReferenceData(client);
    } finally {
        client.release();
    }
}

async function syncCarReferenceData(client: PoolClient) {
    await ensureReferenceColumn(client, "car_categories", "slug", "TEXT");
    await ensureReferenceColumn(client, "car_categories", "seo_title", "TEXT");
    await ensureReferenceColumn(
        client,
        "car_categories",
        "seo_text",
        "TEXT NOT NULL DEFAULT '<p></p>'",
    );

    await ensureReferenceColumn(client, "car_brands", "slug", "TEXT");
    await ensureReferenceColumn(client, "car_brands", "seo_title", "TEXT");
    await ensureReferenceColumn(
        client,
        "car_brands",
        "seo_text",
        "TEXT NOT NULL DEFAULT '<p></p>'",
    );

    await ensureReferenceColumn(client, "car_cities", "subdomain", "TEXT");
    await ensureReferenceColumn(client, "car_cities", "seo_title", "TEXT");
    await ensureReferenceColumn(
        client,
        "car_cities",
        "seo_text",
        "TEXT NOT NULL DEFAULT '<p></p>'",
    );
    await ensureReferenceColumn(client, "car_cities", "address", "TEXT");
    await ensureReferenceColumn(client, "car_cities", "phone", "TEXT");
    await ensureReferenceColumn(client, "car_cities", "email", "TEXT");
    await ensureReferenceColumn(client, "car_cities", "map", "TEXT");
    await ensureReferenceColumn(client, "car_colors", "hex", "TEXT");

    await seedCategories(client);
    await seedCities(client);
    await seedBrands(client);
    await seedColors(client);
}

async function ensureReferenceColumn(
    client: PoolClient,
    table: string,
    column: string,
    definition: string,
) {
    await client.query(
        `ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS ${column} ${definition}`,
    );
}

type CategorySeed = {
    id: string;
    slug: string;
    name: string;
    sortOrder: number;
    seoTitle: string | null;
    seoText: string;
};

type BrandSeed = {
    id: string;
    slug: string;
    name: string;
    sortOrder: number;
    seoTitle: string | null;
    seoText: string;
    legacyIds?: string[];
};

type CitySeed = {
    id: string;
    name: string;
    subdomain: string;
    seoTitle: string | null;
    seoText: string;
    address: string;
    phone: string;
    email: string;
    map: string;
    sortOrder: number;
    legacyIds?: string[];
};

type ColorSeed = {
    id: string;
    name: string;
    hex: string;
    sortOrder: number;
    legacyIds?: string[];
};

const CATEGORY_SEEDS: CategorySeed[] = [
    { id: "0e3ce84e-d2e6-4b39-b4f7-dcbd7cbdeb01", slug: "economy", name: "Эконом", sortOrder: 1, seoTitle: null, seoText: "<p></p>" },
    { id: "0e3ce84e-d2e6-4b39-b4f7-dcbd7cbdeb02", slug: "comfort", name: "Комфорт", sortOrder: 2, seoTitle: null, seoText: "<p></p>" },
    { id: "0e3ce84e-d2e6-4b39-b4f7-dcbd7cbdeb03", slug: "comfort_plus", name: "Комфорт +", sortOrder: 3, seoTitle: null, seoText: "<p></p>" },
    { id: "0e3ce84e-d2e6-4b39-b4f7-dcbd7cbdeb04", slug: "business", name: "Бизнес", sortOrder: 4, seoTitle: null, seoText: "<p></p>" },
    { id: "0e3ce84e-d2e6-4b39-b4f7-dcbd7cbdeb05", slug: "premium", name: "Премиум", sortOrder: 5, seoTitle: null, seoText: "<p></p>" },
    { id: "0e3ce84e-d2e6-4b39-b4f7-dcbd7cbdeb06", slug: "suv", name: "Внедорожники", sortOrder: 6, seoTitle: null, seoText: "<p></p>" },
    { id: "0e3ce84e-d2e6-4b39-b4f7-dcbd7cbdeb07", slug: "convertible", name: "Кабриолеты", sortOrder: 7, seoTitle: null, seoText: "<p></p>" },
    { id: "0e3ce84e-d2e6-4b39-b4f7-dcbd7cbdeb08", slug: "sport", name: "Спортивные", sortOrder: 8, seoTitle: null, seoText: "<p></p>" },
    { id: "0e3ce84e-d2e6-4b39-b4f7-dcbd7cbdeb09", slug: "muscle", name: "Маслкары", sortOrder: 9, seoTitle: null, seoText: "<p></p>" },
    { id: "0e3ce84e-d2e6-4b39-b4f7-dcbd7cbdeb10", slug: "electric", name: "Электро", sortOrder: 10, seoTitle: null, seoText: "<p></p>" },
    { id: "0e3ce84e-d2e6-4b39-b4f7-dcbd7cbdeb11", slug: "minivan", name: "Минивэны", sortOrder: 11, seoTitle: null, seoText: "<p></p>" },
];

const CITY_SEEDS: CitySeed[] = [
    { id: "5cf19fd8-ccfa-4fd5-b82d-32e0d7be6001", name: "Санкт-Петербург", subdomain: "spb", seoTitle: "Аренда автомобилей в Санкт-Петербурге", seoText: "<p>Заглушка SEO-текста для Санкт-Петербурга. Здесь будет текст про аренду авто в городе, популярные сценарии поездок и преимущества сервиса.</p>", address: "Железнодорожный пр. 36, Санкт-Петербург, Россия, 192148", phone: "+7 (911) 089-94-94", email: "work.dm@gmail.com", map: "https://yandex.ru/map-widget/v1/?um=constructor%3A3892e36fb3dc877f227183ba6f5088384517262874fa5fcadab2c1370f49518a&amp;source=constructor", sortOrder: 1, legacyIds: ["saint-petersburg"] },
    { id: "5cf19fd8-ccfa-4fd5-b82d-32e0d7be6002", name: "Москва", subdomain: "msk", seoTitle: "Аренда автомобилей в Москве", seoText: "<p>Заглушка SEO-текста для Москвы. Здесь будет текст про аренду авто в городе, популярные маршруты и особенности сервиса для столицы.</p>", address: "Москва, Каширское шоссе, 14, 2 этаж", phone: "+7 (499) 130-51-01", email: "work.dm@gmail.com", map: "https://yandex.ru/map-widget/v1/?um=constructor%3A27017476604ee062e38f8ae5d6080b0e87a4941b4f7519bd053c1282cd06c9c6&amp;source=constructor", sortOrder: 2, legacyIds: ["moscow"] },
    { id: "5cf19fd8-ccfa-4fd5-b82d-32e0d7be6003", name: "Сочи", subdomain: "sochi", seoTitle: "Аренда автомобилей в Сочи", seoText: "<p>Заглушка SEO-текста для Сочи. Здесь будет текст про аренду авто для отдыха, поездок по побережью и удобство получения автомобиля в городе.</p>", address: "Сочи, ул Ленина 298Б, строение 9", phone: "+7 (903) 099-22-72", email: "sochi@rentcar.ru", map: "https://yandex.ru/map-widget/v1/?um=constructor%3A7746373ed8cb5efa54e9addc2466561c3d4559aa338f9fbdc72736b1be5c138b&amp;source=constructor", sortOrder: 3, legacyIds: ["sochi"] },
    { id: "5cf19fd8-ccfa-4fd5-b82d-32e0d7be6004", name: "Мурманск", subdomain: "murmansk", seoTitle: "Аренда автомобилей в Мурманске", seoText: "<p>Заглушка SEO-текста для Мурманска. Здесь будет текст про аренду авто в северном регионе, деловые поездки и локальные маршруты.</p>", address: "Мурманск, ул. Полярные Зори, 62, 3 этаж, 312 офис", phone: "+7 (905) 285-22-22", email: "murmansk@rentcar.ru", map: "https://yandex.ru/map-widget/v1/?um=constructor%3Ad6f6feea3e0be846611782f37cf802db6666038f075662997935522074581e2c&amp;source=constructor", sortOrder: 4, legacyIds: ["murmansk"] },
];

const BRAND_SEEDS: BrandSeed[] = [
    { id: "718e2a2c-d0f4-4208-b5bc-6a3848f7b001", slug: "opel", name: "Opel", sortOrder: 1, seoTitle: null, seoText: "<p></p>" },
    { id: "718e2a2c-d0f4-4208-b5bc-6a3848f7b002", slug: "mini", name: "Mini", sortOrder: 2, seoTitle: null, seoText: "<p></p>" },
    { id: "718e2a2c-d0f4-4208-b5bc-6a3848f7b003", slug: "ram", name: "Ram", sortOrder: 3, seoTitle: null, seoText: "<p></p>" },
    { id: "718e2a2c-d0f4-4208-b5bc-6a3848f7b004", slug: "skoda", name: "Skoda", sortOrder: 4, seoTitle: null, seoText: "<p></p>" },
    { id: "718e2a2c-d0f4-4208-b5bc-6a3848f7b005", slug: "lexus", name: "Lexus", sortOrder: 5, seoTitle: null, seoText: "<p></p>" },
    { id: "718e2a2c-d0f4-4208-b5bc-6a3848f7b006", slug: "chevrolet", name: "Chevrolet", sortOrder: 6, seoTitle: null, seoText: "<p></p>" },
    { id: "718e2a2c-d0f4-4208-b5bc-6a3848f7b007", slug: "land-rover", name: "Land Rover", sortOrder: 7, seoTitle: null, seoText: "<p></p>", legacyIds: ["range-rover"] },
    { id: "718e2a2c-d0f4-4208-b5bc-6a3848f7b008", slug: "toyota", name: "Toyota", sortOrder: 8, seoTitle: null, seoText: "<p></p>" },
    { id: "718e2a2c-d0f4-4208-b5bc-6a3848f7b009", slug: "lixiang", name: "Lixiang", sortOrder: 9, seoTitle: null, seoText: "<p></p>" },
    { id: "718e2a2c-d0f4-4208-b5bc-6a3848f7b010", slug: "ford", name: "Ford", sortOrder: 10, seoTitle: null, seoText: "<p></p>" },
    { id: "718e2a2c-d0f4-4208-b5bc-6a3848f7b011", slug: "bmw", name: "BMW", sortOrder: 11, seoTitle: null, seoText: "<p></p>" },
    { id: "718e2a2c-d0f4-4208-b5bc-6a3848f7b012", slug: "dodge", name: "Dodge", sortOrder: 12, seoTitle: null, seoText: "<p></p>" },
    { id: "718e2a2c-d0f4-4208-b5bc-6a3848f7b013", slug: "kia", name: "Kia", sortOrder: 13, seoTitle: null, seoText: "<p></p>" },
    { id: "718e2a2c-d0f4-4208-b5bc-6a3848f7b014", slug: "chery", name: "Chery", sortOrder: 14, seoTitle: null, seoText: "<p></p>" },
    { id: "718e2a2c-d0f4-4208-b5bc-6a3848f7b015", slug: "hyundai", name: "Hyundai", sortOrder: 15, seoTitle: null, seoText: "<p></p>" },
    { id: "718e2a2c-d0f4-4208-b5bc-6a3848f7b016", slug: "mercedes", name: "Mercedes", sortOrder: 16, seoTitle: null, seoText: "<p></p>", legacyIds: ["mercedes-benz"] },
    { id: "718e2a2c-d0f4-4208-b5bc-6a3848f7b017", slug: "volkswagen", name: "Volkswagen", sortOrder: 17, seoTitle: null, seoText: "<p></p>" },
    { id: "718e2a2c-d0f4-4208-b5bc-6a3848f7b018", slug: "geely", name: "Geely", sortOrder: 18, seoTitle: null, seoText: "<p></p>" },
    { id: "718e2a2c-d0f4-4208-b5bc-6a3848f7b019", slug: "porsche", name: "Porsche", sortOrder: 19, seoTitle: null, seoText: "<p></p>" },
    { id: "718e2a2c-d0f4-4208-b5bc-6a3848f7b020", slug: "audi", name: "Audi", sortOrder: 20, seoTitle: null, seoText: "<p></p>" },
    { id: "718e2a2c-d0f4-4208-b5bc-6a3848f7b021", slug: "haval", name: "Haval", sortOrder: 21, seoTitle: null, seoText: "<p></p>" },
    { id: "718e2a2c-d0f4-4208-b5bc-6a3848f7b022", slug: "lada", name: "Lada", sortOrder: 22, seoTitle: null, seoText: "<p></p>" },
    { id: "718e2a2c-d0f4-4208-b5bc-6a3848f7b023", slug: "tesla", name: "Tesla", sortOrder: 23, seoTitle: null, seoText: "<p></p>" },
    { id: "718e2a2c-d0f4-4208-b5bc-6a3848f7b024", slug: "zeekr", name: "Zeekr", sortOrder: 24, seoTitle: null, seoText: "<p></p>" },
    { id: "718e2a2c-d0f4-4208-b5bc-6a3848f7b025", slug: "smart", name: "Smart", sortOrder: 25, seoTitle: null, seoText: "<p></p>" },
    { id: "718e2a2c-d0f4-4208-b5bc-6a3848f7b026", slug: "tank", name: "Tank", sortOrder: 26, seoTitle: null, seoText: "<p></p>" },
    { id: "718e2a2c-d0f4-4208-b5bc-6a3848f7b027", slug: "omoda", name: "Omoda", sortOrder: 27, seoTitle: null, seoText: "<p></p>" },
];

const COLOR_SEEDS: ColorSeed[] = [
    { id: "d7305d86-4ed1-4f6a-aab7-0372f1c61001", name: "Черный", hex: "#000000", sortOrder: 1, legacyIds: ["black"] },
    { id: "d7305d86-4ed1-4f6a-aab7-0372f1c61002", name: "Белый", hex: "#FFFFFF", sortOrder: 2, legacyIds: ["white"] },
    { id: "d7305d86-4ed1-4f6a-aab7-0372f1c61003", name: "Серый", hex: "#808080", sortOrder: 3, legacyIds: ["gray"] },
    { id: "d7305d86-4ed1-4f6a-aab7-0372f1c61004", name: "Синий", hex: "#2563EB", sortOrder: 4, legacyIds: ["blue"] },
    { id: "d7305d86-4ed1-4f6a-aab7-0372f1c61005", name: "Красный", hex: "#DC2626", sortOrder: 5, legacyIds: ["red"] },
];

async function seedCategories(client: PoolClient) {
    const rows = await client.query<{
        id: string;
        slug: string | null;
        name: string;
        seo_title: string | null;
        seo_text: string | null;
    }>("SELECT id, slug, name, seo_title, seo_text FROM car_categories");

    for (const seed of CATEGORY_SEEDS) {
        const existing = rows.rows.find(
            (row) =>
                row.slug === seed.slug ||
                row.id === seed.slug ||
                row.id === seed.id,
        );

        if (!existing) {
            await client.query(
                `INSERT INTO car_categories (id, slug, name, seo_title, seo_text, sort_order)
                 VALUES ($1, $2, $3, $4, $5, $6)
                 ON CONFLICT (id) DO UPDATE SET
                    slug = EXCLUDED.slug,
                    name = EXCLUDED.name,
                    seo_title = EXCLUDED.seo_title,
                    seo_text = EXCLUDED.seo_text,
                    sort_order = EXCLUDED.sort_order`,
                [seed.id, seed.slug, seed.name, seed.seoTitle, seed.seoText, seed.sortOrder],
            );
            continue;
        }

        if (existing.id !== seed.id) {
            await client.query(
                `INSERT INTO car_categories (id, slug, name, seo_title, seo_text, sort_order)
                 VALUES ($1, $2, $3, $4, $5, $6)
                 ON CONFLICT (id) DO NOTHING`,
                [seed.id, seed.slug, seed.name, seed.seoTitle, seed.seoText, seed.sortOrder],
            );
            await client.query(
                `UPDATE cars SET category_id = $1 WHERE category_id = $2`,
                [seed.id, existing.id],
            );
            await client.query(`DELETE FROM car_categories WHERE id = $1`, [existing.id]);
        }

        await client.query(
            `UPDATE car_categories
             SET slug = $2, name = $3, seo_title = $4, seo_text = $5, sort_order = $6
             WHERE id = $1`,
            [seed.id, seed.slug, seed.name, seed.seoTitle, seed.seoText, seed.sortOrder],
        );
    }
}

async function seedBrands(client: PoolClient) {
    const rows = await client.query<{
        id: string;
        slug: string | null;
        name: string;
        seo_title: string | null;
        seo_text: string | null;
    }>("SELECT id, slug, name, seo_title, seo_text FROM car_brands");

    for (const seed of BRAND_SEEDS) {
        const existing = rows.rows.find(
            (row) =>
                row.slug === seed.slug ||
                row.id === seed.slug ||
                row.id === seed.id ||
                seed.legacyIds?.includes(row.id),
        );

        if (!existing) {
            await client.query(
                `INSERT INTO car_brands (id, slug, name, seo_title, seo_text, sort_order)
                 VALUES ($1, $2, $3, $4, $5, $6)
                 ON CONFLICT (id) DO UPDATE SET
                    slug = EXCLUDED.slug,
                    name = EXCLUDED.name,
                    seo_title = EXCLUDED.seo_title,
                    seo_text = EXCLUDED.seo_text,
                    sort_order = EXCLUDED.sort_order`,
                [seed.id, seed.slug, seed.name, seed.seoTitle, seed.seoText, seed.sortOrder],
            );
            continue;
        }

        if (existing.id !== seed.id) {
            await client.query(
                `INSERT INTO car_brands (id, slug, name, seo_title, seo_text, sort_order)
                 VALUES ($1, $2, $3, $4, $5, $6)
                 ON CONFLICT (id) DO NOTHING`,
                [seed.id, seed.slug, seed.name, seed.seoTitle, seed.seoText, seed.sortOrder],
            );
            await client.query(
                `UPDATE cars SET brand_id = $1 WHERE brand_id = $2`,
                [seed.id, existing.id],
            );
            await client.query(`DELETE FROM car_brands WHERE id = $1`, [existing.id]);
        }

        await client.query(
            `UPDATE car_brands
             SET slug = $2, name = $3, seo_title = $4, seo_text = $5, sort_order = $6
             WHERE id = $1`,
            [seed.id, seed.slug, seed.name, seed.seoTitle, seed.seoText, seed.sortOrder],
        );
    }
}

async function seedCities(client: PoolClient) {
    const rows = await client.query<{
        id: string;
        name: string;
        subdomain: string | null;
        seo_title: string | null;
        seo_text: string | null;
        address: string | null;
        phone: string | null;
        email: string | null;
        map: string | null;
    }>("SELECT id, name, subdomain, seo_title, seo_text, address, phone, email, map FROM car_cities");

    for (const seed of CITY_SEEDS) {
        const existing = rows.rows.find(
            (row) =>
                row.id === seed.id ||
                row.subdomain === seed.subdomain ||
                row.name === seed.name ||
                seed.legacyIds?.includes(row.id),
        );

        if (existing && existing.id !== seed.id) {
            await client.query(
                `INSERT INTO car_cities (id, name, subdomain, seo_title, seo_text, address, phone, email, map, sort_order)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                 ON CONFLICT (id) DO NOTHING`,
                [
                    seed.id,
                    seed.name,
                    seed.subdomain,
                    seed.seoTitle,
                    seed.seoText,
                    seed.address,
                    seed.phone,
                    seed.email,
                    seed.map,
                    seed.sortOrder,
                ],
            );
            await client.query(
                `UPDATE cars SET city_id = $1 WHERE city_id = $2`,
                [seed.id, existing.id],
            );
            await client.query(`DELETE FROM car_cities WHERE id = $1`, [existing.id]);
        }

        await client.query(
            `INSERT INTO car_cities (id, name, subdomain, seo_title, seo_text, address, phone, email, map, sort_order)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
             ON CONFLICT (id) DO UPDATE SET
                name = EXCLUDED.name,
                subdomain = EXCLUDED.subdomain,
                seo_title = EXCLUDED.seo_title,
                seo_text = EXCLUDED.seo_text,
                address = EXCLUDED.address,
                phone = EXCLUDED.phone,
                email = EXCLUDED.email,
                map = EXCLUDED.map,
                sort_order = EXCLUDED.sort_order`,
            [
                seed.id,
                seed.name,
                seed.subdomain,
                seed.seoTitle,
                seed.seoText,
                seed.address,
                seed.phone,
                seed.email,
                seed.map,
                seed.sortOrder,
            ],
        );
    }
}

async function seedColors(client: PoolClient) {
    const rows = await client.query<{
        id: string;
        name: string;
        hex: string | null;
    }>("SELECT id, name, hex FROM car_colors");

    for (const seed of COLOR_SEEDS) {
        const existing = rows.rows.find(
            (row) =>
                row.id === seed.id ||
                row.name === seed.name ||
                seed.legacyIds?.includes(row.id),
        );

        if (existing && existing.id !== seed.id) {
            await client.query(
                `INSERT INTO car_colors (id, name, hex, sort_order)
                 VALUES ($1, $2, $3, $4)
                 ON CONFLICT (id) DO NOTHING`,
                [seed.id, seed.name, seed.hex, seed.sortOrder],
            );
            await client.query(
                `UPDATE cars SET color_id = $1 WHERE color_id = $2`,
                [seed.id, existing.id],
            );
            await client.query(`DELETE FROM car_colors WHERE id = $1`, [existing.id]);
        }

        await client.query(
            `INSERT INTO car_colors (id, name, hex, sort_order)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (id) DO UPDATE SET
                name = EXCLUDED.name,
                hex = EXCLUDED.hex,
                sort_order = EXCLUDED.sort_order`,
            [seed.id, seed.name, seed.hex, seed.sortOrder],
        );
    }
}

await initializeDatabase();
