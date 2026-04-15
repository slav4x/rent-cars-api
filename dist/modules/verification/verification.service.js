import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { z } from "zod";
import { createError } from "../auth/auth.service.js";
import { findUserById, updateUserRecord, } from "../auth/auth.repository.js";
import { createVerificationRequest, findLatestVerificationRequestByUserId, findVerificationFilesByRequestId, replaceVerificationFile, updateVerificationRequest, } from "./verification.repository.js";
const submitVerificationSchema = z
    .object({
    applicantType: z.enum(["citizen_rf", "foreign_citizen"]),
})
    .strict();
const documentTypeSchema = z.enum([
    "passport_main",
    "passport_registration",
    "license_front",
    "license_back",
]);
const requiredFileTypes = [
    "passport_main",
    "passport_registration",
    "license_front",
    "license_back",
];
const defaultPrivateStorageDir = process.env.NODE_ENV === "production"
    ? "/tmp/rent-cars-api/storage"
    : "storage";
export async function getVerificationOverview(userId) {
    const request = await ensureVerificationRequest(userId);
    const files = await findVerificationFilesByRequestId(request.id);
    return {
        request,
        files,
    };
}
export async function uploadVerificationFile(params) {
    await ensureVerificationUser(params.userId);
    const documentType = documentTypeSchema.parse(params.documentType);
    const request = await ensureVerificationRequest(params.userId);
    const previousFile = (await findVerificationFilesByRequestId(request.id)).find((file) => file.type === documentType);
    const savedFile = savePrivateVerificationFile({
        userId: params.userId,
        verificationRequestId: request.id,
        documentType,
        body: params.body,
        mimeType: params.mimeType,
        originalName: params.originalName,
        previousFileUrl: previousFile?.fileUrl,
    });
    const now = new Date().toISOString();
    await replaceVerificationFile({
        id: crypto.randomUUID(),
        verificationRequestId: request.id,
        userId: params.userId,
        type: documentType,
        fileUrl: savedFile.fileUrl,
        originalName: savedFile.fileName,
        mimeType: params.mimeType,
        sizeBytes: params.body.length,
        createdAt: now,
    });
    await updateVerificationRequest({
        ...request,
        updatedAt: now,
        status: request.status === "approved" ? "approved" : "draft",
        reviewComment: null,
        reviewedAt: null,
    });
    await updateUserActivity(params.userId, {
        lastActivityAt: now,
    });
    return getVerificationOverview(params.userId);
}
export async function submitVerificationRequest(userId, payload) {
    await ensureVerificationUser(userId);
    const data = submitVerificationSchema.parse(payload);
    const request = await ensureVerificationRequest(userId);
    const files = await findVerificationFilesByRequestId(request.id);
    const uploadedTypes = new Set(files.map((file) => file.type));
    for (const type of requiredFileTypes) {
        if (!uploadedTypes.has(type)) {
            throw createError(400, "Загрузите все обязательные документы");
        }
    }
    const now = new Date().toISOString();
    const updatedRequest = await updateVerificationRequest({
        ...request,
        applicantType: data.applicantType,
        status: "pending",
        reviewComment: null,
        submittedAt: now,
        updatedAt: now,
        reviewedAt: null,
    });
    await updateUserActivity(userId, {
        authStatus: "pending",
        lastActivityAt: now,
    });
    return {
        request: updatedRequest,
        files,
    };
}
async function ensureVerificationUser(userId) {
    const user = await findUserById(userId);
    if (!user) {
        throw createError(404, "Пользователь не найден");
    }
    return user;
}
async function ensureVerificationRequest(userId) {
    const existingRequest = await findLatestVerificationRequestByUserId(userId);
    if (existingRequest) {
        return existingRequest;
    }
    const now = new Date().toISOString();
    return await createVerificationRequest({
        id: crypto.randomUUID(),
        userId,
        applicantType: "citizen_rf",
        status: "draft",
        reviewComment: null,
        createdAt: now,
        updatedAt: now,
        submittedAt: null,
        reviewedAt: null,
    });
}
async function updateUserActivity(userId, updates) {
    const user = await findUserById(userId);
    if (!user) {
        return;
    }
    const now = updates.updatedAt ?? new Date().toISOString();
    await updateUserRecord({
        ...user,
        authStatus: updates.authStatus ?? user.authStatus,
        updatedAt: now,
        lastActivityAt: updates.lastActivityAt ?? user.lastActivityAt,
        lastBookingAt: updates.lastBookingAt === undefined
            ? user.lastBookingAt
            : updates.lastBookingAt,
        lastLoginAt: updates.lastLoginAt === undefined ? user.lastLoginAt : updates.lastLoginAt,
    });
}
function savePrivateVerificationFile(params) {
    const extension = getVerificationExtension(params.mimeType, params.originalName);
    const storageRoot = resolve(process.env.PRIVATE_STORAGE_DIR ?? defaultPrivateStorageDir);
    const directory = resolve(storageRoot, "verification", params.userId, params.verificationRequestId);
    if (!existsSync(directory)) {
        mkdirSync(directory, { recursive: true });
    }
    if (params.previousFileUrl?.startsWith("private://verification/")) {
        const oldPath = resolve(storageRoot, params.previousFileUrl.replace("private://", ""));
        if (existsSync(oldPath)) {
            rmSync(oldPath, { force: true });
        }
    }
    const fileName = `${crypto.randomUUID()}${extension}`;
    const absolutePath = join(directory, fileName);
    writeFileSync(absolutePath, params.body);
    return {
        fileName,
        fileUrl: `private://verification/${params.userId}/${params.verificationRequestId}/${fileName}`,
    };
}
function getVerificationExtension(mimeType, originalName) {
    const byMime = {
        "image/jpeg": ".jpg",
        "image/png": ".png",
        "application/pdf": ".pdf",
    };
    if (byMime[mimeType]) {
        return byMime[mimeType];
    }
    const extension = originalName.match(/\.[^.]+$/)?.[0]?.toLowerCase();
    if (extension && [".jpg", ".jpeg", ".png", ".pdf"].includes(extension)) {
        return extension === ".jpeg" ? ".jpg" : extension;
    }
    throw new Error("UNSUPPORTED_VERIFICATION_TYPE");
}
