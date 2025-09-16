// ABOUTME: Hook to redirect users who need password setup after payment-based account creation

import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';

/**
 * Hook that checks if the current user needs password setup and redirects them appropriately
 * This handles users who were created via payment but bypass the normal registration flow
 */
export function usePasswordSetupRedirect() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();

  useEffect(() => {
    // Only check if user is authenticated
    if (!user) return;

    console.log('🔐 usePasswordSetupRedirect check:', {
      pathname: location.pathname,
      user_metadata: user.user_metadata,
      needs_password_setup: user.user_metadata?.needs_password_setup,
      invited_via: user.user_metadata?.invited_via
    });

    // Don't redirect if already on password setup pages
    const passwordSetupPaths = [
      '/complete-registration',
      '/redefinir-senha',
      '/login',
      '/registrar'
    ];

    if (passwordSetupPaths.some(path => location.pathname.startsWith(path))) {
      console.log('🔐 Already on password setup page, skipping redirect');
      return;
    }

    // Don't redirect if user is in any auth flow (has auth tokens in URL)
    const urlParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const hasAuthTokens =
      urlParams.get('access_token') || hashParams.get('access_token') ||
      urlParams.get('type') === 'recovery' || hashParams.get('type') === 'recovery' ||
      urlParams.get('type') === 'invite' || hashParams.get('type') === 'invite' ||
      urlParams.get('type') === 'signup' || hashParams.get('type') === 'signup';

    if (hasAuthTokens) {
      console.log('🔐 User in auth flow with tokens, skipping redirect');
      return;
    }

    // Check if user needs password setup from payment flow
    const needsPasswordSetup = user.user_metadata?.needs_password_setup === 'true' || user.user_metadata?.needs_password_setup === true;
    const invitedViaPayment = user.user_metadata?.invited_via === 'payment';

    if (needsPasswordSetup && invitedViaPayment) {
      console.log('🔐 User needs password setup (auto-redirect disabled)');
      // Auto-redirect disabled - let user navigate manually
    }
  }, [user, navigate, location.pathname]);

  return {
    needsPasswordSetup: user?.user_metadata?.needs_password_setup === 'true' || user?.user_metadata?.needs_password_setup === true,
    invitedViaPayment: user?.user_metadata?.invited_via === 'payment'
  };
}