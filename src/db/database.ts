import { mkdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";

const defaultDatabasePath = resolve(process.cwd(), "data", "rent-cars.sqlite");
const databasePath = resolve(process.cwd(), process.env.DATABASE_PATH ?? defaultDatabasePath);

mkdirSync(dirname(databasePath), { recursive: true });

export const database = new DatabaseSync(databasePath);

const schemaPath = resolve(process.cwd(), "src", "db", "schema.sql");
const schemaSql = readFileSync(schemaPath, "utf8");

database.exec(schemaSql);
ensureUsersColumns();

export function getDatabasePath() {
    return databasePath;
}

function ensureUsersColumns() {
    const columns = database
        .prepare("PRAGMA table_info(users)")
        .all() as Array<{ name: string }>;
    const existingColumns = new Set(columns.map((column) => column.name));

    const migrations = [
        {
            name: "avatar_url",
            sql: "ALTER TABLE users ADD COLUMN avatar_url TEXT",
        },
        {
            name: "birth_date",
            sql: "ALTER TABLE users ADD COLUMN birth_date TEXT",
        },
        {
            name: "auth_status",
            sql: "ALTER TABLE users ADD COLUMN auth_status TEXT NOT NULL DEFAULT 'pending'",
        },
        {
            name: "role",
            sql: "ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'user'",
        },
        {
            name: "updated_at",
            sql: "ALTER TABLE users ADD COLUMN updated_at TEXT NOT NULL DEFAULT ''",
        },
        {
            name: "last_login_at",
            sql: "ALTER TABLE users ADD COLUMN last_login_at TEXT",
        },
        {
            name: "last_booking_at",
            sql: "ALTER TABLE users ADD COLUMN last_booking_at TEXT",
        },
        {
            name: "last_activity_at",
            sql: "ALTER TABLE users ADD COLUMN last_activity_at TEXT",
        },
    ];

    for (const migration of migrations) {
        if (existingColumns.has(migration.name)) {
            continue;
        }

        database.exec(migration.sql);
    }

    database.exec(`
        UPDATE users
        SET updated_at = created_at
        WHERE updated_at = ''
    `);
}
