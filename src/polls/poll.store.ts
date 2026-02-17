import type { Poll } from "./poll.model";
import { db } from "../database";

class PollStore {

    save(poll: Poll): void {
        
        const saveTransaction = db.transaction((p: Poll) => {
            db.run(`INSERT OR REPLACE INTO polls (id, title, createdAt, isActive) VALUES (?, ?, ?, ?)`, 
                [poll.id, poll.title, poll.createdAt.toISOString(), poll.isActive ? 1 : 0]
            );

            poll.options.forEach(
                opt => db.run(`INSERT OR REPLACE INTO options (pollId, idx, text, votes) VALUES (?, ?, ?, ?)`, 
                [poll.id, opt.index, opt.text, opt.votes])
            );
        });

        saveTransaction(poll);
    }

    getById(id: string): Poll | undefined {
        const pollRow = db.query("SELECT * FROM polls WHERE id = ?").get(id) as any;
        
        if (!pollRow) return undefined;

        const optionsRow = db.query("SELECT * FROM options WHERE pollId = ? ORDER BY idx").all(id) as any[];
        
        return {
            id: pollRow.id,
            title: pollRow.title,
            createdAt: new Date(pollRow.createdAt),
            isActive: pollRow.isActive === 1,
            options: optionsRow.map(opt => ({
                index: opt.idx,
                text: opt.text,
                votes: opt.votes
            }))
        };
    }

    getAll(): Poll[] {

        const pollRows = db.query("SELECT * FROM polls").all() as any[];

        return pollRows.map(row => {
            const optionsRows = db.query("SELECT * FROM options WHERE pollId = ? ORDER BY idx").all(row.id) as any[];
            
            return {
                id: row.id,
                title: row.title,
                createdAt: new Date(row.createdAt),
                isActive: row.isActive === 1,
                options: optionsRows.map(opt => ({
                    index: opt.idx,
                    text: opt.text,
                    votes: opt.votes
                }))
            };
        });
    }

    clear(): void {
        db.exec(`
            DELETE FROM votes;
            DELETE FROM options;
            DELETE FROM polls;
        `);
    }

    registreVote(pollId: string, userId: string): void {

        db.run(`INSERT INTO votes (pollId, userId) VALUES (?, ?)`, [pollId, userId]);
    }

    hasVoted(pollId: string, userId: string): boolean {

        const vote = db.query("SELECT * FROM votes WHERE pollId = ? AND userId = ?").get(pollId, userId);        
        return !!vote;
    }
}

export const pollStore = new PollStore();