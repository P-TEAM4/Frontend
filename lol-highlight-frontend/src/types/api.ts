// src/types/api.ts

// 공통 API 응답 래퍼
export interface ApiResponse<T> {
    timestamp: string;
    status: number;
    code: string;
    message: string;
    path?: string;
    data?: T;
}

// 페이징 응답
export interface PagedResponse<T> {
    content: T[];
    pageable: {
        pageNumber: number;
        pageSize: number;
        sort: {
            sorted: boolean;
            unsorted: boolean;
            empty: boolean;
        };
    };
    totalElements: number;
    totalPages: number;
    first: boolean;
    last: boolean;
    size: number;
    number: number;
}

// 사용자 관련 타입
export interface UserResponse {
    id: number;
    email: string;
    name: string;
    profileImage: string | null;
    riotId: string | null;
    puuid: string | null;
    summonerName: string | null;
    tagLine: string | null;
    profileIconId: number | null;
    summonerLevel: number | null;
    tier: string | null;
    rank: string | null;
    leaguePoints: number | null;
    wins: number | null;
    losses: number | null;
    winRate: number | null;
    averageKda: number | null;
    averageVisionScore: number | null;
    averageCsPerMin: number | null;
    provider: 'GOOGLE';
    role: 'USER' | 'ADMIN';
    createdAt: string;
}

export interface UpdateUserRequest {
    name: string;
    profileImage?: string;
}

export interface LinkRiotRequest {
    summonerName: string;
    tagLine: string;
}

// 매치 관련 타입
export type MatchStatus = 'PENDING' | 'COMPLETED' | 'FAILED';

export interface MatchResponse {
    id: number;
    matchId: string;
    championName: string;
    kills: number;
    deaths: number;
    assists: number;
    kda: number;
    win: boolean;
    gameDuration: number;
    gameCreation: number;
    status: MatchStatus;
    createdAt: string;
    item0: number;
    item1: number;
    item2: number;
    item3: number;
    item4: number;
    item5: number;
    item6: number;
}

export interface ItemBuild {
    itemId: number;
    timestamp: number;
}

export interface PlayerDetail {
    playerName: string;
    championName: string;
    kills: number;
    deaths: number;
    assists: number;
    totalDamageDealt: number;
    visionScore: number;
    cs: number;
    finalItems: number[];
    goldEarned: number;
    itemBuild: ItemBuild[];
    skillBuild: number[];
}

export interface TeamDetail {
    teamId: number;
    win: boolean;
    totalObjectives: number;
    totalKills: number;
}

export interface MatchDetailResponse {
    matchId: string;
    players: PlayerDetail[];
    teams: TeamDetail[];
}

// 분석 관련 타입
export type AnalysisStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface ScoreData {
    impactScore: number;
    teamFightScore: number;
    farmingScore: number;
    visionScore: number;
    objectiveControlScore: number;
    averageScore: number;
}

export interface AnalysisResponse {
    id: number;
    matchId: number;
    strengthAnalysis: string | null;
    weaknessAnalysis: string | null;
    improvementSuggestions: string | null;
    scores: ScoreData | null;
    status: AnalysisStatus;
    createdAt: string;
}

export interface CreateAnalysisRequest {
    matchId: string;
}

// 하이라이트 관련 타입
export type HighlightType = 'PENTAKILL' | 'BARON' | 'DRAGON' | 'TOWER' | 'OTHER';
export type HighlightStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface HighlightResponse {
    id: number;
    matchId: string;
    title: string;
    description: string | null;
    videoUrl: string | null;
    thumbnailUrl: string | null;
    startTime: number;
    endTime: number;
    duration: number;
    type: HighlightType;
    status: HighlightStatus;
    viewCount: number;
    createdAt: string;
}

export interface CreateHighlightRequest {
    matchId: string;
    title: string;
    description?: string;
    startTime: number;
    endTime: number;
    type?: HighlightType;
}

// 인증 관련 타입
export interface GoogleLoginRequest {
    idToken: string;
}

// 에러 코드
export type ErrorCode =
    | 'REQUIRED_FIELD_MISSING'
    | 'INVALID_INPUT_VALUE'
    | 'IMAGE_FORMAT_NOT_SUPPORTED'
    | 'VIDEO_FORMAT_NOT_SUPPORTED'
    | 'AUTHENTICATION_REQUIRED'
    | 'INVALID_TOKEN'
    | 'TOKEN_EXPIRED'
    | 'BLACKLISTED_TOKEN'
    | 'FORBIDDEN'
    | 'USER_NOT_FOUND'
    | 'MATCH_NOT_FOUND'
    | 'HIGHLIGHT_NOT_FOUND'
    | 'ANALYSIS_NOT_FOUND'
    | 'SESSION_NOT_FOUND'
    | 'RESOURCE_NOT_FOUND'
    | 'DUPLICATE_EMAIL'
    | 'DUPLICATE_DEVICE'
    | 'IMAGE_SIZE_TOO_LARGE'
    | 'VIDEO_SIZE_TOO_LARGE'
    | 'RATE_LIMIT_EXCEEDED'
    | 'INTERNAL_SERVER_ERROR'
    | 'EXTERNAL_API_ERROR';

// Data Dragon 버전 (서버에서 동적으로 가져옴)
let DDRAGON_VERSION = '15.2.1'; // 폴백 기본값

// Data Dragon 버전 설정 (초기화 시 호출)
export const setDataDragonVersion = (version: string) => {
    DDRAGON_VERSION = version;
};

// 현재 버전 조회
export const getDataDragonVersion = () => DDRAGON_VERSION;

// 챔피언 아이콘 URL 헬퍼
export const getChampionIconUrl = (championName: string): string => {
    return `https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/champion/${championName}.png`;
};

// 아이템 아이콘 URL 헬퍼
export const getItemIconUrl = (itemId: number): string => {
    return `https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/item/${itemId}.png`;
};

// 프로필 아이콘 URL 헬퍼
export const getProfileIconUrl = (iconId: number): string => {
    return `https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/profileicon/${iconId}.png`;
};

// KDA 등급 계산
export const getKdaRating = (kda: number): 'perfect' | 'good' | 'average' | 'bad' => {
    if (kda >= 5) return 'perfect';
    if (kda >= 3) return 'good';
    if (kda >= 2) return 'average';
    return 'bad';
};

// 게임 시간 포맷
export const formatGameDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
};

// 날짜 포맷
export const formatDate = (timestamp: number | string): string => {
    const date = typeof timestamp === 'number' ? new Date(timestamp) : new Date(timestamp);
    return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
};

// 상대 시간 포맷
export const formatRelativeTime = (timestamp: number | string): string => {
    const date = typeof timestamp === 'number' ? new Date(timestamp) : new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes}분 전`;
    if (hours < 24) return `${hours}시간 전`;
    if (days < 7) return `${days}일 전`;
    return formatDate(timestamp);
};
