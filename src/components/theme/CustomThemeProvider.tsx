// ABOUTME: Custom theme provider optimized for Vite environment, replacing next-themes.
import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'dark' | 'light' | 'black' | 'escuro-alt' | 'black-alt';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  actualTheme: 'dark' | 'light' | 'black' | 'escuro-alt' | 'black-alt';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}

export function CustomThemeProvider({
  children,
  defaultTheme = 'light',
  storageKey = 'evidens-theme',
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme);
  const [actualTheme, setActualTheme] = useState<'dark' | 'light' | 'black'>('light');

  // Initialize theme from localStorage or default - runs once on mount
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem(storageKey) as Theme;
      if (savedTheme && ['dark', 'light', 'black', 'escuro-alt', 'black-alt'].includes(savedTheme)) {
        setThemeState(savedTheme);
      } else {
        setThemeState(defaultTheme);
        localStorage.setItem(storageKey, defaultTheme);
      }
    } catch (error) {
      console.warn('CustomThemeProvider: Failed to load theme from localStorage:', error);
      setThemeState(defaultTheme);
    }
  }, [storageKey, defaultTheme]);

  // Apply theme to document
  useEffect(() => {
    setActualTheme(theme);
    updateDocumentTheme(theme);
  }, [theme]);

  const updateDocumentTheme = (newTheme: 'dark' | 'light' | 'black' | 'escuro-alt' | 'black-alt') => {
    const root = document.documentElement;
    const body = document.body;

    // Remove all theme classes and add the new one
    root.classList.remove('light', 'dark', 'black', 'escuro-alt', 'black-alt');
    root.classList.add(newTheme);

    // Ensure body has proper background
    if (newTheme === 'dark') {
      body.style.backgroundColor = 'hsl(220 13% 9%)'; // --background dark (sophisticated slate)
    } else if (newTheme === 'escuro-alt') {
      body.style.backgroundColor = 'hsl(60 2.6% 7.6%)'; // --background escuro-alt (Claude.ai warm dark)
    } else if (newTheme === 'black') {
      body.style.backgroundColor = 'hsl(0 0% 0%)'; // --background black pure black
    } else if (newTheme === 'black-alt') {
      body.style.backgroundColor = 'hsl(0 0% 0%)'; // --background black-alt pure black with orange
    } else {
      body.style.backgroundColor = 'hsl(48 33.3% 97.1%)'; // --background light (formerly anthropic)
    }

  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);

    try {
      localStorage.setItem(storageKey, newTheme);
    } catch (error) {
      console.warn('CustomThemeProvider: Failed to save theme to localStorage:', error);
    }

    if (newTheme === 'black') {
      setActualTheme('black');
      updateDocumentTheme('black');
    } else if (newTheme === 'black-alt') {
      setActualTheme('black-alt');
      updateDocumentTheme('black-alt');
    } else if (newTheme === 'escuro-alt') {
      setActualTheme('escuro-alt');
      updateDocumentTheme('escuro-alt');
    } else {
      setActualTheme(newTheme);
      updateDocumentTheme(newTheme);
    }
  };

  const value = {
    theme,
    setTheme,
    actualTheme,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a CustomThemeProvider');
  }
  return context;
}
