
// ABOUTME: Zustand store for managing authentication state without making API calls.
import { create } from 'zustand';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

type AuthState = {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  setSession: (session: Session | null) => void;
  initialize: () => () => void;
};

/**
 * Auth store that ONLY manages authentication state.
 * Does NOT fetch user profile data - that comes from AppDataContext.
 * Follows the principle of minimal API calls.
 */
export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  isLoading: true,
  setSession: (session) => set({ session, user: session?.user ?? null }),
  initialize: () => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        set({ session, user: session?.user ?? null, isLoading: false });
        // NOTE: We do NOT fetch practitioner data here anymore
        // That is handled by AppDataContext via the consolidated hook
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  },
}));
