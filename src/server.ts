import { wsHandler, type WsData } from "./ws/handler";
import { userService } from "./users/user.service"
import { pollService } from "./polls/poll.service";
import { bus } from "./events";
import path from "path";

const PUBLIC_DIR = path.resolve(import.meta.dir, "../public");

const server = Bun.serve({
    port: 3000,
    async fetch(request, server) {

        const url = new URL(request.url);
        const userIdFromUrl = url.searchParams.get("userId");

        if (server.upgrade(request, { data: { userId: userIdFromUrl || crypto.randomUUID() } })) {
            return;
        }

        if (request.method === "POST") {
            if (url.pathname === "/api/register") {

                const body = await request.json() as any;
                const user = await userService.register(body.username, body.password);
                return Response.json(user);
            }

            if (url.pathname === "/api/login") {

                const body = await request.json() as any;
                const userId = await userService.login(body.username, body.password);
                return Response.json({ userId });
            }
        }

        const filePath = url.pathname === "/" ? "/index.html" : url.pathname;
        const file = Bun.file(path.join(PUBLIC_DIR, filePath));

        if (await file.exists()) {
            return new Response(file);
        }

        return new Response("Not Found", { status: 404 });
    },
    websocket: wsHandler
});

bus.on("ranking_changed", (ranking) => {
    server.publish("general", JSON.stringify({ type: "RANKING_UPDATED", data: ranking }));
});

bus.on("poll_closed", (poll) => {
    server.publish("general", JSON.stringify({ type: "POLL_UPDATED", data: poll }));
});

// Job de verificação de enquetes expiradas (a cada 30 segundos)
setInterval(() => {
    pollService.checkExpiredPolls();
}, 30000);

console.log(`Server running at http://${server.hostname}:${server.port}`);