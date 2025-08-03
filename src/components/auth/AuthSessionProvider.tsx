
// ABOUTME: Provider component to initialize the auth state listener on app startup.
import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth';

const AuthSessionProvider = ({ children }: { children: React.ReactNode }) => {
  const initialize = useAuthStore((state) => state.initialize);

  useEffect(() => {
    try {
      const unsubscribe = initialize();
      return () => {
        unsubscribe();
      };
    } catch (error) {
      console.error('AuthSessionProvider: Failed to initialize auth:', error);
    }
  }, [initialize]);

  return <>{children}</>;
};

export default AuthSessionProvider;
