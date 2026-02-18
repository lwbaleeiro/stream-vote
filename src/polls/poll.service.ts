import { pollStore } from "./poll.store";
import type { Poll } from "./poll.model";

class PollService {

  async createPoll(title: string, options: string[]) {

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

    await pollStore.save(poll);
    return poll;
  }

  async vote(pollId: string, userId: string, optionIndex: number) {
    if (!pollId) throw new Error("Parametro pollId deve ser informado");
    if (optionIndex === undefined || optionIndex === null) throw new Error("Parametro optionIndex deve ser informado");

    const poll = await pollStore.getById(pollId);

    if (!poll) throw new Error("Enquete não encontrada")
    if (!poll.options[optionIndex]) throw new Error("Opção de voto invalida.")
    if (await pollStore.hasVoted(pollId, userId)) throw new Error("Usuário já votou para essa enquete.");

    pollStore.registreVote(pollId, userId);
    poll.options[optionIndex].votes++;

    await pollStore.save(poll);
    return poll;
  }

  async getPolls() {
    const activePollsList = (await pollStore.getAll()).filter(poll => poll.isActive === true);
    return activePollsList;
  }
}

export const pollService = new PollService();
