// src/api/users.ts
import apiClient from './client';
import type {
    ApiResponse,
    UserResponse,
    UpdateUserRequest,
    LinkRiotRequest
} from '../types/api';

// 현재 로그인한 사용자 정보 조회
export const getCurrentUser = async (): Promise<UserResponse> => {
    const response = await apiClient.get<ApiResponse<UserResponse>>('/users/me');
    if (!response.data || !response.data.data) {
        console.error('User info response invalid:', response.data);
        // Alert 제거: LoginPage에서 Fallback 처리함
        throw new Error('사용자 정보를 불러올 수 없습니다.');
    }
    return response.data.data;
};

// 사용자 정보 조회
export const getUser = async (id: number): Promise<UserResponse> => {
    const response = await apiClient.get<ApiResponse<UserResponse>>(`/users/${id}`);
    if (!response.data.data) {
        throw new Error('사용자 정보를 불러올 수 없습니다.');
    }
    return response.data.data;
};

// 사용자 정보 수정
export const updateUser = async (data: UpdateUserRequest): Promise<UserResponse> => {
    const response = await apiClient.put<ApiResponse<UserResponse>>('/users', data);
    if (!response.data.data) {
        throw new Error('사용자 정보 수정에 실패했습니다.');
    }
    return response.data.data;
};

// Riot 계정 연동
export const linkRiot = async (data: LinkRiotRequest): Promise<UserResponse> => {
    const response = await apiClient.post<ApiResponse<UserResponse>>('/users/link-riot', data);
    if (!response.data.data) {
        throw new Error('Riot 계정 연동에 실패했습니다.');
    }
    return response.data.data;
};

// Riot 계정 연동 해제
export const unlinkRiot = async (): Promise<UserResponse> => {
    const response = await apiClient.delete<ApiResponse<UserResponse>>('/users/link-riot');
    if (!response.data.data) {
        throw new Error('Riot 계정 연동 해제에 실패했습니다.');
    }
    return response.data.data;
};

// 사용자 삭제
export const deleteUser = async (): Promise<void> => {
    await apiClient.delete('/users');
};

// 사용자 설정 타입
export interface UserSettings {
    autoLaunch: boolean;
    autoShowOnLol: boolean;
}

// 사용자 설정 조회
export const getUserSettings = async (): Promise<UserSettings> => {
    const response = await apiClient.get<ApiResponse<UserSettings>>('/users/settings');
    if (!response.data.data) {
        throw new Error('설정을 불러올 수 없습니다.');
    }
    return response.data.data;
};

// 사용자 설정 업데이트
export const updateUserSettings = async (settings: UserSettings): Promise<UserSettings> => {
    const response = await apiClient.put<ApiResponse<UserSettings>>('/users/settings', settings);
    if (!response.data.data) {
        throw new Error('설정 업데이트에 실패했습니다.');
    }
    return response.data.data;
};
