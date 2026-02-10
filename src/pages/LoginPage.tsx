import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { getCurrentUser } from '../api/users';
import apiClient from '../api/client';

const LoginPage: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { setTokens, setUser, isAuthenticated } = useAuthStore();

    const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://nexus-gg.kro.kr';

    const accessToken = searchParams.get('accessToken') || searchParams.get('token');
    const refreshToken = searchParams.get('refreshToken') || searchParams.get('refresh_token');

    useEffect(() => {
        if (accessToken && refreshToken) {
            window.location.href = `nexusgg://auth/callback?accessToken=${accessToken}&refreshToken=${refreshToken}`;
        }

        // @ts-ignore
        if (window.require) {
            // @ts-ignore
            const { ipcRenderer } = window.require('electron');

            const handleDeepLink = async (_event: any, url: string) => {
                try {
                    const urlObj = new URL(url);
                    const params = new URLSearchParams(urlObj.search);
                    const at = params.get('accessToken');
                    const rt = params.get('refreshToken');

                    if (at && rt) {
                        useAuthStore.getState().setTokens(at, rt);
                        apiClient.defaults.headers.common['Authorization'] = `Bearer ${at}`;

                        try {
                            const userData = await getCurrentUser();
                            setUser(userData);
                            navigate('/dashboard');
                        } catch (userError: any) {
                            if (
                                userError.response?.status === 404 ||
                                userError.message?.includes('User not found') ||
                                userError.message?.includes('사용자 정보를 불러올 수 없습니다')
                            ) {
                                try {
                                    const payloadPart = at.split('.')[1];
                                    const decodedPayload = JSON.parse(atob(payloadPart));
                                    const userId = parseInt(decodedPayload.sub, 10);

                                    const fallbackUser = {
                                        id: userId,
                                        email: decodedPayload.email || 'unknown@nexus.gg',
                                        name: decodedPayload.name || 'Guest User',
                                        profileImage: null,
                                        riotId: null,
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
                                        providerId: null,
                                        role: 'USER' as const,
                                        lastActivityAt: null,
                                        lastMatchRefreshAt: null,
                                        refreshCountInWindow: null,
                                        createdAt: new Date().toISOString(),
                                    };

                                    setUser(fallbackUser);
                                    navigate('/dashboard');
                                    return;
                                } catch (decodeError) {
                                    console.error('Failed to decode token:', decodeError);
                                }
                            }
                            alert('로그인 실패: 사용자 정보를 불러올 수 없습니다.');
                        }
                    }
                } catch (error) {
                    console.error('Deep link error:', error);
                }
            };

            ipcRenderer.on('deep-link', handleDeepLink);
            return () => { ipcRenderer.removeListener('deep-link', handleDeepLink); };
        }
    }, [setTokens, navigate, accessToken, refreshToken, setUser]);

    // 토큰이 있으면 앱 열기 화면
    if (accessToken && refreshToken) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#1C1C1F] text-white">
                <div className="w-10 h-10 border-3 border-[#0AC8B9] border-t-transparent rounded-full animate-spin mb-6" />
                <h1 className="text-xl font-bold mb-2">앱으로 이동 중...</h1>
                <p className="mb-6 text-sm text-[#515163]">앱이 열리지 않으면 아래 버튼을 눌러주세요.</p>
                <button
                    onClick={() => {
                        window.location.href = `nexusgg://auth/callback?accessToken=${accessToken}&refreshToken=${refreshToken}`;
                    }}
                    className="px-6 py-2.5 bg-[#0AC8B9] text-white font-bold text-sm rounded hover:bg-[#08A8A0] transition-colors"
                >
                    앱 열기
                </button>
            </div>
        );
    }

    const handleLogin = () => {
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
        <div className="min-h-screen flex items-center justify-center bg-[#1C1C1F] px-4">
            {/* 배경 효과 */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/3 left-1/3 w-[600px] h-[600px] bg-[#0AC8B9]/[0.03] rounded-full blur-[120px]" />
                <div className="absolute bottom-1/3 right-1/3 w-[400px] h-[400px] bg-[#E84057]/[0.02] rounded-full blur-[100px]" />
            </div>

            {/* 로그인 카드 */}
            <div className="relative w-full max-w-[380px] animate-fade-in-up">
                <div className="bg-[#31313C] rounded-xl border border-[#424254] p-8 shadow-2xl">
                    {/* 로고 */}
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-black text-white mb-1">
                            NEXUS<span className="text-[#0AC8B9]">.GG</span>
                        </h1>
                        <p className="text-sm text-[#515163]">
                            전적 검색 · AI 분석 · 하이라이트
                        </p>
                    </div>

                    {/* Google 로그인 */}
                    <button
                        onClick={handleLogin}
                        className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-800 font-semibold py-3 px-4 rounded-lg transition-colors text-sm"
                    >
                        <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Google로 계속하기
                    </button>

                    {/* 푸터 */}
                    <p className="mt-6 text-center text-[10px] text-[#515163]">
                        로그인 시{' '}
                        <a href="#" className="text-[#0AC8B9] hover:underline">이용약관</a>
                        {' '}및{' '}
                        <a href="#" className="text-[#0AC8B9] hover:underline">개인정보처리방침</a>
                        에 동의하게 됩니다.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
