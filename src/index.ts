import cors from "cors";
import express from "express";
import { ZodError } from "zod";
import { getDatabasePath } from "./db/database.js";
import { verifyAuthToken } from "./lib/jwt.js";
import { getUploadsRoot } from "./lib/uploads.js";
import { saveCarMediaFile } from "./lib/uploads.js";
import {
    getAccountProfile,
    updateAccountAvatar,
    updateAccountProfile,
} from "./modules/account/account.service.js";
import {
    getVerificationOverview,
    submitVerificationRequest,
    uploadVerificationFile,
} from "./modules/verification/verification.service.js";
import {
    addFavorite,
    getFavoriteCarIds,
    getFavoriteCars,
    removeFavorite,
} from "./modules/favorites/favorites.service.js";
import {
    createCar,
    getCarByPublicSlug,
    getCarForPanel,
    getCarOptions,
    getPublicCarCities,
    getCarsForPanel,
    getCarsForPublic,
    updateCar,
} from "./modules/cars/cars.service.js";
import {
    createUser,
    getAllUsersForPanel,
    getPanelUsers,
    getPanelUserById,
    getUsersForDev,
    loginUser,
    requestPasswordReset,
    updatePanelUser,
    updatePanelUserAvatar,
    type ApiAuthError,
} from "./modules/auth/auth.service.js";

const app = express();
app.disable("x-powered-by");
const port = Number(process.env.PORT ?? 4000);
const clientOrigin =
    (process.env.CLIENT_ORIGIN ?? "http://localhost:3000").replace(/\/+$/, "");

app.use(
    cors({
        origin: clientOrigin,
        credentials: true,
    }),
);
app.use("/uploads", express.static(getUploadsRoot()));
app.use(express.json());

app.use(async (request, _response, next) => {
    const authHeader = request.headers.authorization;
    const token = authHeader?.startsWith("Bearer ")
        ? authHeader.slice("Bearer ".length)
        : null;

    if (!token) {
        request.userId = undefined;
        next();
        return;
    }

    const payload = await verifyAuthToken(token);
    request.userId = payload?.sub;
    next();
});

