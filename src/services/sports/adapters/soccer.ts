import type { UnifiedGame, GameResult } from "../sports.types";
import { SPORTS } from "../sports.config";

interface BallDontLieTeam {
    id: number;
    name: string;
    full_name?: string;
    abbreviation?: string;
    city?: string;
    conference?: string;
    division?: string;
}

interface BallDontLieGame {
    id: number;
    date: string;
    datetime?: string;
    home_team: BallDontLieTeam;
    visitor_team: BallDontLieTeam;
    home_team_score: number;
    visitor_team_score: number;
    period: number;
    postseason: boolean;
    season: number;
    status: string;
    time: string;
}

interface BallDontLieResponse {
    data: BallDontLieGame[];
}

export async function getUpcomingGames(apiKey: string): Promise<UnifiedGame[]> {
    const now = new Date();
    const todayDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const sportConfig = SPORTS.find((sport) => sport.key === "soccer");

    if (!sportConfig) return [];

    const allGames: UnifiedGame[] = [];

    for (const league of sportConfig.leagues) {
        try {
            const url = `https://api.balldontlie.io/${league.id}/v1/matches?start_date=${todayDate}`;
            const response = await fetch(url, {
                headers: { "Authorization": apiKey }
            });
            
            if (!response.ok) {
                console.error(`[Soccer] API Error ${response.status} for league ${league.id}: ${await response.text()}`);
                continue;
            }

            const json = (await response.json()) as BallDontLieResponse;
            if (!json || !json.data) continue;

            const games = json.data.map((game) => {
                const startAt = new Date(game.datetime || game.date);
                const estimatedEnd = new Date(startAt.getTime() + (2 * 60 * 60 * 1000)); // Soccer is roughly 2 hours
                const pollClosesAt = new Date(startAt.getTime() - (5 * 60 * 1000));

                return {
                    id: String(game.id),
                    sportKey: "soccer" as const,
                    leagueId: league.id,
                    leagueName: league.name,
                    homeTeam: {
                        id: String(game.home_team.id),
                        name: game.home_team.full_name || game.home_team.name,
                        logo: undefined
                    },
                    awayTeam: {
                        id: String(game.visitor_team.id),
                        name: game.visitor_team.full_name || game.visitor_team.name,
                        logo: undefined
                    },
                    startAt,
                    estimatedEndAt: estimatedEnd,
                    pollClosesAt,
                    status: (game.status === "final" ? "finished" : "scheduled") as "finished" | "scheduled",
                    homeScore: null,
                    awayScore: null,
                    winnerId: null
                };
            });
            
            allGames.push(...games);
        } catch (error) {
            console.error(`[Soccer] Fetch failed for league ${league.id}:`, error);
        }
    }
    
    return allGames;
}

export async function getGameResult(apiKey: string, gameId: string): Promise<GameResult | undefined> {
    const sportConfig = SPORTS.find((sport) => sport.key === "soccer");
    if (!sportConfig) return undefined;

    for (const league of sportConfig.leagues) {
        const url = `https://api.balldontlie.io/${league.id}/v1/matches/${gameId}`;
        console.log(`[Soccer] Fetching game from: ${url}`);
        
        try {
            const response = await fetch(url, {
                headers: { "Authorization": apiKey },
                signal: (AbortSignal as any).timeout(10000)
            });
            
            if (!response.ok) {
                continue;
            }

            const json = await response.json() as any;
            const game = json.data;
            
            if (!game || !game.id) {
                continue;
            }

            const status = String(game.status || "").toLowerCase();
            const isFinished = status === "final";

            console.log(`[Soccer] Success: ${gameId} status is ${game.status}`);

            const winnerId = isFinished ? (
                game.home_team_score > game.visitor_team_score ? 
                String(game.home_team.id) : 
                game.home_team_score < game.visitor_team_score ? 
                String(game.visitor_team.id) : "draw"
            ) : null;

            return {
                finished: isFinished,
                homeScore: game.home_team_score,
                awayScore: game.visitor_team_score,
                winnerId: winnerId,
                status: isFinished ? "finished" : "scheduled"
            };
        } catch (err) {
            console.error(`[Soccer] Fetch failed for ${gameId} in ${league.id}:`, err);
        }
    }
    return undefined;
}
