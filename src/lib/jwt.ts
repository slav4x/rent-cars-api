const encoder = new TextEncoder();

type AuthTokenPayload = {
    sub: string;
    email: string;
    iat: number;
    exp: number;
    iss: "rent-cars-api";
    aud: "rent-cars-web";
};

const AUTH_TOKEN_SECRET =
    process.env.AUTH_TOKEN_SECRET ?? "rent-cars-dev-secret-change-me";
const AUTH_TOKEN_TTL_SECONDS = Number(
    process.env.AUTH_TOKEN_TTL_SECONDS ?? 60 * 60 * 24 * 7,
);

export async function createAuthToken(payload: {
    sub: string;
    email: string;
}) {
    const header = { alg: "HS256", typ: "JWT" };
    const now = Math.floor(Date.now() / 1000);
    const body: AuthTokenPayload = {
        ...payload,
        iat: now,
        exp: now + AUTH_TOKEN_TTL_SECONDS,
        iss: "rent-cars-api",
        aud: "rent-cars-web",
    };

    const encodedHeader = base64UrlEncode(JSON.stringify(header));
    const encodedPayload = base64UrlEncode(JSON.stringify(body));
    const signature = await sign(`${encodedHeader}.${encodedPayload}`);

    return `${encodedHeader}.${encodedPayload}.${signature}`;
}

async function sign(value: string) {
    const key = await crypto.subtle.importKey(
        "raw",
        encoder.encode(AUTH_TOKEN_SECRET),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"],
    );

    const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(value));
    return base64UrlEncode(signature);
}

function base64UrlEncode(value: string | ArrayBuffer) {
    const buffer =
        typeof value === "string" ? encoder.encode(value) : new Uint8Array(value);

    return Buffer.from(buffer)
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/g, "");
}
