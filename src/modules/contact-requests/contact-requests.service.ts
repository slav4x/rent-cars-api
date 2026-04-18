import { randomUUID } from "node:crypto";
import { z } from "zod";
import { createContactRequest } from "./contact-requests.repository.js";

const contactRequestSchema = z.object({
    source: z
        .string()
        .trim()
        .min(1, "Не указан источник заявки")
        .max(255, "Источник заявки слишком длинный"),
    name: z
        .string()
        .trim()
        .min(2, "Укажите имя")
        .max(100, "Имя слишком длинное"),
    phone: z
        .string()
        .trim()
        .refine(
            (value) => normalizePhone(value).length === 11,
            "Введите корректный номер телефона",
        ),
    comment: z
        .string()
        .trim()
        .max(2000, "Комментарий слишком длинный")
        .optional()
        .or(z.literal("")),
});

export async function submitContactRequest(payload: unknown) {
    const data = contactRequestSchema.parse(payload);
    const now = new Date().toISOString();

    const request = await createContactRequest({
        id: randomUUID(),
        source: data.source,
        name: data.name,
        phone: data.phone,
        comment: data.comment?.trim() || null,
        createdAt: now,
    });

    return {
        ok: true as const,
        id: request.id,
        source: request.source,
        createdAt: request.createdAt,
    };
}

function normalizePhone(value: string) {
    const digits = value.replace(/\D/g, "");

    if (!digits) {
        return "";
    }

    if (digits[0] === "7" || digits[0] === "8") {
        return `7${digits.slice(1, 11)}`;
    }

    return `7${digits.slice(0, 10)}`;
}
