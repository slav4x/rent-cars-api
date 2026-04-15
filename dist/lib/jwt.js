import { env } from "../config/env.js";
const encoder = new TextEncoder();
const decoder = new TextDecoder();
const AUTH_TOKEN_SECRET = env.authTokenSecret;
const AUTH_TOKEN_TTL_SECONDS = env.authTokenTtlSeconds;
export async function createAuthToken(payload) {
    const header = { alg: "HS256", typ: "JWT" };
    const now = Math.floor(Date.now() / 1000);
    const body = {
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
export async function verifyAuthToken(token) {
    const parts = token.split(".");
    if (parts.length !== 3) {
        return null;
    }
    const [encodedHeader, encodedPayload, signature] = parts;
    const payload = parseBase64UrlJson(encodedPayload);
    if (!payload) {
        return null;
    }
    if (!payload.role) {
        return null;
    }
    const isValid = await verifySignature(`${encodedHeader}.${encodedPayload}`, signature);
    if (!isValid || payload.exp <= Math.floor(Date.now() / 1000)) {
        return null;
    }
    return payload;
}
async function sign(value) {
    const key = await crypto.subtle.importKey("raw", encoder.encode(AUTH_TOKEN_SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(value));
    return base64UrlEncode(signature);
}
async function verifySignature(value, signature) {
    const key = await crypto.subtle.importKey("raw", encoder.encode(AUTH_TOKEN_SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
    return crypto.subtle.verify("HMAC", key, base64UrlDecode(signature), encoder.encode(value));
}
function parseBase64UrlJson(value) {
    try {
        return JSON.parse(decoder.decode(base64UrlDecode(value)));
    }
    catch {
        return null;
    }
}
function base64UrlEncode(value) {
    const buffer = typeof value === "string" ? encoder.encode(value) : new Uint8Array(value);
    return Buffer.from(buffer)
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/g, "");
}
function base64UrlDecode(value) {
    const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
    const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
    return Buffer.from(`${normalized}${padding}`, "base64");
}
