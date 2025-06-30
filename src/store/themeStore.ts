// ABOUTME: Zustand store for managing advanced theme system state and operations

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { CustomTheme, ThemeValidationError, ThemeApplicationMode } from '@/types/theme';
import { themePresets, academicTheme } from '@/components/editor/theme/themePresets';
import {
  ThemeGenerator,
  ThemeValidator,
  ThemeApplicator,
} from '@/components/editor/theme/themeEngine';

interface ThemeState {
  // Current theme state
  currentTheme: CustomTheme;
  appliedThemes: Record<string, CustomTheme>; // For document-specific themes
  applicationMode: ThemeApplicationMode;

  // Theme management
  customThemes: Record<string, CustomTheme>;
  favoriteThemes: string[];
  recentThemes: string[];

  // Theme editor state
  isThemeEditorOpen: boolean;
  editingTheme: CustomTheme | null;
  editorChanges: Partial<CustomTheme>;
  validationErrors: ThemeValidationError[];

  // Theme application
  isApplying: boolean;
  lastAppliedAt: string | null;

  // Analytics
  themeUsageStats: Record<
    string,
    {
      usageCount: number;
      lastUsed: string;
      averageSessionTime: number;
    }
  >;
}

interface ThemeActions {
  // Theme application
  applyTheme: (theme: CustomTheme, mode?: ThemeApplicationMode) => void;
  applyThemeToDocument: (documentId: string, theme: CustomTheme) => void;
  setApplicationMode: (mode: ThemeApplicationMode) => void;

  // Theme management
  createTheme: (name: string, baseTheme?: CustomTheme) => CustomTheme;
  saveTheme: (theme: CustomTheme) => void;
  deleteTheme: (themeId: string) => void;
  duplicateTheme: (themeId: string, newName: string) => CustomTheme;

  // Theme favorites and recents
  addToFavorites: (themeId: string) => void;
  removeFromFavorites: (themeId: string) => void;
  addToRecents: (themeId: string) => void;
  clearRecents: () => void;

  // Theme editor
  openThemeEditor: (theme?: CustomTheme) => void;
  closeThemeEditor: () => void;
  updateEditorChanges: (changes: Partial<CustomTheme>) => void;
  resetEditorChanges: () => void;
  saveEditorChanges: () => void;
  validateCurrentTheme: () => void;

  // Theme generation
  generateThemeFromColors: (
    name: string,
    primaryColor: string,
    secondaryColor?: string
  ) => CustomTheme;
  generateRandomTheme: (category: CustomTheme['category']) => CustomTheme;

  // Theme import/export
  exportTheme: (themeId: string, format: 'json' | 'css') => string;
  importTheme: (themeData: string | CustomTheme) => Promise<CustomTheme>;

  // Utility functions
  getThemeById: (themeId: string) => CustomTheme | undefined;
  getAllThemes: () => CustomTheme[];
  getThemesByCategory: (category: CustomTheme['category']) => CustomTheme[];
  searchThemes: (query: string) => CustomTheme[];

  // Analytics
  trackThemeUsage: (themeId: string) => void;
  getThemeAnalytics: (themeId: string) => any;

  // Reset and initialization
  resetToDefaults: () => void;
  initializePresets: () => void;
}

type ThemeStore = ThemeState & ThemeActions;

