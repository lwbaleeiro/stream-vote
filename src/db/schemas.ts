import { sqliteTable, text, integer, primaryKey } from "drizzle-orm/sqlite-core";

export const polls = sqliteTable("polls", {
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    createdAt: text("createdAt").notNull(),
    isActive: integer("isActive", { mode: "boolean" }).default(true).notNull(),
});

export const options = sqliteTable("options", {
    pollId: text("pollId").notNull(),
    idx: integer("idx").notNull(),
    text: text("text").notNull(),
    votes: integer("votes").default(0).notNull(),
    isCorrect: integer("isCorrect", { mode: "boolean" }).default(false).notNull()
}, (table) => [primaryKey( { columns: [table.pollId, table.idx] } )]);

export const votes = sqliteTable("votes", {
    pollId: text("pollId").notNull(),
    userId: text("userId").notNull(),
    optionIndex: integer("optionIndex").notNull(),
}, (table) => [primaryKey( { columns: [table.pollId, table.userId] } )]);

export const users = sqliteTable("users", {
    id: text("id").primaryKey(),
    username: text("username").notNull().unique(),
    passwordHash: text("passwordHash").notNull(),
    createdAt: text("createdAt").notNull(),
    isActive: integer("isActive", { mode: "boolean" }).default(true).notNull(),
    score: integer("score").default(0).notNull()    
});