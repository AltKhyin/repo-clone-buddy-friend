// ABOUTME: PWA context definition separated for Fast Refresh compatibility

import { createContext } from 'react';

export interface PWAContextType {
  showInstallPrompt: boolean;
  setShowInstallPrompt: (show: boolean) => void;
  isInstalled: boolean;
  isInstallable: boolean;
}

export const PWAContext = createContext<PWAContextType | undefined>(undefined);
