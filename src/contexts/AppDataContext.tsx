
// ABOUTME: Global app data context provider for consolidated homepage data.
import React, { createContext, useContext } from 'react';
import { useConsolidatedHomepageFeedQuery, type ConsolidatedHomepageData, type UserProfile } from '../../packages/hooks/useHomepageFeedQuery';

interface AppDataContextType {
  data: ConsolidatedHomepageData | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
  userProfile: UserProfile | null;
  notificationCount: number;
}

const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

export const AppDataProvider = ({ children }: { children: React.ReactNode }) => {
  const queryResult = useConsolidatedHomepageFeedQuery();
  
  console.log('AppDataProvider state:', {
    isLoading: queryResult.isLoading,
    isError: queryResult.isError,
    hasData: !!queryResult.data,
    error: queryResult.error
  });

  const contextValue: AppDataContextType = {
    data: queryResult.data,
    isLoading: queryResult.isLoading,
    isError: queryResult.isError,
    error: queryResult.error,
    refetch: queryResult.refetch,
    userProfile: queryResult.data?.userProfile || null,
    notificationCount: queryResult.data?.notificationCount || 0,
  };

  return (
    <AppDataContext.Provider value={contextValue}>
      {children}
    </AppDataContext.Provider>
  );
};

export const useAppData = () => {
  const context = useContext(AppDataContext);
  if (context === undefined) {
    throw new Error('useAppData must be used within an AppDataProvider');
  }
  return context;
};
