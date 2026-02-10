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
        paged: boolean;
        unpaged: boolean;
        pageNumber: number;
        pageSize: number;
        offset: number;
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
    numberOfElements: number;
    sort: {
        sorted: boolean;
        unsorted: boolean;
        empty: boolean;
    };
    empty: boolean;
}

// 사용자 관련 타입
export interface UserResponse {
    id: number;
    email: string;
    name: string;
    profileImage: string | null;
    riotId: string | null;
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
    provider: 'GOOGLE' | 'RIOT';
    providerId: string | null;
    role: 'USER' | 'ADMIN';
    lastActivityAt: string | null;
    lastMatchRefreshAt: string | null;
    refreshCountInWindow: number | null;
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
export type MatchStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

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
}

// 아이템 상세 정보
export interface ItemInfo {
    itemId: number;
    itemName: string;
    itemDescription: string;
    itemImageUrl: string;
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
    finalItemsInfo: ItemInfo[];
    goldEarned: number;
}

export interface TeamDetail {
    teamId: number;
    win: boolean;
    totalObjectives: number;
    totalKills: number;
}

export interface MatchDetailResponse {
    matchId: string;
    gameVersion: string;
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
export type HighlightType = 'KILL' | 'MULTI_KILL' | 'PENTAKILL' | 'BARON' | 'DRAGON' | 'TOWER_DESTROY' | 'TEAM_FIGHT' | 'CUSTOM';
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

export interface TokenResponse {
    accessToken: string;
    refreshToken: string;
    userId: number;
    email: string;
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

// 챔피언 아이콘 URL 헬퍼
export const getChampionIconUrl = (championName: string): string => {
    return `https://ddragon.leagueoflegends.com/cdn/14.23.1/img/champion/${championName}.png`;
};

// 아이템 아이콘 URL 헬퍼
export const getItemIconUrl = (itemId: number): string => {
    return `https://ddragon.leagueoflegends.com/cdn/14.23.1/img/item/${itemId}.png`;
};

// 프로필 아이콘 URL 헬퍼
export const getProfileIconUrl = (iconId: number): string => {
    return `https://ddragon.leagueoflegends.com/cdn/14.23.1/img/profileicon/${iconId}.png`;
};

// 랭크 엠블럼 URL 헬퍼
export const getRankEmblemUrl = (tier: string): string => {
    return `https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/images/ranked-emblem/emblem-${tier.toLowerCase()}.png`;
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
