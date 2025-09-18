// ABOUTME: Hook for listening to payment webhook events with realtime + polling fallback
import { useEffect, useCallback, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface PaymentWebhookEvent {
  id: string;
  event_type: 'charge.paid' | 'charge.payment_failed' | 'subscription.created';
  payment_id: string;
  customer_id: string;
  amount: number;
  status: 'paid' | 'failed' | 'pending';
  payment_method: 'pix' | 'credit_card';
  processed_at: string;
  webhook_data?: Record<string, any>;
}

interface UseWebhookListenerProps {
  paymentId?: string;
  onPaymentSuccess?: (event: PaymentWebhookEvent) => void;
  onPaymentFailed?: (event: PaymentWebhookEvent) => void;
  enabled?: boolean;
  timeout?: number; // Timeout in milliseconds (default: 5 minutes)
  pollInterval?: number; // Polling interval when WebSocket fails (default: 3 seconds)
}

export function useWebhookListener({
  paymentId,
  onPaymentSuccess,
  onPaymentFailed,
  enabled = true,
  timeout = 5 * 60 * 1000, // 5 minutes default
  pollInterval = 3000 // 3 seconds polling fallback
}: UseWebhookListenerProps) {
  const timeoutRef = useRef<NodeJS.Timeout>();
  const channelRef = useRef<any>();
  const pollIntervalRef = useRef<NodeJS.Timeout>();
  const [isPolling, setIsPolling] = useState(false);
  const [lastEventId, setLastEventId] = useState<string | null>(null);

  const cleanup = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = undefined;
    }
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = undefined;
    }
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = undefined;
    }
    setIsPolling(false);
  }, []);

  const handleWebhookEvent = useCallback((event: PaymentWebhookEvent) => {
    console.log('📡 Webhook event received:', event);

    // Check if this event is for our payment
    if (paymentId && event.payment_id !== paymentId) {
      console.log('🔇 Ignoring webhook event for different payment ID:', event.payment_id);
      return;
    }

    // Prevent duplicate processing
    if (lastEventId === event.id) {
      console.log('🔇 Ignoring duplicate webhook event:', event.id);
      return;
    }

    setLastEventId(event.id);
    console.log('✅ Processing webhook event for payment:', event.payment_id, 'Type:', event.event_type);

    switch (event.event_type) {
      case 'charge.paid':
        console.log('💰 Payment successful via webhook:', event.payment_id);
        toast.success('Pagamento confirmado! Bem-vindo(a) ao EVIDENS!');
        onPaymentSuccess?.(event);
        cleanup();
        break;

      case 'charge.payment_failed':
        console.log('❌ Payment failed via webhook:', event.payment_id);
        toast.error('Pagamento não confirmado. Tente novamente.');
        onPaymentFailed?.(event);
        cleanup();
        break;

      default:
        console.log('ℹ️ Unhandled webhook event type:', event.event_type);
    }
  }, [paymentId, onPaymentSuccess, onPaymentFailed, cleanup, lastEventId]);

  const handleRealtimeEvent = useCallback((payload: any) => {
    const event = payload.new as PaymentWebhookEvent;
    handleWebhookEvent(event);
  }, [handleWebhookEvent]);

  // Polling fallback function
  const pollForWebhookEvents = useCallback(async () => {
    if (!paymentId) return;

    try {
      const { data, error } = await supabase
        .from('payment_webhooks')
        .select('*')
        .eq('payment_id', paymentId)
        .eq('event_type', 'charge.paid')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('❌ Error polling for webhook events:', error);
        return;
      }

      if (data && data.length > 0) {
        const event = data[0] as PaymentWebhookEvent;
        if (event.id !== lastEventId) {
          console.log('📊 Found webhook event via polling:', event);
          handleWebhookEvent(event);
        }
      }
    } catch (error) {
      console.error('❌ Polling error:', error);
    }
  }, [paymentId, handleWebhookEvent, lastEventId]);

  const startPolling = useCallback(() => {
    if (isPolling) return;

    console.log('🔄 Starting polling fallback for payment:', paymentId);
    setIsPolling(true);

    pollIntervalRef.current = setInterval(pollForWebhookEvents, pollInterval);
    // Initial poll
    pollForWebhookEvents();
  }, [isPolling, paymentId, pollForWebhookEvents, pollInterval]);

  useEffect(() => {
    if (!enabled || !paymentId) {
      cleanup();
      return;
    }

    console.log('🎧 Setting up webhook listener for payment:', paymentId);

    // Try realtime first, fallback to polling if it fails
    const channel = supabase
      .channel('payment-webhooks')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'payment_webhooks',
          filter: `payment_id=eq.${paymentId}`
        },
        handleRealtimeEvent
      )
      .subscribe((status) => {
        console.log('📻 Webhook listener subscription status:', status);

        if (status === 'SUBSCRIBED') {
          console.log('✅ Realtime webhook listener active for payment:', paymentId);
        } else if (status === 'CHANNEL_ERROR' || status === 'CLOSED') {
          console.log('🔄 Realtime failed, switching to polling fallback');
          startPolling();
        }
      });

    channelRef.current = channel;

    // Start polling after a short delay if realtime doesn't connect
    const fallbackTimeout = setTimeout(() => {
      if (!channelRef.current || channelRef.current.state !== 'joined') {
        console.log('🔄 Realtime connection timeout, starting polling fallback');
        startPolling();
      }
    }, 5000); // 5 second timeout before fallback

    // Set up timeout to stop listening after specified time
    timeoutRef.current = setTimeout(() => {
      console.log('⏰ Webhook listener timeout reached for payment:', paymentId);
      toast.warning('Tempo limite para confirmação de pagamento atingido. Verifique seu email ou entre em contato conosco.');
      cleanup();
    }, timeout);

    return () => {
      clearTimeout(fallbackTimeout);
      cleanup();
    };
  }, [enabled, paymentId, timeout, handleRealtimeEvent, cleanup, startPolling]);

  return {
    cleanup,
    isPolling
  };
}