import type { WebSocketHandler } from "bun";
import { pollService } from "../polls/poll.service";
import { validateCreatePoll, validateVote } from "../validators/poll.validator";

export interface WsData {
  userId: string;
}

export const wsHandler: WebSocketHandler<WsData> = {
  open(ws) {
    console.log("Novo cliente conectado:", ws.data.userId);

    ws.subscribe("general");
  },
  async message(ws, message) {

    try {
      const payload = JSON.parse(message.toString());

      switch (payload.type) {
        case "CREATE_POLL":
        const validData = validateCreatePoll(payload.data);
        const newPoll = await pollService.createPoll(validData.title, validData.options);

          ws.send(JSON.stringify({ type: "POLL_CREATED", data: newPoll }));
          ws.publish("general", JSON.stringify({ type: "POLL_CREATED", data: newPoll }));

          console.log("Enquete criada:", newPoll);
          break;
        case "VOTE":
          const validVoteData = validateVote(payload.data);

          const updatedPoll = await pollService.vote(validVoteData.pollId, ws.data.userId, validVoteData.optionIndex);

          ws.publish("general", JSON.stringify({ type: "POLL_UPDATED", data: updatedPoll }));
          ws.send(JSON.stringify({ type: "POLL_UPDATED", data: updatedPoll }));

          console.log("Voto computado para a enquete: ", updatedPoll.title);
          break;
        case "GET_POLLS":
          const pollsList = await pollService.getPolls();

         ws.send(JSON.stringify({ type: "POLLS_LIST", data: pollsList }));

          console.log("Retornado list de polls ativas.");
          break;
        default:
          console.log("Tipo de mensagem desconhecido:", payload.type);
          break;
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Erro desconhecido";
      ws.send(JSON.stringify({ type: "ERROR", data: { message: msg} }));
    }

  },
  close(ws) {
    console.log("Cliente desconectado.");

    ws.unsubscribe("general");
  }
};
