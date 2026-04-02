import { Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { ProtectedRoute } from './components/ProtectedRoute';
import { SettingsPanel } from './components/SettingsPanel';
import { useSettings } from './hooks/useSettings';
import { HomePage } from './pages/HomePage';
import { RegisterPage } from './pages/RegisterPage';
import { LoginPage } from './pages/LoginPage';
import { MemoriesPage } from './pages/MemoriesPage';
import { MemoryCreatePage } from './pages/MemoryCreatePage';

export function App() {
  const { theme } = useSettings();
  const bgSrc = theme === 'dark' ? '/city-night.gif' : '/city.gif';

  return (
    <>
      <img src={bgSrc} className="hero-video" alt="" aria-hidden="true" />
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/memories" element={
          <ProtectedRoute><MemoriesPage /></ProtectedRoute>
        } />
        <Route path="/memories/new" element={
          <ProtectedRoute><MemoryCreatePage /></ProtectedRoute>
        } />
      </Routes>
      <SettingsPanel />
    </>
  );
}
