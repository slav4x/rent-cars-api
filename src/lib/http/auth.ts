import type { Request, RequestHandler, Response } from "express";
import { verifyAuthToken } from "../jwt.js";

const PANEL_ALLOWED_ROLES = new Set(["manager", "admin"]);

export const attachAuthContext: RequestHandler = async (request, _response, next) => {
    const authHeader = request.headers.authorization;
    const token = authHeader?.startsWith("Bearer ")
        ? authHeader.slice("Bearer ".length)
        : null;

    request.userId = undefined;
    request.userRole = undefined;

    if (!token) {
        next();
        return;
    }

    const payload = await verifyAuthToken(token);
    request.userId = payload?.sub;
    request.userRole = payload?.role;
    next();
};

export const requireAuth: RequestHandler = (request, response, next) => {
    if (!request.userId) {
        response.status(401).json({ message: "Требуется авторизация" });
        return;
    }

    next();
};

export const requirePanelRole: RequestHandler = (request, response, next) => {
    if (!request.userId) {
        response.status(401).json({ message: "Требуется авторизация" });
        return;
    }

    if (!request.userRole || !PANEL_ALLOWED_ROLES.has(request.userRole)) {
        response.status(403).json({ message: "Недостаточно прав" });
        return;
    }

    next();
};

export function requireUserId(request: Request, response: Response): string | null {
    if (!request.userId) {
        response.status(401).json({ message: "Требуется авторизация" });
        return null;
    }

    return request.userId;
}
