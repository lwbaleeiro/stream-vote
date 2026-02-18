import { drizzle } from "drizzle-orm/bun-sqlite";
import { Database } from "bun:sqlite";
import * as schema from "./schemas";

const sqlite = new Database("stream-vote.sqlite");
export const db = drizzle(sqlite, { schema });