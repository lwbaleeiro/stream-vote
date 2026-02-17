import { wsHandler, type WsData } from "./ws/handler";

const server = Bun.serve({
    port: 3000,
    fetch(request, server) {

        if (server.upgrade(request, { data: { userId: crypto.randomUUID() } })) {
            return;
        }

        return new Response("Apenas HTTP request aqui.");
    },
    websocket: wsHandler
});

console.log(`Server running at http://${server.hostname}:${server.port}`);