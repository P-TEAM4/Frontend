// src/pages/SettingsPage.tsx
import React, { useState, useEffect } from 'react';
import { getUserSettings, updateUserSettings, UserSettings } from '../api/users';
import { useNavigate } from 'react-router-dom';
import { useIsAuthenticated } from '../store/authStore';

// Electron IPC (contextIsolation: false 이므로 window.require 사용 가능)
declare global {
    interface Window {
        require: (module: string) => any;
    }
}

const SettingsPage: React.FC = () => {
    const isAuthenticated = useIsAuthenticated();
    const navigate = useNavigate();
    const [autoLaunch, setAutoLaunch] = useState(false);
    const [autoShowOnLol, setAutoShowOnLol] = useState(true);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }

        // 백엔드에서 설정 불러오기
        const loadSettings = async () => {
            try {
                const settings = await getUserSettings();
                setAutoLaunch(settings.autoLaunch);
                setAutoShowOnLol(settings.autoShowOnLol);
                
                // Electron에도 설정 적용
                try {
                    const { ipcRenderer } = window.require('electron');
                    await ipcRenderer.invoke('update-settings', settings);
                } catch (e) {
                    console.warn('Electron IPC not available:', e);
                }
            } catch (error) {
                console.error('Failed to load settings:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadSettings();
    }, [isAuthenticated, navigate]);

    const handleAutoLaunchChange = async (checked: boolean) => {
        if (isSaving) return;
        
        setAutoLaunch(checked);
        setIsSaving(true);
        
        try {
            const newSettings: UserSettings = { autoLaunch: checked, autoShowOnLol };
            
            // 백엔드 저장
            await updateUserSettings(newSettings);
            
            // Electron 적용
            try {
                const { ipcRenderer } = window.require('electron');
                await ipcRenderer.invoke('update-settings', newSettings);
            } catch (e) {
                console.warn('Electron IPC not available:', e);
            }
        } catch (error) {
            console.error('Failed to update settings:', error);
            setAutoLaunch(!checked); // 실패 시 원래 값으로 되돌림
        } finally {
            setIsSaving(false);
        }
    };

    const handleAutoShowOnLolChange = async (checked: boolean) => {
        if (isSaving) return;
        
        setAutoShowOnLol(checked);
        setIsSaving(true);
        
        try {
            const newSettings: UserSettings = { autoLaunch, autoShowOnLol: checked };
            
            // 백엔드 저장
            await updateUserSettings(newSettings);
            
            // Electron 적용
            try {
                const { ipcRenderer } = window.require('electron');
                await ipcRenderer.invoke('update-settings', newSettings);
            } catch (e) {
                console.warn('Electron IPC not available:', e);
            }
        } catch (error) {
            console.error('Failed to update settings:', error);
            setAutoShowOnLol(!checked); // 실패 시 원래 값으로 되돌림
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-[#8B8B8B]">설정을 불러오는 중...</div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
            <h1 className="text-3xl font-bold text-white mb-8">설정</h1>

            {/* 앱 시작 설정 */}
            <div className="bg-[#0D1B2A] rounded-xl p-6 border border-[#1E3A5F]">
                <h2 className="text-xl font-bold text-white mb-4">앱 시작 설정</h2>
                <div className="flex items-center justify-between py-3">
                    <div>
                        <div className="text-white font-medium">컴퓨터 시작 시 자동 실행</div>
                        <div className="text-sm text-[#8B8B8B] mt-1">
                            시스템 부팅 시 앱이 자동으로 백그라운드에서 실행됩니다
                        </div>
                    </div>
                    <button
                        onClick={() => handleAutoLaunchChange(!autoLaunch)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            autoLaunch ? 'bg-[#00C8FF]' : 'bg-[#2C2C35]'
                        }`}
                    >
                        <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                autoLaunch ? 'translate-x-6' : 'translate-x-1'
                            }`}
                        />
                    </button>
                </div>
            </div>

            {/* 게임 연동 설정 */}
            <div className="bg-[#0D1B2A] rounded-xl p-6 border border-[#1E3A5F]">
                <h2 className="text-xl font-bold text-white mb-4">게임 연동</h2>
                <div className="flex items-center justify-between py-3">
                    <div>
                        <div className="text-white font-medium">롤 실행 시 자동 표시</div>
                        <div className="text-sm text-[#8B8B8B] mt-1">
                            League of Legends 실행 시 앱 창이 자동으로 표시됩니다
                        </div>
                    </div>
                    <button
                        onClick={() => handleAutoShowOnLolChange(!autoShowOnLol)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            autoShowOnLol ? 'bg-[#00C8FF]' : 'bg-[#2C2C35]'
                        }`}
                    >
                        <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                autoShowOnLol ? 'translate-x-6' : 'translate-x-1'
                            }`}
                        />
                    </button>
                </div>
            </div>

            {/* 안내 메시지 */}
            <div className="bg-[#1C1C1F] rounded-lg p-4 border border-[#2C2C35]">
                <div className="flex items-start gap-3">
                    <div className="text-[#00C8FF] mt-1">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div className="text-sm text-[#9E9EB1]">
                        설정 변경 사항은 즉시 저장됩니다. 일부 설정은 앱을 재시작해야 적용될 수 있습니다.
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;
