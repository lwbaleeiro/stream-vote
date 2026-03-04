import type { SportKey } from "./sports.config"

export interface Team {
    id: string;
    name: string;
    logo?: string;
}

export interface UnifiedGame {
    id: string;
    sportKey: SportKey;
    leagueId: string;
    leagueName: string;
    homeTeam: Team;
    awayTeam: Team;
    startAt: Date;
    estimatedEndAt: Date;
    pollClosesAt: Date;
    status: "scheduled" | "live" | "finished" | "postponed";
    homeScore: number | null;
    awayScore: number | null;
    winnerId: string | null;
}

export interface GameResult {
    finished: boolean;
    homeScore: number | null;
    awayScore: number | null;
    winnerId: string | null;
    status: "scheduled" | "live" | "finished" | "postponed"; 
}