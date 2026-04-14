import {
    execute,
    queryFirst,
    queryRows,
    withTransaction,
} from "../../db/database.js";

export type VerificationRequestRecord = {
    id: string;
    userId: string;
    applicantType: "citizen_rf" | "foreign_citizen";
    status: "draft" | "pending" | "approved" | "rejected";
    reviewComment: string | null;
    createdAt: string;
    updatedAt: string;
    submittedAt: string | null;
    reviewedAt: string | null;
};

export type VerificationFileRecord = {
    id: string;
    verificationRequestId: string;
    userId: string;
    type:
        | "passport_main"
        | "passport_registration"
        | "license_front"
        | "license_back";
    fileUrl: string;
    originalName: string;
    mimeType: string;
    sizeBytes: number;
    createdAt: string;
};

type VerificationRequestRow = {
    id: string;
    user_id: string;
    applicant_type: "citizen_rf" | "foreign_citizen";
    status: "draft" | "pending" | "approved" | "rejected";
    review_comment: string | null;
    created_at: string;
    updated_at: string;
    submitted_at: string | null;
    reviewed_at: string | null;
};

type VerificationFileRow = {
    id: string;
    verification_request_id: string;
    user_id: string;
    type: VerificationFileRecord["type"];
    file_url: string;
    original_name: string;
    mime_type: string;
    size_bytes: number;
    created_at: string;
};

export async function findLatestVerificationRequestByUserId(userId: string) {
    const row = await queryFirst<VerificationRequestRow>(
        `
            SELECT id, user_id, applicant_type, status, review_comment, created_at, updated_at, submitted_at, reviewed_at
            FROM verification_requests
            WHERE user_id = $1
            ORDER BY created_at DESC
            LIMIT 1
        `,
        [userId],
    );
    return row ? mapVerificationRequest(row) : null;
}

export async function createVerificationRequest(record: VerificationRequestRecord) {
    await execute(
        `
            INSERT INTO verification_requests (
                id, user_id, applicant_type, status, review_comment, created_at, updated_at, submitted_at, reviewed_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `,
        [
            record.id,
            record.userId,
            record.applicantType,
            record.status,
            record.reviewComment,
            record.createdAt,
            record.updatedAt,
            record.submittedAt,
            record.reviewedAt,
        ],
    );

    return record;
}

export async function updateVerificationRequest(record: VerificationRequestRecord) {
    await execute(
        `
            UPDATE verification_requests
            SET applicant_type = $1,
                status = $2,
                review_comment = $3,
                updated_at = $4,
                submitted_at = $5,
                reviewed_at = $6
            WHERE id = $7
        `,
        [
            record.applicantType,
            record.status,
            record.reviewComment,
            record.updatedAt,
            record.submittedAt,
            record.reviewedAt,
            record.id,
        ],
    );

    return record;
}

export async function findVerificationFilesByRequestId(verificationRequestId: string) {
    const rows = await queryRows<VerificationFileRow>(
        `
            SELECT id, verification_request_id, user_id, type, file_url, original_name, mime_type, size_bytes, created_at
            FROM verification_files
            WHERE verification_request_id = $1
            ORDER BY created_at ASC
        `,
        [verificationRequestId],
    );
    return rows.map(mapVerificationFile);
}

export async function replaceVerificationFile(record: VerificationFileRecord) {
    await withTransaction(async (client) => {
        await execute(
            `
                DELETE FROM verification_files
                WHERE verification_request_id = $1 AND type = $2
            `,
            [record.verificationRequestId, record.type],
            client,
        );

        await execute(
            `
                INSERT INTO verification_files (
                    id, verification_request_id, user_id, type, file_url, original_name, mime_type, size_bytes, created_at
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            `,
            [
                record.id,
                record.verificationRequestId,
                record.userId,
                record.type,
                record.fileUrl,
                record.originalName,
                record.mimeType,
                record.sizeBytes,
                record.createdAt,
            ],
            client,
        );
    });

    return record;
}

function mapVerificationRequest(row: VerificationRequestRow): VerificationRequestRecord {
    return {
        id: row.id,
        userId: row.user_id,
        applicantType: row.applicant_type,
        status: row.status,
        reviewComment: row.review_comment,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        submittedAt: row.submitted_at,
        reviewedAt: row.reviewed_at,
    };
}

function mapVerificationFile(row: VerificationFileRow): VerificationFileRecord {
    return {
        id: row.id,
        verificationRequestId: row.verification_request_id,
        userId: row.user_id,
        type: row.type,
        fileUrl: row.file_url,
        originalName: row.original_name,
        mimeType: row.mime_type,
        sizeBytes: row.size_bytes,
        createdAt: row.created_at,
    };
}