app.get("/health", (_request, response) => {
    response.json({
        ok: true,
        service: "rent-cars-api",
        databaseUrl: getDatabasePath(),
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

app.get("/api/panel/admins", async (request, response, next) => {
    try {
        if (!request.userId) {
            response.status(401).json({ message: "Требуется авторизация" });
            return;
        }

        const payload = request.headers.authorization?.startsWith("Bearer ")
            ? await verifyAuthToken(
                  request.headers.authorization.slice("Bearer ".length),
              )
            : null;

        if (
            !payload ||
            !["manager", "admin"].includes(payload.role)
        ) {
            response.status(403).json({ message: "Недостаточно прав" });
            return;
        }

        const users = await getPanelUsers();
        response.json(users);
    } catch (error) {
        next(error);
    }
});

app.get("/api/panel/users", async (request, response, next) => {
    try {
        if (!request.userId) {
            response.status(401).json({ message: "Требуется авторизация" });
            return;
        }

        const payload = request.headers.authorization?.startsWith("Bearer ")
            ? await verifyAuthToken(
                  request.headers.authorization.slice("Bearer ".length),
              )
            : null;

        if (!payload || !["manager", "admin"].includes(payload.role)) {
            response.status(403).json({ message: "Недостаточно прав" });
            return;
        }

        const users = await getAllUsersForPanel();
        response.json(users);
    } catch (error) {
        next(error);
    }
});

app.get("/api/panel/users/:id", async (request, response, next) => {
    try {
        if (!request.userId) {
            response.status(401).json({ message: "Требуется авторизация" });
            return;
        }

        const payload = request.headers.authorization?.startsWith("Bearer ")
            ? await verifyAuthToken(
                  request.headers.authorization.slice("Bearer ".length),
              )
            : null;

        if (!payload || !["manager", "admin"].includes(payload.role)) {
            response.status(403).json({ message: "Недостаточно прав" });
            return;
        }

        response.json(await getPanelUserById(request.params.id));
    } catch (error) {
        next(error);
    }
});

app.patch("/api/panel/users/:id", async (request, response, next) => {
    try {
        if (!request.userId) {
            response.status(401).json({ message: "Требуется авторизация" });
            return;
        }

        const payload = request.headers.authorization?.startsWith("Bearer ")
            ? await verifyAuthToken(
                  request.headers.authorization.slice("Bearer ".length),
              )
            : null;

        if (!payload || !["manager", "admin"].includes(payload.role)) {
            response.status(403).json({ message: "Недостаточно прав" });
            return;
        }

        response.json(await updatePanelUser(request.params.id, request.body));
    } catch (error) {
        next(error);
    }
});

app.post("/api/panel/users/:id/avatar", async (request, response, next) => {
    try {
        if (!request.userId) {
            response.status(401).json({ message: "Требуется авторизация" });
            return;
        }

        const payload = request.headers.authorization?.startsWith("Bearer ")
            ? await verifyAuthToken(
                  request.headers.authorization.slice("Bearer ".length),
              )
            : null;

        if (!payload || !["manager", "admin"].includes(payload.role)) {
            response.status(403).json({ message: "Недостаточно прав" });
            return;
        }

        const chunks: Buffer[] = [];

        request.on("data", (chunk) => {
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        });

        request.on("end", async () => {
            try {
                const mimeType = request.headers["content-type"] ?? "";

                if (!mimeType.startsWith("image/")) {
                    response.status(400).json({
                        message: "Поддерживаются только изображения",
                    });
                    return;
                }

                const user = await updatePanelUserAvatar({
                    userId: request.params.id,
                    body: Buffer.concat(chunks),
                    mimeType,
                    baseUrl: `${request.protocol}://${request.get("host")}`,
                });

                response.json(user);
            } catch (error) {
                next(error);
            }
        });

        request.on("error", next);
    } catch (error) {
        next(error);
    }
});

app.get("/api/panel/car-options", async (request, response, next) => {
    try {
        if (!request.userId) {
            response.status(401).json({ message: "Требуется авторизация" });
            return;
        }

        const payload = request.headers.authorization?.startsWith("Bearer ")
            ? await verifyAuthToken(
                  request.headers.authorization.slice("Bearer ".length),
              )
            : null;

        if (!payload || !["manager", "admin"].includes(payload.role)) {
            response.status(403).json({ message: "Недостаточно прав" });
            return;
        }

        response.json(await getCarOptions());
    } catch (error) {
        next(error);
    }
});

app.get("/api/panel/cars", async (request, response, next) => {
    try {
        if (!request.userId) {
            response.status(401).json({ message: "Требуется авторизация" });
            return;
        }

        const payload = request.headers.authorization?.startsWith("Bearer ")
            ? await verifyAuthToken(
                  request.headers.authorization.slice("Bearer ".length),
              )
            : null;

        if (!payload || !["manager", "admin"].includes(payload.role)) {
            response.status(403).json({ message: "Недостаточно прав" });
            return;
        }

        response.json(await getCarsForPanel());
    } catch (error) {
        next(error);
    }
});

app.get("/api/cars", async (_request, response, next) => {
    try {
        response.json(await getCarsForPublic());
    } catch (error) {
        next(error);
    }
});

app.get("/api/cities", async (_request, response, next) => {
    try {
        response.json(await getPublicCarCities());
    } catch (error) {
        next(error);
    }
});

app.get("/api/cars/:slug", async (request, response, next) => {
    try {
        response.json(await getCarByPublicSlug(request.params.slug));
    } catch (error) {
        next(error);
    }
});

app.get("/api/panel/cars/:id", async (request, response, next) => {
    try {
        if (!request.userId) {
            response.status(401).json({ message: "Требуется авторизация" });
            return;
        }

        const payload = request.headers.authorization?.startsWith("Bearer ")
            ? await verifyAuthToken(
                  request.headers.authorization.slice("Bearer ".length),
              )
            : null;

        if (!payload || !["manager", "admin"].includes(payload.role)) {
            response.status(403).json({ message: "Недостаточно прав" });
            return;
        }

        response.json(await getCarForPanel(request.params.id));
    } catch (error) {
        next(error);
    }
});

app.post("/api/panel/cars", async (request, response, next) => {
    try {
        if (!request.userId) {
            response.status(401).json({ message: "Требуется авторизация" });
            return;
        }

        const payload = request.headers.authorization?.startsWith("Bearer ")
            ? await verifyAuthToken(
                  request.headers.authorization.slice("Bearer ".length),
              )
            : null;

        if (!payload || !["manager", "admin"].includes(payload.role)) {
            response.status(403).json({ message: "Недостаточно прав" });
            return;
        }

        response.status(201).json(await createCar(request.body));
    } catch (error) {
        next(error);
    }
});

app.patch("/api/panel/cars/:id", async (request, response, next) => {
    try {
        if (!request.userId) {
            response.status(401).json({ message: "Требуется авторизация" });
            return;
        }

        const payload = request.headers.authorization?.startsWith("Bearer ")
            ? await verifyAuthToken(
                  request.headers.authorization.slice("Bearer ".length),
              )
            : null;

        if (!payload || !["manager", "admin"].includes(payload.role)) {
            response.status(403).json({ message: "Недостаточно прав" });
            return;
        }

        response.json(await updateCar(request.params.id, request.body));
    } catch (error) {
        next(error);
    }
});

app.post(
    "/api/panel/cars/media",
    express.raw({
        type: [
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/gif",
            "video/mp4",
            "video/webm",
            "video/quicktime",
        ],
        limit: "30mb",
    }),
    async (request, response, next) => {
        try {
            if (!request.userId) {
                response.status(401).json({ message: "Требуется авторизация" });
                return;
            }

            const mimeType = request.header("content-type");

            if (!mimeType || !Buffer.isBuffer(request.body) || request.body.length === 0) {
                response.status(400).json({ message: "Файл не передан" });
                return;
            }

            const relativeUrl = await saveCarMediaFile({
                body: request.body,
                mimeType,
            });
            const baseUrl = `${request.protocol}://${request.get("host")}`;

            response.status(201).json({
                url: relativeUrl.startsWith("http")
                    ? relativeUrl
                    : `${baseUrl}${relativeUrl}`,
            });
        } catch (error) {
            next(error);
        }
    },
);

app.get("/api/account/favorites", async (request, response, next) => {
    try {
        if (!request.userId) {
            response.status(401).json({ message: "Требуется авторизация" });
            return;
        }

        response.json(await getFavoriteCars(request.userId));
    } catch (error) {
        next(error);
    }
});

app.get("/api/account/favorite-ids", async (request, response, next) => {
    try {
        if (!request.userId) {
            response.status(401).json({ message: "Требуется авторизация" });
            return;
        }

        response.json(await getFavoriteCarIds(request.userId));
    } catch (error) {
        next(error);
    }
});

app.post("/api/account/favorites/:carId", async (request, response, next) => {
    try {
        if (!request.userId) {
            response.status(401).json({ message: "Требуется авторизация" });
            return;
        }

        response.status(201).json(await addFavorite(request.userId, request.params.carId));
    } catch (error) {
        next(error);
    }
});

app.delete("/api/account/favorites/:carId", async (request, response, next) => {
    try {
        if (!request.userId) {
            response.status(401).json({ message: "Требуется авторизация" });
            return;
        }

        response.json(await removeFavorite(request.userId, request.params.carId));
    } catch (error) {
        next(error);
    }
});

app.get("/api/account/me", async (request, response, next) => {
    try {
        if (!request.userId) {
            response.status(401).json({ message: "Требуется авторизация" });
            return;
        }

        const user = await getAccountProfile(request.userId);
        response.json(user);
    } catch (error) {
        next(error);
    }
});

app.patch("/api/account/me", async (request, response, next) => {
    try {
        if (!request.userId) {
            response.status(401).json({ message: "Требуется авторизация" });
            return;
        }

        const user = await updateAccountProfile(request.userId, request.body);
        response.json(user);
    } catch (error) {
        next(error);
    }
});

app.post(
    "/api/account/avatar",
    express.raw({
        type: ["image/jpeg", "image/png", "image/webp", "image/gif"],
        limit: "6mb",
    }),
    async (request, response, next) => {
        try {
            if (!request.userId) {
                response.status(401).json({ message: "Требуется авторизация" });
                return;
            }

            const mimeType = request.header("content-type");

            if (!mimeType || !Buffer.isBuffer(request.body) || request.body.length === 0) {
                response.status(400).json({ message: "Файл аватара не передан" });
                return;
            }

            const baseUrl = `${request.protocol}://${request.get("host")}`;
            const user = await updateAccountAvatar({
                userId: request.userId,
                body: request.body,
                mimeType,
                baseUrl,
            });

            response.json(user);
        } catch (error) {
            next(error);
        }
    },
);

app.get("/api/account/verification", async (request, response, next) => {
    try {
        if (!request.userId) {
            response.status(401).json({ message: "Требуется авторизация" });
            return;
        }

        const result = await getVerificationOverview(request.userId);
        response.json(result);
    } catch (error) {
        next(error);
    }
});

app.post(
    "/api/account/verification/files/:documentType",
    express.raw({
        type: ["image/jpeg", "image/png", "application/pdf"],
        limit: "12mb",
    }),
    async (request, response, next) => {
        try {
            if (!request.userId) {
                response.status(401).json({ message: "Требуется авторизация" });
                return;
            }

            const mimeType = request.header("content-type");
            const originalName = request.header("x-file-name") ?? "document";

            if (!mimeType || !Buffer.isBuffer(request.body) || request.body.length === 0) {
                response.status(400).json({ message: "Файл документа не передан" });
                return;
            }

            const result = await uploadVerificationFile({
                userId: request.userId,
                documentType: request.params.documentType as
                    | "passport_main"
                    | "passport_registration"
                    | "license_front"
                    | "license_back",
                body: request.body,
                mimeType,
                originalName,
            });

            response.json(result);
        } catch (error) {
            next(error);
        }
    },
);

app.post("/api/account/verification/submit", async (request, response, next) => {
    try {
        if (!request.userId) {
            response.status(401).json({ message: "Требуется авторизация" });
            return;
        }

        const result = await submitVerificationRequest(request.userId, request.body);
        response.json(result);
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

        if ("type" in error && error.type === "entity.too.large") {
            response.status(413).json({
                message: "Файл слишком большой. Максимум 6 МБ.",
            });
            return;
        }

        if (error instanceof Error && error.message === "UNSUPPORTED_AVATAR_TYPE") {
            response.status(400).json({
                message: "Поддерживаются только JPG, PNG, WEBP и GIF.",
            });
            return;
        }

        if (error instanceof Error && error.message === "UNSUPPORTED_VERIFICATION_TYPE") {
            response.status(400).json({
                message: "Для верификации поддерживаются только PDF, JPG и PNG.",
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
