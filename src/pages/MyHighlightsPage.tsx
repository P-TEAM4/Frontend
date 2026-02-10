// src/pages/MyHighlightsPage.tsx
import React, { useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { getPlayerHighlights } from '../api/highlights';
import { useUser } from '../store/authStore';
import type { HighlightResponse, HighlightType } from '../types/api';
import HighlightCard from '../components/highlights/HighlightCard';
import HighlightModal from '../components/highlights/HighlightModal';
import Button from '../components/common/Button';

const filterOptions: { value: HighlightType | 'ALL'; label: string; icon: string }[] = [
    { value: 'ALL', label: '전체', icon: '🎮' },
    { value: 'KILL', label: '킬', icon: '⚔️' },
    { value: 'MULTI_KILL', label: '멀티킬', icon: '🔥' },
    { value: 'PENTAKILL', label: '펜타킬', icon: '⭐' },
    { value: 'BARON', label: '바론', icon: '👾' },
    { value: 'DRAGON', label: '드래곤', icon: '🐉' },
    { value: 'TOWER_DESTROY', label: '타워', icon: '🗼' },
    { value: 'TEAM_FIGHT', label: '팀파이트', icon: '💥' },
    { value: 'CUSTOM', label: '기타', icon: '📹' },
];

const MyHighlightsPage: React.FC = () => {
    const user = useUser();
    const [activeFilter, setActiveFilter] = useState<HighlightType | 'ALL'>('ALL');
    const [selectedHighlight, setSelectedHighlight] = useState<HighlightResponse | null>(null);

    const puuid = user?.riotId || '';

    // 하이라이트 조회 (무한 스크롤)
    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        isError,
    } = useInfiniteQuery({
        queryKey: ['playerHighlights', puuid, activeFilter],
        queryFn: ({ pageParam = 0 }) =>
            getPlayerHighlights(
                puuid,
                pageParam,
                12,
                activeFilter === 'ALL' ? undefined : activeFilter
            ),
        initialPageParam: 0,
        getNextPageParam: (lastPage) =>
            lastPage.last ? undefined : lastPage.number + 1,
        enabled: !!puuid,
    });

    // 더미 데이터 생성
    const dummyHighlights: HighlightResponse[] = [
        {
            id: 1,
            matchId: 'KR_101',
            title: "Triple Kill with Lee Sin",
            description: "Amazing insec kick into triple kill",
            videoUrl: "#",
            thumbnailUrl: "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/LeeSin_0.jpg",
            startTime: 0,
            endTime: 30,
            duration: 30,
            type: "CUSTOM",
            status: "COMPLETED",
            viewCount: 152,
            createdAt: new Date().toISOString(),
        },
        {
            id: 2,
            matchId: 'KR_102',
            title: "Baron Steal",
            description: "Precision smite to steal Baron Nashor",
            videoUrl: "#",
            thumbnailUrl: "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Vi_0.jpg",
            startTime: 0,
            endTime: 45,
            duration: 45,
            type: "BARON",
            status: "COMPLETED",
            viewCount: 89,
            createdAt: new Date(Date.now() - 86400000).toISOString(),
        },
        {
            id: 3,
            matchId: 'KR_103',
            title: "Pentakill on Jinx",
            description: "Late game teamfight cleanup",
            videoUrl: "#",
            thumbnailUrl: "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Jinx_0.jpg",
            startTime: 0,
            endTime: 60,
            duration: 60,
            type: "PENTAKILL",
            status: "COMPLETED",
            viewCount: 342,
            createdAt: new Date(Date.now() - 172800000).toISOString(),
        },
        {
            id: 4,
            matchId: 'KR_104',
            title: "Dragon Soul Secure",
            description: "Securing the Infernal Soul for the team",
            videoUrl: "#",
            thumbnailUrl: "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Shyvana_0.jpg",
            startTime: 0,
            endTime: 35,
            duration: 35,
            type: "DRAGON",
            status: "COMPLETED",
            viewCount: 120,
            createdAt: new Date(Date.now() - 259200000).toISOString(),
        },
        {
            id: 5,
            matchId: 'KR_105',
            title: "Tower Dive Survival",
            description: "Surviving a 3-man tower dive",
            videoUrl: "#",
            thumbnailUrl: "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Irelia_0.jpg",
            startTime: 0,
            endTime: 25,
            duration: 25,
            type: "TOWER_DESTROY",
            status: "COMPLETED",
            viewCount: 210,
            createdAt: new Date(Date.now() - 345600000).toISOString(),
        }
    ];

    // 실제 데이터 대신 더미 데이터 사용
    const allHighlights = dummyHighlights;
    const totalCount = dummyHighlights.length;

    // Riot 계정 미연동 체크 (더미 데이터 확인을 위해 주석 처리 또는 제거)
    /*
    if (!puuid) {
        return (
            <div className="max-w-2xl mx-auto text-center py-16">
                 ... (생략)
            </div>
        );
    }
    */

    return (
        <div>
            {/* 헤더 */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-[#F0F0F0] mb-2">
                    내 하이라이트
                </h1>
                <p className="text-[#8B8B8B]">
                    나의 멋진 플레이 순간들을 확인하세요
                </p>
            </div>

            {/* 필터 */}
            <div className="flex flex-wrap gap-2 mb-6">
                {filterOptions.map((option) => (
                    <button
                        key={option.value}
                        onClick={() => setActiveFilter(option.value)}
                        className={`
              px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
              ${activeFilter === option.value
                                ? 'bg-[#00C8FF] text-[#0A0A0A] shadow-[0_0_15px_rgba(0,200,255,0.4)]'
                                : 'bg-[#0D1B2A] text-[#8B8B8B] border border-[#1E3A5F] hover:border-[#00C8FF] hover:text-[#F0F0F0]'
                            }
            `}
                    >
                        <span className="mr-1">{option.icon}</span>
                        {option.label}
                    </button>
                ))}
            </div>

            {/* 통계 */}
            {totalCount > 0 && (
                <div className="mb-6 flex items-center gap-4">
                    <span className="text-sm text-[#8B8B8B]">
                        총 <span className="text-[#00C8FF] font-semibold">{totalCount}</span>개의 하이라이트
                    </span>
                </div>
            )}

            {/* 로딩 상태 (더미 데이터 사용 시 비활성화) */}
            {false && isLoading && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="aspect-video bg-[#0D1B2A] rounded-lg animate-pulse" />
                    ))}
                </div>
            )}

            {/* 에러 상태 (더미 데이터 사용 시 비활성화) */}
            {false && isError && (
                <div className="text-center py-12 bg-[#0D1B2A] rounded-xl border border-[#E84057]/30">
                    <svg className="w-16 h-16 mx-auto mb-4 text-[#E84057]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <h3 className="text-lg font-semibold text-[#E84057] mb-2">
                        하이라이트를 불러올 수 없습니다
                    </h3>
                    <p className="text-sm text-[#8B8B8B]">
                        잠시 후 다시 시도해주세요.
                    </p>
                </div>
            )}

            {/* 결과 없음 (더미 데이터가 있으므로 표시 안 함) */}
            {allHighlights.length === 0 && (
                <div className="text-center py-16 bg-[#0D1B2A] rounded-xl border border-[#1E3A5F]">
                    {/* ... (생략) */}
                </div>
            )}

            {/* 하이라이트 그리드 */}
            {allHighlights.length > 0 && (
                <>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {allHighlights.map((highlight) => (
                            <HighlightCard
                                key={highlight.id}
                                highlight={highlight}
                                onClick={() => setSelectedHighlight(highlight)}
                            />
                        ))}
                    </div>

                    {/* 더 보기 버튼 (더미 데이터에서는 숨김) */}
                    {false && hasNextPage && (
                        <div className="mt-8 text-center">
                            <Button
                                variant="ghost"
                                size="lg"
                                onClick={() => fetchNextPage()}
                                isLoading={isFetchingNextPage}
                            >
                                더 보기
                            </Button>
                        </div>
                    )}
                </>
            )}

            {/* 하이라이트 모달 */}
            {selectedHighlight && (
                <HighlightModal
                    highlight={selectedHighlight}
                    onClose={() => setSelectedHighlight(null)}
                />
            )}
        </div>
    );
};

export default MyHighlightsPage;
