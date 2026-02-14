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
        return '16.3.1';
    }
};

/**
 * Riot API에서 직접 모든 버전 목록 조회
 */
export const getAllDataDragonVersions = async (): Promise<string[]> => {
    try {
        const response = await fetch('https://ddragon.leagueoflegends.com/api/versions.json');
        const versions: string[] = await response.json();
        return versions;
    } catch (error) {
        console.error('Failed to fetch Data Dragon versions:', error);
        // 폴백: 최근 알려진 버전들
        return ['16.3.1', '15.24.1', '14.23.1', '13.24.1'];
    }
};

/**
 * Data Dragon 버전 캐싱 (1일 유효)
 */
const VERSION_CACHE_KEY = 'datadragon_version';
const VERSION_CACHE_EXPIRY_KEY = 'datadragon_version_expiry';
const VERSIONS_LIST_CACHE_KEY = 'datadragon_versions_list';
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

/**
 * 캐싱된 버전 목록 조회 (상위 10개)
 */
export const getCachedVersionsList = async (): Promise<string[]> => {
    const cached = localStorage.getItem(VERSIONS_LIST_CACHE_KEY);
    const expiry = localStorage.getItem(VERSION_CACHE_EXPIRY_KEY);

    if (cached && expiry && Date.now() < parseInt(expiry)) {
        return JSON.parse(cached);
    }

    // 캐시가 없거나 만료됨 - Riot API에서 새로 가져오기
    const allVersions = await getAllDataDragonVersions();
    const topVersions = allVersions.slice(0, 10); // 상위 10개만 캐싱
    
    localStorage.setItem(VERSIONS_LIST_CACHE_KEY, JSON.stringify(topVersions));
    localStorage.setItem(VERSION_CACHE_EXPIRY_KEY, (Date.now() + CACHE_DURATION).toString());
    
    return topVersions;
};
