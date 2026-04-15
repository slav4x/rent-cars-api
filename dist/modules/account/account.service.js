import { z } from "zod";
import { hashPassword } from "../../lib/password.js";
import { saveAvatarFile } from "../../lib/uploads.js";
import { findUserByEmail, findUserById, updateUserRecord, } from "../auth/auth.repository.js";
import { createError, sanitizeUser } from "../auth/auth.service.js";
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
export async function getAccountProfile(userId) {
    const user = await findUserById(userId);
    if (!user) {
        throw createError(404, "Пользователь не найден");
    }
    return sanitizeUser(user);
}
export async function updateAccountProfile(userId, payload) {
    const updates = updateAccountSchema.parse(payload);
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
    const updatedUser = await updateUserRecord({
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
export async function updateAccountAvatar(params) {
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
    const updatedUser = await updateUserRecord({
        ...user,
        avatarUrl: avatarUrl.startsWith("http")
            ? avatarUrl
            : `${params.baseUrl}${avatarUrl}`,
        updatedAt: new Date().toISOString(),
        lastActivityAt: new Date().toISOString(),
    });
    return sanitizeUser(updatedUser);
}
function normalizeOptional(value) {
    if (value === undefined) {
        return undefined;
    }
    return value.trim() || null;
}
