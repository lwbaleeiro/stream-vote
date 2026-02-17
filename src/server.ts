import { wsHandler, type WsData } from "./ws/handler";
import path from "path";

const PUBLIC_DIR = path.resolve(import.meta.dir, "../public");

const server = Bun.serve({
    port: 3000,
    async fetch(request, server) {

        if (server.upgrade(request, { data: { userId: crypto.randomUUID() } })) {
            return;
        }

        const url = new URL(request.url);
        const filePath = url.pathname === "/" ? "/index.html" : url.pathname;
        const file = Bun.file(path.join(PUBLIC_DIR, filePath));

        if (await file.exists()) {
            return new Response(file);
        }

        return new Response("Not Found", { status: 404 });
    },
    websocket: wsHandler
});

console.log(`Server running at http://${server.hostname}:${server.port}`);