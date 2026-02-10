// src/components/layout/Sidebar.tsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import { useIsAuthenticated, useUser } from '../../store/authStore';
import { getProfileIconUrl } from '../../types/api';

const Sidebar: React.FC = () => {
    const isAuthenticated = useIsAuthenticated();
    const user = useUser();

    const navItems = [
        {
            to: '/dashboard',
            icon: (
                <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
            ),
            label: '대시보드',
            requiresAuth: true,
        },
        {
            to: '/matches',
            icon: (
                <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
            ),
            label: '전적 검색',
            requiresAuth: false,
        },
        {
            to: '/highlights',
            icon: (
                <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
            ),
            label: '하이라이트',
            requiresAuth: true,
        },
        {
            to: '/settings',
            icon: (
                <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
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
        <aside className="fixed left-0 top-12 bottom-0 w-56 bg-[#1C1C1F] border-r border-[#2C2C35] overflow-y-auto z-40">
            <div className="p-3 flex flex-col h-full">
                {/* 사용자 프로필 미니카드 */}
                {isAuthenticated && user && (
                    <div className="mb-4 p-3 rounded-lg bg-[#282830] border border-[#2C2C35]">
                        <div className="flex items-center gap-2.5">
                            {user.profileImage ? (
                                <img
                                    src={user.profileImage}
                                    alt={user.name}
                                    className="w-9 h-9 rounded-full ring-2 ring-[#0AC8B9]/30"
                                />
                            ) : user.profileIconId ? (
                                <img
                                    src={getProfileIconUrl(user.profileIconId)}
                                    alt={user.name}
                                    className="w-9 h-9 rounded-full ring-2 ring-[#0AC8B9]/30"
                                />
                            ) : (
                                <div className="w-9 h-9 rounded-full bg-[#0AC8B9] flex items-center justify-center">
                                    <span className="text-sm font-bold text-white">
                                        {user.name?.charAt(0) || 'U'}
                                    </span>
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-white truncate">
                                    {user.summonerName || user.name}
                                </p>
                                {user.summonerName ? (
                                    <p className="text-[10px] text-[#515163] truncate">
                                        #{user.tagLine}
                                    </p>
                                ) : (
                                    <p className="text-[10px] text-[#515163]">미연동</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* 네비게이션 */}
                <nav className="space-y-0.5 flex-1">
                    {filteredItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            className={({ isActive }) =>
                                `flex items-center gap-2.5 px-3 py-2 rounded-md transition-all duration-150 text-[13px] font-medium ${isActive
                                    ? 'bg-[#0AC8B9]/10 text-[#0AC8B9]'
                                    : 'text-[#9E9EB1] hover:bg-[#282830] hover:text-white'
                                }`
                            }
                        >
                            {item.icon}
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                {/* 푸터 */}
                <div className="pt-3 mt-auto border-t border-[#2C2C35]">
                    <div className="text-center">
                        <p className="text-[10px] text-[#515163]">NEXUS.GG © 2025</p>
                    </div>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
