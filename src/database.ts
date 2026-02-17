import { Database } from "bun:sqlite";

const db = new Database("stream-vote.sqlite");
const schema = `
    -- Tabela de Enquetes
    CREATE TABLE IF NOT EXISTS polls (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        isActive INTEGER DEFAULT 1
    );

    -- Tabela de Opções (ligada à poll)
    CREATE TABLE IF NOT EXISTS options (
        pollId TEXT NOT NULL,
        idx INTEGER NOT NULL,
        text TEXT NOT NULL,
        votes INTEGER DEFAULT 0,
        PRIMARY KEY (pollId, idx),
        FOREIGN KEY (pollId) REFERENCES polls(id)
    );

    -- Tabela de Votos (Controle de voto único)
    CREATE TABLE IF NOT EXISTS votes (
        pollId TEXT NOT NULL,
        userId TEXT NOT NULL,
        PRIMARY KEY (pollId, userId),
        FOREIGN KEY (pollId) REFERENCES polls(id)
    );
`;

// TODO: Depreciado
db.exec(schema);

export { db };