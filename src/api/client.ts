// src/api/client.ts
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../store/authStore';
import type { ApiResponse } from '../types/api';

// Axios 인스턴스 생성
const apiClient = axios.create({
    baseURL: `${import.meta.env.VITE_API_URL || 'https://nexus-gg.kro.kr'}/api`,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// 요청 인터셉터 - Authorization 헤더 자동 부착
apiClient.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const accessToken = useAuthStore.getState().accessToken;

        // 1. 이미 헤더에 토큰이 있다면 (예: LoginPage에서 강제 설정), 유지
        if (config.headers['Authorization']) {
            console.log('Using existing Authorization header:', config.headers['Authorization'].toString().substring(0, 20) + '...');
            return config;
        }

        // 2. 스토어에서 토큰 가져오기
        if (accessToken && config.headers) {
            console.log('Attaching Token from Store:', accessToken.substring(0, 10) + '...');
            config.headers.Authorization = `Bearer ${accessToken}`;
        } else {
            console.warn('No Access Token found in store, and no header set!');
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// 토큰 갱신 중복 방지 플래그
let isRefreshing = false;
let failedQueue: Array<{
    resolve: (token: string) => void;
    reject: (error: Error) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
    failedQueue.forEach((promise) => {
        if (error) {
            promise.reject(error);
        } else if (token) {
            promise.resolve(token);
        }
    });
    failedQueue = [];
};

// 응답 인터셉터 - 토큰 만료 시 자동 갱신
apiClient.interceptors.response.use(
    (response) => response,
    async (error: AxiosError<ApiResponse<unknown>>) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        // 401 에러 또는 TOKEN_EXPIRED 응답 처리
        const isTokenError =
            error.response?.status === 401 ||
            error.response?.data?.code === 'TOKEN_EXPIRED';

        if (isTokenError && !originalRequest._retry) {
            if (isRefreshing) {
                // 이미 갱신 중이면 대기열에 추가
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then((token) => {
                    if (originalRequest.headers) {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                    }
                    return apiClient(originalRequest);
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            const refreshToken = useAuthStore.getState().refreshToken;

            if (!refreshToken) {
                useAuthStore.getState().logout();
                window.location.href = '/login';
                return Promise.reject(error);
            }

            try {
                // 토큰 갱신 요청
                const response = await axios.post('/api/auth/refresh', null, {
                    headers: {
                        'Refresh-Token': refreshToken,
                    },
                });

                // 헤더에서 새 토큰 추출
                const newAccessToken = response.headers['access-token'];
                const newRefreshToken = response.headers['refresh-token'];

                if (newAccessToken && newRefreshToken) {
                    useAuthStore.getState().setTokens(newAccessToken, newRefreshToken);
                    processQueue(null, newAccessToken);

                    if (originalRequest.headers) {
                        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                    }
                    return apiClient(originalRequest);
                } else {
                    throw new Error('Token refresh failed');
                }
            } catch (refreshError) {
                processQueue(refreshError as Error, null);
                useAuthStore.getState().logout();
                window.location.href = '/login';
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default apiClient;

// 에러 메시지 추출 헬퍼
export const getErrorMessage = (error: unknown): string => {
    if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<ApiResponse<unknown>>;
        return axiosError.response?.data?.message || axiosError.message || '요청 처리 중 오류가 발생했습니다.';
    }
    if (error instanceof Error) {
        return error.message;
    }
    return '알 수 없는 오류가 발생했습니다.';
};
