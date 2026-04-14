import { execute, queryFirst, queryRows } from "../../db/database.js";
export async function listFavoriteCarIds(userId) {
    const rows = await queryRows(`
            SELECT car_id
            FROM user_favorites
            WHERE user_id = $1
            ORDER BY created_at DESC
        `, [userId]);
    return rows.map((row) => row.car_id);
}
export async function addFavoriteRecord(userId, carId, createdAt) {
    await execute(`
            INSERT INTO user_favorites (user_id, car_id, created_at)
            VALUES ($1, $2, $3)
            ON CONFLICT (user_id, car_id) DO NOTHING
        `, [userId, carId, createdAt]);
}
export async function removeFavoriteRecord(userId, carId) {
    await execute(`
            DELETE FROM user_favorites
            WHERE user_id = $1 AND car_id = $2
        `, [userId, carId]);
}
export async function hasFavoriteRecord(userId, carId) {
    const row = await queryFirst(`
            SELECT user_id, car_id, created_at
            FROM user_favorites
            WHERE user_id = $1 AND car_id = $2
        `, [userId, carId]);
    return Boolean(row);
}
