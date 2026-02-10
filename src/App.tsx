// src/App.tsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useIsAuthenticated, useAuthStore } from './store/authStore';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import MatchesPage from './pages/MatchesPage';
import MatchDetailPage from './pages/MatchDetailPage';
import MyHighlightsPage from './pages/MyHighlightsPage';
import SettingsPage from './pages/SettingsPage';

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
    <div className="min-h-screen bg-[#1C1C1F]">
      <Header />
      <div className="flex pt-12">
        <Sidebar />
        <main className="flex-1 ml-56 p-5">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

// 공개 레이아웃 (Header만 있음)
const PublicLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#1C1C1F]">
      <Header />
      <main className="pt-12">
        <Outlet />
      </main>
    </div>
  );
};

const App: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuthStore();

  React.useEffect(() => {
    // 토큰은 있는데 사용자 정보가 없는 경우 (로그인 과정 중 오류 발생 등)
    // 로그아웃 처리하여 다시 로그인을 시도할 수 있게 함
    if (isAuthenticated && !user) {
      logout();
    }
  }, [isAuthenticated, user, logout]);

  return (
    <BrowserRouter>
      <Routes>
        {/* 로그인 페이지 - 별도 레이아웃 */}
        <Route path="/login" element={<LoginPage />} />

        {/* 공개 라우트 (로그인 불필요) */}
        <Route element={<PublicLayout />}>
          <Route path="/matches" element={<MatchesPage />} />
          <Route path="/match/:matchId" element={<MatchDetailPage />} />
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
  );
};

export default App;
