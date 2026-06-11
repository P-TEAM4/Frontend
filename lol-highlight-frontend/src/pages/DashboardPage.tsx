// src/pages/DashboardPage.tsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useUser, useAuthStore } from '../store/authStore';
import { getMatches } from '../api/matches';
import { getPlayerHighlights } from '../api/highlights';
import { getPlayerAnalyses } from '../api/analyses';
import { unlinkRiot } from '../api/users';
import MatchCard from '../components/matches/MatchCard';
import Button from '../components/common/Button';
import { formatRelativeTime, getProfileIconUrl, getRankEmblemUrl, type HighlightResponse } from '../types/api';

const AI_BASE_URL = 'http://localhost:8001';
function resolveVideoUrl(url: string | null): string | null {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${AI_BASE_URL}/${url}`;
}

function getHighlightScore(raw: string | null): number {
    try {
        if (!raw) return 0;
        const d = JSON.parse(raw);
        return (d.combinedImportance ?? d.impactScore ?? 0) as number;
    } catch { return 0; }
}

const DashboardPage: React.FC = () => {
    const navigate = useNavigate();
    const user = useUser();
    const setUser = useAuthStore((state) => state.setUser);
    const queryClient = useQueryClient();
    const [showUnlinkConfirm, setShowUnlinkConfirm] = useState(false);
    const [activeClip, setActiveClip] = useState<HighlightResponse | null>(null);

    const puuid = user?.puuid || '';
    const hasRiotAccount = !!user?.summonerName;

    const { data: recentMatches, isLoading: isLoadingMatches } = useQuery({
        queryKey: ['recentMatches', user?.summonerName, user?.tagLine],
        queryFn: () =>
            getMatches({
                gameName: user!.summonerName!,
                tagLine: user!.tagLine!,
                page: 0,
                size: 3,
            }),
        enabled: !!user?.summonerName && !!user?.tagLine,
        staleTime: 2 * 60 * 1000,
    });

    const { data: analysesData, isLoading: isLoadingAnalyses } = useQuery({
        queryKey: ['recentAnalyses', puuid],
        queryFn: () => getPlayerAnalyses(puuid, 0, 3),
        enabled: !!puuid,
        staleTime: 5 * 60 * 1000,
    });

    const latestAnalysis = analysesData?.content?.[0] ?? null;
    const latestAiData = (() => {
        try { return latestAnalysis?.aiModelData ? JSON.parse(latestAnalysis.aiModelData) : null; }
        catch { return null; }
    })();
    const improvements = latestAnalysis?.improvementSuggestions?.split('|').map(s => s.trim()).filter(Boolean) ?? [];

    // 하이라이트 20개 fetch → combinedImportance 정렬 → 상위 6개
    const { data: highlightsData, isLoading: isLoadingHighlights } = useQuery({
        queryKey: ['dashboardHighlights', puuid],
        queryFn: () => getPlayerHighlights(puuid, 0, 20),
        enabled: !!puuid,
        staleTime: 2 * 60 * 1000,
    });

    const topHighlights = (highlightsData?.content || [])
        .filter(h => h.status === 'COMPLETED')
        .sort((a, b) => getHighlightScore(b.eventData) - getHighlightScore(a.eventData))
        .slice(0, 6);

    const unlinkRiotMutation = useMutation({
        mutationFn: unlinkRiot,
        onSuccess: (updatedUser) => {
            setUser(updatedUser);
            setShowUnlinkConfirm(false);
            queryClient.invalidateQueries({ queryKey: ['recentMatches'] });
            queryClient.invalidateQueries({ queryKey: ['dashboardHighlights'] });
        },
    });

    if (!user) {
        return (
            <div className="flex items-center justify-center min-h-screen text-[#8B8B8B]">
                사용자 정보를 불러오는 중입니다...
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* ── 1. 히어로 배너 ── */}
            <div className="rounded-2xl bg-gradient-to-r from-[#0D1B2A] via-[#0D1B2A] to-[#1E3A5F]/40 border border-[#1E3A5F] p-6 relative overflow-hidden">
                <div className="absolute right-0 top-0 w-64 h-full opacity-5 pointer-events-none select-none">
                    <svg viewBox="0 0 200 200" className="w-full h-full" fill="currentColor">
                        <polygon points="100,10 190,55 190,145 100,190 10,145 10,55" className="text-[#00C8FF]" />
                    </svg>
                </div>
                <div className="flex flex-col md:flex-row items-start md:items-center gap-6 relative">
                    {/* 프로필 아이콘 */}
                    <div className="relative shrink-0">
                        {user.profileIconId ? (
                            <img
                                src={getProfileIconUrl(user.profileIconId)}
                                alt="profile"
                                className="w-20 h-20 rounded-xl border-2 border-[#C8AA6E]"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                            />
                        ) : (
                            <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-[#1E3A5F] to-[#0D1B2A] flex items-center justify-center border-2 border-[#C8AA6E]">
                                <span className="text-4xl font-bold text-[#C8AA6E]">{user.name?.charAt(0) || 'U'}</span>
                            </div>
                        )}
                        {user.summonerLevel && (
                            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-[#1C1C1F] border border-[#C8AA6E] text-[#C8AA6E] text-xs font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
                                {user.summonerLevel}
                            </div>
                        )}
                    </div>

                    {/* 이름 + 연동 정보 */}
                    <div className="flex-1 min-w-0">
                        <h1 className="text-2xl font-bold text-white truncate">{user.name}</h1>
                        {hasRiotAccount ? (
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <span className="text-[#00C8FF] font-semibold">{user.summonerName} #{user.tagLine}</span>
                                {user.tier && (
                                    <div className="flex items-center gap-1.5">
                                        <img
                                            src={getRankEmblemUrl(user.tier)}
                                            alt={user.tier}
                                            className="w-5 h-5 object-contain"
                                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                        />
                                        <span className="text-[#C8AA6E] text-sm font-semibold">
                                            {user.tier} {user.rank}
                                            {user.leaguePoints != null && ` ${user.leaguePoints}LP`}
                                        </span>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="mt-2 flex items-center gap-2">
                                <span className="text-[#8B8B8B] text-sm">Riot 계정 미연동</span>
                                <Button variant="ghost" size="sm" onClick={() => navigate('/profile')}>연동하기</Button>
                            </div>
                        )}
                    </div>

                    {/* 스탯 카드 */}
                    {hasRiotAccount && (
                        <div className="flex items-end gap-3 shrink-0">
                            {user.winRate != null && (
                                <div className="bg-[#0D1B2A] rounded-xl p-4 border border-[#1E3A5F] min-w-[90px] text-center">
                                    <div className="text-xs text-[#8B8B8B] mb-1">승률</div>
                                    <div className={`text-2xl font-bold ${user.winRate >= 55 ? 'text-[#00C8FF]' : user.winRate >= 50 ? 'text-[#C8AA6E]' : 'text-[#E84057]'}`}>
                                        {Math.round(user.winRate)}%
                                    </div>
                                    {user.wins != null && user.losses != null && (
                                        <div className="text-xs text-[#5B5B5B] mt-0.5">{user.wins}W {user.losses}L</div>
                                    )}
                                </div>
                            )}
                            {user.averageKda != null && (
                                <div className="bg-[#0D1B2A] rounded-xl p-4 border border-[#1E3A5F] min-w-[90px] text-center">
                                    <div className="text-xs text-[#8B8B8B] mb-1">평균 KDA</div>
                                    <div className={`text-2xl font-bold ${user.averageKda >= 4 ? 'text-[#C8AA6E]' : user.averageKda >= 2.5 ? 'text-white' : 'text-[#8B8B8B]'}`}>
                                        {user.averageKda.toFixed(2)}
                                    </div>
                                    <div className="text-xs text-[#5B5B5B] mt-0.5">평점</div>
                                </div>
                            )}
                            <button
                                onClick={() => setShowUnlinkConfirm(true)}
                                className="text-xs text-[#5B5B5B] hover:text-[#E84057] transition-colors pb-1"
                            >
                                연동 해제
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* ── 2. AI 코칭 + 최근 경기 ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* AI 코칭 (2/3) */}
                <div className="lg:col-span-2 rounded-xl bg-[#0D1B2A] border border-[#1E3A5F] p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-base font-bold text-[#00C8FF] flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            AI 코칭 분석
                        </h2>
                        {latestAiData?.champion && (
                            <span className="text-xs text-[#C8AA6E] font-semibold bg-[#C8AA6E]/10 px-2 py-0.5 rounded">
                                {latestAiData.champion}
                            </span>
                        )}
                    </div>

                    {!puuid ? (
                        <div className="flex items-center justify-center py-10 text-center">
                            <p className="text-[#8B8B8B] text-sm">Riot 계정을 연동하면 AI 코칭 분석을 받을 수 있습니다.</p>
                        </div>
                    ) : isLoadingAnalyses ? (
                        <div className="space-y-3">
                            {[...Array(3)].map((_, i) => <div key={i} className="h-12 bg-[#1E3A5F]/30 rounded-lg animate-pulse" />)}
                        </div>
                    ) : !latestAiData ? (
                        <div className="flex flex-col items-center justify-center py-10 text-center">
                            <svg className="w-12 h-12 text-[#1E3A5F] mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                            <p className="text-[#8B8B8B] text-sm">아직 분석 데이터가 없습니다. 경기 후 분석을 생성해보세요.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {latestAiData.coachingSummary && (
                                <div className="bg-[#1C1C1F] rounded-lg p-3 border-l-2 border-[#00C8FF]">
                                    <p className="text-xs text-[#8B8B8B] mb-1">총평</p>
                                    <p className="text-sm text-[#E0E0E0] leading-relaxed">{latestAiData.coachingSummary}</p>
                                </div>
                            )}
                            {(latestAiData.coachingEarlyGame || latestAiData.coachingMidGame || latestAiData.coachingLateGame) && (
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { label: '라인전', value: latestAiData.coachingEarlyGame, color: '#5383E8' },
                                        { label: '중반전', value: latestAiData.coachingMidGame, color: '#C8AA6E' },
                                        { label: '후반전', value: latestAiData.coachingLateGame, color: '#00C8FF' },
                                    ].map(({ label, value, color }) => value ? (
                                        <div key={label} className="bg-[#1C1C1F] rounded-lg p-3">
                                            <div className="text-xs font-bold mb-1" style={{ color }}>{label}</div>
                                            <p className="text-xs text-[#A0A0A0] leading-relaxed line-clamp-4">{value}</p>
                                        </div>
                                    ) : null)}
                                </div>
                            )}
                            {latestAiData.coachingKeyPattern && (
                                <div className="bg-[#1C1C1F] rounded-lg p-3">
                                    <p className="text-xs text-[#8B8B8B] mb-1">핵심 패턴</p>
                                    <p className="text-xs text-[#C0C0C0] leading-relaxed line-clamp-3">{latestAiData.coachingKeyPattern}</p>
                                </div>
                            )}
                            {/* 개선점 */}
                            {improvements.length > 0 && (
                                <div className="bg-[#1C1C1F] rounded-lg p-3">
                                    <p className="text-xs text-[#8B8B8B] mb-2">개선점</p>
                                    <div className="space-y-1.5">
                                        {improvements.slice(0, 3).map((imp, i) => (
                                            <div key={i} className="flex items-start gap-2">
                                                <span className="shrink-0 w-4 h-4 rounded-full bg-[#E84057]/20 text-[#E84057] text-xs flex items-center justify-center font-bold mt-0.5">{i + 1}</span>
                                                <p className="text-xs text-[#C0C0C0] leading-relaxed">{imp}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {latestAiData.overallScore != null && (
                                <div className="flex items-center gap-3 pt-1">
                                    <span className="text-xs text-[#8B8B8B] shrink-0">종합 점수</span>
                                    <div className="flex-1 h-1.5 bg-[#1E3A5F] rounded-full overflow-hidden">
                                        <div className="h-full bg-gradient-to-r from-[#00C8FF] to-[#C8AA6E] rounded-full" style={{ width: `${Math.round(latestAiData.overallScore)}%` }} />
                                    </div>
                                    <span className="text-sm font-bold text-[#C8AA6E] w-8 text-right">{Math.round(latestAiData.overallScore)}</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* 최근 경기 (1/3) */}
                <div className="lg:col-span-1 rounded-xl bg-[#0D1B2A] border border-[#1E3A5F] p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-base font-bold text-white flex items-center gap-2">
                            <svg className="w-4 h-4 text-[#00C8FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            최근 경기
                        </h2>
                        <button
                            onClick={() => {
                                if (user.summonerName && user.tagLine) {
                                    navigate(`/matches?gameName=${encodeURIComponent(user.summonerName)}&tagLine=${encodeURIComponent(user.tagLine)}`);
                                } else navigate('/matches');
                            }}
                            className="text-xs text-[#8B8B8B] hover:text-[#00C8FF] transition-colors"
                        >
                            전체보기 →
                        </button>
                    </div>
                    {!hasRiotAccount ? (
                        <div className="text-center py-10">
                            <p className="text-[#8B8B8B] text-sm">Riot 계정을 연동해주세요.</p>
                        </div>
                    ) : isLoadingMatches ? (
                        <div className="space-y-2">
                            {[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-[#1E3A5F]/30 rounded-lg animate-pulse" />)}
                        </div>
                    ) : !recentMatches?.matches.content.length ? (
                        <div className="text-center py-10">
                            <p className="text-[#8B8B8B] text-sm">최근 경기 기록이 없습니다.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <div className="min-w-[440px]">
                                {recentMatches.matches.content.map((match) => (
                                    <MatchCard key={match.id} match={match} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ── 3. 베스트 하이라이트 (가로 스크롤) ── */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                        <svg className="w-4 h-4 text-[#C8AA6E]" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                        베스트 하이라이트
                        <span className="text-xs text-[#8B8B8B] font-normal">승리기여도 순</span>
                    </h2>
                    <button onClick={() => navigate('/highlights')} className="text-xs text-[#8B8B8B] hover:text-[#00C8FF] transition-colors">
                        전체보기 →
                    </button>
                </div>

                {!puuid ? (
                    <div className="text-center py-8 bg-[#0D1B2A] rounded-xl border border-[#1E3A5F]">
                        <p className="text-[#8B8B8B] text-sm">Riot 계정을 연동하면 하이라이트를 볼 수 있습니다.</p>
                    </div>
                ) : isLoadingHighlights ? (
                    <div className="flex gap-4 overflow-hidden">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="w-60 shrink-0 aspect-video bg-[#0D1B2A] rounded-lg animate-pulse" />
                        ))}
                    </div>
                ) : topHighlights.length === 0 ? (
                    <div className="text-center py-8 bg-[#0D1B2A] rounded-xl border border-[#1E3A5F]">
                        <p className="text-[#8B8B8B] text-sm">아직 하이라이트가 없습니다.</p>
                    </div>
                ) : (
                    <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-[#1E3A5F] scrollbar-track-transparent">
                        {topHighlights.map((highlight) => {
                            const score = getHighlightScore(highlight.eventData);
                            return (
                                <div
                                    key={highlight.id}
                                    className="group w-60 shrink-0 rounded-lg overflow-hidden border border-[#1E3A5F] bg-[#0D1B2A] cursor-pointer hover:border-[#C8AA6E] transition-all"
                                    onClick={() => {
                                        if (resolveVideoUrl(highlight.videoUrl)) setActiveClip(highlight);
                                        else navigate('/highlights');
                                    }}
                                >
                                    <div className="aspect-video relative">
                                        {highlight.thumbnailUrl ? (
                                            <img
                                                src={highlight.thumbnailUrl}
                                                alt={highlight.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                                        ) : resolveVideoUrl(highlight.videoUrl) ? (
                                            <video
                                                src={resolveVideoUrl(highlight.videoUrl)!}
                                                preload="metadata"
                                                muted
                                                playsInline
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-[#1E3A5F] flex items-center justify-center">
                                                <svg className="w-8 h-8 text-[#5B5B5B]" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                            <div className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                                                <svg className="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M8 5v14l11-7z" />
                                                </svg>
                                            </div>
                                        </div>
                                        {score > 0 && (
                                            <div className="absolute top-1.5 right-1.5 bg-[#C8AA6E]/90 text-[#0D1B2A] text-xs font-bold px-1.5 py-0.5 rounded">
                                                {score.toFixed(1)}
                                            </div>
                                        )}
                                        <span className="absolute bottom-1.5 left-1.5 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded">
                                            {Math.floor(highlight.duration / 60)}:{(highlight.duration % 60).toString().padStart(2, '0')}
                                        </span>
                                    </div>
                                    <div className="p-2.5">
                                        <h3 className="font-semibold text-white text-xs truncate">{highlight.title}</h3>
                                        <p className="text-xs text-[#5B5B5B] mt-0.5">{formatRelativeTime(highlight.createdAt)}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* 하이라이트 비디오 모달 */}
            {activeClip && (
                <div
                    className="fixed inset-0 bg-black/85 flex items-center justify-center z-50 p-4"
                    onClick={() => setActiveClip(null)}
                >
                    <div className="relative max-w-3xl w-full" onClick={(e) => e.stopPropagation()}>
                        <button
                            onClick={() => setActiveClip(null)}
                            className="absolute -top-9 right-0 text-white/60 hover:text-white text-sm"
                        >
                            닫기 ✕
                        </button>
                        <video
                            src={resolveVideoUrl(activeClip.videoUrl)!}
                            controls
                            autoPlay
                            className="w-full rounded-t-xl"
                        />
                        {/* 클립 정보 + Gemini 코칭 */}
                        <div className="bg-[#0D1B2A] rounded-b-xl border-t border-[#1E3A5F] p-4 space-y-2">
                            <h3 className="font-bold text-white text-sm">
                                {activeClip.title.replace(/^\[(하이라이트|실수)\]\s*/, '')}
                            </h3>
                            {activeClip.coaching && (
                                <div className="bg-[#1C1C1F] rounded-lg p-3 border-l-2 border-[#00C8FF]">
                                    <p className="text-xs text-[#8B8B8B] mb-1">AI 코칭</p>
                                    <p className="text-sm text-[#E0E0E0] leading-relaxed">{activeClip.coaching}</p>
                                </div>
                            )}
                            {activeClip.description && (
                                <p className="text-xs text-[#8B8B8B]">{activeClip.description}</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Riot 계정 연동 해제 모달 */}
            {showUnlinkConfirm && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-[#0D1B2A] rounded-xl border border-[#1E3A5F] p-6 max-w-md w-full">
                        <h3 className="text-xl font-bold text-[#F0F0F0] mb-4">Riot 계정 연동 해제</h3>
                        <p className="text-[#8B8B8B] mb-6">
                            정말 Riot 계정 연동을 해제하시겠습니까?<br />
                            연동을 해제하면 전적 및 하이라이트를 볼 수 없습니다.
                        </p>
                        <div className="flex gap-3 justify-end">
                            <Button variant="ghost" onClick={() => setShowUnlinkConfirm(false)}>취소</Button>
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

export default DashboardPage;
