import type { WebSocketHandler } from "bun";
import { pollService } from "../polls/poll.service";

export const wsHandler: WebSocketHandler<any> = {
    open(ws) {
        console.log("Novo cliente conectado!");
    },
    message(ws, message) {

        try {
            const payload = JSON.parse(message.toString());
            
            switch (payload.type) {
                case "CREATE_POLL":
                    const newPoll = pollService.createPoll(payload.data.title, payload.data.options);
                    ws.send(JSON.stringify({ type: "POLL_CREATED", data: newPoll }));
                    console.log("Enquete criada:", newPoll);
                    break;
                default:
                    console.log("Tipo de mensagem desconhecido:", payload.type);
            }
        } catch (error) {
            ws.send(JSON.stringify({ type: "ERROR", message: "Invalid JSON Format" }));
        }

    },
    close(ws) {
        console.log("Cliente desconectado.");
    }
};