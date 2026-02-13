import React from 'react';
import Button from '../common/Button';
import { UserResponse, getProfileIconUrl } from '../../types/api';
import { SummonerProfileResponse } from '../../api/matches';

interface SummonerProfileHeaderProps {
    user: UserResponse | null;
    summonerProfile?: SummonerProfileResponse;
    gameName?: string;
    tagLine?: string;
    onRefresh: () => void;
    isRefreshing: boolean;
    totalGames?: number;
}

const SummonerProfileHeader: React.FC<SummonerProfileHeaderProps> = ({
    user,
    summonerProfile,
    gameName,
    tagLine,
    onRefresh,
    isRefreshing,
}) => {
    // 실제 데이터가 없으면 기본값 (또는 로딩 상태)
    const summonerLevel = summonerProfile?.summonerLevel ?? '-';
    // 프로필 아이콘 URL 사용 (없으면 기본값)
    const profileIconUrl = summonerProfile?.profileIconUrl ?? getProfileIconUrl(29);

    // 랭킹 더미 데이터 (요청 사항)
    let displayLadderRank = "N/A";
    let displayTopPercent = "N/A";

    if (summonerProfile) {
        // Generate a random number for ladder rank (e.g., between 100,000 and 1,000,000)
        const randomRank = Math.floor(Math.random() * (900000 - 100000 + 1)) + 100000;
        displayLadderRank = randomRank.toLocaleString() + "위";

        // Generate a random number for top percentage (e.g., between 10.00% and 30.00%)
        const randomPercent = (Math.random() * (30 - 10) + 10).toFixed(2);
        displayTopPercent = randomPercent + "%";
    }

    return (
        <div className="bg-[#31313C] rounded-none md:rounded-lg p-6 mb-4 mt-8 w-full max-w-[1000px] mx-auto border-b border-[#1C1C1F]">
            <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
                {/* 프로필 아이콘 & 레벨 */}
                <div className="relative group">
                    <div className="w-24 h-24 rounded-2xl overflow-hidden border-4 border-[#202D37] shadow-xl relative z-10">
                        <img
                            src={profileIconUrl}
                            alt="Profile"
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-[#202D37] text-white text-xs font-bold px-2 py-0.5 rounded-full z-20 border border-[#000]">
                        {summonerLevel}
                    </div>
                </div>

                {/* 소환사 정보 */}
                <div className="flex-1">
                    <div className="flex items-end gap-2 mb-1">
                        <h1 className="text-2xl font-bold text-white tracking-tight">
                            {gameName || 'Unknown'}
                        </h1>
                        <span className="text-[#9E9EB1] text-lg font-normal mb-1">
                            #{tagLine || 'KR1'}
                        </span>
                    </div>

                    {/* 랭킹/티어 정보 (임시) */}
                    <div className="flex items-center gap-2 text-sm text-[#9E9EB1] mb-4">
                        <span className="hover:text-[#F0F0F0] cursor-pointer">
                            래더 랭킹 <span className="text-[#5383E8] font-bold">{displayLadderRank}</span> (상위 {displayTopPercent})
                        </span>
                    </div>

                    <div className="flex gap-2">
                        <Button
                            onClick={onRefresh}
                            disabled={isRefreshing}
                            className={`
                                !bg-[#5383E8] hover:!bg-[#4169E1] !text-white !border-0 !rounded-md !px-4 !py-2 !h-auto !text-sm !font-bold
                                ${isRefreshing ? 'opacity-70' : ''}
                            `}
                        >
                            {isRefreshing ? '갱신 중...' : '전적 갱신'}
                        </Button>
                        <button className="bg-[#31313C] hover:bg-[#3C3C48] text-white border border-[#424254] rounded-md px-4 py-2 text-sm font-bold transition-colors">
                            티어 그래프
                        </button>
                    </div>
                    <div className="text-xs text-[#9E9EB1] mt-2">
                        최근 업데이트: 방금 전
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SummonerProfileHeader;
