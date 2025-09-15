// ABOUTME: Hook to protect payment state from page refreshes using sessionStorage
import { useState, useEffect, useCallback } from 'react';

export interface PaymentState {
  view: 'form' | 'pix-display' | 'processing' | 'success' | 'result';
  paymentData?: {
    paymentId?: string;
    customerName?: string;
    customerEmail?: string;
    paymentMethod?: 'pix' | 'credit_card';
    amount?: number;
    orderId?: string;
    planName?: string;
    pixQrCode?: string;
    pixQrCodeUrl?: string;
  };
  paymentResult?: any;
  formData?: any;
  currentStep?: number;
  processingStartTime?: number;
}

const STORAGE_KEY = 'payment_state_v2';
const MAX_SESSION_TIME = 30 * 60 * 1000; // 30 minutes

export function usePaymentStateProtection() {
  const [paymentState, setPaymentState] = useState<PaymentState>({ view: 'form' });
  const [isRestored, setIsRestored] = useState(false);

  // Save state to sessionStorage
  const savePaymentState = useCallback((state: PaymentState) => {
    try {
      const stateWithTimestamp = {
        ...state,
        timestamp: Date.now()
      };
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(stateWithTimestamp));
      setPaymentState(state);
    } catch (error) {
      console.warn('Failed to save payment state:', error);
      setPaymentState(state);
    }
  }, []);

  // Load state from sessionStorage
  const loadPaymentState = useCallback((): PaymentState | null => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (!stored) return null;

      const parsedState = JSON.parse(stored);
      const now = Date.now();

      // Check if session is too old
      if (parsedState.timestamp && (now - parsedState.timestamp) > MAX_SESSION_TIME) {
        clearPaymentState();
        return null;
      }

      // Only restore certain views to prevent issues
      const allowedViews = ['processing', 'success'];
      if (allowedViews.includes(parsedState.view)) {
        const { timestamp, ...state } = parsedState;
        return state;
      }

      return null;
    } catch (error) {
      console.warn('Failed to load payment state:', error);
      clearPaymentState();
      return null;
    }
  }, []);

  // Clear state from sessionStorage
  const clearPaymentState = useCallback(() => {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.warn('Failed to clear payment state:', error);
    }
  }, []);

  // Check if we should show refresh warning
  const shouldShowRefreshWarning = useCallback((view: string) => {
    return view === 'processing' || view === 'pix-display';
  }, []);

  // Initialize on mount
  useEffect(() => {
    const restoredState = loadPaymentState();
    if (restoredState) {
      console.log('🔄 Restored payment state from page refresh:', restoredState.view);

      // Adjust processing time if restoring processing state
      if (restoredState.view === 'processing' && restoredState.processingStartTime) {
        const elapsed = Math.floor((Date.now() - restoredState.processingStartTime) / 1000);
        console.log(`⏰ Payment has been processing for ${elapsed} seconds`);
      }

      setPaymentState(restoredState);
    }
    setIsRestored(true);
  }, [loadPaymentState]);

  // Set up beforeunload warning for critical states
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (shouldShowRefreshWarning(paymentState.view)) {
        e.preventDefault();
        e.returnValue = 'Seu pagamento está sendo processado. Tem certeza que deseja sair?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [paymentState.view, shouldShowRefreshWarning]);

  return {
    paymentState,
    savePaymentState,
    clearPaymentState,
    isRestored,
    shouldShowRefreshWarning: shouldShowRefreshWarning(paymentState.view)
  };
}