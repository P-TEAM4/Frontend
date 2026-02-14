// src/components/common/ItemImage.tsx
import React, { useState } from 'react';
import { getDataDragonVersion, getDataDragonVersionsList } from '../../types/api';

interface ItemImageProps {
    itemId: number | null;
    gameVersion?: string | null; // 경기의 패치 버전
    className?: string;
    alt?: string;
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
    const sources: string[] = [];

    // 1. 경기의 패치 버전 우선 (gameVersion이 있으면)
    if (gameVersion) {
        const ddVersion = convertToDataDragonVersion(gameVersion);
        sources.push(`https://ddragon.leagueoflegends.com/cdn/${ddVersion}/img/item/${itemId}.png`);
    }

    // 2. 최신 버전 Data Dragon
    const currentVersion = getDataDragonVersion();
    sources.push(`https://ddragon.leagueoflegends.com/cdn/${currentVersion}/img/item/${itemId}.png`);

    // 3. 이전 버전들 (동적으로 가져온 버전 목록에서 1~4번째 사용)
    const allVersions = getDataDragonVersionsList();
    const previousVersions = allVersions.slice(1, 5); // 최신 제외, 다음 4개 버전
    previousVersions.forEach(version => {
        sources.push(`https://ddragon.leagueoflegends.com/cdn/${version}/img/item/${itemId}.png`);
    });

    // 4. Community Dragon (최신 버전)
    sources.push(`https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/assets/items/icons2d/${itemId.toString().toLowerCase()}.png`);

    // 5. Community Dragon (PBE)
    sources.push(`https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/assets/items/icons2d/${itemId.toString().toLowerCase()}.png`);

    return sources;
};

const ItemImage: React.FC<ItemImageProps> = ({ itemId, gameVersion, className = '', alt = `Item ${itemId}` }) => {
    const [currentSourceIndex, setCurrentSourceIndex] = useState(0);
    const [hasError, setHasError] = useState(false);

    // 아이템 ID가 0이거나 유효하지 않으면 렌더링하지 않음
    if (!itemId || itemId === 0) {
        return null;
    }

    const sources = getItemImageSources(itemId, gameVersion);
    const currentSrc = sources[currentSourceIndex];

    const handleError = () => {
        // 다음 소스가 있으면 시도
        if (currentSourceIndex < sources.length - 1) {
            console.log(`[ItemImage] Failed to load item ${itemId} from source ${currentSourceIndex}, trying next...`);
            setCurrentSourceIndex(prev => prev + 1);
        } else {
            // 모든 소스 실패 - 에러 상태 설정
            console.warn(`[ItemImage] All sources failed for item ${itemId}`);
            setHasError(true);
        }
    };

    // 모든 소스에서 실패한 경우 플레이스홀더 표시하지 않고 숨김
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
