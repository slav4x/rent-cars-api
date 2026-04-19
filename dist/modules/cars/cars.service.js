import { z } from "zod";
import { countActiveBookingsByCarId, countBookingsByCarId, createCarRecord, deleteCarRecord, deleteFavoritesByCarId, findCarById, findCarByPublicSlug, listCarBodyTypes, listCarBrands, listCarCategories, listCarCities, listCarColors, listCars, updateCarArchiveRecord, updateCarCityRecord, updateCarRecord, } from "./cars.repository.js";
import { createError } from "../auth/auth.service.js";
const fuelTypeSchema = z.enum(["petrol", "diesel", "hybrid"]);
const transmissionTypeSchema = z.enum(["automatic", "robot", "manual"]);
const carPayloadSchema = z
    .object({
    title: z.string().trim().min(1, "Укажите название автомобиля"),
    rentProgId: z.string().trim().optional(),
    categoryId: z.string().trim().min(1, "Выберите категорию"),
    cityId: z.string().trim().min(1, "Выберите город"),
    brandId: z.string().trim().min(1, "Выберите марку"),
    colorId: z.string().trim().min(1, "Выберите цвет"),
    bodyTypeId: z.string().trim().min(1, "Выберите тип кузова"),
    seatCount: z.coerce.number().int().positive().optional(),
    videoUrl: z.string().trim().optional(),
    horsepower: z.coerce.number().int().nonnegative().optional(),
    zeroToHundred: z.coerce.number().nonnegative().optional(),
    fuelType: fuelTypeSchema,
    transmissionType: transmissionTypeSchema,
    descriptionHtml: z.string().trim().default("<p></p>"),
    pricePerDay: z.coerce.number().int().nonnegative().default(0),
    price2to7Days: z.coerce.number().int().nonnegative().default(0),
    priceFrom7Days: z.coerce.number().int().nonnegative().default(0),
    priceFrom30Days: z.coerce.number().int().nonnegative().default(0),
    priceFrom60Days: z.coerce.number().int().nonnegative().default(0),
    overagePricePerKm: z.coerce.number().int().nonnegative().default(0),
    seoTitle: z.string().trim().optional(),
    seoDescriptionHtml: z.string().trim().default("<p></p>"),
    mediaUrls: z.array(z.string().trim()).default([]),
})
    .strict();
