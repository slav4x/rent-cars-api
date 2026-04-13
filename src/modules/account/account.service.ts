import { z } from "zod";
import { hashPassword } from "../../lib/password.js";
import { saveAvatarFile } from "../../lib/uploads.js";
import {
    findUserByEmail,
    findUserById,
    updateUserRecord,
} from "../auth/auth.repository.js";
import { createError, sanitizeUser, type ApiAuthError } from "../auth/auth.service.js";

const updateAccountSchema = z
    .object({
        firstName: z.string().trim().min(1, "Укажите имя").optional(),
        lastName: z.string().trim().min(1, "Укажите фамилию").optional(),
        email: z
            .email("Введите корректный email")
            .transform((value) => value.trim().toLowerCase())
            .optional(),
        birthDate: z.string().trim().optional(),
        avatarUrl: z.string().trim().optional(),
        password: z
            .string()
            .min(6, "Пароль должен быть не короче 6 символов")
            .optional(),
    })
    .strict();

export async function getAccountProfile(userId: string) {
    const user = findUserById(userId);

    if (!user) {
        throw createError(404, "Пользователь не найден");
    }

    return sanitizeUser(user);
}

export async function updateAccountProfile(userId: string, payload: unknown) {
    const updates = updateAccountSchema.parse(payload);
    const user = findUserById(userId);

    if (!user) {
        throw createError(404, "Пользователь не найден");
    }

    if (updates.email && updates.email !== user.email) {
        const existingUser = findUserByEmail(updates.email);

        if (existingUser && existingUser.id !== user.id) {
            throw createError(409, "Пользователь с таким email уже существует");
        }
    }

    const updatedUser = updateUserRecord({
        ...user,
        firstName: updates.firstName ?? user.firstName,
        lastName: updates.lastName ?? user.lastName,
        email: updates.email ?? user.email,
        avatarUrl: normalizeOptional(updates.avatarUrl) ?? user.avatarUrl,
        birthDate: normalizeOptional(updates.birthDate) ?? user.birthDate,
        password: updates.password ? hashPassword(updates.password) : user.password,
        updatedAt: new Date().toISOString(),
        lastActivityAt: new Date().toISOString(),
    });

    return sanitizeUser(updatedUser);
}

export async function updateAccountAvatar(params: {
    userId: string;
    body: Buffer;
    mimeType: string;
    baseUrl: string;
}) {
    const user = findUserById(params.userId);

    if (!user) {
        throw createError(404, "Пользователь не найден");
    }

    const relativeAvatarUrl = saveAvatarFile({
        userId: user.id,
        body: params.body,
        mimeType: params.mimeType,
        currentAvatarUrl: user.avatarUrl,
    });

    const updatedUser = updateUserRecord({
        ...user,
        avatarUrl: `${params.baseUrl}${relativeAvatarUrl}`,
        updatedAt: new Date().toISOString(),
        lastActivityAt: new Date().toISOString(),
    });

    return sanitizeUser(updatedUser);
}

function normalizeOptional(value: string | undefined) {
    if (value === undefined) {
        return undefined;
    }

    return value.trim() || null;
}

export type { ApiAuthError };
