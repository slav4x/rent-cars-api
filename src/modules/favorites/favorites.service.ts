import { findCarById, listCars } from "../cars/cars.repository.js";
import { sanitizeCar } from "../cars/cars.service.js";
import { createError } from "../auth/auth.service.js";
import {
    addFavoriteRecord,
    hasFavoriteRecord,
    listFavoriteCarIds,
    removeFavoriteRecord,
} from "./favorites.repository.js";

export async function getFavoriteCars(userId: string) {
    const favoriteIds = listFavoriteCarIds(userId);
    const idSet = new Set(favoriteIds);

    return listCars()
        .filter((car) => idSet.has(car.id))
        .sort(
            (left, right) =>
                favoriteIds.indexOf(left.id) - favoriteIds.indexOf(right.id),
        )
        .map((car) => sanitizeCar(car));
}

export async function getFavoriteCarIds(userId: string) {
    return listFavoriteCarIds(userId);
}

export async function addFavorite(userId: string, carId: string) {
    const car = findCarById(carId);

    if (!car) {
        throw createError(404, "Автомобиль не найден");
    }

    if (!hasFavoriteRecord(userId, carId)) {
        addFavoriteRecord(userId, carId, new Date().toISOString());
    }

    return getFavoriteCarIds(userId);
}

export async function removeFavorite(userId: string, carId: string) {
    removeFavoriteRecord(userId, carId);
    return getFavoriteCarIds(userId);
}
