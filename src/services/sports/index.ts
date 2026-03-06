import { getUpcomingGames as getBasketballGames, getGameResult as getBasketballResult } from "./adapters/basketball";
import { getUpcomingGames as getSoccerGames, getGameResult as getSoccerResult } from "./adapters/soccer";
import { getUpcomingGames as getEsportsGames, getGameResult as getEsportsResult } from "./adapters/esports";
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
                const bballGames = await getBasketballGames(apiKey);
                return bballGames || [];
            case "soccer":
                const soccerGames = await getSoccerGames(apiKey);
                return soccerGames || [];
            case "esports":
                const esportsGames = await getEsportsGames(apiKey);
                return esportsGames || [];
            default:
                return [];
        }
    },

    async getGameResult(sportKey, gameId, apiKey) {
        switch (sportKey) {
            case "basketball":
                return await getBasketballResult(apiKey, gameId);
            case "soccer":
                return await getSoccerResult(apiKey, gameId);
            case "esports":
                return await getEsportsResult(apiKey, gameId);
            default:
                return undefined;
        }
    }
};