// Default state
const getInitialState = (): ThemeState => ({
  currentTheme: academicTheme,
  appliedThemes: {},
  applicationMode: 'global',

  customThemes: {},
  favoriteThemes: [],
  recentThemes: [],

  isThemeEditorOpen: false,
  editingTheme: null,
  editorChanges: {},
  validationErrors: [],

  isApplying: false,
  lastAppliedAt: null,

  themeUsageStats: {},
});

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      ...getInitialState(),

      // Theme application
      applyTheme: (theme: CustomTheme, mode: ThemeApplicationMode = 'global') => {
        set({ isApplying: true });

        try {
          // Apply theme to DOM
          ThemeApplicator.applyThemeToDOM(theme);

          // Update state
          set({
            currentTheme: theme,
            applicationMode: mode,
            lastAppliedAt: new Date().toISOString(),
            isApplying: false,
          });

          // Track usage
          get().trackThemeUsage(theme.id);
          get().addToRecents(theme.id);
        } catch (error) {
          console.error('Failed to apply theme:', error);
          set({ isApplying: false });
        }
      },

      applyThemeToDocument: (documentId: string, theme: CustomTheme) => {
        set(state => ({
          appliedThemes: {
            ...state.appliedThemes,
            [documentId]: theme,
          },
        }));

        get().trackThemeUsage(theme.id);
      },

      setApplicationMode: (mode: ThemeApplicationMode) => {
        set({ applicationMode: mode });
      },

      // Theme management
      createTheme: (name: string, baseTheme?: CustomTheme) => {
        const newTheme = baseTheme
          ? { ...baseTheme, id: `custom-${Date.now()}`, name }
          : ThemeGenerator.createThemeFromBrandColors(name, '#3b82f6');

        set(state => ({
          customThemes: {
            ...state.customThemes,
            [newTheme.id]: newTheme,
          },
        }));

        return newTheme;
      },

      saveTheme: (theme: CustomTheme) => {
        const updatedTheme = {
          ...theme,
          metadata: {
            ...theme.metadata,
            updatedAt: new Date().toISOString(),
          },
        };

        set(state => ({
          customThemes: {
            ...state.customThemes,
            [theme.id]: updatedTheme,
          },
        }));
      },

      deleteTheme: (themeId: string) => {
        set(state => {
          const { [themeId]: deleted, ...remainingThemes } = state.customThemes;
          return {
            customThemes: remainingThemes,
            favoriteThemes: state.favoriteThemes.filter(id => id !== themeId),
            recentThemes: state.recentThemes.filter(id => id !== themeId),
          };
        });
      },

      duplicateTheme: (themeId: string, newName: string) => {
        const originalTheme = get().getThemeById(themeId);
        if (!originalTheme) return originalTheme!;

        return get().createTheme(newName, originalTheme);
      },

      // Favorites and recents
      addToFavorites: (themeId: string) => {
        set(state => ({
          favoriteThemes: state.favoriteThemes.includes(themeId)
            ? state.favoriteThemes
            : [...state.favoriteThemes, themeId],
        }));
      },

      removeFromFavorites: (themeId: string) => {
        set(state => ({
          favoriteThemes: state.favoriteThemes.filter(id => id !== themeId),
        }));
      },

      addToRecents: (themeId: string) => {
        set(state => {
          const filtered = state.recentThemes.filter(id => id !== themeId);
          return {
            recentThemes: [themeId, ...filtered].slice(0, 10), // Keep last 10
          };
        });
      },

      clearRecents: () => {
        set({ recentThemes: [] });
      },

      // Theme editor
      openThemeEditor: (theme?: CustomTheme) => {
        set({
          isThemeEditorOpen: true,
          editingTheme: theme || null,
          editorChanges: {},
          validationErrors: [],
        });
      },

      closeThemeEditor: () => {
        set({
          isThemeEditorOpen: false,
          editingTheme: null,
          editorChanges: {},
          validationErrors: [],
        });
      },

      updateEditorChanges: (changes: Partial<CustomTheme>) => {
        set(state => ({
          editorChanges: {
            ...state.editorChanges,
            ...changes,
          },
        }));

        // Auto-validate
        get().validateCurrentTheme();
      },

      resetEditorChanges: () => {
        set({ editorChanges: {}, validationErrors: [] });
      },

      saveEditorChanges: () => {
        const { editingTheme, editorChanges } = get();
        if (!editingTheme) return;

        const updatedTheme = {
          ...editingTheme,
          ...editorChanges,
        };

        get().saveTheme(updatedTheme);
        get().closeThemeEditor();
      },

      validateCurrentTheme: () => {
        const { editingTheme, editorChanges } = get();
        if (!editingTheme) return;

        const themeToValidate = { ...editingTheme, ...editorChanges };
        const { errors } = ThemeValidator.validateTheme(themeToValidate);

        set({ validationErrors: errors });
      },

      // Theme generation
      generateThemeFromColors: (name: string, primaryColor: string, secondaryColor?: string) => {
        const theme = ThemeGenerator.createThemeFromBrandColors(name, primaryColor, secondaryColor);
        get().saveTheme(theme);
        return theme;
      },

      generateRandomTheme: (category: CustomTheme['category']) => {
        // Generate random colors for theme
        const randomHue = Math.floor(Math.random() * 360);
        const primaryColor = `hsl(${randomHue}, 70%, 50%)`;
        const secondaryHue = (randomHue + 120) % 360;
        const secondaryColor = `hsl(${secondaryHue}, 60%, 45%)`;

        const theme = ThemeGenerator.createThemeFromBrandColors(
          `Random ${category} Theme`,
          primaryColor,
          secondaryColor
        );

        theme.category = category;
        get().saveTheme(theme);
        return theme;
      },

      // Import/Export
      exportTheme: (themeId: string, format: 'json' | 'css') => {
        const theme = get().getThemeById(themeId);
        if (!theme) return '';

        if (format === 'json') {
          return JSON.stringify(theme, null, 2);
        } else {
          return ThemeApplicator.generateCSS(theme, { includeUtilities: true });
        }
      },

      importTheme: async (themeData: string | CustomTheme) => {
        try {
          let theme: CustomTheme;

          if (typeof themeData === 'string') {
            theme = JSON.parse(themeData);
          } else {
            theme = themeData;
          }

          // Validate imported theme
          const { isValid, errors } = ThemeValidator.validateTheme(theme);
          if (!isValid) {
            throw new Error(`Invalid theme: ${errors.map(e => e.message).join(', ')}`);
          }

          // Generate new ID to avoid conflicts
          theme.id = `imported-${Date.now()}`;
          theme.metadata.updatedAt = new Date().toISOString();

          get().saveTheme(theme);
          return theme;
        } catch (error) {
          throw new Error(`Failed to import theme: ${error}`);
        }
      },

      // Utility functions
      getThemeById: (themeId: string) => {
        const { customThemes } = get();
        return customThemes[themeId] || themePresets[themeId as keyof typeof themePresets];
      },

      getAllThemes: () => {
        const { customThemes } = get();
        return [...Object.values(themePresets), ...Object.values(customThemes)];
      },

      getThemesByCategory: (category: CustomTheme['category']) => {
        return get()
          .getAllThemes()
          .filter(theme => theme.category === category);
      },

      searchThemes: (query: string) => {
        const searchTerm = query.toLowerCase();
        return get()
          .getAllThemes()
          .filter(
            theme =>
              theme.name.toLowerCase().includes(searchTerm) ||
              theme.description?.toLowerCase().includes(searchTerm) ||
              theme.metadata.tags?.some(tag => tag.toLowerCase().includes(searchTerm))
          );
      },

      // Analytics
      trackThemeUsage: (themeId: string) => {
        const now = new Date().toISOString();

        set(state => ({
          themeUsageStats: {
            ...state.themeUsageStats,
            [themeId]: {
              usageCount: (state.themeUsageStats[themeId]?.usageCount || 0) + 1,
              lastUsed: now,
              averageSessionTime: state.themeUsageStats[themeId]?.averageSessionTime || 0,
            },
          },
        }));
      },

      getThemeAnalytics: (themeId: string) => {
        return get().themeUsageStats[themeId] || null;
      },

      // Reset and initialization
      resetToDefaults: () => {
        set(getInitialState());
        get().initializePresets();
      },

      initializePresets: () => {
        // Apply default theme on initialization
        get().applyTheme(academicTheme);
      },
    }),
    {
      name: 'evidens-theme-store',
      storage: createJSONStorage(() => localStorage),
      partialize: state => ({
        customThemes: state.customThemes,
        favoriteThemes: state.favoriteThemes,
        recentThemes: state.recentThemes,
        currentTheme: state.currentTheme,
        applicationMode: state.applicationMode,
        themeUsageStats: state.themeUsageStats,
      }),
    }
  )
);

// Selectors for better performance
export const useCurrentTheme = () => useThemeStore(state => state.currentTheme);
export const useThemeEditor = () =>
  useThemeStore(state => ({
    isOpen: state.isThemeEditorOpen,
    editingTheme: state.editingTheme,
    changes: state.editorChanges,
    errors: state.validationErrors,
  }));
export const useCustomThemes = () => useThemeStore(state => state.customThemes);
export const useFavoriteThemes = () =>
  useThemeStore(state =>
    state.favoriteThemes.map(id => useThemeStore.getState().getThemeById(id)).filter(Boolean)
  );
export const useRecentThemes = () =>
  useThemeStore(state =>
    state.recentThemes.map(id => useThemeStore.getState().getThemeById(id)).filter(Boolean)
  );
