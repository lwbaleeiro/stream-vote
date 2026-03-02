import { wsHandler, type WsData } from "./ws/handler";
import { userService } from "./users/user.service"
import { pollService } from "./polls/poll.service";
import { bus } from "./events";
import path from "path";

const PUBLIC_DIR = path.resolve(import.meta.dir, "../public");

const PORT = Number(process.env.PORT) || 3000;

const server = Bun.serve({
    port: PORT,
    async fetch(request, server) {

        const url = new URL(request.url);
        let userIdFromUrl = url.searchParams.get("userId");

        // Handle string "null" or empty string from URL
        if (userIdFromUrl === "null" || !userIdFromUrl) {
            userIdFromUrl = crypto.randomUUID();
        }

        if (server.upgrade(request, { data: { userId: userIdFromUrl } })) {
            return;
        }

        if (request.method === "POST") {
            if (url.pathname === "/api/register") {

                const body = await request.json() as any;
                try {
                    const user = await userService.register(body.username, body.password);
                    return Response.json(user);                    
                } catch (error) {
                    if (error instanceof Error) { 
                        return Response.json({ message: error.message }, { status: 400 }) 
                    }

                    return Response.json({ message: "An unexpected error occured"}, { status: 500 });
                }
            }

            if (url.pathname === "/api/login") {

                const body = await request.json() as any;
                try {
                    const userId = await userService.login(body.username, body.password);
                    return Response.json({ userId });                    
                } catch (error) {
                    if (error instanceof Error) { 
                        return Response.json({ message: error.message }, { status: 400 }) 
                    }

                    return Response.json({ message: "An unexpected error occured"}, { status: 500 });                    
                }
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