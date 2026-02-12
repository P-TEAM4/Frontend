// src/components/analysis/AnalysisCard.tsx
import React from 'react';
import type { AnalysisResponse } from '../../types/api';
import Button from '../common/Button';

interface AnalysisCardProps {
    analysis: AnalysisResponse | null | undefined;
    isLoading?: boolean;
    onCreateAnalysis?: () => void;
    onRegenerateAnalysis?: () => void;
    isCreating?: boolean;
}

const AnalysisCard: React.FC<AnalysisCardProps> = ({
    analysis,
    isLoading = false,
    onCreateAnalysis,
    onRegenerateAnalysis,
    isCreating = false,
}) => {
    // 분석이 없을 때
    if (!analysis && !isLoading) {
        return (
            <div className="p-6 rounded-xl bg-[#0D1B2A] border border-[#1E3A5F]">
                <div className="text-center py-8">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#1E3A5F]/50 flex items-center justify-center">
                        <svg className="w-8 h-8 text-[#8B8B8B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-[#F0F0F0] mb-2">AI 분석 없음</h3>
                    <p className="text-sm text-[#8B8B8B] mb-6">
                        이 경기에 대한 AI 분석이 아직 없습니다.<br />
                        분석을 생성하여 플레이 인사이트를 확인하세요.
                    </p>
                    {onCreateAnalysis && (
                        <Button
                            variant="primary"
                            onClick={onCreateAnalysis}
                            isLoading={isCreating}
                        >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            AI 분석 생성
                        </Button>
                    )}
                </div>
            </div>
        );
    }

    // 로딩 중
    if (isLoading) {
        return (
            <div className="p-6 rounded-xl bg-[#0D1B2A] border border-[#1E3A5F] animate-pulse">
                <div className="h-6 bg-[#1E3A5F] rounded w-1/3 mb-4" />
                <div className="space-y-3">
                    <div className="h-4 bg-[#1E3A5F] rounded w-full" />
                    <div className="h-4 bg-[#1E3A5F] rounded w-5/6" />
                    <div className="h-4 bg-[#1E3A5F] rounded w-4/6" />
                </div>
            </div>
        );
    }

    // 분석 진행 중
    if (analysis?.status === 'PENDING' || analysis?.status === 'PROCESSING') {
        return (
            <div className="p-6 rounded-xl bg-[#0D1B2A] border border-[#00C8FF]/30 shadow-[0_0_20px_rgba(0,200,255,0.1)]">
                <div className="text-center py-8">
                    <div className="w-16 h-16 mx-auto mb-4 relative">
                        <div className="absolute inset-0 rounded-full border-4 border-[#1E3A5F]" />
                        <div className="absolute inset-0 rounded-full border-4 border-[#00C8FF] border-t-transparent animate-spin" />
                    </div>
                    <h3 className="text-lg font-semibold text-[#00C8FF] mb-2">전황 분석 중...</h3>
                    <p className="text-sm text-[#8B8B8B]">
                        AI가 경기 데이터를 분석하고 있습니다.<br />
                        잠시 후 결과를 확인하실 수 있습니다.
                    </p>
                </div>
            </div>
        );
    }

    // 분석 완료
    return (
        <div className="rounded-xl bg-[#0D1B2A] border border-[#1E3A5F] overflow-hidden">
            {/* 헤더 */}
            <div className="px-6 py-4 bg-gradient-to-r from-[#1E3A5F]/50 to-transparent border-b border-[#1E3A5F] flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#00C8FF] to-[#1BA9FF] flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-[#F0F0F0]">코치 노트</h3>
                        <p className="text-xs text-[#8B8B8B]">AI 기반 경기 분석</p>
                    </div>
                </div>
                {onRegenerateAnalysis && (
                    <Button variant="ghost" size="sm" onClick={onRegenerateAnalysis}>
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        재분석
                    </Button>
                )}
            </div>

            {/* 점수 */}
            {analysis?.scores && (
                <div className="px-6 py-4 border-b border-[#1E3A5F]">
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                        {[
                            { label: '영향력', score: analysis.scores.impactScore, color: '#C8AA6E' },
                            { label: '팀파이트', score: analysis.scores.teamFightScore, color: '#E84057' },
                            { label: '파밍', score: analysis.scores.farmingScore, color: '#28A0F0' },
                            { label: '시야', score: analysis.scores.visionScore, color: '#9932CC' },
                            { label: '오브젝트', score: analysis.scores.objectiveControlScore, color: '#FF6B35' },
                            { label: '종합', score: analysis.scores.averageScore, color: '#00C8FF' },
                        ].map((item) => (
                            <div key={item.label} className="text-center">
                                <div
                                    className="text-2xl font-bold mb-1"
                                    style={{ color: item.color }}
                                >
                                    {item.score.toFixed(1)}
                                </div>
                                <div className="text-xs text-[#8B8B8B]">{item.label}</div>
                                <div className="mt-2 h-1.5 bg-[#1E3A5F] rounded-full overflow-hidden">
                                    <div
                                        className="h-full rounded-full transition-all duration-500"
                                        style={{
                                            width: `${(item.score / 10) * 100}%`,
                                            backgroundColor: item.color
                                        }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* 분석 내용 */}
            <div className="p-6 space-y-6">
                {/* 강점 */}
                {analysis?.strengthAnalysis && (
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-6 h-6 rounded-full bg-[#28A0F0]/20 flex items-center justify-center">
                                <svg className="w-4 h-4 text-[#28A0F0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h4 className="font-semibold text-[#28A0F0]">강점</h4>
                        </div>
                        <p className="text-sm text-[#A0A0A0] leading-relaxed pl-8">
                            {analysis.strengthAnalysis}
                        </p>
                    </div>
                )}

                {/* 약점 */}
                {analysis?.weaknessAnalysis && (
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-6 h-6 rounded-full bg-[#E84057]/20 flex items-center justify-center">
                                <svg className="w-4 h-4 text-[#E84057]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <h4 className="font-semibold text-[#E84057]">약점</h4>
                        </div>
                        <p className="text-sm text-[#A0A0A0] leading-relaxed pl-8">
                            {analysis.weaknessAnalysis}
                        </p>
                    </div>
                )}

                {/* 개선 제안 */}
                {analysis?.improvementSuggestions && (
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-6 h-6 rounded-full bg-[#C8AA6E]/20 flex items-center justify-center">
                                <svg className="w-4 h-4 text-[#C8AA6E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>
                            </div>
                            <h4 className="font-semibold text-[#C8AA6E]">개선 포인트</h4>
                        </div>
                        <p className="text-sm text-[#A0A0A0] leading-relaxed pl-8">
                            {analysis.improvementSuggestions}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AnalysisCard;
