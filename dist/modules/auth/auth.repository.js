import { queryFirst, queryRows, execute } from "../../db/database.js";
export async function createUserRecord(user) {
    await execute(`
            INSERT INTO users (
                id, first_name, last_name, phone, email, password, avatar_url, birth_date,
                auth_status, role, created_at, updated_at, last_login_at, last_booking_at, last_activity_at
            )
            VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8,
                $9, $10, $11, $12, $13, $14, $15
            )
        `, [
        user.id,
        user.firstName,
        user.lastName,
        user.phone,
        user.email,
        user.password,
        user.avatarUrl,
        user.birthDate,
        user.authStatus,
        user.role,
        user.createdAt,
        user.updatedAt,
        user.lastLoginAt,
        user.lastBookingAt,
        user.lastActivityAt,
    ]);
    return user;
}
export async function findUserByEmail(email) {
    const row = await queryFirst(`
            SELECT id, first_name, last_name, phone, email, password, avatar_url, birth_date,
                   auth_status, role, created_at, updated_at, last_login_at, last_booking_at, last_activity_at
            FROM users
            WHERE email = $1
        `, [email]);
    return row ? mapUser(row) : null;
}
export async function findUserById(id) {
    const row = await queryFirst(`
            SELECT id, first_name, last_name, phone, email, password, avatar_url, birth_date,
                   auth_status, role, created_at, updated_at, last_login_at, last_booking_at, last_activity_at
            FROM users
            WHERE id = $1
        `, [id]);
    return row ? mapUser(row) : null;
}
export async function listUsers() {
    const rows = await queryRows(`
            SELECT id, first_name, last_name, phone, email, password, avatar_url, birth_date,
                   auth_status, role, created_at, updated_at, last_login_at, last_booking_at, last_activity_at
            FROM users
            ORDER BY created_at DESC
        `);
    return rows.map(mapUser);
}
export async function updateUserRecord(user) {
    await execute(`
            UPDATE users
            SET
                first_name = $1,
                last_name = $2,
                phone = $3,
                email = $4,
                password = $5,
                avatar_url = $6,
                birth_date = $7,
                auth_status = $8,
                role = $9,
                updated_at = $10,
                last_login_at = $11,
                last_booking_at = $12,
                last_activity_at = $13
            WHERE id = $14
        `, [
        user.firstName,
        user.lastName,
        user.phone,
        user.email,
        user.password,
        user.avatarUrl,
        user.birthDate,
        user.authStatus,
        user.role,
        user.updatedAt,
        user.lastLoginAt,
        user.lastBookingAt,
        user.lastActivityAt,
        user.id,
    ]);
    return user;
}
function mapUser(row) {
    return {
        id: row.id,
        firstName: row.first_name,
        lastName: row.last_name,
        phone: row.phone,
        email: row.email,
        password: row.password,
        avatarUrl: row.avatar_url,
        birthDate: row.birth_date,
        authStatus: row.auth_status,
        role: row.role,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        lastLoginAt: row.last_login_at,
        lastBookingAt: row.last_booking_at,
        lastActivityAt: row.last_activity_at,
    };
}
