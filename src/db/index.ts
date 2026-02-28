import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schemas";

const client = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
});

// Create tables if they don't exist (LibSQL style)
await client.execute(`
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        passwordHash TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        isActive INTEGER DEFAULT 1 NOT NULL,
        score INTEGER DEFAULT 0 NOT NULL
    );
`);

await client.execute(`
    CREATE TABLE IF NOT EXISTS polls (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        isActive INTEGER DEFAULT 1 NOT NULL,
        endDate TEXT NOT NULL
    );
`);

await client.execute(`
    CREATE TABLE IF NOT EXISTS options (
        pollId TEXT NOT NULL,
        idx INTEGER NOT NULL,
        text TEXT NOT NULL,
        votes INTEGER DEFAULT 0 NOT NULL,
        isCorrect INTEGER DEFAULT 0 NOT NULL,
        PRIMARY KEY (pollId, idx),
        FOREIGN KEY (pollId) REFERENCES polls(id) ON DELETE CASCADE
    );
`);

await client.execute(`
    CREATE TABLE IF NOT EXISTS votes (
        pollId TEXT NOT NULL,
        userId TEXT NOT NULL,
        optionIndex INTEGER NOT NULL,
        PRIMARY KEY (pollId, userId),
        FOREIGN KEY (pollId) REFERENCES polls(id) ON DELETE CASCADE
    );
`);

export const db = drizzle(client, { schema });