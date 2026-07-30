import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ChatProvider } from './contexts/ChatContext';
import AuthPage from './pages/AuthPage';
import ChatPage from './pages/ChatPage';
import LandingPage from './pages/LandingPage';
import AdminPage from './pages/AdminPage';
import PrivacyPage from './pages/PrivacyPage';
import TermsPage from './pages/TermsPage';
import SettingsPage from './pages/SettingsPage';

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          background: 'var(--bg-void)',
        }}
      >
        <div className="spinner" style={{ width: 32, height: 32 }} />
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/auth" replace />;
};

const App: React.FC = () => (
  <AuthProvider>
    <Toaster 
      position="top-center"
      toastOptions={{
        style: {
          background: 'rgba(20, 20, 25, 0.85)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          color: '#fff',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
          fontSize: '14px',
          fontWeight: 500,
          letterSpacing: '0.01em',
        },
        success: {
          iconTheme: { primary: '#10b981', secondary: '#fff' },
        },
        error: {
          iconTheme: { primary: '#f43f5e', secondary: '#fff' },
        },
      }}
    />
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route
          path="/chat"
          element={
            <PrivateRoute>
              <ChatProvider>
                <ChatPage />
              </ChatProvider>
            </PrivateRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <PrivateRoute>
              <AdminPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <PrivateRoute>
              <SettingsPage />
            </PrivateRoute>
          }
        />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </AuthProvider>
);

export default App;
