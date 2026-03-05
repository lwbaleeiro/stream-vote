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
      endDate: endDate,
      type: "custom",
      resolved: false
    };

    await pollStore.save(poll);
    return poll;
  }

  async createEventPoll(sportKey: string, gameId: string) {
    const { sportsService } = await import("../services/sports");
    const apiKey = process.env.BALLDONTLIE_API_KEY;

    if (!apiKey) throw new Error("API Key not configured");

    // Fetch game details to create poll
    // Since we don't have a direct 'getGameById' yet in the facade that returns UnifiedGame, 
    // we might need to adjust. But let's assume we use getUpcomingGames and find the game, 
    // or better, implement a getGameById in the service.
    
    // For now, let's use a simplified approach: fetch upcoming and find
    const games = await sportsService.getUpcomingGames(sportKey as any, "", apiKey);
    const game = games.find(g => g.id === gameId);

    if (!game) throw new Error("Game not found or too far in the future.");

    const poll: Poll = {
        id: crypto.randomUUID(),
        title: `${game.homeTeam.name} vs ${game.awayTeam.name}`,
        type: "event_related",
        sportKey,
        sportEventId: gameId,
        createdAt: new Date(),
        isActive: true,
        endDate: game.pollClosesAt,
        resolved: false,
        options: [
            {
                index: 0,
                text: game.homeTeam.name,
                votes: 0,
                isCorrect: false,
                teamId: game.homeTeam.id,
                teamLogo: game.homeTeam.logo
            },
            {
                index: 1,
                text: game.awayTeam.name,
                votes: 0,
                isCorrect: false,
                teamId: game.awayTeam.id,
                teamLogo: game.awayTeam.logo
            }
        ]
    };

    // Add "Draw" option for sports that allow it (like Soccer)
    if (sportKey === "soccer") {
        poll.options.push({
            index: 2,
            text: "Draw",
            votes: 0,
            isCorrect: false
        });
    }

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

    await pollStore.registreVote(pollId, userId, optionIndex);
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

        const correctIndex = poll.options.findIndex(opt => opt.isCorrect);

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
    const inactivePolls = (await pollStore.getAll()).filter(
      poll => poll.isActive === false && poll.winnersCount === undefined
    );

    for (const poll of inactivePolls) {

      const correctIndex = poll.options.findIndex(opt => opt.isCorrect);
      const winningUsers = await pollStore.winningUsers(poll.id, correctIndex);
        
      poll.winnersCount = winningUsers.length;
      await pollStore.save(poll);
    }
    
    return inactivePolls;
  }

  async resolveEventPolls() {
    const polls = await pollStore.getAll();
    const apiKey = process.env.BALLDONTLIE_API_KEY || "";
    
    if (!apiKey) {
        console.warn("[Cron] API Key not configured, skipping event resolution");
        return;
    }

    const { sportsService } = await import("../services/sports");

    const pendingPolls = polls.filter(poll => 
        poll.type === "event_related" && poll.isActive && !poll.resolved
    );

    if (pendingPolls.length === 0) return;

    console.log(`[Cron] Checking ${pendingPolls.length} pending event polls...`);

    for (const poll of pendingPolls) {
        try {
            if (!poll.sportKey || !poll.sportEventId) continue;

            const result = await sportsService.getGameResult(
                poll.sportKey as any, 
                poll.sportEventId, 
                apiKey
            );

            if (result && result.finished) {
                console.log(`[Cron] Game ${poll.sportEventId} finished! Resolving poll: ${poll.title}`);

                let correctIndex = -1;
                if (result.winnerId) {
                    correctIndex = poll.options.findIndex(opt => opt.teamId === result.winnerId);
                } else if (poll.sportKey === "soccer") {
                    correctIndex = poll.options.findIndex(opt => opt.text.toLowerCase() === "draw");
                }

                if (correctIndex !== -1) {
                    await this.closePolls(poll.id, correctIndex);
                    
                    poll.resolved = true;
                    await pollStore.save(poll);
                    
                    console.log(`[Cron] Poll ${poll.id} resolved successfully.`);
                } else {
                    console.error(`[Cron] Could not find winning option for poll ${poll.id} (WinnerID: ${result.winnerId})`);
                }
            }
        } catch (error) {
            console.error(`[Cron] Error resolving poll ${poll.id}:`, error);
        }
    }
  }
}

export const pollService = new PollService();

async function addScore(winningUsers: User[]) {
    const POINTS_PER_CORRECT = 5;
    for (const user of winningUsers) {
        await userStore.addScore(user.id, POINTS_PER_CORRECT);
    }
}

