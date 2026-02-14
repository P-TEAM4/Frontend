// src/components/layout/Sidebar.tsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import { useIsAuthenticated, useUser } from '../../store/authStore';

const Sidebar: React.FC = () => {
    const isAuthenticated = useIsAuthenticated();
    const user = useUser();

    const navItems = [
        {
            to: '/dashboard',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
            ),
            label: '대시보드',
            requiresAuth: true,
        },
        {
            to: '/matches',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
            ),
            label: '전적 검색',
            requiresAuth: false,
        },
        {
            to: '/champions',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
            ),
            label: '챔피언 통계',
            requiresAuth: false,
        },
        {
            to: '/highlights',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
            ),
            label: '내 하이라이트',
            requiresAuth: true,
        },
        {
            to: '/settings',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            ),
            label: '설정',
            requiresAuth: true,
        },
    ];

    const filteredItems = navItems.filter(
        (item) => !item.requiresAuth || isAuthenticated
    );

    return (
        <aside className="fixed left-0 top-16 bottom-0 w-64 bg-[#0A1428]/80 border-r border-[#1E3A5F] overflow-y-auto">
            <div className="p-4">
                {/* 사용자 프로필 카드 */}
                {isAuthenticated && user && (
                    <div className="mb-6 p-4 rounded-lg bg-[#0D1B2A] border border-[#1E3A5F]">
                        <div className="flex items-center gap-3 mb-3">
                            {user.profileImage ? (
                                <img
                                    src={user.profileImage}
                                    alt={user.name}
                                    className="w-12 h-12 rounded-full border-2 border-[#C8AA6E]"
                                />
                            ) : (
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#1E3A5F] to-[#0D1B2A] flex items-center justify-center border-2 border-[#1E3A5F]">
                                    <span className="text-lg font-bold text-[#C8AA6E]">
                                        {user.name?.charAt(0) || 'U'}
                                    </span>
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-[#F0F0F0] truncate">
                                    {user.name}
                                </p>
                                {user.summonerName ? (
                                    <p className="text-xs text-[#00C8FF] truncate">
                                        {user.summonerName}#{user.tagLine}
                                    </p>
                                ) : (
                                    <p className="text-xs text-[#8B8B8B]">계정 미연동</p>
                                )}
                            </div>
                        </div>
                        {!user.summonerName && (
                            <NavLink
                                to="/dashboard"
                                className="block w-full text-center text-xs py-2 px-3 rounded bg-[#1E3A5F] text-[#00C8FF] hover:bg-[#2A4A70] transition-colors"
                            >
                                Riot 계정 연동하기
                            </NavLink>
                        )}
                    </div>
                )}

                {/* 네비게이션 */}
                <nav className="space-y-1">
                    {filteredItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${isActive
                                    ? 'bg-gradient-to-r from-[#1E3A5F] to-transparent text-[#00C8FF] shadow-[inset_0_0_20px_rgba(0,200,255,0.1)]'
                                    : 'text-[#A0A0A0] hover:bg-[#0D1B2A] hover:text-[#F0F0F0]'
                                }`
                            }
                        >
                            <span className="flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
                                {item.icon}
                            </span>
                            <span className="font-medium">{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                {/* 푸터 */}
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-[#1E3A5F]">
                    <div className="text-center">
                        <p className="text-xs text-[#5B5B5B]">NEXUS.GG</p>
                        <p className="text-xs text-[#5B5B5B]">© 2025</p>
                    </div>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
