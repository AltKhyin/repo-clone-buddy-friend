// ABOUTME: Real-time pricing calculator widget for V2 payment plans with advanced breakdown

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Calculator, 
  TrendingDown, 
  TrendingUp, 
  CheckCircle, 
  Zap,
  CreditCard,
  AlertCircle
} from 'lucide-react';
import { usePaymentPricingV2 } from '@/hooks/usePaymentPricingV2';
import type { PaymentPlanV2Row, PricingCalculationResult } from '@/types/paymentV2.types';

// =============================================================================
// COMPONENT PROPS
// =============================================================================

interface PricingCalculatorV2Props {
  plan: PaymentPlanV2Row | null;
  className?: string;
  showTitle?: boolean;
  compact?: boolean;
}

// =============================================================================
// PRICING BREAKDOWN COMPONENT
// =============================================================================

interface PricingBreakdownProps {
  pricing: PricingCalculationResult;
  formatCurrency: (amount: number) => string;
  formatPercentage: (decimal: number) => string;
  compact?: boolean;
}

function PricingBreakdown({ pricing, formatCurrency, formatPercentage, compact }: PricingBreakdownProps) {
  if (compact) {
    return (
      <div className="space-y-2">
        {/* Quick Overview */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Cartão de Crédito:</span>
          <span className="font-medium">{formatCurrency(pricing.finalAmount)}</span>
        </div>
        
        {pricing.metadata.hasPixDiscount && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Zap className="h-3 w-3 text-green-600" />
              PIX:
            </span>
            <span className="font-medium text-green-600">
              {formatCurrency(pricing.pixFinalAmount)}
            </span>
          </div>
        )}
        
        {pricing.savings.amount > 0 && (
          <div className="text-xs text-green-600 text-center">
            Economia de {formatCurrency(pricing.savings.amount)} ({formatPercentage(pricing.savings.percentage)})
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Base Price */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Valor Base:</span>
        <span className="font-medium">{formatCurrency(pricing.baseAmount)}</span>
      </div>

      {/* Discount Applied */}
      {pricing.metadata.hasDiscount && (
        <div className="flex items-center justify-between text-red-600">
          <span className="text-sm flex items-center gap-1">
            <TrendingDown className="h-3 w-3" />
            Desconto Aplicado:
          </span>
          <span className="font-medium">
            -{formatCurrency(pricing.discountAmount)}
          </span>
        </div>
      )}

      {/* Final Amount (Credit Card) */}
      <div className="flex items-center justify-between border-t pt-2">
        <span className="text-sm font-medium flex items-center gap-1">
          <CreditCard className="h-3 w-3" />
          Valor Final (Cartão):
        </span>
        <span className="font-bold text-lg">{formatCurrency(pricing.finalAmount)}</span>
      </div>

      {/* PIX Section */}
      {pricing.metadata.hasPixDiscount && (
        <>
          <div className="flex items-center justify-between text-green-600">
            <span className="text-sm flex items-center gap-1">
              <TrendingDown className="h-3 w-3" />
              Desconto PIX:
            </span>
            <span className="font-medium">
              -{formatCurrency(pricing.pixDiscount.amount)} ({formatPercentage(pricing.pixDiscount.percentage)})
            </span>
          </div>
          
          <div className="flex items-center justify-between border-t border-green-200 pt-2">
            <span className="text-sm font-medium flex items-center gap-1">
              <Zap className="h-3 w-3 text-green-600" />
              Valor Final (PIX):
            </span>
            <span className="font-bold text-lg text-green-600">
              {formatCurrency(pricing.pixFinalAmount)}
            </span>
          </div>
        </>
      )}

      <Separator />

      {/* Installment Options */}
      <div>
        <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
          <Calculator className="h-3 w-3" />
          Parcelamento (Cartão):
        </h4>
        <div className="space-y-2">
          {pricing.installmentOptions.map((option, index) => (
            <div key={index} className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                {option.installments === 1 ? (
                  <>
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    À vista
                  </>
                ) : (
                  <>
                    <div className="w-3 h-3 rounded-full border border-gray-300 flex items-center justify-center">
                      <span className="text-xs font-bold">{option.installments}</span>
                    </div>
                    {option.installments}x
                  </>
                )}
              </span>
              <div className="text-right">
                <div className="font-medium">
                  {option.installments === 1 ? '' : `${formatCurrency(option.installmentAmount)} cada`}
                </div>
                <Badge variant="outline" className="text-xs ml-2">
                  Total: {formatCurrency(option.totalAmount)}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Total Savings Summary */}
      {pricing.savings.amount > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-green-800">
              Economia Total: {formatCurrency(pricing.savings.amount)}
            </span>
          </div>
          <p className="text-xs text-green-600 mt-1">
            {formatPercentage(pricing.savings.percentage)} de desconto no valor original
          </p>
        </div>
      )}

      {/* Metadata */}
      <div className="text-xs text-muted-foreground text-center border-t pt-2">
        Calculado em {new Date(pricing.metadata.calculatedAt).toLocaleString('pt-BR')}
      </div>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function PricingCalculatorV2({ 
  plan, 
  className = '', 
  showTitle = true,
  compact = false 
}: PricingCalculatorV2Props) {
  const { 
    pricing, 
    isValid, 
    validationErrors, 
    formatCurrency, 
    formatPercentage 
  } = usePaymentPricingV2({
    plan,
    autoCalculate: true
  });

  // No plan provided
  if (!plan) {
    return (
      <Card className={`border-gray-200 ${className}`}>
        <CardContent className="pt-6 text-center">
          <Calculator className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-sm text-muted-foreground">
            Selecione um plano para ver os cálculos
          </p>
        </CardContent>
      </Card>
    );
  }

  // Validation errors
  if (!isValid) {
    return (
      <Card className={`border-red-200 bg-red-50 ${className}`}>
        <CardHeader>
          {showTitle && (
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              Erro de Configuração
            </CardTitle>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {validationErrors.map((error, index) => (
              <div key={index} className="flex items-center gap-2 text-sm text-red-700">
                <AlertCircle className="h-3 w-3" />
                {error}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // No pricing data
  if (!pricing) {
    return (
      <Card className={`border-gray-200 ${className}`}>
        <CardContent className="pt-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Calculando preços...</p>
        </CardContent>
      </Card>
    );
  }

  // Success - show pricing
  return (
    <Card className={`border-green-200 ${className}`}>
      {showTitle && (
        <CardHeader className={compact ? 'pb-3' : ''}>
          <CardTitle className={`${compact ? 'text-base' : 'text-lg'} flex items-center gap-2`}>
            <Calculator className="h-4 w-4" />
            {compact ? 'Preços' : 'Calculadora de Preços'}
          </CardTitle>
          {!compact && (
            <CardDescription>
              Cálculos em tempo real com desconto pré-requisição
            </CardDescription>
          )}
        </CardHeader>
      )}
      <CardContent className={showTitle ? '' : 'pt-6'}>
        <PricingBreakdown 
          pricing={pricing}
          formatCurrency={formatCurrency}
          formatPercentage={formatPercentage}
          compact={compact}
        />
      </CardContent>
    </Card>
  );
}

// =============================================================================
// EXPORT ADDITIONAL COMPONENTS
// =============================================================================

export { PricingBreakdown };