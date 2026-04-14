import { execute, queryFirst, queryRows, withTransaction, } from "../../db/database.js";
export async function findLatestVerificationRequestByUserId(userId) {
    const row = await queryFirst(`
            SELECT id, user_id, applicant_type, status, review_comment, created_at, updated_at, submitted_at, reviewed_at
            FROM verification_requests
            WHERE user_id = $1
            ORDER BY created_at DESC
            LIMIT 1
        `, [userId]);
    return row ? mapVerificationRequest(row) : null;
}
export async function createVerificationRequest(record) {
    await execute(`
            INSERT INTO verification_requests (
                id, user_id, applicant_type, status, review_comment, created_at, updated_at, submitted_at, reviewed_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [
        record.id,
        record.userId,
        record.applicantType,
        record.status,
        record.reviewComment,
        record.createdAt,
        record.updatedAt,
        record.submittedAt,
        record.reviewedAt,
    ]);
    return record;
}
export async function updateVerificationRequest(record) {
    await execute(`
            UPDATE verification_requests
            SET applicant_type = $1,
                status = $2,
                review_comment = $3,
                updated_at = $4,
                submitted_at = $5,
                reviewed_at = $6
            WHERE id = $7
        `, [
        record.applicantType,
        record.status,
        record.reviewComment,
        record.updatedAt,
        record.submittedAt,
        record.reviewedAt,
        record.id,
    ]);
    return record;
}
export async function findVerificationFilesByRequestId(verificationRequestId) {
    const rows = await queryRows(`
            SELECT id, verification_request_id, user_id, type, file_url, original_name, mime_type, size_bytes, created_at
            FROM verification_files
            WHERE verification_request_id = $1
            ORDER BY created_at ASC
        `, [verificationRequestId]);
    return rows.map(mapVerificationFile);
}
export async function replaceVerificationFile(record) {
    await withTransaction(async (client) => {
        await execute(`
                DELETE FROM verification_files
                WHERE verification_request_id = $1 AND type = $2
            `, [record.verificationRequestId, record.type], client);
        await execute(`
                INSERT INTO verification_files (
                    id, verification_request_id, user_id, type, file_url, original_name, mime_type, size_bytes, created_at
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            `, [
            record.id,
            record.verificationRequestId,
            record.userId,
            record.type,
            record.fileUrl,
            record.originalName,
            record.mimeType,
            record.sizeBytes,
            record.createdAt,
        ], client);
    });
    return record;
}
function mapVerificationRequest(row) {
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
function mapVerificationFile(row) {
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
