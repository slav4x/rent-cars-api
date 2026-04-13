import cors from "cors";
import express from "express";
import { ZodError } from "zod";
import { getDatabasePath } from "./db/database.js";
import {
    createUser,
    getUsersForDev,
    loginUser,
    requestPasswordReset,
    type ApiAuthError,
} from "./modules/auth/auth.service.js";

const app = express();
app.disable("x-powered-by");
const port = Number(process.env.PORT ?? 4000);
const clientOrigin = process.env.CLIENT_ORIGIN ?? "http://localhost:3000";

app.use(
    cors({
        origin: clientOrigin,
        credentials: true,
    }),
);
app.use(express.json());

app.get("/health", (_request, response) => {
    response.json({
        ok: true,
        service: "rent-cars-api",
        databasePath: getDatabasePath(),
        now: new Date().toISOString(),
    });
});

app.get("/api/dev/users", async (_request, response, next) => {
    try {
        const users = await getUsersForDev();
        response.json(users);
    } catch (error) {
        next(error);
    }
});

app.post("/api/auth/register", async (request, response, next) => {
    try {
        const result = await createUser(request.body);
        response.status(201).json(result);
    } catch (error) {
        next(error);
    }
});

app.post("/api/auth/login", async (request, response, next) => {
    try {
        const result = await loginUser(request.body);
        response.json(result);
    } catch (error) {
        next(error);
    }
});

app.post("/api/auth/reset-password", async (request, response, next) => {
    try {
        const result = await requestPasswordReset(request.body);
        response.json(result);
    } catch (error) {
        next(error);
    }
});

app.use(
    (
        error: Error | ApiAuthError | ZodError,
        _request: express.Request,
        response: express.Response,
        _next: express.NextFunction,
    ) => {
        if (error instanceof ZodError) {
            response.status(400).json({
                message: "Некорректные данные запроса",
                issues: error.issues,
            });
            return;
        }

        if ("status" in error) {
            response.status(error.status).json({
                message: error.message,
            });
            return;
        }

        response.status(500).json({
            message: "Внутренняя ошибка сервера",
        });
    },
);

app.listen(port, () => {
    console.log(`rent-cars-api listening on http://localhost:${port}`);
});
