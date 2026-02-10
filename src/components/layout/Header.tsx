// src/components/layout/Header.tsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore, useUser } from '../../store/authStore';
import { logout } from '../../api/auth';

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
        <header className="fixed top-0 left-0 right-0 z-50 bg-[#1C1C1F] border-b border-[#2C2C35]">
            <div className="max-w-[1440px] mx-auto px-4">
                <div className="flex items-center justify-between h-12">
                    {/* 로고 */}
                    <Link to="/" className="flex items-center gap-2 group">
                        <span className="text-base font-black text-white group-hover:text-[#0AC8B9] transition-colors">
                            NEXUS<span className="text-[#0AC8B9]">.GG</span>
                        </span>
                    </Link>

                    {/* 네비게이션 */}
                    <nav className="hidden md:flex items-center gap-1">
                        <Link
                            to="/matches"
                            className="px-3 py-1.5 text-sm text-[#9E9EB1] hover:text-white hover:bg-[#31313C] rounded transition-all font-medium"
                        >
                            전적 검색
                        </Link>
                        {isAuthenticated && (
                            <>
                                <Link
                                    to="/dashboard"
                                    className="px-3 py-1.5 text-sm text-[#9E9EB1] hover:text-white hover:bg-[#31313C] rounded transition-all font-medium"
                                >
                                    대시보드
                                </Link>
                                <Link
                                    to="/highlights"
                                    className="px-3 py-1.5 text-sm text-[#9E9EB1] hover:text-white hover:bg-[#31313C] rounded transition-all font-medium"
                                >
                                    하이라이트
                                </Link>
                            </>
                        )}
                    </nav>

                    {/* 사용자 메뉴 */}
                    <div className="flex items-center gap-2">
                        {isAuthenticated && user ? (
                            <div className="flex items-center gap-3">
                                <Link to="/settings" className="flex items-center gap-2 hover:bg-[#31313C] rounded-lg px-2 py-1.5 transition-colors">
                                    {user.profileImage ? (
                                        <img
                                            src={user.profileImage}
                                            alt={user.name}
                                            className="w-6 h-6 rounded-full"
                                        />
                                    ) : (
                                        <div className="w-6 h-6 rounded-full bg-[#0AC8B9] flex items-center justify-center">
                                            <span className="text-[10px] font-bold text-white">
                                                {user.name?.charAt(0) || 'U'}
                                            </span>
                                        </div>
                                    )}
                                    <span className="text-xs text-[#9E9EB1] hidden sm:inline">{user.name}</span>
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    className="text-xs text-[#515163] hover:text-[#9E9EB1] transition-colors px-2 py-1"
                                >
                                    로그아웃
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => navigate('/login')}
                                className="text-xs font-semibold bg-[#0AC8B9] hover:bg-[#08A8A0] text-white px-4 py-1.5 rounded transition-colors"
                            >
                                로그인
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
