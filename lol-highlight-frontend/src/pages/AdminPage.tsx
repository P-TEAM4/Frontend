import React, { useState, useRef } from 'react';
import { createHighlight } from '../api/highlights';
import { getMatchAnalysis } from '../api/analyses';

type Status = 'idle' | 'loading' | 'success' | 'error';

const AdminPage: React.FC = () => {
    const [matchId, setMatchId] = useState('');
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [highlightStatus, setHighlightStatus] = useState<Status>('idle');
    const [analysisStatus, setAnalysisStatus] = useState<Status>('idle');
    const [highlightResult, setHighlightResult] = useState<string>('');
    const [analysisResult, setAnalysisResult] = useState<string>('');
    const fileInputRef = useRef<HTMLInputElement>(null);

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

        setHighlightStatus('loading');
        setAnalysisStatus('loading');
        setHighlightResult('');
        setAnalysisResult('');

        // 두 요청 동시 실행
        const highlightPromise = createHighlight(matchId.trim(), videoFile)
            .then((res) => {
                setHighlightStatus('success');
                setHighlightResult(JSON.stringify(res, null, 2));
            })
            .catch((err) => {
                setHighlightStatus('error');
                setHighlightResult(err?.message ?? String(err));
            });

        const analysisPromise = getMatchAnalysis(matchId.trim())
            .then((res) => {
                setAnalysisStatus('success');
                setAnalysisResult(JSON.stringify(res, null, 2));
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
            success: 'bg-green-900/40 text-green-400',
            error: 'bg-red-900/40 text-red-400',
        };
        const label: Record<Status, string> = {
            idle: '대기',
            loading: '요청 중...',
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
                    disabled={highlightStatus === 'loading' || analysisStatus === 'loading'}
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
