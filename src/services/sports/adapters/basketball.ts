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
    const basketballApiBase = "https://api.balldontlie.io/v1";

    try {
        const response = await fetch(basketballApiBase + "/games?start_date=" + todayDate, {
            headers: { "Authorization": apiKey }
        });
        
        const json = (await response.json()) as BallDontLieResponse;
        if (!json || !json.data) return [];

        return json.data.map((game) => {
            const startAt = new Date(game.datetime || game.date);
            const estimatedEnd = new Date(startAt.getTime() + (3.5 * 60 * 60 * 1000));
            // Close poll 5 minutes before start
            const pollClosesAt = new Date(startAt.getTime() - (5 * 60 * 1000));

            return {
                id: String(game.id),
                sportKey: "basketball",
                leagueId: "nba",
                leagueName: "NBA",
                homeTeam: {
                    id: String(game.home_team.id),
                    name: game.home_team.full_name || game.home_team.name,
                    logo: game.home_team.abbreviation 
                        ? `https://a.espncdn.com/combiner/i?img=/i/teamlogos/nba/500/scoreboard/${game.home_team.abbreviation.toLowerCase()}.png`
                        : undefined
                },
                awayTeam: {
                    id: String(game.visitor_team.id),
                    name: game.visitor_team.full_name || game.visitor_team.name,
                    logo: game.visitor_team.abbreviation 
                        ? `https://a.espncdn.com/combiner/i?img=/i/teamlogos/nba/500/scoreboard/${game.visitor_team.abbreviation.toLowerCase()}.png`
                        : undefined
                },
                startAt,
                estimatedEndAt: estimatedEnd,
                pollClosesAt,
                status: game.status === "final" ? "finished" : "scheduled",
                homeScore: null,
                awayScore: null,
                winnerId: null
            };
        });
    } catch (e) {
        console.error("[Basketball] Fetch upcoming failed:", e);
        return [];
    }
}

export async function getGameResult(apiKey: string, gameId: string): Promise<GameResult | undefined> {

    const basketballApiBase = "https://api.balldontlie.io/v1";

    const url = `${basketballApiBase}/games/${gameId}`;
    console.log(`[Basketball] Fetching game from: ${url}`);
    
    try {
        const response = await fetch(url, {
            headers: { "Authorization": apiKey },
            signal: (AbortSignal as any).timeout(10000) // 10s timeout
        });
        
        if (!response.ok) {
            console.error(`[Basketball] API Error: ${response.status} ${response.statusText}`);
            return undefined;
        }

        const json = await response.json() as any;
        const game = json.data;
        
        if (!game || !game.id) {
            console.warn(`[Basketball] Game ${gameId} not found or invalid response structure:`, json);
            return undefined;
        }

        const status = String(game.status || "").toLowerCase();
        const isFinished = status === "final";

        console.log(`[Basketball] Success: ${gameId} status is ${game.status}`);

        const winnerId = isFinished ? (
            game.home_team_score > game.visitor_team_score ? 
            String(game.home_team.id) : String(game.visitor_team.id)
        ) : null;

        return {
            finished: isFinished,
            homeScore: game.home_team_score,
            awayScore: game.visitor_team_score,
            winnerId: winnerId,
            status: isFinished ? "finished" : "scheduled"
        };
    } catch (err) {
        console.error(`[Basketball] Fetch failed for ${gameId}:`, err);
        return undefined;
    }
}