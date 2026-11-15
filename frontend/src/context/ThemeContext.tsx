import React, { createContext, useContext, useState, useEffect } from 'react';

export type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlTheme = params.get('theme') as Theme;
      if (urlTheme === 'light' || urlTheme === 'dark') {
        return urlTheme;
      }
      // Temporary session check: Light mode is session-only (temporary)
      const sessionTheme = sessionStorage.getItem('brandtrace_theme') as Theme;
      if (sessionTheme === 'light' || sessionTheme === 'dark') {
        return sessionTheme;
      }
    }
    // Permanent baseline: Dark Mode is the permanent default for BrandTrace AI
    return 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    }
    // Store in sessionStorage so Light mode is temporary for this session only; Dark mode is permanent
    sessionStorage.setItem('brandtrace_theme', theme);
    localStorage.setItem('brandtrace_theme', 'dark');
  }, [theme]);

  const toggleTheme = () => {
    setThemeState(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const setTheme = (t: Theme) => {
    setThemeState(t);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme, isDark: theme === 'dark' }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
