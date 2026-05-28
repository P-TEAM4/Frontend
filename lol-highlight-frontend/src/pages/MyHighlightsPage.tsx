// src/pages/MyHighlightsPage.tsx
import React, { useState, useRef } from 'react';
import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPlayerHighlights } from '../api/highlights';
import { getMatchAnalysis } from '../api/analyses';
import { linkRiot, unlinkRiot } from '../api/users';
import { useUser, useAuthStore } from '../store/authStore';
import type { HighlightResponse, HighlightType, AnalysisResponse } from '../types/api';
import { formatRelativeTime } from '../types/api';
import Button from '../components/common/Button';

const AI_BASE_URL = 'http://localhost:8000';

function resolveVideoUrl(url: string | null): string | null {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${AI_BASE_URL}/${url}`;
}

interface MatchGroup {
    matchId: string;
    highlights: HighlightResponse[];
    createdAt: string;
    highlightCount: number;
    mistakeCount: number;
}

// ── 클립 모달 ────────────────────────────────────────────────────────────────
const ClipModal: React.FC<{ clip: HighlightResponse; onClose: () => void }> = ({ clip, onClose }) => {
    const videoUrl = resolveVideoUrl(clip.videoUrl);
    const isMistake = clip.title.startsWith('[실수]');

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="relative w-full max-w-2xl mx-4 bg-[#0D1B2A] rounded-xl border border-[#1E3A5F] shadow-[0_0_50px_rgba(0,200,255,0.2)]"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between p-4 border-b border-[#1E3A5F]">
                    <div>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded mr-2 ${isMistake ? 'bg-[#E84057]/20 text-[#E84057]' : 'bg-[#00C8FF]/20 text-[#00C8FF]'}`}>
                            {isMistake ? '실수' : '하이라이트'}
                        </span>
                        <span className="text-base font-bold text-[#F0F0F0]">
                            {clip.title.replace(/^\[(하이라이트|실수)\]\s*/, '')}
                        </span>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-lg text-[#8B8B8B] hover:text-[#F0F0F0] hover:bg-[#1E3A5F] transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="relative aspect-video bg-black">
                    {videoUrl ? (
                        <video src={videoUrl} controls autoPlay className="w-full h-full" />
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-[#8B8B8B]">
                            <svg className="w-16 h-16 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            <p>비디오를 불러올 수 없습니다</p>
                        </div>
                    )}
                </div>

                {clip.description && (
                    <div className="p-4 border-t border-[#1E3A5F]">
                        <p className="text-sm text-[#A0A0A0]">{clip.description}</p>
                    </div>
                )}

                <div className="px-4 pb-4 pt-2 flex items-center gap-4 text-xs text-[#5B5B5B]">
                    <span>게임 내 {Math.floor(clip.startTime / 60)}:{(clip.startTime % 60).toString().padStart(2, '0')}</span>
                    {clip.duration > 0 && <span>길이 {clip.duration}초</span>}
                </div>
            </div>
        </div>
    );
};

// ── ScoreBar ─────────────────────────────────────────────────────────────────
const ScoreBar: React.FC<{ label: string; value: number | null }> = ({ label, value }) => {
    const pct = value != null ? Math.round(Math.min(Math.max(value, 0), 100)) : 0;
    const color = pct >= 70 ? '#6BCF7F' : pct >= 40 ? '#FFD93D' : '#E84057';
    return (
        <div>
            <div className="flex justify-between text-xs mb-1">
                <span className="text-[#8B8B8B]">{label}</span>
                <span style={{ color }} className="font-semibold">{value != null ? value.toFixed(1) : '-'}</span>
            </div>
            <div className="h-1.5 bg-[#1E3A5F] rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
            </div>
        </div>
    );
};

