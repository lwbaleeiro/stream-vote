import { drizzle } from "drizzle-orm/bun-sqlite";
import { Database } from "bun:sqlite";
import * as schema from "./schemas";

const sqlite = new Database("stream-vote.sqlite");

sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        passwordHash TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        isActive INTEGER DEFAULT 1 NOT NULL,
        score INTEGER DEFAULT 0 NOT NULL
    );

    CREATE TABLE IF NOT EXISTS polls (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        isActive INTEGER DEFAULT 1 NOT NULL,
        endDate TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS options (
        pollId TEXT NOT NULL,
        idx INTEGER NOT NULL,
        text TEXT NOT NULL,
        votes INTEGER DEFAULT 0 NOT NULL,
        isCorrect INTEGER DEFAULT 0 NOT NULL,
        PRIMARY KEY (pollId, idx),
        FOREIGN KEY (pollId) REFERENCES polls(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS votes (
        pollId TEXT NOT NULL,
        userId TEXT NOT NULL,
        optionIndex INTEGER NOT NULL,
        PRIMARY KEY (pollId, userId),
        FOREIGN KEY (pollId) REFERENCES polls(id) ON DELETE CASCADE
    );
`);

export const db = drizzle(sqlite, { schema });