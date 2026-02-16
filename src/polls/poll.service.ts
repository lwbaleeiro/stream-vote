import { pollStore } from "./poll.store";
import type { Poll, PollOption } from "./poll.model";

class PollService {

    createPoll(title: string, options: string[]) {
        
        if (!title.trim()) {
            throw new Error("O título da enquete é obrigatório.");
        }

        if (options.length < 2) {
            throw new Error("Uma enquete deve ter pelo menos 2 opções.");
        }

        if (options.some(option => !option.trim())) {
            throw new Error("Todas as opções devem ter um texto válido.");
        }

        const poll: Poll = {
            id: crypto.randomUUID(),
            title,
            options: options.map((option, index) => ({
                index,
                text: option,
                votes: 0
            })),
            createdAt: new Date(),
            isActive: true
        };

        pollStore.save(poll);
        return poll;
    }
}

export const pollService = new PollService();