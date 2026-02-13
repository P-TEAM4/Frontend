// src/pages/MyHighlightsPage.tsx
import React, { useState } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPlayerHighlights } from '../api/highlights';
import { linkRiot, unlinkRiot } from '../api/users';
import { useUser, useAuthStore } from '../store/authStore';
import type { HighlightResponse, HighlightType } from '../types/api';
import HighlightCard from '../components/highlights/HighlightCard';
import HighlightModal from '../components/highlights/HighlightModal';
import Button from '../components/common/Button';

const filterOptions: { value: HighlightType | 'ALL'; label: string; icon: string }[] = [
    { value: 'ALL', label: '전체', icon: '🎮' },
    { value: 'PENTAKILL', label: '펜타킬', icon: '⭐' },
    { value: 'BARON', label: '바론', icon: '👾' },
    { value: 'DRAGON', label: '드래곤', icon: '🐉' },
    { value: 'TOWER', label: '타워', icon: '🗼' },
    { value: 'OTHER', label: '기타', icon: '📹' },
];

const MyHighlightsPage: React.FC = () => {
    const user = useUser();
    const setUser = useAuthStore((state) => state.setUser);
    const queryClient = useQueryClient();
    const [activeFilter, setActiveFilter] = useState<HighlightType | 'ALL'>('ALL');
    const [selectedHighlight, setSelectedHighlight] = useState<HighlightResponse | null>(null);

    // Riot 계정 연동 폼
    const [showLinkForm, setShowLinkForm] = useState(false);
    const [summonerName, setSummonerName] = useState('');
    const [tagLine, setTagLine] = useState('KR1');
    const [linkError, setLinkError] = useState<string | null>(null);
    
    // Riot 계정 연동 해제
    const [showUnlinkConfirm, setShowUnlinkConfirm] = useState(false);

    const puuid = user?.puuid || '';

    // Riot 계정 연동 뮤테이션
    const linkRiotMutation = useMutation({
        mutationFn: () => linkRiot({ summonerName, tagLine }),
        onSuccess: (updatedUser) => {
            setUser(updatedUser);
            setShowLinkForm(false);
            setSummonerName('');
            setTagLine('KR1');
            setLinkError(null);
            queryClient.invalidateQueries({ queryKey: ['playerHighlights'] });
        },
        onError: (error: Error) => {
            setLinkError(error.message || 'Riot 계정 연동에 실패했습니다.');
        },
    });

    // Riot 계정 연동 해제 뮤테이션
    const unlinkRiotMutation = useMutation({
        mutationFn: unlinkRiot,
        onSuccess: (updatedUser) => {
            setUser(updatedUser);
            setShowUnlinkConfirm(false);
            queryClient.invalidateQueries({ queryKey: ['playerHighlights'] });
        },
    });

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

    // 모든 페이지의 하이라이트 합치기
    const allHighlights = data?.pages.flatMap((page) => page.content) || [];
    const totalCount = data?.pages[0]?.totalElements || 0;

    // Riot 계정 미연동 시 연동 안내
    if (!puuid) {
        return (
            <div className="max-w-2xl mx-auto text-center py-16">
                <div className="bg-[#0D1B2A] rounded-xl border border-[#1E3A5F] p-8">
                    <svg className="w-20 h-20 mx-auto mb-6 text-[#C8AA6E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    <h2 className="text-2xl font-bold text-[#F0F0F0] mb-4">
                        Riot 계정 연동이 필요합니다
                    </h2>
                    <p className="text-[#8B8B8B] mb-6">
                        하이라이트를 보려면 먼저 Riot 계정을 연동해주세요.
                    </p>

                    {!showLinkForm ? (
                        <Button
                            variant="primary"
                            size="lg"
                            onClick={() => setShowLinkForm(true)}
                        >
                            Riot 계정 연동하기
                        </Button>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="소환사 이름"
                                    value={summonerName}
                                    onChange={(e) => setSummonerName(e.target.value)}
                                    className="flex-1 px-4 py-3 bg-[#112240] border border-[#1E3A5F] rounded-lg text-[#F0F0F0] placeholder-[#5B5B5B] focus:outline-none focus:border-[#00C8FF]"
                                />
                                <span className="flex items-center text-[#5B5B5B] text-xl">#</span>
                                <input
                                    type="text"
                                    placeholder="태그"
                                    value={tagLine}
                                    onChange={(e) => setTagLine(e.target.value)}
                                    onFocus={(e) => {
                                        if (e.target.value === 'KR1') {
                                            setTagLine('');
                                        }
                                    }}
                                    className="w-24 px-4 py-3 bg-[#112240] border border-[#1E3A5F] rounded-lg text-[#F0F0F0] placeholder-[#5B5B5B] focus:outline-none focus:border-[#00C8FF]"
                                />
                            </div>
                            {linkError && (
                                <p className="text-sm text-[#E84057]">{linkError}</p>
                            )}
                            <div className="flex gap-2 justify-center">
                                <Button
                                    variant="ghost"
                                    onClick={() => {
                                        setShowLinkForm(false);
                                        setLinkError(null);
                                    }}
                                >
                                    취소
                                </Button>
                                <Button
                                    variant="primary"
                                    onClick={() => linkRiotMutation.mutate()}
                                    isLoading={linkRiotMutation.isPending}
                                    disabled={!summonerName || !tagLine}
                                >
                                    연동하기
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div>
            {/* 헤더 */}
            <div className="mb-8 flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold text-[#F0F0F0] mb-2">
                        내 하이라이트
                    </h1>
                    <p className="text-[#8B8B8B]">
                        나의 멋진 플레이 순간들을 확인하세요
                    </p>
                </div>
                {user?.summonerName && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowUnlinkConfirm(true)}
                        className="!text-[#E84057] hover:!text-[#FF5570]"
                    >
                        Riot 계정 연동 해제
                    </Button>
                )}
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

            {/* 로딩 상태 */}
            {isLoading && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="aspect-video bg-[#0D1B2A] rounded-lg animate-pulse" />
                    ))}
                </div>
            )}

            {/* 에러 상태 */}
            {isError && (
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

            {/* 결과 없음 */}
            {!isLoading && !isError && allHighlights.length === 0 && (
                <div className="text-center py-16 bg-[#0D1B2A] rounded-xl border border-[#1E3A5F]">
                    <svg className="w-20 h-20 mx-auto mb-6 text-[#1E3A5F]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <h3 className="text-xl font-semibold text-[#F0F0F0] mb-2">
                        아직 하이라이트가 없습니다
                    </h3>
                    <p className="text-[#8B8B8B] mb-6">
                        경기를 플레이하고 멋진 순간을 기록해보세요!
                    </p>
                </div>
            )}

            {/* 하이라이트 그리드 */}
            {!isLoading && allHighlights.length > 0 && (
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

                    {/* 더 보기 버튼 */}
                    {hasNextPage && (
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

            {/* Riot 계정 연동 해제 확인 모달 */}
            {showUnlinkConfirm && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-[#0D1B2A] rounded-xl border border-[#1E3A5F] p-6 max-w-md w-full">
                        <h3 className="text-xl font-bold text-[#F0F0F0] mb-4">
                            Riot 계정 연동 해제
                        </h3>
                        <p className="text-[#8B8B8B] mb-6">
                            정말 Riot 계정 연동을 해제하시겠습니까?<br />
                            연동을 해제하면 하이라이트 및 전적을 볼 수 없습니다.
                        </p>
                        <div className="flex gap-3 justify-end">
                            <Button
                                variant="ghost"
                                onClick={() => setShowUnlinkConfirm(false)}
                            >
                                취소
                            </Button>
                            <Button
                                variant="primary"
                                onClick={() => unlinkRiotMutation.mutate()}
                                isLoading={unlinkRiotMutation.isPending}
                                className="!bg-[#E84057] hover:!bg-[#FF5570]"
                            >
                                연동 해제
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyHighlightsPage;
