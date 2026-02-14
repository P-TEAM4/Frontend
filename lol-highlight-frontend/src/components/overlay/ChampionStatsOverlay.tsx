// src/components/overlay/ChampionStatsOverlay.tsx
import React, { useState, useEffect } from 'react';
import ChampionImage from '../common/ChampionImage';
import { getChampionStats } from '../../api/champions';
import type { ChampionGlobalStats } from '../../types/champion';

interface ChampionStatsOverlayProps {
    championName: string;
    onClose: () => void;
}

const ChampionStatsOverlay: React.FC<ChampionStatsOverlayProps> = ({ championName, onClose }) => {
    const [stats, setStats] = useState<ChampionGlobalStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                setLoading(true);
                setError(null);
                const data = await getChampionStats(championName);
                setStats(data);
            } catch (err) {
                console.error('Failed to fetch champion stats:', err);
                setError('챔피언 통계를 불러올 수 없습니다.');
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [championName]);

    const getTierColor = (tier: string) => {
        switch (tier) {
            case 'S': return 'text-[#FF6B6B]';
            case 'A': return 'text-[#FFD93D]';
            case 'B': return 'text-[#6BCF7F]';
            case 'C': return 'text-[#4ECDC4]';
            case 'D': return 'text-[#95A5A6]';
            default: return 'text-white';
        }
    };

    if (loading) {
        return (
            <div className="fixed top-4 right-4 w-96 bg-[#0D1B2A]/95 backdrop-blur-sm border-2 border-[#C8AA6E] rounded-2xl p-6 shadow-2xl z-50">
                <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C8AA6E]"></div>
                </div>
            </div>
        );
    }

    if (error || !stats) {
        return (
            <div className="fixed top-4 right-4 w-96 bg-[#0D1B2A]/95 backdrop-blur-sm border-2 border-[#E84057] rounded-2xl p-6 shadow-2xl z-50">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-white">오류</h2>
                    <button
                        onClick={onClose}
                        className="text-[#8B8B8B] hover:text-white transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <p className="text-[#8B8B8B]">{error || '데이터를 불러올 수 없습니다.'}</p>
            </div>
        );
    }

    return (
        <div className="fixed top-4 right-4 w-96 bg-[#0D1B2A]/95 backdrop-blur-sm border-2 border-[#C8AA6E] rounded-2xl shadow-2xl z-50 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-[#0D1B2A] border-b border-[#1E3A5F] p-4 flex items-center justify-between rounded-t-2xl">
                <div className="flex items-center gap-3">
                    <ChampionImage
                        championName={stats.championName}
                        className="w-12 h-12 rounded-lg border-2 border-[#C8AA6E]"
                    />
                    <div>
                        <h2 className="text-lg font-bold text-white">
                            {stats.championNameKr}
                        </h2>
                        <div className="flex items-center gap-2 text-xs">
                            <span className={`font-bold ${getTierColor(stats.tier)}`}>
                                티어 {stats.tier}
                            </span>
                            <span className="text-[#8B8B8B]">•</span>
                            <span className={`font-semibold ${stats.winRate >= 50 ? 'text-[#00C8FF]' : 'text-[#E84057]'}`}>
                                {stats.winRate.toFixed(1)}%
                            </span>
                        </div>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="text-[#8B8B8B] hover:text-white transition-colors"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
                {/* Stats Summary */}
                <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-[#1E3A5F]/30 rounded-lg p-2">
                        <div className="text-xs text-[#8B8B8B]">픽률</div>
                        <div className="text-sm font-bold text-white">{stats.pickRate.toFixed(1)}%</div>
                    </div>
                    <div className="bg-[#1E3A5F]/30 rounded-lg p-2">
                        <div className="text-xs text-[#8B8B8B]">승률</div>
                        <div className={`text-sm font-bold ${stats.winRate >= 50 ? 'text-[#00C8FF]' : 'text-[#E84057]'}`}>
                            {stats.winRate.toFixed(1)}%
                        </div>
                    </div>
                    <div className="bg-[#1E3A5F]/30 rounded-lg p-2">
                        <div className="text-xs text-[#8B8B8B]">밴률</div>
                        <div className="text-sm font-bold text-[#E84057]">{stats.banRate.toFixed(1)}%</div>
                    </div>
                </div>

                {/* Core Items */}
                <div>
                    <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                        <svg className="w-4 h-4 text-[#C8AA6E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                        코어 아이템
                    </h3>
                    <div className="flex gap-2 justify-center">
                        {stats.coreItems.map((itemId) => (
                            <div key={itemId} className="w-12 h-12 bg-[#1E3A5F] rounded-lg border border-[#C8AA6E]/30 flex items-center justify-center">
                                <span className="text-[10px] text-[#8B8B8B]">{itemId}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Situational Items */}
                <div>
                    <h3 className="text-sm font-bold text-white mb-2">상황 아이템</h3>
                    <div className="flex gap-2 justify-center">
                        {stats.situationalItems.map((itemId) => (
                            <div key={itemId} className="w-10 h-10 bg-[#1E3A5F] rounded border border-[#1E3A5F] flex items-center justify-center">
                                <span className="text-[9px] text-[#8B8B8B]">{itemId}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Matchups (2-column) */}
                <div className="grid grid-cols-2 gap-3">
                    {/* Counters */}
                    <div className="rounded-lg bg-[#E84057]/10 border border-[#E84057]/30 p-3">
                        <h3 className="text-xs font-bold text-[#E84057] mb-2">상성 불리</h3>
                        <div className="space-y-1.5">
                            {stats.counters.slice(0, 3).map((champion) => (
                                <div key={champion} className="flex items-center gap-2">
                                    <ChampionImage
                                        championName={champion}
                                        className="w-6 h-6 rounded border border-[#E84057]/50"
                                    />
                                    <span className="text-xs text-white truncate">{champion}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Good Against */}
                    <div className="rounded-lg bg-[#00C8FF]/10 border border-[#00C8FF]/30 p-3">
                        <h3 className="text-xs font-bold text-[#00C8FF] mb-2">상성 유리</h3>
                        <div className="space-y-1.5">
                            {stats.goodAgainst.slice(0, 3).map((champion) => (
                                <div key={champion} className="flex items-center gap-2">
                                    <ChampionImage
                                        championName={champion}
                                        className="w-6 h-6 rounded border border-[#00C8FF]/50"
                                    />
                                    <span className="text-xs text-white truncate">{champion}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Recommended Rune */}
                <div>
                    <h3 className="text-sm font-bold text-white mb-2">추천 룬</h3>
                    <div className="flex items-center gap-3 p-3 bg-[#1E3A5F]/30 rounded-lg border border-[#1E3A5F]">
                        <div className="w-10 h-10 bg-[#C8AA6E]/20 rounded-full flex items-center justify-center border-2 border-[#C8AA6E]">
                            <span className="text-xs text-[#C8AA6E] font-bold">R</span>
                        </div>
                        <div>
                            <div className="text-sm text-white font-semibold">{stats.primaryRune}</div>
                            <div className="text-xs text-[#8B8B8B]">주 룬</div>
                        </div>
                    </div>
                </div>

                {/* Average KDA */}
                <div className="bg-[#1E3A5F]/30 rounded-lg p-3">
                    <div className="text-xs text-[#8B8B8B] mb-1">평균 KDA</div>
                    <div className="text-center text-[#C8AA6E] font-bold">
                        {stats.avgKills.toFixed(1)} / {stats.avgDeaths.toFixed(1)} / {stats.avgAssists.toFixed(1)}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChampionStatsOverlay;
