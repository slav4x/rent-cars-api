const DEFAULT_CLIENT_ORIGIN = "http://localhost:3000";
const DEFAULT_DATABASE_URL = "postgresql://rentcars:rentcars@localhost:5432/rentcars";
const DEFAULT_AUTH_TOKEN_SECRET = "rent-cars-dev-secret-change-me";

type AppEnv = {
    port: number;
    nodeEnv: string;
    clientOrigins: string[];
    databaseUrl: string;
    databaseSsl: boolean;
    authTokenSecret: string;
    authTokenTtlSeconds: number;
    refreshTokenTtlSeconds: number;
};

export const env = loadEnv();

function loadEnv(): AppEnv {
    const nodeEnv = process.env.NODE_ENV ?? "development";
    const isProduction = nodeEnv === "production";
    const clientOrigins = parseOrigins(
        process.env.CLIENT_ORIGIN?.trim() ||
            (isProduction ? "" : DEFAULT_CLIENT_ORIGIN),
    );
    const databaseUrl =
        process.env.DATABASE_URL?.trim() ||
        (isProduction ? "" : DEFAULT_DATABASE_URL);
    const authTokenSecret =
        process.env.AUTH_TOKEN_SECRET?.trim() ||
        (isProduction ? "" : DEFAULT_AUTH_TOKEN_SECRET);
    const authTokenTtlSeconds = Number(process.env.AUTH_TOKEN_TTL_SECONDS ?? 60 * 15);
    const refreshTokenTtlSeconds = Number(
        process.env.REFRESH_TOKEN_TTL_SECONDS ?? 60 * 60 * 24 * 30,
    );
    const port = Number(process.env.PORT ?? 4000);

    const issues: string[] = [];

    if (!Number.isFinite(port) || port <= 0) {
        issues.push("PORT должен быть положительным числом");
    }

    if (!databaseUrl) {
        issues.push("DATABASE_URL обязателен");
    }

    if (!authTokenSecret) {
        issues.push("AUTH_TOKEN_SECRET обязателен");
    }

    if (!Number.isFinite(authTokenTtlSeconds) || authTokenTtlSeconds <= 0) {
        issues.push("AUTH_TOKEN_TTL_SECONDS должен быть положительным числом");
    }

    if (!Number.isFinite(refreshTokenTtlSeconds) || refreshTokenTtlSeconds <= 0) {
        issues.push("REFRESH_TOKEN_TTL_SECONDS должен быть положительным числом");
    }

    if (clientOrigins.length === 0) {
        issues.push("CLIENT_ORIGIN должен содержать хотя бы один origin");
    }

    if (issues.length > 0) {
        throw new Error(`ENV_VALIDATION_FAILED: ${issues.join("; ")}`);
    }

    return {
        port,
        nodeEnv,
        clientOrigins,
        databaseUrl,
        databaseSsl: process.env.DATABASE_SSL === "true",
        authTokenSecret,
        authTokenTtlSeconds,
        refreshTokenTtlSeconds,
    };
}

function parseOrigins(value?: string) {
    return (value ?? "")
        .split(",")
        .map((origin) => origin.trim().replace(/\/+$/, ""))
        .filter(Boolean);
}
