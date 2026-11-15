import React, { createContext, useContext, useEffect } from 'react';

export type Theme = 'dark';

interface ThemeContextType {
  theme: 'dark';
  toggleTheme: () => void;
  setTheme: (theme: string) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add('dark');
    root.classList.remove('light');
    root.style.colorScheme = 'dark';
    try {
      localStorage.setItem('brandtrace_theme', 'dark');
      sessionStorage.setItem('brandtrace_theme', 'dark');
    } catch {
      // Ignore storage restrictions if any
    }
  }, []);

  // Permanent Dark Mode: Light mode option is disabled across the platform
  const toggleTheme = () => {};
  const setTheme = () => {};

  return (
    <ThemeContext.Provider value={{ theme: 'dark', toggleTheme, setTheme, isDark: true }}>
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
