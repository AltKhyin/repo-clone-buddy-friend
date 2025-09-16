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

    // Don't redirect if already on password setup pages
    const passwordSetupPaths = [
      '/complete-registration',
      '/redefinir-senha',
      '/login',
      '/registrar'
    ];

    if (passwordSetupPaths.some(path => location.pathname.startsWith(path))) {
      return;
    }

    // Don't redirect if user is in password recovery flow (has recovery token in URL)
    const urlParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const hasRecoveryToken = urlParams.get('type') === 'recovery' || hashParams.get('type') === 'recovery';

    if (hasRecoveryToken) {
      console.log('🔐 User in password recovery flow, skipping redirect');
      return;
    }

    // Check if user needs password setup from payment flow
    const needsPasswordSetup = user.user_metadata?.needs_password_setup === 'true' || user.user_metadata?.needs_password_setup === true;
    const invitedViaPayment = user.user_metadata?.invited_via === 'payment';

    if (needsPasswordSetup && invitedViaPayment) {
      console.log('🔐 User needs password setup, redirecting to complete registration');
      
      // Redirect to password setup with context
      navigate('/complete-registration?source=payment_login', { 
        replace: true 
      });
    }
  }, [user, navigate, location.pathname]);

  return {
    needsPasswordSetup: user?.user_metadata?.needs_password_setup === 'true' || user?.user_metadata?.needs_password_setup === true,
    invitedViaPayment: user?.user_metadata?.invited_via === 'payment'
  };
}