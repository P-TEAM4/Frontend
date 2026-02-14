// src/App.tsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useIsAuthenticated, useAuthStore } from './store/authStore';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import MatchesPage from './pages/MatchesPage';
import MatchDetailPage from './pages/MatchDetailPage';
import MyHighlightsPage from './pages/MyHighlightsPage';
import ChampionStatsPage from './pages/ChampionStatsPage';
import SettingsPage from './pages/SettingsPage';
import ChampionStatsOverlay from './components/overlay/ChampionStatsOverlay';
import { getCachedDataDragonVersion, getCachedVersionsList } from './api/datadragon';
import { setDataDragonVersion, setDataDragonVersionsList } from './types/api';

// 인증이 필요한 라우트를 보호하는 컴포넌트
const ProtectedRoute: React.FC = () => {
  const isAuthenticated = useIsAuthenticated();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

// 메인 레이아웃 (Header + Sidebar + Content)
const MainLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#050816] via-[#0A1428] to-[#050816]">
      <Header />
      <div className="flex pt-16">
        <Sidebar />
        <main className="flex-1 ml-64 p-6">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

// 공개 레이아웃 (Header + Sidebar)
const PublicLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#050816] via-[#0A1428] to-[#050816]">
      <Header />
      <div className="flex pt-16">
        <Sidebar />
        <main className="flex-1 ml-64 p-6">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuthStore();
  const [selectedChampion, setSelectedChampion] = useState<string | null>(null);

  React.useEffect(() => {
    // 토큰은 있는데 사용자 정보가 없는 경우 (로그인 과정 중 오류 발생 등)
    // 로그아웃 처리하여 다시 로그인을 시도할 수 있게 함
    if (isAuthenticated && !user) {
      logout();
    }
  }, [isAuthenticated, user, logout]);

  // Data Dragon 버전 초기화
  React.useEffect(() => {
    const initDataDragonVersion = async () => {
      try {
        const version = await getCachedDataDragonVersion();
        const versionsList = await getCachedVersionsList();
        setDataDragonVersion(version);
        setDataDragonVersionsList(versionsList);
        console.log('Data Dragon version initialized:', version);
        console.log('Data Dragon versions list cached:', versionsList.slice(0, 5));
      } catch (error) {
        console.error('Failed to initialize Data Dragon version:', error);
      }
    };

    initDataDragonVersion();
  }, []);

  // 로그인 후 사용자 설정을 Electron에 적용
  React.useEffect(() => {
    if (!isAuthenticated || !user) return;

    const syncSettingsToElectron = async () => {
      try {
        const { getUserSettings } = await import('./api/users');
        const settings = await getUserSettings();
        
        // Electron에 설정 적용 (약간의 지연 후 시도)
        if (typeof window !== 'undefined' && (window as any).require) {
          // Electron IPC가 준비될 때까지 약간 대기
          await new Promise(resolve => setTimeout(resolve, 500));
          
          try {
            const { ipcRenderer } = (window as any).require('electron');
            await ipcRenderer.invoke('update-settings', settings);
            console.log('Settings synced to Electron:', settings);
          } catch (ipcError) {
            // IPC 에러는 무시 (Electron 환경이 아니거나 아직 준비되지 않음)
            console.warn('Electron IPC not ready:', ipcError);
          }
        }
      } catch (error) {
        console.error('Failed to sync settings to Electron:', error);
      }
    };

    syncSettingsToElectron();
  }, [isAuthenticated, user]);

  // Champion selection IPC listener
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).require) {
      try {
        const { ipcRenderer } = (window as any).require('electron');
        
        const handleChampionSelected = (_event: any, championName: string) => {
          console.log('Champion selected via IPC:', championName);
          setSelectedChampion(championName);
        };

        ipcRenderer.on('champion-selected', handleChampionSelected);

        return () => {
          ipcRenderer.removeListener('champion-selected', handleChampionSelected);
        };
      } catch (error) {
        console.warn('Failed to setup champion-selected IPC listener:', error);
      }
    }
  }, []);

  return (
    <>
      {/* Champion Stats Overlay (Floating) */}
      {selectedChampion && (
        <ChampionStatsOverlay
          championName={selectedChampion}
          onClose={() => setSelectedChampion(null)}
        />
      )}

      <BrowserRouter>
        <Routes>
        {/* 로그인 페이지 - 별도 레이아웃 */}
        <Route path="/login" element={<LoginPage />} />

        {/* 공개 라우트 (로그인 불필요) */}
        <Route element={<PublicLayout />}>
          <Route path="/matches" element={<MatchesPage />} />
          <Route path="/match/:matchId" element={<MatchDetailPage />} />
          <Route path="/champions" element={<ChampionStatsPage />} />
        </Route>

        {/* 인증 필요 라우트 */}
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/highlights" element={<MyHighlightsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Route>

        {/* 기본 리다이렉트 */}
        <Route path="/" element={<Navigate to="/matches" replace />} />
        <Route path="*" element={<Navigate to="/matches" replace />} />
        </Routes>
      </BrowserRouter>
    </>
  );
};

export default App;
