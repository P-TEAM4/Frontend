import React, { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getMatchDetail } from '../api/matches';
import { getChampionIconUrl, getItemIconUrl, formatGameDuration } from '../types/api';
import type { PlayerDetail } from '../types/api';
import ItemImage from '../components/common/ItemImage';

const SKILL_LABEL: Record<number, string> = { 1: 'Q', 2: 'W', 3: 'E', 4: 'R' };
const SKILL_COLOR: Record<number, string> = {
    1: 'bg-[#28A0F0] text-white',
    2: 'bg-[#6BCF7F] text-[#0D1B2A]',
    3: 'bg-[#FFD93D] text-[#0D1B2A]',
    4: 'bg-[#E84057] text-white',
};

const PlayerBuildDetail: React.FC<{ player: PlayerDetail }> = ({ player }) => {
    const itemBuilds = [...(player.itemBuild ?? [])].sort((a, b) => a.timestamp - b.timestamp);
    const skillBuild = player.skillBuild ?? [];

    return (
        <div className="px-4 pb-4 bg-[#0a1628] border-t border-[#1E3A5F] space-y-4">
            {/* 아이템 트리 */}
            {itemBuilds.length > 0 && (
                <div>
                    <p className="text-xs text-[#8B8B8B] font-semibold mt-3 mb-2">아이템 구매 순서</p>
                    <div className="flex flex-wrap gap-2 items-center">
                        {itemBuilds.map((ib, i) => (
                            <div key={i} className="flex flex-col items-center gap-0.5">
                                <div className="w-8 h-8 rounded bg-[#1E3A5F] overflow-hidden">
                                    <img
                                        src={getItemIconUrl(ib.itemId)}
                                        alt={`item ${ib.itemId}`}
                                        className="w-full h-full object-cover"
                                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                    />
                                </div>
                                <span className="text-[10px] text-[#5B5B5B]">
                                    {String(Math.floor(ib.timestamp / 60000)).padStart(2, '0')}:{String(Math.floor((ib.timestamp % 60000) / 1000)).padStart(2, '0')}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* 스킬 트리 */}
            {skillBuild.length > 0 && (
                <div>
                    <p className="text-xs text-[#8B8B8B] font-semibold mb-2">스킬 레벨업 순서</p>
                    <div className="flex flex-wrap gap-1">
                        {skillBuild.map((skill, i) => (
                            <div key={i} className="flex flex-col items-center gap-0.5">
                                <span className={`w-6 h-6 flex items-center justify-center rounded text-xs font-bold ${SKILL_COLOR[skill] ?? 'bg-[#1E3A5F] text-[#8B8B8B]'}`}>
                                    {SKILL_LABEL[skill] ?? '?'}
                                </span>
                                <span className="text-[10px] text-[#5B5B5B]">{i + 1}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

const MatchDetailPage: React.FC = () => {
    const { matchId } = useParams<{ matchId: string }>();
    const navigate = useNavigate();
    const location = useLocation();

    const [expandedPlayer, setExpandedPlayer] = useState<string | null>(null);

    React.useEffect(() => {
        window.scrollTo(0, 0);
    }, []);
    // 매치 상세 정보 조회
    const { data: matchDetail, isLoading: isLoadingDetail } = useQuery({
        queryKey: ['matchDetail', matchId],
        queryFn: () => getMatchDetail(matchId || ''),
        enabled: !!matchId,
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
                    <button
                        onClick={() => navigate((location.state as { from?: string })?.from || '/matches')}
                        className="flex items-center gap-1 text-sm text-[#8B8B8B] hover:text-[#F0F0F0] transition-colors mb-4"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        전적으로 돌아가기
                    </button>
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
                        {bluePlayers.map((player, idx) => {
                            const key = `blue-${idx}`;
                            const isExpanded = expandedPlayer === key;
                            return (
                                <div key={idx} className="border-b border-[#1E3A5F] last:border-b-0">
                                    <div
                                        onClick={() => setExpandedPlayer(isExpanded ? null : key)}
                                        className="flex items-center gap-3 px-4 py-3 hover:bg-[#112240] transition-colors cursor-pointer"
                                    >
                                        <img src={getChampionIconUrl(player.championName)} alt={player.championName} className="w-10 h-10 rounded-full border border-[#1E3A5F]" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-[#F0F0F0] truncate">{player.playerName}</p>
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
                                                    <div key={i} className="w-6 h-6 rounded bg-[#1E3A5F] overflow-hidden">
                                                        <ItemImage itemId={itemId} className="w-full h-full object-cover" alt={`Item ${itemId}`} />
                                                    </div>
                                                ) : (
                                                    <div key={i} className="w-6 h-6 rounded bg-[#1E3A5F] opacity-40" />
                                                )
                                            ))}
                                        </div>
                                        <svg className={`w-4 h-4 text-[#5B5B5B] transition-transform flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                    {isExpanded && <PlayerBuildDetail player={player} />}
                                </div>
                            );
                        })}
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
                        {redPlayers.map((player, idx) => {
                            const key = `red-${idx}`;
                            const isExpanded = expandedPlayer === key;
                            return (
                                <div key={idx} className="border-b border-[#1E3A5F] last:border-b-0">
                                    <div
                                        onClick={() => setExpandedPlayer(isExpanded ? null : key)}
                                        className="flex items-center gap-3 px-4 py-3 hover:bg-[#112240] transition-colors cursor-pointer"
                                    >
                                        <img src={getChampionIconUrl(player.championName)} alt={player.championName} className="w-10 h-10 rounded-full border border-[#1E3A5F]" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-[#F0F0F0] truncate">{player.playerName}</p>
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
                                                    <div key={i} className="w-6 h-6 rounded bg-[#1E3A5F] overflow-hidden">
                                                        <ItemImage itemId={itemId} className="w-full h-full object-cover" alt={`Item ${itemId}`} />
                                                    </div>
                                                ) : (
                                                    <div key={i} className="w-6 h-6 rounded bg-[#1E3A5F] opacity-40" />
                                                )
                                            ))}
                                        </div>
                                        <svg className={`w-4 h-4 text-[#5B5B5B] transition-transform flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                    {isExpanded && <PlayerBuildDetail player={player} />}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

        </div>
    );
};

export default MatchDetailPage;
