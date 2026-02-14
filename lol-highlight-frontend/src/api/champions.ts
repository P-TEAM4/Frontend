// src/api/champions.ts
// import apiClient from './client';
// import type { ApiResponse } from '../types/api';
import type { ChampionGlobalStats } from '../types/champion';

// Mock data for development (백엔드 API 구현 전까지 사용)
const mockChampionStats: Record<string, ChampionGlobalStats> = {
    'Ahri': {
        championName: 'Ahri',
        championNameKr: '아리',
        tier: 'S',
        pickRate: 8.5,
        banRate: 12.3,
        winRate: 52.1,
        avgKills: 7.2,
        avgDeaths: 5.1,
        avgAssists: 8.3,
        coreItems: [3152, 3020, 3089],
        situationalItems: [3135, 3157, 3116],
        primaryRune: 'Electrocute',
        counters: ['Zed', 'Yasuo', 'Fizz'],
        goodAgainst: ['Lux', 'Syndra', 'Orianna'],
    },
    'Zed': {
        championName: 'Zed',
        championNameKr: '제드',
        tier: 'A',
        pickRate: 12.1,
        banRate: 25.4,
        winRate: 49.8,
        avgKills: 8.1,
        avgDeaths: 6.2,
        avgAssists: 6.5,
        coreItems: [3142, 3814, 3156],
        situationalItems: [3036, 3071, 3153],
        primaryRune: 'Conqueror',
        counters: ['Malzahar', 'Lissandra', 'Diana'],
        goodAgainst: ['Ahri', 'Lux', 'Xerath'],
    },
    'Lux': {
        championName: 'Lux',
        championNameKr: '럭스',
        tier: 'B',
        pickRate: 6.3,
        banRate: 3.2,
        winRate: 50.5,
        avgKills: 5.8,
        avgDeaths: 4.9,
        avgAssists: 11.2,
        coreItems: [3040, 6653, 3089],
        situationalItems: [3135, 3165, 3102],
        primaryRune: 'Arcane Comet',
        counters: ['Zed', 'Fizz', 'Yasuo'],
        goodAgainst: ['Syndra', 'Orianna', 'Xerath'],
    },
};

/**
 * 챔피언 전체 통계 조회
 * @param championName - 챔피언 이름 (영문)
 * @returns 챔피언 통계
 */
export const getChampionStats = async (championName: string): Promise<ChampionGlobalStats> => {
    try {
        // TODO: 백엔드 API 구현 후 주석 해제
        // const response = await apiClient.get<ApiResponse<ChampionGlobalStats>>(
        //     `/champions/${championName}/stats`
        // );
        // return response.data.data;

        // Mock data 반환 (임시)
        await new Promise(resolve => setTimeout(resolve, 500)); // API 호출 시뮬레이션
        
        const stats = mockChampionStats[championName];
        if (!stats) {
            throw new Error(`Champion stats not found for: ${championName}`);
        }
        
        return stats;
    } catch (error) {
        console.error('Failed to fetch champion stats:', error);
        throw error;
    }
};
