import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const defaultUploadsDir =
    process.env.NODE_ENV === "production"
        ? "/tmp/rent-cars-api/uploads"
        : "uploads";
const defaultPrivateStorageDir =
    process.env.NODE_ENV === "production"
        ? "/tmp/rent-cars-api/storage"
        : "storage";

const uploadsRoot = resolve(process.env.UPLOADS_DIR ?? defaultUploadsDir);
const privateStorageRoot = resolve(
    process.env.PRIVATE_STORAGE_DIR ?? defaultPrivateStorageDir,
);

const s3Endpoint = process.env.S3_ENDPOINT?.replace(/\/$/, "") ?? "";
const s3Region = process.env.S3_REGION ?? "ru-1";
const s3Bucket = process.env.S3_BUCKET ?? "";
const s3AccessKeyId = process.env.S3_ACCESS_KEY_ID ?? "";
const s3SecretAccessKey = process.env.S3_SECRET_ACCESS_KEY ?? "";
const s3PublicBaseUrl =
    process.env.S3_PUBLIC_BASE_URL?.replace(/\/$/, "") || s3Endpoint;

const isS3Enabled = Boolean(
    s3Endpoint && s3Bucket && s3AccessKeyId && s3SecretAccessKey,
);

const s3Client = isS3Enabled
    ? new S3Client({
          region: s3Region,
          endpoint: s3Endpoint,
          forcePathStyle: true,
          credentials: {
              accessKeyId: s3AccessKeyId,
              secretAccessKey: s3SecretAccessKey,
          },
      })
    : null;

if (!isS3Enabled) {
    mkdirSync(join(uploadsRoot, "avatars"), { recursive: true });
    mkdirSync(join(uploadsRoot, "cars"), { recursive: true });
}

export function getUploadsRoot() {
    return uploadsRoot;
}

export async function savePublicObject(params: {
    directory: "avatars" | "cars";
    fileName: string;
    body: Buffer;
    mimeType: string;
    previousUrl?: string | null;
}) {
    if (isS3Enabled && s3Client) {
        const key = `${params.directory}/${params.fileName}`;

        if (params.previousUrl) {
            await deletePublicObject(params.previousUrl);
        }

        await s3Client.send(
            new PutObjectCommand({
                Bucket: s3Bucket,
                Key: key,
                Body: params.body,
                ContentType: params.mimeType,
            }),
        );

        return `${s3PublicBaseUrl}/${s3Bucket}/${key}`;
    }

    const directoryPath = join(uploadsRoot, params.directory);

    if (!existsSync(directoryPath)) {
        mkdirSync(directoryPath, { recursive: true });
    }

    if (params.previousUrl) {
        deletePublicObjectLocal(params.previousUrl);
    }

    const absolutePath = join(directoryPath, params.fileName);
    writeFileSync(absolutePath, params.body);

    return `/uploads/${params.directory}/${params.fileName}`;
}

export async function savePrivateObject(params: {
    key: string;
    body: Buffer;
    mimeType: string;
    previousFileUrl?: string;
}) {
    if (isS3Enabled && s3Client) {
        if (params.previousFileUrl?.startsWith("private://s3/")) {
            await s3Client.send(
                new DeleteObjectCommand({
                    Bucket: s3Bucket,
                    Key: params.previousFileUrl.replace("private://s3/", ""),
                }),
            );
        }

        await s3Client.send(
            new PutObjectCommand({
                Bucket: s3Bucket,
                Key: params.key,
                Body: params.body,
                ContentType: params.mimeType,
            }),
        );

        return `private://s3/${params.key}`;
    }

    const absolutePath = resolve(privateStorageRoot, params.key);
    const directory = resolve(absolutePath, "..");

    if (!existsSync(directory)) {
        mkdirSync(directory, { recursive: true });
    }

    if (params.previousFileUrl?.startsWith("private://")) {
        const oldPath = resolve(
            privateStorageRoot,
            params.previousFileUrl.replace("private://", ""),
        );

        if (existsSync(oldPath)) {
            rmSync(oldPath, { force: true });
        }
    }

    writeFileSync(absolutePath, params.body);

    return `private://${params.key}`;
}

function deletePublicObjectLocal(currentUrl: string) {
    const currentPath = currentUrl.startsWith("http")
        ? new URL(currentUrl).pathname
        : currentUrl;

    if (!currentPath.startsWith("/uploads/")) {
        return;
    }

    const absolutePath = join(uploadsRoot, currentPath.replace("/uploads/", ""));

    if (existsSync(absolutePath)) {
        rmSync(absolutePath, { force: true });
    }
}

async function deletePublicObject(currentUrl: string) {
    if (!isS3Enabled || !s3Client) {
        deletePublicObjectLocal(currentUrl);
        return;
    }

    const keyPrefix = `${s3PublicBaseUrl}/${s3Bucket}/`;

    if (!currentUrl.startsWith(keyPrefix)) {
        return;
    }

    await s3Client.send(
        new DeleteObjectCommand({
            Bucket: s3Bucket,
            Key: currentUrl.replace(keyPrefix, ""),
        }),
    );
}
