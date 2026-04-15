import type { RequestHandler } from "express";

type RateLimitOptions = {
    windowMs: number;
    maxRequests: number;
    message: string;
};

type RateLimitEntry = {
    count: number;
    resetAt: number;
};

export function createRateLimit(options: RateLimitOptions): RequestHandler {
    const store = new Map<string, RateLimitEntry>();

    return (request, response, next) => {
        const now = Date.now();
        const key = `${request.path}:${getClientIdentifier(request)}`;
        const entry = store.get(key);

        if (!entry || entry.resetAt <= now) {
            store.set(key, {
                count: 1,
                resetAt: now + options.windowMs,
            });
            next();
            return;
        }

        if (entry.count >= options.maxRequests) {
            response.status(429).json({ message: options.message });
            return;
        }

        entry.count += 1;
        next();
    };
}

function getClientIdentifier(request: {
    ip?: string;
    headers: Record<string, string | string[] | undefined>;
}) {
    const forwardedFor = request.headers["x-forwarded-for"];

    if (typeof forwardedFor === "string" && forwardedFor.trim()) {
        return forwardedFor.split(",")[0]?.trim() ?? "unknown";
    }

    return request.ip ?? "unknown";
}
