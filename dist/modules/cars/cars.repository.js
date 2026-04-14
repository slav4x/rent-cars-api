import { database } from "../../db/database.js";
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
        id, public_slug, rentprog_id, title, category_id, city_id, brand_id, color_id, video_url,
        horsepower, zero_to_hundred, fuel_type, transmission_type, description_html,
        price_per_day, price_2_7_days, price_from_7_days, price_from_30_days, price_from_60_days,
        overage_price_per_km, seo_title, seo_description_html, media_urls,
        created_at, updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
export function listCars() {
    const rows = listCarsStatement.all();
    return rows.map(mapCar);
}
export function findCarById(id) {
    const row = findCarByIdStatement.get(id);
    return row ? mapCar(row) : null;
}
export function findCarByPublicSlug(publicSlug) {
    const row = findCarByPublicSlugStatement.get(publicSlug);
    return row ? mapCar(row) : null;
}
export function createCarRecord(car) {
    insertCarStatement.run(car.id, car.publicSlug, car.rentProgId, car.title, car.categoryId, car.cityId, car.brandId, car.colorId, car.videoUrl, car.horsepower, car.zeroToHundred, car.fuelType, car.transmissionType, car.descriptionHtml, car.pricePerDay, car.price2to7Days, car.priceFrom7Days, car.priceFrom30Days, car.priceFrom60Days, car.overagePricePerKm, car.seoTitle, car.seoDescriptionHtml, JSON.stringify(car.mediaUrls), car.createdAt, car.updatedAt);
    return car;
}
export function updateCarRecord(car) {
    updateCarStatement.run(car.publicSlug, car.rentProgId, car.title, car.categoryId, car.cityId, car.brandId, car.colorId, car.videoUrl, car.horsepower, car.zeroToHundred, car.fuelType, car.transmissionType, car.descriptionHtml, car.pricePerDay, car.price2to7Days, car.priceFrom7Days, car.priceFrom30Days, car.priceFrom60Days, car.overagePricePerKm, car.seoTitle, car.seoDescriptionHtml, JSON.stringify(car.mediaUrls), car.updatedAt, car.id);
    return car;
}
export function listCarCategories() {
    return listCategoriesStatement.all();
}
export function listCarCities() {
    return listCitiesStatement.all();
}
export function listCarBrands() {
    return listBrandsStatement.all();
}
export function listCarColors() {
    return listColorsStatement.all();
}
function mapCar(row) {
    return {
        id: row.id,
        publicSlug: row.public_slug,
        rentProgId: row.rentprog_id,
        title: row.title,
        categoryId: row.category_id,
        cityId: row.city_id,
        brandId: row.brand_id,
        colorId: row.color_id,
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
function parseMediaUrls(value) {
    try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
    }
    catch {
        return [];
    }
}
