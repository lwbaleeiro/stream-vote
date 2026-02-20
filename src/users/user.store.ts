import type { User } from "./user.model";
import { db } from "../db/index.ts";
import { eq } from "drizzle-orm";
import * as schema from "../db/schemas";    

class UserStore {

    async save(user: User): Promise<void> {

        db.insert(schema.users).values({
            id: user.id,
            username: user.username,
            passwordHash: user.passwordHash,
            createdAt: user.createdAt.toISOString(),
            isActive: user.isActive,
            score: user.score ?? 0
        }).onConflictDoUpdate({
            target: schema.users.id,
            set: { passwordHash: user.passwordHash, isActive: user.isActive }
        }).run();
    }

    async getByUsername(username: string): Promise<User | undefined> {
        
        const result = db.select()
            .from(schema.users)
            .where(eq(schema.users.username, username))
            .get();

        if (!result) return undefined;

        return {
            ...result,
            createdAt: new Date(result.createdAt),
            score: result.score ?? 0
        }
    }

    clear() {
        db.delete(schema.users).run();
    }

    async addScore(userId: string, points: number): Promise<void> {
        const user = db.select().from(schema.users).where(eq(schema.users.id, userId)).get();
        if (!user) return;
        
        db.update(schema.users)
            .set({ score: user.score + points })
            .where(eq(schema.users.id, userId))
            .run();
    }
}

export const userStore = new UserStore();