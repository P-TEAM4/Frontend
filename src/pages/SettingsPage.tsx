// src/pages/SettingsPage.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore, useUser } from '../store/authStore';
import { updateUser, deleteUser, linkRiot, unlinkRiot } from '../api/users';
import { logout } from '../api/auth';
import Button from '../components/common/Button';

const SettingsPage: React.FC = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const user = useUser();
    const { updateUser: updateUserStore, logout: clearAuth } = useAuthStore();

    // 프로필 편집 상태
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [editName, setEditName] = useState(user?.name || '');
    const [editProfileImage, setEditProfileImage] = useState(user?.profileImage || '');

    // Riot 연동 상태
    const [isLinkingRiot, setIsLinkingRiot] = useState(false);
    const [riotSummonerName, setRiotSummonerName] = useState('');
    const [riotTagLine, setRiotTagLine] = useState('');

    // 삭제 확인 상태
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');

    // 사용자 정보 수정 Mutation (PUT /api/users)
    const updateUserMutation = useMutation({
        mutationFn: updateUser,
        onSuccess: (updatedUser) => {
            updateUserStore(updatedUser);
            setIsEditingProfile(false);
            queryClient.invalidateQueries({ queryKey: ['currentUser'] });
        },
    });

    // Riot 계정 연동 Mutation (POST /api/users/link-riot)
    const linkRiotMutation = useMutation({
        mutationFn: linkRiot,
        onSuccess: (updatedUser) => {
            updateUserStore(updatedUser);
            setIsLinkingRiot(false);
            setRiotSummonerName('');
            setRiotTagLine('');
            queryClient.invalidateQueries({ queryKey: ['currentUser'] });
        },
    });

    // Riot 계정 연동 해제 Mutation (DELETE /api/users/link-riot)
    const unlinkRiotMutation = useMutation({
        mutationFn: unlinkRiot,
        onSuccess: (updatedUser) => {
            updateUserStore(updatedUser);
            queryClient.invalidateQueries({ queryKey: ['currentUser'] });
        },
    });

    // 사용자 삭제 Mutation (DELETE /api/users)
    const deleteUserMutation = useMutation({
        mutationFn: deleteUser,
        onSuccess: async () => {
            try {
                await logout();
            } catch {
                // 로그아웃 실패해도 로컬 정리
            }
            clearAuth();
            navigate('/login');
        },
    });

    const handleUpdateProfile = () => {
        if (!editName.trim()) return;
        updateUserMutation.mutate({
            name: editName.trim(),
            ...(editProfileImage.trim() ? { profileImage: editProfileImage.trim() } : {}),
        });
    };

    const handleLinkRiot = () => {
        if (!riotSummonerName.trim() || !riotTagLine.trim()) return;
        linkRiotMutation.mutate({
            summonerName: riotSummonerName.trim(),
            tagLine: riotTagLine.trim(),
        });
    };

    const handleDeleteAccount = () => {
        if (deleteConfirmText !== '회원탈퇴') return;
        deleteUserMutation.mutate();
    };

    if (!user) {
        return (
            <div className="flex items-center justify-center min-h-[60vh] text-[#8B8B8B]">
                사용자 정보를 불러오는 중입니다...
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto space-y-8">
            {/* 페이지 제목 */}
            <div className="section-header">
                <svg className="w-6 h-6 text-[#C8AA6E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <h1 className="section-title text-2xl">설정</h1>
            </div>

            {/* 1. 프로필 정보 */}
            <div className="rounded-xl bg-[#0D1B2A] border border-[#1E3A5F] overflow-hidden">
                <div className="p-6 border-b border-[#1E3A5F]">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <svg className="w-5 h-5 text-[#00C8FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        프로필 정보
                    </h2>
                </div>
                <div className="p-6">
                    {isEditingProfile ? (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-[#8B8B8B] mb-2">이름</label>
                                <input
                                    type="text"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    className="input"
                                    placeholder="표시 이름을 입력하세요"
                                    id="edit-name-input"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[#8B8B8B] mb-2">프로필 이미지 URL (선택)</label>
                                <input
                                    type="url"
                                    value={editProfileImage}
                                    onChange={(e) => setEditProfileImage(e.target.value)}
                                    className="input"
                                    placeholder="https://example.com/avatar.png"
                                    id="edit-profile-image-input"
                                />
                            </div>
                            <div className="flex items-center gap-3 pt-2">
                                <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={handleUpdateProfile}
                                    isLoading={updateUserMutation.isPending}
                                    disabled={!editName.trim()}
                                    id="save-profile-btn"
                                >
                                    저장
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        setIsEditingProfile(false);
                                        setEditName(user.name);
                                        setEditProfileImage(user.profileImage || '');
                                    }}
                                    id="cancel-edit-btn"
                                >
                                    취소
                                </Button>
                            </div>
                            {updateUserMutation.isError && (
                                <p className="text-sm text-[#E84057]">
                                    프로필 수정에 실패했습니다. 다시 시도해주세요.
                                </p>
                            )}
                        </div>
                    ) : (
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                {user.profileImage ? (
                                    <img
                                        src={user.profileImage}
                                        alt={user.name}
                                        className="w-16 h-16 rounded-full border-2 border-[#C8AA6E] object-cover"
                                    />
                                ) : (
                                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#1E3A5F] to-[#0D1B2A] flex items-center justify-center border-2 border-[#1E3A5F]">
                                        <span className="text-2xl font-bold text-[#C8AA6E]">
                                            {user.name?.charAt(0) || 'U'}
                                        </span>
                                    </div>
                                )}
                                <div>
                                    <p className="text-lg font-semibold text-white">{user.name}</p>
                                    <p className="text-sm text-[#8B8B8B]">{user.email}</p>
                                    <div className="mt-1 flex items-center gap-2">
                                        <span className="badge badge-gold text-xs">{user.provider}</span>
                                        <span className="badge badge-blue text-xs">{user.role}</span>
                                    </div>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setEditName(user.name);
                                    setEditProfileImage(user.profileImage || '');
                                    setIsEditingProfile(true);
                                }}
                                id="edit-profile-btn"
                            >
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                                수정
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* 2. Riot 계정 연동 */}
            <div className="rounded-xl bg-[#0D1B2A] border border-[#1E3A5F] overflow-hidden">
                <div className="p-6 border-b border-[#1E3A5F]">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <svg className="w-5 h-5 text-[#C8AA6E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                        Riot 계정 연동
                    </h2>
                </div>
                <div className="p-6">
                    {user.summonerName ? (
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#C8AA6E]/20 to-transparent flex items-center justify-center border border-[#C8AA6E]/30">
                                    <svg className="w-5 h-5 text-[#C8AA6E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-white font-semibold">
                                        {user.summonerName}
                                        <span className="text-[#8B8B8B] font-normal">#{user.tagLine}</span>
                                    </p>
                                    <p className="text-xs text-[#00C8FF]">연동됨</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setIsLinkingRiot(true)}
                                    id="change-riot-btn"
                                >
                                    변경
                                </Button>
                                <Button
                                    variant="danger"
                                    size="sm"
                                    onClick={() => unlinkRiotMutation.mutate()}
                                    isLoading={unlinkRiotMutation.isPending}
                                    id="unlink-riot-btn"
                                >
                                    연동 해제
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-4">
                            <p className="text-[#8B8B8B] mb-4">Riot 계정을 연동하여 전적을 자동으로 불러오세요.</p>
                            <Button
                                variant="primary"
                                size="md"
                                onClick={() => setIsLinkingRiot(true)}
                                id="link-riot-btn"
                            >
                                Riot 계정 연동
                            </Button>
                        </div>
                    )}

                    {isLinkingRiot && (
                        <div className="mt-4 p-4 rounded-lg bg-[#050816] border border-[#1E3A5F] space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-[#8B8B8B] mb-2">소환사명</label>
                                    <input
                                        type="text"
                                        value={riotSummonerName}
                                        onChange={(e) => setRiotSummonerName(e.target.value)}
                                        className="input"
                                        placeholder="소환사명"
                                        id="riot-summoner-input"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[#8B8B8B] mb-2">태그라인</label>
                                    <input
                                        type="text"
                                        value={riotTagLine}
                                        onChange={(e) => setRiotTagLine(e.target.value)}
                                        className="input"
                                        placeholder="KR1"
                                        id="riot-tagline-input"
                                    />
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={handleLinkRiot}
                                    isLoading={linkRiotMutation.isPending}
                                    disabled={!riotSummonerName.trim() || !riotTagLine.trim()}
                                    id="save-riot-btn"
                                >
                                    연동하기
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        setIsLinkingRiot(false);
                                        setRiotSummonerName('');
                                        setRiotTagLine('');
                                    }}
                                    id="cancel-riot-btn"
                                >
                                    취소
                                </Button>
                            </div>
                            {linkRiotMutation.isError && (
                                <p className="text-sm text-[#E84057]">
                                    Riot 계정 연동에 실패했습니다. 소환사명과 태그라인을 확인해주세요.
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* 3. 계정 정보 */}
            <div className="rounded-xl bg-[#0D1B2A] border border-[#1E3A5F] overflow-hidden">
                <div className="p-6 border-b border-[#1E3A5F]">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <svg className="w-5 h-5 text-[#8B8B8B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        계정 정보
                    </h2>
                </div>
                <div className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-xs text-[#8B8B8B] mb-1">이메일</p>
                            <p className="text-sm text-white">{user.email}</p>
                        </div>
                        <div>
                            <p className="text-xs text-[#8B8B8B] mb-1">로그인 방식</p>
                            <p className="text-sm text-white">{user.provider}</p>
                        </div>
                        <div>
                            <p className="text-xs text-[#8B8B8B] mb-1">계정 유형</p>
                            <p className="text-sm text-white">{user.role === 'ADMIN' ? '관리자' : '일반 사용자'}</p>
                        </div>
                        <div>
                            <p className="text-xs text-[#8B8B8B] mb-1">가입일</p>
                            <p className="text-sm text-white">
                                {new Date(user.createdAt).toLocaleDateString('ko-KR', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                })}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* 4. 위험 영역 - 회원 탈퇴 */}
            <div className="rounded-xl bg-[#0D1B2A] border border-[#E84057]/30 overflow-hidden">
                <div className="p-6 border-b border-[#E84057]/30">
                    <h2 className="text-lg font-bold text-[#E84057] flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        위험 영역
                    </h2>
                </div>
                <div className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-white font-medium">회원 탈퇴</p>
                            <p className="text-sm text-[#8B8B8B] mt-1">
                                계정을 삭제하면 모든 데이터가 영구적으로 삭제되며, 복구할 수 없습니다.
                            </p>
                        </div>
                        <Button
                            variant="danger"
                            size="sm"
                            onClick={() => setShowDeleteModal(true)}
                            id="delete-account-btn"
                        >
                            회원 탈퇴
                        </Button>
                    </div>
                </div>
            </div>

            {/* 삭제 확인 모달 */}
            {showDeleteModal && (
                <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
                    <div
                        className="modal-content w-full max-w-md p-6"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#E84057]/20 flex items-center justify-center">
                                <svg className="w-8 h-8 text-[#E84057]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">정말 탈퇴하시겠습니까?</h3>
                            <p className="text-sm text-[#8B8B8B]">
                                이 작업은 되돌릴 수 없습니다. 계정, 전적 기록, 하이라이트 등 모든 데이터가 영구 삭제됩니다.
                            </p>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-[#8B8B8B] mb-2">
                                확인을 위해 <span className="text-[#E84057] font-bold">회원탈퇴</span>를 입력하세요
                            </label>
                            <input
                                type="text"
                                value={deleteConfirmText}
                                onChange={(e) => setDeleteConfirmText(e.target.value)}
                                className="input"
                                placeholder="회원탈퇴"
                                id="delete-confirm-input"
                            />
                        </div>

                        <div className="flex items-center gap-3">
                            <Button
                                variant="danger"
                                size="md"
                                className="flex-1"
                                onClick={handleDeleteAccount}
                                isLoading={deleteUserMutation.isPending}
                                disabled={deleteConfirmText !== '회원탈퇴'}
                                id="confirm-delete-btn"
                            >
                                영구 삭제
                            </Button>
                            <Button
                                variant="ghost"
                                size="md"
                                className="flex-1"
                                onClick={() => {
                                    setShowDeleteModal(false);
                                    setDeleteConfirmText('');
                                }}
                                id="cancel-delete-btn"
                            >
                                취소
                            </Button>
                        </div>

                        {deleteUserMutation.isError && (
                            <p className="text-sm text-[#E84057] text-center mt-4">
                                회원 탈퇴에 실패했습니다. 다시 시도해주세요.
                            </p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SettingsPage;
