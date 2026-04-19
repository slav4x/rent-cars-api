import { optimizeAvatarImage, optimizeCarImage } from "./image.js";
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
    if (!params.mimeType.startsWith("image/")) {
        throw new Error("UNSUPPORTED_AVATAR_TYPE");
    }
    const optimizedImage = await optimizeAvatarImage(params.body);
    return savePublicObject({
        directory: "avatars",
        fileName: `${params.userId}-${Date.now()}${optimizedImage.extension}`,
        body: optimizedImage.body,
        mimeType: optimizedImage.mimeType,
        previousUrl: params.currentAvatarUrl,
    });
}
export async function saveCarMediaFile(params) {
    if (params.mimeType.startsWith("image/")) {
        const optimizedImage = await optimizeCarImage(params.body);
        return savePublicObject({
            directory: "cars",
            fileName: `${crypto.randomUUID()}${optimizedImage.extension}`,
            body: optimizedImage.body,
            mimeType: optimizedImage.mimeType,
        });
    }
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
export async function saveBrandImageFile(params) {
    if (!params.mimeType.startsWith("image/")) {
        throw new Error("UNSUPPORTED_BRAND_IMAGE_TYPE");
    }
    const optimizedImage = await optimizeCarImage(params.body);
    return savePublicObject({
        directory: "brands",
        fileName: `${crypto.randomUUID()}${optimizedImage.extension}`,
        body: optimizedImage.body,
        mimeType: optimizedImage.mimeType,
    });
}
