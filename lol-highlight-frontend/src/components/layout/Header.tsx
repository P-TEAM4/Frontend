// src/components/layout/Header.tsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore, useUser } from '../../store/authStore';
import { logout } from '../../api/auth';
import Button from '../common/Button';

const Header: React.FC = () => {
    const navigate = useNavigate();
    const user = useUser();
    const { logout: clearAuth, isAuthenticated } = useAuthStore();

    const handleLogout = async () => {
        try {
            await logout();
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            clearAuth();
            navigate('/login');
        }
    };

    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-[#0A1428]/95 backdrop-blur-sm border-b border-[#1E3A5F]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* 로고 */}
                    <Link to="/" className="flex items-center gap-3 group">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#C8AA6E] to-[#A08050] flex items-center justify-center shadow-[0_0_15px_rgba(200,170,110,0.3)] group-hover:shadow-[0_0_25px_rgba(200,170,110,0.5)] transition-all duration-300">
                            <svg className="w-6 h-6 text-[#0A0A0A]" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                            </svg>
                        </div>
                        <span className="text-xl font-bold bg-gradient-to-r from-[#C8AA6E] to-[#F0E6D2] bg-clip-text text-transparent">
                            NEXUS.GG
                        </span>
                    </Link>

                    {/* 네비게이션 */}
                    <nav className="hidden md:flex items-center gap-6">
                        <Link
                            to="/matches"
                            className="text-[#A0A0A0] hover:text-[#00C8FF] transition-colors duration-200 font-medium"
                        >
                            전적 검색
                        </Link>
                        {isAuthenticated && (
                            <>
                                <Link
                                    to="/dashboard"
                                    className="text-[#A0A0A0] hover:text-[#00C8FF] transition-colors duration-200 font-medium"
                                >
                                    대시보드
                                </Link>
                                <Link
                                    to="/highlights"
                                    className="text-[#A0A0A0] hover:text-[#00C8FF] transition-colors duration-200 font-medium"
                                >
                                    내 하이라이트
                                </Link>
                            </>
                        )}
                    </nav>

                    {/* 사용자 메뉴 */}
                    <div className="flex items-center gap-4">
                        {isAuthenticated && user ? (
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-3">
                                    {user.profileImage ? (
                                        <img
                                            src={user.profileImage}
                                            alt={user.name}
                                            className="w-8 h-8 rounded-full border-2 border-[#1E3A5F]"
                                        />
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-[#1E3A5F] flex items-center justify-center">
                                            <span className="text-sm font-medium text-[#A0A0A0]">
                                                {user.name?.charAt(0) || 'U'}
                                            </span>
                                        </div>
                                    )}
                                    <div className="hidden sm:block">
                                        <p className="text-sm font-medium text-[#F0F0F0]">{user.name}</p>
                                        {user.summonerName && (
                                            <p className="text-xs text-[#8B8B8B]">
                                                {user.summonerName}#{user.tagLine}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <Link
                                    to="/dashboard"
                                    className="text-sm text-[#00C8FF] hover:text-[#00E5FF] transition-colors font-medium"
                                >
                                    마이페이지
                                </Link>
                                <Button variant="ghost" size="sm" onClick={handleLogout}>
                                    로그아웃
                                </Button>
                            </div>
                        ) : (
                            <Button variant="primary" size="sm" onClick={() => navigate('/login')}>
                                로그인
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
