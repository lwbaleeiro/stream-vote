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
})