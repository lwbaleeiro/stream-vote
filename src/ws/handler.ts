import type { WebSocketHandler } from "bun";
import { pollService } from "../polls/poll.service";

export const wsHandler: WebSocketHandler<any> = {
  open(ws) {
    console.log("Novo cliente conectado!");

    ws.subscribe("general");
  },
  message(ws, message) {

    try {
      const payload = JSON.parse(message.toString());

      switch (payload.type) {
        case "CREATE_POLL":
          const newPoll = pollService.createPoll(payload.data.title, payload.data.options);

          ws.send(JSON.stringify({ type: "POLL_CREATED", data: newPoll }));
          ws.publish("general", JSON.stringify({ type: "POLL_CREATED", data: newPoll }));

          console.log("Enquete criada:", newPoll);
          break;
        case "VOTE":
          console.log(" >> case vote payload: ", payload);

          const updatedPoll = pollService.vote(payload.data.pollId, payload.data.optionsIndex);
          console.log("updatedPoll: ", updatedPoll);

          ws.publish("general", JSON.stringify({ type: "POLL_UPDATED", data: updatedPoll }));
          console.log("published")
          ws.send(JSON.stringify({ type: "POLL_UPDATED", data: updatedPoll }));
          console.log("send")

          console.log("Voto computado para a enquete: ", updatedPoll.title);
          break;
        default:
          console.log("Tipo de mensagem desconhecido:", payload.type);
          break;
      }
    } catch (error) {
      ws.send(JSON.stringify({ type: "ERROR", message: "Invalid JSON Format" }));
    }

  },
  close(ws) {
    console.log("Cliente desconectado.");

    ws.unsubscribe("general");
  }
};
