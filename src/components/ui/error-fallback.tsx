
// ABOUTME: Generic error fallback component with retry mechanisms and contextual error reporting.

import React from 'react';
import { AlertTriangle, RefreshCw, Home, ArrowLeft } from 'lucide-react';
import { Button } from './button';
import { Alert, AlertDescription, AlertTitle } from './alert';
import { Card, CardContent, CardHeader } from './card';

export interface ErrorInfo {
  componentStack: string;
  errorBoundary?: string;
}

export interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
  errorInfo?: ErrorInfo;
  context?: string;
  showDetails?: boolean;
  showHomeButton?: boolean;
  showBackButton?: boolean;
}

export const ErrorFallback = ({
  error,
  resetError,
  errorInfo,
  context = 'aplicação',
  showDetails = false,
  showHomeButton = true,
  showBackButton = false
}: ErrorFallbackProps) => {
  const [showDetailedError, setShowDetailedError] = React.useState(false);
  
  // Categorize error types for better user messaging
  const getErrorCategory = (error: Error): {
    type: 'network' | 'data' | 'permission' | 'generic';
    userMessage: string;
    actionable: boolean;
  } => {
    const errorMessage = error.message.toLowerCase();
    
    if (errorMessage.includes('fetch') || errorMessage.includes('network') || errorMessage.includes('conexão')) {
      return {
        type: 'network',
        userMessage: 'Problema de conexão. Verifique sua internet e tente novamente.',
        actionable: true
      };
    }
    
    if (errorMessage.includes('unauthorized') || errorMessage.includes('permission') || errorMessage.includes('forbidden')) {
      return {
        type: 'permission',
        userMessage: 'Você não tem permissão para acessar este conteúdo.',
        actionable: false
      };
    }
    
    if (errorMessage.includes('not found') || errorMessage.includes('não encontrado')) {
      return {
        type: 'data',
        userMessage: 'O conteúdo solicitado não foi encontrado.',
        actionable: false
      };
    }
    
    return {
      type: 'generic',
      userMessage: `Ocorreu um erro inesperado na ${context}.`,
      actionable: true
    };
  };

  const errorCategory = getErrorCategory(error);
  
  // Report error to console with context
  React.useEffect(() => {
    console.group(`🚨 Error Boundary: ${context}`);
    console.error('Error:', error);
    console.error('Error Info:', errorInfo);
    console.error('Component Stack:', errorInfo?.componentStack);
    console.error('Error Boundary:', errorInfo?.errorBoundary);
    console.groupEnd();
  }, [error, errorInfo, context]);

  const handleGoHome = () => {
    window.location.href = '/';
  };
  
  const handleGoBack = () => {
    window.history.back();
  };

  return (
    <div className="min-h-[400px] flex items-center justify-center p-6">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6 text-destructive" />
          </div>
          <h2 className="text-xl font-semibold">Ops! Algo deu errado</h2>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <Alert variant={errorCategory.type === 'network' ? 'default' : 'destructive'}>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>
              {errorCategory.type === 'network' ? 'Problema de Conexão' : 
               errorCategory.type === 'permission' ? 'Acesso Negado' :
               errorCategory.type === 'data' ? 'Conteúdo Não Encontrado' :
               'Erro do Sistema'}
            </AlertTitle>
            <AlertDescription>
              {errorCategory.userMessage}
            </AlertDescription>
          </Alert>

          {showDetails && (
            <div className="space-y-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDetailedError(!showDetailedError)}
                className="text-xs"
              >
                {showDetailedError ? 'Ocultar' : 'Ver'} detalhes técnicos
              </Button>
              
              {showDetailedError && (
                <div className="text-xs text-muted-foreground bg-muted p-3 rounded border font-mono">
                  <div><strong>Erro:</strong> {error.message}</div>
                  {errorInfo?.componentStack && (
                    <div className="mt-2">
                      <strong>Componente:</strong>
                      <pre className="whitespace-pre-wrap text-xs mt-1">
                        {errorInfo.componentStack.split('\n').slice(0, 5).join('\n')}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2">
            {errorCategory.actionable && (
              <Button onClick={resetError} className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4" />
                Tentar Novamente
              </Button>
            )}
            
            {showBackButton && (
              <Button variant="outline" onClick={handleGoBack} className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </Button>
            )}
            
            {showHomeButton && (
              <Button variant="outline" onClick={handleGoHome} className="flex items-center gap-2">
                <Home className="w-4 h-4" />
                Ir para Início
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ErrorFallback;
