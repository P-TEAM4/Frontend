// src/pages/ChampionStatsPage.tsx
import React, { useState } from 'react';
import ChampionImage from '../components/common/ChampionImage';

interface ChampionGlobalStats {
    championName: string;
    championNameKr: string; // 한글 이름
    tier: 'S' | 'A' | 'B' | 'C' | 'D';
    pickRate: number;
    banRate: number;
    winRate: number;
    avgKills: number;
    avgDeaths: number;
    avgAssists: number;
    coreItems: number[];
    situationalItems: number[];
    primaryRune: string;
    counters: string[]; // 상성 불리
    goodAgainst: string[]; // 상성 유리
}

type RoleFilter = 'ALL' | 'TOP' | 'JUNGLE' | 'MID' | 'ADC' | 'SUPPORT';

const ChampionStatsPage: React.FC = () => {
    const [selectedRole, setSelectedRole] = useState<RoleFilter>('ALL');
    const [sortBy, setSortBy] = useState<'tier' | 'pickRate' | 'winRate' | 'banRate'>('tier');
    const [selectedChampion, setSelectedChampion] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    // TODO: 백엔드 API 연동 (현재는 목업 데이터)
    const mockChampionStats: ChampionGlobalStats[] = [
        {
            championName: 'Ahri',
            championNameKr: '아리',
            tier: 'S',
            pickRate: 8.5,
            banRate: 12.3,
            winRate: 52.1,
            avgKills: 7.2,
            avgDeaths: 5.1,
            avgAssists: 8.3,
            coreItems: [3152, 3020, 3089],
            situationalItems: [3135, 3157, 3116],
            primaryRune: 'Electrocute',
            counters: ['Zed', 'Yasuo', 'Fizz'],
            goodAgainst: ['Lux', 'Syndra', 'Orianna'],
        },
        {
            championName: 'Zed',
            championNameKr: '제드',
            tier: 'A',
            pickRate: 12.1,
            banRate: 25.4,
            winRate: 49.8,
            avgKills: 8.1,
            avgDeaths: 6.2,
            avgAssists: 6.5,
            coreItems: [3142, 3814, 3156],
            situationalItems: [3036, 3071, 3153],
            primaryRune: 'Conqueror',
            counters: ['Malzahar', 'Lissandra', 'Diana'],
            goodAgainst: ['Ahri', 'Lux', 'Xerath'],
        },
        {
            championName: 'Lux',
            championNameKr: '럭스',
            tier: 'B',
            pickRate: 6.3,
            banRate: 3.2,
            winRate: 50.5,
            avgKills: 5.8,
            avgDeaths: 4.9,
            avgAssists: 11.2,
            coreItems: [3040, 6653, 3089],
            situationalItems: [3135, 3165, 3102],
            primaryRune: 'Arcane Comet',
            counters: ['Zed', 'Fizz', 'Yasuo'],
            goodAgainst: ['Syndra', 'Orianna', 'Xerath'],
        },
    ];

    const filteredStats = mockChampionStats.filter((champion) => {
        const query = searchQuery.toLowerCase();
        return (
            champion.championName.toLowerCase().includes(query) ||
            champion.championNameKr.includes(searchQuery) // 한글은 대소문자 구분 없음
        );
    });

    const sortedStats = [...filteredStats].sort((a, b) => {
        if (sortBy === 'tier') {
            const tierOrder = { S: 5, A: 4, B: 3, C: 2, D: 1 };
            return tierOrder[b.tier] - tierOrder[a.tier];
        }
        if (sortBy === 'pickRate') return b.pickRate - a.pickRate;
        if (sortBy === 'winRate') return b.winRate - a.winRate;
        if (sortBy === 'banRate') return b.banRate - a.banRate;
        return 0;
    });

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

    const selectedChampionData = selectedChampion 
        ? mockChampionStats.find(c => c.championName === selectedChampion)
        : null;

    return (
        <div className="space-y-6">
            {/* 페이지 헤더 */}
            <div className="section-header">
                <svg className="w-6 h-6 text-[#C8AA6E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <h1 className="section-title">챔피언 통계</h1>
                <p className="text-sm text-[#8B8B8B] ml-auto">전체 플레이어 데이터 기반</p>
            </div>

            {/* 검색 & 필터 */}
            <div className="flex flex-col sm:flex-row gap-4">
                {/* 검색 */}
                <div className="flex-1">
                    <div className="relative">
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
                </div>

                {/* 포지션 필터 */}
                <div className="flex gap-2">
                    {(['ALL', 'TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT'] as RoleFilter[]).map((role) => (
                        <button
                            key={role}
                            onClick={() => setSelectedRole(role)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                selectedRole === role
                                    ? 'bg-[#C8AA6E] text-[#0A0E27]'
                                    : 'bg-[#0D1B2A] text-[#8B8B8B] hover:bg-[#1E3A5F]/50'
                            }`}
                        >
                            {role === 'ALL' ? '전체' : role}
                        </button>
                    ))}
                </div>
            </div>

            {/* 정렬 옵션 */}
            <div className="flex items-center gap-3">
                <span className="text-sm text-[#8B8B8B]">정렬:</span>
                <div className="flex gap-2">
                    <button
                        onClick={() => setSortBy('tier')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            sortBy === 'tier'
                                ? 'bg-[#1E3A5F] text-[#00C8FF]'
                                : 'bg-[#0D1B2A] text-[#8B8B8B] hover:bg-[#1E3A5F]/50'
                        }`}
                    >
                        티어
                    </button>
                    <button
                        onClick={() => setSortBy('winRate')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            sortBy === 'winRate'
                                ? 'bg-[#1E3A5F] text-[#00C8FF]'
                                : 'bg-[#0D1B2A] text-[#8B8B8B] hover:bg-[#1E3A5F]/50'
                        }`}
                    >
                        승률
                    </button>
                    <button
                        onClick={() => setSortBy('pickRate')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            sortBy === 'pickRate'
                                ? 'bg-[#1E3A5F] text-[#00C8FF]'
                                : 'bg-[#0D1B2A] text-[#8B8B8B] hover:bg-[#1E3A5F]/50'
                        }`}
                    >
                        픽률
                    </button>
                    <button
                        onClick={() => setSortBy('banRate')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            sortBy === 'banRate'
                                ? 'bg-[#1E3A5F] text-[#00C8FF]'
                                : 'bg-[#0D1B2A] text-[#8B8B8B] hover:bg-[#1E3A5F]/50'
                        }`}
                    >
                        밴률
                    </button>
                </div>
            </div>

            {/* 챔피언 통계 그리드 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sortedStats.map((stats) => (
                    <div
                        key={stats.championName}
                        onClick={() => setSelectedChampion(stats.championName)}
                        className="rounded-xl bg-[#0D1B2A] border border-[#1E3A5F] p-4 hover:border-[#C8AA6E]/50 transition-all cursor-pointer hover:transform hover:scale-105"
                    >
                        <div className="flex items-start gap-4">
                            {/* 챔피언 이미지 + 티어 */}
                            <div className="relative flex-shrink-0">
                                <ChampionImage
                                    championName={stats.championName}
                                    className="w-16 h-16 rounded-lg border-2 border-[#C8AA6E]"
                                />
                                <div className={`absolute -bottom-2 -right-2 w-8 h-8 rounded-full border-2 ${getTierBg(stats.tier)} flex items-center justify-center`}>
                                    <span className={`text-sm font-bold ${getTierColor(stats.tier)}`}>
                                        {stats.tier}
                                    </span>
                                </div>
                            </div>

                            {/* 기본 정보 */}
                            <div className="flex-1 min-w-0">
                                <h3 className="text-lg font-bold text-white mb-1 truncate">
                                    {stats.championNameKr}
                                    <span className="text-sm text-[#8B8B8B] ml-2">{stats.championName}</span>
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

                        {/* 코어템 미리보기 */}
                        <div className="mt-3 pt-3 border-t border-[#1E3A5F]">
                            <div className="flex gap-1.5 justify-center">
                                {stats.coreItems.slice(0, 3).map((itemId) => (
                                    <div key={itemId} className="w-8 h-8 bg-[#1E3A5F] rounded border border-[#C8AA6E]/30 flex items-center justify-center">
                                        <span className="text-[8px] text-[#8B8B8B]">{itemId}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* 챔피언 상세 모달 */}
            {selectedChampionData && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setSelectedChampion(null)}>
                    <div
                        className="bg-[#0D1B2A] border border-[#1E3A5F] rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* 모달 헤더 */}
                        <div className="sticky top-0 bg-[#0D1B2A] border-b border-[#1E3A5F] p-6 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <ChampionImage
                                    championName={selectedChampionData.championName}
                                    className="w-20 h-20 rounded-xl border-2 border-[#C8AA6E]"
                                />
                                <div>
                                    <h2 className="text-2xl font-bold text-white">
                                        {selectedChampionData.championNameKr}
                                        <span className="text-lg text-[#8B8B8B] ml-3">{selectedChampionData.championName}</span>
                                    </h2>
                                    <div className="flex items-center gap-3 mt-1">
                                        <span className={`text-lg font-bold ${getTierColor(selectedChampionData.tier)}`}>
                                            티어 {selectedChampionData.tier}
                                        </span>
                                        <span className="text-sm text-[#8B8B8B]">승률 {selectedChampionData.winRate.toFixed(1)}%</span>
                                        <span className="text-sm text-[#8B8B8B]">픽률 {selectedChampionData.pickRate.toFixed(1)}%</span>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedChampion(null)}
                                className="text-[#8B8B8B] hover:text-white transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* 모달 내용 */}
                        <div className="p-6 space-y-6">
                            {/* 코어 아이템 빌드 */}
                            <div>
                                <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                                    <svg className="w-5 h-5 text-[#C8AA6E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                    </svg>
                                    코어 아이템
                                </h3>
                                <div className="flex gap-3">
                                    {selectedChampionData.coreItems.map((itemId) => (
                                        <div key={itemId} className="w-16 h-16 bg-[#1E3A5F] rounded-lg border border-[#C8AA6E]/30 flex items-center justify-center">
                                            <span className="text-xs text-[#8B8B8B]">{itemId}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* 상황템 */}
                            <div>
                                <h3 className="text-lg font-bold text-white mb-3">상황 아이템</h3>
                                <div className="flex gap-3">
                                    {selectedChampionData.situationalItems.map((itemId) => (
                                        <div key={itemId} className="w-16 h-16 bg-[#1E3A5F] rounded-lg border border-[#1E3A5F] flex items-center justify-center">
                                            <span className="text-xs text-[#8B8B8B]">{itemId}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* 상성 정보 */}
                            <div className="grid grid-cols-2 gap-4">
                                {/* 카운터 (상성 불리) */}
                                <div className="rounded-lg bg-[#E84057]/10 border border-[#E84057]/30 p-4">
                                    <h3 className="text-sm font-bold text-[#E84057] mb-3">상성 불리</h3>
                                    <div className="space-y-2">
                                        {selectedChampionData.counters.map((champion) => (
                                            <div key={champion} className="flex items-center gap-2">
                                                <ChampionImage
                                                    championName={champion}
                                                    className="w-8 h-8 rounded border border-[#E84057]/50"
                                                />
                                                <span className="text-sm text-white">{champion}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* 유리한 상성 */}
                                <div className="rounded-lg bg-[#00C8FF]/10 border border-[#00C8FF]/30 p-4">
                                    <h3 className="text-sm font-bold text-[#00C8FF] mb-3">상성 유리</h3>
                                    <div className="space-y-2">
                                        {selectedChampionData.goodAgainst.map((champion) => (
                                            <div key={champion} className="flex items-center gap-2">
                                                <ChampionImage
                                                    championName={champion}
                                                    className="w-8 h-8 rounded border border-[#00C8FF]/50"
                                                />
                                                <span className="text-sm text-white">{champion}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* 추천 룬 */}
                            <div>
                                <h3 className="text-lg font-bold text-white mb-3">추천 룬</h3>
                                <div className="flex items-center gap-3 p-4 bg-[#1E3A5F]/30 rounded-lg border border-[#1E3A5F]">
                                    <div className="w-12 h-12 bg-[#C8AA6E]/20 rounded-full flex items-center justify-center border-2 border-[#C8AA6E]">
                                        <span className="text-xs text-[#C8AA6E] font-bold">R</span>
                                    </div>
                                    <div>
                                        <div className="text-white font-semibold">{selectedChampionData.primaryRune}</div>
                                        <div className="text-xs text-[#8B8B8B]">주 룬</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 검색 결과 없음 */}
            {sortedStats.length === 0 && (
                <div className="text-center py-12">
                    <svg className="w-16 h-16 text-[#8B8B8B] mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <p className="text-[#8B8B8B]">
                        {searchQuery 
                            ? `'${searchQuery}'와 일치하는 챔피언을 찾을 수 없습니다.`
                            : '챔피언 통계를 불러오는 중입니다...'
                        }
                    </p>
                    {searchQuery && (
                        <p className="text-sm text-[#5B5B5B] mt-2">다른 검색어를 입력해보세요.</p>
                    )}
                </div>
            )}
        </div>
    );
};

export default ChampionStatsPage;
