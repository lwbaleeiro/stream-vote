export interface PollOption {
    index: number;
    text: string;
    votes: number;
}

export interface Poll {
    id: string;
    title: string;
    options: PollOption[];
    createdAt: Date;
    isActive: boolean;
}


    