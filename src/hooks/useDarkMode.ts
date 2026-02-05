import { useState, useEffect } from 'react';

type Theme = 'light' | 'dark' | 'system';

export function useDarkMode() {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('theme') as Theme | null;
      return stored || 'system';
    }
    return 'system';
  });

  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const root = window.document.documentElement;

    const applyTheme = (dark: boolean) => {
      if (dark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
      setIsDark(dark);
    };

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      applyTheme(mediaQuery.matches);

      const handler = (e: MediaQueryListEvent) => applyTheme(e.matches);
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    } else {
      applyTheme(theme === 'dark');
    }
  }, [theme]);

  const setThemeAndStore = (newTheme: Theme) => {
    localStorage.setItem('theme', newTheme);
    setTheme(newTheme);
  };

  const toggle = () => {
    if (theme === 'system') {
      setThemeAndStore(isDark ? 'light' : 'dark');
    } else {
      setThemeAndStore(theme === 'dark' ? 'light' : 'dark');
    }
  };

  return {
    theme,
    isDark,
    setTheme: setThemeAndStore,
    toggle,
  };
}
