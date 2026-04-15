import { execute, queryFirst } from "../../db/database.js";
import type { PoolClient } from "pg";

export type StoredRefreshSession = {
    id: string;
    userId: string;
    tokenHash: string;
    expiresAt: string;
    createdAt: string;
    updatedAt: string;
    revokedAt: string | null;
};

type RefreshSessionRow = {
    id: string;
    user_id: string;
    token_hash: string;
    expires_at: string;
    created_at: string;
    updated_at: string;
    revoked_at: string | null;
};

export async function createRefreshSessionRecord(
    session: StoredRefreshSession,
    client?: PoolClient,
) {
    await execute(
        `
            INSERT INTO auth_refresh_sessions (
                id, user_id, token_hash, expires_at, created_at, updated_at, revoked_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7)
        `,
        [
            session.id,
            session.userId,
            session.tokenHash,
            session.expiresAt,
            session.createdAt,
            session.updatedAt,
            session.revokedAt,
        ],
        client,
    );

    return session;
}

export async function findRefreshSessionByTokenHash(
    tokenHash: string,
    client?: PoolClient,
) {
    const row = await queryFirst<RefreshSessionRow>(
        `
            SELECT id, user_id, token_hash, expires_at, created_at, updated_at, revoked_at
            FROM auth_refresh_sessions
            WHERE token_hash = $1
        `,
        [tokenHash],
        client,
    );

    return row ? mapRefreshSession(row) : null;
}

export async function revokeRefreshSession(
    id: string,
    revokedAt: string,
    client?: PoolClient,
) {
    await execute(
        `
            UPDATE auth_refresh_sessions
            SET revoked_at = $1, updated_at = $1
            WHERE id = $2
        `,
        [revokedAt, id],
        client,
    );
}

function mapRefreshSession(row: RefreshSessionRow): StoredRefreshSession {
    return {
        id: row.id,
        userId: row.user_id,
        tokenHash: row.token_hash,
        expiresAt: row.expires_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        revokedAt: row.revoked_at,
    };
}
