// src/components/matches/MatchStatsSummary.tsx
import React, { useMemo } from 'react';
import type { MatchResponse } from '../../types/api';
import { getChampionIconUrl } from '../../types/api';

interface MatchStatsSummaryProps {
    matches: MatchResponse[];
}

const MatchStatsSummary: React.FC<MatchStatsSummaryProps> = ({ matches }) => {
    const stats = useMemo(() => {
        if (!matches.length) return null;

        const totalGames = matches.length;
        const wins = matches.filter(m => m.win).length;
        const losses = totalGames - wins;
        const winRate = Math.round((wins / totalGames) * 100);

        const totalKills = matches.reduce((acc, m) => acc + m.kills, 0);
        const totalDeaths = matches.reduce((acc, m) => acc + m.deaths, 0);
        const totalAssists = matches.reduce((acc, m) => acc + m.assists, 0);

        const avgKills = (totalKills / totalGames).toFixed(1);
        const avgDeaths = (totalDeaths / totalGames).toFixed(1);
        const avgAssists = (totalAssists / totalGames).toFixed(1);
        const avgKda = totalDeaths === 0 ? 'Perfect' : ((totalKills + totalAssists) / totalDeaths).toFixed(2);

        const champMap = new Map<string, { count: number; wins: number; kills: number; deaths: number; assists: number }>();

        matches.forEach(m => {
            const current = champMap.get(m.championName) || { count: 0, wins: 0, kills: 0, deaths: 0, assists: 0 };
            current.count += 1;
            if (m.win) current.wins += 1;
            current.kills += m.kills;
            current.deaths += m.deaths;
            current.assists += m.assists;
            champMap.set(m.championName, current);
        });

        const mostChampions = Array.from(champMap.entries())
            .sort((a, b) => b[1].count - a[1].count)
            .slice(0, 3)
            .map(([name, data]) => ({
                name,
                winRate: Math.round((data.wins / data.count) * 100),
                wins: data.wins,
                losses: data.count - data.wins,
                kda: data.deaths === 0 ? 'Perfect' : ((data.kills + data.assists) / data.deaths).toFixed(2),
                count: data.count
            }));

        // 최근 10게임 승패 시퀀스
        const recentSequence = matches.slice(0, 10).map(m => m.win);

        return {
            totalGames, wins, losses, winRate,
            avgKills, avgDeaths, avgAssists, avgKda,
            mostChampions, recentSequence
        };
    }, [matches]);

    if (!stats) return null;

    const getKdaColor = (kda: string) => {
        const k = parseFloat(kda);
        if (isNaN(k)) return 'text-[#F19B00]'; // Perfect
        if (k >= 5) return 'text-[#F19B00]';
        if (k >= 4) return 'text-[#00BBA3]';
        if (k >= 3) return 'text-[#0AC8B9]';
        return 'text-[#9E9EB1]';
    };

    return (
        <div className="bg-[#31313C] rounded-lg overflow-hidden animate-fade-in-up">
            <div className="flex flex-col md:flex-row">
                {/* 좌측: 전체 승률 도넛 차트 */}
                <div className="flex-1 p-5 flex items-center gap-6 border-b md:border-b-0 md:border-r border-[#424254]">
                    <div className="relative w-[88px] h-[88px] shrink-0">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                            {/* 배경 (패배) */}
                            <circle
                                cx="18" cy="18" r="13"
                                fill="none"
                                stroke="#E84057"
                                strokeWidth="5"
                                opacity="0.35"
                            />
                            {/* 전체 원 */}
                            <circle
                                cx="18" cy="18" r="13"
                                fill="none"
                                stroke="#E84057"
                                strokeWidth="5"
                                strokeDasharray={`${100} ${100}`}
                                strokeDashoffset="0"
                            />
                            {/* 승률 (승리) */}
                            <circle
                                cx="18" cy="18" r="13"
                                fill="none"
                                stroke="#0AC8B9"
                                strokeWidth="5"
                                strokeDasharray={`${(stats.winRate / 100) * 81.68} ${81.68}`}
                                strokeDashoffset="0"
                                className="win-rate-circle"
                                strokeLinecap="round"
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-lg font-bold text-white">{stats.winRate}%</span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <div className="text-xs text-[#9E9EB1]">
                            {stats.totalGames}전 {stats.wins}승 {stats.losses}패
                        </div>

                        <div className="flex items-baseline gap-0.5">
                            <span className="text-[15px] font-bold text-[#F0F0F0]">{stats.avgKills}</span>
                            <span className="text-[#545469] text-sm">/</span>
                            <span className="text-[15px] font-bold text-[#E84057]">{stats.avgDeaths}</span>
                            <span className="text-[#545469] text-sm">/</span>
                            <span className="text-[15px] font-bold text-[#F0F0F0]">{stats.avgAssists}</span>
                        </div>

                        <div className={`text-xl font-extrabold ${getKdaColor(String(stats.avgKda))}`}>
                            {stats.avgKda}:1
                        </div>

                        {/* 최근 10게임 승패 표시 */}
                        <div className="flex gap-0.5 mt-1">
                            {stats.recentSequence.map((win, i) => (
                                <div
                                    key={i}
                                    className={`w-[14px] h-[14px] rounded-full text-[8px] font-bold flex items-center justify-center ${win ? 'bg-[#0AC8B9] text-white' : 'bg-[#E84057] text-white'
                                        }`}
                                >
                                    {win ? 'W' : 'L'}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 우측: 모스트 챔피언 */}
                <div className="flex-1 p-5">
                    <div className="text-[11px] text-[#515163] font-medium uppercase tracking-wider mb-3">
                        최근 {stats.totalGames}게임 플레이 챔피언
                    </div>
                    <div className="space-y-2.5">
                        {stats.mostChampions.map((champ) => {
                            const champKdaColor = getKdaColor(String(champ.kda));
                            return (
                                <div key={champ.name} className="flex items-center gap-3">
                                    <img
                                        src={getChampionIconUrl(champ.name)}
                                        alt={champ.name}
                                        className="w-8 h-8 rounded-full ring-1 ring-black/20"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className={`text-sm font-bold ${champ.winRate >= 60 ? 'text-[#E84057]' : 'text-[#F0F0F0]'}`}>
                                                {champ.winRate}%
                                            </span>
                                            <span className="text-[11px] text-[#9E9EB1]">
                                                ({champ.wins}승 {champ.losses}패)
                                            </span>
                                        </div>
                                        {/* 승률 바 */}
                                        <div className="w-full h-1 bg-[#E84057]/30 rounded-full mt-1 overflow-hidden">
                                            <div
                                                className="h-full bg-[#0AC8B9] rounded-full transition-all duration-500"
                                                style={{ width: `${champ.winRate}%` }}
                                            />
                                        </div>
                                    </div>
                                    <div className={`text-xs font-bold w-16 text-right ${champKdaColor}`}>
                                        {champ.kda} 평점
                                    </div>
                                </div>
                            );
                        })}
                        {stats.mostChampions.length === 0 && (
                            <div className="text-[#9E9EB1] text-sm text-center py-4">
                                데이터가 부족합니다.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MatchStatsSummary;
