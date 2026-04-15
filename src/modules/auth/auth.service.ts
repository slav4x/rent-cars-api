import { z } from "zod";
import { createAuthToken } from "../../lib/jwt.js";
import { saveAvatarFile } from "../../lib/uploads.js";
import { hashPassword, verifyPassword } from "../../lib/password.js";
import {
    createUserRecord,
    findUserByEmail,
    findUserById,
    listUsers,
    updateUserRecord,
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

const updatePanelUserSchema = z
    .object({
        firstName: z.string().trim().min(1, "Укажите имя").optional(),
        lastName: z.string().trim().min(1, "Укажите фамилию").optional(),
        phone: z
            .string()
            .trim()
            .min(10, "Введите корректный номер телефона")
            .optional(),
        email: emailField.optional(),
        birthDate: z.string().trim().optional(),
        password: z
            .string()
            .min(6, "Пароль должен быть не короче 6 символов")
            .optional(),
        role: z.enum(["guest", "user", "manager", "admin"]).optional(),
    })
    .strict();

export type ApiAuthError = {
    status: number;
    message: string;
};

export type PublicUser = {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    avatarUrl?: string;
    birthDate?: string;
    authStatus: string;
    role: string;
    updatedAt?: string;
    lastLoginAt?: string;
    lastBookingAt?: string;
    lastActivityAt?: string;
};

type AuthSessionResponse = {
    token: string;
    user: PublicUser;
    createdAt: string;
};

export async function createUser(
    payload: unknown,
): Promise<AuthSessionResponse> {
    const data = registerSchema.parse(payload);
    const existingUser = await findUserByEmail(data.email);

    if (existingUser && existingUser.role !== "guest") {
        throw createError(409, "Пользователь с таким email уже существует");
    }

    if (existingUser?.role === "guest") {
        const now = new Date().toISOString();

        return buildSession(
            await updateUserRecord({
                ...existingUser,
                firstName: data.firstName,
                lastName: data.lastName,
                phone: data.phone,
                password: hashPassword(data.password),
                role: "user",
                updatedAt: now,
                lastLoginAt: now,
                lastActivityAt: now,
            }),
        );
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
        authStatus: "inactive",
        role: "user",
        createdAt,
        updatedAt: createdAt,
        lastLoginAt: createdAt,
        lastBookingAt: null,
        lastActivityAt: createdAt,
    };

    return buildSession(await createUserRecord(user));
}

export async function loginUser(
    payload: unknown,
): Promise<AuthSessionResponse> {
    const data = loginSchema.parse(payload);
    const user = await findUserByEmail(data.email);

    if (!user || !verifyPassword(data.password, user.password)) {
        throw createError(401, "Неверный email или пароль");
    }

    if (user.role === "guest") {
        throw createError(
            403,
            "Гостевой аккаунт неактивен. Завершите регистрацию с этой же почтой, чтобы активировать его.",
        );
    }

    const now = new Date().toISOString();

    return buildSession(
        await updateUserRecord({
            ...user,
            updatedAt: now,
            lastLoginAt: now,
            lastBookingAt: user.lastBookingAt,
            lastActivityAt: now,
        }),
    );
}

export async function requestPasswordReset(
    payload: unknown,
): Promise<{ ok: true }> {
    resetPasswordSchema.parse(payload);

    return { ok: true };
}

export async function getUsersForDev() {
    return (await listUsers()).map((storedUser: StoredUser) => {
        const { password: _password, ...user } = storedUser;
        return user;
    });
}

export async function getPanelUsers() {
    return (await listUsers())
        .filter((user: StoredUser) => user.role !== "user" && user.role !== "guest")
        .map(sanitizeUser);
}

export async function getAllUsersForPanel() {
    return (await listUsers())
        .filter((user: StoredUser) => user.role === "user")
        .map(sanitizeUser);
}

export async function getPanelUserById(userId: string) {
    const user = await findUserById(userId);

    if (!user) {
        throw createError(404, "Пользователь не найден");
    }

    return sanitizeUser(user);
}

export async function updatePanelUser(userId: string, payload: unknown) {
    const updates = updatePanelUserSchema.parse(payload);
    const user = await findUserById(userId);

    if (!user) {
        throw createError(404, "Пользователь не найден");
    }

    if (updates.email && updates.email !== user.email) {
        const existingUser = await findUserByEmail(updates.email);

        if (existingUser && existingUser.id !== user.id) {
            throw createError(409, "Пользователь с таким email уже существует");
        }
    }

    const now = new Date().toISOString();

    return sanitizeUser(
        await updateUserRecord({
            ...user,
            firstName: updates.firstName ?? user.firstName,
            lastName: updates.lastName ?? user.lastName,
            phone: updates.phone ?? user.phone,
            email: updates.email ?? user.email,
            birthDate: normalizeOptional(updates.birthDate) ?? user.birthDate,
            password: updates.password ? hashPassword(updates.password) : user.password,
            role: updates.role ?? user.role,
            updatedAt: now,
            lastActivityAt: now,
        }),
    );
}

export async function updatePanelUserAvatar(params: {
    userId: string;
    body: Buffer;
    mimeType: string;
    baseUrl: string;
}) {
    const user = await findUserById(params.userId);

    if (!user) {
        throw createError(404, "Пользователь не найден");
    }

    const avatarUrl = await saveAvatarFile({
        userId: user.id,
        body: params.body,
        mimeType: params.mimeType,
        currentAvatarUrl: user.avatarUrl,
    });
    const now = new Date().toISOString();

    return sanitizeUser(
        await updateUserRecord({
            ...user,
            avatarUrl: avatarUrl.startsWith("http")
                ? avatarUrl
                : `${params.baseUrl}${avatarUrl}`,
            updatedAt: now,
            lastActivityAt: now,
        }),
    );
}

export function sanitizeUser(user: StoredUser): PublicUser {
    return {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        email: user.email,
        avatarUrl: user.avatarUrl ?? undefined,
        birthDate: user.birthDate ?? undefined,
        authStatus: user.authStatus,
        role: user.role,
    };
}

function normalizeOptional(value: string | undefined) {
    if (value === undefined) {
        return undefined;
    }

    return value.trim() || null;
}

async function buildSession(user: StoredUser): Promise<AuthSessionResponse> {
    return {
        token: await createAuthToken({
            sub: user.id,
            email: user.email,
            role: user.role,
        }),
        user: sanitizeUser(user),
        createdAt: user.createdAt,
    };
}

export function createError(status: number, message: string): ApiAuthError {
    return { status, message };
}
