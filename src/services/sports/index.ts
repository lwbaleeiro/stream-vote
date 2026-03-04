import { getUpcomingGames as getBasketballGames, getGameResult as getBasketballResult } from "./adapters/basketball";
import type { SportKey } from "./sports.config";
import type { UnifiedGame, GameResult } from "./sports.types";

export interface SportsService {
    getUpcomingGames(sportKey: SportKey, leagueId: string, apiKey: string): Promise<UnifiedGame[]>;
    getGameResult(sportKey: SportKey, gameId: string, apiKey: string): Promise<GameResult | undefined>;
}

export const sportsService: SportsService = {
    async getUpcomingGames(sportKey, leagueId, apiKey) {
        switch (sportKey) {
            case "basketball":
                const games = await getBasketballGames(apiKey);
                // Filter by league if needed (currently the adapter only does NBA)
                return games || [];
            case "soccer":
                // TODO: Implement soccer adapter
                return [];
            case "esports":
                // TODO: Implement esports adapter
                return [];
            default:
                return [];
        }
    },

    async getGameResult(sportKey, gameId, apiKey) {
        switch (sportKey) {
            case "basketball":
                return await getBasketballResult(apiKey, gameId);
            case "soccer":
                return undefined;
            case "esports":
                return undefined;
            default:
                return undefined;
        }
    }
};
