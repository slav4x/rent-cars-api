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
};

const insertUserStatement = database.prepare(`
    INSERT INTO users (
        id, first_name, last_name, phone, email, password, avatar_url, birth_date, auth_status, role, created_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const findUserByEmailStatement = database.prepare(`
    SELECT id, first_name, last_name, phone, email, password, avatar_url, birth_date, auth_status, role, created_at
    FROM users
    WHERE email = ?
`);

const listUsersStatement = database.prepare(`
    SELECT id, first_name, last_name, phone, email, password, avatar_url, birth_date, auth_status, role, created_at
    FROM users
    ORDER BY created_at DESC
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
    );

    return user;
}

export function findUserByEmail(email: string) {
    const row = findUserByEmailStatement.get(email) as UserRow | undefined;
    return row ? mapUser(row) : null;
}

export function listUsers() {
    const rows = listUsersStatement.all() as UserRow[];
    return rows.map(mapUser);
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
    };
}
