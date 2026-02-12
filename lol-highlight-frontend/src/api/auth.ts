// src/api/auth.ts
import axios from 'axios';
import apiClient from './client';
import type { ApiResponse, GoogleLoginRequest } from '../types/api';

interface LoginResult {
    accessToken: string;
    refreshToken: string;
}

// Google OAuth 로그인
export const googleLogin = async (idToken: string): Promise<LoginResult> => {
    const response = await axios.post<ApiResponse<null>>(
        '/api/auth/google',
        { idToken } as GoogleLoginRequest,
        {
            headers: {
                'Content-Type': 'application/json',
            },
        }
    );

    // 헤더에서 토큰 추출 (백엔드에서 Access-Token, Refresh-Token으로 전송)
    const accessToken = response.headers['access-token'];
    const refreshToken = response.headers['refresh-token'];

    if (!accessToken || !refreshToken) {
        throw new Error('토큰을 받아오지 못했습니다.');
    }

    return { accessToken, refreshToken };
};

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
