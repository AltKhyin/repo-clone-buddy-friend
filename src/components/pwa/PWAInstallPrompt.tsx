
// ABOUTME: PWA installation prompt component with iOS and Android support.

import React from 'react';
import { usePWA } from '@/hooks/usePWA';
import { Download, Share, X, Plus, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useIsMobile } from '@/hooks/use-mobile';

interface PWAInstallPromptProps {
  onDismiss?: () => void;
}

const PWAInstallPrompt: React.FC<PWAInstallPromptProps> = ({ onDismiss }) => {
  const { isInstallable, isIOS, isStandalone, showInstallPrompt, dismissInstallPrompt } = usePWA();
  const isMobile = useIsMobile();

  // Don't show if already installed or not installable
  if (isStandalone || !isInstallable) {
    return null;
  }

  const handleInstall = async () => {
    if (isIOS) {
      // For iOS, we can only show instructions
      return;
    } else {
      // For Android/Chrome, trigger the native prompt
      await showInstallPrompt();
    }
  };

  const handleDismiss = () => {
    dismissInstallPrompt();
    onDismiss?.();
  };

  return (
    <Card className="fixed bottom-4 left-4 right-4 z-50 border-primary/20 bg-background/95 backdrop-blur-sm md:left-auto md:right-4 md:w-96">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Instalar App</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDismiss}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription>
          Instale o Reviews no seu dispositivo para uma experiência melhor!
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        {isIOS ? (
          // iOS Installation Instructions
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Para instalar no iOS:
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  1
                </span>
                <span>Toque no ícone de compartilhar</span>
                <Share className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  2
                </span>
                <span>Selecione "Adicionar à Tela de Início"</span>
                <Plus className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  3
                </span>
                <span>Confirme tocando em "Adicionar"</span>
              </div>
            </div>
          </div>
        ) : (
          // Android/Chrome Installation
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Tenha acesso rápido e funcionalidades offline.
            </p>
            <div className="flex gap-2">
              <Button onClick={handleInstall} className="flex-1" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Instalar Agora
              </Button>
              <Button variant="outline" onClick={handleDismiss} size="sm">
                Depois
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PWAInstallPrompt;
