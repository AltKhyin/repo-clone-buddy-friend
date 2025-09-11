// ABOUTME: Enhanced plan display V2.0 component with sophisticated promotional features for PaymentPlansV2
import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Clock } from 'lucide-react';
import type { PaymentPlanV2Row, PromotionalConfigV2, DisplayConfigV2 } from '@/types/paymentV2.types';

interface EnhancedPlanDisplayV2Props {
  plan: PaymentPlanV2Row;
  className?: string;
  formatCurrency?: (amount: number) => string;
}

export const EnhancedPlanDisplayV2: React.FC<EnhancedPlanDisplayV2Props> = ({
  plan,
  className,
  formatCurrency = (amount: number) => `R$ ${(amount / 100).toFixed(2).replace('.', ',')}`,
}) => {
  // Parse promotional configuration (discount-specific features)
  const promotionalConfig = React.useMemo((): PromotionalConfigV2 | null => {
    if (!plan.promotional_config) {
      return null;
    }
    
    try {
      const config = typeof plan.promotional_config === 'string' 
        ? JSON.parse(plan.promotional_config) 
        : plan.promotional_config;
      return config;
    } catch {
      return null;
    }
  }, [plan.promotional_config]);

  // Parse display settings
  const displayConfig = React.useMemo((): DisplayConfigV2 | null => {
    if (!plan.display_config) {
      return null;
    }
    
    try {
      const config = typeof plan.display_config === 'string' 
        ? JSON.parse(plan.display_config) 
        : plan.display_config;
      return config;
    } catch {
      return null;
    }
  }, [plan.display_config]);

  // Calculate promotional pricing
  const originalPrice = plan.final_amount;
  const displayPrice = promotionalConfig?.isActive && promotionalConfig.promotionValue > 0
    ? (promotionalConfig.displayAsPercentage 
        ? originalPrice - (originalPrice * promotionalConfig.promotionValue / 100)
        : originalPrice - promotionalConfig.promotionValue)
    : originalPrice;

  const savingsAmount = promotionalConfig?.isActive 
    ? originalPrice - displayPrice 
    : 0;

  // Check if promotion has expired
  const isPromotionExpired = promotionalConfig?.expiresAt 
    ? new Date(promotionalConfig.expiresAt) < new Date() 
    : false;

  const isPromotionActive = promotionalConfig?.isActive && !isPromotionExpired;

  // Countdown timer state
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    if (!promotionalConfig?.expiresAt || !promotionalConfig.showCountdownTimer || !isPromotionActive) {
      return;
    }

    const updateCountdown = () => {
      const now = new Date().getTime();
      const expiry = new Date(promotionalConfig.expiresAt).getTime();
      const distance = expiry - now;

      if (distance < 0) {
        setTimeLeft('');
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h ${minutes}m`);
      } else if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
      } else {
        setTimeLeft(`${minutes}m ${seconds}s`);
      }
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);

    return () => clearInterval(timer);
  }, [promotionalConfig?.expiresAt, promotionalConfig?.showCountdownTimer, isPromotionActive]);

  // Check if plan has any display customization
  const hasDisplayCustomization = promotionalConfig && (
    promotionalConfig.titleColor !== '#111827' || 
    promotionalConfig.descriptionColor !== '#6B7280' || 
    promotionalConfig.borderColor !== '#E5E7EB' || 
    promotionalConfig.backgroundColor ||
    displayConfig?.customName || 
    displayConfig?.customDescription
  );

  // Get sophisticated styling (always available for customization)
  const getContainerStyles = () => {
    const baseStyles = "p-4 rounded-xl border transition-all duration-300";
    
    // Enhanced styling if there's any customization OR it's a promotion
    if (hasDisplayCustomization || isPromotionActive) {
      return cn(
        baseStyles,
        "bg-white border-2 shadow-sm hover:shadow-md"
      );
    }
    
    return cn(
      baseStyles,
      "bg-gray-50 border-gray-200 hover:bg-gray-100"
    );
  };

  // Get dynamic styles (always available for customization)
  const getContainerDynamicStyles = (): React.CSSProperties => {
    const styles: React.CSSProperties = {};
    
    // Apply custom border color if available
    if (promotionalConfig?.borderColor) {
      styles.borderColor = promotionalConfig.borderColor;
      styles.borderWidth = '2px';
    }
    
    // Apply custom background color if available
    if (promotionalConfig?.backgroundColor) {
      styles.backgroundColor = promotionalConfig.backgroundColor;
    }
    
    return styles;
  };

  // Render plan name (custom or regular - always customizable)
  const renderPlanName = () => {
    const displayName = (displayConfig?.customName && displayConfig?.showCustomName) 
      ? displayConfig.customName 
      : plan.name;
    
    return (
      <h3 
        className="font-semibold text-base leading-tight"
        style={{ 
          color: promotionalConfig?.titleColor || '#111827'
        }}
      >
        {displayName}
      </h3>
    );
  };

  // Render custom description (always available)
  const renderCustomDescription = () => {
    if (!displayConfig?.customDescription || !displayConfig?.showCustomDescription) {
      return null;
    }

    return (
      <p 
        className="text-sm mt-1 leading-relaxed"
        style={{ color: promotionalConfig?.descriptionColor || '#6B7280' }}
      >
        {displayConfig.customDescription}
      </p>
    );
  };

  // Render countdown timer
  const renderCountdownTimer = () => {
    if (!isPromotionActive || 
        !promotionalConfig?.showCountdownTimer || 
        !displayConfig?.showCountdownTimer || 
        !timeLeft) {
      return null;
    }

    return (
      <div 
        className="flex items-center gap-1.5 mt-2 text-xs"
        style={{ color: promotionalConfig.timerColor || '#374151' }}
      >
        <Clock className="w-3 h-3" />
        <span>Termina em {timeLeft}</span>
      </div>
    );
  };

  const renderPricing = () => {
    if (!isPromotionActive) {
      return (
        <div className="text-right">
          <p className="text-lg font-semibold text-gray-900">
            {formatCurrency(originalPrice)}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {plan.duration_days} dias
          </p>
        </div>
      );
    }

    return (
      <div className="text-right space-y-1">
        {displayConfig?.showDiscountAmount && promotionalConfig.showDiscountAmount && (
          <div className="flex items-center justify-end gap-2">
            <p className="text-sm text-gray-500 line-through">
              {formatCurrency(originalPrice)}
            </p>
            <span 
              className="text-xs px-2 py-1 rounded font-medium"
              style={{
                backgroundColor: promotionalConfig.discountTagBackgroundColor || '#111827',
                color: promotionalConfig.discountTagTextColor || '#FFFFFF'
              }}
            >
              -{promotionalConfig.displayAsPercentage 
                ? `${Math.round((savingsAmount / originalPrice) * 100)}%` 
                : formatCurrency(savingsAmount)}
            </span>
          </div>
        )}
        <p className="text-lg font-semibold text-gray-900">
          {formatCurrency(displayPrice)}
        </p>
        <p className="text-xs text-gray-500">
          {plan.duration_days} dias
        </p>
        {displayConfig?.showSavingsAmount && promotionalConfig.showSavingsAmount && savingsAmount > 0 && (
          <p 
            className="text-xs font-medium"
            style={{ color: promotionalConfig.savingsColor || '#059669' }}
          >
            Economia de {formatCurrency(savingsAmount)}
          </p>
        )}
      </div>
    );
  };

  return (
    <div className={cn("relative", className)}>
      <div 
        className={getContainerStyles()}
        style={getContainerDynamicStyles()}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {renderPlanName()}
            {plan.description && (
              <p className="text-sm text-gray-600 mt-1">{plan.description}</p>
            )}
            {renderCustomDescription()}
            {renderCountdownTimer()}
          </div>
          {renderPricing()}
        </div>
      </div>
    </div>
  );
};