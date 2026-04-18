import { queryRows } from "../../db/database.js";

export type ContactRequestRecord = {
    id: string;
    source: string;
    name: string;
    phone: string;
    comment: string | null;
    createdAt: string;
};

type ContactRequestRow = {
    id: string;
    source: string;
    name: string;
    phone: string;
    comment: string | null;
    created_at: string;
};

export async function createContactRequest(record: ContactRequestRecord) {
    const [row] = await queryRows<ContactRequestRow>(
        `INSERT INTO contact_requests (
            id, source, name, phone, comment, created_at
        )
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, source, name, phone, comment, created_at`,
        [
            record.id,
            record.source,
            record.name,
            record.phone,
            record.comment,
            record.createdAt,
        ],
    );

    return mapContactRequest(row);
}

function mapContactRequest(row: ContactRequestRow) {
    return {
        id: row.id,
        source: row.source,
        name: row.name,
        phone: row.phone,
        comment: row.comment,
        createdAt: row.created_at,
    };
}
