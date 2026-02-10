// src/components/highlights/HighlightCard.tsx
import React from 'react';
import type { HighlightResponse, HighlightType } from '../../types/api';
import { formatRelativeTime } from '../../types/api';

interface HighlightCardProps {
    highlight: HighlightResponse;
    onClick: () => void;
}

const typeConfig: Record<HighlightType, { label: string; color: string; icon: string }> = {
    KILL: {
        label: '킬',
        color: 'bg-[#E84057]/20 text-[#E84057] border-[#E84057]',
        icon: '⚔️'
    },
    MULTI_KILL: {
        label: '멀티킬',
        color: 'bg-[#FF6B35]/20 text-[#FF6B35] border-[#FF6B35]',
        icon: '🔥'
    },
    PENTAKILL: {
        label: '펜타킬',
        color: 'bg-[#C8AA6E]/20 text-[#C8AA6E] border-[#C8AA6E]',
        icon: '⭐'
    },
    BARON: {
        label: '바론',
        color: 'bg-[#9932CC]/20 text-[#9932CC] border-[#9932CC]',
        icon: '👾'
    },
    DRAGON: {
        label: '드래곤',
        color: 'bg-[#FF6B35]/20 text-[#FF6B35] border-[#FF6B35]',
        icon: '🐉'
    },
    TOWER_DESTROY: {
        label: '타워',
        color: 'bg-[#00C8FF]/20 text-[#00C8FF] border-[#00C8FF]',
        icon: '🗼'
    },
    TEAM_FIGHT: {
        label: '팀파이트',
        color: 'bg-[#28A0F0]/20 text-[#28A0F0] border-[#28A0F0]',
        icon: '💥'
    },
    CUSTOM: {
        label: '기타',
        color: 'bg-[#8B8B8B]/20 text-[#8B8B8B] border-[#8B8B8B]',
        icon: '🎮'
    },
};

const HighlightCard: React.FC<HighlightCardProps> = ({ highlight, onClick }) => {
    const config = typeConfig[highlight.type] || typeConfig.CUSTOM;

    return (
        <div
            onClick={onClick}
            className="group relative cursor-pointer rounded-lg overflow-hidden bg-[#0D1B2A] border border-[#1E3A5F] transition-all duration-300 hover:border-[#00C8FF] hover:shadow-[0_0_20px_rgba(0,200,255,0.2)]"
        >
            {/* 썸네일 */}
            <div className="relative aspect-video bg-[#050816] overflow-hidden">
                {highlight.thumbnailUrl ? (
                    <img
                        src={highlight.thumbnailUrl}
                        alt={highlight.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#0D1B2A] to-[#050816]">
                        <svg className="w-16 h-16 text-[#1E3A5F]" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                    </div>
                )}

                {/* 재생 오버레이 */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-[#00C8FF]/90 flex items-center justify-center opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 transition-all duration-300 shadow-[0_0_30px_rgba(0,200,255,0.5)]">
                        <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                        </svg>
                    </div>
                </div>

                {/* 재생 시간 */}
                <div className="absolute bottom-2 right-2 px-2 py-1 rounded bg-black/70 text-xs text-white font-medium">
                    {Math.floor(highlight.duration / 60)}:{(highlight.duration % 60).toString().padStart(2, '0')}
                </div>

                {/* 타입 뱃지 */}
                <div className={`absolute top-2 left-2 px-2 py-1 rounded text-xs font-bold border ${config.color}`}>
                    <span className="mr-1">{config.icon}</span>
                    {config.label}
                </div>

                {/* 상태 표시 */}
                {highlight.status === 'PROCESSING' && (
                    <div className="absolute inset-0 bg-[#050816]/80 flex items-center justify-center backdrop-blur-sm">
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-8 h-8 border-2 border-[#00C8FF] border-t-transparent rounded-full animate-spin" />
                            <span className="text-sm text-[#8B8B8B]">처리 중...</span>
                        </div>
                    </div>
                )}
            </div>

            {/* 정보 */}
            <div className="p-3">
                <h3 className="text-sm font-semibold text-[#F0F0F0] truncate group-hover:text-[#00C8FF] transition-colors">
                    {highlight.title}
                </h3>
                {highlight.description && (
                    <p className="text-xs text-[#8B8B8B] mt-1 line-clamp-2">
                        {highlight.description}
                    </p>
                )}
                <div className="flex items-center justify-between mt-2 text-xs text-[#5B5B5B]">
                    <span>{formatRelativeTime(highlight.createdAt)}</span>
                    <span className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        {highlight.viewCount.toLocaleString()}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default HighlightCard;
