// src/pages/MatchesPage.tsx
import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { getMatches, refreshMatches } from '../api/matches';
import { getCurrentUser } from '../api/users';
import { useAuthStore } from '../store/authStore';
import MatchCard from '../components/matches/MatchCard';
import SummonerProfileHeader from '../components/matches/SummonerProfileHeader';
import MatchStatsSummary from '../components/matches/MatchStatsSummary';
import { getRankEmblemUrl, getProfileIconUrl } from '../types/api';
import heroBg from '../assets/ahri_bg.png';

const MatchesPage: React.FC = () => {
    const navigate = useNavigate();
    const { isAuthenticated, user } = useAuthStore();
    const queryClient = useQueryClient();

    const [activeSearch, setActiveSearch] = useState<{ gameName: string; tagLine: string } | null>(null);

    const [searchInput, setSearchInput] = useState('');

    const { data: currentUserData } = useQuery({
        queryKey: ['currentUser'],
        queryFn: getCurrentUser,
        enabled: isAuthenticated,
    });

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        isError,
    } = useInfiniteQuery({
        queryKey: ['matches', activeSearch?.gameName, activeSearch?.tagLine],
        queryFn: ({ pageParam = 0 }) =>
            getMatches({
                gameName: activeSearch!.gameName,
                tagLine: activeSearch!.tagLine,
                page: pageParam,
                size: 20,
            }),
        initialPageParam: 0,
        getNextPageParam: (lastPage) =>
            lastPage.last ? undefined : lastPage.number + 1,
        enabled: !!activeSearch,
    });

    const refreshMutation = useMutation({
        mutationFn: () => refreshMatches(activeSearch!.gameName, activeSearch!.tagLine),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['matches', activeSearch?.gameName, activeSearch?.tagLine]
            });
        },
    });

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

    const allMatches = data?.pages.flatMap((page) => page.content) || [];

    const summonerProfile = currentUserData && activeSearch &&
        currentUserData.summonerName?.toLowerCase() === activeSearch.gameName.toLowerCase() &&
        currentUserData.tagLine?.toLowerCase() === activeSearch.tagLine.toLowerCase()
        ? currentUserData
        : null;

    // =========================================
    //  검색 전: 랜딩 페이지
    // =========================================
    if (!activeSearch) {
        return (
            <div className="bg-[#1C1C1F] min-h-screen flex flex-col items-center">
                {/* 히어로 배경 */}
                <div className="w-full relative">
                    {/* 배경 이미지 + 오버레이 */}
                    <div className="absolute inset-0 overflow-hidden">
                        <img
                            src={heroBg}
                            alt=""
                            className="w-full h-full object-cover object-top opacity-40"
                        />
                        {/* 다중 그라데이션 오버레이 */}
                        <div className="absolute inset-0 bg-gradient-to-b from-[#1C1C1F]/60 via-transparent to-[#1C1C1F]" />
                        <div className="absolute inset-0 bg-gradient-to-r from-[#1C1C1F]/80 via-transparent to-[#1C1C1F]/80" />
                        {/* 틸 + 레드 글로우 */}
                        <div className="absolute top-20 left-1/4 w-[500px] h-[500px] bg-[#0AC8B9]/[0.04] rounded-full blur-[120px]" />
                        <div className="absolute top-40 right-1/4 w-[400px] h-[400px] bg-[#E84057]/[0.03] rounded-full blur-[100px]" />
                    </div>

                    <div className="relative z-10 pt-32 pb-20 flex flex-col items-center px-4">
                        {/* 로고 */}
                        <div className="mb-10 text-center animate-fade-in-up">
                            <h1 className="text-5xl md:text-6xl font-black text-white mb-3 tracking-tight">
                                NEXUS<span className="text-[#0AC8B9]">.GG</span>
                            </h1>
                            <p className="text-[#9E9EB1] text-base">
                                전적 검색 · AI 분석 · 하이라이트 자동 생성
                            </p>
                        </div>

                        {/* 검색바 */}
                        <form onSubmit={handleSearch} className="w-full max-w-[560px] animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                            <div className="bg-[#31313C] rounded-lg flex items-center overflow-hidden border border-[#424254] focus-within:border-[#0AC8B9] transition-colors shadow-lg">
                                {/* 지역 선택 */}
                                <div className="px-4 py-3 text-[#9E9EB1] font-semibold text-sm border-r border-[#424254] select-none shrink-0">
                                    KR
                                </div>
                                <input
                                    type="text"
                                    value={searchInput}
                                    onChange={(e) => setSearchInput(e.target.value)}
                                    placeholder="소환사명#태그"
                                    className="flex-1 bg-transparent text-white px-4 py-3.5 focus:outline-none placeholder-[#515163] text-sm"
                                />
                                <button
                                    type="submit"
                                    className="px-5 py-3.5 bg-[#0AC8B9] hover:bg-[#08A8A0] text-white transition-colors shrink-0"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </button>
                            </div>
                        </form>

                        {/* 추천 검색어 */}
                        <div className="mt-4 flex gap-2 text-xs text-[#515163] animate-fade-in" style={{ animationDelay: '0.3s' }}>
                            <span>추천:</span>
                            {['Hide on bush#KR1', 'Faker#KR1'].map(name => (
                                <button
                                    key={name}
                                    onClick={() => { setSearchInput(name); }}
                                    className="text-[#9E9EB1] hover:text-[#0AC8B9] transition-colors"
                                >
                                    {name}
                                </button>
                            ))}
                        </div>

                        {/* 연동된 계정으로 빠른 검색 */}
                        {user?.summonerName && (
                            <button
                                onClick={() => setActiveSearch({ gameName: user.summonerName!, tagLine: user.tagLine || 'KR1' })}
                                className="mt-8 flex items-center gap-3 bg-[#31313C] hover:bg-[#424254] border border-[#424254] rounded-lg px-5 py-3 transition-colors animate-fade-in-up"
                                style={{ animationDelay: '0.2s' }}
                            >
                                <img
                                    src={user.profileIconId ? getProfileIconUrl(user.profileIconId) : 'https://ddragon.leagueoflegends.com/cdn/14.23.1/img/profileicon/29.png'}
                                    alt="프로필"
                                    className="w-8 h-8 rounded-full ring-2 ring-[#0AC8B9]/50"
                                />
                                <div className="text-left">
                                    <div className="text-sm font-semibold text-white">
                                        {user.summonerName}
                                        <span className="text-[#9E9EB1] font-normal">#{user.tagLine}</span>
                                    </div>
                                    <div className="text-[11px] text-[#515163]">내 전적 바로 보기</div>
                                </div>
                                <svg className="w-4 h-4 text-[#515163] ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // =========================================
    //  검색 후: 결과 페이지
    // =========================================
    return (
        <div className="bg-[#1C1C1F] min-h-screen pb-20">
            {/* 상단 검색바 (고정) */}
            <div className="bg-[#1C1C1F] border-b border-[#2C2C35] sticky top-0 z-50">
                <div className="max-w-[1080px] mx-auto px-4 py-2.5 flex items-center gap-4">
                    <button
                        onClick={() => setActiveSearch(null)}
                        className="text-lg font-black text-white hover:text-[#0AC8B9] transition-colors shrink-0"
                    >
                        NEXUS<span className="text-[#0AC8B9]">.GG</span>
                    </button>
                    <form onSubmit={handleSearch} className="flex-1 max-w-lg">
                        <div className="bg-[#31313C] rounded flex items-center overflow-hidden border border-[#424254] focus-within:border-[#0AC8B9] transition-colors">
                            <input
                                type="text"
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                placeholder="소환사명#태그"
                                className="flex-1 bg-transparent text-white text-xs px-3 py-2 focus:outline-none placeholder-[#515163]"
                            />
                            <button type="submit" className="px-3 py-2 text-[#9E9EB1] hover:text-white">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* 메인 콘텐츠 */}
            <div className="max-w-[1080px] mx-auto px-4">
                {/* 소환사 프로필 헤더 */}
                <SummonerProfileHeader
                    user={summonerProfile || user}
                    gameName={activeSearch.gameName}
                    tagLine={activeSearch.tagLine}
                    onRefresh={() => refreshMutation.mutate()}
                    isRefreshing={refreshMutation.isPending}
                />

                <div className="flex flex-col lg:flex-row gap-2 mt-2">
                    {/* 좌측 사이드바 */}
                    <div className="lg:w-[332px] shrink-0 space-y-2">
                        {/* 랭크 정보 카드 */}
                        <div className="bg-[#31313C] rounded-lg p-4">
                            <div className="text-[11px] text-[#515163] font-semibold uppercase tracking-wider mb-3">
                                솔로랭크
                            </div>

                            {summonerProfile?.tier ? (
                                <div className="flex items-center gap-4">
                                    <div className="w-[72px] h-[72px] shrink-0">
                                        <img
                                            src={getRankEmblemUrl(summonerProfile.tier)}
                                            alt={summonerProfile.tier}
                                            className="w-full h-full object-contain"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).style.display = 'none';
                                            }}
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-white font-bold text-lg leading-tight">
                                            {summonerProfile.tier} {summonerProfile.rank}
                                        </div>
                                        <div className="text-[#9E9EB1] text-xs mt-0.5">
                                            {summonerProfile.leaguePoints} LP
                                        </div>
                                        <div className="flex items-center gap-3 mt-2 text-xs">
                                            <span className="text-[#9E9EB1]">
                                                {summonerProfile.wins ?? 0}승 {summonerProfile.losses ?? 0}패
                                            </span>
                                            <span className="text-[#0AC8B9] font-bold">
                                                승률 {summonerProfile.winRate?.toFixed(0) ?? 0}%
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center gap-3 text-[#9E9EB1]">
                                    <div className="w-[72px] h-[72px] bg-[#282830] rounded-lg flex items-center justify-center">
                                        <span className="text-xs font-medium">Unranked</span>
                                    </div>
                                    <div className="text-sm font-medium">Unranked</div>
                                </div>
                            )}
                        </div>

                        {/* 평균 통계 카드 */}
                        {summonerProfile && (
                            <div className="bg-[#31313C] rounded-lg p-4">
                                <div className="text-[11px] text-[#515163] font-semibold uppercase tracking-wider mb-3">
                                    시즌 평균 지표
                                </div>
                                <div className="space-y-3">
                                    {[
                                        { label: '평균 KDA', value: summonerProfile.averageKda?.toFixed(2), suffix: ':1', color: '#0AC8B9' },
                                        { label: '분당 CS', value: summonerProfile.averageCsPerMin?.toFixed(1), suffix: '', color: '#00BBA3' },
                                        { label: '시야 점수', value: summonerProfile.averageVisionScore?.toFixed(1), suffix: '', color: '#F19B00' },
                                    ].filter(s => s.value != null).map(stat => (
                                        <div key={stat.label} className="flex items-center justify-between">
                                            <span className="text-xs text-[#9E9EB1]">{stat.label}</span>
                                            <span className="text-sm font-bold" style={{ color: stat.color }}>
                                                {stat.value}{stat.suffix}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 메인: 전적 목록 */}
                    <div className="flex-1 min-w-0">
                        {/* 전적 요약 (20게임) */}
                        <MatchStatsSummary matches={allMatches} />

                        {/* 매치 리스트 */}
                        <div className="mt-2 space-y-[2px]">
                            {allMatches.map((match) => (
                                <MatchCard key={match.id} match={match} />
                            ))}
                        </div>

                        {/* 로딩 스켈레톤 */}
                        {isLoading && (
                            <div className="space-y-[2px] mt-2">
                                {[1, 2, 3, 4, 5].map(i => (
                                    <div key={i} className="h-[76px] bg-[#31313C] rounded-[4px] animate-pulse" />
                                ))}
                            </div>
                        )}

                        {/* 에러 */}
                        {isError && (
                            <div className="p-6 text-center bg-[#31313C] rounded-lg text-[#E84057] border border-[#E84057]/20 mt-4 text-sm">
                                <div className="mb-2">전적을 불러올 수 없습니다.</div>
                                <button
                                    onClick={() => queryClient.invalidateQueries({ queryKey: ['matches'] })}
                                    className="text-xs text-[#9E9EB1] hover:text-white transition-colors underline"
                                >
                                    재시도
                                </button>
                            </div>
                        )}

                        {/* 더보기 */}
                        {hasNextPage && (
                            <button
                                onClick={() => fetchNextPage()}
                                disabled={isFetchingNextPage}
                                className="w-full py-3 bg-[#31313C] hover:bg-[#424254] text-[#9E9EB1] font-semibold text-sm rounded-[4px] mt-2 transition-colors disabled:opacity-60"
                            >
                                {isFetchingNextPage ? '불러오는 중...' : '더 보기'}
                            </button>
                        )}

                        {/* 결과 없음 */}
                        {!isLoading && allMatches.length === 0 && !isError && (
                            <div className="text-center py-20 text-[#515163]">
                                <svg className="w-16 h-16 mx-auto mb-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <div className="text-sm">매치 기록이 없습니다.</div>
                                <div className="text-xs mt-1">전적 갱신 버튼을 눌러보세요.</div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MatchesPage;
