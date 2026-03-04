import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { migrate } from "drizzle-orm/libsql/migrator";
import * as schema from "./schemas";

const isTest = process.env.NODE_ENV === "test";
const databaseUrl = isTest ? "file:test.sqlite" : (process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL || "file:stream-vote.sqlite");

const client = createClient({
    url: databaseUrl,
    authToken: process.env.TURSO_AUTH_TOKEN,
});

export const db = drizzle(client, { schema });

// Auto-run migrations on startup
console.log(`[DB] Connecting to: ${databaseUrl.split('@')[0]}`);

if (!isTest) {
    try {
        await migrate(db, { migrationsFolder: "./drizzle" });
        console.log("[DB] Migrations applied successfully");
    } catch (error) {
        console.error("[DB] Migration failed:", error);
    }
} else {
    try {
        await migrate(db, { migrationsFolder: "./drizzle" });
    } catch (error) {
        console.error("[DB] Test migration failed:", error);
    }
}