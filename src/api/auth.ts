// src/api/auth.ts
import axios from 'axios';
import apiClient from './client';
import type { ApiResponse } from '../types/api';

interface LoginResult {
    accessToken: string;
    refreshToken: string;
}

// 토큰 갱신
export const refreshAccessToken = async (refreshToken: string): Promise<LoginResult> => {
    const response = await axios.post<ApiResponse<null>>(
        '/api/auth/refresh',
        null,
        {
            headers: {
                'Refresh-Token': refreshToken,
            },
        }
    );

    const newAccessToken = response.headers['access-token'];
    const newRefreshToken = response.headers['refresh-token'];

    if (!newAccessToken || !newRefreshToken) {
        throw new Error('토큰 갱신에 실패했습니다.');
    }

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
};

// 로그아웃
export const logout = async (): Promise<void> => {
    await apiClient.post('/auth/logout');
};
