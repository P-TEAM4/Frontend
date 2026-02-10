// src/api/analyses.ts
import apiClient from './client';
import type {
    ApiResponse,
    PagedResponse,
    AnalysisResponse,
    CreateAnalysisRequest
} from '../types/api';

// 분석 정보 조회
export const getAnalysis = async (id: number): Promise<AnalysisResponse> => {
    const response = await apiClient.get<ApiResponse<AnalysisResponse>>(`/analyses/${id}`);

    if (!response.data.data) {
        throw new Error('분석 결과를 불러올 수 없습니다.');
    }

    return response.data.data;
};

// 매치의 분석 조회 (matchId는 Riot 매치 ID 문자열)
export const getMatchAnalysis = async (matchId: string): Promise<AnalysisResponse> => {
    const response = await apiClient.get<ApiResponse<AnalysisResponse>>(`/analyses/match/${matchId}`);

    if (!response.data.data) {
        throw new Error('분석 결과를 불러올 수 없습니다.');
    }

    return response.data.data;
};

// 플레이어의 분석 목록 조회
export const getPlayerAnalyses = async (
    puuid: string,
    page: number = 0,
    size: number = 20
): Promise<PagedResponse<AnalysisResponse>> => {
    const response = await apiClient.get<ApiResponse<PagedResponse<AnalysisResponse>>>(
        `/analyses/player/${puuid}`,
        { params: { page, size, sort: 'createdAt,desc' } }
    );

    if (!response.data.data) {
        throw new Error('분석 목록을 불러올 수 없습니다.');
    }

    return response.data.data;
};

// 경기 분석 생성
export const createAnalysis = async (matchId: string): Promise<AnalysisResponse> => {
    const response = await apiClient.post<ApiResponse<AnalysisResponse>>(
        '/analyses',
        { matchId } as CreateAnalysisRequest
    );

    if (!response.data.data) {
        throw new Error('분석 생성에 실패했습니다.');
    }

    return response.data.data;
};

// 분석 삭제
export const deleteAnalysis = async (id: number): Promise<void> => {
    await apiClient.delete(`/analyses/${id}`);
};
