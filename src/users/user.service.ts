import { userStore } from "./user.store";
import type { User } from "./user.model";

class UserService {

    async register(username: string, password: string) {

        if (!username.trim()) throw new Error("The 'username' field is required!");
        if (!password.trim()) throw new Error("The 'password' field is required!");
        if (password.trim().length < 3) throw new Error("The 'password' field must contain at least 3 characters.");

        const usernameTaken = await userStore.getByUsername(username);
        if (usernameTaken) throw new Error("This 'username' is already taken.");

        const user: User = {
            id: crypto.randomUUID(),
            username,
            passwordHash: await Bun.password.hash(password),
            createdAt: new Date(),
            isActive: true,
            score: 0
        };

        await userStore.save(user);
        return user;
    }

    async login(username: string, password: string) {

        if (!username.trim()) throw new Error("The 'username' field is required!");
        if (!password.trim()) throw new Error("The 'password' field is required!");

        const user = await userStore.getByUsername(username);
        if (!user) throw new Error("User not found with this username.")

        const isMatch = await Bun.password.verify(password, user.passwordHash);
        if (!isMatch) throw new Error("Invalid password!");

        return user.id;
    }
}

export const userService = new UserService();