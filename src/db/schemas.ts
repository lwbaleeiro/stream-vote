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
}, (table) => [primaryKey( { columns: [table.pollId, table.idx] } )]);

export const votes = sqliteTable("votes", {
    pollId: text("pollId").notNull(),
    userId: text("userId").notNull(),
}, (table) => [primaryKey( { columns: [table.pollId, table.userId] } )]);