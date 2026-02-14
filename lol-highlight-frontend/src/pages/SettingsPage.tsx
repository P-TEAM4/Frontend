// src/pages/SettingsPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore, useUser } from '../store/authStore';
import { updateUser, deleteUser, linkRiot, unlinkRiot, getUserSettings, updateUserSettings, uploadProfileImage } from '../api/users';
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
    
    // 프로필 이미지 업로드 상태
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    // Riot 연동 상태
    const [isLinkingRiot, setIsLinkingRiot] = useState(false);
    const [riotSummonerName, setRiotSummonerName] = useState('');
    const [riotTagLine, setRiotTagLine] = useState('');

    // 삭제 확인 상태
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');

    // 앱 시작 설정 상태
    const [autoLaunch, setAutoLaunch] = useState(false);
    const [autoShowOnLol, setAutoShowOnLol] = useState(true);
    const [isLoadingSettings, setIsLoadingSettings] = useState(true);
    const [isSavingSettings, setIsSavingSettings] = useState(false);

    // 사용자 정보 수정 Mutation (PUT /api/users)
    const updateUserMutation = useMutation({
        mutationFn: updateUser,
        onSuccess: (updatedUser) => {
            updateUserStore(updatedUser);
            setIsEditingProfile(false);
            queryClient.invalidateQueries({ queryKey: ['currentUser'] });
        },
    });

    // 프로필 이미지 업로드 Mutation (POST /api/users/profile-image)
    const uploadImageMutation = useMutation({
        mutationFn: uploadProfileImage,
        onSuccess: (updatedUser) => {
            updateUserStore(updatedUser);
            setSelectedImage(null);
            setImagePreview(null);
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
        
        // 이미지 파일이 선택된 경우, 업로드 먼저 수행
        if (selectedImage) {
            uploadImageMutation.mutate(selectedImage);
            return;
        }
        
        // 이미지 없으면 일반 프로필 수정
        updateUserMutation.mutate({
            name: editName.trim(),
            ...(editProfileImage.trim() ? { profileImage: editProfileImage.trim() } : {}),
        });
    };

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // 파일 타입 검증
        if (!file.type.match(/^image\/(jpeg|png)$/)) {
            alert('JPEG 또는 PNG 형식의 이미지만 업로드 가능합니다.');
            return;
        }

        // 파일 크기 검증 (5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('파일 크기는 5MB를 초과할 수 없습니다.');
            return;
        }

        setSelectedImage(file);

        // 이미지 미리보기
        const reader = new FileReader();
        reader.onloadend = () => {
            setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
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

    // 설정 로드
    useEffect(() => {
        const loadSettings = async () => {
            try {
                const settings = await getUserSettings();
                setAutoLaunch(settings.autoLaunch);
                setAutoShowOnLol(settings.autoShowOnLol);
                
                // Electron에도 설정 적용
                try {
                    const { ipcRenderer } = (window as any).require('electron');
                    await ipcRenderer.invoke('update-settings', settings);
                } catch (e) {
                    console.warn('Electron IPC not available:', e);
                }
            } catch (error) {
                console.error('Failed to load settings:', error);
            } finally {
                setIsLoadingSettings(false);
            }
        };

        loadSettings();
    }, []);

    const handleAutoLaunchChange = async (checked: boolean) => {
        if (isSavingSettings) return;
        
        setAutoLaunch(checked);
        setIsSavingSettings(true);
        
        try {
            const newSettings = { autoLaunch: checked, autoShowOnLol };
            
            // 백엔드 저장
            await updateUserSettings(newSettings);
            
            // Electron 적용
            try {
                const { ipcRenderer } = (window as any).require('electron');
                await ipcRenderer.invoke('update-settings', newSettings);
            } catch (e) {
                console.warn('Electron IPC not available:', e);
            }
        } catch (error) {
            console.error('Failed to update settings:', error);
            setAutoLaunch(!checked); // 실패 시 원래 값으로 되돌림
        } finally {
            setIsSavingSettings(false);
        }
    };

    const handleAutoShowOnLolChange = async (checked: boolean) => {
        if (isSavingSettings) return;
        
        setAutoShowOnLol(checked);
        setIsSavingSettings(true);
        
        try {
            const newSettings = { autoLaunch, autoShowOnLol: checked };
            
            // 백엔드 저장
            await updateUserSettings(newSettings);
            
            // Electron 적용
            try {
                const { ipcRenderer } = (window as any).require('electron');
                await ipcRenderer.invoke('update-settings', newSettings);
            } catch (e) {
                console.warn('Electron IPC not available:', e);
            }
        } catch (error) {
            console.error('Failed to update settings:', error);
            setAutoShowOnLol(!checked); // 실패 시 원래 값으로 되돌림
        } finally {
            setIsSavingSettings(false);
        }
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
                                <label className="block text-sm font-medium text-[#8B8B8B] mb-2">프로필 이미지 업로드</label>
                                <div className="space-y-3">
                                    {/* 이미지 미리보기 */}
                                    {imagePreview && (
                                        <div className="flex items-center gap-3">
                                            <img
                                                src={imagePreview}
                                                alt="미리보기"
                                                className="w-20 h-20 rounded-full object-cover border-2 border-[#C8AA6E]"
                                            />
                                            <button
                                                onClick={() => {
                                                    setSelectedImage(null);
                                                    setImagePreview(null);
                                                }}
                                                className="text-sm text-[#E84057] hover:text-[#FF6B81]"
                                            >
                                                삭제
                                            </button>
                                        </div>
                                    )}
                                    
                                    {/* 파일 선택 버튼 */}
                                    <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1E3A5F] hover:bg-[#2A4A6F] text-white text-sm font-medium cursor-pointer transition-colors">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        이미지 선택
                                        <input
                                            type="file"
                                            accept="image/jpeg,image/png"
                                            onChange={handleImageSelect}
                                            className="hidden"
                                            id="profile-image-upload"
                                        />
                                    </label>
                                    <p className="text-xs text-[#8B8B8B]">JPEG, PNG 형식 / 최대 5MB</p>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[#8B8B8B] mb-2">또는 프로필 이미지 URL</label>
                                <input
                                    type="url"
                                    value={editProfileImage}
                                    onChange={(e) => setEditProfileImage(e.target.value)}
                                    className="input"
                                    placeholder="https://example.com/avatar.png"
                                    id="edit-profile-image-input"
                                    disabled={!!selectedImage}
                                />
                            </div>
                            <div className="flex items-center gap-3 pt-2">
                                <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={handleUpdateProfile}
                                    isLoading={updateUserMutation.isPending || uploadImageMutation.isPending}
                                    disabled={!editName.trim()}
                                    id="save-profile-btn"
                                >
                                    {uploadImageMutation.isPending ? '업로드 중...' : '저장'}
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        setIsEditingProfile(false);
                                        setEditName(user.name);
                                        setEditProfileImage(user.profileImage || '');
                                        setSelectedImage(null);
                                        setImagePreview(null);
                                    }}
                                    id="cancel-edit-btn"
                                >
                                    취소
                                </Button>
                            </div>
                            {(updateUserMutation.isError || uploadImageMutation.isError) && (
                                <p className="text-sm text-[#E84057]">
                                    {uploadImageMutation.isError 
                                        ? '이미지 업로드에 실패했습니다. 파일 형식과 크기를 확인해주세요.'
                                        : '프로필 수정에 실패했습니다. 다시 시도해주세요.'
                                    }
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

            {/* 4. 앱 시작 설정 */}
            <div className="rounded-xl bg-[#0D1B2A] border border-[#1E3A5F] overflow-hidden">
                <div className="p-6 border-b border-[#1E3A5F]">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <svg className="w-5 h-5 text-[#00C8FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        앱 시작 설정
                    </h2>
                </div>
                <div className="p-6 space-y-4">
                    {isLoadingSettings ? (
                        <div className="text-center text-[#8B8B8B] py-4">설정을 불러오는 중...</div>
                    ) : (
                        <>
                            {/* 컴퓨터 시작 시 자동 실행 */}
                            <div className="flex items-center justify-between py-3">
                                <div>
                                    <div className="text-white font-medium">컴퓨터 시작 시 자동 실행</div>
                                    <div className="text-sm text-[#8B8B8B] mt-1">
                                        시스템 부팅 시 앱이 자동으로 백그라운드에서 실행됩니다
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleAutoLaunchChange(!autoLaunch)}
                                    disabled={isSavingSettings}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                        autoLaunch ? 'bg-[#00C8FF]' : 'bg-[#2C2C35]'
                                    } ${isSavingSettings ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                            autoLaunch ? 'translate-x-6' : 'translate-x-1'
                                        }`}
                                    />
                                </button>
                            </div>

                            {/* 롤 실행 시 자동 표시 */}
                            <div className="flex items-center justify-between py-3">
                                <div>
                                    <div className="text-white font-medium">롤 런처 실행 시 자동 표시</div>
                                    <div className="text-sm text-[#8B8B8B] mt-1">
                                        League of Legends 런처 실행 시 앱 창이 자동으로 표시됩니다
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleAutoShowOnLolChange(!autoShowOnLol)}
                                    disabled={isSavingSettings}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                        autoShowOnLol ? 'bg-[#00C8FF]' : 'bg-[#2C2C35]'
                                    } ${isSavingSettings ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                            autoShowOnLol ? 'translate-x-6' : 'translate-x-1'
                                        }`}
                                    />
                                </button>
                            </div>

                            {/* 안내 메시지 */}
                            <div className="mt-4 p-4 rounded-lg bg-[#050816] border border-[#1E3A5F]">
                                <div className="flex items-start gap-3">
                                    <div className="text-[#00C8FF] mt-1">
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="text-sm text-[#9E9EB1]">
                                        <p className="font-semibold text-white mb-2">💡 사용 방법</p>
                                        <ul className="space-y-1 list-disc list-inside">
                                            <li><strong className="text-[#00C8FF]">"컴퓨터 시작 시 자동 실행"</strong>을 켜두면 앱이 백그라운드에서 항상 실행됩니다</li>
                                            <li><strong className="text-[#00C8FF]">"롤 런처 실행 시 자동 표시"</strong>를 켜면 롤 런처 감지 시 창이 자동으로 나타납니다</li>
                                            <li>앱이 완전히 꺼진 상태에서는 롤을 감지할 수 없습니다</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* 5. 위험 영역 - 회원 탈퇴 */}
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
