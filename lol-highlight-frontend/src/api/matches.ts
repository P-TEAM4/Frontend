// src/api/matches.ts
import apiClient from './client';
import type {
    ApiResponse,
    PagedResponse,
    MatchResponse,
    MatchDetailResponse
} from '../types/api';

interface GetMatchesParams {
    gameName: string;
    tagLine: string;
    page?: number;
    size?: number;
    sort?: string;
}

// 소환사 전적 조회
export const getMatches = async (params: GetMatchesParams): Promise<PagedResponse<MatchResponse>> => {
    const { gameName, tagLine, page = 0, size = 20, sort = 'gameCreation,desc' } = params;

    const response = await apiClient.get<ApiResponse<PagedResponse<MatchResponse>>>(
        `/matches/summoner/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`,
        {
            params: { page, size, sort },
        }
    );

    if (!response.data.data) {
        throw new Error('전적을 불러올 수 없습니다.');
    }

    return response.data.data;
};

// 전적 강제 갱신
export const refreshMatches = async (gameName: string, tagLine: string): Promise<void> => {
    await apiClient.post(
        `/matches/summoner/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}/refresh`
    );
};

// 매치 상세 정보 조회
export const getMatchDetail = async (matchId: string): Promise<MatchDetailResponse> => {
    const response = await apiClient.get<ApiResponse<MatchDetailResponse>>(
        `/matches/${matchId}/detail`
    );

    if (!response.data.data) {
        throw new Error('매치 상세 정보를 불러올 수 없습니다.');
    }

    return response.data.data;
};

export interface LeagueInfo {
    queueType: string;
    tier: string;
    rank: string;
    leaguePoints: number;
    wins: number;
    losses: number;
    winRate: string;
}

export interface SummonerProfileResponse {
    gameName: string;
    tagLine: string;
    summonerLevel: number;
    profileIconUrl: string;
    soloLeague: LeagueInfo | null;
    flexLeague: LeagueInfo | null;
}

// 소환사 프로필 정보 조회 (티어, 레벨 등) - [수정] 백엔드 API 부재로 더미 데이터 처리
export const getSummonerInfo = async (gameName: string, tagLine: string): Promise<SummonerProfileResponse> => {
    // API 호출 없이 바로 더미 데이터 반환 (추후 API 생기면 복구)
    return Promise.resolve({
        gameName,
        tagLine,
        summonerLevel: 0, // 알 수 없음
        profileIconUrl: "https://ddragon.leagueoflegends.com/cdn/14.23.1/img/profileicon/29.png", // 기본 아이콘
        soloLeague: {
            queueType: "RANKED_SOLO_5x5",
            tier: "UNRANKED",
            rank: "",
            leaguePoints: 0,
            wins: 0,
            losses: 0,
            winRate: "0"
        },
        flexLeague: {
            queueType: "RANKED_FLEX_SR",
            tier: "UNRANKED",
            rank: "",
            leaguePoints: 0,
            wins: 0,
            losses: 0,
            winRate: "0"
        }
    });
};
