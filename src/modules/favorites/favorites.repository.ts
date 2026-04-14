import { execute, queryFirst, queryRows } from "../../db/database.js";

type FavoriteRow = {
    user_id: string;
    car_id: string;
    created_at: string;
};

export async function listFavoriteCarIds(userId: string) {
    const rows = await queryRows<{ car_id: string }>(
        `
            SELECT car_id
            FROM user_favorites
            WHERE user_id = $1
            ORDER BY created_at DESC
        `,
        [userId],
    );
    return rows.map((row: { car_id: string }) => row.car_id);
}

export async function addFavoriteRecord(
    userId: string,
    carId: string,
    createdAt: string,
) {
    await execute(
        `
            INSERT INTO user_favorites (user_id, car_id, created_at)
            VALUES ($1, $2, $3)
            ON CONFLICT (user_id, car_id) DO NOTHING
        `,
        [userId, carId, createdAt],
    );
}

export async function removeFavoriteRecord(userId: string, carId: string) {
    await execute(
        `
            DELETE FROM user_favorites
            WHERE user_id = $1 AND car_id = $2
        `,
        [userId, carId],
    );
}

export async function hasFavoriteRecord(userId: string, carId: string) {
    const row = await queryFirst<FavoriteRow>(
        `
            SELECT user_id, car_id, created_at
            FROM user_favorites
            WHERE user_id = $1 AND car_id = $2
        `,
        [userId, carId],
    );
    return Boolean(row);
}
