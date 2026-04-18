import { execute, queryRows } from "../../db/database.js";
import type { PoolClient } from "pg";

export type BookingRecord = {
    id: string;
    userId: string;
    carId: string;
    status: string;
    paymentStatus: string;
    fullName: string;
    phone: string;
    email: string;
    pickupAt: string;
    returnAt: string;
    rentalDays: number;
    pricePerDay: number;
    totalPrice: number;
    pickupLocationType: string;
    pickupAddress: string;
    returnAddress: string;
    returnCityId: string | null;
    createdAt: string;
    updatedAt: string;
};

export async function createBookingRecord(
    booking: BookingRecord,
    client?: PoolClient,
) {
    await execute(
        `
            INSERT INTO bookings (
                id, user_id, car_id, status, payment_status, full_name, phone, email, pickup_at, return_at,
                rental_days, price_per_day, total_price, pickup_location_type, pickup_address,
                return_address, return_city_id, created_at, updated_at
            )
            VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
                $11, $12, $13, $14, $15, $16, $17, $18, $19
            )
        `,
        [
            booking.id,
            booking.userId,
            booking.carId,
            booking.status,
            booking.paymentStatus,
            booking.fullName,
            booking.phone,
            booking.email,
            booking.pickupAt,
            booking.returnAt,
            booking.rentalDays,
            booking.pricePerDay,
            booking.totalPrice,
            booking.pickupLocationType,
            booking.pickupAddress,
            booking.returnAddress,
            booking.returnCityId,
            booking.createdAt,
            booking.updatedAt,
        ],
        client,
    );

    return booking;
}

type BookingListRow = {
    id: string;
    user_id: string;
    car_id: string;
    status: string;
    payment_status: string;
    full_name: string;
    phone: string;
    email: string;
    user_first_name: string;
    user_last_name: string;
    user_phone: string;
    user_email: string;
    pickup_at: string;
    return_at: string;
    rental_days: number;
    price_per_day: number;
    total_price: number;
    pickup_location_type: string;
    pickup_address: string;
    return_address: string;
    return_city_id: string | null;
    created_at: string;
    updated_at: string;
    account_auth_status: string;
    city_id: string;
    city_name: string;
    return_city_name: string | null;
    car_title: string;
    car_public_slug: string;
    car_media_urls: string;
    brand_name: string;
    category_name: string;
    body_type_name: string | null;
    fuel_type: string;
    transmission_type: string;
    seat_count: number | null;
};

export type BookingListItem = {
    id: string;
    userId: string;
    carId: string;
    status: string;
    paymentStatus: string;
    fullName: string;
    phone: string;
    email: string;
    pickupAt: string;
    returnAt: string;
    rentalDays: number;
    pricePerDay: number;
    totalPrice: number;
    pickupLocationType: string;
    pickupAddress: string;
    returnAddress: string;
    returnCityId: string | null;
    createdAt: string;
    updatedAt: string;
    accountAuthStatus: string;
    cityId: string;
    cityName: string;
    returnCityName: string | null;
    carTitle: string;
    carPublicSlug: string;
    carImageUrl: string | null;
    brandName: string;
    categoryName: string;
    bodyTypeName: string | null;
    fuelType: string;
    transmissionType: string;
    seatCount: number | null;
};

export async function listBookings(userId?: string) {
    const rows = await queryRows<BookingListRow>(
        `
            SELECT
                b.id,
                b.user_id,
                b.car_id,
                b.status,
                b.payment_status,
                b.full_name,
                b.phone,
                b.email,
                u.first_name AS user_first_name,
                u.last_name AS user_last_name,
                u.phone AS user_phone,
                u.email AS user_email,
                b.pickup_at,
                b.return_at,
                b.rental_days,
                b.price_per_day,
                b.total_price,
                b.pickup_location_type,
                b.pickup_address,
                b.return_address,
                b.return_city_id,
                b.created_at,
                b.updated_at,
                u.auth_status AS account_auth_status,
                city.id AS city_id,
                city.name AS city_name,
                return_city.name AS return_city_name,
                c.title AS car_title,
                c.public_slug AS car_public_slug,
                c.media_urls AS car_media_urls,
                brand.name AS brand_name,
                category.name AS category_name,
                body_type.name AS body_type_name,
                c.fuel_type,
                c.transmission_type,
                c.seat_count
            FROM bookings b
            INNER JOIN users u ON u.id = b.user_id
            INNER JOIN cars c ON c.id = b.car_id
            INNER JOIN car_cities city ON city.id = c.city_id
            LEFT JOIN car_cities return_city ON return_city.id = b.return_city_id
            INNER JOIN car_brands brand ON brand.id = c.brand_id
            INNER JOIN car_categories category ON category.id = c.category_id
            LEFT JOIN car_body_types body_type ON body_type.id = c.body_type_id
            WHERE ($1::text IS NULL OR b.user_id = $1)
            ORDER BY b.created_at DESC
        `,
        [userId ?? null],
    );

    return rows.map((row) => {
        const mediaUrls = safeParseMediaUrls(row.car_media_urls);

        return {
            id: row.id,
            userId: row.user_id,
            carId: row.car_id,
            status: row.status,
            paymentStatus: row.payment_status,
            fullName: `${row.user_first_name} ${row.user_last_name}`.trim(),
            phone: row.user_phone,
            email: row.user_email,
            pickupAt: row.pickup_at,
            returnAt: row.return_at,
            rentalDays: row.rental_days,
            pricePerDay: row.price_per_day,
            totalPrice: row.total_price,
            pickupLocationType: row.pickup_location_type,
            pickupAddress: row.pickup_address,
            returnAddress: row.return_address,
            returnCityId: row.return_city_id,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            accountAuthStatus: row.account_auth_status,
            cityId: row.city_id,
            cityName: row.city_name,
            returnCityName: row.return_city_name,
            carTitle: row.car_title,
            carPublicSlug: row.car_public_slug,
            carImageUrl: mediaUrls[0] ?? null,
            brandName: row.brand_name,
            categoryName: row.category_name,
            bodyTypeName: row.body_type_name,
            fuelType: row.fuel_type,
            transmissionType: row.transmission_type,
            seatCount: row.seat_count,
        } satisfies BookingListItem;
    });
}

function safeParseMediaUrls(value: string) {
    try {
        const parsed = JSON.parse(value) as unknown;
        return Array.isArray(parsed)
            ? parsed.filter((item): item is string => typeof item === "string")
            : [];
    } catch {
        return [];
    }
}
