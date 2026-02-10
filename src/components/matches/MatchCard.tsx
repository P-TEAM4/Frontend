// src/components/matches/MatchCard.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { MatchResponse } from '../../types/api';
import {
    getChampionIconUrl,
    formatRelativeTime,
    formatGameDuration
} from '../../types/api';

interface MatchCardProps {
    match: MatchResponse;
    hasHighlights?: boolean;
}

const MatchCard: React.FC<MatchCardProps> = ({ match }) => {
    const navigate = useNavigate();

    // 승패에 따른 스타일 정의
    const isWin = match.win;
    const bgColor = isWin ? 'bg-[#1A3B38]' : 'bg-[#59343B]';
    const borderColor = isWin ? 'border-l-[#0AC8B9]' : 'border-l-[#E84057]';
    const resultText = isWin ? '승리' : '패배';
    const resultColor = isWin ? 'text-[#0AC8B9]' : 'text-[#E84057]';
    const hoverBg = isWin ? 'hover:bg-[#224845]' : 'hover:bg-[#633A43]';

    // KDA 색상
    const getKdaColor = (kda: number) => {
        if (kda >= 5) return 'text-[#F19B00]';   // 오렌지 (Perfect급)
        if (kda >= 4) return 'text-[#00BBA3]';   // 청록
        if (kda >= 3) return 'text-[#0AC8B9]';   // 파랑
        return 'text-[#9E9EB1]';                  // 기본
    };

    return (
        <div
            onClick={() => navigate(`/match/${match.matchId}`)}
            className={`
                flex items-center w-full rounded-[4px] 
                border-l-[6px] ${borderColor} ${bgColor} ${hoverBg}
                cursor-pointer transition-colors duration-150
                group relative overflow-hidden
            `}
        >
            {/* 1. 게임 타입 & 시간 */}
            <div className="w-[108px] py-3 px-3 flex flex-col justify-center text-xs shrink-0">
                <div className="text-[#9E9EB1] font-medium mb-0.5">솔로랭크</div>
                <div className={`font-bold text-sm ${resultColor}`}>{resultText}</div>
                <div className="w-full border-t border-white/10 my-1.5"></div>
                <div className="text-[#9E9EB1]">{formatRelativeTime(match.gameCreation)}</div>
                <div className="text-[#9E9EB1]">{formatGameDuration(match.gameDuration)}</div>
            </div>

            {/* 2. 챔피언 아이콘 */}
            <div className="w-[80px] py-3 flex flex-col items-center justify-center gap-1 shrink-0">
                <div className="relative">
                    <img
                        src={getChampionIconUrl(match.championName)}
                        alt={match.championName}
                        className="w-12 h-12 rounded-full ring-2 ring-black/30"
                    />
                    {/* 챔피언 레벨 */}
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-[#202D37] text-[10px] text-white font-bold px-1.5 py-0 rounded-sm">
                        18
                    </div>
                </div>
            </div>

            {/* 3. KDA */}
            <div className="w-[120px] py-3 flex flex-col justify-center items-center shrink-0">
                <div className="text-[15px] font-bold text-[#F0F0F0] tracking-wide">
                    <span>{match.kills}</span>
                    <span className="text-[#545469] mx-0.5">/</span>
                    <span className="text-[#E84057]">{match.deaths}</span>
                    <span className="text-[#545469] mx-0.5">/</span>
                    <span>{match.assists}</span>
                </div>
                <div className={`text-xs font-bold mt-1 ${match.deaths === 0 ? 'text-[#F19B00]' : getKdaColor(match.kda)}`}>
                    {match.deaths === 0 ? (
                        'Perfect KDA'
                    ) : (
                        <>{match.kda.toFixed(2)}:1 평점</>
                    )}
                </div>
            </div>

            {/* 4. 킬관여, CS 등 기본 스탯 */}
            <div className="flex-1 py-3 px-4 flex items-center justify-center gap-6 text-xs text-[#9E9EB1]">
                <div className="hidden md:flex items-center gap-8">
                    <div className="text-center">
                        <div className="text-[11px] text-[#515163]">킬/데스</div>
                        <div className="text-[#F0F0F0] font-semibold text-sm">
                            {match.kills + match.assists}
                        </div>
                    </div>
                </div>
            </div>

            {/* 5. 더보기 화살표 */}
            <div className="w-[40px] flex items-center justify-center shrink-0">
                <div className={`
                    w-[28px] h-[80px] flex items-end justify-center pb-2
                    ${isWin ? 'bg-[#1E4A46]' : 'bg-[#703C47]'}
                    rounded-tr-[4px] rounded-br-[4px]
                `}>
                    <svg
                        className="w-3 h-3 text-white/60 group-hover:text-white transition-colors transform rotate-90"
                        fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </div>
        </div>
    );
};

export default MatchCard;
