import React, { createContext, useContext, useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('dark');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const user = await base44.auth.me();
        const pref = user?.theme_preference || 'dark';
        setTheme(pref);
        document.documentElement.classList.toggle('dark', pref === 'dark');
      } catch {
        document.documentElement.classList.add('dark');
      }
      setLoaded(true);
    };
    init();
  }, []);

  const toggleTheme = async () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.classList.toggle('dark', next === 'dark');
    try {
      await base44.auth.updateMe({ theme_preference: next });
    } catch {}
  };

  if (!loaded) return null;

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);