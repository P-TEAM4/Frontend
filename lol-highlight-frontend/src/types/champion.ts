// src/types/champion.ts

export interface ChampionGlobalStats {
    championName: string;      // "Ahri"
    championNameKr: string;    // "아리"
    tier: 'S' | 'A' | 'B' | 'C' | 'D';
    pickRate: number;          // 8.5
    banRate: number;           // 12.3
    winRate: number;           // 52.1
    avgKills: number;
    avgDeaths: number;
    avgAssists: number;
    coreItems: number[];       // [3152, 3020, 3089]
    situationalItems: number[];
    primaryRune: string;       // "Electrocute"
    counters: string[];        // ["Zed", "Yasuo", "Fizz"]
    goodAgainst: string[];     // ["Lux", "Syndra", "Orianna"]
}
