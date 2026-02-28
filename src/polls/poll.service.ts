import { pollStore } from "./poll.store";
import { userStore } from "../users/user.store";
import { bus } from "../events";
import type { Poll } from "./poll.model";
import type { User } from "../users/user.model";

class PollService {

  async createPoll(title: string, options: string[], endDate: Date, correctOptionIndex: number) {

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

    if (correctOptionIndex === undefined || correctOptionIndex === null) {
      throw new Error("O item correto da votação é obrigatório.");
    }

    if (correctOptionIndex < 0 || correctOptionIndex >= options.length) {
      throw new Error("Índice do item correto inválido.");
    }

    const poll: Poll = {
      id: crypto.randomUUID(),
      title,
      options: options.map((option, index) => ({
        index,
        text: option,
        votes: 0,
        isCorrect: index === correctOptionIndex,
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

    const isExpired = poll.endDate && new Date(poll.endDate) <= new Date();
    if (!poll.isActive || isExpired) {
      throw new Error("Esta enquete já está encerrada.");
    }

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
    const ranking = await userStore.getRanking();

    poll.winnersCount = winningUsers.length;

    bus.emit("ranking_changed", ranking);
    bus.emit("poll_closed", poll);
  }

  async checkExpiredPolls() {
    const polls = await pollStore.getAll();
    const now = new Date();

    for (const poll of polls) {
      if (poll.isActive && poll.endDate && poll.endDate <= now) {
        console.log(`Encerrando enquete expirada automaticamente: ${poll.title}`);
        
        // Encontrar a opção correta (marcada na criação)
        const correctIndex = poll.options.findIndex(opt => opt.isCorrect);
        
        // Se não houver opção correta marcada, simplesmente encerramos sem pontos
        if (correctIndex !== -1) {
          await this.closePolls(poll.id, correctIndex);
        } else {
          poll.isActive = false;
          await pollStore.save(poll);
          bus.emit("poll_closed", poll);
        }
      }
    }
  }

  async getInactivePolls() {
    const inactivePolls = (await pollStore.getAll()).filter(poll => poll.isActive === false);

    for (const poll of inactivePolls) {
      //if (poll.winnersCount === undefined) {
      const correctIndex = poll.options.findIndex(opt => opt.isCorrect);
      const winningUsers = await pollStore.winningUsers(poll.id, correctIndex);
        
        poll.winnersCount = winningUsers.length;
        //await pollStore.save(poll); TODO: SALVAR NO BANCO DEPOIS
      //}
    }
    
    return inactivePolls;
  }
}

export const pollService = new PollService();

async function addScore(winningUsers: User[]) {
    const POINTS_PER_CORRECT = 5;
    for (const user of winningUsers) {
        await userStore.addScore(user.id, POINTS_PER_CORRECT);
    }
}

