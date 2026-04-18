import { execute, queryFirst, queryRows } from "../../db/database.js";

export type ReferenceEntityKind =
    | "cities"
    | "brands"
    | "categories"
    | "colors"
    | "body-types";

export type ReferenceItemRecord = {
    id: string;
    name: string;
    slug?: string | null;
    subdomain?: string | null;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
    map?: string | null;
    seoTitle?: string | null;
    seoText?: string | null;
    hex?: string | null;
    imageUrl?: string | null;
    sortOrder: number;
};

type EntityConfig = {
    table: string;
    select: string;
    orderBy?: string;
};

const ENTITY_CONFIGS: Record<ReferenceEntityKind, EntityConfig> = {
    cities: {
        table: "car_cities",
        select: `
            id,
            name,
            subdomain,
            phone,
            email,
            address,
            map,
            seo_title AS "seoTitle",
            seo_text AS "seoText",
            sort_order AS "sortOrder"
        `,
    },
    brands: {
        table: "car_brands",
        select: `
            id,
            name,
            slug,
            image_url AS "imageUrl",
            seo_title AS "seoTitle",
            seo_text AS "seoText",
            sort_order AS "sortOrder"
        `,
    },
    categories: {
        table: "car_categories",
        select: `
            id,
            name,
            slug,
            seo_title AS "seoTitle",
            seo_text AS "seoText",
            sort_order AS "sortOrder"
        `,
    },
    colors: {
        table: "car_colors",
        select: `
            id,
            name,
            slug,
            hex,
            sort_order AS "sortOrder"
        `,
    },
    "body-types": {
        table: "car_body_types",
        select: `
            id,
            name,
            slug,
            sort_order AS "sortOrder"
        `,
    },
};

function getEntityConfig(kind: ReferenceEntityKind) {
    return ENTITY_CONFIGS[kind];
}

export async function listReferenceItems(kind: ReferenceEntityKind) {
    const { table, select } = getEntityConfig(kind);

    return queryRows<ReferenceItemRecord>(
        `
            SELECT ${select}
            FROM ${table}
            ORDER BY sort_order ASC, name ASC
        `,
    );
}

export async function findReferenceItemById(
    kind: ReferenceEntityKind,
    id: string,
) {
    const { table, select } = getEntityConfig(kind);

    return queryFirst<ReferenceItemRecord>(
        `
            SELECT ${select}
            FROM ${table}
            WHERE id = $1
        `,
        [id],
    );
}

export async function findReferenceItemBySlug(
    kind: Exclude<ReferenceEntityKind, "cities">,
    slug: string,
) {
    const { table, select } = getEntityConfig(kind);

    return queryFirst<ReferenceItemRecord>(
        `
            SELECT ${select}
            FROM ${table}
            WHERE slug = $1
        `,
        [slug],
    );
}

export async function findCityBySubdomain(subdomain: string) {
    return queryFirst<ReferenceItemRecord>(
        `
            SELECT
                id,
                name,
                subdomain,
                phone,
                email,
                address,
                map,
                seo_title AS "seoTitle",
                seo_text AS "seoText",
                sort_order AS "sortOrder"
            FROM car_cities
            WHERE subdomain = $1
        `,
        [subdomain],
    );
}

export async function getNextSortOrder(kind: ReferenceEntityKind) {
    const { table } = getEntityConfig(kind);
    const row = await queryFirst<{ nextSortOrder: number }>(
        `
            SELECT COALESCE(MAX(sort_order), 0) + 1 AS "nextSortOrder"
            FROM ${table}
        `,
    );
    return row?.nextSortOrder ?? 1;
}

