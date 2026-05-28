import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createHighlight, getHighlight } from '../api/highlights';
import { createAnalysis, getAnalysis } from '../api/analyses';

type Status = 'idle' | 'loading' | 'polling' | 'success' | 'error';

const POLL_INTERVAL = 3000;
const MAX_POLLS = 40;

const AdminPage: React.FC = () => {
    const [matchId, setMatchId] = useState('');
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [highlightStatus, setHighlightStatus] = useState<Status>('idle');
    const [analysisStatus, setAnalysisStatus] = useState<Status>('idle');
    const [highlightResult, setHighlightResult] = useState<string>('');
    const [analysisResult, setAnalysisResult] = useState<string>('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const pollCountRef = useRef(0);

    const stopPolling = useCallback(() => {
        if (pollTimerRef.current) {
            clearTimeout(pollTimerRef.current);
            pollTimerRef.current = null;
        }
    }, []);

    useEffect(() => () => stopPolling(), [stopPolling]);

    const pollAnalysisStatus = useCallback((analysisId: number) => {
        let count = 0;
        const poll = async () => {
            count++;
            try {
                const updated = await getAnalysis(analysisId);
                if (updated.status === 'COMPLETED') {
                    setAnalysisStatus('success');
                    setAnalysisResult(JSON.stringify(updated, null, 2));
                } else if (updated.status === 'FAILED') {
                    setAnalysisStatus('error');
                    setAnalysisResult(JSON.stringify(updated, null, 2));
                } else if (count >= MAX_POLLS) {
                    setAnalysisStatus('error');
                    setAnalysisResult('타임아웃: AI 분석이 너무 오래 걸리고 있습니다.');
                } else {
                    setTimeout(poll, POLL_INTERVAL);
                }
            } catch {
                setAnalysisStatus('error');
                setAnalysisResult('폴링 중 오류 발생');
            }
        };
        setTimeout(poll, POLL_INTERVAL);
    }, []);

    const pollHighlightStatus = useCallback((highlightId: number) => {
        stopPolling();
        pollCountRef.current = 0;

        const poll = async () => {
            pollCountRef.current++;
            try {
                const updated = await getHighlight(highlightId);
                if (updated.status === 'COMPLETED') {
                    setHighlightStatus('success');
                    setHighlightResult(JSON.stringify(updated, null, 2));
                } else if (updated.status === 'FAILED') {
                    setHighlightStatus('error');
                    setHighlightResult(JSON.stringify(updated, null, 2));
                } else if (pollCountRef.current >= MAX_POLLS) {
                    setHighlightStatus('error');
                    setHighlightResult('타임아웃: AI 처리가 너무 오래 걸리고 있습니다.');
                } else {
                    pollTimerRef.current = setTimeout(poll, POLL_INTERVAL);
                }
            } catch {
                setHighlightStatus('error');
                setHighlightResult('폴링 중 오류 발생');
            }
        };

        pollTimerRef.current = setTimeout(poll, POLL_INTERVAL);
    }, [stopPolling]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] ?? null;
        setVideoFile(file);
    };

    const handleSubmit = async () => {
        if (!matchId.trim()) {
            alert('매치 ID를 입력해주세요.');
            return;
        }
        if (!videoFile) {
            alert('영상 파일을 선택해주세요.');
            return;
        }

        stopPolling();
        setHighlightStatus('loading');
        setAnalysisStatus('loading');
        setHighlightResult('');
        setAnalysisResult('');

        const highlightPromise = createHighlight(matchId.trim(), videoFile)
            .then((res) => {
                if (res.status === 'PENDING' || res.status === 'PROCESSING') {
                    setHighlightStatus('polling');
                    setHighlightResult(JSON.stringify(res, null, 2));
                    pollHighlightStatus(res.id);
                } else if (res.status === 'COMPLETED') {
                    setHighlightStatus('success');
                    setHighlightResult(JSON.stringify(res, null, 2));
                } else {
                    setHighlightStatus('error');
                    setHighlightResult(JSON.stringify(res, null, 2));
                }
            })
            .catch((err) => {
                setHighlightStatus('error');
                setHighlightResult(err?.message ?? String(err));
            });

        const analysisPromise = createAnalysis(matchId.trim())
            .then((res) => {
                if (res.status === 'PENDING' || res.status === 'PROCESSING') {
                    setAnalysisStatus('polling');
                    setAnalysisResult(JSON.stringify(res, null, 2));
                    pollAnalysisStatus(res.id);
                } else if (res.status === 'COMPLETED') {
                    setAnalysisStatus('success');
                    setAnalysisResult(JSON.stringify(res, null, 2));
                } else {
                    setAnalysisStatus('error');
                    setAnalysisResult(JSON.stringify(res, null, 2));
                }
            })
            .catch((err) => {
                setAnalysisStatus('error');
                setAnalysisResult(err?.message ?? String(err));
            });

        await Promise.allSettled([highlightPromise, analysisPromise]);
    };

    const statusBadge = (status: Status) => {
        const map: Record<Status, string> = {
            idle: 'bg-[#1E3A5F] text-[#8B8B8B]',
            loading: 'bg-yellow-900/40 text-yellow-400',
            polling: 'bg-blue-900/40 text-blue-400',
            success: 'bg-green-900/40 text-green-400',
            error: 'bg-red-900/40 text-red-400',
        };
        const label: Record<Status, string> = {
            idle: '대기',
            loading: '요청 중...',
            polling: '작업 중...',
            success: '완료',
            error: '실패',
        };
        return (
            <span className={`text-xs px-2 py-0.5 rounded font-medium ${map[status]}`}>
                {label[status]}
            </span>
        );
    };

    return (
        <div className="max-w-2xl mx-auto py-10 space-y-6">
            <h1 className="text-2xl font-bold text-[#C8AA6E]">관리자 테스트</h1>

            <div className="space-y-4 p-6 rounded-lg bg-[#0D1B2A] border border-[#1E3A5F]">
                <div>
                    <label className="block text-sm text-[#A0A0A0] mb-1">매치 ID</label>
                    <input
                        type="text"
                        value={matchId}
                        onChange={(e) => setMatchId(e.target.value)}
                        placeholder="예: KR_12345678"
                        className="w-full px-3 py-2 rounded bg-[#050816] border border-[#1E3A5F] text-[#F0F0F0] text-sm focus:outline-none focus:border-[#00C8FF]"
                    />
                </div>

                <div>
                    <label className="block text-sm text-[#A0A0A0] mb-1">영상 파일 (.webm)</label>
                    <div
                        className="flex items-center gap-3 px-3 py-2 rounded bg-[#050816] border border-[#1E3A5F] cursor-pointer hover:border-[#00C8FF] transition-colors"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <span className="text-sm text-[#A0A0A0]">
                            {videoFile ? videoFile.name : '파일 선택...'}
                        </span>
                        {videoFile && (
                            <span className="ml-auto text-xs text-[#5B5B5B]">
                                {(videoFile.size / 1024 / 1024).toFixed(1)} MB
                            </span>
                        )}
                    </div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".webm,video/*"
                        onChange={handleFileChange}
                        className="hidden"
                    />
                </div>

                <button
                    onClick={handleSubmit}
                    disabled={highlightStatus === 'loading' || highlightStatus === 'polling' || analysisStatus === 'loading' || analysisStatus === 'polling'}
                    className="w-full py-2 rounded bg-[#1E3A5F] text-[#00C8FF] font-medium hover:bg-[#2A4A70] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    경기 분석 + 하이라이트 생성 요청
                </button>
            </div>

            <div className="space-y-4">
                <div className="p-4 rounded-lg bg-[#0D1B2A] border border-[#1E3A5F]">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium text-[#F0F0F0]">하이라이트 생성</span>
                        {statusBadge(highlightStatus)}
                        {highlightStatus === 'polling' && (
                            <span className="text-xs text-[#5B5B5B]">
                                AI 처리 중... ({pollCountRef.current * 3}초 경과)
                            </span>
                        )}
                    </div>
                    {highlightResult && (
                        <pre className="text-xs text-[#A0A0A0] overflow-auto max-h-48 bg-[#050816] p-3 rounded">
                            {highlightResult}
                        </pre>
                    )}
                </div>

                <div className="p-4 rounded-lg bg-[#0D1B2A] border border-[#1E3A5F]">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium text-[#F0F0F0]">경기 분석</span>
                        {statusBadge(analysisStatus)}
                    </div>
                    {analysisResult && (
                        <pre className="text-xs text-[#A0A0A0] overflow-auto max-h-48 bg-[#050816] p-3 rounded">
                            {analysisResult}
                        </pre>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminPage;
