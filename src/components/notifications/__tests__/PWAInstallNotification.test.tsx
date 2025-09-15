// ABOUTME: Minimal test suite for PWA notification component

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PWAInstallNotification } from '../PWAInstallNotification';

// Mock the usePWA hook
vi.mock('@/hooks/usePWA', () => ({
  usePWA: vi.fn(() => ({
    shouldShowNotification: true,
    installMethod: 'native',
    deviceInfo: { isAndroid: true, isMobile: true },
    showInstallPrompt: vi.fn(),
    handleDismissNotification: vi.fn(),
    isStandalone: false,
  }))
}));

describe('PWAInstallNotification', () => {
  it('should render install notification for Android devices', () => {
    render(<PWAInstallNotification />);

    expect(screen.getByText('Instalar como App')).toBeInTheDocument();
    expect(screen.getByText('Acesso mais rápido ao Reviews')).toBeInTheDocument();
  });

  it('should not render if shouldShowNotification is false', () => {
    const { usePWA } = require('@/hooks/usePWA');
    usePWA.mockReturnValue({
      shouldShowNotification: false,
      isStandalone: false,
    });

    const { container } = render(<PWAInstallNotification />);
    expect(container.firstChild).toBeNull();
  });

  it('should not render for non-Android devices', () => {
    const { usePWA } = require('@/hooks/usePWA');
    usePWA.mockReturnValue({
      shouldShowNotification: false, // Will be false for iOS/desktop
      installMethod: 'unsupported',
      deviceInfo: { isAndroid: false, isMobile: false },
      showInstallPrompt: vi.fn(),
      handleDismissNotification: vi.fn(),
      isStandalone: false,
    });

    const { container } = render(<PWAInstallNotification />);
    expect(container.firstChild).toBeNull();
  });
});