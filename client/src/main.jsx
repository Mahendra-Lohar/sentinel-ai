import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { theme } from './theme/theme.js';
import { AuthProvider, useAuth } from './state/AuthContext.jsx';
import { LandingPage } from './pages/LandingPage.jsx';
import { LoginPage } from './pages/LoginPage.jsx';
import { RegisterPage } from './pages/RegisterPage.jsx';
import { CircularProgress, Box } from '@mui/material';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/700.css';
import '@fontsource/inter/900.css';

// Lazy load authenticated routes for better performance
const DashboardPage = React.lazy(() => import('./pages/DashboardPage.jsx').then(m => ({ default: m.DashboardPage })));
const InvestigationsListPage = React.lazy(() => import('./pages/InvestigationsListPage.jsx').then(m => ({ default: m.InvestigationsListPage })));
const NewInvestigationPage = React.lazy(() => import('./pages/NewInvestigationPage.jsx').then(m => ({ default: m.NewInvestigationPage })));
const InvestigationPage = React.lazy(() => import('./pages/InvestigationPage.jsx').then(m => ({ default: m.InvestigationPage })));
const PostmortemPage = React.lazy(() => import('./pages/PostmortemPage.jsx').then(m => ({ default: m.PostmortemPage })));
const AIChatPage = React.lazy(() => import('./pages/AIChatPage.jsx').then(m => ({ default: m.AIChatPage })));
const SettingsPage = React.lazy(() => import('./pages/SettingsPage.jsx'));

const Fallback = () => <Box sx={{ display: 'flex', justifyContent: 'center', p: 10 }}><CircularProgress /></Box>;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30000 }
  }
});

function Protected({ children }) {
  const { token } = useAuth();
  return token ? children : <Navigate to="/login" replace />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/dashboard" element={<Protected><React.Suspense fallback={<Fallback />}><DashboardPage /></React.Suspense></Protected>} />
              <Route path="/investigations" element={<Protected><React.Suspense fallback={<Fallback />}><InvestigationsListPage /></React.Suspense></Protected>} />
              <Route path="/investigations/new" element={<Protected><React.Suspense fallback={<Fallback />}><NewInvestigationPage /></React.Suspense></Protected>} />
              <Route path="/investigations/:id" element={<Protected><React.Suspense fallback={<Fallback />}><InvestigationPage /></React.Suspense></Protected>} />
              <Route path="/investigations/:id/report" element={<Protected><React.Suspense fallback={<Fallback />}><PostmortemPage /></React.Suspense></Protected>} />
              <Route path="/investigations/:id/chat" element={<Protected><React.Suspense fallback={<Fallback />}><AIChatPage /></React.Suspense></Protected>} />
              <Route path="/settings" element={<Protected><React.Suspense fallback={<Fallback />}><SettingsPage /></React.Suspense></Protected>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
