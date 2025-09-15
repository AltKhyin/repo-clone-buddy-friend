// ABOUTME: Enhanced device detection utilities for PWA targeting and filtering

export interface DeviceInfo {
  isIOS: boolean;
  isAndroid: boolean;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  browser: 'chrome' | 'safari' | 'firefox' | 'edge' | 'samsung' | 'opera' | 'other';
  osVersion?: string;
}

/**
 * Comprehensive device and browser detection
 */
export const getDeviceInfo = (): DeviceInfo => {
  const userAgent = navigator.userAgent;

  // iOS Detection
  const isIOS = /iPad|iPhone|iPod/.test(userAgent);

  // Android Detection
  const isAndroid = /Android/.test(userAgent);

  // Browser Detection
  let browser: DeviceInfo['browser'] = 'other';
  if (/Chrome/.test(userAgent) && !/Edge/.test(userAgent)) {
    if (/SamsungBrowser/.test(userAgent)) {
      browser = 'samsung';
    } else {
      browser = 'chrome';
    }
  } else if (/Safari/.test(userAgent) && !/Chrome/.test(userAgent)) {
    browser = 'safari';
  } else if (/Firefox/.test(userAgent)) {
    browser = 'firefox';
  } else if (/Edge/.test(userAgent)) {
    browser = 'edge';
  } else if (/OPR/.test(userAgent)) {
    browser = 'opera';
  }

  // Screen size detection for mobile/tablet classification
  const screenWidth = window.screen.width;
  const screenHeight = window.screen.height;
  const maxDimension = Math.max(screenWidth, screenHeight);
  const minDimension = Math.min(screenWidth, screenHeight);

  // Device type detection
  let isMobile = false;
  let isTablet = false;
  let isDesktop = false;

  if (isIOS || isAndroid) {
    // Use screen size to distinguish mobile vs tablet on mobile OS
    if (maxDimension <= 667 || minDimension <= 375) {
      isMobile = true;
    } else {
      isTablet = true;
    }
  } else {
    // Desktop OS - check if it's a touch-enabled device
    const hasTouchScreen = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (hasTouchScreen && maxDimension <= 1024) {
      isTablet = true;
    } else {
      isDesktop = true;
    }
  }

  // OS Version extraction (basic)
  let osVersion: string | undefined;
  if (isIOS) {
    const match = userAgent.match(/OS (\d+)_(\d+)_?(\d+)?/);
    if (match) {
      osVersion = `${match[1]}.${match[2]}${match[3] ? '.' + match[3] : ''}`;
    }
  } else if (isAndroid) {
    const match = userAgent.match(/Android (\d+)\.(\d+)\.?(\d+)?/);
    if (match) {
      osVersion = `${match[1]}.${match[2]}${match[3] ? '.' + match[3] : ''}`;
    }
  }

  return {
    isIOS,
    isAndroid,
    isMobile,
    isTablet,
    isDesktop,
    browser,
    osVersion,
  };
};

/**
 * Check if device supports PWA installation
 */
export const supportsPWAInstall = (): boolean => {
  const device = getDeviceInfo();

  // Only support Android mobile Chrome and Samsung Browser
  if (device.isAndroid && device.isMobile && (device.browser === 'chrome' || device.browser === 'samsung')) {
    return true;
  }

  return false;
};

/**
 * Check if device should receive PWA notifications by default
 */
export const shouldShowPWAByDefault = (): boolean => {
  const device = getDeviceInfo();

  // Only show for Android mobile devices (no desktop, no iOS, no tablets)
  return device.isMobile && device.isAndroid;
};

/**
 * Get PWA installation method for current device
 */
export const getPWAInstallMethod = (): 'native' | 'manual' | 'unsupported' => {
  const device = getDeviceInfo();

  // Only Android mobile Chrome/Samsung use native prompts
  if (device.isAndroid && device.isMobile && (device.browser === 'chrome' || device.browser === 'samsung')) {
    return 'native';
  }

  return 'unsupported';
};

/**
 * Check if current device is running in standalone mode (PWA installed)
 */
export const isRunningStandalone = (): boolean => {
  // Check standard PWA standalone mode
  if (window.matchMedia('(display-mode: standalone)').matches) {
    return true;
  }

  // Check iOS standalone mode
  if ((window.navigator as any).standalone === true) {
    return true;
  }

  // Check Android app mode
  if (document.referrer.includes('android-app://')) {
    return true;
  }

  return false;
};

/**
 * Get user-friendly device description for logging/debugging
 */
export const getDeviceDescription = (): string => {
  const device = getDeviceInfo();

  const deviceType = device.isMobile ? 'Mobile' : device.isTablet ? 'Tablet' : 'Desktop';
  const os = device.isIOS ? 'iOS' : device.isAndroid ? 'Android' : 'Desktop';
  const browser = device.browser.charAt(0).toUpperCase() + device.browser.slice(1);

  return `${deviceType} ${os} ${browser}${device.osVersion ? ' ' + device.osVersion : ''}`;
};