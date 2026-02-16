# Arquitetura — Pool System

## Visão Geral

```
┌─────────────┐     HTTP      ┌──────────────────┐
│   Cliente    │──────────────▶│                  │
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

## Camadas

### 1. Server (`server.ts`)

Ponto de entrada. Usa `Bun.serve()` com suporte a HTTP e WebSocket no mesmo servidor.

**Responsabilidades:**

- Subir o servidor HTTP na porta configurada
- Configurar upgrade HTTP → WebSocket
- Rotear requisições HTTP (futuro: REST endpoints)

### 2. WebSocket Handler (`ws/handler.ts`)

Gerencia o ciclo de vida das conexões WebSocket.

**Responsabilidades:**

- `open` — registrar cliente conectado
- `message` — parsear mensagem, validar, despachar ação
- `close` — remover cliente da lista

**Protocolo de mensagens (JSON):**

```typescript
// Cliente → Servidor
type ClientMessage =
  | { type: "CREATE_POLL"; data: { title: string; options: string[] } }
  | { type: "VOTE"; data: { pollId: string; optionIndex: number } }
  | { type: "GET_POLLS" };

// Servidor → Cliente
type ServerMessage =
  | { type: "POLL_CREATED"; data: Poll }
  | { type: "VOTE_REGISTERED"; data: PollResults }
  | { type: "POLLS_LIST"; data: Poll[] }
  | { type: "ERROR"; data: { message: string; code: string } };
```

### 3. Poll Service (`polls/poll.service.ts`)

Regras de negócio puras, sem dependência de transporte (HTTP/WS).

**Responsabilidades:**

- Criar enquete com ID único
- Registrar voto (com validação de voto único)
- Calcular resultados

### 4. Poll Store (`polls/poll.store.ts`)

Estado compartilhado in-memory usando `Map`.

```typescript
// Estrutura interna
const polls = new Map<string, Poll>();
const votes = new Map<string, Set<string>>(); // pollId → Set<voterId>
```

**Decisão de design:** Singleton exportado como módulo. Permite trocar para banco de dados no futuro sem alterar o service.

### 5. Validators (`validators/poll.validator.ts`)

Validação de dados recebidos antes de chegar ao service.

**Regras:**

- Título: string não vazia, max 200 caracteres
- Opções: array com 2–10 itens, cada um string não vazia
- Vote: pollId válido, optionIndex dentro do range

## Modelo de Dados

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

## Fluxo: Votação em Tempo Real

```
1. Cliente A cria enquete        →  CREATE_POLL
2. Servidor cria, salva no Store →  POLL_CREATED (broadcast)
3. Cliente B vota                →  VOTE
4. Servidor valida, incrementa   →  VOTE_REGISTERED (broadcast)
5. Todos os clientes atualizam a UI com novos resultados
```

## Pontos de Expansão

| Área      | Atual                        | Futuro              |
| --------- | ---------------------------- | ------------------- |
| Storage   | In-memory (Map)              | SQLite / PostgreSQL |
| Auth      | Identificação por conexão WS | JWT / Sessions      |
| Transport | WebSocket only               | + REST API          |
| Frontend  | Não incluso                  | HTML/JS ou React    |
| Deploy    | Local                        | Docker + Cloud      |

## Decisões Técnicas

1. **Sem framework HTTP** — usar `Bun.serve()` direto para entender o protocolo
2. **Sem ORM** — começar com Map, migrar para SQL manual depois
3. **Validação manual** — entender o conceito antes de usar libs (Zod, etc.)
4. **Módulos ES** — usar `import/export` nativo do Bun
