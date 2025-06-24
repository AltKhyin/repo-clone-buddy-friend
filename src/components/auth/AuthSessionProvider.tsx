
// ABOUTME: Provider component to initialize the auth state listener on app startup.
import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth';

const AuthSessionProvider = ({ children }: { children: React.ReactNode }) => {
  const initialize = useAuthStore((state) => state.initialize);

  useEffect(() => {
    console.log('AuthSessionProvider: Initializing auth...');
    try {
      const unsubscribe = initialize();
      console.log('AuthSessionProvider: Auth initialized successfully');
      return () => {
        console.log('AuthSessionProvider: Cleaning up auth listener');
        unsubscribe();
      };
    } catch (error) {
      console.error('AuthSessionProvider: Failed to initialize auth:', error);
    }
  }, [initialize]);

  return <>{children}</>;
};

export default AuthSessionProvider;
