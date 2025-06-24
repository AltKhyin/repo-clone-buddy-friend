
// ABOUTME: Network-aware fallback component with offline detection and cache-first strategies for community module.

import React from 'react';
import { WifiOff, Wifi, RefreshCw, Clock } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';

interface NetworkAwareFallbackProps {
  isOnline?: boolean;
  lastSync?: Date;
  cachedData?: any;
  onRetry?: () => void;
  onRefresh?: () => void;
  context?: string;
  showCachedBadge?: boolean;
}

export const NetworkAwareFallback = ({
  isOnline = navigator.onLine,
  lastSync,
  cachedData,
  onRetry,
  onRefresh,
  context = 'conteúdo',
  showCachedBadge = true
}: NetworkAwareFallbackProps) => {
  const [isRetrying, setIsRetrying] = React.useState(false);
  const [networkStatus, setNetworkStatus] = React.useState(isOnline);

  // Monitor network status changes
  React.useEffect(() => {
    const handleOnline = () => setNetworkStatus(true);
    const handleOffline = () => setNetworkStatus(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetry = async () => {
    if (!onRetry) return;
    
    setIsRetrying(true);
    try {
      await onRetry();
    } finally {
      setIsRetrying(false);
    }
  };

  const formatLastSync = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'agora mesmo';
    if (diffInMinutes < 60) return `${diffInMinutes} min atrás`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h atrás`;
    return `${Math.floor(diffInMinutes / 1440)} dias atrás`;
  };

  // Offline state with cached data
  if (!networkStatus && cachedData) {
    return (
      <div className="space-y-4">
        {showCachedBadge && (
          <Alert>
            <WifiOff className="h-4 w-4" />
            <AlertTitle className="flex items-center gap-2">
              Modo Offline
              <Badge variant="secondary" className="text-xs">
                <Clock className="w-3 h-3 mr-1" />
                {lastSync ? formatLastSync(lastSync) : 'Cache local'}
              </Badge>
            </AlertTitle>
            <AlertDescription>
              Você está vendo o {context} salvo no seu dispositivo. 
              Conecte-se à internet para ver as atualizações mais recentes.
            </AlertDescription>
          </Alert>
        )}
        
        {/* Render cached content here - this would be passed as children or data */}
        <div className="opacity-90">
          {cachedData}
        </div>
      </div>
    );
  }

  // Offline state without cached data
  if (!networkStatus) {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-2">
            <WifiOff className="w-6 h-6 text-muted-foreground" />
          </div>
          <CardTitle>Sem Conexão</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            Não foi possível carregar o {context}. Verifique sua conexão com a internet.
          </p>
          
          <Button 
            variant="outline" 
            onClick={handleRetry}
            disabled={isRetrying}
            className="flex items-center gap-2"
          >
            {isRetrying ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Tentando...
              </>
            ) : (
              <>
                <Wifi className="w-4 h-4" />
                Tentar Novamente
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Online state with stale data
  if (networkStatus && lastSync && onRefresh) {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - lastSync.getTime()) / (1000 * 60));
    const isStale = diffInMinutes > 30; // Consider stale after 30 minutes

    if (isStale) {
      return (
        <div className="space-y-4">
          <Alert>
            <Clock className="h-4 w-4" />
            <AlertTitle>Dados Desatualizados</AlertTitle>
            <AlertDescription className="flex items-center justify-between">
              <span>
                Última atualização: {formatLastSync(lastSync)}
              </span>
              <Button 
                size="sm" 
                variant="outline"
                onClick={onRefresh}
                className="ml-2"
              >
                Atualizar
              </Button>
            </AlertDescription>
          </Alert>
          
          {cachedData && (
            <div className="opacity-95">
              {cachedData}
            </div>
          )}
        </div>
      );
    }
  }

  // Default: render nothing if online and data is fresh
  return null;
};

// Hook for network status monitoring
export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);
  const [lastOnline, setLastOnline] = React.useState<Date | null>(null);

  React.useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setLastOnline(new Date());
    };
    
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Set initial last online time if currently online
    if (navigator.onLine) {
      setLastOnline(new Date());
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline, lastOnline };
};

export default NetworkAwareFallback;
