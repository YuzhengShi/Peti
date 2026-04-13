import { Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminRoute } from './components/AdminRoute';
import { SettingsPanel } from './components/SettingsPanel';
import { useSettings } from './hooks/useSettings';
import { HomePage } from './pages/HomePage';
import { RegisterPage } from './pages/RegisterPage';
import { LoginPage } from './pages/LoginPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { AdminUserDetailPage } from './pages/AdminUserDetailPage';
import { PetCreationPage } from './pages/PetCreationPage';
import { PersonalityTestPage } from './pages/PersonalityTestPage';
import { TestResultsPage } from './pages/TestResultsPage';
import { ProfilePage } from './pages/ProfilePage';
import { DashboardPage } from './pages/DashboardPage';

export function App() {
  const { theme } = useSettings();
  const bgSrc = theme === 'dark' ? '/city-night.gif' : '/city.gif';

  return (
    <>
      <a href="#main-content" className="skip-link">Skip to content</a>
      <img src={bgSrc} className="hero-video" alt="" aria-hidden="true" />
      <Navbar />
      <main id="main-content">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/pet/new" element={
          <ProtectedRoute onboardingRoute><PetCreationPage /></ProtectedRoute>
        } />
        <Route path="/test" element={
          <ProtectedRoute onboardingRoute><PersonalityTestPage /></ProtectedRoute>
        } />
        <Route path="/results" element={
          <ProtectedRoute onboardingRoute><TestResultsPage /></ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute><ProfilePage /></ProtectedRoute>
        } />
        <Route path="/dashboard" element={
          <ProtectedRoute><DashboardPage /></ProtectedRoute>
        } />
        <Route path="/admin" element={
          <AdminRoute><AdminDashboardPage /></AdminRoute>
        } />
        <Route path="/admin/users/:id" element={
          <AdminRoute><AdminUserDetailPage /></AdminRoute>
        } />
      </Routes>
      </main>
      <SettingsPanel />
    </>
  );
}
