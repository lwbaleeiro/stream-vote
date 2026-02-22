import { pollStore } from "./poll.store";
import { userStore } from "../users/user.store";
import type { Poll } from "./poll.model";
import type { User } from "../users/user.model";

class PollService {

  async createPoll(title: string, options: string[], endDate: Date) {

    if (!title.trim()) {
      throw new Error("O título da enquete é obrigatório.");
    }

    if (isNaN(endDate.getTime())) {
      throw new Error("Data de encerramento da enquente é invalida.");
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
        votes: 0,
        isCorrect: false,
      })),
      createdAt: new Date(),
      isActive: true,
      endDate: endDate
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

    pollStore.registreVote(pollId, userId, optionIndex);
    poll.options[optionIndex].votes++;
  
    await pollStore.save(poll);
    return poll;
  }

  async getPolls() {
    const activePollsList = (await pollStore.getAll()).filter(poll => poll.isActive === true);
    return activePollsList;
  }

  async closePolls(pollId: string, correctAwnser: number) {

    if (!pollId) throw new Error("Parametro pollId deve ser informado");

    const poll = await pollStore.getById(pollId);

    if (!poll) throw new Error("Enquete não encontrada")
    if (!poll.options[correctAwnser]) throw new Error("Opção de voto invalida.")
    
    poll.isActive = false;
    poll.options[correctAwnser].isCorrect = true;

    await pollStore.save(poll);

    const winningUsers = await pollStore.winningUsers(pollId, correctAwnser);
    await addScore(winningUsers);
  }
}

export const pollService = new PollService();

async function addScore(winningUsers: User[]) {
    const POINTS_PER_CORRECT = 5;
    for (const user of winningUsers) {
        await userStore.addScore(user.id, POINTS_PER_CORRECT);
    }
}

