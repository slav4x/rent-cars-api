import { z } from "zod";
import { withTransaction } from "../../db/database.js";
import { hashPassword } from "../../lib/password.js";
import { findCarById } from "../cars/cars.repository.js";
import {
    createUserRecord,
    findUserByEmail,
    findUserById,
    findUserByPhone,
    updateUserRecord,
    type StoredUser,
} from "../auth/auth.repository.js";
import {
    createBookingRecord,
    listBookings,
    type BookingListItem,
} from "./bookings.repository.js";
import { createError } from "../auth/auth.service.js";

const bookingPayloadSchema = z
    .object({
        carId: z.string().trim().min(1, "Автомобиль не выбран"),
        fullName: z.string().trim().min(2, "Укажите имя и фамилию"),
        phone: z.string().trim().min(10, "Введите корректный номер телефона"),
        email: z
            .email("Введите корректный email")
            .transform((value) => value.trim().toLowerCase()),
        pickupAt: z.string().datetime("Выберите дату и время выдачи"),
        returnAt: z.string().datetime("Выберите дату и время возврата"),
        rentalDays: z.coerce.number().int().positive("Выберите срок аренды"),
        pickupLocationType: z.enum(["office", "custom"]),
        pickupAddress: z.string().trim().min(3, "Укажите адрес выдачи"),
        returnAddress: z.string().trim().min(3, "Укажите адрес возврата"),
        returnCityId: z.string().trim().optional(),
    })
    .strict();

type CreateBookingContext = {
    userId?: string;
};

export async function createBooking(
    payload: unknown,
    context: CreateBookingContext = {},
) {
    const data = bookingPayloadSchema.parse(payload);
    const car = await findCarById(data.carId);

    if (!car) {
        throw createError(404, "Автомобиль не найден");
    }

    const pickupAtMs = Date.parse(data.pickupAt);
    const returnAtMs = Date.parse(data.returnAt);

    if (
        Number.isNaN(pickupAtMs) ||
        Number.isNaN(returnAtMs) ||
        returnAtMs <= pickupAtMs
    ) {
        throw createError(400, "Некорректный период аренды");
    }

    const now = new Date().toISOString();
    const normalizedPhone = normalizePhoneForLookup(data.phone);

    return withTransaction(async (client) => {
        const user = await resolveBookingUser(
            {
                userId: context.userId,
                fullName: data.fullName,
                phone: data.phone.trim(),
                normalizedPhone,
                email: data.email,
                now,
            },
            client,
        );
        const pricePerDay = resolvePricePerDay(car, data.rentalDays);
        const booking = await createBookingRecord(
            {
                id: crypto.randomUUID(),
                userId: user.id,
                carId: car.id,
                status: "pending",
                paymentStatus: "unpaid",
                fullName: data.fullName.trim(),
                phone: data.phone.trim(),
                email: data.email,
                pickupAt: data.pickupAt,
                returnAt: data.returnAt,
                rentalDays: data.rentalDays,
                pricePerDay,
                totalPrice: pricePerDay * data.rentalDays,
                pickupLocationType: data.pickupLocationType,
                pickupAddress: data.pickupAddress.trim(),
                returnAddress: data.returnAddress.trim(),
                returnCityId: normalizeOptional(data.returnCityId),
                createdAt: now,
                updatedAt: now,
            },
            client,
        );

        await updateUserRecord(
            {
                ...user,
                updatedAt: now,
                lastBookingAt: now,
                lastActivityAt: now,
            },
            client,
        );

        return {
            id: booking.id,
            userId: booking.userId,
            status: booking.status,
            totalPrice: booking.totalPrice,
            pricePerDay: booking.pricePerDay,
        };
    });
}

export async function getAccountBookings(userId: string) {
    return (await listBookings(userId)).map(sanitizeBooking);
}

export async function getPanelBookings() {
    return (await listBookings()).map(sanitizeBooking);
}

