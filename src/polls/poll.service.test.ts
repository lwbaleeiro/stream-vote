import { describe, test, expect, beforeEach } from "bun:test";
import { pollService } from "./poll.service";
import { pollStore } from "./poll.store";

describe("Poll Service", () => {

  beforeEach(() => {
    pollStore.clear();
  });

  test("Deve criar uma enquete com sucesso", async () => {
    const poll = await pollService.createPoll("Qual sua cor favorita?", ["Azul", "Verde", "Paçoca"])

    expect(poll).not.toBeNull();
    expect(poll.title).toBe("Qual sua cor favorita?");
    expect(poll.options.length).toBe(3);
    expect(poll.options.every(option => option.votes === 0)).toBe(true);
    expect(poll.isActive).toBe(true);
  })

  test("Deve lançar erro se não tiver opções", () => {
    expect(pollService.createPoll("Qual sua cor favorita?", ["Paçoca"]))
      .rejects.toThrow("Uma enquete deve ter pelo menos 2 opções.");
  })

  test("Deve lançar erro se não tiver título", () => {
    expect(pollService.createPoll("", ["Paçoca", "Doce de Leite"]))
      .rejects.toThrow("O título da enquete é obrigatório.");
  })

  test("Deve lançar erro se tiver opções inválidas", () => {
    expect(pollService.createPoll("Qual sua cor favorita?", ["Paçoca", ""]))
      .rejects.toThrow("Todas as opções devem ter um texto válido.");
  })


  test("Deve votar com sucesso", async () => {

    const poll = await pollService.createPoll("Cor?", ["Azul", "Verde", "Vermelho"])

    await pollService.vote(poll.id, "1", 0,);
    const updatedPoll = await pollService.vote(poll.id, "2", 1);

    expect(updatedPoll.options[0]?.votes).toBe(1);
    expect(updatedPoll.options[1]?.votes).toBe(1);
    expect(updatedPoll.options[2]?.votes).toBe(0);
  })

  test("Deve barrar mesmo usuário votar duas vezes", async () => {
    const poll = await  pollService.createPoll("Idade", ["22", "34"]);
    const userId = "abc1";

    await pollService.vote(poll.id, userId, 1);

    expect(pollService.vote(poll.id, userId, 1)).rejects.toThrow("Usuário já votou para essa enquete.")
  })
})
