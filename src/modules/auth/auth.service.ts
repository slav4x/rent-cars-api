import { z } from "zod";
import { createAuthToken } from "../../lib/jwt.js";
import { hashPassword, verifyPassword } from "../../lib/password.js";
import {
    createUserRecord,
    findUserByEmail,
    listUsers,
    type StoredUser,
} from "./auth.repository.js";

const emailField = z.email("Введите корректный email").transform((value) =>
    value.trim().toLowerCase(),
);

const registerSchema = z
    .object({
        firstName: z.string().trim().min(1, "Укажите имя"),
        lastName: z.string().trim().min(1, "Укажите фамилию"),
        phone: z.string().trim().min(10, "Введите корректный номер телефона"),
        email: emailField,
        password: z.string().min(6, "Пароль должен быть не короче 6 символов"),
    })
    .strict();

const loginSchema = z
    .object({
        email: emailField,
        password: z.string().min(6, "Введите пароль"),
    })
    .strict();

const resetPasswordSchema = z
    .object({
        email: emailField,
    })
    .strict();

export type ApiAuthError = {
    status: number;
    message: string;
};

type AuthSessionResponse = {
    token: string;
    user: {
        id: string;
        firstName: string;
        lastName: string;
        phone: string;
        email: string;
        avatarUrl?: string;
        birthDate?: string;
        authStatus: string;
        role: string;
    };
    createdAt: string;
};

export async function createUser(
    payload: unknown,
): Promise<AuthSessionResponse> {
    const data = registerSchema.parse(payload);

    if (findUserByEmail(data.email)) {
        throw createError(409, "Пользователь с таким email уже существует");
    }

    const createdAt = new Date().toISOString();
    const user: StoredUser = {
        id: crypto.randomUUID(),
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        email: data.email,
        password: hashPassword(data.password),
        avatarUrl: null,
        birthDate: null,
        authStatus: "pending",
        role: "user",
        createdAt,
    };

    return buildSession(createUserRecord(user));
}

export async function loginUser(
    payload: unknown,
): Promise<AuthSessionResponse> {
    const data = loginSchema.parse(payload);
    const user = findUserByEmail(data.email);

    if (!user || !verifyPassword(data.password, user.password)) {
        throw createError(401, "Неверный email или пароль");
    }

    return buildSession(user);
}

export async function requestPasswordReset(
    payload: unknown,
): Promise<{ ok: true }> {
    resetPasswordSchema.parse(payload);

    return { ok: true };
}

export async function getUsersForDev() {
    return listUsers().map(({ password: _password, ...user }) => user);
}

async function buildSession(user: StoredUser): Promise<AuthSessionResponse> {
    return {
        token: await createAuthToken({
            sub: user.id,
            email: user.email,
        }),
        user: {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            phone: user.phone,
            email: user.email,
            avatarUrl: user.avatarUrl ?? undefined,
            birthDate: user.birthDate ?? undefined,
            authStatus: user.authStatus,
            role: user.role,
        },
        createdAt: user.createdAt,
    };
}

function createError(status: number, message: string): ApiAuthError {
    return { status, message };
}
