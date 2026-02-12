// src/pages/DashboardPage.tsx
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../store/authStore';
import { getMatches } from '../api/matches';
import { getPlayerHighlights } from '../api/highlights';
import MatchCard from '../components/matches/MatchCard';
import Button from '../components/common/Button';
import { formatRelativeTime } from '../types/api';

const DashboardPage: React.FC = () => {
    const navigate = useNavigate();
    const user = useUser();

    // 최근 경기 조회 (연동된 경우만)
    const { data: recentMatches, isLoading: isLoadingMatches } = useQuery({
        queryKey: ['recentMatches', user?.summonerName, user?.tagLine],
        queryFn: () =>
            getMatches({
                gameName: user!.summonerName!,
                tagLine: user!.tagLine!,
                page: 0,
                size: 5,
            }),
        enabled: !!user?.summonerName && !!user?.tagLine,
        staleTime: 2 * 60 * 1000,
    });

    const puuid = user?.puuid || '';

    // 최근 하이라이트 조회 (연동된 경우만)
    const { data: highlightsData, isLoading: isLoadingHighlights } = useQuery({
        queryKey: ['recentHighlights', puuid],
        queryFn: () => getPlayerHighlights(puuid, 0, 3),
        enabled: !!puuid,
        staleTime: 2 * 60 * 1000,
    });

    // AI 분석 더미 데이터 (추후 실제 API 연결)
    const aiAnalysis = {
        winRate: user?.winRate || 0,
        kda: user?.averageKda || 0,
        mainPosition: 'Jungle',
        feedback: [
            "초반 갱킹 성공률이 75%로 매우 높습니다.",
            "후반 시야 점수가 평균 대비 20% 낮습니다. 와드를 더 적극적으로 구매하세요.",
            "리 신 플레이 시 Q 적중률이 상승세입니다."
        ]
    };

    const highlights = highlightsData?.content || [];

    if (!user) {
        return (
            <div className="flex items-center justify-center min-h-screen text-[#8B8B8B]">
                사용자 정보를 불러오는 중입니다...
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* 상단: AI 분석 요약 & 프로필 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 1. 프로필 & 요약 */}
                <div className="lg:col-span-1 rounded-xl bg-[#0D1B2A] border border-[#1E3A5F] p-6">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#1E3A5F] to-[#0D1B2A] flex items-center justify-center border-2 border-[#C8AA6E]">
                            <span className="text-3xl font-bold text-[#C8AA6E]">
                                {user.name?.charAt(0) || 'U'}
                            </span>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">{user.name}</h2>
                            <div className="text-[#00C8FF] font-semibold text-sm">
                                {user.summonerName ? `${user.summonerName} #${user.tagLine}` : 'KR1'}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="bg-[#1C1C1F] p-4 rounded-lg">
                            <div className="text-sm text-[#8B8B8B] mb-1">예상 승률</div>
                            <div className="text-3xl font-bold text-[#00C8FF]">{aiAnalysis.winRate}%</div>
                            <div className="w-full h-2 bg-gray-700 rounded-full mt-2 overflow-hidden">
                                <div className="h-full bg-[#00C8FF]" style={{ width: `${aiAnalysis.winRate}%` }}></div>
                            </div>
                        </div>
                        <div className="bg-[#1C1C1F] p-4 rounded-lg">
                            <div className="text-sm text-[#8B8B8B] mb-1">최근 KDA</div>
                            <div className="text-2xl font-bold text-white">{aiAnalysis.kda}</div>
                        </div>
                    </div>
                </div>

                {/* 2. AI 코칭 인사이트 */}
                <div className="lg:col-span-2 rounded-xl bg-gradient-to-br from-[#0D1B2A] to-[#1E3A5F]/20 border border-[#1E3A5F] p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <svg className="w-32 h-32 text-[#00C8FF]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z" /></svg>
                    </div>
                    <h3 className="text-lg font-bold text-[#00C8FF] mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        AI 코칭 분석
                    </h3>
                    <div className="space-y-3">
                        {aiAnalysis.feedback.map((text, idx) => (
                            <div key={idx} className="flex items-start gap-3 bg-[#0D1B2A]/50 p-3 rounded border border-[#1E3A5F]/50">
                                <span className="text-[#C8AA6E] font-bold text-lg">{idx + 1}</span>
                                <p className="text-[#F0F0F0] text-sm leading-relaxed">{text}</p>
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 text-right">
                        <Button variant="ghost" size="sm" className="text-[#00C8FF] hover:text-white">상세 분석 보기 &rarr;</Button>
                    </div>
                </div>
            </div>

            {/* 중단: 내 하이라이트 */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <svg className="w-5 h-5 text-[#C8AA6E]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                        내 하이라이트
                    </h2>
                    <Button variant="ghost" size="sm" onClick={() => navigate('/highlights')}>더보기</Button>
                </div>

                {!puuid ? (
                    <div className="text-center py-8 bg-[#0D1B2A] rounded-xl border border-[#1E3A5F]">
                        <p className="text-[#8B8B8B]">
                            Riot 계정을 연동하면 하이라이트를 볼 수 있습니다.
                        </p>
                        <Button variant="ghost" size="sm" className="mt-2" onClick={() => navigate('/highlights')}>
                            계정 연동하기
                        </Button>
                    </div>
                ) : isLoadingHighlights ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="aspect-video bg-[#0D1B2A] rounded-lg animate-pulse" />
                        ))}
                    </div>
                ) : highlights.length === 0 ? (
                    <div className="text-center py-8 bg-[#0D1B2A] rounded-xl border border-[#1E3A5F]">
                        <p className="text-[#8B8B8B]">아직 하이라이트가 없습니다.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {highlights.map((highlight) => (
                            <div key={highlight.id} className="group relative rounded-lg overflow-hidden border border-[#1E3A5F] bg-[#0D1B2A] cursor-pointer hover:border-[#C8AA6E] transition-all">
                                <div className="aspect-video relative">
                                    <img
                                        src={highlight.thumbnailUrl || 'https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Teemo_0.jpg'}
                                        alt={highlight.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                        <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                                        </div>
                                    </div>
                                    <span className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-0.5 rounded">
                                        {Math.floor(highlight.duration / 60)}:{(highlight.duration % 60).toString().padStart(2, '0')}
                                    </span>
                                </div>
                                <div className="p-3">
                                    <h3 className="font-bold text-white text-sm truncate">{highlight.title}</h3>
                                    <p className="text-xs text-[#8B8B8B] mt-1">{formatRelativeTime(highlight.createdAt)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* 하단: 최근 경기 */}
            <div>
                <div className="section-header">
                    <svg className="w-5 h-5 text-[#00C8FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h2 className="section-title">최근 경기</h2>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate('/matches')}
                        className="ml-auto"
                    >
                        전체보기
                    </Button>
                </div>

                {!user?.summonerName ? (
                    <div className="text-center py-12 bg-[#0D1B2A] rounded-xl border border-[#1E3A5F]">
                        <p className="text-[#8B8B8B]">
                            전적 페이지에서 소환사를 검색하여 최근 경기를 확인하세요.
                        </p>
                    </div>
                ) : isLoadingMatches ? (
                    <div className="space-y-3">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="h-20 bg-[#0D1B2A] rounded-lg animate-pulse" />
                        ))}
                    </div>
                ) : recentMatches?.content.length === 0 ? (
                    <div className="text-center py-12 bg-[#0D1B2A] rounded-xl border border-[#1E3A5F]">
                        <p className="text-[#8B8B8B]">최근 경기 기록이 없습니다.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {recentMatches?.content.map((match) => (
                            <MatchCard key={match.id} match={match} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default DashboardPage;