export async function createReferenceItem(
    kind: ReferenceEntityKind,
    item: ReferenceItemRecord,
) {
    if (kind === "cities") {
        await execute(
            `
                INSERT INTO car_cities (
                    id, name, subdomain, phone, email, address, map, seo_title, seo_text, sort_order
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            `,
            [
                item.id,
                item.name,
                item.subdomain,
                item.phone,
                item.email,
                item.address,
                item.map,
                item.seoTitle,
                item.seoText,
                item.sortOrder,
            ],
        );
        return;
    }

    if (kind === "brands") {
        await execute(
            `
                INSERT INTO car_brands (
                    id, name, slug, image_url, seo_title, seo_text, sort_order
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7)
            `,
            [
                item.id,
                item.name,
                item.slug,
                item.imageUrl,
                item.seoTitle,
                item.seoText,
                item.sortOrder,
            ],
        );
        return;
    }

    if (kind === "categories") {
        await execute(
            `
                INSERT INTO car_categories (
                    id, name, slug, seo_title, seo_text, sort_order
                )
                VALUES ($1, $2, $3, $4, $5, $6)
            `,
            [item.id, item.name, item.slug, item.seoTitle, item.seoText, item.sortOrder],
        );
        return;
    }

    if (kind === "colors") {
        await execute(
            `
                INSERT INTO car_colors (
                    id, name, slug, hex, sort_order
                )
                VALUES ($1, $2, $3, $4, $5)
            `,
            [item.id, item.name, item.slug, item.hex, item.sortOrder],
        );
        return;
    }

    await execute(
        `
            INSERT INTO car_body_types (
                id, name, slug, sort_order
            )
            VALUES ($1, $2, $3, $4)
        `,
        [item.id, item.name, item.slug, item.sortOrder],
    );
}

export async function updateReferenceItem(
    kind: ReferenceEntityKind,
    item: ReferenceItemRecord,
) {
    if (kind === "cities") {
        await execute(
            `
                UPDATE car_cities
                SET
                    name = $2,
                    subdomain = $3,
                    phone = $4,
                    email = $5,
                    address = $6,
                    map = $7,
                    seo_title = $8,
                    seo_text = $9,
                    sort_order = $10
                WHERE id = $1
            `,
            [
                item.id,
                item.name,
                item.subdomain,
                item.phone,
                item.email,
                item.address,
                item.map,
                item.seoTitle,
                item.seoText,
                item.sortOrder,
            ],
        );
        return;
    }

    if (kind === "brands") {
        await execute(
            `
                UPDATE car_brands
                SET
                    name = $2,
                    slug = $3,
                    image_url = $4,
                    seo_title = $5,
                    seo_text = $6,
                    sort_order = $7
                WHERE id = $1
            `,
            [
                item.id,
                item.name,
                item.slug,
                item.imageUrl,
                item.seoTitle,
                item.seoText,
                item.sortOrder,
            ],
        );
        return;
    }

    if (kind === "categories") {
        await execute(
            `
                UPDATE car_categories
                SET
                    name = $2,
                    slug = $3,
                    seo_title = $4,
                    seo_text = $5,
                    sort_order = $6
                WHERE id = $1
            `,
            [item.id, item.name, item.slug, item.seoTitle, item.seoText, item.sortOrder],
        );
        return;
    }

    if (kind === "colors") {
        await execute(
            `
                UPDATE car_colors
                SET
                    name = $2,
                    slug = $3,
                    hex = $4,
                    sort_order = $5
                WHERE id = $1
            `,
            [item.id, item.name, item.slug, item.hex, item.sortOrder],
        );
        return;
    }

    await execute(
        `
            UPDATE car_body_types
            SET
                name = $2,
                slug = $3,
                sort_order = $4
            WHERE id = $1
        `,
        [item.id, item.name, item.slug, item.sortOrder],
    );
}

export async function deleteReferenceItem(kind: ReferenceEntityKind, id: string) {
    const { table } = getEntityConfig(kind);
    await execute(`DELETE FROM ${table} WHERE id = $1`, [id]);
}

export async function reorderReferenceItems(
    kind: ReferenceEntityKind,
    ids: string[],
) {
    const { table } = getEntityConfig(kind);

    await Promise.all(
        ids.map((id, index) =>
            execute(
                `
                    UPDATE ${table}
                    SET sort_order = $2
                    WHERE id = $1
                `,
                [id, index + 1],
            ),
        ),
    );
}
