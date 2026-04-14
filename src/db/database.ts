import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { Pool, type PoolClient, type QueryResultRow } from "pg";

const defaultDatabaseUrl =
    "postgresql://rentcars:rentcars@localhost:5432/rentcars";
const databaseUrl = process.env.DATABASE_URL ?? defaultDatabaseUrl;

export const pool = new Pool({
    connectionString: databaseUrl,
    ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : false,
});

const schemaPath = resolve(process.cwd(), "src", "db", "schema.sql");
const schemaSql = readFileSync(schemaPath, "utf8");

await initializeDatabase();

export function getDatabasePath() {
    return databaseUrl;
}

export async function queryRows<T extends QueryResultRow = QueryResultRow>(
    text: string,
    params: unknown[] = [],
    client?: PoolClient,
) {
    const executor = client ?? pool;
    const result = await executor.query<T>(text, params);
    return result.rows;
}

export async function queryFirst<T extends QueryResultRow = QueryResultRow>(
    text: string,
    params: unknown[] = [],
    client?: PoolClient,
) {
    const rows = await queryRows<T>(text, params, client);
    return rows[0] ?? null;
}

export async function execute(
    text: string,
    params: unknown[] = [],
    client?: PoolClient,
) {
    const executor = client ?? pool;
    await executor.query(text, params);
}

export async function withTransaction<T>(callback: (client: PoolClient) => Promise<T>) {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");
        const result = await callback(client);
        await client.query("COMMIT");
        return result;
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
}

async function initializeDatabase() {
    const client = await pool.connect();

    try {
        await client.query(schemaSql);
        await syncCarReferenceData(client);
    } finally {
        client.release();
    }
}

async function syncCarReferenceData(client: PoolClient) {
    await client.query(`
        UPDATE cars
        SET brand_id = 'mercedes'
        WHERE brand_id = 'mercedes-benz'
    `);

    await client.query(`
        UPDATE cars
        SET brand_id = 'land-rover'
        WHERE brand_id = 'range-rover'
    `);

    await client.query(`
        DELETE FROM car_brands
        WHERE id IN ('mercedes-benz', 'range-rover')
    `);
}
