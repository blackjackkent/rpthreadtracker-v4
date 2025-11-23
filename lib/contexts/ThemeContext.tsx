'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface ThemeContextType {
  useLightTheme: boolean;
  setUseLightTheme: (value: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [useLightTheme, setUseLightTheme] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Load theme from localStorage on mount
  useEffect(() => {
    const storedTheme = localStorage.getItem('useLightTheme');
    if (storedTheme !== null) {
      setUseLightTheme(JSON.parse(storedTheme));
    }
    setMounted(true);
  }, []);

  // Save theme to localStorage and update body class when it changes
  useEffect(() => {
    if (mounted) {
      localStorage.setItem('useLightTheme', JSON.stringify(useLightTheme));
      document.body.classList.toggle('light-theme', useLightTheme);
    }
  }, [useLightTheme, mounted]);

  if (!mounted) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ useLightTheme, setUseLightTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
