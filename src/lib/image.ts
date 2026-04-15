import sharp from "sharp";

type OptimizedImageResult = {
    body: Buffer;
    extension: ".jpg";
    mimeType: "image/jpeg";
};

export async function optimizeAvatarImage(body: Buffer): Promise<OptimizedImageResult> {
    const optimizedBody = await sharp(body, { failOn: "none" })
        .rotate()
        .resize(600, 600, {
            fit: "cover",
            position: "centre",
        })
        .jpeg({
            quality: 82,
            mozjpeg: true,
            progressive: true,
        })
        .toBuffer();

    return {
        body: optimizedBody,
        extension: ".jpg",
        mimeType: "image/jpeg",
    };
}

export async function optimizeCarImage(body: Buffer): Promise<OptimizedImageResult> {
    const optimizedBody = await sharp(body, { failOn: "none" })
        .rotate()
        .resize(1600, 1600, {
            fit: "inside",
            withoutEnlargement: true,
        })
        .jpeg({
            quality: 80,
            mozjpeg: true,
            progressive: true,
        })
        .toBuffer();

    return {
        body: optimizedBody,
        extension: ".jpg",
        mimeType: "image/jpeg",
    };
}
