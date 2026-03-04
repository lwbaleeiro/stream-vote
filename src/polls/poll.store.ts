import type { Poll } from "./poll.model";
import { db } from "../db/index.ts";
import { eq, and} from "drizzle-orm"
import * as schema from "../db/schemas";
import type { User } from "../users/user.model.ts";

class PollStore {

    async save(poll: Poll): Promise<void> {

        await db.insert(schema.polls).values({ 
            id: poll.id, 
            title: poll.title, 
            createdAt: poll.createdAt.toISOString(), 
            isActive: poll.isActive,
            endDate: poll.endDate.toISOString(),
            winnersCount: poll.winnersCount,
            type: poll.type || "custom",
            sportKey: poll.sportKey,
            sportEventId: poll.sportEventId,
            resolved: poll.resolved || false
        }).onConflictDoUpdate({ 
            target: schema.polls.id, 
            set: { 
                isActive: poll.isActive, 
                title: poll.title,
                resolved: poll.resolved 
            } 
        }).run();

        const optionPromises = poll.options.map(
            opt => db.insert(schema.options).values({ 
                pollId: poll.id, 
                idx: opt.index, 
                text: opt.text, 
                votes: opt.votes,
                isCorrect: opt.isCorrect,
                teamId: opt.teamId,
                teamLogo: opt.teamLogo
            }).onConflictDoUpdate({
                target: [schema.options.pollId, schema.options.idx],
                set: { votes: opt.votes, isCorrect: opt.isCorrect }
            })
            .run()
        );

        await Promise.all(optionPromises);
    }

    async getById(id: string): Promise<Poll | undefined> {

        const result = await db.select()
            .from(schema.polls)
            .where(eq(schema.polls.id, id))
            .get();

        if (!result) return undefined;

        const optionsRows = await db.select()
            .from(schema.options)
            .where(eq(schema.options.pollId, id))
            .all()

        return {
            ...result,
            winnersCount: result.winnersCount ?? undefined,
            createdAt: new Date(result.createdAt),
            endDate: new Date(result.endDate),
            type: result.type as "custom" | "event_related",
            sportKey: result.sportKey ?? undefined,
            sportEventId: result.sportEventId ?? undefined,
            resolved: result.resolved,
            options: optionsRows.map(opt => ({
                index: opt.idx,
                text: opt.text,
                votes: opt.votes,
                isCorrect: opt.isCorrect,
                teamId: opt.teamId ?? undefined,
                teamLogo: opt.teamLogo ?? undefined
            }))
        };
    }

    async getAll(): Promise<Poll[]> {

        const pollRows = await db.select()
            .from(schema.polls)
            .all();

        console.log(`[DB] Fetched ${pollRows.length} poll rows from database`);

        const pollsWithOpts = await Promise.all(pollRows.map(async row => {
            const optionsRows = await db.select()
                .from(schema.options)
                .where(eq(schema.options.pollId, row.id))
                .all()
            
            return {
                id: row.id,
                title: row.title,
                createdAt: new Date(row.createdAt),
                isActive: row.isActive,
                endDate: new Date(row.endDate),
                winnersCount: row.winnersCount ?? undefined,
                type: row.type as "custom" | "event_related",
                sportKey: row.sportKey ?? undefined,
                sportEventId: row.sportEventId ?? undefined,
                resolved: row.resolved,
                options: optionsRows.map(opt => ({
                    index: opt.idx,
                    text: opt.text,
                    votes: opt.votes,
                    isCorrect: opt.isCorrect,
                    teamId: opt.teamId ?? undefined,
                    teamLogo: opt.teamLogo ?? undefined
                }))
            };
        }));

        return pollsWithOpts;
    }

    async clear(): Promise<void> {
        await db.delete(schema.polls).run();
        await db.delete(schema.options).run();
        await db.delete(schema.votes).run();
    }

    async registreVote(pollId: string, userId: string, optionIndex: number): Promise<void> {

        await db.insert(schema.votes).values({ 
            pollId: pollId, 
            userId: userId, 
            optionIndex: 
            optionIndex
        }).run();
    }

    async hasVoted(pollId: string, userId: string): Promise<boolean> {
        
        const vote = await db.select()
            .from(schema.votes)
            .where(and(eq(schema.votes.pollId, pollId), eq(schema.votes.userId, userId)))
            .get();
        
        return !!vote;
    }

    async winningUsers(pollId: string, optionIndex: number): Promise<User[]> {
        
        const results = await db.select({
            user: schema.users
        })
        .from(schema.votes)
        .innerJoin(schema.users, eq(schema.votes.userId, schema.users.id))
        .where(
            and(
                eq(schema.votes.pollId, pollId),
                eq(schema.votes.optionIndex, optionIndex)
            )
        )
        .all();

        return results.map(r => ({
            ...r.user,
            createdAt: new Date(r.user.createdAt)
        }));
    }
}

export const pollStore = new PollStore();