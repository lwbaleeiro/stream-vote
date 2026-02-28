# Architecture — Pool System

## Overview

```
┌─────────────┐     HTTP      ┌──────────────────┐
│   Client     │──────────────▶│                  │
│  (Browser)   │              │   Bun.serve()    │
│              │◀─────────────│   server.ts      │
│              │   WebSocket   │                  │
└─────────────┘               └────────┬─────────┘
                                       │
                              ┌────────▼─────────┐
                              │   WS Handler     │
                              │   handler.ts     │
                              └────────┬─────────┘
                                       │
                         ┌─────────────┼─────────────┐
                         ▼             ▼             ▼
                  ┌────────────┐ ┌──────────┐ ┌────────────┐
                  │  Validator │ │ Service  │ │   Store    │
                  │            │ │          │ │ (in-memory)│
                  └────────────┘ └──────────┘ └────────────┘

```

## Layers

### 1. Server (`server.ts`)

The entry point. Uses `Bun.serve()` with integrated HTTP and WebSocket support on the same server instance.

**Responsibilities:**

- Spin up the HTTP server on the configured port.
- Handle the HTTP → WebSocket upgrade handshake.
- Route HTTP requests (Future: REST endpoints).

### 2. WebSocket Handler (`ws/handler.ts`)

Manages the lifecycle of WebSocket connections.

**Responsibilities:**

- `open` — Register a newly connected client.
- `message` — Parse incoming messages, validate, and dispatch actions.
- `close` — Remove the client from the active list.

**Message Protocol (JSON):**

```typescript
// Client → Server
type ClientMessage =
  | { type: "CREATE_POLL"; data: { title: string; options: string[] } }
  | { type: "VOTE"; data: { pollId: string; optionIndex: number } }
  | { type: "GET_POLLS" };

// Server → Client
type ServerMessage =
  | { type: "POLL_CREATED"; data: Poll }
  | { type: "VOTE_REGISTERED"; data: PollResults }
  | { type: "POLLS_LIST"; data: Poll[] }
  | { type: "ERROR"; data: { message: string; code: string } };
```

### 3. Poll Service (`polls/poll.service.ts`)

Pure business logic, decoupled from the transport layer (HTTP/WS).

**Responsibilities:**

- Creating polls with unique IDs.
- Registering votes (including single-vote validation).
- Calculating real-time results.

### 4. Poll Store (`polls/poll.store.ts`)

Shared in-memory state using `Map`.

```typescript
// Internal Structure
const polls = new Map<string, Poll>();
const votes = new Map<string, Set<string>>(); // pollId → Set<voterId>
```

**Design Decision:** Exported as a Singleton module. This allows for a future switch to a persistent database without modifying the service layer.

### 5. Validators (`validators/poll.validator.ts`)

Data validation layer for incoming payloads before they reach the service.

**Rules:**

- **Title:** Non-empty string, max 200 characters.
- **Options:** Array of 2–10 items, each being a non-empty string.
- **Vote:** Valid `pollId`, `optionIndex` within range.

## Data Model

```typescript
interface Poll {
  id: string;
  title: string;
  options: PollOption[];
  createdAt: Date;
  isActive: boolean;
}

interface PollOption {
  index: number;
  text: string;
  votes: number;
}
```

## Flow: Real-Time Voting

1. **Client A** creates a poll → `CREATE_POLL`
2. **Server** creates poll, saves to Store → `POLL_CREATED` (broadcast)
3. **Client B** casts a vote → `VOTE`
4. **Server** validates and increments → `VOTE_REGISTERED` (broadcast)
5. **All clients** update UI with the new results.

## Roadmap & Expansion

| Area      | Current                      | Future              |
| --------- | ---------------------------- | ------------------- |
| Storage   | In-memory (Map)              | SQLite / PostgreSQL |
| Auth      | WS connection identification | JWT / Sessions      |
| Transport | WebSocket only               | + REST API          |
| Frontend  | Not included                 | HTML/JS or React    |
| Deploy    | Local                        | Docker + Cloud      |

## Technical Decisions

1. **No HTTP Framework** — Using `Bun.serve()` directly to master the underlying protocol.
2. **No ORM** — Starting with `Map` to prioritize speed, migrating to manual SQL later.
3. **Manual Validation** — Learning core concepts before implementing libraries like Zod.
4. **ES Modules** — Leveraging Bun's native `import/export` support.
