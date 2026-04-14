import { database } from "../../db/database.js";
const listFavoriteCarIdsStatement = database.prepare(`
    SELECT car_id
    FROM user_favorites
    WHERE user_id = ?
    ORDER BY created_at DESC
`);
const insertFavoriteStatement = database.prepare(`
    INSERT OR IGNORE INTO user_favorites (user_id, car_id, created_at)
    VALUES (?, ?, ?)
`);
const deleteFavoriteStatement = database.prepare(`
    DELETE FROM user_favorites
    WHERE user_id = ? AND car_id = ?
`);
const hasFavoriteStatement = database.prepare(`
    SELECT user_id, car_id, created_at
    FROM user_favorites
    WHERE user_id = ? AND car_id = ?
`);
export function listFavoriteCarIds(userId) {
    const rows = listFavoriteCarIdsStatement.all(userId);
    return rows.map((row) => row.car_id);
}
export function addFavoriteRecord(userId, carId, createdAt) {
    insertFavoriteStatement.run(userId, carId, createdAt);
}
export function removeFavoriteRecord(userId, carId) {
    deleteFavoriteStatement.run(userId, carId);
}
export function hasFavoriteRecord(userId, carId) {
    return Boolean(hasFavoriteStatement.get(userId, carId));
}