async function resolveBookingUser(
    params: {
        userId?: string;
        fullName: string;
        phone: string;
        normalizedPhone: string;
        email: string;
        now: string;
    },
    client: Parameters<typeof createUserRecord>[1],
) {
    const { firstName, lastName } = splitFullName(params.fullName);
    const existingEmailUser = await findUserByEmail(params.email);
    const existingPhoneUser = await findUserByPhone(params.normalizedPhone);

    if (
        existingEmailUser &&
        existingPhoneUser &&
        existingEmailUser.id !== existingPhoneUser.id
    ) {
        throw createError(
            409,
            "Найдено несколько пользователей с указанными контактами",
        );
    }

    if (params.userId) {
        const authUser = await findUserById(params.userId);

        if (!authUser) {
            throw createError(401, "Требуется авторизация");
        }

        if (
            (existingEmailUser && existingEmailUser.id !== authUser.id) ||
            (existingPhoneUser && existingPhoneUser.id !== authUser.id)
        ) {
            throw createError(
                409,
                "Эти контакты уже привязаны к другому пользователю",
            );
        }

        return authUser;
    }

    const existingUser = existingEmailUser ?? existingPhoneUser;

    if (existingUser) {
        return existingUser;
    }

    return createUserRecord(
        {
            id: crypto.randomUUID(),
            firstName,
            lastName,
            phone: params.phone,
            email: params.email,
            password: hashPassword(crypto.randomUUID()),
            avatarUrl: null,
            birthDate: null,
            authStatus: "inactive",
            role: "guest",
            createdAt: params.now,
            updatedAt: params.now,
            lastLoginAt: null,
            lastBookingAt: null,
            lastActivityAt: params.now,
        },
        client,
    );
}

function splitFullName(fullName: string) {
    const parts = fullName
        .trim()
        .split(/\s+/)
        .filter(Boolean);
    const firstName = parts[0] ?? "Гость";
    const lastName = parts.slice(1).join(" ").trim() || "Гость";

    return { firstName, lastName };
}

function resolvePricePerDay(
    car: Awaited<ReturnType<typeof findCarById>> extends infer T
        ? NonNullable<T>
        : never,
    rentalDays: number,
) {
    if (rentalDays >= 60) {
        return car.priceFrom60Days;
    }

    if (rentalDays >= 30) {
        return car.priceFrom30Days;
    }

    if (rentalDays >= 7) {
        return car.priceFrom7Days;
    }

    if (rentalDays >= 2) {
        return car.price2to7Days;
    }

    return car.pricePerDay;
}

function normalizeOptional(value?: string) {
    if (value === undefined) {
        return null;
    }

    const trimmed = value.trim();
    return trimmed || null;
}

function normalizePhoneForLookup(value: string) {
    const digits = value.replace(/\D/g, "");

    if (!digits) {
        return "";
    }

    if (digits[0] === "8") {
        return `7${digits.slice(1, 11)}`;
    }

    if (digits[0] === "7") {
        return digits.slice(0, 11);
    }

    return `7${digits.slice(0, 10)}`;
}

function sanitizeBooking(booking: BookingListItem) {
    return {
        id: booking.id,
        userId: booking.userId,
        carId: booking.carId,
        status: getDerivedBookingStatus(booking),
        rawStatus: booking.status,
        paymentStatus: booking.paymentStatus,
        fullName: booking.fullName,
        phone: booking.phone,
        email: booking.email,
        pickupAt: booking.pickupAt,
        returnAt: booking.returnAt,
        rentalDays: booking.rentalDays,
        pricePerDay: booking.pricePerDay,
        totalPrice: booking.totalPrice,
        pickupLocationType: booking.pickupLocationType,
        pickupAddress: booking.pickupAddress,
        returnAddress: booking.returnAddress,
        returnCityId: booking.returnCityId ?? undefined,
        returnCityName: booking.returnCityName ?? undefined,
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt,
        accountAuthStatus: booking.accountAuthStatus,
        cityId: booking.cityId,
        cityName: booking.cityName,
        carTitle: booking.carTitle,
        carPublicSlug: booking.carPublicSlug,
        carImageUrl: booking.carImageUrl ?? undefined,
        brandName: booking.brandName,
        categoryName: booking.categoryName,
        bodyTypeName: booking.bodyTypeName ?? undefined,
        fuelType: booking.fuelType,
        transmissionType: booking.transmissionType,
        seatCount: booking.seatCount ?? undefined,
    };
}

function getDerivedBookingStatus(booking: BookingListItem) {
    if (Date.parse(booking.returnAt) <= Date.now()) {
        return "history";
    }

    if (
        booking.accountAuthStatus !== "approved" ||
        booking.paymentStatus !== "paid"
    ) {
        return "pending";
    }

    return "upcoming";
}
