// src/components/highlights/HighlightModal.tsx
import React, { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { HighlightResponse } from '../../types/api';
import { incrementViewCount } from '../../api/highlights';
import { getMatchAnalysis } from '../../api/analyses';

interface HighlightModalProps {
    highlight: HighlightResponse;
    onClose: () => void;
}

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
                <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, backgroundColor: color }}
                />
            </div>
        </div>
    );
};

const HighlightModal: React.FC<HighlightModalProps> = ({ highlight, onClose }) => {
    const modalRef = useRef<HTMLDivElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);

    const { data: analysis } = useQuery({
        queryKey: ['matchAnalysis', highlight.matchId],
        queryFn: () => getMatchAnalysis(highlight.matchId),
        retry: false,
        staleTime: 1000 * 60 * 5,
    });

    useEffect(() => {
        incrementViewCount(highlight.id).catch(console.error);
    }, [highlight.id]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleKeyDown);
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'unset';
        };
    }, [onClose]);

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === modalRef.current) onClose();
    };

    const hasAnalysis = analysis?.status === 'COMPLETED' && (
        analysis.strengthAnalysis || analysis.weaknessAnalysis || analysis.improvementSuggestions || analysis.scores
    );

    return (
        <div
            ref={modalRef}
            onClick={handleBackdropClick}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fadeIn overflow-y-auto py-4"
        >
            <div className="relative w-full max-w-2xl mx-4 bg-[#0D1B2A] rounded-xl border border-[#1E3A5F] shadow-[0_0_50px_rgba(0,200,255,0.2)] animate-scaleIn">
                {/* 헤더 */}
                <div className="flex items-center justify-between p-4 border-b border-[#1E3A5F]">
                    <div>
                        <h2 className="text-lg font-bold text-[#F0F0F0]">{highlight.title}</h2>
                        {highlight.description && (
                            <p className="text-sm text-[#8B8B8B] mt-1">{highlight.description}</p>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg text-[#8B8B8B] hover:text-[#F0F0F0] hover:bg-[#1E3A5F] transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* 비디오 플레이어 */}
                <div className="relative aspect-video bg-black">
                    {highlight.videoUrl ? (
                        <video
                            ref={videoRef}
                            src={highlight.videoUrl}
                            controls
                            autoPlay
                            className="w-full h-full"
                            onError={() => console.error('Video load error')}
                        >
                            <source src={highlight.videoUrl} type="video/mp4" />
                            브라우저가 비디오 재생을 지원하지 않습니다.
                        </video>
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-[#8B8B8B]">
                            <svg className="w-20 h-20 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            <p className="text-lg font-medium">비디오를 불러올 수 없습니다</p>
                            <p className="text-sm mt-2">처리가 완료되면 재생할 수 있습니다</p>
                        </div>
                    )}
                </div>

                {/* 푸터 정보 */}
                <div className="p-4 flex items-center justify-between text-sm text-[#8B8B8B] border-t border-[#1E3A5F]">
                    <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {highlight.duration}초
                        </span>
                        <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            {(highlight.viewCount + 1).toLocaleString()} 조회
                        </span>
                    </div>
                    <div className="text-xs">
                        게임 내 시간: {Math.floor(highlight.startTime / 60)}:{(highlight.startTime % 60).toString().padStart(2, '0')} - {Math.floor(highlight.endTime / 60)}:{(highlight.endTime % 60).toString().padStart(2, '0')}
                    </div>
                </div>

                {/* 경기 분석 섹션 */}
                {hasAnalysis && (
                    <div className="p-4 border-t border-[#1E3A5F] space-y-4">
                        <h3 className="text-sm font-bold text-[#C8AA6E] flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            경기 분석
                        </h3>

                        {/* 점수 */}
                        {analysis!.scores && (
                            <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                                <ScoreBar label="영향력" value={analysis!.scores.impactScore} />
                                <ScoreBar label="팀파이트" value={analysis!.scores.teamFightScore} />
                                <ScoreBar label="파밍" value={analysis!.scores.farmingScore} />
                                <ScoreBar label="시야" value={analysis!.scores.visionScore} />
                                <ScoreBar label="오브젝트" value={analysis!.scores.objectiveControlScore} />
                                <ScoreBar label="종합" value={analysis!.scores.averageScore} />
                            </div>
                        )}

                        {/* 텍스트 분석 */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                            {analysis!.strengthAnalysis && (
                                <div className="bg-[#112240] rounded-lg p-3 border border-[#6BCF7F]/30">
                                    <div className="text-[#6BCF7F] font-semibold mb-1">강점</div>
                                    <p className="text-[#A0A0A0] leading-relaxed">{analysis!.strengthAnalysis}</p>
                                </div>
                            )}
                            {analysis!.weaknessAnalysis && (
                                <div className="bg-[#112240] rounded-lg p-3 border border-[#E84057]/30">
                                    <div className="text-[#E84057] font-semibold mb-1">약점</div>
                                    <p className="text-[#A0A0A0] leading-relaxed">{analysis!.weaknessAnalysis}</p>
                                </div>
                            )}
                            {analysis!.improvementSuggestions && (
                                <div className="bg-[#112240] rounded-lg p-3 border border-[#C8AA6E]/30">
                                    <div className="text-[#C8AA6E] font-semibold mb-1">개선점</div>
                                    <p className="text-[#A0A0A0] leading-relaxed">{analysis!.improvementSuggestions}</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out;
        }
      `}</style>
        </div>
    );
};

export default HighlightModal;
