// src/pages/DashboardPage.tsx
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../store/authStore';
import { getMatches } from '../api/matches';
import { getProfileIconUrl, getRankEmblemUrl } from '../types/api';
import MatchCard from '../components/matches/MatchCard';

const DashboardPage: React.FC = () => {
    const navigate = useNavigate();
    const user = useUser();

    // 최근 경기 조회
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

    if (!user) {
        return (
            <div className="flex items-center justify-center min-h-[60vh] text-[#515163]">
                <div className="spinner" />
            </div>
        );
    }

    const profileIconUrl = user.profileIconId
        ? getProfileIconUrl(user.profileIconId)
        : null;

    return (
        <div className="space-y-5 animate-fade-in-up">
            {/* 프로필 카드 */}
            <div className="bg-[#31313C] rounded-lg p-6 flex items-center gap-5">
                <div className="relative shrink-0">
                    {profileIconUrl ? (
                        <img src={profileIconUrl} alt="프로필" className="w-16 h-16 rounded-xl ring-2 ring-[#424254]" />
                    ) : (
                        <div className="w-16 h-16 rounded-xl bg-[#0AC8B9] flex items-center justify-center">
                            <span className="text-2xl font-black text-white">{user.name?.charAt(0) || 'U'}</span>
                        </div>
                    )}
                    {user.summonerLevel && (
                        <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 bg-[#282830] text-[9px] text-white font-bold px-1.5 py-0.5 rounded-full border border-[#424254]">
                            {user.summonerLevel}
                        </div>
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <h2 className="text-xl font-black text-white">{user.name}</h2>
                    {user.summonerName ? (
                        <div className="text-sm text-[#9E9EB1] mt-0.5">
                            {user.summonerName}
                            <span className="text-[#515163]">#{user.tagLine}</span>
                        </div>
                    ) : (
                        <div className="text-sm text-[#515163] mt-0.5">Riot 계정 미연동</div>
                    )}
                </div>
                <button
                    onClick={() => navigate('/matches')}
                    className="bg-[#0AC8B9] hover:bg-[#08A8A0] text-white text-xs font-bold px-5 py-2 rounded transition-colors shrink-0"
                >
                    전적 검색
                </button>
            </div>

            {/* 카드 그리드 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* 랭크 카드 */}
                <div className="bg-[#31313C] rounded-lg p-4">
                    <div className="text-[11px] text-[#515163] font-semibold uppercase tracking-wider mb-3">솔로랭크</div>
                    {user.tier ? (
                        <div className="flex items-center gap-3">
                            <img
                                src={getRankEmblemUrl(user.tier)}
                                alt={user.tier}
                                className="w-14 h-14 object-contain"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                            />
                            <div>
                                <div className="text-white font-bold text-lg">{user.tier} {user.rank}</div>
                                <div className="text-xs text-[#9E9EB1]">{user.leaguePoints} LP</div>
                                <div className="text-xs text-[#515163] mt-0.5">
                                    {user.wins ?? 0}승 {user.losses ?? 0}패
                                    <span className="text-[#0AC8B9] font-bold ml-1">
                                        {user.winRate?.toFixed(0) ?? 0}%
                                    </span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3 text-[#515163]">
                            <div className="w-14 h-14 bg-[#282830] rounded-lg flex items-center justify-center text-xs">-</div>
                            <span className="text-sm">Unranked</span>
                        </div>
                    )}
                </div>

                {/* KDA 카드 */}
                <div className="bg-[#31313C] rounded-lg p-4">
                    <div className="text-[11px] text-[#515163] font-semibold uppercase tracking-wider mb-3">시즌 평균 KDA</div>
                    <div className="text-3xl font-black text-[#0AC8B9]">
                        {user.averageKda?.toFixed(2) ?? '-'}
                        <span className="text-sm text-[#515163] font-normal ml-1">:1</span>
                    </div>
                    <div className="text-xs text-[#9E9EB1] mt-1">
                        분당 CS {user.averageCsPerMin?.toFixed(1) ?? '-'} · 시야 {user.averageVisionScore?.toFixed(0) ?? '-'}
                    </div>
                </div>

                {/* 빠른 액션 카드 */}
                <div className="bg-[#31313C] rounded-lg p-4 flex flex-col justify-between">
                    <div className="text-[11px] text-[#515163] font-semibold uppercase tracking-wider mb-3">빠른 액션</div>
                    <div className="space-y-2">
                        <button
                            onClick={() => navigate('/highlights')}
                            className="w-full bg-[#282830] hover:bg-[#424254] text-white text-xs font-semibold px-4 py-2.5 rounded flex items-center gap-2 transition-colors"
                        >
                            <svg className="w-4 h-4 text-[#E84057]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            내 하이라이트 보기
                        </button>
                        <button
                            onClick={() => navigate('/settings')}
                            className="w-full bg-[#282830] hover:bg-[#424254] text-white text-xs font-semibold px-4 py-2.5 rounded flex items-center gap-2 transition-colors"
                        >
                            <svg className="w-4 h-4 text-[#9E9EB1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            설정
                        </button>
                    </div>
                </div>
            </div>

            {/* 최근 경기 */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-bold text-white flex items-center gap-2">
                        <svg className="w-4 h-4 text-[#0AC8B9]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        최근 경기
                    </h2>
                    {user.summonerName && (
                        <button
                            onClick={() => navigate('/matches')}
                            className="text-xs text-[#515163] hover:text-[#9E9EB1] transition-colors"
                        >
                            전체보기 →
                        </button>
                    )}
                </div>

                {!user?.summonerName ? (
                    <div className="text-center py-16 bg-[#31313C] rounded-lg">
                        <svg className="w-12 h-12 mx-auto mb-3 text-[#515163]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                        <p className="text-sm text-[#515163]">Riot 계정을 연동해주세요.</p>
                        <button
                            onClick={() => navigate('/settings')}
                            className="mt-3 text-xs text-[#0AC8B9] hover:text-[#08A8A0] transition-colors font-semibold"
                        >
                            설정에서 연동하기 →
                        </button>
                    </div>
                ) : isLoadingMatches ? (
                    <div className="space-y-[2px]">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="h-[76px] bg-[#31313C] rounded-[4px] animate-pulse" />
                        ))}
                    </div>
                ) : recentMatches?.content.length === 0 ? (
                    <div className="text-center py-12 bg-[#31313C] rounded-lg text-sm text-[#515163]">
                        최근 경기 기록이 없습니다.
                    </div>
                ) : (
                    <div className="space-y-[2px]">
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
