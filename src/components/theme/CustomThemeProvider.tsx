
// ABOUTME: Custom theme provider optimized for Vite environment, replacing next-themes.
import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'dark' | 'light' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  actualTheme: 'dark' | 'light';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}

export function CustomThemeProvider({
  children,
  defaultTheme = 'dark',
  storageKey = 'evidens-theme'
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme);
  const [actualTheme, setActualTheme] = useState<'dark' | 'light'>('dark');

  // Initialize theme from localStorage or default - runs once on mount
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem(storageKey) as Theme;
      if (savedTheme && ['dark', 'light', 'system'].includes(savedTheme)) {
        console.log('CustomThemeProvider: Loading saved theme:', savedTheme);
        setThemeState(savedTheme);
      } else {
        console.log('CustomThemeProvider: No saved theme, using default:', defaultTheme);
        setThemeState(defaultTheme);
        localStorage.setItem(storageKey, defaultTheme);
      }
    } catch (error) {
      console.warn('CustomThemeProvider: Failed to load theme from localStorage:', error);
      setThemeState(defaultTheme);
    }
  }, [storageKey, defaultTheme]);

  // Handle system theme changes and apply theme to document
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleSystemThemeChange = () => {
      if (theme === 'system') {
        const systemTheme = mediaQuery.matches ? 'dark' : 'light';
        console.log('CustomThemeProvider: System theme changed to:', systemTheme);
        setActualTheme(systemTheme);
        updateDocumentTheme(systemTheme);
      }
    };

    // Set initial theme based on current theme state
    if (theme === 'system') {
      const systemTheme = mediaQuery.matches ? 'dark' : 'light';
      console.log('CustomThemeProvider: Using system theme:', systemTheme);
      setActualTheme(systemTheme);
      updateDocumentTheme(systemTheme);
    } else {
      console.log('CustomThemeProvider: Using explicit theme:', theme);
      setActualTheme(theme);
      updateDocumentTheme(theme);
    }

    mediaQuery.addEventListener('change', handleSystemThemeChange);
    return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
  }, [theme]);

  const updateDocumentTheme = (newTheme: 'dark' | 'light') => {
    const root = document.documentElement;
    const body = document.body;
    
    // Remove all theme classes and add the new one
    root.classList.remove('light', 'dark');
    root.classList.add(newTheme);
    
    // Ensure body has proper background
    if (newTheme === 'dark') {
      body.style.backgroundColor = 'hsl(0 0% 7%)'; // --background dark
    } else {
      body.style.backgroundColor = 'hsl(220 20% 98%)'; // --background light
    }

    console.log('CustomThemeProvider: Applied theme to document:', newTheme);
  };

  const setTheme = (newTheme: Theme) => {
    console.log('CustomThemeProvider: Setting theme to:', newTheme);
    setThemeState(newTheme);
    
    try {
      localStorage.setItem(storageKey, newTheme);
      console.log('CustomThemeProvider: Saved theme to localStorage:', newTheme);
    } catch (error) {
      console.warn('CustomThemeProvider: Failed to save theme to localStorage:', error);
    }

    if (newTheme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      setActualTheme(systemTheme);
      updateDocumentTheme(systemTheme);
    } else {
      setActualTheme(newTheme);
      updateDocumentTheme(newTheme);
    }
  };

  const value = {
    theme,
    setTheme,
    actualTheme
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a CustomThemeProvider');
  }
  return context;
}
