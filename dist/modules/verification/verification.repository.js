import { database } from "../../db/database.js";
const findVerificationRequestByUserIdStatement = database.prepare(`
    SELECT id, user_id, applicant_type, status, review_comment, created_at, updated_at, submitted_at, reviewed_at
    FROM verification_requests
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT 1
`);
const insertVerificationRequestStatement = database.prepare(`
    INSERT INTO verification_requests (
        id, user_id, applicant_type, status, review_comment, created_at, updated_at, submitted_at, reviewed_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);
const updateVerificationRequestStatement = database.prepare(`
    UPDATE verification_requests
    SET applicant_type = ?,
        status = ?,
        review_comment = ?,
        updated_at = ?,
        submitted_at = ?,
        reviewed_at = ?
    WHERE id = ?
`);
const findVerificationFilesByRequestIdStatement = database.prepare(`
    SELECT id, verification_request_id, user_id, type, file_url, original_name, mime_type, size_bytes, created_at
    FROM verification_files
    WHERE verification_request_id = ?
    ORDER BY created_at ASC
`);
const deleteVerificationFileByRequestAndTypeStatement = database.prepare(`
    DELETE FROM verification_files
    WHERE verification_request_id = ? AND type = ?
`);
const insertVerificationFileStatement = database.prepare(`
    INSERT INTO verification_files (
        id, verification_request_id, user_id, type, file_url, original_name, mime_type, size_bytes, created_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);
export function findLatestVerificationRequestByUserId(userId) {
    const row = findVerificationRequestByUserIdStatement.get(userId);
    return row ? mapVerificationRequest(row) : null;
}
export function createVerificationRequest(record) {
    insertVerificationRequestStatement.run(record.id, record.userId, record.applicantType, record.status, record.reviewComment, record.createdAt, record.updatedAt, record.submittedAt, record.reviewedAt);
    return record;
}
export function updateVerificationRequest(record) {
    updateVerificationRequestStatement.run(record.applicantType, record.status, record.reviewComment, record.updatedAt, record.submittedAt, record.reviewedAt, record.id);
    return record;
}
export function findVerificationFilesByRequestId(verificationRequestId) {
    const rows = findVerificationFilesByRequestIdStatement.all(verificationRequestId);
    return rows.map(mapVerificationFile);
}
export function replaceVerificationFile(record) {
    deleteVerificationFileByRequestAndTypeStatement.run(record.verificationRequestId, record.type);
    insertVerificationFileStatement.run(record.id, record.verificationRequestId, record.userId, record.type, record.fileUrl, record.originalName, record.mimeType, record.sizeBytes, record.createdAt);
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
