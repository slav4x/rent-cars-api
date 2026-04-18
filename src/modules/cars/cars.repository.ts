import { execute, queryFirst, queryRows } from "../../db/database.js";

export type CarOptionRecord = {
    id: string;
    slug?: string | null;
    name: string;
    seoTitle?: string | null;
    seoText?: string | null;
    subdomain?: string | null;
    address?: string | null;
    phone?: string | null;
    email?: string | null;
    map?: string | null;
    hex?: string | null;
};

export type CarRecord = {
    id: string;
    publicSlug: string;
    rentProgId: string | null;
    title: string;
    categoryId: string;
    cityId: string;
    brandId: string;
    colorId: string;
    bodyTypeId: string | null;
    seatCount: number | null;
    videoUrl: string | null;
    horsepower: number | null;
    zeroToHundred: number | null;
    fuelType: string;
    transmissionType: string;
    descriptionHtml: string;
    pricePerDay: number;
    price2to7Days: number;
    priceFrom7Days: number;
    priceFrom30Days: number;
    priceFrom60Days: number;
    overagePricePerKm: number;
    seoTitle: string | null;
    seoDescriptionHtml: string;
    mediaUrls: string[];
    createdAt: string;
    updatedAt: string;
};

type CarRow = {
    id: string;
    public_slug: string;
    rentprog_id: string | null;
    title: string;
    category_id: string;
    city_id: string;
    brand_id: string;
    color_id: string;
    body_type_id: string | null;
    seat_count: number | null;
    video_url: string | null;
    horsepower: number | null;
    zero_to_hundred: number | null;
    fuel_type: string;
    transmission_type: string;
    description_html: string;
    price_per_day: number;
    price_2_7_days: number;
    price_from_7_days: number;
    price_from_30_days: number;
    price_from_60_days: number;
    overage_price_per_km: number;
    seo_title: string | null;
    seo_description_html: string;
    media_urls: string;
    created_at: string;
    updated_at: string;
};

export async function listCars() {
    const rows = await queryRows<CarRow>(
        `
            SELECT *
            FROM cars
            ORDER BY created_at DESC
        `,
    );
    return rows.map(mapCar);
}

export async function findCarById(id: string) {
    const row = await queryFirst<CarRow>(
        `
            SELECT *
            FROM cars
            WHERE id = $1
        `,
        [id],
    );
    return row ? mapCar(row) : null;
}

export async function findCarByPublicSlug(publicSlug: string) {
    const row = await queryFirst<CarRow>(
        `
            SELECT *
            FROM cars
            WHERE public_slug = $1
        `,
        [publicSlug],
    );
    return row ? mapCar(row) : null;
}

export async function createCarRecord(car: CarRecord) {
    await execute(
        `
            INSERT INTO cars (
                id, public_slug, rentprog_id, title, category_id, city_id, brand_id, color_id,
                body_type_id, seat_count, video_url, horsepower, zero_to_hundred, fuel_type,
                transmission_type, description_html, price_per_day, price_2_7_days,
                price_from_7_days, price_from_30_days, price_from_60_days, overage_price_per_km,
                seo_title, seo_description_html, media_urls, created_at, updated_at
            )
            VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8,
                $9, $10, $11, $12, $13, $14,
                $15, $16, $17, $18,
                $19, $20, $21, $22,
                $23, $24, $25, $26, $27
            )
        `,
        [
            car.id,
            car.publicSlug,
            car.rentProgId,
            car.title,
            car.categoryId,
            car.cityId,
            car.brandId,
            car.colorId,
            car.bodyTypeId,
            car.seatCount,
            car.videoUrl,
            car.horsepower,
            car.zeroToHundred,
            car.fuelType,
            car.transmissionType,
            car.descriptionHtml,
            car.pricePerDay,
            car.price2to7Days,
            car.priceFrom7Days,
            car.priceFrom30Days,
            car.priceFrom60Days,
            car.overagePricePerKm,
            car.seoTitle,
            car.seoDescriptionHtml,
            JSON.stringify(car.mediaUrls),
            car.createdAt,
            car.updatedAt,
        ],
    );

    return car;
}

