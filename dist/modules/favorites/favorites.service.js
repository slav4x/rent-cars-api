import { findCarById, listCars } from "../cars/cars.repository.js";
import { sanitizeCar } from "../cars/cars.service.js";
import { createError } from "../auth/auth.service.js";
import { addFavoriteRecord, hasFavoriteRecord, listFavoriteCarIds, removeFavoriteRecord, } from "./favorites.repository.js";
export async function getFavoriteCars(userId) {
    const favoriteIds = listFavoriteCarIds(userId);
    const idSet = new Set(favoriteIds);
    return listCars()
        .filter((car) => idSet.has(car.id))
        .sort((left, right) => favoriteIds.indexOf(left.id) - favoriteIds.indexOf(right.id))
        .map((car) => sanitizeCar(car));
}
export async function getFavoriteCarIds(userId) {
    return listFavoriteCarIds(userId);
}
export async function addFavorite(userId, carId) {
    const car = findCarById(carId);
    if (!car) {
        throw createError(404, "Автомобиль не найден");
    }
    if (!hasFavoriteRecord(userId, carId)) {
        addFavoriteRecord(userId, carId, new Date().toISOString());
    }
    return getFavoriteCarIds(userId);
}
export async function removeFavorite(userId, carId) {
    removeFavoriteRecord(userId, carId);
    return getFavoriteCarIds(userId);
}
