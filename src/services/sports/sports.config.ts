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
    leagues: League[];
}

export const SPORTS: Sport[] = [
    {
        key: "basketball",
        label: "Basketball",
        icon: "🏀",
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
        leagues: [ 
            {
                id: "cs",
                name: "CS2 Majors",
                country: "Global"
            },
            {
                id: "lol",
                name: "LoL World Championship",
                country: "Global"
            }            
        ]
    },
    {
        key: "soccer",
        label: "Soccer",
        icon: "⚽",
        leagues: [ {
            id: "ucl",
            name: "Champions League",
            country: "Europe"
        }]
    },   
];