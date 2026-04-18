import { z } from "zod";
import {
    createReferenceItem,
    deleteReferenceItem,
    findCityBySubdomain,
    findReferenceItemById,
    findReferenceItemBySlug,
    getNextSortOrder,
    listReferenceItems,
    reorderReferenceItems,
    updateReferenceItem,
    type ReferenceEntityKind,
    type ReferenceItemRecord,
} from "./reference-data.repository.js";
import { createError } from "../auth/auth.service.js";

const referenceEntitySchema = z.enum([
    "cities",
    "brands",
    "categories",
    "colors",
    "body-types",
]);

const cityPayloadSchema = z
    .object({
        name: z.string().trim().min(1, "Укажите название города"),
        subdomain: z.string().trim().min(1, "Укажите slug города"),
        phone: z.string().trim().min(1, "Укажите телефон"),
        email: z.email("Введите корректный email"),
        address: z.string().trim().min(1, "Укажите адрес"),
        map: z.string().trim().min(1, "Укажите ссылку на карту"),
        seoTitle: z.string().trim().optional(),
        seoText: z.string().trim().default("<p></p>"),
    })
    .strict();

const brandPayloadSchema = z
    .object({
        name: z.string().trim().min(1, "Укажите название бренда"),
        imageUrl: z.string().trim().optional(),
        seoTitle: z.string().trim().optional(),
        seoText: z.string().trim().default("<p></p>"),
    })
    .strict();

const categoryPayloadSchema = z
    .object({
        name: z.string().trim().min(1, "Укажите название категории"),
        seoTitle: z.string().trim().optional(),
        seoText: z.string().trim().default("<p></p>"),
    })
    .strict();

