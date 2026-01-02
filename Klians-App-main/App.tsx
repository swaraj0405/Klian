import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { SocketProvider } from './contexts/SocketContext';
import { MessagesProvider } from './contexts/MessagesContext';
import { QueryProvider } from './providers/QueryProvider';
import { Layout } from './components/Layout';
import { AuthPage } from './pages/AuthPage';
import { HomePage } from './pages/HomePage';
import { MessagesPage } from './pages/MessagesPage';
import { ProfilePage } from './pages/ProfilePage';
import { MailboxPage } from './pages/MailboxPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { EventsPage } from './pages/EventsPage';
import { BroadcastPage } from './pages/BroadcastPage';
import { AnnouncementsPage } from './pages/AnnouncementsPage';
import { Role } from './types';
import { UsersPage } from './pages/UsersPage';
import { SettingsPage } from './pages/SettingsPage';
import { prefetchPosts } from './hooks/usePosts';


const AppRoutes: React.FC = () => {
  const { isAuthenticated } = useAuth();
  
  return (
    <Routes>
        <Route path="/auth" element={<AuthPage />} />
        
        {isAuthenticated ? (
            <Route path="/" element={<Layout />}>
                <Route index element={<Navigate to="/home" />} />
                <Route path="home" element={<HomePage />} />
                <Route path="messages" element={<MessagesPage />} />
                <Route path="messages/:conversationId" element={<MessagesPage />} />
                <Route path="users" element={<UsersPage />} />
                <Route path="announcements" element={<AnnouncementsPage />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="profile/:userId" element={<ProfilePage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="mailbox" element={<MailboxPage />} />
                <Route path="events" element={<EventsPage />} />
                <Route path="analytics" element={
                  <ProtectedRoute allowedRoles={[Role.TEACHER, Role.ADMIN]}>
                    <AnalyticsPage />
                  </ProtectedRoute>
                } />
                <Route path="broadcast" element={
                    <ProtectedRoute allowedRoles={[Role.TEACHER, Role.ADMIN]}>
                        <BroadcastPage />
                    </ProtectedRoute>
                } />
                <Route path="*" element={<NotFoundPage />} />
            </Route>
        ) : (
            <Route path="*" element={<Navigate to="/auth" />} />
        )}
    </Routes>
  );
};

const App: React.FC = () => {
  useEffect(() => {
    // Prefetch posts when app starts
    prefetchPosts();
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <SocketProvider>
          <MessagesProvider>
            <QueryProvider>
              <HashRouter>
                <AppRoutes />
              </HashRouter>
            </QueryProvider>
          </MessagesProvider>
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
