import { database } from "../../db/database.js";

export type CarOptionRecord = {
    id: string;
    name: string;
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

const listCarsStatement = database.prepare(`
    SELECT *
    FROM cars
    ORDER BY created_at DESC
`);

const findCarByIdStatement = database.prepare(`
    SELECT *
    FROM cars
    WHERE id = ?
`);

const findCarByPublicSlugStatement = database.prepare(`
    SELECT *
    FROM cars
    WHERE public_slug = ?
`);

const insertCarStatement = database.prepare(`
    INSERT INTO cars (
        id, public_slug, rentprog_id, title, category_id, city_id, brand_id, color_id, body_type_id,
        seat_count, video_url, horsepower, zero_to_hundred, fuel_type, transmission_type, description_html,
        price_per_day, price_2_7_days, price_from_7_days, price_from_30_days, price_from_60_days,
        overage_price_per_km, seo_title, seo_description_html, media_urls,
        created_at, updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const updateCarStatement = database.prepare(`
    UPDATE cars
    SET
        public_slug = ?,
        rentprog_id = ?,
        title = ?,
        category_id = ?,
        city_id = ?,
        brand_id = ?,
        color_id = ?,
        body_type_id = ?,
        seat_count = ?,
        video_url = ?,
        horsepower = ?,
        zero_to_hundred = ?,
        fuel_type = ?,
        transmission_type = ?,
        description_html = ?,
        price_per_day = ?,
        price_2_7_days = ?,
        price_from_7_days = ?,
        price_from_30_days = ?,
        price_from_60_days = ?,
        overage_price_per_km = ?,
        seo_title = ?,
        seo_description_html = ?,
        media_urls = ?,
        updated_at = ?
    WHERE id = ?
`);

const listCategoriesStatement = database.prepare(`
    SELECT id, name
    FROM car_categories
    ORDER BY sort_order ASC, name ASC
`);

const listCitiesStatement = database.prepare(`
    SELECT id, name
    FROM car_cities
    ORDER BY sort_order ASC, name ASC
`);

const listBrandsStatement = database.prepare(`
    SELECT id, name
    FROM car_brands
    ORDER BY sort_order ASC, name ASC
`);

const listColorsStatement = database.prepare(`
    SELECT id, name
    FROM car_colors
    ORDER BY sort_order ASC, name ASC
`);

const listBodyTypesStatement = database.prepare(`
    SELECT id, name
    FROM car_body_types
    ORDER BY sort_order ASC, name ASC
`);

export function listCars() {
    const rows = listCarsStatement.all() as CarRow[];
    return rows.map(mapCar);
}

export function findCarById(id: string) {
    const row = findCarByIdStatement.get(id) as CarRow | undefined;
    return row ? mapCar(row) : null;
}

export function findCarByPublicSlug(publicSlug: string) {
    const row = findCarByPublicSlugStatement.get(publicSlug) as CarRow | undefined;
    return row ? mapCar(row) : null;
}

export function createCarRecord(car: CarRecord) {
    insertCarStatement.run(
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
    );

    return car;
}

export function updateCarRecord(car: CarRecord) {
    updateCarStatement.run(
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
    );

    return car;
}

export function listCarCategories() {
    return listCategoriesStatement.all() as CarOptionRecord[];
}

export function listCarCities() {
    return listCitiesStatement.all() as CarOptionRecord[];
}

export function listCarBrands() {
    return listBrandsStatement.all() as CarOptionRecord[];
}

export function listCarColors() {
    return listColorsStatement.all() as CarOptionRecord[];
}

export function listCarBodyTypes() {
    return listBodyTypesStatement.all() as CarOptionRecord[];
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
