import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { getCurrentUser } from '../api/users';
import apiClient from '../api/client';
import Button from '../components/common/Button';

const LoginPage: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { setTokens, setUser, isAuthenticated } = useAuthStore();

    // API Base URL
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://nexus-gg.kro.kr';
    const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    // URL 파라미터에 토큰이 있는지 확인
    const accessToken = searchParams.get('accessToken') || searchParams.get('token');
    const refreshToken = searchParams.get('refreshToken') || searchParams.get('refresh_token');

    useEffect(() => {
        console.log('LoginPage mounted');

        // 1. 브라우저에서 리다이렉트된 경우 (URL 파라미터에 토큰이 있음)
        if (accessToken && refreshToken) {
            console.log('Token found in URL, redirecting to app...');
            // 자동 리다이렉트 시도
            window.location.href = `nexusgg://auth/callback?accessToken=${accessToken}&refreshToken=${refreshToken}`;
        }

        // 2. 일렉트론 앱에서 실행 중인 경우 (Deep Link 수신 대기)
        const handleDeepLink = async (_event: any, url: string) => {
            console.log('Renderer received deep link:', url); // Debug log
            try {
                const urlObj = new URL(url);
                const params = new URLSearchParams(urlObj.search);
                const accessToken = params.get('accessToken');
                const refreshToken = params.get('refreshToken');

                console.log('Extracted tokens:', { accessToken: accessToken ? 'YES' : 'NO', refreshToken: refreshToken ? 'YES' : 'NO' });

                if (accessToken && refreshToken) {
                    console.log('Setting tokens and fetching user info...');
                    // 1. 토큰 먼저 저장 (API 호출 시 헤더에 포함됨)
                    useAuthStore.getState().setTokens(accessToken, refreshToken);
                    console.log('Tokens set in store. Current State:', useAuthStore.getState());

                    // Axios 인스턴스에 즉시 헤더 설정 (Store 업데이트 딜레이 방지)
                    apiClient.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
                    console.log('Forced Authorization header on apiClient');

                    try {
                        // 2. 사용자 정보 가져오기
                        const userData = await getCurrentUser();
                        console.log('User info fetched:', userData);
                        setUser(userData);

                        // 3. 모든 데이터 준비 완료 후 이동
                        console.log('Navigating to dashboard...');
                        navigate('/dashboard');
                    } catch (userError: any) {
                        console.error('Failed to fetch user info:', userError);

                        // 백엔드에서 404가 뜨더라도 토큰이 유효하다면 임시 유저로 진입 허용
                        if (
                            userError.response?.status === 404 ||
                            userError.message.includes('User not found') ||
                            userError.message.includes('사용자 정보를 불러올 수 없습니다')
                        ) {
                            console.warn('Backend returned 404 for User Info. Attempting to decode token locally as fallback.');
                            try {
                                // JWT 페이로드 디코딩
                                const payloadPart = accessToken.split('.')[1];
                                const decodedPayload = JSON.parse(atob(payloadPart));
                                const userId = parseInt(decodedPayload.sub, 10);

                                const fallbackUser = {
                                    id: userId,
                                    email: decodedPayload.email || 'unknown@nexus.gg', // 토큰에 이메일이 없을 수도 있음
                                    name: decodedPayload.name || 'Guest User',
                                    profileImage: null,
                                    riotId: null,
                                    puuid: null,
                                    summonerName: null,
                                    tagLine: null,
                                    profileIconId: null,
                                    summonerLevel: null,
                                    tier: null,
                                    rank: null,
                                    leaguePoints: null,
                                    wins: null,
                                    losses: null,
                                    winRate: null,
                                    averageKda: null,
                                    averageVisionScore: null,
                                    averageCsPerMin: null,
                                    provider: 'GOOGLE' as const,
                                    role: 'USER' as const,
                                    createdAt: new Date().toISOString()
                                };

                                console.log('Created fallback user from token:', fallbackUser);
                                setUser(fallbackUser);
                                navigate('/dashboard');
                                return;
                            } catch (decodeError) {
                                console.error('Failed to decode token for fallback:', decodeError);
                            }
                        }

                        alert('로그인 성공했으나 사용자 정보를 불러오지 못했습니다. (서버 데이터 불일치)');
                    }
                } else {
                    console.error('Tokens missing from deep link params');
                    alert('로그인 실패: 토큰을 받지 못했습니다.');
                }
            } catch (error) {
                console.error('Deep link parsing error:', error);
            }
        };

        // window.electronAPI가 있다면 사용 (preload.js 필요)
        // 현재는 preload가 없지만, nodeIntegration: true이므로 ipcRenderer 직접 사용 가능
        // @ts-ignore
        if (window.require) {
            // @ts-ignore
            const { ipcRenderer } = window.require('electron');
            ipcRenderer.on('deep-link', handleDeepLink);

            return () => {
                ipcRenderer.removeListener('deep-link', handleDeepLink);
            };
        }
    }, [setTokens, navigate, accessToken, refreshToken]);

    // 토큰이 있으면 "앱 여는 중" 화면 표시
    if (accessToken && refreshToken) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#050816] text-white">
                <h1 className="text-2xl font-bold mb-4">NEXUS.GG 앱으로 이동 중...</h1>
                <p className="mb-8 text-gray-400">앱이 열리지 않으면 아래 버튼을 눌러주세요.</p>
                <button
                    onClick={() => {
                        window.location.href = `nexusgg://auth/callback?accessToken=${accessToken}&refreshToken=${refreshToken}`;
                    }}
                    className="px-6 py-3 bg-[#C8AA6E] text-black font-bold rounded-lg hover:bg-[#A08050] transition-colors"
                >
                    앱 열기
                </button>
            </div>
        );
    }

    const handleLogin = () => {
        // API_BASE_URL이 /api를 포함하지 않을 수 있으므로 체크 (client.ts는 /api를 붙이지만 여기는 Auth URL임)
        // 보통 API_BASE_URL은 'http://localhost:8080' 형태라고 가정
        const baseUrl = API_BASE_URL.endsWith('/api')
            ? API_BASE_URL.replace('/api', '')
            : API_BASE_URL;

        const loginUrl = `${baseUrl}/oauth2/authorization/google`;

        // @ts-ignore
        if (window.require) {
            // @ts-ignore
            const { shell } = window.require('electron');
            shell.openExternal(loginUrl);
        } else {
            window.location.href = loginUrl;
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#050816] via-[#0A1428] to-[#050816] px-4">
            {/* 배경 효과 */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#00C8FF]/5 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#C8AA6E]/5 rounded-full blur-3xl" />
            </div>

            {/* 로그인 카드 */}
            <div className="relative w-full max-w-md">
                <div className="bg-[#0D1B2A]/90 backdrop-blur-lg rounded-2xl border border-[#1E3A5F] p-8 shadow-[0_0_50px_rgba(0,200,255,0.1)]">
                    {/* 로고 */}
                    <div className="text-center mb-8">
                        <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[#C8AA6E] to-[#A08050] flex items-center justify-center shadow-[0_0_30px_rgba(200,170,110,0.3)]">
                            <svg className="w-12 h-12 text-[#0A0A0A]" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                            </svg>
                        </div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-[#C8AA6E] to-[#F0E6D2] bg-clip-text text-transparent">
                            NEXUS.GG
                        </h1>
                        <p className="mt-2 text-[#8B8B8B]">
                            당신의 플레이를 분석하고 하이라이트를 기록하세요
                        </p>
                    </div>

                    {/* Google 로그인 버튼 */}
                    <div className="flex justify-center flex-col items-center gap-4">
                        <Button
                            variant="secondary"
                            size="lg"
                            className="w-full flex items-center justify-center gap-2 bg-white text-gray-900 hover:bg-gray-100"
                            onClick={handleLogin}
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path
                                    fill="currentColor"
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                />
                                <path
                                    fill="currentColor"
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                />
                                <path
                                    fill="currentColor"
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                />
                                <path
                                    fill="currentColor"
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                />
                            </svg>
                            Google로 계속하기
                        </Button>


                    </div>

                    {/* 푸터 */}
                    <p className="mt-8 text-center text-xs text-[#5B5B5B]">
                        로그인 시{' '}
                        <a href="#" className="text-[#00C8FF] hover:underline">
                            이용약관
                        </a>
                        {' '}및{' '}
                        <a href="#" className="text-[#00C8FF] hover:underline">
                            개인정보처리방침
                        </a>
                        에 동의하게 됩니다.
                    </p>

                    {/* 디버깅용: 현재 URL 표시 */}
                    <div className="mt-4 p-2 bg-black/50 text-[10px] text-gray-500 break-all rounded">
                        Debug URL: {window.location.href}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
