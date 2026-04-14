import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
const KEY_LENGTH = 64;
export function hashPassword(password) {
    const salt = randomBytes(16).toString("hex");
    const hash = scryptSync(password, salt, KEY_LENGTH).toString("hex");
    return `${salt}:${hash}`;
}
export function verifyPassword(password, hashedPassword) {
    const [salt, storedHash] = hashedPassword.split(":");
    if (!salt || !storedHash) {
        return false;
    }
    const derivedHash = scryptSync(password, salt, KEY_LENGTH);
    const storedHashBuffer = Buffer.from(storedHash, "hex");
    if (storedHashBuffer.length !== derivedHash.length) {
        return false;
    }
    return timingSafeEqual(storedHashBuffer, derivedHash);
}
