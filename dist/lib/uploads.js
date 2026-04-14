import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
const uploadsRoot = resolve(process.cwd(), process.env.UPLOADS_DIR ?? "uploads");
const avatarsDir = join(uploadsRoot, "avatars");
const carsDir = join(uploadsRoot, "cars");
mkdirSync(avatarsDir, { recursive: true });
mkdirSync(carsDir, { recursive: true });
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
    return uploadsRoot;
}
export function saveAvatarFile(params) {
    const extension = MIME_TO_EXTENSION[params.mimeType];
    if (!extension) {
        throw new Error("UNSUPPORTED_AVATAR_TYPE");
    }
    removePreviousAvatar(params.currentAvatarUrl);
    const fileName = `${params.userId}-${Date.now()}${extension}`;
    const absolutePath = join(avatarsDir, fileName);
    writeFileSync(absolutePath, params.body);
    return `/uploads/avatars/${fileName}`;
}
export function saveCarMediaFile(params) {
    const extension = MIME_TO_EXTENSION[params.mimeType];
    if (!extension) {
        throw new Error("UNSUPPORTED_CAR_MEDIA_TYPE");
    }
    const fileName = `${crypto.randomUUID()}${extension}`;
    const absolutePath = join(carsDir, fileName);
    writeFileSync(absolutePath, params.body);
    return `/uploads/cars/${fileName}`;
}
function removePreviousAvatar(currentAvatarUrl) {
    if (!currentAvatarUrl) {
        return;
    }
    const currentPath = currentAvatarUrl.startsWith("http")
        ? new URL(currentAvatarUrl).pathname
        : currentAvatarUrl;
    if (!currentPath.startsWith("/uploads/avatars/")) {
        return;
    }
    const absolutePath = join(uploadsRoot, currentPath.replace("/uploads/", ""));
    if (existsSync(absolutePath)) {
        rmSync(absolutePath, { force: true });
    }
}
