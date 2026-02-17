import type { Poll } from "./poll.model";

class PollStore {
    private polls = new Map<string, Poll>();
    private votes = new Map<string, Set<string>>();

    save(poll: Poll): void {
        this.polls.set(poll.id, poll);
    }

    getById(id: string): Poll | undefined {
        return this.polls.get(id);
    }

    getAll(): Poll[] {
        return Array.from(this.polls.values());
    }

    clear(): void {
        this.polls.clear();
    }

    registreVote(pollId: string, userId: string): void {
        if (!this.votes.has(pollId)) {
            this.votes.set(pollId, new Set());
        }
        this.votes.get(pollId)!.add(userId);
    }

    hasVoted(pollId: string, userId: string): boolean {
        return this.votes.get(pollId)?.has(userId) ?? false;
    }
}

export const pollStore = new PollStore();