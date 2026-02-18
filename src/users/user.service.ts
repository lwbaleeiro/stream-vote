import { userStore } from "./user.store";
import type { User } from "./user.model";

class UserService {

    async register(username: string, password: string) {

        if (!username.trim()) throw new Error("O campo 'username' é obrigatório'!");
        if (!password.trim()) throw new Error("O campo 'password' é obrigatório");
        if (password.trim().length < 3) throw new Error("O campo 'password' deve conter ao menos 3 caracteres.");

        const usernameTaken = await userStore.getByUsername(username);
        if (usernameTaken) throw new Error("Esse 'username' já esta sendo utilizado.");

        const user: User = {
            id: crypto.randomUUID(),
            username,
            passwordHash: await Bun.password.hash(password),
            createdAt: new Date(),
            isActive: true
        };

        await userStore.save(user);
        return user;
    }

    async login(username: string, password: string) {

        if (!username.trim()) throw new Error("O campo 'username' é obrigatório!");
        if (!password.trim()) throw new Error("O campo 'password' é obrigatório!");

        const user = await userStore.getByUsername(username);
        if (!user) throw new Error("Usuário não encontrado com esse username.")

        const isMatch = await Bun.password.verify(password, user.passwordHash);
        if (!isMatch) throw new Error("Senha inválida!");

        return user.id;
    }
}

export const userService = new UserService();