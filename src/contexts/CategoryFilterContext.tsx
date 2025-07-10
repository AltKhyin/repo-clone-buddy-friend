// ABOUTME: Context for managing category filtering state across the community page

import React, { createContext, useContext, useState, useCallback } from 'react';

interface CategoryFilterContextType {
  selectedCategoryId: string | null;
  setSelectedCategoryId: (categoryId: string | null) => void;
  clearCategoryFilter: () => void;
}

const CategoryFilterContext = createContext<CategoryFilterContextType | null>(null);

export const useCategoryFilter = () => {
  const context = useContext(CategoryFilterContext);
  if (!context) {
    throw new Error('useCategoryFilter must be used within a CategoryFilterProvider');
  }
  return context;
};

interface CategoryFilterProviderProps {
  children: React.ReactNode;
}

export const CategoryFilterProvider = ({ children }: CategoryFilterProviderProps) => {
  const [selectedCategoryId, setSelectedCategoryIdState] = useState<string | null>(null);

  const setSelectedCategoryId = useCallback((categoryId: string | null) => {
    setSelectedCategoryIdState(categoryId);
  }, []);

  const clearCategoryFilter = useCallback(() => {
    setSelectedCategoryIdState(null);
  }, []);

  const value = {
    selectedCategoryId,
    setSelectedCategoryId,
    clearCategoryFilter,
  };

  return <CategoryFilterContext.Provider value={value}>{children}</CategoryFilterContext.Provider>;
};