export async function getCarOptions() {
    return {
        categories: await listCarCategories(),
        cities: await listCarCities(),
        brands: await listCarBrands(),
        colors: await listCarColors(),
        bodyTypes: await listCarBodyTypes(),
    };
}
export async function getPublicCarCities() {
    return listCarCities();
}
export async function getPublicCarCategories() {
    return listCarCategories();
}
export async function getPublicCarBrands() {
    return listCarBrands();
}
export async function getCarsForPanel() {
    const lookups = await buildCarLookups();
    return (await listCars()).map((car) => sanitizeCar(car, lookups));
}
export async function getCarForPanel(id) {
    const car = await findCarById(id);
    if (!car) {
        throw createError(404, "Автомобиль не найден");
    }
    return sanitizeCar(car, await buildCarLookups());
}
export async function getCarsForPublic() {
    const lookups = await buildCarLookups();
    return (await listCars())
        .filter((car) => !car.isArchived)
        .map((car) => sanitizeCar(car, lookups));
}
export async function getCarByPublicSlug(publicSlug) {
    const car = await findCarByPublicSlug(publicSlug);
    if (!car) {
        throw createError(404, "Автомобиль не найден");
    }
    if (car.isArchived) {
        throw createError(404, "Автомобиль не найден");
    }
    return sanitizeCar(car, await buildCarLookups());
}
export async function createCar(payload) {
    const data = carPayloadSchema.parse(payload);
    const now = new Date().toISOString();
    const id = crypto.randomUUID();
    const publicSlug = await generateUniqueCarSlug(data.title);
    const lookups = await buildCarLookups();
    return sanitizeCar(await createCarRecord({
        id,
        publicSlug,
        rentProgId: normalizeOptional(data.rentProgId),
        title: data.title,
        categoryId: data.categoryId,
        cityId: data.cityId,
        brandId: data.brandId,
        colorId: data.colorId,
        bodyTypeId: data.bodyTypeId,
        seatCount: data.seatCount ?? null,
        videoUrl: normalizeOptional(data.videoUrl),
        horsepower: data.horsepower ?? null,
        zeroToHundred: data.zeroToHundred ?? null,
        fuelType: data.fuelType,
        transmissionType: data.transmissionType,
        descriptionHtml: data.descriptionHtml || "<p></p>",
        pricePerDay: data.pricePerDay,
        price2to7Days: data.price2to7Days,
        priceFrom7Days: data.priceFrom7Days,
        priceFrom30Days: data.priceFrom30Days,
        priceFrom60Days: data.priceFrom60Days,
        overagePricePerKm: data.overagePricePerKm,
        seoTitle: normalizeOptional(data.seoTitle),
        seoDescriptionHtml: data.seoDescriptionHtml || "<p></p>",
        isArchived: false,
        mediaUrls: data.mediaUrls,
        createdAt: now,
        updatedAt: now,
    }), lookups);
}
export async function updateCar(id, payload) {
    const data = carPayloadSchema.parse(payload);
    const car = await findCarById(id);
    if (!car) {
        throw createError(404, "Автомобиль не найден");
    }
    const shouldRegenerateSlug = car.title !== data.title;
    const publicSlug = shouldRegenerateSlug
        ? await generateUniqueCarSlug(data.title, car.id)
        : car.publicSlug;
    const lookups = await buildCarLookups();
    return sanitizeCar(await updateCarRecord({
        ...car,
        publicSlug,
        rentProgId: normalizeOptional(data.rentProgId),
        title: data.title,
        categoryId: data.categoryId,
        cityId: data.cityId,
        brandId: data.brandId,
        colorId: data.colorId,
        bodyTypeId: data.bodyTypeId,
        seatCount: data.seatCount ?? null,
        videoUrl: normalizeOptional(data.videoUrl),
        horsepower: data.horsepower ?? null,
        zeroToHundred: data.zeroToHundred ?? null,
        fuelType: data.fuelType,
        transmissionType: data.transmissionType,
        descriptionHtml: data.descriptionHtml || "<p></p>",
        pricePerDay: data.pricePerDay,
        price2to7Days: data.price2to7Days,
        priceFrom7Days: data.priceFrom7Days,
        priceFrom30Days: data.priceFrom30Days,
        priceFrom60Days: data.priceFrom60Days,
        overagePricePerKm: data.overagePricePerKm,
        seoTitle: normalizeOptional(data.seoTitle),
        seoDescriptionHtml: data.seoDescriptionHtml || "<p></p>",
        isArchived: car.isArchived,
        mediaUrls: data.mediaUrls,
        updatedAt: new Date().toISOString(),
    }), lookups);
}
export async function removeCar(id) {
    const car = await findCarById(id);
    if (!car) {
        throw createError(404, "Автомобиль не найден");
    }
    const bookingsCount = await countBookingsByCarId(id);
    if (bookingsCount > 0) {
        throw createError(409, "Нельзя удалить автомобиль, у которого есть бронирования");
    }
    await deleteFavoritesByCarId(id);
    await deleteCarRecord(id);
    return { ok: true };
}
export async function moveCarToCity(id, cityId) {
    const car = await findCarById(id);
    if (!car) {
        throw createError(404, "Автомобиль не найден");
    }
    const cities = await listCarCities();
    const cityExists = cities.some((city) => city.id === cityId);
    if (!cityExists) {
        throw createError(404, "Город не найден");
    }
    const now = new Date().toISOString();
    const activeBookingsCount = await countActiveBookingsByCarId(id, now);
    if (activeBookingsCount > 0) {
        throw createError(409, "Нельзя переместить автомобиль, у которого есть активные бронирования");
    }
    const updatedAt = now;
    await updateCarCityRecord(id, cityId, updatedAt);
    return sanitizeCar({
        ...car,
        cityId,
        updatedAt,
    }, await buildCarLookups());
}
export async function setCarArchiveState(id, isArchived) {
    const car = await findCarById(id);
    if (!car) {
        throw createError(404, "Автомобиль не найден");
    }
    const updatedAt = new Date().toISOString();
    await updateCarArchiveRecord(id, isArchived, updatedAt);
    return sanitizeCar({
        ...car,
        isArchived,
        updatedAt,
    }, await buildCarLookups());
}
export function sanitizeCar(car, lookups) {
    return {
        id: car.id,
        publicSlug: car.publicSlug,
        rentProgId: car.rentProgId ?? undefined,
        title: car.title,
        categoryId: car.categoryId,
        categoryName: lookups?.categories.get(car.categoryId) ?? car.categoryId,
        cityId: car.cityId,
        cityName: lookups?.cities.get(car.cityId) ?? car.cityId,
        citySubdomain: lookups?.citySubdomains.get(car.cityId) ?? undefined,
        brandId: car.brandId,
        brandName: lookups?.brands.get(car.brandId) ?? car.brandId,
        colorId: car.colorId,
        colorName: lookups?.colors.get(car.colorId) ?? car.colorId,
        bodyTypeId: car.bodyTypeId ?? undefined,
        bodyTypeName: car.bodyTypeId
            ? (lookups?.bodyTypes.get(car.bodyTypeId) ?? car.bodyTypeId)
            : undefined,
        seatCount: car.seatCount ?? undefined,
        videoUrl: car.videoUrl ?? undefined,
        horsepower: car.horsepower ?? undefined,
        zeroToHundred: car.zeroToHundred ?? undefined,
        fuelType: car.fuelType,
        transmissionType: car.transmissionType,
        descriptionHtml: car.descriptionHtml,
        pricePerDay: car.pricePerDay,
        price2to7Days: car.price2to7Days,
        priceFrom7Days: car.priceFrom7Days,
        priceFrom30Days: car.priceFrom30Days,
        priceFrom60Days: car.priceFrom60Days,
        overagePricePerKm: car.overagePricePerKm,
        seoTitle: car.seoTitle ?? undefined,
        seoDescriptionHtml: car.seoDescriptionHtml,
        isArchived: car.isArchived,
        mediaUrls: car.mediaUrls,
        createdAt: car.createdAt,
        updatedAt: car.updatedAt,
    };
}
async function generateUniqueCarSlug(title, currentCarId) {
    const baseSlug = slugify(title) || "car";
    let candidate = baseSlug;
    let suffix = 2;
    while (true) {
        const existingCar = await findCarByPublicSlug(candidate);
        if (!existingCar || existingCar.id === currentCarId) {
            return candidate;
        }
        candidate = `${baseSlug}-${suffix}`;
        suffix += 1;
    }
}
function slugify(value) {
    return value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .replace(/-{2,}/g, "-");
}
function normalizeOptional(value) {
    if (value === undefined) {
        return null;
    }
    return value.trim() || null;
}
async function buildCarLookups() {
    return {
        categories: new Map((await listCarCategories()).map((option) => [
            option.id,
            option.name,
        ])),
        cities: new Map((await listCarCities()).map((option) => [
            option.id,
            option.name,
        ])),
        citySubdomains: new Map((await listCarCities()).map((option) => [
            option.id,
            option.subdomain ?? null,
        ])),
        brands: new Map((await listCarBrands()).map((option) => [
            option.id,
            option.name,
        ])),
        colors: new Map((await listCarColors()).map((option) => [
            option.id,
            option.name,
        ])),
        bodyTypes: new Map((await listCarBodyTypes()).map((option) => [
            option.id,
            option.name,
        ])),
    };
}
