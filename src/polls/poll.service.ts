import { pollStore } from "./poll.store";
import { userStore } from "../users/user.store";
import { bus } from "../events";
import type { Poll } from "./poll.model";
import type { User } from "../users/user.model";

class PollService {

  async createPoll(title: string, options: string[], endDate: Date, correctOptionIndex: number) {

    if (!title.trim()) {
      throw new Error("Poll title is required.");
    }

    if (isNaN(endDate.getTime())) {
      throw new Error("Invalid poll end date.");
    }

    if (options.length < 2) {
      throw new Error("A poll must have at least 2 options.");
    }

    if (options.some(option => !option.trim())) {
      throw new Error("All options must have valid text.");
    }

    if (correctOptionIndex === undefined || correctOptionIndex === null) {
      throw new Error("The correct item for the vote is required.");
    }

    if (correctOptionIndex < 0 || correctOptionIndex >= options.length) {
      throw new Error("Invalid correct item index.");
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
    if (!pollId) throw new Error("Parameter pollId must be provided");
    if (optionIndex === undefined || optionIndex === null) throw new Error("Parameter optionIndex must be provided");

    const poll = await pollStore.getById(pollId);
    if (!poll) throw new Error("Poll not found")

    const isExpired = poll.endDate && new Date(poll.endDate) <= new Date();
    if (!poll.isActive || isExpired) {
      throw new Error("This poll is already closed.");
    }

    if (!poll.options[optionIndex]) throw new Error("Invalid vote option.")
    if (await pollStore.hasVoted(pollId, userId)) throw new Error("User has already voted in this poll.");

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

    if (!pollId) throw new Error("Parameter pollId must be provided");

    const poll = await pollStore.getById(pollId);

    if (!poll) throw new Error("Poll not found")
    if (!poll.options[correctAwnser]) throw new Error("Invalid vote option.")
    
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
        console.log(`Automatically closing expired poll: ${poll.title}`);
        
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

