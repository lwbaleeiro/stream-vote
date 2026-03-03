import { defineConfig } from "drizzle-kit";

export default defineConfig({
    out: "./drizzle",
    schema: "./src/db/schemas.ts",
    dialect: "turso",
    dbCredentials: {
        url: process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL || "file:stream-vote.sqlite",
        authToken: process.env.TURSO_AUTH_TOKEN,
    },
});