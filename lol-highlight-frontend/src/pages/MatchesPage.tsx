// src/pages/MatchesPage.tsx
import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { getMatches, refreshMatches } from '../api/matches';
import { useAuthStore } from '../store/authStore';
import MatchCard from '../components/matches/MatchCard';
import SummonerProfileHeader from '../components/matches/SummonerProfileHeader';
import MatchStatsSummary from '../components/matches/MatchStatsSummary';
import Button from '../components/common/Button';
import ahriBg from '../assets/ahri_bg.png';

const MatchesPage: React.FC = () => {
    const navigate = useNavigate();
    const { isAuthenticated, user } = useAuthStore();
    const queryClient = useQueryClient();

    // 임시: 기본 검색값 설정 (로그인한 유저가 있다면 그 유저로, 아니면 기본값)
    const [activeSearch, setActiveSearch] = useState<{ gameName: string; tagLine: string } | null>(null);

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }
    }, [isAuthenticated, navigate]);

    const [searchInput, setSearchInput] = useState('');

    // 전적 조회 (무한 스크롤) - 프로필 정보도 함께 반환
    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        isError,
        error,
    } = useInfiniteQuery({
        queryKey: ['matches', activeSearch?.gameName, activeSearch?.tagLine],
        queryFn: ({ pageParam = 0 }) =>
            getMatches({
                gameName: activeSearch!.gameName,
                tagLine: activeSearch!.tagLine,
                page: pageParam,
                size: 10,
            }),
        initialPageParam: 0,
        getNextPageParam: (lastPage) =>
            lastPage.matches.last ? undefined : lastPage.matches.number + 1,
        enabled: !!activeSearch,
    });

    // 첫 페이지에서 프로필 정보 추출 (모든 페이지에서 동일)
    const summonerProfile = data?.pages[0]?.profile;

    // 전적 갱신 뮤테이션
    const refreshMutation = useMutation({
        mutationFn: () => refreshMatches(activeSearch!.gameName, activeSearch!.tagLine),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['matches', activeSearch?.gameName, activeSearch?.tagLine]
            });
            queryClient.invalidateQueries({
                queryKey: ['summoner', activeSearch?.gameName, activeSearch?.tagLine]
            });
        },
    });

    // 검색 핸들러
    const handleSearch = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        const input = searchInput.trim();
        if (!input) return;

        const hashIndex = input.lastIndexOf('#');
        if (hashIndex === -1) {
            setActiveSearch({ gameName: input, tagLine: 'KR1' });
        } else {
            const gameName = input.substring(0, hashIndex).trim();
            const tagLine = input.substring(hashIndex + 1).trim();
            if (gameName && tagLine) {
                setActiveSearch({ gameName, tagLine });
            }
        }
    }, [searchInput]);

    const allMatches = data?.pages.flatMap((page) => page.matches.content) || [];

    return (
        <div className="bg-[#1C1C1F] min-h-screen pb-20">
            {/* 1. 검색 전: 랜딩 페이지 (중앙 검색창 & 배경 이미지) */}
            {!activeSearch && (
                <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
                    {/* 배경 이미지 */}
                    <div className="absolute inset-0 z-0">
                        <img
                            src={ahriBg}
                            alt="Background"
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0D1B2A] via-[#0D1B2A]/80 to-[#0D1B2A]/40" />
                    </div>

                    {/* 중앙 컨텐츠 */}
                    <div className="relative z-10 w-full max-w-2xl px-6 flex flex-col items-center animate-fade-in-up">
                        <div className="mb-10 text-center">
                            <h1 className="text-5xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-white to-[#ffffffaa] mb-4 tracking-tighter drop-shadow-2xl">
                                NEXUS.GG
                            </h1>
                            <p className="text-[#9E9EB1] text-lg">
                                당신의 최고의 순간을 기록하고 분석하세요.
                            </p>
                        </div>

                        <form onSubmit={handleSearch} className="w-full relative group">
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-[#00C8FF] to-[#0082AB] rounded-2xl blur opacity-30 group-hover:opacity-70 transition duration-500"></div>
                            <div className="relative bg-[#1C1C1F]/90 backdrop-blur-xl rounded-2xl border border-[#1E3A5F] group-hover:border-[#00C8FF]/50 transition-colors p-2 flex items-center shadow-2xl">
                                <div className="pl-4 pr-3 py-2 border-r border-[#1E3A5F]/50 text-[#8B8B8B] font-semibold select-none">
                                    KR
                                </div>
                                <input
                                    type="text"
                                    value={searchInput}
                                    onChange={(e) => setSearchInput(e.target.value)}
                                    placeholder="소환사명 + #태그 (예: Hide on bush #KR1)"
                                    className="flex-1 bg-transparent border-none text-white px-4 py-3 focus:outline-none placeholder-[#5A5A6B] text-lg font-medium"
                                />
                                <button
                                    type="submit"
                                    className="w-14 h-12 bg-[#00C8FF] rounded-xl flex items-center justify-center text-[#0D1B2A] hover:bg-[#00A0CC] transition-all transform active:scale-95"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                </button>
                            </div>
                        </form>

                        <div className="mt-8 flex gap-4 text-sm text-[#8B8B8B]">
                            <span>추천 검색어:</span>
                            <button onClick={() => { setSearchInput("Hide on bush #KR1"); }} className="hover:text-[#00C8FF] transition-colors">Hide on bush #KR1</button>
                            <button onClick={() => { setSearchInput("Agurin #EUW"); }} className="hover:text-[#00C8FF] transition-colors">Agurin #EUW</button>
                        </div>
                    </div>
                </div>
            )}

            {/* 2. 검색 후: 결과 페이지 (상단 고정 검색바 및 컨텐츠) */}
            {activeSearch && (
                <>
                    {/* 상단 검색바 (헤더) */}
                    <div className="bg-[#1C1C1F]/95 backdrop-blur border-b border-[#2C2C35] py-3 sticky top-0 z-50 animate-fade-in-down">
                        <div className="max-w-[1000px] mx-auto px-4 flex justify-between items-center gap-4">
                            <div
                                className="font-bold text-xl text-white cursor-pointer hover:text-[#00C8FF] transition-colors"
                                onClick={() => setActiveSearch(null)}
                            >
                                NEXUS
                            </div>
                            <form onSubmit={handleSearch} className="relative flex-1 max-w-md">
                                <input
                                    type="text"
                                    value={searchInput}
                                    onChange={(e) => setSearchInput(e.target.value)}
                                    placeholder="소환사명 + #KR1"
                                    className="w-full bg-[#0D1B2A] border border-[#2C2C35] text-sm text-white px-4 py-2.5 rounded-lg focus:outline-none focus:border-[#00C8FF] transition-colors"
                                />
                                <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5A5A6B] hover:text-white">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                </button>
                            </form>
                        </div>
                    </div>

                    <div className="max-w-[1000px] mx-auto px-2 md:px-0 pt-8 animate-fade-in-up">
                        {/* 소환사 프로필 헤더 */}
                        <SummonerProfileHeader
                            user={user}
                            summonerProfile={summonerProfile}
                            gameName={activeSearch.gameName}
                            tagLine={activeSearch.tagLine}
                            onRefresh={() => refreshMutation.mutate()}
                            isRefreshing={refreshMutation.isPending}
                        />

                        <div className="flex flex-col lg:flex-row gap-4 mt-6">
                            {/* 좌측 사이드 (티어 정보 등) */}
                            <div className="hidden lg:block w-[300px]">
                                <div className="bg-[#1C1C1F] rounded-xl p-4 h-full border border-[#2C2C35]">
                                    <div className="text-[#9E9EB1] text-xs mb-3 flex items-center gap-1 font-medium">
                                        개인/2인 랭크 게임
                                        <svg className="w-3 h-3 text-[#9E9EB1]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    </div>

                                    {summonerProfile?.soloLeague ? (
                                        <div className="flex items-center gap-3 mb-6 p-2 bg-[#0D1B2A] rounded-lg border border-[#23232D]">
                                            <div className="relative w-14 h-14">
                                                <div className="w-14 h-14 rounded-full flex items-center justify-center overflow-hidden">
                                                    <img
                                                        src={
                                                            summonerProfile.soloLeague.tier === 'UNRANKED'
                                                                ? 'https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/images/ranked-emblem/emblem-iron.png' // 임시로 Unranked시 Iron 표시 또는 별도 아이콘
                                                                : `https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/images/ranked-emblem/emblem-${summonerProfile.soloLeague.tier.toLowerCase()}.png`
                                                        }
                                                        alt={summonerProfile.soloLeague.tier}
                                                        className={`w-full h-full object-cover transform scale-110 ${summonerProfile.soloLeague.tier === 'UNRANKED' ? 'opacity-50 grayscale' : ''}`}
                                                        onError={(e) => {
                                                            (e.target as HTMLImageElement).style.display = 'none';
                                                        }}
                                                    />
                                                </div>
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="text-white font-bold text-base leading-tight">
                                                    {summonerProfile.soloLeague.tier} {summonerProfile.soloLeague.rank}
                                                </div>
                                                <div className="text-[#9E9EB1] text-xs mt-0.5">
                                                    {summonerProfile.soloLeague.leaguePoints} LP
                                                </div>
                                            </div>

                                            <div className="text-right">
                                                <div className="text-[#9E9EB1] text-xs mb-0.5">
                                                    {summonerProfile.soloLeague.wins}승 {summonerProfile.soloLeague.losses}패
                                                </div>
                                                <div className="text-[#00C8FF] font-bold text-xs">
                                                    {summonerProfile.soloLeague.winRate}%
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-3 mb-6 text-[#9E9EB1] p-2 bg-[#0D1B2A] rounded-lg">
                                            <div className="w-14 h-14 bg-[#23232D] rounded-full flex items-center justify-center">
                                                <span className="text-xs">Unranked</span>
                                            </div>
                                            <div className="text-sm">Unranked</div>
                                        </div>
                                    )}

                                    <div className="text-[#9E9EB1] text-xs mb-3 flex items-center gap-1 font-medium pt-2 border-t border-[#2C2C35]">
                                        자유 랭크
                                    </div>
                                    {summonerProfile?.flexLeague ? (
                                        <div className="flex items-center gap-3 p-2 hover:bg-[#23232D] rounded transition-colors">
                                            <div className="relative w-10 h-10">
                                                <img
                                                    src={
                                                        summonerProfile.flexLeague.tier === 'UNRANKED'
                                                            ? 'https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/images/ranked-emblem/emblem-iron.png'
                                                            : `https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/images/ranked-emblem/emblem-${summonerProfile.flexLeague.tier.toLowerCase()}.png`
                                                    }
                                                    alt={summonerProfile.flexLeague.tier}
                                                    className={`w-full h-full object-cover transform scale-125 ${summonerProfile.flexLeague.tier === 'UNRANKED' ? 'opacity-50 grayscale' : ''}`}
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).style.display = 'none';
                                                    }}
                                                />
                                            </div>

                                            <div className="flex-1">
                                                <div className="text-[#9E9EB1] font-bold text-sm leading-tight">
                                                    {summonerProfile.flexLeague.tier} {summonerProfile.flexLeague.rank}
                                                </div>
                                                <div className="text-[#5A5A6B] text-[10px]">
                                                    {summonerProfile.flexLeague.leaguePoints} LP
                                                </div>
                                            </div>

                                            <div className="text-right">
                                                <div className="text-[#5A5A6B] text-[10px]">
                                                    {summonerProfile.flexLeague.winRate}%
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-3 text-[#5A5A6B] p-2">
                                            <div className="w-10 h-10 bg-[#23232D] rounded-full flex items-center justify-center">
                                                <span className="text-[10px]">Un</span>
                                            </div>
                                            <div className="text-xs">Unranked</div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* 메인 컨텐츠 */}
                            <div className="flex-1 min-w-0">
                                {/* 2. 전적 요약 (20게임) */}
                                <MatchStatsSummary matches={allMatches} />

                                {/* 3. 매치 리스트 */}
                                <div className="space-y-4">
                                    {allMatches.map((match) => (
                                        <MatchCard key={match.id} match={match} />
                                    ))}
                                </div>

                                {/* 로딩/에러/더보기 */}
                                {isLoading && (
                                    <div className="space-y-4 mt-4">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="h-28 bg-[#1C1C1F] rounded-lg animate-pulse border border-[#2C2C35]"></div>
                                        ))}
                                    </div>
                                )}

                                {isError && (
                                    <div className="p-8 text-center bg-[#1C1C1F] rounded-lg text-[#E84057] border border-[#E84057]/20 mt-4">
                                        전적을 불러올 수 없습니다. 재시도해주세요.
                                    </div>
                                )}

                                {hasNextPage && (
                                    <button
                                        onClick={() => fetchNextPage()}
                                        className="w-full py-4 bg-[#1C1C1F] hover:bg-[#2C2C35] text-[#9E9EB1] font-bold rounded-lg mt-4 border border-[#2C2C35] transition-colors"
                                    >
                                        더 보기
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default MatchesPage;
