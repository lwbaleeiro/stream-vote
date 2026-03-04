export type SportKey = "basketball" | "soccer" | "esports";

export interface League {
    id: string;
    name: string;
    country?: string;
}

export interface Sport {
    key: SportKey;
    label: string;
    icon: string;
    apiBase: string;
    leagues: League[];
}

export const SPORTS: Sport[] = [
    {
        key: "basketball",
        label: "Basquete",
        icon: "🏀",
        apiBase: "https://api.balldontlie.io/v1",
        leagues: [ {
            id: "nba",
            name: "NBA",
            country: "USA"
        }]
    },
    {
        key: "esports",
        label: "E-Sports",
        icon: "🎮",
        apiBase: "https://esports.balldontlie.io/api/v1",
        leagues: [ 
            {
                id: "cs2-majors",
                name: "CS2 Majors",
                country: "Global"
            },
            {
                id: "lol-worlds",
                name: "LoL World Championship",
                country: "Global"
            }            
        ]
    },
    {
        key: "soccer",
        label: "Futebol",
        icon: "⚽",
        apiBase: "https://soccer.balldontlie.io/api/v1",
        leagues: [ {
            id: "brasileirao",
            name: "Brasileirão",
            country: "Brazil"
        }]
    },   
];