# Pool System — Real-Time Voting/Polls

A real-time polling system built with **TypeScript + Bun**, focused on learning:

- **WebSockets** — Bidirectional real-time communication
- **Shared State** — Managing data across multiple connections
- **Validations** — Ensuring data integrity on the backend

## Features

| Feature      | Description                             |
| ------------ | --------------------------------------- |
| Create Poll  | Title + voting options                  |
| Vote         | Select an option (1 vote per user/poll) |
| Live Results | Votes update in real-time via WebSocket |
| List Polls   | View active and closed polls            |

## Tech Stack

- **Runtime:** [Bun](https://bun.sh)
- **Language:** TypeScript
- **Communication:** Native Bun WebSockets
- **HTTP:** Bun.serve (No frameworks)
- **Storage:** In-memory (Map) — Prepared for future persistence

## Getting Started

```bash
# Install dependencies
bun install

# Push database schema
bunx drizzle-kit push

# Run server
bun run dev

# Run tests
bun test

# The server starts at http://localhost:3000

```

You should see logs in both the terminal and the browser console!

## Scripts

| Command         | Action                                |
| --------------- | ------------------------------------- |
| `bun run dev`   | Starts the server in development mode |
| `bun run start` | Starts the server in production mode  |

## Project Structure

```
pool-system/
├── src/
│   ├── server.ts          # Entry point — HTTP + WebSocket
│   ├── ws/
│   │   └── handler.ts     # WebSocket logic (connection, messages)
│   ├── polls/
│   │   ├── poll.model.ts   # Poll types and interfaces
│   │   ├── poll.store.ts   # Shared state (in-memory)
│   │   └── poll.service.ts # Business rules
│   └── validators/
│       └── poll.validator.ts # Input validations
├── package.json
├── tsconfig.json
├── README.md
└── ARCHITECTURE.md

```

## Core Concepts

### WebSockets

- HTTP → WebSocket Handshake
- Events: `open`, `message`, `close`
- Broadcasting to all connected clients

### Shared State

- Singleton in-memory store
- Concurrency: Multiple clients reading/writing
- Observer pattern to notify changes

### Validations

- Validating payloads received via WebSocket
- TypeScript Type Guards
- Returning structured errors to the client

## Roadmap

- [x] Basic Poll CRUD (HTTP)
- [x] WebSocket — Voting and receiving live results
- [x] Input validations
- [x] Single vote control per user
- [x] Basic tests
- [x] Persistence (SQLite/File)
- [x] Simple Frontend (HTML + JS)
- [x] At least one mandatory correct item
- [x] List inactive polls and winner count
- [ ] Save winner count to the database (TODO: DB PERSISTENCE)
- [ ] Create poll based on events (e.g., Sports API)
