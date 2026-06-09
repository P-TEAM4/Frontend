// src/api/highlights.ts
import apiClient from './client';
import type {
    ApiResponse,
    PagedResponse,
    HighlightResponse,
    HighlightType
} from '../types/api';

// 하이라이트 정보 조회
export const getHighlight = async (id: number): Promise<HighlightResponse> => {
    const response = await apiClient.get<ApiResponse<HighlightResponse>>(`/highlights/${id}`);

    if (!response.data.data) {
        throw new Error('하이라이트를 불러올 수 없습니다.');
    }

    return response.data.data;
};

// 매치의 하이라이트 목록 조회
export const getMatchHighlights = async (
    matchId: string,
    page: number = 0,
    size: number = 20
): Promise<PagedResponse<HighlightResponse>> => {
    const response = await apiClient.get<ApiResponse<PagedResponse<HighlightResponse>>>(
        `/highlights/match/${matchId}`,
        { params: { page, size, sort: 'startTime,asc' } }
    );

    if (!response.data.data) {
        throw new Error('하이라이트 목록을 불러올 수 없습니다.');
    }

    return response.data.data;
};

// 플레이어의 하이라이트 목록 조회
export const getPlayerHighlights = async (
    puuid: string,
    page: number = 0,
    size: number = 20,
    type?: HighlightType
): Promise<PagedResponse<HighlightResponse>> => {
    const params: Record<string, unknown> = { page, size, sort: 'createdAt,desc' };
    if (type) {
        params.type = type;
    }

    const response = await apiClient.get<ApiResponse<PagedResponse<HighlightResponse>>>(
        `/highlights/player/${puuid}`,
        { params }
    );

    if (!response.data.data) {
        throw new Error('하이라이트 목록을 불러올 수 없습니다.');
    }

    return response.data.data;
};

// 하이라이트 조회수 증가
export const incrementViewCount = async (id: number): Promise<HighlightResponse> => {
    const response = await apiClient.post<ApiResponse<HighlightResponse>>(`/highlights/${id}/view`);

    if (!response.data.data) {
        throw new Error('조회수 증가에 실패했습니다.');
    }

    return response.data.data;
};

// 하이라이트 생성 (영상 업로드)
export const createHighlight = async (matchId: string, video: File, gameStartOffset: number = 0): Promise<HighlightResponse> => {
    const formData = new FormData();
    formData.append('video', video);
    const requestBlob = new Blob(
        [JSON.stringify({ matchId, title: `${matchId} 하이라이트`, gameStartOffset })],
        { type: 'application/json' }
    );
    formData.append('request', requestBlob);

    const response = await apiClient.post<ApiResponse<HighlightResponse>>(
        '/highlights',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 0 }
    );

    if (!response.data.data) {
        throw new Error('하이라이트 생성에 실패했습니다.');
    }

    return response.data.data;
};

// AI 자동 하이라이트 생성
export const autoGenerateHighlights = async (matchId: string): Promise<void> => {
    await apiClient.post(`/highlights/match/${matchId}/auto-generate`);
};

// 하이라이트 삭제
export const deleteHighlight = async (id: number): Promise<void> => {
    await apiClient.delete(`/highlights/${id}`);
};
