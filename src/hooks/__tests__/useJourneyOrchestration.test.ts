// ABOUTME: Tests for journey orchestration hook ensuring smooth payment-to-auth bridging

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { useJourneyOrchestration, usePaymentToAuthBridge } from '../useJourneyOrchestration';
import * as authStore from '@/store/auth';
import type { User } from '@supabase/supabase-js';
import type { Practitioner } from '@/types/onboarding';

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({
      pathname: '/test',
      search: '?source=payment&paymentId=pay_123&customerName=John%20Doe',
    }),
  };
});

// Mock auth store
vi.mock('@/store/auth', () => ({
  useAuthStore: vi.fn(),
}));

// Mock data
const createMockUser = (overrides: Partial<User> = {}): User => ({
  id: 'test-user-id',
  email: 'test@example.com',
  email_confirmed_at: new Date().toISOString(),
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
  created_at: new Date().toISOString(),
  identities: [{
    id: 'test-identity-id',
    user_id: 'test-user-id',
    identity_data: {},
    provider: 'email',
    created_at: new Date().toISOString(),
    last_sign_in_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }],
  ...overrides
});

const createMockPractitioner = (overrides: Partial<Practitioner> = {}): Practitioner => ({
  id: 'test-user-id',
  full_name: 'John Doe',
  avatar_url: null,
  role: 'practitioner',
  subscription_tier: 'free',
  contribution_score: 0,
  display_hover_card: true,
  created_at: new Date().toISOString(),
  profession: 'Médico',
  linkedin_url: null,
  youtube_url: null,
  instagram_url: null,
  facebook_url: null,
  twitter_url: null,
  website_url: null,
  subscription_status: 'inactive',
  subscription_starts_at: null,
  subscription_ends_at: null,
  payment_metadata: {},
  updated_at: new Date().toISOString(),
  ...overrides
});

const renderHookWithRouter = (hook: any) => {
  const wrapper = ({ children }: { children: React.ReactNode }) => 
    React.createElement(MemoryRouter, { initialEntries: ['/test?source=payment&paymentId=pay_123'] }, children);
  
  return renderHook(hook, { wrapper });
};

describe('useJourneyOrchestration', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockNavigate.mockReset();
    vi.mocked(authStore.useAuthStore).mockReturnValue({
      user: createMockUser(),
      practitioner: createMockPractitioner(),
      isLoading: false,
    });
  });

  it('should parse journey parameters from URL', () => {
    const { result } = renderHookWithRouter(() => useJourneyOrchestration());
    
    expect(result.current.journeyParams).toEqual({
      source: 'payment',
      paymentId: 'pay_123',
      flow: null,
      token: null,
    });
  });

  it('should preserve payment data from URL parameters', () => {
    const { result } = renderHookWithRouter(() => useJourneyOrchestration());
    
    expect(result.current.preservedPaymentData).toEqual({
      customerName: 'John Doe',
      paymentId: 'pay_123',
    });
  });


  it('should redirect to profile completion when profile incomplete', () => {
    // Mock incomplete profile
    vi.mocked(authStore.useAuthStore).mockReturnValue({
      user: createMockUser(),
      practitioner: createMockPractitioner({ profession: null }),
      isLoading: false,
    });

    const { result } = renderHookWithRouter(() => useJourneyOrchestration());
    
    // Should eventually navigate to profile completion
    expect(result.current.journeyState?.needsProfileCompletion).toBe(true);
    expect(result.current.journeyState?.targetRoute).toBe('/completar-perfil');
  });

  it('should redirect to payment success when coming from payment with complete profile', () => {
    const { result } = renderHookWithRouter(() => useJourneyOrchestration());
    
    // Should navigate to payment success
    expect(result.current.journeyState?.needsProfileCompletion).toBe(false);
    expect(result.current.journeyState?.targetRoute).toBe('/pagamento-sucesso');
  });

  it('should get profile completeness correctly', () => {
    const { result } = renderHookWithRouter(() => useJourneyOrchestration());
    
    const completeness = result.current.profileCompleteness;
    expect(completeness).toBeDefined();
    expect(completeness?.isComplete).toBe(true);
  });

  it('should trigger journey with custom parameters', () => {
    const { result } = renderHookWithRouter(() => useJourneyOrchestration());
    
    act(() => {
      result.current.triggerJourney(
        { source: 'google-auth', flow: 'profile-incomplete' },
        { customerName: 'Jane Doe' }
      );
    });

    // Check if navigate was called with the correct URL
    const lastCall = mockNavigate.mock.calls[mockNavigate.mock.calls.length - 1];
    const url = lastCall[0];
    
    expect(url).toContain('source=google-auth');
    expect(url).toContain('flow=profile-incomplete');
    expect(url).toContain('customerName=Jane+Doe');
  });
});

describe('usePaymentToAuthBridge', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockNavigate.mockReset();
  });

  it('should bridge from payment with correct parameters', () => {
    const { result } = renderHookWithRouter(() => usePaymentToAuthBridge());
    
    act(() => {
      result.current.bridgeFromPayment({
        customerName: 'John Doe',
        paymentId: 'pay_123',
        planPurchased: 'pro',
        amountPaid: 97,
      });
    });

    expect(mockNavigate).toHaveBeenCalledWith(
      expect.stringContaining('source=payment')
    );
    expect(mockNavigate).toHaveBeenCalledWith(
      expect.stringContaining('flow=payment-complete')
    );
  });

  it('should bridge from Google auth with correct parameters', () => {
    const { result } = renderHookWithRouter(() => usePaymentToAuthBridge());
    
    act(() => {
      result.current.bridgeFromGoogleAuth();
    });

    expect(mockNavigate).toHaveBeenCalledWith(
      expect.stringContaining('source=google-auth')
    );
    expect(mockNavigate).toHaveBeenCalledWith(
      expect.stringContaining('flow=profile-incomplete')
    );
  });
});