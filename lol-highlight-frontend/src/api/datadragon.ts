// src/api/datadragon.ts
import apiClient from './client';

/**
 * Data Dragon 버전 조회
 */
export const getDataDragonVersion = async (): Promise<string> => {
    try {
        const response = await apiClient.get<{ version: string }>('/datadragon/version');
        return response.data.version;
    } catch (error) {
        console.error('Failed to fetch Data Dragon version:', error);
        // 폴백: 최신 알려진 버전
        return '15.2.1';
    }
};

/**
 * Data Dragon 버전 캐싱 (1일 유효)
 */
const VERSION_CACHE_KEY = 'datadragon_version';
const VERSION_CACHE_EXPIRY_KEY = 'datadragon_version_expiry';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24시간

export const getCachedDataDragonVersion = async (): Promise<string> => {
    const cached = localStorage.getItem(VERSION_CACHE_KEY);
    const expiry = localStorage.getItem(VERSION_CACHE_EXPIRY_KEY);

    if (cached && expiry && Date.now() < parseInt(expiry)) {
        return cached;
    }

    // 캐시가 없거나 만료됨 - API에서 새로 가져오기
    const version = await getDataDragonVersion();
    localStorage.setItem(VERSION_CACHE_KEY, version);
    localStorage.setItem(VERSION_CACHE_EXPIRY_KEY, (Date.now() + CACHE_DURATION).toString());
    
    return version;
};
