import { database } from "../../db/database.js";

export type StoredUser = {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    password: string;
    avatarUrl: string | null;
    birthDate: string | null;
    authStatus: string;
    role: string;
    createdAt: string;
    updatedAt: string;
    lastLoginAt: string | null;
    lastBookingAt: string | null;
    lastActivityAt: string | null;
};

type UserRow = {
    id: string;
    first_name: string;
    last_name: string;
    phone: string;
    email: string;
    password: string;
    avatar_url: string | null;
    birth_date: string | null;
    auth_status: string;
    role: string;
    created_at: string;
    updated_at: string;
    last_login_at: string | null;
    last_booking_at: string | null;
    last_activity_at: string | null;
};

const insertUserStatement = database.prepare(`
    INSERT INTO users (
        id, first_name, last_name, phone, email, password, avatar_url, birth_date, auth_status, role, created_at, updated_at, last_login_at, last_booking_at, last_activity_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const findUserByEmailStatement = database.prepare(`
    SELECT id, first_name, last_name, phone, email, password, avatar_url, birth_date, auth_status, role, created_at, updated_at, last_login_at, last_booking_at, last_activity_at
    FROM users
    WHERE email = ?
`);

const findUserByIdStatement = database.prepare(`
    SELECT id, first_name, last_name, phone, email, password, avatar_url, birth_date, auth_status, role, created_at, updated_at, last_login_at, last_booking_at, last_activity_at
    FROM users
    WHERE id = ?
`);

const listUsersStatement = database.prepare(`
    SELECT id, first_name, last_name, phone, email, password, avatar_url, birth_date, auth_status, role, created_at, updated_at, last_login_at, last_booking_at, last_activity_at
    FROM users
    ORDER BY created_at DESC
`);

const updateUserStatement = database.prepare(`
    UPDATE users
    SET
        first_name = ?,
        last_name = ?,
        phone = ?,
        email = ?,
        password = ?,
        avatar_url = ?,
        birth_date = ?,
        auth_status = ?,
        role = ?,
        updated_at = ?,
        last_login_at = ?,
        last_booking_at = ?,
        last_activity_at = ?
    WHERE id = ?
`);

export function createUserRecord(user: StoredUser) {
    insertUserStatement.run(
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
    );

    return user;
}

export function findUserByEmail(email: string) {
    const row = findUserByEmailStatement.get(email) as UserRow | undefined;
    return row ? mapUser(row) : null;
}

export function findUserById(id: string) {
    const row = findUserByIdStatement.get(id) as UserRow | undefined;
    return row ? mapUser(row) : null;
}

export function listUsers() {
    const rows = listUsersStatement.all() as UserRow[];
    return rows.map(mapUser);
}

export function updateUserRecord(user: StoredUser) {
    updateUserStatement.run(
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
    );

    return user;
}

function mapUser(row: UserRow): StoredUser {
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
