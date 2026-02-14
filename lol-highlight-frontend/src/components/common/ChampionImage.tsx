// src/components/common/ChampionImage.tsx
import React, { useState } from 'react';
import { getDataDragonVersion, getDataDragonVersionsList } from '../../types/api';

interface ChampionImageProps {
    championName: string;
    gameVersion?: string | null; // 경기의 패치 버전
    className?: string;
    alt?: string;
}

// gameVersion을 Data Dragon 버전으로 변환 (예: "15.2.542.9999" -> "15.2.1")
const convertToDataDragonVersion = (gameVersion: string): string => {
    const parts = gameVersion.split('.');
    if (parts.length >= 2) {
        return `${parts[0]}.${parts[1]}.1`;
    }
    return gameVersion;
};

// 챔피언 이미지 소스 우선순위
const getChampionImageSources = (championName: string, gameVersion?: string | null): string[] => {
    const sources: string[] = [];

    // 챔피언명이 비어있으면 빈 배열 반환
    if (!championName) {
        return sources;
    }

    // 1. 경기의 패치 버전 우선 (gameVersion이 있으면)
    if (gameVersion) {
        const ddVersion = convertToDataDragonVersion(gameVersion);
        sources.push(`https://ddragon.leagueoflegends.com/cdn/${ddVersion}/img/champion/${championName}.png`);
    }

    // 2. 최신 버전 Data Dragon
    const currentVersion = getDataDragonVersion();
    sources.push(`https://ddragon.leagueoflegends.com/cdn/${currentVersion}/img/champion/${championName}.png`);

    // 3. Community Dragon (PBE - 신규 챔피언은 여기 먼저 나옴)
    sources.push(`https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/${championName.toLowerCase()}.png`);

    // 4. Community Dragon (latest)
    sources.push(`https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/${championName.toLowerCase()}.png`);

    // 5. 이전 버전 Data Dragon (동적으로 가져온 버전 목록에서 1~4번째 사용)
    const allVersions = getDataDragonVersionsList();
    const previousVersions = allVersions.slice(1, 5); // 최신 제외, 다음 4개 버전
    previousVersions.forEach(version => {
        sources.push(`https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${championName}.png`);
    });

    // 6. 플레이스홀더 (기본 챔피언 아이콘)
    sources.push(`https://ddragon.leagueoflegends.com/cdn/${currentVersion}/img/profileicon/29.png`);

    return sources;
};

const ChampionImage: React.FC<ChampionImageProps> = ({ 
    championName,
    gameVersion,
    className = '', 
    alt = `Champion ${championName}` 
}) => {
    const [currentSourceIndex, setCurrentSourceIndex] = useState(0);
    const [hasError, setHasError] = useState(false);

    // 챔피언명이 없으면 플레이스홀더
    if (!championName) {
        return (
            <div className={`bg-gray-700 flex items-center justify-center ${className}`}>
                <span className="text-gray-400 text-xs">?</span>
            </div>
        );
    }

    const sources = getChampionImageSources(championName, gameVersion);
    const currentSrc = sources[currentSourceIndex];

    const handleError = () => {
        // 다음 소스가 있으면 시도
        if (currentSourceIndex < sources.length - 1) {
            console.log(`[ChampionImage] Failed to load ${championName} from source ${currentSourceIndex}, trying next...`);
            setCurrentSourceIndex(prev => prev + 1);
        } else {
            // 모든 소스 실패
            console.warn(`[ChampionImage] All sources failed for champion: ${championName}`);
            setHasError(true);
        }
    };

    // 모든 소스에서 실패한 경우 플레이스홀더
    if (hasError) {
        return (
            <div className={`bg-gray-700 flex items-center justify-center ${className}`}>
                <span className="text-gray-400 text-xs font-bold">{championName.substring(0, 2).toUpperCase()}</span>
            </div>
        );
    }

    return (
        <img
            src={currentSrc}
            alt={alt}
            className={className}
            onError={handleError}
            loading="lazy"
        />
    );
};

export default ChampionImage;
