import type { Poll } from "./poll.model";
import { db } from "../db/index.ts";
import { eq, and} from "drizzle-orm"
import * as schema from "../db/schemas";
import type { User } from "../users/user.model.ts";

class PollStore {

    async save(poll: Poll): Promise<void> {

        db.insert(schema.polls).values({ 
            id: poll.id, 
            title: poll.title, 
            createdAt: poll.createdAt.toISOString(), 
            isActive: poll.isActive
        }).onConflictDoUpdate({ 
            target: schema.polls.id, 
            set: { isActive: poll.isActive, title: poll.title } 
        }).run();

        poll.options.forEach(
            opt => db.insert(schema.options).values({ 
                pollId: poll.id, 
                idx: opt.index, 
                text: opt.text, 
                votes: opt.votes 
            }).onConflictDoUpdate({
                target: [schema.options.pollId, schema.options.idx],
                set: { votes: opt.votes }
            })
            .run()
        );
    }

    async getById(id: string): Promise<Poll | undefined> {

        const result = db.select()
            .from(schema.polls)
            .where(eq(schema.polls.id, id))
            .get();

        if (!result) return undefined;

        const optionsRows = db.select()
            .from(schema.options)
            .where(eq(schema.options.pollId, id))
            .all()

        return {
            ...result,
            createdAt: new Date(result.createdAt),
            options: optionsRows.map(opt => ({
                index: opt.idx,
                text: opt.text,
                votes: opt.votes,
                isCorrect: opt.isCorrect
            }))
        };
    }

    async getAll(): Promise<Poll[]> {

        const pollRows = db.select()
            .from(schema.polls)
            .all();

        return pollRows.map(row => {
            const optionsRows = db.select()
                .from(schema.options)
                .where(eq(schema.options.pollId, row.id))
                .all()
            
            return {
                id: row.id,
                title: row.title,
                createdAt: new Date(row.createdAt),
                isActive: row.isActive,
                options: optionsRows.map(opt => ({
                    index: opt.idx,
                    text: opt.text,
                    votes: opt.votes,
                    isCorrect: opt.isCorrect
                }))
            };
        });
    }

    clear(): void {
        db.delete(schema.polls).run();
        db.delete(schema.options).run();
        db.delete(schema.votes).run();
    }

    async registreVote(pollId: string, userId: string, optionIndex: number): Promise<void> {

        db.insert(schema.votes).values({ 
            pollId: pollId, 
            userId: userId, 
            optionIndex: 
            optionIndex
        }).run();
    }

    async hasVoted(pollId: string, userId: string): Promise<boolean> {
        
        const vote = db.select()
            .from(schema.votes)
            .where(and(eq(schema.votes.pollId, pollId), eq(schema.votes.userId, userId)))
            .get();
        
        return !!vote;
    }

    async winningUsers(pollId: string, optionIndex: number): Promise<User[]> {
        
        const results = db.select({
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