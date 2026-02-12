// src/pages/MatchDetailPage.tsx
import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMatchDetail } from '../api/matches';
import { getMatchAnalysis, createAnalysis, regenerateAnalysis } from '../api/analyses';
import { getMatchHighlights } from '../api/highlights';
import { getChampionIconUrl, getItemIconUrl, formatGameDuration } from '../types/api';
import type { HighlightResponse } from '../types/api';
import AnalysisCard from '../components/analysis/AnalysisCard';
import HighlightCard from '../components/highlights/HighlightCard';
import HighlightModal from '../components/highlights/HighlightModal';
import Button from '../components/common/Button';

const MatchDetailPage: React.FC = () => {
    const { matchId } = useParams<{ matchId: string }>();
    const queryClient = useQueryClient();
    const [selectedHighlight, setSelectedHighlight] = useState<HighlightResponse | null>(null);

    // 매치 상세 정보 조회
    const { data: matchDetail, isLoading: isLoadingDetail } = useQuery({
        queryKey: ['matchDetail', matchId],
        queryFn: () => getMatchDetail(matchId || ''),
        enabled: !!matchId,
    });

    // 분석 조회
    const {
        data: analysis,
        isLoading: isLoadingAnalysis,
        isError: isAnalysisError
    } = useQuery({
        queryKey: ['matchAnalysis', matchId],
        queryFn: () => getMatchAnalysis(matchId || ''),
        enabled: !!matchId,
        retry: false,
    });

    // 하이라이트 목록 조회
    const { data: highlightsData, isLoading: isLoadingHighlights } = useQuery({
        queryKey: ['matchHighlights', matchId],
        queryFn: () => getMatchHighlights(matchId || ''),
        enabled: !!matchId,
    });

    // 분석 생성 뮤테이션
    const createAnalysisMutation = useMutation({
        mutationFn: () => createAnalysis(matchId || ''),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['matchAnalysis', matchId] });
        },
    });

    // 분석 재생성 뮤테이션
    const regenerateAnalysisMutation = useMutation({
        mutationFn: () => regenerateAnalysis(analysis!.id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['matchAnalysis', matchId] });
        },
    });

    if (isLoadingDetail) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="spinner" />
            </div>
        );
    }

    if (!matchDetail) {
        return (
            <div className="text-center py-16">
                <h2 className="text-xl font-semibold text-[#E84057]">매치를 찾을 수 없습니다</h2>
            </div>
        );
    }

    const blueTeam = matchDetail.teams.find((t) => t.teamId === 100);
    const redTeam = matchDetail.teams.find((t) => t.teamId === 200);
    const bluePlayers = matchDetail.players.slice(0, 5);
    const redPlayers = matchDetail.players.slice(5, 10);

    return (
        <div className="space-y-6">
            {/* 매치 헤더 */}
            <div className={`
        rounded-xl overflow-hidden
        ${blueTeam?.win
                    ? 'bg-gradient-to-r from-[#28A0F0]/20 to-[#0D1B2A]'
                    : 'bg-gradient-to-r from-[#E84057]/20 to-[#0D1B2A]'
                }
        border border-[#1E3A5F]
      `}>
                <div className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-[#F0F0F0] mb-2">
                                매치 상세 정보
                            </h1>
                            <p className="text-sm text-[#8B8B8B]">
                                {matchDetail.matchId}
                            </p>
                        </div>
                        <div className={`
              text-4xl font-bold
              ${blueTeam?.win ? 'text-[#28A0F0]' : 'text-[#E84057]'}
            `}>
                            {blueTeam?.win ? '승리' : '패배'}
                        </div>
                    </div>
                </div>
            </div>

            {/* 팀 점수판 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* 블루팀 */}
                <div className={`
          rounded-xl overflow-hidden border
          ${blueTeam?.win ? 'border-[#28A0F0]/50' : 'border-[#1E3A5F]'}
        `}>
                    <div className={`
            px-4 py-3 flex items-center justify-between
            ${blueTeam?.win
                            ? 'bg-[#28A0F0]/20'
                            : 'bg-[#0D1B2A]'
                        }
          `}>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-[#28A0F0]" />
                            <span className="font-semibold text-[#28A0F0]">블루팀</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                            <span className="text-[#F0F0F0]">{blueTeam?.totalKills} 킬</span>
                            <span className="text-[#8B8B8B]">{blueTeam?.totalObjectives} 오브젝트</span>
                        </div>
                    </div>
                    <div className="bg-[#0D1B2A]">
                        {bluePlayers.map((player, idx) => (
                            <div
                                key={idx}
                                className="flex items-center gap-3 px-4 py-3 border-b border-[#1E3A5F] last:border-b-0 hover:bg-[#112240] transition-colors"
                            >
                                <img
                                    src={getChampionIconUrl(player.championName)}
                                    alt={player.championName}
                                    className="w-10 h-10 rounded-full border border-[#1E3A5F]"
                                />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-[#F0F0F0] truncate">
                                        {player.playerName}
                                    </p>
                                    <p className="text-xs text-[#8B8B8B]">{player.championName}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-semibold">
                                        <span className="text-[#F0F0F0]">{player.kills}</span>
                                        <span className="text-[#5B5B5B]">/</span>
                                        <span className="text-[#E84057]">{player.deaths}</span>
                                        <span className="text-[#5B5B5B]">/</span>
                                        <span className="text-[#00C8FF]">{player.assists}</span>
                                    </p>
                                </div>
                                <div className="text-right text-xs text-[#8B8B8B] w-16">
                                    <p>{player.cs} CS</p>
                                    <p>{player.goldEarned.toLocaleString()} G</p>
                                </div>
                                <div className="flex gap-0.5">
                                    {player.finalItems.slice(0, 6).map((itemId, i) => (
                                        itemId > 0 ? (
                                            <img
                                                key={i}
                                                src={getItemIconUrl(itemId)}
                                                alt={`Item ${itemId}`}
                                                className="w-6 h-6 rounded"
                                            />
                                        ) : (
                                            <div key={i} className="w-6 h-6 rounded bg-[#1E3A5F]" />
                                        )
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 레드팀 */}
                <div className={`
          rounded-xl overflow-hidden border
          ${redTeam?.win ? 'border-[#E84057]/50' : 'border-[#1E3A5F]'}
        `}>
                    <div className={`
            px-4 py-3 flex items-center justify-between
            ${redTeam?.win
                            ? 'bg-[#E84057]/20'
                            : 'bg-[#0D1B2A]'
                        }
          `}>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-[#E84057]" />
                            <span className="font-semibold text-[#E84057]">레드팀</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                            <span className="text-[#F0F0F0]">{redTeam?.totalKills} 킬</span>
                            <span className="text-[#8B8B8B]">{redTeam?.totalObjectives} 오브젝트</span>
                        </div>
                    </div>
                    <div className="bg-[#0D1B2A]">
                        {redPlayers.map((player, idx) => (
                            <div
                                key={idx}
                                className="flex items-center gap-3 px-4 py-3 border-b border-[#1E3A5F] last:border-b-0 hover:bg-[#112240] transition-colors"
                            >
                                <img
                                    src={getChampionIconUrl(player.championName)}
                                    alt={player.championName}
                                    className="w-10 h-10 rounded-full border border-[#1E3A5F]"
                                />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-[#F0F0F0] truncate">
                                        {player.playerName}
                                    </p>
                                    <p className="text-xs text-[#8B8B8B]">{player.championName}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-semibold">
                                        <span className="text-[#F0F0F0]">{player.kills}</span>
                                        <span className="text-[#5B5B5B]">/</span>
                                        <span className="text-[#E84057]">{player.deaths}</span>
                                        <span className="text-[#5B5B5B]">/</span>
                                        <span className="text-[#00C8FF]">{player.assists}</span>
                                    </p>
                                </div>
                                <div className="text-right text-xs text-[#8B8B8B] w-16">
                                    <p>{player.cs} CS</p>
                                    <p>{player.goldEarned.toLocaleString()} G</p>
                                </div>
                                <div className="flex gap-0.5">
                                    {player.finalItems.slice(0, 6).map((itemId, i) => (
                                        itemId > 0 ? (
                                            <img
                                                key={i}
                                                src={getItemIconUrl(itemId)}
                                                alt={`Item ${itemId}`}
                                                className="w-6 h-6 rounded"
                                            />
                                        ) : (
                                            <div key={i} className="w-6 h-6 rounded bg-[#1E3A5F]" />
                                        )
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* AI 분석 */}
            <div>
                <div className="section-header">
                    <svg className="w-5 h-5 text-[#C8AA6E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    <h2 className="section-title">AI 경기 분석</h2>
                </div>

                <AnalysisCard
                    analysis={isAnalysisError ? null : analysis}
                    isLoading={isLoadingAnalysis}
                    onCreateAnalysis={() => createAnalysisMutation.mutate()}
                    onRegenerateAnalysis={analysis ? () => regenerateAnalysisMutation.mutate() : undefined}
                    isCreating={createAnalysisMutation.isPending}
                />
            </div>

            {/* 하이라이트 */}
            <div>
                <div className="section-header">
                    <svg className="w-5 h-5 text-[#00C8FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <h2 className="section-title">하이라이트</h2>
                </div>

                {isLoadingHighlights ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="aspect-video bg-[#0D1B2A] rounded-lg animate-pulse" />
                        ))}
                    </div>
                ) : highlightsData?.content.length === 0 ? (
                    <div className="text-center py-12 bg-[#0D1B2A] rounded-xl border border-[#1E3A5F]">
                        <svg className="w-16 h-16 mx-auto mb-4 text-[#1E3A5F]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        <h3 className="text-lg font-semibold text-[#F0F0F0] mb-2">
                            하이라이트가 없습니다
                        </h3>
                        <p className="text-sm text-[#8B8B8B]">
                            이 경기의 하이라이트가 아직 등록되지 않았습니다.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {highlightsData?.content.map((highlight) => (
                            <HighlightCard
                                key={highlight.id}
                                highlight={highlight}
                                onClick={() => setSelectedHighlight(highlight)}
                            />
                        ))}
                    </div>
                )}
            </div>

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

export default MatchDetailPage;
