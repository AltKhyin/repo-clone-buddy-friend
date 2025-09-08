// ABOUTME: Simple journey orchestration hook for bridging payment and auth flows to prevent user loss

import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';
import { determineUserJourney, checkProfileCompleteness } from '@/lib/profileCompleteness';
import type { JourneyParams, PaymentUserData, UserJourney } from '@/types/onboarding';

/**
 * Simple journey state management during auth transitions
 */
export function useJourneyOrchestration() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, practitioner, isLoading } = useAuthStore();
  
  const [journeyState, setJourneyState] = useState<UserJourney | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Parse URL parameters for journey context
  const parseJourneyParams = (): JourneyParams => {
    const searchParams = new URLSearchParams(location.search);
    
    return {
      source: searchParams.get('source') as 'payment' | 'google-auth' | undefined,
      paymentId: searchParams.get('paymentId') || undefined,
      token: searchParams.get('token') || undefined,
      flow: searchParams.get('flow') as 'payment-complete' | 'profile-incomplete' | undefined,
    };
  };

  // Preserve payment data during auth flow
  const preservePaymentData = (): PaymentUserData | undefined => {
    const searchParams = new URLSearchParams(location.search);
    
    const paymentData: PaymentUserData = {};
    
    if (searchParams.get('customerName')) paymentData.customerName = searchParams.get('customerName')!;
    if (searchParams.get('customerEmail')) paymentData.customerEmail = searchParams.get('customerEmail')!;
    if (searchParams.get('paymentId')) paymentData.paymentId = searchParams.get('paymentId')!;
    if (searchParams.get('planPurchased')) paymentData.planPurchased = searchParams.get('planPurchased')!;
    if (searchParams.get('amountPaid')) paymentData.amountPaid = Number(searchParams.get('amountPaid'));
    
    return Object.keys(paymentData).length > 0 ? paymentData : undefined;
  };

  // Build URL with journey parameters
  const buildJourneyUrl = (path: string, params: JourneyParams, paymentData?: PaymentUserData): string => {
    const url = new URL(path, window.location.origin);
    
    if (params.source) url.searchParams.set('source', params.source);
    if (params.paymentId) url.searchParams.set('paymentId', params.paymentId);
    if (params.token) url.searchParams.set('token', params.token);
    if (params.flow) url.searchParams.set('flow', params.flow);
    
    // Preserve payment data
    if (paymentData?.customerName) url.searchParams.set('customerName', paymentData.customerName);
    if (paymentData?.customerEmail) url.searchParams.set('customerEmail', paymentData.customerEmail);
    if (paymentData?.paymentId) url.searchParams.set('paymentId', paymentData.paymentId);
    if (paymentData?.planPurchased) url.searchParams.set('planPurchased', paymentData.planPurchased);
    if (paymentData?.amountPaid) url.searchParams.set('amountPaid', paymentData.amountPaid.toString());
    
    return url.pathname + url.search;
  };

  // Process journey when auth state changes
  useEffect(() => {
    if (isLoading || isProcessing) return;

    const journeyParams = parseJourneyParams();
    const paymentData = preservePaymentData();

    // Only process if we have journey parameters
    if (!journeyParams.source && !journeyParams.paymentId && !journeyParams.flow) {
      setJourneyState(null);
      return;
    }

    setIsProcessing(true);
    
    const journey = determineUserJourney(user, practitioner, journeyParams, paymentData);
    setJourneyState(journey);

    // Execute journey navigation
    if (journey.needsProfileCompletion) {
      const profileCompletionUrl = buildJourneyUrl(
        journey.targetRoute,
        journeyParams,
        journey.preservedData
      );
      navigate(profileCompletionUrl, { replace: true });
    } else if (journey.targetRoute !== location.pathname) {
      const targetUrl = buildJourneyUrl(
        journey.targetRoute,
        journeyParams,
        journey.preservedData
      );
      navigate(targetUrl, { replace: true });
    }

    setIsProcessing(false);
  }, [user, practitioner, isLoading, location.search, navigate, isProcessing]);

  // Helper to get current profile completeness
  const getProfileCompleteness = () => {
    if (!user || !practitioner) return null;
    return checkProfileCompleteness(user, practitioner);
  };

  // Helper to trigger journey with specific parameters
  const triggerJourney = (params: JourneyParams, paymentData?: PaymentUserData) => {
    const currentPath = location.pathname;
    const journeyUrl = buildJourneyUrl(currentPath, params, paymentData);
    navigate(journeyUrl);
  };

  return {
    journeyState,
    isProcessing,
    profileCompleteness: getProfileCompleteness(),
    journeyParams: parseJourneyParams(),
    preservedPaymentData: preservePaymentData(),
    triggerJourney,
  };
}

/**
 * Hook specifically for payment-to-auth bridging
 */
export function usePaymentToAuthBridge() {
  const { triggerJourney } = useJourneyOrchestration();
  
  const bridgeFromPayment = (paymentData: PaymentUserData) => {
    triggerJourney(
      { source: 'payment', flow: 'payment-complete' },
      paymentData
    );
  };

  const bridgeFromGoogleAuth = () => {
    triggerJourney(
      { source: 'google-auth', flow: 'profile-incomplete' }
    );
  };

  return {
    bridgeFromPayment,
    bridgeFromGoogleAuth,
  };
}