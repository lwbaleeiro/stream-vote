import { describe, test, expect, beforeEach } from "bun:test";
import { pollService } from "./poll.service";
import { pollStore } from "./poll.store";

describe("Poll Service", () => {

    beforeEach(() => {
        pollStore.clear();
    });

    test("Deve criar uma enquete com sucesso", () => {
        const poll = pollService.createPoll("Qual sua cor favorita?", ["Azul", "Verde", "Paçoca"])

        expect(poll).not.toBeNull();
        expect(poll.title).toBe("Qual sua cor favorita?");
        expect(poll.options.length).toBe(3);
        expect(poll.options.every(option => option.votes === 0)).toBe(true);
        expect(poll.isActive).toBe(true);
    })

    test("Deve lançar erro se não tiver opções", () => {
        expect(() => pollService.createPoll("Qual sua cor favorita?", ["Paçoca"])).toThrow("Uma enquete deve ter pelo menos 2 opções.");
    })

    test("Deve lançar erro se não tiver título", () => {
        expect(() => pollService.createPoll("", ["Paçoca", "Doce de Leite"])).toThrow("O título da enquete é obrigatório.");
    })

    test("Deve lançar erro se tiver opções inválidas", () => {
        expect(() => pollService.createPoll("Qual sua cor favorita?", ["Paçoca", ""])).toThrow("Todas as opções devem ter um texto válido.");
    })
})