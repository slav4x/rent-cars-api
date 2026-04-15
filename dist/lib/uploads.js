import { getUploadsRoot as getStorageUploadsRoot, savePublicObject } from "./storage.js";
const MIME_TO_EXTENSION = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
    "video/mp4": ".mp4",
    "video/webm": ".webm",
    "video/quicktime": ".mov",
};
export function getUploadsRoot() {
    return getStorageUploadsRoot();
}
export async function saveAvatarFile(params) {
    const extension = MIME_TO_EXTENSION[params.mimeType];
    if (!extension) {
        throw new Error("UNSUPPORTED_AVATAR_TYPE");
    }
    return savePublicObject({
        directory: "avatars",
        fileName: `${params.userId}-${Date.now()}${extension}`,
        body: params.body,
        mimeType: params.mimeType,
        previousUrl: params.currentAvatarUrl,
    });
}
export async function saveCarMediaFile(params) {
    const extension = MIME_TO_EXTENSION[params.mimeType];
    if (!extension) {
        throw new Error("UNSUPPORTED_CAR_MEDIA_TYPE");
    }
    return savePublicObject({
        directory: "cars",
        fileName: `${crypto.randomUUID()}${extension}`,
        body: params.body,
        mimeType: params.mimeType,
    });
}
