export interface PollOption {
    index: number;
    text: string;
    votes: number;
    isCorrect: boolean;
}

export interface Poll {
    id: string;
    title: string;
    options: PollOption[];
    createdAt: Date;
    isActive: boolean;
}
