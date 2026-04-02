import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Theme = 'light' | 'dark';

export interface BackgroundOption {
  id: string;
  name: string;
  gradient: string;       // light mode
  gradientDark: string;   // dark mode
}

// Backgrounds matching Peti's pixel world design scenes
export const BACKGROUNDS: BackgroundOption[] = [
  {
    id: 'morning',
    name: 'Morning',
    gradient: 'linear-gradient(180deg, #fce4b8 0%, #f5c882 20%, #f0b878 40%, #e8d0a8 60%, #d0e0c0 80%, #b0d8b8 100%)',
    gradientDark: 'linear-gradient(180deg, #1a1208 0%, #2a1a08 20%, #281808 40%, #1a1810 60%, #102018 80%, #081a10 100%)',
  },
  {
    id: 'afternoon',
    name: 'Afternoon',
    gradient: 'linear-gradient(180deg, #88c8f0 0%, #a0d4f8 25%, #b8e0ff 50%, #d0e8f8 75%, #e0f0e8 100%)',
    gradientDark: 'linear-gradient(180deg, #081828 0%, #0a2030 25%, #0c2838 50%, #102030 75%, #0a1820 100%)',
  },
  {
    id: 'evening',
    name: 'Evening',
    gradient: 'linear-gradient(180deg, #f5c67a 0%, #e8967a 15%, #d88aaa 30%, #c89aca 50%, #a8a0d8 65%, #c89aca 80%, #d88aaa 90%, #e8967a 100%)',
    gradientDark: 'linear-gradient(180deg, #1a0f08 0%, #2a1818 15%, #301828 30%, #281838 50%, #182030 65%, #281838 80%, #301828 90%, #2a1818 100%)',
  },
  {
    id: 'night',
    name: 'Night',
    gradient: 'linear-gradient(180deg, #2a2848 0%, #383868 20%, #484880 40%, #3a3868 60%, #2a2848 80%, #1a1838 100%)',
    gradientDark: 'linear-gradient(180deg, #080818 0%, #101028 20%, #181838 40%, #101028 60%, #080818 80%, #040410 100%)',
  },
  {
    id: 'warm-neutral',
    name: 'Warm Neutral',
    gradient: 'linear-gradient(180deg, #f8f0e0 0%, #f0e8d0 50%, #e8dcc0 100%)',
    gradientDark: 'linear-gradient(180deg, #1a1610 0%, #181410 50%, #14120e 100%)',
  },
  {
    id: 'lavender',
    name: 'Lavender',
    gradient: 'linear-gradient(180deg, #e8d8f0 0%, #d8c8e8 30%, #e0d0f0 60%, #d0c0e0 100%)',
    gradientDark: 'linear-gradient(180deg, #18102a 0%, #201828 30%, #181028 60%, #100820 100%)',
  },
  {
    id: 'forest',
    name: 'Forest',
    gradient: 'linear-gradient(180deg, #c8e8c0 0%, #a0d098 25%, #88c088 50%, #90c890 75%, #b0d8a8 100%)',
    gradientDark: 'linear-gradient(180deg, #081a08 0%, #0a200a 25%, #081808 50%, #0a1a0a 75%, #081a08 100%)',
  },
  {
    id: 'ocean',
    name: 'Ocean',
    gradient: 'linear-gradient(180deg, #a8d8f0 0%, #80c0e0 25%, #68b0d8 50%, #80c0e0 75%, #a0d0e8 100%)',
    gradientDark: 'linear-gradient(180deg, #081820 0%, #0a2030 25%, #082838 50%, #0a2030 75%, #081820 100%)',
  },
];

interface SettingsContextType {
  theme: Theme;
  setTheme: (t: Theme) => void;
  backgroundId: string;
  setBackgroundId: (id: string) => void;
  background: BackgroundOption;
}

const SettingsContext = createContext<SettingsContextType | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    const stored = localStorage.getItem('peti-theme');
    if (stored === 'light' || stored === 'dark') return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  const [backgroundId, setBackgroundIdState] = useState(() => {
    return localStorage.getItem('peti-bg') || 'evening';
  });

  const background = BACKGROUNDS.find(b => b.id === backgroundId) || BACKGROUNDS[2];

  function setTheme(t: Theme) {
    document.documentElement.classList.add('theme-transitioning');
    setThemeState(t);
    localStorage.setItem('peti-theme', t);
    setTimeout(() => document.documentElement.classList.remove('theme-transitioning'), 400);
  }

  function setBackgroundId(id: string) {
    setBackgroundIdState(id);
    localStorage.setItem('peti-bg', id);
  }

  // Apply theme attribute
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Apply background gradient
  useEffect(() => {
    const grad = theme === 'dark' ? background.gradientDark : background.gradient;
    document.body.style.background = grad;
    document.body.style.backgroundAttachment = 'fixed';
  }, [theme, background]);

  return (
    <SettingsContext.Provider value={{ theme, setTheme, backgroundId, setBackgroundId, background }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
