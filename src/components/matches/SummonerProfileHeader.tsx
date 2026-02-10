import React from 'react';
import Button from '../common/Button';
import { UserResponse, getProfileIconUrl } from '../../types/api';

interface SummonerProfileHeaderProps {
    user: UserResponse | null;
    gameName?: string;
    tagLine?: string;
    onRefresh: () => void;
    isRefreshing: boolean;
}

const SummonerProfileHeader: React.FC<SummonerProfileHeaderProps> = ({
    user,
    gameName,
    tagLine,
    onRefresh,
    isRefreshing,
}) => {
    const summonerLevel = user?.summonerLevel ?? '-';
    const profileIconUrl = user?.profileIconId
        ? getProfileIconUrl(user.profileIconId)
        : `https://ddragon.leagueoflegends.com/cdn/14.23.1/img/profileicon/29.png`;

    return (
        <div className="bg-[#31313C] rounded-lg py-5 px-6 mt-6 animate-fade-in-up">
            <div className="flex items-center gap-5">
                {/* 프로필 아이콘 */}
                <div className="relative shrink-0">
                    <div className="w-[88px] h-[88px] rounded-2xl overflow-hidden ring-2 ring-[#424254] shadow-lg">
                        <img
                            src={profileIconUrl}
                            alt="Profile"
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-[#282830] text-white text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#424254]">
                        {summonerLevel}
                    </div>
                </div>

                {/* 소환사 정보 */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-1.5 mb-2">
                        <h1 className="text-2xl font-black text-white tracking-tight">
                            {gameName || 'Unknown'}
                        </h1>
                        <span className="text-[#515163] text-lg font-normal">
                            #{tagLine || 'KR1'}
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            onClick={onRefresh}
                            disabled={isRefreshing}
                            className={`
                                !bg-[#0AC8B9] hover:!bg-[#08A8A0] !text-white !border-0 !rounded !px-5 !py-1.5 !h-auto !text-xs !font-bold
                                ${isRefreshing ? 'opacity-60 cursor-not-allowed' : ''}
                            `}
                        >
                            {isRefreshing ? (
                                <span className="flex items-center gap-1.5">
                                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    갱신 중
                                </span>
                            ) : '전적 갱신'}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SummonerProfileHeader;
