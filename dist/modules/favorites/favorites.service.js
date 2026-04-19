import { findCarById, listCars } from "../cars/cars.repository.js";
import { sanitizeCar } from "../cars/cars.service.js";
import { createError } from "../auth/auth.service.js";
import { addFavoriteRecord, hasFavoriteRecord, listFavoriteCarIds, removeFavoriteRecord, } from "./favorites.repository.js";
export async function getFavoriteCars(userId) {
    const favoriteIds = await listFavoriteCarIds(userId);
    const idSet = new Set(favoriteIds);
    return (await listCars())
        .filter((car) => idSet.has(car.id) && !car.isArchived)
        .sort((left, right) => favoriteIds.indexOf(left.id) - favoriteIds.indexOf(right.id))
        .map((car) => sanitizeCar(car));
}
export async function getFavoriteCarIds(userId) {
    return await listFavoriteCarIds(userId);
}
export async function addFavorite(userId, carId) {
    const car = await findCarById(carId);
    if (!car) {
        throw createError(404, "Автомобиль не найден");
    }
    if (car.isArchived) {
        throw createError(404, "Автомобиль не найден");
    }
    if (!(await hasFavoriteRecord(userId, carId))) {
        await addFavoriteRecord(userId, carId, new Date().toISOString());
    }
    return getFavoriteCarIds(userId);
}
export async function removeFavorite(userId, carId) {
    await removeFavoriteRecord(userId, carId);
    return getFavoriteCarIds(userId);
}
