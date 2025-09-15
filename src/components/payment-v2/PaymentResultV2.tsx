// ABOUTME: Payment result display component for Payment V2.0 showing success/failure states
import React from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, XCircle, AlertTriangle, ArrowLeft, CreditCard, QrCode, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PaymentResultV2Data {
  type: 'success' | 'failure' | 'pending' | 'processing';
  title: string;
  message: string;
  details?: string;
  errorCode?: string;
  orderId?: string;
  paymentMethod?: 'pix' | 'credit_card';
  amount?: number;
  actions?: {
    primary?: {
      label: string;
      action: () => void;
      variant?: 'default' | 'destructive' | 'outline' | 'secondary';
    };
    secondary?: {
      label: string;
      action: () => void;
    };
    back?: {
      label: string;
      action: () => void;
    };
  };
}

interface PaymentResultV2Props {
  result: PaymentResultV2Data;
  className?: string;
}

export function PaymentResultV2({ result, className }: PaymentResultV2Props) {
  const getIcon = () => {
    switch (result.type) {
      case 'success':
        return <CheckCircle2 className="h-12 w-12 text-green-600" />;
      case 'failure':
        return <XCircle className="h-12 w-12 text-red-600" />;
      case 'pending':
        return <AlertTriangle className="h-12 w-12 text-yellow-600" />;
      case 'processing':
        return <RefreshCw className="h-12 w-12 text-blue-600 animate-spin" />;
      default:
        return <AlertTriangle className="h-12 w-12 text-gray-600" />;
    }
  };

  const getStatusColor = () => {
    switch (result.type) {
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'failure':
        return 'border-red-200 bg-red-50';
      case 'pending':
        return 'border-yellow-200 bg-yellow-50';
      case 'processing':
        return 'border-blue-200 bg-blue-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const getPaymentMethodIcon = () => {
    if (result.paymentMethod === 'pix') {
      return <QrCode className="h-4 w-4" />;
    }
    if (result.paymentMethod === 'credit_card') {
      return <CreditCard className="h-4 w-4" />;
    }
    return null;
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount / 100);
  };

  return (
    <div className={cn(
      "bg-white/95 backdrop-blur-sm rounded-xl shadow-lg w-full max-w-[400px] border-2",
      getStatusColor(),
      className
    )}>
      {/* Status Header */}
      <div className="p-6 text-center border-b border-gray-100">
        <div className="flex justify-center mb-4">
          {getIcon()}
        </div>
        
        <h2 className="text-xl font-serif tracking-tight text-black mb-2">
          {result.title}
        </h2>
        
        <p className="text-sm text-gray-600 leading-relaxed">
          {result.message}
        </p>
      </div>

      {/* Payment Details */}
      {(result.orderId || result.amount || result.paymentMethod) && (
        <div className="px-6 py-4 bg-gray-50/50">
          <div className="space-y-2 text-sm">
            {result.orderId && (
              <div className="flex justify-between items-center">
                <span className="text-gray-500">ID do Pagamento:</span>
                <span className="font-mono text-xs text-gray-700 bg-white px-2 py-1 rounded">
                  {result.orderId.length > 20 ? `${result.orderId.slice(0, 20)}...` : result.orderId}
                </span>
              </div>
            )}
            
            {result.amount && (
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Valor:</span>
                <span className="font-medium text-gray-700">
                  {formatAmount(result.amount)}
                </span>
              </div>
            )}
            
            {result.paymentMethod && (
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Método:</span>
                <div className="flex items-center gap-1">
                  {getPaymentMethodIcon()}
                  <span className="text-gray-700 capitalize">
                    {result.paymentMethod === 'pix' ? 'PIX' : 'Cartão de Crédito'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error Details */}
      {result.details && (
        <div className="px-6 py-3">
          <Alert className="border-gray-200">
            <AlertDescription className="text-xs text-gray-600">
              <strong>Detalhes:</strong> {result.details}
              {result.errorCode && (
                <span className="block mt-1">
                  <strong>Código:</strong> {result.errorCode}
                </span>
              )}
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Action Buttons */}
      <div className="p-6 space-y-3">
        {result.actions?.primary && (
          <Button
            onClick={result.actions.primary.action}
            variant={result.actions.primary.variant || 'default'}
            className={cn(
              "w-full h-12 text-base font-medium touch-manipulation",
              result.actions.primary.variant === 'destructive' && "!bg-red-600 hover:!bg-red-700 !text-white",
              result.type === 'success' && "!bg-green-600 hover:!bg-green-700 !text-white"
            )}
          >
            {result.actions.primary.label}
          </Button>
        )}

        {result.actions?.secondary && (
          <Button
            onClick={result.actions.secondary.action}
            variant="outline"
            className="w-full h-11 bg-white hover:bg-gray-50 border-gray-300 text-gray-700 touch-manipulation"
          >
            {result.actions.secondary.label}
          </Button>
        )}

        {result.actions?.back && (
          <Button
            onClick={result.actions.back.action}
            variant="ghost"
            className="w-full h-10 text-sm text-gray-500 hover:text-gray-700 touch-manipulation"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            {result.actions.back.label}
          </Button>
        )}
      </div>

      {/* Support Information */}
      {(result.type === 'failure' || result.type === 'pending') && (
        <div className="px-6 pb-6">
          <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg text-center">
            <p>Precisa de ajuda? Entre em contato:</p>
            <a
              href="mailto:suporte@reviews.com.br"
              className="font-medium text-blue-600 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              suporte@reviews.com.br
            </a>
          </div>
        </div>
      )}
    </div>
  );
}