import { pollStore } from "./poll.store";
import type { Poll } from "./poll.model";

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

  vote(pollId: string, userId: string, optionIndex: number) {
    if (!pollId) throw new Error("Parametro pollId deve ser informado");
    if (optionIndex === undefined || optionIndex === null) throw new Error("Parametro optionIndex deve ser informado");

    const poll = pollStore.getById(pollId);

    if (!poll) throw new Error("Enquete não encontrada")
    if (!poll.options[optionIndex]) throw new Error("Opção ded voto invalida.")
    if (pollStore.hasVoted(pollId, userId)) throw new Error("Usuário já votou para essa enquete.");

    pollStore.registreVote(pollId, userId);
    poll.options[optionIndex].votes++;

    pollStore.save(poll);
    return poll;
  }

  getPolls() {
    const activePollsList = pollStore.getAll().filter(poll => poll.isActive === true);
    return activePollsList;
  }
}

export const pollService = new PollService();
