import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import MainLayout from './components/layout/MainLayout';
import ProtectedRoute from './components/layout/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import Onboarding from './pages/Onboarding';
import Landing from './pages/Landing';

import SchedulerPage from './pages/SchedulerPage';

import AutomationPage from './pages/AutomationPage';
import AnalyticsPage from './pages/AnalyticsPage';
import PostAnalyticsPage from './pages/PostAnalyticsPage';
import DraftsPage from './pages/DraftsPage';
import AuditLogsPage from './pages/AuditLogsPage';
import SettingsPage from './pages/SettingsPage';
import FeatureFlagsPage from './pages/FeatureFlagsPage';
import ForgotPassword from './pages/ForgotPassword';

import PrivacyPage from './pages/PrivacyPage';
import TermsPage from './pages/TermsPage';

function App() {
  return (
    <ThemeProvider>
      <div className="min-h-screen w-full bg-slate-50 dark:bg-slate-950 flex flex-col transition-colors duration-300">
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/terms" element={<TermsPage />} />

            <Route element={<ProtectedRoute />}>
              <Route path="/onboarding" element={<Onboarding />} />
              <Route element={<MainLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="scheduler" element={<SchedulerPage />} />
                <Route path="automation" element={<AutomationPage />} />
                <Route path="drafts" element={<DraftsPage />} />
                <Route path="analytics" element={<AnalyticsPage />} />
                <Route path="analytics/:id" element={<PostAnalyticsPage />} />
                <Route path="audit-logs" element={<AuditLogsPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="feature-flags" element={<FeatureFlagsPage />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </div>
    </ThemeProvider>
  );
}

export default App;
