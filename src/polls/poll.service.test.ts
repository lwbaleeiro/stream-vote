import { describe, test, expect, beforeEach } from "bun:test";
import { pollService } from "./poll.service";
import { pollStore } from "./poll.store";

describe("Poll Service", () => {

  beforeEach(async () => {
    // tirar de prod
    await pollStore.clear();
  });

  test("Deve criar uma enquete com sucesso", async () => {
    const poll = await pollService.createPoll(
      "Qual sua cor favorita?", 
      ["Azul", "Verde", "Paçoca"], 
      new Date('2199-01-01'),
      0
    );

    expect(poll).not.toBeNull();
    expect(poll.title).toBe("Qual sua cor favorita?");
    expect(poll.options.length).toBe(3);
    expect(poll.options.every(option => option.votes === 0)).toBe(true);
    expect(poll.isActive).toBe(true);
  })

  test("Deve lançar erro se não tiver opções", () => {
    expect(pollService.createPoll("Qual sua cor favorita?", ["Paçoca"], new Date('2199-01-01'), 0))
      .rejects.toThrow("A poll must have at least 2 options.");
  })

  test("Deve lançar erro se não tiver título", () => {
    expect(pollService.createPoll("", ["Paçoca", "Doce de Leite"], new Date('2199-01-01'), 0))
      .rejects.toThrow("Poll title is required.");
  })

  test("Deve lançar erro se tiver opções inválidas", () => {
    expect(pollService.createPoll("Qual sua cor favorita?", ["Paçoca", ""], new Date('2199-01-01'), 0))
      .rejects.toThrow("All options must have valid text.");
  })

  test("Deve lançar erro data invalida", () => {
    expect(pollService.createPoll("Qual sua cor favorita?", ["Paçoca", ""], new Date('2199-13-45'), 0))
      .rejects.toThrow("Invalid poll end date.");
  })

  test("Deve lançar erro se não tiver item correto", () => {
    expect(pollService.createPoll("Qual sua cor favorita?", ["Azul", "Verde"], new Date('2199-01-01'), undefined as any))
      .rejects.toThrow("The correct item for the vote is required.");
  })


  test("Deve votar com sucesso", async () => {

    const poll = await pollService.createPoll("Better programming languages?", ["Rust", "Java", "Go", "TypeScript"], new Date('2126-03-01'), 0)

    await pollService.vote(poll.id, "1", 0,);
    const updatedPoll = await pollService.vote(poll.id, "2", 1);

    expect(updatedPoll.options[0]?.votes).toBe(1);
    expect(updatedPoll.options[1]?.votes).toBe(1);
    expect(updatedPoll.options[2]?.votes).toBe(0);
  })

  test("Deve barrar mesmo usuário votar duas vezes", async () => {
    const poll = await pollService.createPoll("Better programming languages?", ["Rust", "Java", "Go", "TypeScript"], new Date('2126-03-01'), 0)
    const userId = "abc1";

    await pollService.vote(poll.id, userId, 1);

    expect(pollService.vote(poll.id, userId, 1)).rejects.toThrow("User has already voted in this poll.")
  })
})
