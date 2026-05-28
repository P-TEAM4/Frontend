// src/pages/ChampionStatsPage.tsx
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getChampionStats } from '../api/matches';
import type { ChampionStat } from '../api/matches';
import { getDataDragonVersion } from '../types/api';
import ChampionImage from '../components/common/ChampionImage';

type RoleFilter = 'ALL' | 'TOP' | 'JUNGLE' | 'MID' | 'ADC' | 'SUPPORT';

const ROLE_LABELS: Record<RoleFilter, string> = {
    ALL: '전체', TOP: 'TOP', JUNGLE: 'JUNGLE', MID: 'MID', ADC: 'ADC', SUPPORT: 'SUPPORT',
};

const ChampionStatsPage: React.FC = () => {
    const [selectedRole, setSelectedRole] = useState<RoleFilter>('ALL');
    const [selectedChampion, setSelectedChampion] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const apiPosition = selectedRole === 'ALL' ? undefined : selectedRole;

    const { data, isLoading, isError } = useQuery({
        queryKey: ['championStats', selectedRole],
        queryFn: () => getChampionStats(apiPosition),
    });

    // Data Dragon 한국어 챔피언 이름 맵 (영문명 → 한국어명)
    const { data: krNameMap } = useQuery({
        queryKey: ['championKrNames'],
        queryFn: async () => {
            const version = getDataDragonVersion();
            const res = await fetch(
                `https://ddragon.leagueoflegends.com/cdn/${version}/data/ko_KR/champion.json`
            );
            const json = await res.json();
            const map: Record<string, string> = {};
            for (const [key, val] of Object.entries(json.data as Record<string, { name: string }>)) {
                map[key] = val.name;
            }
            return map;
        },
        staleTime: 1000 * 60 * 60,
    });

    const allStats: ChampionStat[] = data?.champions ?? [];

    const filteredStats = allStats.filter((c) => {
        const q = searchQuery.toLowerCase();
        const krName = krNameMap?.[c.championName] ?? '';
        return c.championName.toLowerCase().includes(q) || krName.includes(searchQuery);
    });

    const sortedStats = [...filteredStats].sort((a, b) => b.winRate - a.winRate);

    const selectedChampionData = selectedChampion
        ? allStats.find(c => c.championName === selectedChampion)
        : null;

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

    const getTierBg = (tier: string) => {
        switch (tier) {
            case 'S': return 'bg-[#FF6B6B]/20 border-[#FF6B6B]';
            case 'A': return 'bg-[#FFD93D]/20 border-[#FFD93D]';
            case 'B': return 'bg-[#6BCF7F]/20 border-[#6BCF7F]';
            case 'C': return 'bg-[#4ECDC4]/20 border-[#4ECDC4]';
            case 'D': return 'bg-[#95A5A6]/20 border-[#95A5A6]';
            default: return 'bg-[#1E3A5F]/20 border-[#1E3A5F]';
        }
    };

    return (
        <div className="space-y-6">
            {/* 페이지 헤더 */}
            <div className="section-header">
                <svg className="w-6 h-6 text-[#C8AA6E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <h1 className="section-title">챔피언 통계</h1>
                <p className="text-sm text-[#8B8B8B] ml-auto">
                    {data ? `${data.totalMatches}경기 기반` : '누적 데이터 기반'}
                </p>
            </div>

            {/* 검색 & 라인 필터 */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="챔피언 검색..."
                        className="w-full px-4 py-3 pl-10 bg-[#0D1B2A] border border-[#1E3A5F] rounded-lg text-white placeholder-[#5B5B5B] focus:outline-none focus:border-[#C8AA6E]"
                    />
                    <svg className="absolute left-3 top-3.5 w-5 h-5 text-[#5B5B5B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    {(Object.keys(ROLE_LABELS) as RoleFilter[]).map((role) => (
                        <button
                            key={role}
                            onClick={() => setSelectedRole(role)}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                selectedRole === role
                                    ? 'bg-[#C8AA6E] text-[#0A0E27]'
                                    : 'bg-[#0D1B2A] text-[#8B8B8B] hover:bg-[#1E3A5F]/50'
                            }`}
                        >
                            {ROLE_LABELS[role]}
                        </button>
                    ))}
                </div>
            </div>

            {/* 로딩 */}
            {isLoading && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="h-40 bg-[#0D1B2A] rounded-xl animate-pulse border border-[#1E3A5F]" />
                    ))}
                </div>
            )}

            {/* 에러 */}
            {isError && (
                <div className="text-center py-16 text-[#E84057]">
                    챔피언 통계를 불러올 수 없습니다.
                </div>
            )}

            {/* 데이터 없음 */}
            {!isLoading && !isError && allStats.length === 0 && (
                <div className="text-center py-16 bg-[#0D1B2A] rounded-xl border border-[#1E3A5F]">
                    <svg className="w-16 h-16 text-[#1E3A5F] mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <h3 className="text-lg font-semibold text-[#F0F0F0] mb-2">데이터가 아직 없습니다</h3>
                    <p className="text-sm text-[#8B8B8B]">전적이 검색될수록 통계가 쌓입니다.</p>
                </div>
            )}

            {/* 챔피언 그리드 */}
            {!isLoading && sortedStats.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sortedStats.map((stats) => (
                        <div
                            key={stats.championName}
                            onClick={() => setSelectedChampion(stats.championName)}
                            className="rounded-xl bg-[#0D1B2A] border border-[#1E3A5F] p-4 hover:border-[#C8AA6E]/50 transition-all cursor-pointer hover:scale-105"
                        >
                            <div className="flex items-start gap-4">
                                <div className="relative flex-shrink-0">
                                    <ChampionImage
                                        championName={stats.championName}
                                        className="w-16 h-16 rounded-lg border-2 border-[#C8AA6E]"
                                    />
                                    <div className={`absolute -bottom-2 -right-2 w-8 h-8 rounded-full border-2 ${getTierBg(stats.tier)} flex items-center justify-center`}>
                                        <span className={`text-sm font-bold ${getTierColor(stats.tier)}`}>{stats.tier}</span>
                                    </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-base font-bold text-white mb-1 truncate">
                                    {krNameMap?.[stats.championName] ?? stats.championName}
                                    <span className="text-xs text-[#8B8B8B] ml-1 font-normal">{stats.championName}</span>
                                </h3>
                                    <div className="space-y-1 text-xs">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[#8B8B8B]">승률</span>
                                            <span className={`font-semibold ${stats.winRate >= 50 ? 'text-[#00C8FF]' : 'text-[#E84057]'}`}>
                                                {stats.winRate.toFixed(1)}%
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-[#8B8B8B]">픽률</span>
                                            <span className="text-white font-semibold">{stats.pickRate.toFixed(1)}%</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-[#8B8B8B]">밴률</span>
                                            <span className="text-[#E84057] font-semibold">{stats.banRate.toFixed(1)}%</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-[#8B8B8B]">평균 KDA</span>
                                            <span className="text-[#C8AA6E] font-semibold">
                                                {stats.avgKills.toFixed(1)}/{stats.avgDeaths.toFixed(1)}/{stats.avgAssists.toFixed(1)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-2 pt-2 border-t border-[#1E3A5F] text-xs text-[#5B5B5B] text-right">
                                {stats.totalGames}경기
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* 검색 결과 없음 */}
            {!isLoading && !isError && allStats.length > 0 && sortedStats.length === 0 && (
                <div className="text-center py-12 text-[#8B8B8B]">
                    <p>'{searchQuery}'와 일치하는 챔피언이 없습니다.</p>
                </div>
            )}

            {/* 상세 모달 */}
            {selectedChampionData && (
                <div
                    className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
                    onClick={() => setSelectedChampion(null)}
                >
                    <div
                        className="bg-[#0D1B2A] border border-[#1E3A5F] rounded-2xl max-w-lg w-full"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-6 flex items-center justify-between border-b border-[#1E3A5F]">
                            <div className="flex items-center gap-4">
                                <ChampionImage
                                    championName={selectedChampionData.championName}
                                    className="w-16 h-16 rounded-xl border-2 border-[#C8AA6E]"
                                />
                                <div>
                                    <h2 className="text-xl font-bold text-white">
                                    {krNameMap?.[selectedChampionData.championName] ?? selectedChampionData.championName}
                                    <span className="text-sm text-[#8B8B8B] ml-2 font-normal">{selectedChampionData.championName}</span>
                                </h2>
                                    <span className={`text-lg font-bold ${getTierColor(selectedChampionData.tier)}`}>
                                        {selectedChampionData.tier} 티어
                                    </span>
                                </div>
                            </div>
                            <button onClick={() => setSelectedChampion(null)} className="text-[#8B8B8B] hover:text-white">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="p-6 grid grid-cols-2 gap-4">
                            {[
                                { label: '승률', value: `${selectedChampionData.winRate.toFixed(1)}%`, color: selectedChampionData.winRate >= 50 ? '#00C8FF' : '#E84057' },
                                { label: '픽률', value: `${selectedChampionData.pickRate.toFixed(1)}%`, color: '#F0F0F0' },
                                { label: '밴률', value: `${selectedChampionData.banRate.toFixed(1)}%`, color: '#E84057' },
                                { label: '총 경기', value: `${selectedChampionData.totalGames}경기`, color: '#8B8B8B' },
                                { label: '평균 킬', value: selectedChampionData.avgKills.toFixed(1), color: '#F0F0F0' },
                                { label: '평균 데스', value: selectedChampionData.avgDeaths.toFixed(1), color: '#E84057' },
                                { label: '평균 어시', value: selectedChampionData.avgAssists.toFixed(1), color: '#00C8FF' },
                            ].map(({ label, value, color }) => (
                                <div key={label} className="bg-[#112240] rounded-lg p-3 text-center">
                                    <div className="text-xs text-[#8B8B8B] mb-1">{label}</div>
                                    <div className="text-lg font-bold" style={{ color }}>{value}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChampionStatsPage;