// ── 클립 가로 슬라이드 ────────────────────────────────────────────────────────
const ClipSlide: React.FC<{ clip: HighlightResponse; onClick: () => void }> = ({ clip, onClick }) => {
    const isMistake = clip.title.startsWith('[실수]');
    const videoUrl = resolveVideoUrl(clip.videoUrl);
    const label = clip.title.replace(/^\[(하이라이트|실수)\]\s*/, '');

    return (
        <div
            onClick={onClick}
            className="group relative flex-shrink-0 w-44 cursor-pointer rounded-lg overflow-hidden border border-[#1E3A5F] hover:border-[#00C8FF] transition-all hover:shadow-[0_0_12px_rgba(0,200,255,0.2)]"
        >
            <div className="relative aspect-video bg-[#050816]">
                {videoUrl ? (
                    <video
                        src={videoUrl}
                        className="w-full h-full object-cover"
                        muted
                        preload="metadata"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-[#1E3A5F]" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                    </div>
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 bg-white/90 rounded-full p-2 transition-opacity">
                        <svg className="w-4 h-4 text-black" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                        </svg>
                    </div>
                </div>
            </div>
            <div className="p-2 bg-[#0D1B2A]">
                <span className={`text-xs font-semibold ${isMistake ? 'text-[#E84057]' : 'text-[#00C8FF]'}`}>
                    {isMistake ? '실수' : '하이라이트'}
                </span>
                <p className="text-xs text-[#C0C0C0] truncate mt-0.5">{label}</p>
                <p className="text-xs text-[#5B5B5B] mt-0.5">
                    {Math.floor(clip.startTime / 60)}:{(clip.startTime % 60).toString().padStart(2, '0')}
                </p>
            </div>
        </div>
    );
};

// ── 가로 스크롤 섹션 ──────────────────────────────────────────────────────────
const HorizontalClipSection: React.FC<{
    title: string;
    color: string;
    clips: HighlightResponse[];
    onClipClick: (clip: HighlightResponse) => void;
}> = ({ title, color, clips, onClipClick }) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    const scroll = (dir: 'left' | 'right') => {
        if (!scrollRef.current) return;
        scrollRef.current.scrollBy({ left: dir === 'left' ? -200 : 200, behavior: 'smooth' });
    };

    if (clips.length === 0) return null;

    return (
        <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
                <span className="w-1 h-4 rounded" style={{ backgroundColor: color }} />
                <span className="font-semibold text-[#F0F0F0]">{title}</span>
                <span className="text-xs text-[#5B5B5B]">{clips.length}개</span>
            </div>
            <div className="relative group/section">
                <button
                    onClick={() => scroll('left')}
                    className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-[#0D1B2A]/90 border border-[#1E3A5F] rounded-full p-1.5 opacity-0 group-hover/section:opacity-100 transition-opacity -translate-x-3 hover:bg-[#1E3A5F]"
                >
                    <svg className="w-4 h-4 text-[#F0F0F0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <div ref={scrollRef} className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                    {clips.map((c) => (
                        <ClipSlide key={c.id} clip={c} onClick={() => onClipClick(c)} />
                    ))}
                </div>
                <button
                    onClick={() => scroll('right')}
                    className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-[#0D1B2A]/90 border border-[#1E3A5F] rounded-full p-1.5 opacity-0 group-hover/section:opacity-100 transition-opacity translate-x-3 hover:bg-[#1E3A5F]"
                >
                    <svg className="w-4 h-4 text-[#F0F0F0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

// ── 경기 분석 섹션 ────────────────────────────────────────────────────────────
const MatchAnalysisSection: React.FC<{ matchId: string }> = ({ matchId }) => {
    const { data: analysis, isLoading } = useQuery<AnalysisResponse>({
        queryKey: ['matchAnalysis', matchId],
        queryFn: () => getMatchAnalysis(matchId),
        retry: false,
        staleTime: 1000 * 60 * 5,
    });

    if (isLoading) {
        return (
            <div className="bg-[#0D1B2A] rounded-xl border border-[#1E3A5F] p-6 mb-6 animate-pulse">
                <div className="h-4 bg-[#1E3A5F] rounded w-32 mb-4" />
                <div className="grid grid-cols-2 gap-3">
                    {[...Array(6)].map((_, i) => <div key={i} className="h-8 bg-[#1E3A5F] rounded" />)}
                </div>
            </div>
        );
    }

    if (!analysis || analysis.status !== 'COMPLETED') return null;

    const { scores, strengthAnalysis, weaknessAnalysis, improvementSuggestions } = analysis;
    if (!scores && !strengthAnalysis && !weaknessAnalysis && !improvementSuggestions) return null;

    return (
        <div className="bg-[#0D1B2A] rounded-xl border border-[#1E3A5F] p-6 mb-6">
            <h3 className="text-sm font-bold text-[#C8AA6E] flex items-center gap-2 mb-4">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                경기 분석
            </h3>

            {scores && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-3 mb-4">
                    <ScoreBar label="영향력" value={scores.impactScore} />
                    <ScoreBar label="팀파이트" value={scores.teamFightScore} />
                    <ScoreBar label="파밍" value={scores.farmingScore} />
                    <ScoreBar label="시야" value={scores.visionScore} />
                    <ScoreBar label="오브젝트" value={scores.objectiveControlScore} />
                    <ScoreBar label="종합" value={scores.averageScore} />
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                {strengthAnalysis && (
                    <div className="bg-[#112240] rounded-lg p-3 border border-[#6BCF7F]/30">
                        <div className="text-[#6BCF7F] font-semibold mb-1">강점</div>
                        <p className="text-[#A0A0A0] leading-relaxed">{strengthAnalysis}</p>
                    </div>
                )}
                {weaknessAnalysis && (
                    <div className="bg-[#112240] rounded-lg p-3 border border-[#E84057]/30">
                        <div className="text-[#E84057] font-semibold mb-1">약점</div>
                        <p className="text-[#A0A0A0] leading-relaxed">{weaknessAnalysis}</p>
                    </div>
                )}
                {improvementSuggestions && (
                    <div className="bg-[#112240] rounded-lg p-3 border border-[#C8AA6E]/30">
                        <div className="text-[#C8AA6E] font-semibold mb-1">개선점</div>
                        <p className="text-[#A0A0A0] leading-relaxed">{improvementSuggestions}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

// ── 경기 상세 뷰 ──────────────────────────────────────────────────────────────
const MatchDetailView: React.FC<{
    group: MatchGroup;
    onBack: () => void;
}> = ({ group, onBack }) => {
    const [selectedClip, setSelectedClip] = useState<HighlightResponse | null>(null);

    const highlightClips = group.highlights.filter((h) => !h.title.startsWith('[실수]'));
    const mistakeClips = group.highlights.filter((h) => h.title.startsWith('[실수]'));

    return (
        <div>
            <div className="mb-6 flex items-center gap-3">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-[#8B8B8B] hover:text-[#F0F0F0] transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    목록으로
                </button>
                <span className="text-[#1E3A5F]">|</span>
                <div>
                    <span className="text-[#F0F0F0] font-semibold text-sm font-mono">{group.matchId}</span>
                    <span className="text-[#8B8B8B] text-xs ml-2">
                        하이라이트 {group.highlightCount}개
                        {group.mistakeCount > 0 && ` · 실수 ${group.mistakeCount}개`}
                    </span>
                </div>
            </div>

            <MatchAnalysisSection matchId={group.matchId} />

            <HorizontalClipSection
                title="하이라이트"
                color="#00C8FF"
                clips={highlightClips}
                onClipClick={setSelectedClip}
            />
            <HorizontalClipSection
                title="실수"
                color="#E84057"
                clips={mistakeClips}
                onClipClick={setSelectedClip}
            />

            {selectedClip && (
                <ClipModal clip={selectedClip} onClose={() => setSelectedClip(null)} />
            )}
        </div>
    );
};

// ── 메인 페이지 ───────────────────────────────────────────────────────────────
const MyHighlightsPage: React.FC = () => {
    const user = useUser();
    const setUser = useAuthStore((state) => state.setUser);
    const queryClient = useQueryClient();
    const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);

    const [showLinkForm, setShowLinkForm] = useState(false);
    const [summonerName, setSummonerName] = useState('');
    const [tagLine, setTagLine] = useState('KR1');
    const [linkError, setLinkError] = useState<string | null>(null);
    const [showUnlinkConfirm, setShowUnlinkConfirm] = useState(false);

    const puuid = user?.puuid || '';

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

    const unlinkRiotMutation = useMutation({
        mutationFn: unlinkRiot,
        onSuccess: (updatedUser) => {
            setUser(updatedUser);
            setShowUnlinkConfirm(false);
            queryClient.invalidateQueries({ queryKey: ['playerHighlights'] });
        },
    });

    const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError } =
        useInfiniteQuery({
            queryKey: ['playerHighlights', puuid],
            queryFn: ({ pageParam = 0 }) => getPlayerHighlights(puuid, pageParam, 100),
            initialPageParam: 0,
            getNextPageParam: (lastPage) => (lastPage.last ? undefined : lastPage.number + 1),
            enabled: !!puuid,
        });

    const allHighlights = data?.pages.flatMap((p) => p.content) || [];

    const matchGroups: MatchGroup[] = Object.values(
        allHighlights.reduce((acc, h) => {
            if (!acc[h.matchId]) {
                acc[h.matchId] = { matchId: h.matchId, highlights: [], createdAt: h.createdAt, highlightCount: 0, mistakeCount: 0 };
            }
            acc[h.matchId].highlights.push(h);
            if (h.title.startsWith('[실수]')) acc[h.matchId].mistakeCount++;
            else acc[h.matchId].highlightCount++;
            return acc;
        }, {} as Record<string, MatchGroup>)
    ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const selectedMatchGroup = selectedMatchId ? matchGroups.find((g) => g.matchId === selectedMatchId) ?? null : null;

    if (!puuid) {
        return (
            <div className="max-w-2xl mx-auto text-center py-16">
                <div className="bg-[#0D1B2A] rounded-xl border border-[#1E3A5F] p-8">
                    <svg className="w-20 h-20 mx-auto mb-6 text-[#C8AA6E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    <h2 className="text-2xl font-bold text-[#F0F0F0] mb-4">Riot 계정 연동이 필요합니다</h2>
                    <p className="text-[#8B8B8B] mb-6">하이라이트를 보려면 먼저 Riot 계정을 연동해주세요.</p>
                    {!showLinkForm ? (
                        <Button variant="primary" size="lg" onClick={() => setShowLinkForm(true)}>Riot 계정 연동하기</Button>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex gap-2">
                                <input type="text" placeholder="소환사 이름" value={summonerName}
                                    onChange={(e) => setSummonerName(e.target.value)}
                                    className="flex-1 px-4 py-3 bg-[#112240] border border-[#1E3A5F] rounded-lg text-[#F0F0F0] placeholder-[#5B5B5B] focus:outline-none focus:border-[#00C8FF]" />
                                <span className="flex items-center text-[#5B5B5B] text-xl">#</span>
                                <input type="text" placeholder="태그" value={tagLine}
                                    onChange={(e) => setTagLine(e.target.value)}
                                    onFocus={(e) => { if (e.target.value === 'KR1') setTagLine(''); }}
                                    className="w-24 px-4 py-3 bg-[#112240] border border-[#1E3A5F] rounded-lg text-[#F0F0F0] placeholder-[#5B5B5B] focus:outline-none focus:border-[#00C8FF]" />
                            </div>
                            {linkError && <p className="text-sm text-[#E84057]">{linkError}</p>}
                            <div className="flex gap-2 justify-center">
                                <Button variant="ghost" onClick={() => { setShowLinkForm(false); setLinkError(null); }}>취소</Button>
                                <Button variant="primary" onClick={() => linkRiotMutation.mutate()}
                                    isLoading={linkRiotMutation.isPending} disabled={!summonerName || !tagLine}>
                                    연동하기
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    if (selectedMatchGroup) {
        return <MatchDetailView group={selectedMatchGroup} onBack={() => setSelectedMatchId(null)} />;
    }

    return (
        <div>
            <div className="mb-8 flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold text-[#F0F0F0] mb-2">내 하이라이트</h1>
                    <p className="text-[#8B8B8B]">나의 멋진 플레이 순간들을 확인하세요</p>
                </div>
                {user?.summonerName && (
                    <Button variant="ghost" size="sm" onClick={() => setShowUnlinkConfirm(true)}
                        className="!text-[#E84057] hover:!text-[#FF5570]">
                        Riot 계정 연동 해제
                    </Button>
                )}
            </div>

            {isLoading && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="h-32 bg-[#0D1B2A] rounded-xl animate-pulse border border-[#1E3A5F]" />
                    ))}
                </div>
            )}

            {isError && (
                <div className="text-center py-12 bg-[#0D1B2A] rounded-xl border border-[#E84057]/30">
                    <p className="text-[#E84057]">하이라이트를 불러올 수 없습니다</p>
                </div>
            )}

            {!isLoading && !isError && matchGroups.length === 0 && (
                <div className="text-center py-16 bg-[#0D1B2A] rounded-xl border border-[#1E3A5F]">
                    <svg className="w-20 h-20 mx-auto mb-6 text-[#1E3A5F]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <h3 className="text-xl font-semibold text-[#F0F0F0] mb-2">아직 하이라이트가 없습니다</h3>
                    <p className="text-[#8B8B8B]">경기를 플레이하고 멋진 순간을 기록해보세요!</p>
                </div>
            )}

            {!isLoading && matchGroups.length > 0 && (
                <>
                    <p className="text-sm text-[#8B8B8B] mb-4">
                        총 <span className="text-[#00C8FF] font-semibold">{matchGroups.length}</span>경기
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {matchGroups.map((group) => (
                            <MatchGroupCard key={group.matchId} group={group} onClick={() => setSelectedMatchId(group.matchId)} />
                        ))}
                    </div>
                    {hasNextPage && (
                        <div className="mt-8 text-center">
                            <Button variant="ghost" size="lg" onClick={() => fetchNextPage()} isLoading={isFetchingNextPage}>
                                더 보기
                            </Button>
                        </div>
                    )}
                </>
            )}

            {showUnlinkConfirm && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-[#0D1B2A] rounded-xl border border-[#1E3A5F] p-6 max-w-md w-full">
                        <h3 className="text-xl font-bold text-[#F0F0F0] mb-4">Riot 계정 연동 해제</h3>
                        <p className="text-[#8B8B8B] mb-6">정말 Riot 계정 연동을 해제하시겠습니까?<br />연동을 해제하면 하이라이트 및 전적을 볼 수 없습니다.</p>
                        <div className="flex gap-3 justify-end">
                            <Button variant="ghost" onClick={() => setShowUnlinkConfirm(false)}>취소</Button>
                            <Button variant="primary" onClick={() => unlinkRiotMutation.mutate()}
                                isLoading={unlinkRiotMutation.isPending} className="!bg-[#E84057] hover:!bg-[#FF5570]">
                                연동 해제
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// ── 경기 그룹 카드 ─────────────────────────────────────────────────────────────
const typeIcons: Partial<Record<HighlightType, string>> = {
    PENTAKILL: '⭐', BARON: '👾', DRAGON: '🐉', TOWER: '🗼',
};

const MatchGroupCard: React.FC<{ group: MatchGroup; onClick: () => void }> = ({ group, onClick }) => {
    const types = [...new Set(
        group.highlights.map((h) => h.type).filter((t): t is HighlightType => t != null && t !== 'OTHER')
    )];

    const previewClip = group.highlights[0];
    const previewUrl = resolveVideoUrl(previewClip?.videoUrl ?? null);

    return (
        <div
            onClick={onClick}
            className="group cursor-pointer rounded-xl bg-[#0D1B2A] border border-[#1E3A5F] hover:border-[#00C8FF] hover:shadow-[0_0_20px_rgba(0,200,255,0.15)] transition-all overflow-hidden"
        >
            <div className="relative aspect-video bg-[#050816]">
                {previewUrl ? (
                    <video src={previewUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" muted preload="metadata" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-12 h-12 text-[#1E3A5F]" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                    </div>
                )}
                <div className="absolute top-2 right-2 px-2 py-1 rounded bg-black/70 text-xs text-white font-medium">
                    {group.highlights.length}개 클립
                </div>
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-[#00C8FF]/90 rounded-full p-3">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </div>
                </div>
            </div>
            <div className="p-4">
                <p className="text-xs text-[#5B5B5B] font-mono truncate mb-2">{group.matchId}</p>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-sm">
                        {group.highlightCount > 0 && <span className="text-[#00C8FF] font-semibold">하이라이트 {group.highlightCount}</span>}
                        {group.mistakeCount > 0 && <span className="text-[#E84057] font-semibold">실수 {group.mistakeCount}</span>}
                    </div>
                    <span className="text-xs text-[#5B5B5B]">{formatRelativeTime(group.createdAt)}</span>
                </div>
                {types.length > 0 && (
                    <div className="flex gap-1 mt-2">
                        {types.map((t) => <span key={t} className="text-sm">{typeIcons[t]}</span>)}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyHighlightsPage;
