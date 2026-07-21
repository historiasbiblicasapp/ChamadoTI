import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ProtectedRoute } from './guards/ProtectedRoute';
import { Toaster } from './components/ui/Toaster';
import { Layout } from './components/layout/Layout';
import { LoadingSpinner } from './components/ui/LoadingSpinner';
import { LoginPage } from './pages/auth/LoginPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';

// Lazy loaded pages
const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const UserPortal = lazy(() => import('./pages/portal/UserPortal').then(m => ({ default: m.UserPortal })));
const TicketsPage = lazy(() => import('./pages/tickets/TicketsPage').then(m => ({ default: m.TicketsPage })));
const NewTicketPage = lazy(() => import('./pages/tickets/NewTicketPage').then(m => ({ default: m.NewTicketPage })));
const TicketDetailPage = lazy(() => import('./pages/tickets/TicketDetailPage').then(m => ({ default: m.TicketDetailPage })));
const AssetsPage = lazy(() => import('./pages/assets/AssetsPage').then(m => ({ default: m.AssetsPage })));
const NewAssetPage = lazy(() => import('./pages/assets/NewAssetPage').then(m => ({ default: m.NewAssetPage })));
const AssetDetailPage = lazy(() => import('./pages/assets/AssetDetailPage').then(m => ({ default: m.AssetDetailPage })));
const KnowledgePage = lazy(() => import('./pages/knowledge/KnowledgePage').then(m => ({ default: m.KnowledgePage })));
const NewArticlePage = lazy(() => import('./pages/knowledge/NewArticlePage').then(m => ({ default: m.NewArticlePage })));
const ArticleDetailPage = lazy(() => import('./pages/knowledge/ArticleDetailPage').then(m => ({ default: m.ArticleDetailPage })));
const NotificationsPage = lazy(() => import('./pages/notifications/NotificationsPage').then(m => ({ default: m.NotificationsPage })));
const ReportsPage = lazy(() => import('./pages/reports/ReportsPage').then(m => ({ default: m.ReportsPage })));
const UsersPage = lazy(() => import('./pages/users/UsersPage').then(m => ({ default: m.UsersPage })));
const SettingsPage = lazy(() => import('./pages/settings/SettingsPage').then(m => ({ default: m.SettingsPage })));
const AuditPage = lazy(() => import('./pages/audit/AuditPage').then(m => ({ default: m.AuditPage })));
const PublicTicketPage = lazy(() => import('./pages/portal/PublicTicketPage').then(m => ({ default: m.PublicTicketPage })));
const PrivacyPage = lazy(() => import('./pages/legal/PrivacyPage').then(m => ({ default: m.PrivacyPage })));
import { CookieConsent } from './components/ui/CookieConsent';

function SuspenseWrapper({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<LoadingSpinner size="md" text="Carregando..." />}>
      {children}
    </Suspense>
  );
}

function HomeRedirect() {
  const { profile, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-950">
        <LoadingSpinner text="Carregando..." />
      </div>
    );
  }

  if (profile?.role === 'user') {
    return <SuspenseWrapper><UserPortal /></SuspenseWrapper>;
  }

  return <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <Toaster />
      <CookieConsent />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/abrir-chamado" element={<SuspenseWrapper><PublicTicketPage /></SuspenseWrapper>} />
        <Route path="/privacidade" element={<SuspenseWrapper><PrivacyPage /></SuspenseWrapper>} />

        {/* User portal - standalone, no sidebar */}
        <Route
          path="/portal"
          element={
            <ProtectedRoute requiredRoles={['user']}>
              <SuspenseWrapper><UserPortal /></SuspenseWrapper>
            </ProtectedRoute>
          }
        />

        {/* Admin/Analyst layout with sidebar */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<HomeRedirect />} />
          <Route path="dashboard" element={<SuspenseWrapper><Dashboard /></SuspenseWrapper>} />
          <Route path="tickets" element={<SuspenseWrapper><TicketsPage /></SuspenseWrapper>} />
          <Route path="tickets/new" element={<SuspenseWrapper><NewTicketPage /></SuspenseWrapper>} />
          <Route path="tickets/:id" element={<SuspenseWrapper><TicketDetailPage /></SuspenseWrapper>} />
          <Route path="assets" element={<SuspenseWrapper><AssetsPage /></SuspenseWrapper>} />
          <Route path="assets/new" element={<SuspenseWrapper><NewAssetPage /></SuspenseWrapper>} />
          <Route path="assets/:id" element={<SuspenseWrapper><AssetDetailPage /></SuspenseWrapper>} />
          <Route path="knowledge" element={<SuspenseWrapper><KnowledgePage /></SuspenseWrapper>} />
          <Route path="knowledge/new" element={<SuspenseWrapper><NewArticlePage /></SuspenseWrapper>} />
          <Route path="knowledge/:id" element={<SuspenseWrapper><ArticleDetailPage /></SuspenseWrapper>} />
          <Route path="notifications" element={<SuspenseWrapper><NotificationsPage /></SuspenseWrapper>} />
          <Route path="reports" element={<SuspenseWrapper><ReportsPage /></SuspenseWrapper>} />
          <Route path="users" element={<SuspenseWrapper><UsersPage /></SuspenseWrapper>} />
          <Route path="settings" element={<SuspenseWrapper><SettingsPage /></SuspenseWrapper>} />
          <Route path="audit" element={<SuspenseWrapper><AuditPage /></SuspenseWrapper>} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}
