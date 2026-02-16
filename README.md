# Pool System — Votação/Enquetes em Tempo Real

Sistema de enquetes em tempo real construído com **TypeScript + Bun**, focado em aprender:

- **WebSockets** — comunicação bidirecional em tempo real
- **Estado compartilhado** — gerenciar dados entre múltiplas conexões
- **Validações** — garantir integridade de dados no backend

## Funcionalidades

| Feature            | Descrição                                         |
| ------------------ | ------------------------------------------------- |
| Criar enquete      | Título + opções de voto                           |
| Votar              | Selecionar uma opção (1 voto por usuário/enquete) |
| Resultados ao vivo | Votos atualizam em tempo real via WebSocket       |
| Listar enquetes    | Ver enquetes ativas e encerradas                  |

## Tech Stack

- **Runtime:** [Bun](https://bun.sh)
- **Linguagem:** TypeScript
- **Comunicação:** WebSocket nativo do Bun
- **HTTP:** Bun.serve (sem frameworks)
- **Armazenamento:** In-memory (Map) — preparado para persistência futura

## Como Rodar

```bash
# Instalar dependências
bun install

# Executar servidor
bun run dev

# O servidor inicia em http://localhost:3000
```

## Scripts

| Comando         | Ação                                    |
| --------------- | --------------------------------------- |
| `bun run dev`   | Inicia servidor em modo desenvolvimento |
| `bun run start` | Inicia servidor em modo produção        |

## Estrutura do Projeto

```
pool-system/
├── src/
│   ├── server.ts          # Entry point — HTTP + WebSocket
│   ├── ws/
│   │   └── handler.ts     # Lógica WebSocket (conexão, mensagens)
│   ├── polls/
│   │   ├── poll.model.ts   # Tipos e interfaces de enquete
│   │   ├── poll.store.ts   # Estado compartilhado (in-memory)
│   │   └── poll.service.ts # Regras de negócio
│   └── validators/
│       └── poll.validator.ts # Validações de input
├── package.json
├── tsconfig.json
├── README.md
└── ARCHITECTURE.md
```

## Conceitos Ensinados

### WebSockets

- Handshake HTTP → WebSocket
- Eventos: `open`, `message`, `close`
- Broadcast para todos os clientes conectados

### Estado Compartilhado

- Singleton store em memória
- Concorrência: múltiplos clientes lendo/escrevendo
- Padrão Observer para notificar mudanças

### Validações

- Validar payloads recebidos via WebSocket
- Type guards do TypeScript
- Retornar erros estruturados ao cliente

## Roadmap

- [ ] CRUD básico de enquetes (HTTP)
- [ ] WebSocket — votar e receber resultados ao vivo
- [ ] Validações de input
- [ ] Controle de voto único por usuário
- [ ] Testes básicos
- [ ] Persistência (SQLite/arquivo)
- [ ] Frontend simples (HTML + JS)

## Licença

MIT
