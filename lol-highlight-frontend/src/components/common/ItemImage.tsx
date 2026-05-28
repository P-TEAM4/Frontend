// src/components/common/ItemImage.tsx
import React, { useEffect, useState } from 'react';
import { getDataDragonVersion, getDataDragonVersionsList } from '../../types/api';

interface ItemImageProps {
    itemId: number | null;
    gameVersion?: string | null;
    className?: string;
    alt?: string;
    onFail?: () => void;
}

// 삭제되었거나 존재하지 않는 아이템 ID 목록
const REMOVED_ITEMS = new Set([
    2510, 2511, 2512, 2513, 2514, 2515, 2516, 2517, 2518, 2519, 2520,
]);

// gameVersion을 Data Dragon 버전으로 변환 (예: "15.2.542.9999" -> "15.2.1")
const convertToDataDragonVersion = (gameVersion: string): string => {
    const parts = gameVersion.split('.');
    if (parts.length >= 2) {
        return `${parts[0]}.${parts[1]}.1`;
    }
    return gameVersion;
};

// 이미지 소스 우선순위
const getItemImageSources = (itemId: number, gameVersion?: string | null): string[] => {
    const currentVersion = getDataDragonVersion();
    const allVersions = getDataDragonVersionsList();

    const sources: string[] = [
        // 1. 최신 알려진 DataDragon 버전 (가장 신뢰도 높음)
        `https://ddragon.leagueoflegends.com/cdn/${currentVersion}/img/item/${itemId}.png`,
    ];

    // 2. 게임 패치 버전 (allVersions에 없으면 건너뜀)
    if (gameVersion) {
        const ddVersion = convertToDataDragonVersion(gameVersion);
        if (ddVersion !== currentVersion && allVersions.includes(ddVersion)) {
            sources.push(`https://ddragon.leagueoflegends.com/cdn/${ddVersion}/img/item/${itemId}.png`);
        }
    }

    // 3. 이전 버전들
    allVersions.slice(1, 4).forEach(version => {
        sources.push(`https://ddragon.leagueoflegends.com/cdn/${version}/img/item/${itemId}.png`);
    });

    // 4. Community Dragon
    sources.push(`https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/assets/items/icons2d/${itemId}.png`);

    return sources;
};

const ItemImage: React.FC<ItemImageProps> = ({ itemId, gameVersion, className = '', alt = `Item ${itemId}`, onFail }) => {
    const [currentSourceIndex, setCurrentSourceIndex] = useState(0);
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        if (hasError) onFail?.();
    }, [hasError]); // eslint-disable-line react-hooks/exhaustive-deps

    if (!itemId || itemId === 0) {
        return null;
    }

    const sources = getItemImageSources(itemId, gameVersion);
    const currentSrc = sources[currentSourceIndex];

    const handleError = () => {
        if (currentSourceIndex < sources.length - 1) {
            setCurrentSourceIndex(prev => prev + 1);
        } else {
            console.warn(`[ItemImage] All sources failed for item ${itemId}`);
            setHasError(true);
        }
    };

    if (hasError) {
        return null;
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

export default ItemImage;
