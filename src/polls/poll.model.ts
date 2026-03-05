export interface PollOption {
    index: number;
    text: string;
    votes: number;
    isCorrect: boolean;
    // Event Related Fields
    teamId?: string;
    teamLogo?: string;
}

export interface Poll {
    id: string;
    title: string;
    options: PollOption[];
    createdAt: Date;
    isActive: boolean;
    endDate: Date;
    winnersCount?: number;
    // Event Related Fields
    type: "custom" | "event_related";
    sportKey?: string;
    sportEventId?: string;
    resolved: boolean;
    homeScore?: number;
    awayScore?: number;
}
