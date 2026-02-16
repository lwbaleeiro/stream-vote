import type { Poll } from "./poll.model";

class PollStore {
    private polls = new Map<string, Poll>();

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
}

export const pollStore = new PollStore();