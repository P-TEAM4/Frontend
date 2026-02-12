import React, { useMemo } from 'react';
import type { MatchResponse } from '../../types/api';
import { getChampionIconUrl } from '../../types/api';

interface MatchStatsSummaryProps {
    matches: MatchResponse[];
}

const MatchStatsSummary: React.FC<MatchStatsSummaryProps> = ({ matches }) => {
    // 20게임 기준 최근 전적 요약 계산
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

        // 모스트 챔피언 계산
        const champMap = new Map<string, { count: number; wins: number; totalKda: number; kills: number; deaths: number; assists: number }>();

        matches.forEach(m => {
            const current = champMap.get(m.championName) || { count: 0, wins: 0, totalKda: 0, kills: 0, deaths: 0, assists: 0 };
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
                kda: data.deaths === 0 ? 'Perfect' : ((data.kills + data.assists) / data.deaths).toFixed(2),
                count: data.count
            }));

        return {
            totalGames, wins, losses, winRate,
            avgKills, avgDeaths, avgAssists, avgKda,
            mostChampions
        };
    }, [matches]);

    if (!stats) return null;

    return (
        <div className="bg-[#31313C] rounded-lg border border-[#1C1C1F] mb-4 p-0 overflow-hidden flex flex-col md:flex-row">
            {/* 좌측: 전체 승률/KDA */}
            <div className="flex-1 p-4 border-b md:border-b-0 md:border-r border-[#1C1C1F] flex items-center justify-center gap-8">
                <div className="flex flex-col text-[#9E9EB1] text-xs w-24">
                    <div className="mb-2">
                        {stats.totalGames}전 {stats.wins}승 {stats.losses}패
                    </div>
                    <div className="relative w-24 h-24 flex items-center justify-center">
                        <svg className="transform -rotate-90 w-full h-full" viewBox="0 0 36 36">
                            {/* 배경 원 */}
                            <path
                                className="text-[#E84057]"
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="8"
                            />
                            {/* 승률 원 */}
                            <path
                                className="text-[#5383E8]"
                                strokeDasharray={`${stats.winRate}, 100`}
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="8"
                            />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center text-[#5383E8] font-bold text-lg">
                            {stats.winRate}%
                        </div>
                    </div>
                </div>

                <div className="flex flex-col items-center justify-center">
                    <div className="text-white font-bold text-lg mb-1">
                        <span className="text-[#F0F0F0]">{stats.avgKills}</span>
                        <span className="text-[#9E9EB1]mx-1"> / </span>
                        <span className="text-[#E84057]">{stats.avgDeaths}</span>
                        <span className="text-[#9E9EB1] mx-1"> / </span>
                        <span className="text-[#F0F0F0]">{stats.avgAssists}</span>
                    </div>
                    <div className="text-2xl font-bold text-[#FFFFFF] opacity-90">
                        {stats.avgKda}:1
                    </div>
                    <div className="text-[#E84057] text-xs mt-1">
                        킬관여 44% (임시)
                    </div>
                </div>
            </div>

            {/* 우측: 모스트 챔피언 */}
            <div className="flex-1 p-4 grid grid-cols-1 gap-2">
                <div className="text-xs text-[#9E9EB1] mb-1">
                    플레이한 챔피언 (최근 20게임)
                </div>
                {stats.mostChampions.map((champ) => (
                    <div key={champ.name} className="flex items-center gap-3">
                        <img
                            src={getChampionIconUrl(champ.name)}
                            alt={champ.name}
                            className="w-8 h-8 rounded-full"
                        />
                        <div className="flex-1">
                            <div className="text-sm text-[#F0F0F0] font-bold">{champ.name}</div>
                        </div>
                        <div className="text-xs text-right">
                            <div className={`${Number(champ.winRate) >= 60 ? 'text-[#E84057]' : 'text-[#F0F0F0]'}`}>
                                {champ.winRate}%
                            </div>
                            <div className="text-[#9E9EB1]">({champ.count}게임)</div>
                        </div>
                        <div className="text-xs text-right w-16">
                            <div className={`${Number(champ.kda) >= 3 ? 'text-[#00C8FF]' : 'text-[#9E9EB1]'}`}>
                                {champ.kda} 평점
                            </div>
                        </div>
                    </div>
                ))}
                {stats.mostChampions.length === 0 && (
                    <div className="text-[#9E9EB1] text-sm text-center py-4">
                        데이터가 부족합니다.
                    </div>
                )}
            </div>
        </div>
    );
};

export default MatchStatsSummary;