const colorPayloadSchema = z
    .object({
        name: z.string().trim().min(1, "Укажите название цвета"),
        hex: z
            .string()
            .trim()
            .regex(/^#([0-9A-Fa-f]{6})$/, "Укажите HEX в формате #RRGGBB"),
    })
    .strict();

const bodyTypePayloadSchema = z
    .object({
        name: z.string().trim().min(1, "Укажите название кузова"),
    })
    .strict();

const reorderPayloadSchema = z
    .object({
        ids: z.array(z.string().trim().min(1)).min(1, "Передайте порядок элементов"),
    })
    .strict();

export type ReferenceItem = {
    id: string;
    name: string;
    slug?: string;
    subdomain?: string;
    phone?: string;
    email?: string;
    address?: string;
    map?: string;
    seoTitle?: string;
    seoText?: string;
    hex?: string;
    imageUrl?: string;
    sortOrder: number;
};

export function parseReferenceEntityKind(value: string) {
    return referenceEntitySchema.parse(value);
}

export async function getReferenceItems(kind: ReferenceEntityKind) {
    return (await listReferenceItems(kind)).map(sanitizeReferenceItem);
}

export async function createReferenceEntity(
    kind: ReferenceEntityKind,
    payload: unknown,
) {
    const data = await normalizePayload(kind, payload);
    const item: ReferenceItemRecord = {
        id: crypto.randomUUID(),
        name: data.name,
        slug: "slug" in data ? data.slug ?? null : null,
        subdomain: "subdomain" in data ? data.subdomain ?? null : null,
        phone: "phone" in data ? data.phone ?? null : null,
        email: "email" in data ? data.email ?? null : null,
        address: "address" in data ? data.address ?? null : null,
        map: "map" in data ? data.map ?? null : null,
        seoTitle: "seoTitle" in data ? data.seoTitle ?? null : null,
        seoText: "seoText" in data ? data.seoText ?? "<p></p>" : null,
        hex: "hex" in data ? data.hex ?? null : null,
        imageUrl: "imageUrl" in data ? data.imageUrl ?? null : null,
        sortOrder: await getNextSortOrder(kind),
    };

    await createReferenceItem(kind, item);
    return sanitizeReferenceItem(item);
}

export async function updateReferenceEntity(
    kind: ReferenceEntityKind,
    id: string,
    payload: unknown,
) {
    const existing = await findReferenceItemById(kind, id);

    if (!existing) {
        throw createError(404, "Элемент не найден");
    }

    const data = await normalizePayload(kind, payload, id);
    const item: ReferenceItemRecord = {
        ...existing,
        name: data.name,
        slug: "slug" in data ? data.slug ?? null : existing.slug ?? null,
        subdomain:
            "subdomain" in data ? data.subdomain ?? null : existing.subdomain ?? null,
        phone: "phone" in data ? data.phone ?? null : existing.phone ?? null,
        email: "email" in data ? data.email ?? null : existing.email ?? null,
        address:
            "address" in data ? data.address ?? null : existing.address ?? null,
        map: "map" in data ? data.map ?? null : existing.map ?? null,
        seoTitle:
            "seoTitle" in data ? data.seoTitle ?? null : existing.seoTitle ?? null,
        seoText:
            "seoText" in data ? data.seoText ?? "<p></p>" : existing.seoText ?? null,
        hex: "hex" in data ? data.hex ?? null : existing.hex ?? null,
        imageUrl:
            "imageUrl" in data ? data.imageUrl ?? null : existing.imageUrl ?? null,
        sortOrder: existing.sortOrder,
    };

    await updateReferenceItem(kind, item);
    return sanitizeReferenceItem(item);
}

export async function removeReferenceEntity(kind: ReferenceEntityKind, id: string) {
    const existing = await findReferenceItemById(kind, id);

    if (!existing) {
        throw createError(404, "Элемент не найден");
    }

    try {
        await deleteReferenceItem(kind, id);
    } catch {
        throw createError(
            409,
            "Нельзя удалить элемент, пока он используется в связанных данных",
        );
    }

    return { ok: true };
}

export async function reorderReferenceEntities(
    kind: ReferenceEntityKind,
    payload: unknown,
) {
    const data = reorderPayloadSchema.parse(payload);
    await reorderReferenceItems(kind, data.ids);
    return getReferenceItems(kind);
}

async function normalizePayload(
    kind: ReferenceEntityKind,
    payload: unknown,
    currentId?: string,
) {
    if (kind === "cities") {
        const data = cityPayloadSchema.parse(payload);
        const existingCity = await findCityBySubdomain(data.subdomain);

        if (existingCity && existingCity.id !== currentId) {
            throw createError(409, "Город с таким slug уже существует");
        }

        return data;
    }

    if (kind === "brands") {
        const data = brandPayloadSchema.parse(payload);
        return {
            ...data,
            slug: await generateUniqueSlug("brands", data.name, currentId),
        };
    }

    if (kind === "categories") {
        const data = categoryPayloadSchema.parse(payload);
        return {
            ...data,
            slug: await generateUniqueSlug("categories", data.name, currentId),
        };
    }

    if (kind === "colors") {
        const data = colorPayloadSchema.parse(payload);
        return {
            ...data,
            slug: await generateUniqueSlug("colors", data.name, currentId),
        };
    }

    const data = bodyTypePayloadSchema.parse(payload);
    return {
        ...data,
        slug: await generateUniqueSlug("body-types", data.name, currentId),
    };
}

async function generateUniqueSlug(
    kind: Exclude<ReferenceEntityKind, "cities">,
    name: string,
    currentId?: string,
) {
    const baseSlug = slugify(name) || "item";
    let candidate = baseSlug;
    let suffix = 2;

    while (true) {
        const existing = await findReferenceItemBySlug(kind, candidate);

        if (!existing || existing.id === currentId) {
            return candidate;
        }

        candidate = `${baseSlug}-${suffix}`;
        suffix += 1;
    }
}

function slugify(value: string) {
    const transliterated = value
        .trim()
        .toLowerCase()
        .replace(/а/g, "a")
        .replace(/б/g, "b")
        .replace(/в/g, "v")
        .replace(/г/g, "g")
        .replace(/д/g, "d")
        .replace(/е/g, "e")
        .replace(/ё/g, "e")
        .replace(/ж/g, "zh")
        .replace(/з/g, "z")
        .replace(/и/g, "i")
        .replace(/й/g, "y")
        .replace(/к/g, "k")
        .replace(/л/g, "l")
        .replace(/м/g, "m")
        .replace(/н/g, "n")
        .replace(/о/g, "o")
        .replace(/п/g, "p")
        .replace(/р/g, "r")
        .replace(/с/g, "s")
        .replace(/т/g, "t")
        .replace(/у/g, "u")
        .replace(/ф/g, "f")
        .replace(/х/g, "h")
        .replace(/ц/g, "c")
        .replace(/ч/g, "ch")
        .replace(/ш/g, "sh")
        .replace(/щ/g, "sch")
        .replace(/ъ/g, "")
        .replace(/ы/g, "y")
        .replace(/ь/g, "")
        .replace(/э/g, "e")
        .replace(/ю/g, "yu")
        .replace(/я/g, "ya");

    return transliterated
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .replace(/-{2,}/g, "-");
}

function sanitizeReferenceItem(item: ReferenceItemRecord): ReferenceItem {
    return {
        id: item.id,
        name: item.name,
        slug: item.slug ?? undefined,
        subdomain: item.subdomain ?? undefined,
        phone: item.phone ?? undefined,
        email: item.email ?? undefined,
        address: item.address ?? undefined,
        map: item.map ?? undefined,
        seoTitle: item.seoTitle ?? undefined,
        seoText: item.seoText ?? undefined,
        hex: item.hex ?? undefined,
        imageUrl: item.imageUrl ?? undefined,
        sortOrder: item.sortOrder,
    };
}
