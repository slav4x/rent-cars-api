import { findCarById, listCars } from "../cars/cars.repository.js";
import type { CarRecord } from "../cars/cars.repository.js";
import { sanitizeCar } from "../cars/cars.service.js";
import { createError } from "../auth/auth.service.js";
import {
    addFavoriteRecord,
    hasFavoriteRecord,
    listFavoriteCarIds,
    removeFavoriteRecord,
} from "./favorites.repository.js";

export async function getFavoriteCars(userId: string) {
    const favoriteIds = await listFavoriteCarIds(userId);
    const idSet = new Set(favoriteIds);

    return (await listCars())
        .filter((car: CarRecord) => idSet.has(car.id) && !car.isArchived)
        .sort(
            (left: CarRecord, right: CarRecord) =>
                favoriteIds.indexOf(left.id) - favoriteIds.indexOf(right.id),
        )
        .map((car: CarRecord) => sanitizeCar(car));
}

export async function getFavoriteCarIds(userId: string) {
    return await listFavoriteCarIds(userId);
}

export async function addFavorite(userId: string, carId: string) {
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

export async function removeFavorite(userId: string, carId: string) {
    await removeFavoriteRecord(userId, carId);
    return getFavoriteCarIds(userId);
}
