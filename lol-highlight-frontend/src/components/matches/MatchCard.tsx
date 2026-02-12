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

const MatchCard: React.FC<MatchCardProps> = ({ match, hasHighlights = false }) => {
    const navigate = useNavigate();

    // 승패에 따른 스타일 정의
    const bgClass = match.win ? 'bg-[#28344E]' : 'bg-[#59343B]';
    const borderClass = match.win ? 'border-[#5383E8]' : 'border-[#E84057]';
    const resultTextClass = match.win ? 'text-[#5383E8]' : 'text-[#E84057]';
    const buttonClass = match.win ? 'bg-[#2F436E] hover:bg-[#3B548A]' : 'bg-[#703C47] hover:bg-[#8A4A57]';

    return (
        <div className={`flex w-full rounded-sm mb-2 border-l-8 ${borderClass} ${bgClass} shadow-sm overflow-hidden`}>
            {/* 1. 게임 정보 (승패, 시간, 큐타입) */}
            <div className="w-28 py-3 pl-3 flex flex-col justify-center text-xs text-[#9E9EB1] gap-1 shrink-0">
                <div className={`font-bold ${resultTextClass}`}>
                    {match.win ? '승리' : '패배'}
                </div>
                <div>{formatGameDuration(match.gameDuration)}</div>
                <div className="w-full border-t border-white/10 my-0.5"></div>
                <div>{formatRelativeTime(match.gameCreation)}</div>
            </div>

            {/* 2. 챔피언 및 스펠 (현재 스펠/룬 없음) */}
            <div className="w-24 py-3 flex flex-col items-center justify-center gap-2 shrink-0">
                <div className="relative group">
                    <img
                        src={getChampionIconUrl(match.championName)}
                        alt={match.championName}
                        className="w-12 h-12 rounded-full"
                    />
                </div>
                <div className="text-xs text-[#9E9EB1] truncate w-full text-center">
                    {match.championName}
                </div>
            </div>

            {/* 3. KDA 정보 */}
            <div className="w-32 py-3 flex flex-col justify-center items-center shrink-0">
                <div className="text-[15px] font-bold text-[#F0F0F0] tracking-wide">
                    <span>{match.kills}</span>
                    <span className="text-[#9E9EB1] opacity-60 mx-1">/</span>
                    <span className="text-[#E84057]">{match.deaths}</span>
                    <span className="text-[#9E9EB1] opacity-60 mx-1">/</span>
                    <span>{match.assists}</span>
                </div>
                <div className="text-xs font-bold text-[#9E9EB1] mt-1.5 opacity-80">
                    {match.deaths === 0 ? (
                        <span className="text-[#C8AA6E]">Perfect</span>
                    ) : (
                        <span>{match.kda.toFixed(2)}:1 평점</span>
                    )}
                </div>
            </div>

            {/* 4. 아이템 (데이터 연동) */}
            <div className="flex-1 py-3 flex items-center pl-4 gap-1">
                {[match.item0, match.item1, match.item2, match.item3, match.item4, match.item5].map((item, i) => (
                    <div key={i} className={`w-6 h-6 rounded-sm ${match.win ? 'bg-[#2F436E]' : 'bg-[#703C47]'} overflow-hidden`}>
                        {item !== 0 && (
                            <img
                                src={`https://ddragon.leagueoflegends.com/cdn/14.23.1/img/item/${item}.png`}
                                alt={`Item ${item}`}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                }}
                            />
                        )}
                    </div>
                ))}
                {/* 장신구 (item6) */}
                <div className={`w-6 h-6 rounded-full ml-1 ${match.win ? 'bg-[#2F436E]' : 'bg-[#703C47]'} overflow-hidden`}>
                    {match.item6 !== 0 && (
                        <img
                            src={`https://ddragon.leagueoflegends.com/cdn/14.23.1/img/item/${match.item6}.png`}
                            alt={`Trinket ${match.item6}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                            }}
                        />
                    )}
                </div>
            </div>

            {/* 5. 더보기 버튼영역 */}
            <div className={`w-10 flex flex-col justify-end items-center pb-2 pr-2 ${bgClass}`}>
                <button
                    onClick={() => navigate(`/match/${match.matchId}`)}
                    className={`w-7 h-7 flex items-center justify-center rounded border border-transparent ${buttonClass} text-white transition-colors`}
                >
                    <svg className="w-4 h-4 transform rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

export default MatchCard;
