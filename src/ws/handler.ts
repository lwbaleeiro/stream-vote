import type { WebSocketHandler } from "bun";
import { pollService } from "../polls/poll.service";
import { pollStore } from "../polls/poll.store";
import { userStore } from "../users/user.store";
import { validateCreatePoll, validateVote } from "../validators/poll.validator";
import { sportsService } from "../services/sports";

export interface WsData {
  userId: string;
}

export const wsHandler: WebSocketHandler<WsData> = {
  open(ws) {
    console.log("New client connected:", ws.data.userId);

    ws.subscribe("general");
  },
  async message(ws, message) {

    try {
      const payload = JSON.parse(message.toString());

      switch (payload.type) {
        case "CREATE_POLL":
        const validData = validateCreatePoll(payload.data);
        const newPoll = await pollService.createPoll(validData.title, validData.options, validData.endDate, validData.correctOptionIndex);

          ws.send(JSON.stringify({ type: "POLL_CREATED", data: newPoll }));
          ws.publish("general", JSON.stringify({ type: "POLL_CREATED", data: newPoll }));

          console.log("Poll created:", newPoll);
          break;
        case "VOTE":
          const validVoteData = validateVote(payload.data);
          const updatedPoll = await pollService.vote(validVoteData.pollId, ws.data.userId, validVoteData.optionIndex);

          ws.publish("general", JSON.stringify({ type: "POLL_UPDATED", data: updatedPoll }));
          ws.send(JSON.stringify({ type: "POLL_UPDATED", data: updatedPoll }));

          console.log("Vote computed for poll: ", updatedPoll.title);
          break;
        case "GET_POLLS":
          const pollsList = await pollService.getPolls();
  

          ws.send(JSON.stringify({ type: "POLLS_LIST", data: pollsList }));

          console.log("Returned active polls list.");
          break;
        case "GET_INACTIVE_POLLS":
          const inactivePolls = await pollService.getInactivePolls();

          ws.send(JSON.stringify({ type: "INACTIVE_POLLS_LIST", data: inactivePolls }));

          console.log("Returned inactive polls list.");
          break;          
        default:
          console.log("Unknown message type:", payload.type);
          break;
        case "GET_RANKING":
          const ranking = await userStore.getRanking();
          ws.send(JSON.stringify({ type: "RANKING_LIST", data: ranking }))
          break;
        case "GET_UPCOMING_GAMES":
          const { sportKey, leagueId } = payload.data;
          const apiKey = process.env.BALLDONTLIE_API_KEY || "";
          const games = await sportsService.getUpcomingGames(sportKey, leagueId, apiKey);
          const existingPollGameIds = await pollStore.getEventPollGameIds(sportKey);
          const filteredGames = games.filter(g => !existingPollGameIds.includes(g.id));
          ws.send(JSON.stringify({ type: "UPCOMING_GAMES_LIST", data: filteredGames }));
          break;
        case "CREATE_EVENT_POLL":
          const eventPoll = await pollService.createEventPoll(payload.data.sportKey, payload.data.gameId);
          ws.send(JSON.stringify({ type: "POLL_CREATED", data: eventPoll }));
          ws.publish("general", JSON.stringify({ type: "POLL_CREATED", data: eventPoll }));
          break;
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      console.error(`[WS ERROR] ${msg}`, error);
      ws.send(JSON.stringify({ type: "ERROR", data: { message: msg} }));
    }

  },
  close(ws) {
    console.log("Client disconnected.");

    ws.unsubscribe("general");
  }
};
