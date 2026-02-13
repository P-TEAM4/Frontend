// src/pages/MatchesPage.tsx
import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
    const [searchParams] = useSearchParams();

    const [activeSearch, setActiveSearch] = useState<{ gameName: string; tagLine: string } | null>(null);

    const [searchInput, setSearchInput] = useState('');
    const [previousMatchCount, setPreviousMatchCount] = useState(0);
    const [allMatchesLoaded, setAllMatchesLoaded] = useState(false);

    // URL params에서 자동 검색 실행
    useEffect(() => {
        const gameName = searchParams.get('gameName');
        const tagLine = searchParams.get('tagLine');
        
        if (gameName && tagLine && !activeSearch) {
            setActiveSearch({ gameName, tagLine });
            setSearchInput(`${gameName}#${tagLine}`);
        }
    }, [searchParams, activeSearch]);

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
            lastPage.matches.last ? undefined : lastPage.matches.number + 1,
        enabled: !!activeSearch,
    });

    // 첫 페이지에서 프로필 정보 추출
    const summonerProfile = data?.pages[0]?.profile;

    const refreshMutation = useMutation({
        mutationFn: () => refreshMatches(activeSearch!.gameName, activeSearch!.tagLine),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['matches', activeSearch?.gameName, activeSearch?.tagLine]
            });
        },
    });

    // 추가 전적 가져오기 (Riot API 호출)
    const loadMoreMutation = useMutation({
        mutationFn: () => {
            // 현재 전적 개수 저장
            setPreviousMatchCount(allMatches.length);
            return refreshMatches(activeSearch!.gameName, activeSearch!.tagLine);
        },
        onSuccess: async () => {
            // 쿼리 무효화하여 재조회
            await queryClient.invalidateQueries({
                queryKey: ['matches', activeSearch?.gameName, activeSearch?.tagLine]
            });
            
            // 잠시 후 전적 개수 확인
            setTimeout(() => {
                const currentData = queryClient.getQueryData(['matches', activeSearch?.gameName, activeSearch?.tagLine]) as any;
                const newMatchCount = currentData?.pages.flatMap((p: any) => p.matches.content).length || 0;
                
                // 전적 개수가 그대로면 더 이상 없음
                if (newMatchCount === previousMatchCount) {
                    setAllMatchesLoaded(true);
                }
            }, 500);
        },
    });

    const handleSearch = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        const input = searchInput.trim();
        if (!input) return;

        // 새로운 검색 시 상태 리셋
        setPreviousMatchCount(0);
        setAllMatchesLoaded(false);

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

    // =========================================
    //  검색 전: 랜딩 페이지
    // =========================================
    if (!activeSearch) {
        return (
            <div className="bg-[#1C1C1F] min-h-screen flex flex-col items-center">
                {/* 히어로 배경 */}
                <div className="w-full relative min-h-screen">
                    {/* 배경 이미지 + 오버레이 */}
                    <div className="absolute inset-0 overflow-hidden">
                        <img
                            src={heroBg}
                            alt=""
                            className="w-full h-full object-cover object-center opacity-40"
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
                        <form onSubmit={handleSearch} className="w-full max-w-3xl animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                            <div className="bg-[#31313C] rounded-lg flex items-center overflow-hidden border border-[#424254] focus-within:border-[#0AC8B9] transition-colors shadow-lg">
                                {/* 지역 선택 */}
                                <div className="px-5 py-4 text-[#9E9EB1] font-semibold text-sm border-r border-[#424254] select-none shrink-0">
                                    KR
                                </div>
                                <input
                                    type="text"
                                    value={searchInput}
                                    onChange={(e) => setSearchInput(e.target.value)}
                                    placeholder="소환사명#태그"
                                    className="flex-1 bg-transparent text-white px-5 py-4 focus:outline-none placeholder-[#515163] text-base"
                                />
                                <button
                                    type="submit"
                                    className="px-6 py-4 bg-[#0AC8B9] hover:bg-[#08A8A0] text-white transition-colors shrink-0"
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
                <div className="max-w-[1080px] mx-auto px-4 py-3">
                    <form onSubmit={handleSearch} className="max-w-3xl mx-auto">
                        <div className="bg-[#31313C] rounded-lg flex items-center overflow-hidden border border-[#424254] focus-within:border-[#0AC8B9] transition-colors">
                            <input
                                type="text"
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                placeholder="소환사명#태그"
                                className="flex-1 bg-transparent text-white text-base px-5 py-3 focus:outline-none placeholder-[#515163]"
                            />
                            <button type="submit" className="px-5 py-3 text-[#9E9EB1] hover:text-white transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                    user={user}
                    summonerProfile={summonerProfile || undefined}
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

                            {summonerProfile?.soloLeague ? (
                                <div className="flex items-center gap-4">
                                    <div className="w-[72px] h-[72px] shrink-0">
                                        <img
                                            src={getRankEmblemUrl(summonerProfile.soloLeague.tier)}
                                            alt={summonerProfile.soloLeague.tier}
                                            className="w-full h-full object-contain"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).style.display = 'none';
                                            }}
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-white font-bold text-lg leading-tight">
                                            {summonerProfile.soloLeague.tier} {summonerProfile.soloLeague.rank}
                                        </div>
                                        <div className="text-[#9E9EB1] text-xs mt-0.5">
                                            {summonerProfile.soloLeague.leaguePoints} LP
                                        </div>
                                        <div className="flex items-center gap-3 mt-2 text-xs">
                                            <span className="text-[#9E9EB1]">
                                                {summonerProfile.soloLeague.wins ?? 0}승 {summonerProfile.soloLeague.losses ?? 0}패
                                            </span>
                                            <span className="text-[#0AC8B9] font-bold">
                                                승률 {parseFloat(summonerProfile.soloLeague.winRate)}%
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

                        {/* 최근 20경기 통계 카드 */}
                        {summonerProfile?.recentStats && (
                            <div className="bg-[#31313C] rounded-lg p-4">
                                <div className="text-[11px] text-[#515163] font-semibold uppercase tracking-wider mb-3">
                                    최근 {summonerProfile.recentStats.totalGames}게임
                                </div>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-[#9E9EB1]">승률</span>
                                        <span className="text-sm font-bold text-[#0AC8B9]">
                                            {summonerProfile.recentStats.winRate}%
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-[#9E9EB1]">전적</span>
                                        <span className="text-sm font-bold text-white">
                                            {summonerProfile.recentStats.wins}승 {summonerProfile.recentStats.losses}패
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-[#9E9EB1]">평균 KDA</span>
                                        <span className="text-sm font-bold text-[#F19B00]">
                                            {summonerProfile.recentStats.averageKda.toFixed(2)}:1
                                        </span>
                                    </div>
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
                        {!isLoading && allMatches.length > 0 && (
                            <div className="mt-6 flex flex-col items-center gap-2">
                                {hasNextPage ? (
                                    // DB에 다음 페이지가 있으면 일반 페이지네이션
                                    <button
                                        onClick={() => fetchNextPage()}
                                        disabled={isFetchingNextPage}
                                        className="px-8 py-3 bg-[#31313C] hover:bg-[#424254] text-white font-bold text-sm rounded-lg border border-[#424254] hover:border-[#0AC8B9] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                                    >
                                        {isFetchingNextPage ? (
                                            <span className="flex items-center gap-2">
                                                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                불러오는 중...
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-2">
                                                더 보기
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </span>
                                        )}
                                    </button>
                                ) : allMatchesLoaded ? (
                                    // 모든 전적을 불러온 상태
                                    <div className="px-8 py-3 text-[#9E9EB1] font-bold text-sm">
                                        <span className="flex items-center gap-2">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            모든 전적을 불러왔습니다
                                        </span>
                                    </div>
                                ) : (
                                    // DB에 다음 페이지가 없으면 Riot API에서 추가로 가져오기 시도
                                    <button
                                        onClick={() => loadMoreMutation.mutate()}
                                        disabled={loadMoreMutation.isPending}
                                        className="px-8 py-3 bg-[#31313C] hover:bg-[#424254] text-white font-bold text-sm rounded-lg border border-[#424254] hover:border-[#0AC8B9] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                                    >
                                        {loadMoreMutation.isPending ? (
                                            <span className="flex items-center gap-2">
                                                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Riot API에서 불러오는 중...
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-2">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                </svg>
                                                추가 전적 불러오기
                                            </span>
                                        )}
                                    </button>
                                )}
                                {/* 디버그 정보 */}
                                <div className="text-xs text-[#515163]">
                                    표시된 전적: {allMatches.length}개 | 전체: {data?.pages[0]?.matches.totalElements || 0}개 | 페이지: {data?.pages.length || 0}
                                </div>
                            </div>
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
