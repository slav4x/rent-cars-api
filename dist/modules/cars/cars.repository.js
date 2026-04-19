import { execute, queryFirst, queryRows } from "../../db/database.js";
export async function listCars() {
    const rows = await queryRows(`
            SELECT *
            FROM cars
            ORDER BY created_at DESC
        `);
    return rows.map(mapCar);
}
export async function findCarById(id) {
    const row = await queryFirst(`
            SELECT *
            FROM cars
            WHERE id = $1
        `, [id]);
    return row ? mapCar(row) : null;
}
export async function findCarByPublicSlug(publicSlug) {
    const row = await queryFirst(`
            SELECT *
            FROM cars
            WHERE public_slug = $1
        `, [publicSlug]);
    return row ? mapCar(row) : null;
}
export async function createCarRecord(car) {
    await execute(`
            INSERT INTO cars (
                id, public_slug, rentprog_id, title, category_id, city_id, brand_id, color_id,
                body_type_id, seat_count, video_url, horsepower, zero_to_hundred, fuel_type,
                transmission_type, description_html, price_per_day, price_2_7_days,
                price_from_7_days, price_from_30_days, price_from_60_days, overage_price_per_km,
                seo_title, seo_description_html, is_archived, media_urls, created_at, updated_at
            )
            VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8,
                $9, $10, $11, $12, $13, $14,
                $15, $16, $17, $18,
                $19, $20, $21, $22,
                $23, $24, $25, $26, $27, $28
            )
        `, [
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
        car.isArchived ? 1 : 0,
        JSON.stringify(car.mediaUrls),
        car.createdAt,
        car.updatedAt,
    ]);
    return car;
}
export async function updateCarRecord(car) {
    await execute(`
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
                is_archived = $24,
                media_urls = $25,
                updated_at = $26
            WHERE id = $27
        `, [
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
        car.isArchived ? 1 : 0,
        JSON.stringify(car.mediaUrls),
        car.updatedAt,
        car.id,
    ]);
    return car;
}
export async function countBookingsByCarId(carId) {
    const row = await queryFirst(`
            SELECT COUNT(*)::int AS count
            FROM bookings
            WHERE car_id = $1
        `, [carId]);
    return row?.count ?? 0;
}
export async function countActiveBookingsByCarId(carId, nowIso) {
    const row = await queryFirst(`
            SELECT COUNT(*)::int AS count
            FROM bookings
            WHERE car_id = $1
              AND return_at > $2
              AND status NOT IN ('cancelled', 'completed')
        `, [carId, nowIso]);
    return row?.count ?? 0;
}
export async function deleteFavoritesByCarId(carId) {
    await execute(`
            DELETE FROM user_favorites
            WHERE car_id = $1
        `, [carId]);
}
export async function deleteCarRecord(id) {
    await execute(`
            DELETE FROM cars
            WHERE id = $1
        `, [id]);
}
export async function updateCarCityRecord(id, cityId, updatedAt) {
    await execute(`
            UPDATE cars
            SET
                city_id = $1,
                updated_at = $2
            WHERE id = $3
        `, [cityId, updatedAt, id]);
}
export async function updateCarArchiveRecord(id, isArchived, updatedAt) {
    await execute(`
            UPDATE cars
            SET
                is_archived = $1,
                updated_at = $2
            WHERE id = $3
        `, [isArchived ? 1 : 0, updatedAt, id]);
}
export async function listCarCategories() {
    return queryRows(`
            SELECT id, slug, name, seo_title AS "seoTitle", seo_text AS "seoText", sort_order AS "sortOrder"
            FROM car_categories
            ORDER BY sort_order ASC, name ASC
        `);
}
export async function listCarCities() {
    return queryRows(`
            SELECT id, name, subdomain, seo_title AS "seoTitle", seo_text AS "seoText", address, phone, email, map, sort_order AS "sortOrder"
            FROM car_cities
            ORDER BY sort_order ASC, name ASC
        `);
}
export async function listCarBrands() {
    return queryRows(`
            SELECT id, slug, name, image_url AS "imageUrl", seo_title AS "seoTitle", seo_text AS "seoText", sort_order AS "sortOrder"
            FROM car_brands
            ORDER BY sort_order ASC, name ASC
        `);
}
export async function listCarColors() {
    return queryRows(`
            SELECT id, name, slug, hex, sort_order AS "sortOrder"
            FROM car_colors
            ORDER BY sort_order ASC, name ASC
        `);
}
export async function listCarBodyTypes() {
    return queryRows(`
            SELECT id, name, slug, sort_order AS "sortOrder"
            FROM car_body_types
            ORDER BY sort_order ASC, name ASC
        `);
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
        isArchived: Boolean(row.is_archived),
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
