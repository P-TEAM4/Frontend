import { useEffect, useRef } from 'react';
import fixWebmDuration from 'fix-webm-duration';
import { createHighlight } from '../api/highlights';
import { getMatchAnalysis } from '../api/analyses';

const isElectron = typeof window !== 'undefined' && !!(window as any).require;

export function useGameRecorder() {
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const streamRef = useRef<MediaStream | null>(null);
    const recordingStartTimeRef = useRef<number>(0);

    useEffect(() => {
        if (!isElectron) return;

        const { ipcRenderer } = (window as any).require('electron');

        const startRecording = async () => {
            if (mediaRecorderRef.current?.state === 'recording') {
                console.warn('[Recorder] Already recording, skipping duplicate start');
                return;
            }
            try {
                console.log('[Recorder] Game started — beginning screen capture');
                const sources: { id: string; name: string }[] = await ipcRenderer.invoke('get-screen-sources');
                console.log('[Recorder] Available sources:', sources.map((s) => s.name));
                const LOL_NAMES = ['league of legends', 'league_client', '리그 오브 레전드'];
                const source =
                    sources.find((s) => LOL_NAMES.some((n) => s.name.toLowerCase().includes(n))) ??
                    sources.find((s) => s.name.toLowerCase().includes('screen')) ??
                    sources.find((s) => s.id.startsWith('screen:')) ??
                    sources[0];
                if (!source) {
                    console.error('[Recorder] No screen source found — sources list was empty');
                    return;
                }
                console.log('[Recorder] Capturing source:', source.name);

                const stream = await navigator.mediaDevices.getUserMedia({
                    audio: false,
                    video: {
                        mandatory: {
                            chromeMediaSource: 'desktop',
                            chromeMediaSourceId: source.id,
                            minWidth: 1280,
                            maxWidth: 1920,
                            minHeight: 720,
                            maxHeight: 1080,
                        },
                    } as any,
                });

                streamRef.current = stream;
                chunksRef.current = [];

                const mediaRecorder = new MediaRecorder(stream, {
                    mimeType: 'video/webm;codecs=vp8',
                    videoBitsPerSecond: 2_500_000, // 2.5 Mbps
                });

                mediaRecorder.ondataavailable = (e) => {
                    if (e.data.size > 0) chunksRef.current.push(e.data);
                };

                mediaRecorder.start(1000); // 1초마다 chunk 수집
                mediaRecorderRef.current = mediaRecorder;
                recordingStartTimeRef.current = Date.now();
                ipcRenderer.send('set-recording-state', true);
                console.log('[Recorder] Recording started');
            } catch (err) {
                console.error('[Recorder] Failed to start recording:', err);
            }
        };

        const stopRecording = (): Promise<File | null> => {
            return new Promise((resolve) => {
                const recorder = mediaRecorderRef.current;
                if (!recorder || recorder.state === 'inactive') {
                    resolve(null);
                    return;
                }

                recorder.onstop = async () => {
                    ipcRenderer.send('set-recording-state', false);
                    const duration = Date.now() - recordingStartTimeRef.current;
                    const rawBlob = new Blob(chunksRef.current, { type: 'video/webm' });
                    const fixedBlob = await fixWebmDuration(rawBlob, duration);
                    const filename = `game_${Date.now()}.webm`;
                    const file = new File([fixedBlob], filename, { type: 'video/webm' });
                    chunksRef.current = [];
                    resolve(file);
                };

                recorder.stop();
                streamRef.current?.getTracks().forEach((t) => t.stop());
                streamRef.current = null;
                mediaRecorderRef.current = null;
            });
        };

        const gameStartOffsetRef = { current: 0 };

        const handleGameStarted = (_: any, { matchId, gameStartOffset }: { matchId: string | null; gameStartOffset?: number }) => {
            console.log('[Recorder] Game started, matchId:', matchId, 'gameStartOffset:', gameStartOffset);
            gameStartOffsetRef.current = gameStartOffset ?? 0;
            startRecording();
        };

        const handleGameEnded = async (_: any, { matchId }: { matchId: string | null }) => {
            console.log('[Recorder] Game ended, matchId:', matchId);
            const videoFile = await stopRecording();

            if (videoFile) {
                const arrayBuffer = await videoFile.arrayBuffer();
                ipcRenderer.invoke('save-video', { buffer: arrayBuffer, filename: videoFile.name })
                    .then((filePath: string) => console.log('[Recorder] Video saved:', filePath))
                    .catch((err: Error) => console.error('[Recorder] Failed to save video:', err));
            }

            if (!matchId) {
                console.warn('[Recorder] No matchId — skipping API calls');
                return;
            }

            // 경기 분석 요청 (비동기, 결과 대기 불필요)
            getMatchAnalysis(matchId)
                .then(() => console.log('[Recorder] Analysis requested for', matchId))
                .catch((err) => console.error('[Recorder] Analysis request failed:', err));

            // 하이라이트 생성 요청 (영상 포함)
            if (videoFile) {
                const offset = gameStartOffsetRef.current;
                console.log(`[Recorder] Uploading video (${(videoFile.size / 1024 / 1024).toFixed(1)} MB), gameStartOffset: ${offset}s`);
                createHighlight(matchId, videoFile, offset)
                    .then(() => console.log('[Recorder] Highlight requested for', matchId))
                    .catch((err) => console.error('[Recorder] Highlight request failed:', err));
            }
        };

        ipcRenderer.on('game-started', handleGameStarted);
        ipcRenderer.on('game-ended', handleGameEnded);

        return () => {
            ipcRenderer.removeListener('game-started', handleGameStarted);
            ipcRenderer.removeListener('game-ended', handleGameEnded);
            // 언마운트 시 녹화 중이면 중지
            if (mediaRecorderRef.current?.state !== 'inactive') {
                mediaRecorderRef.current?.stop();
            }
            streamRef.current?.getTracks().forEach((t) => t.stop());
        };
    }, []);
}
