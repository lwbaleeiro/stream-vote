import { describe, test, expect, beforeEach } from "bun:test";
import { userService } from "./user.service";
import { userStore } from "./user.store";

describe("User Service", () => {

  beforeEach(() => {
    // tirar de prod
    userStore.clear();
  });


  test("Deve registrar um usuário com sucesso", async () => {
    const user = await userService.register("teste_silva", "abc123")

    expect(user).not.toBeNull();
    expect(user.username).toBe("teste_silva");
    expect(user.isActive).toBe(true);
  })


    test("Deve logar um usuário com sucesso", async () => {
    const user = await userService.register("teste_silva", "abc123")
    const userLoginId = await userService.login("teste_silva", "abc123")

    expect(userLoginId).not.toBeNull();
  })

  test("Deve adicionar score ao usuário", async () => {
    const user = await userService.register("teste_silva", "abc123")
    await userStore.addScore(user.id, 10)

    const updatedUser = await userStore.getByUsername("teste_silva")
    expect(updatedUser?.score).toBe(10);
  })

  test("Deve acumular score ao adicionar múltiplas vezes", async () => {
    const user = await userService.register("teste_silva", "abc123")
    await userStore.addScore(user.id, 5)
    await userStore.addScore(user.id, 5)

    const updatedUser = await userStore.getByUsername("teste_silva")
    expect(updatedUser?.score).toBe(10);
  })
})