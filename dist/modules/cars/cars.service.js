import { z } from "zod";
import { createCarRecord, findCarById, findCarByPublicSlug, listCarBodyTypes, listCarBrands, listCarCategories, listCarCities, listCarColors, listCars, updateCarRecord, } from "./cars.repository.js";
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
        categories: listCarCategories(),
        cities: listCarCities(),
        brands: listCarBrands(),
        colors: listCarColors(),
        bodyTypes: listCarBodyTypes(),
    };
}
export async function getCarsForPanel() {
    const lookups = buildCarLookups();
    return listCars().map((car) => sanitizeCar(car, lookups));
}
export async function getCarForPanel(id) {
    const car = findCarById(id);
    if (!car) {
        throw createError(404, "Автомобиль не найден");
    }
    return sanitizeCar(car, buildCarLookups());
}
export async function getCarsForPublic() {
    const lookups = buildCarLookups();
    return listCars().map((car) => sanitizeCar(car, lookups));
}
export async function getCarByPublicSlug(publicSlug) {
    const car = findCarByPublicSlug(publicSlug);
    if (!car) {
        throw createError(404, "Автомобиль не найден");
    }
    return sanitizeCar(car, buildCarLookups());
}
export async function createCar(payload) {
    const data = carPayloadSchema.parse(payload);
    const now = new Date().toISOString();
    const id = crypto.randomUUID();
    const publicSlug = generateUniqueCarSlug(data.title);
    const lookups = buildCarLookups();
    return sanitizeCar(createCarRecord({
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
        mediaUrls: data.mediaUrls,
        createdAt: now,
        updatedAt: now,
    }), lookups);
}
export async function updateCar(id, payload) {
    const data = carPayloadSchema.parse(payload);
    const car = findCarById(id);
    if (!car) {
        throw createError(404, "Автомобиль не найден");
    }
    const shouldRegenerateSlug = car.title !== data.title;
    const publicSlug = shouldRegenerateSlug
        ? generateUniqueCarSlug(data.title, car.id)
        : car.publicSlug;
    const lookups = buildCarLookups();
    return sanitizeCar(updateCarRecord({
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
        mediaUrls: data.mediaUrls,
        updatedAt: new Date().toISOString(),
    }), lookups);
}
export function sanitizeCar(car, lookups = buildCarLookups()) {
    return {
        id: car.id,
        publicSlug: car.publicSlug,
        rentProgId: car.rentProgId ?? undefined,
        title: car.title,
        categoryId: car.categoryId,
        categoryName: lookups.categories.get(car.categoryId) ?? car.categoryId,
        cityId: car.cityId,
        cityName: lookups.cities.get(car.cityId) ?? car.cityId,
        brandId: car.brandId,
        brandName: lookups.brands.get(car.brandId) ?? car.brandId,
        colorId: car.colorId,
        colorName: lookups.colors.get(car.colorId) ?? car.colorId,
        bodyTypeId: car.bodyTypeId ?? undefined,
        bodyTypeName: car.bodyTypeId
            ? (lookups.bodyTypes.get(car.bodyTypeId) ?? car.bodyTypeId)
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
        mediaUrls: car.mediaUrls,
        createdAt: car.createdAt,
        updatedAt: car.updatedAt,
    };
}
function generateUniqueCarSlug(title, currentCarId) {
    const baseSlug = slugify(title) || "car";
    let candidate = baseSlug;
    let suffix = 2;
    while (true) {
        const existingCar = findCarByPublicSlug(candidate);
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
function buildCarLookups() {
    return {
        categories: new Map(listCarCategories().map((option) => [option.id, option.name])),
        cities: new Map(listCarCities().map((option) => [option.id, option.name])),
        brands: new Map(listCarBrands().map((option) => [option.id, option.name])),
        colors: new Map(listCarColors().map((option) => [option.id, option.name])),
        bodyTypes: new Map(listCarBodyTypes().map((option) => [option.id, option.name])),
    };
}