export async function updateCarRecord(car: CarRecord) {
    await execute(
        `
            UPDATE cars
            SET
                public_slug = $1,
                rentprog_id = $2,
                title = $3,
                category_id = $4,
                city_id = $5,
                brand_id = $6,
                color_id = $7,
                body_type_id = $8,
                seat_count = $9,
                video_url = $10,
                horsepower = $11,
                zero_to_hundred = $12,
                fuel_type = $13,
                transmission_type = $14,
                description_html = $15,
                price_per_day = $16,
                price_2_7_days = $17,
                price_from_7_days = $18,
                price_from_30_days = $19,
                price_from_60_days = $20,
                overage_price_per_km = $21,
                seo_title = $22,
                seo_description_html = $23,
                media_urls = $24,
                updated_at = $25
            WHERE id = $26
        `,
        [
            car.publicSlug,
            car.rentProgId,
            car.title,
            car.categoryId,
            car.cityId,
            car.brandId,
            car.colorId,
            car.bodyTypeId,
            car.seatCount,
            car.videoUrl,
            car.horsepower,
            car.zeroToHundred,
            car.fuelType,
            car.transmissionType,
            car.descriptionHtml,
            car.pricePerDay,
            car.price2to7Days,
            car.priceFrom7Days,
            car.priceFrom30Days,
            car.priceFrom60Days,
            car.overagePricePerKm,
            car.seoTitle,
            car.seoDescriptionHtml,
            JSON.stringify(car.mediaUrls),
            car.updatedAt,
            car.id,
        ],
    );

    return car;
}

export async function listCarCategories() {
    return queryRows<CarOptionRecord>(
        `
            SELECT id, slug, name, seo_title AS "seoTitle", seo_text AS "seoText"
            FROM car_categories
            ORDER BY sort_order ASC, name ASC
        `,
    );
}

export async function listCarCities() {
    return queryRows<CarOptionRecord>(
        `
            SELECT id, name, subdomain, seo_title AS "seoTitle", seo_text AS "seoText", address, phone, email, map
            FROM car_cities
            ORDER BY sort_order ASC, name ASC
        `,
    );
}

export async function listCarBrands() {
    return queryRows<CarOptionRecord>(
        `
            SELECT id, slug, name, seo_title AS "seoTitle", seo_text AS "seoText"
            FROM car_brands
            ORDER BY sort_order ASC, name ASC
        `,
    );
}

export async function listCarColors() {
    return queryRows<CarOptionRecord>(
        `
            SELECT id, name, hex
            FROM car_colors
            ORDER BY sort_order ASC, name ASC
        `,
    );
}

export async function listCarBodyTypes() {
    return queryRows<CarOptionRecord>(
        `
            SELECT id, name
            FROM car_body_types
            ORDER BY sort_order ASC, name ASC
        `,
    );
}

function mapCar(row: CarRow): CarRecord {
    return {
        id: row.id,
        publicSlug: row.public_slug,
        rentProgId: row.rentprog_id,
        title: row.title,
        categoryId: row.category_id,
        cityId: row.city_id,
        brandId: row.brand_id,
        colorId: row.color_id,
        bodyTypeId: row.body_type_id,
        seatCount: row.seat_count,
        videoUrl: row.video_url,
        horsepower: row.horsepower,
        zeroToHundred: row.zero_to_hundred,
        fuelType: row.fuel_type,
        transmissionType: row.transmission_type,
        descriptionHtml: row.description_html,
        pricePerDay: row.price_per_day,
        price2to7Days: row.price_2_7_days,
        priceFrom7Days: row.price_from_7_days,
        priceFrom30Days: row.price_from_30_days,
        priceFrom60Days: row.price_from_60_days,
        overagePricePerKm: row.overage_price_per_km,
        seoTitle: row.seo_title,
        seoDescriptionHtml: row.seo_description_html,
        mediaUrls: parseMediaUrls(row.media_urls),
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

function parseMediaUrls(value: string) {
    try {
        const parsed = JSON.parse(value) as string[];
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}
