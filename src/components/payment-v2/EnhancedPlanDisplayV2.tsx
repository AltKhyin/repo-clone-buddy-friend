// ABOUTME: Enhanced plan display V2.0 component with sophisticated promotional features for PaymentPlansV2
import React from 'react';
import { cn } from '@/lib/utils';
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

  // Parse discount configuration
  const discountConfig = React.useMemo(() => {
    if (!plan.discount_config) {
      return null;
    }
    
    try {
      const config = typeof plan.discount_config === 'string' 
        ? JSON.parse(plan.discount_config) 
        : plan.discount_config;
      return config;
    } catch {
      return null;
    }
  }, [plan.discount_config]);

  // Calculate promotional pricing based on actual discount config
  const basePrice = plan.base_amount;
  const discountedPrice = plan.final_amount;
  const savingsAmount = discountConfig?.enabled ? (basePrice - discountedPrice) : 0;
  
  // Check if visual customization should be active
  const isPromotionActive = promotionalConfig?.isActive && discountConfig?.enabled;

  // Parse installment configuration for installment-focused pricing
  const installmentConfig = React.useMemo(() => {
    if (!plan.installment_config) {
      return null;
    }
    
    try {
      const config = typeof plan.installment_config === 'string' 
        ? JSON.parse(plan.installment_config) 
        : plan.installment_config;
      return config;
    } catch {
      return null;
    }
  }, [plan.installment_config]);

  // Get the best installment option (prefer 12x, fallback to highest available)
  const bestInstallmentOption = React.useMemo(() => {
    if (!installmentConfig?.options || !Array.isArray(installmentConfig.options)) {
      return null;
    }

    // Try to find 12x first
    const twelveXOption = installmentConfig.options.find((opt: any) => opt.installments === 12);
    if (twelveXOption) {
      const totalWithFee = discountedPrice * (1 + twelveXOption.feeRate);
      return {
        installments: 12,
        installmentAmount: Math.round(totalWithFee / 12),
        totalAmount: Math.round(totalWithFee),
        feeRate: twelveXOption.feeRate
      };
    }

    // Fallback to the highest installment available
    const highestOption = installmentConfig.options.reduce((highest: any, current: any) => {
      return (current.installments > highest.installments) ? current : highest;
    });

    if (highestOption) {
      const totalWithFee = discountedPrice * (1 + highestOption.feeRate);
      return {
        installments: highestOption.installments,
        installmentAmount: Math.round(totalWithFee / highestOption.installments),
        totalAmount: Math.round(totalWithFee),
        feeRate: highestOption.feeRate
      };
    }

    return null;
  }, [installmentConfig, discountedPrice]);

  // Countdown timer functionality
  const [timeLeft, setTimeLeft] = React.useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);

  const shouldShowCountdown = displayConfig?.showCountdownTimer && displayConfig?.countdownEndDate;

  React.useEffect(() => {
    if (!shouldShowCountdown) {
      setTimeLeft(null);
      return;
    }

    const calculateTimeLeft = () => {
      const endDate = new Date(displayConfig.countdownEndDate!);
      const now = new Date();
      const difference = endDate.getTime() - now.getTime();

      if (difference <= 0) {
        setTimeLeft(null);
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    };

    // Calculate immediately
    calculateTimeLeft();

    // Update every second
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [shouldShowCountdown, displayConfig?.countdownEndDate]);

  // Check if plan has any display customization
  const hasDisplayCustomization = isPromotionActive && (
    promotionalConfig?.titleColor !== '#111827' || 
    promotionalConfig?.descriptionColor !== '#6B7280' || 
    promotionalConfig?.borderColor !== '#E5E7EB' ||
    displayConfig?.customName || 
    displayConfig?.customDescription ||
    savingsAmount > 0
  );

  // Get sophisticated styling (always available for customization)
  const getContainerStyles = () => {
    const baseStyles = "p-4 rounded-xl border transition-all duration-300";
    
    // Enhanced styling if there's any customization OR discount is active
    if (hasDisplayCustomization || savingsAmount > 0) {
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
    
    // Keep background white for better readability
    
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


  // Render countdown timer - integrated subtly
  const renderCountdownTimer = () => {
    if (!shouldShowCountdown || !timeLeft) {
      return null;
    }

    // Show different formats based on time remaining
    const totalHoursLeft = timeLeft.days * 24 + timeLeft.hours;
    const isMoreThan24h = totalHoursLeft >= 24;
    
    // Determine urgency color based on time remaining
    const getUrgencyColor = () => {
      if (totalHoursLeft < 48) {
        // Under 48h: orange/red
        return 'text-orange-600';
      } else if (timeLeft.days < 5) {
        // Under 5 days: yellow/amber
        return 'text-amber-600';
      } else {
        // Default: subtle gray
        return 'text-gray-400';
      }
    };

    const urgencyColor = getUrgencyColor();

    return (
      <div className={`flex items-center gap-1 text-xs ${urgencyColor}`}>
        {/* Timer icon */}
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" strokeWidth="1.5"/>
          <polyline points="12,6 12,12 16,14" strokeWidth="1.5"/>
        </svg>
        
        {/* Clear timer format */}
        <span className="font-mono tabular-nums">
          {isMoreThan24h ? (
            // Clear format for >24h: "10d 16h" or "23h 45m"
            timeLeft.days > 0 ? (
              `${timeLeft.days}d ${timeLeft.hours}h`
            ) : (
              `${timeLeft.hours}h ${timeLeft.minutes}m`
            )
          ) : (
            // Full precision when <24h: "23:45:30"
            `${timeLeft.hours.toString().padStart(2, '0')}:${timeLeft.minutes.toString().padStart(2, '0')}:${timeLeft.seconds.toString().padStart(2, '0')}`
          )}
        </span>
      </div>
    );
  };

  const renderPricing = () => {
    // Check if we should focus on installments
    const shouldFocusOnInstallments = displayConfig?.focusOnInstallments && bestInstallmentOption;

    // If no discount or customization is active, show normal pricing
    if (!isPromotionActive || savingsAmount === 0) {
      if (shouldFocusOnInstallments) {
        return (
          <div className="text-right space-y-1">
            <div className="flex items-baseline justify-end gap-1">
              <span className="text-xs text-gray-500">
                {bestInstallmentOption.installments}x
              </span>
              <span className="text-lg font-semibold text-gray-900">
                {formatCurrency(bestInstallmentOption.installmentAmount)}
              </span>
            </div>
            <p className="text-xs text-gray-500">
              ou {formatCurrency(discountedPrice)} à vista
            </p>
          </div>
        );
      }

      return (
        <div className="text-right">
          <p className="text-lg font-semibold text-gray-900">
            {formatCurrency(discountedPrice)}
          </p>
        </div>
      );
    }

    // Show promotional pricing with customization
    if (shouldFocusOnInstallments) {
      return (
        <div className="text-right space-y-1">
          {displayConfig?.showDiscountAmount && (
            <div className="flex items-center justify-end gap-2">
              <p className="text-sm text-gray-500 line-through">
                {formatCurrency(basePrice)}
              </p>
              <span 
                className="text-xs px-2 py-1 rounded font-medium"
                style={{
                  backgroundColor: promotionalConfig?.discountTagBackgroundColor || '#111827',
                  color: promotionalConfig?.discountTagTextColor || '#FFFFFF'
                }}
              >
                -{discountConfig?.type === 'percentage' 
                  ? `${Math.round((savingsAmount / basePrice) * 100)}%` 
                  : formatCurrency(savingsAmount)}
              </span>
            </div>
          )}
          <div className="flex items-baseline justify-end gap-1">
            <span className="text-xs text-gray-500">
              {bestInstallmentOption.installments}x
            </span>
            <span className="text-lg font-semibold text-gray-900">
              {formatCurrency(bestInstallmentOption.installmentAmount)}
            </span>
          </div>
          <p className="text-xs text-gray-500">
            ou {formatCurrency(discountedPrice)} à vista
          </p>
        </div>
      );
    }

    return (
      <div className="text-right space-y-1">
        {displayConfig?.showDiscountAmount && (
          <div className="flex items-center justify-end gap-2">
            <p className="text-sm text-gray-500 line-through">
              {formatCurrency(basePrice)}
            </p>
            <span 
              className="text-xs px-2 py-1 rounded font-medium"
              style={{
                backgroundColor: promotionalConfig?.discountTagBackgroundColor || '#111827',
                color: promotionalConfig?.discountTagTextColor || '#FFFFFF'
              }}
            >
              -{discountConfig?.type === 'percentage' 
                ? `${Math.round((savingsAmount / basePrice) * 100)}%` 
                : formatCurrency(savingsAmount)}
            </span>
          </div>
        )}
        <p className="text-lg font-semibold text-gray-900">
          {formatCurrency(discountedPrice)}
        </p>
      </div>
    );
  };

  return (
    <div className={cn("relative", className)}>
      <div 
        className={getContainerStyles()}
        style={getContainerDynamicStyles()}
      >
        {/* Header with integrated timer */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            {renderPlanName()}
            {renderCountdownTimer()}
          </div>
        </div>

        {/* Content and pricing section */}
        <div className="space-y-3">
          {/* Description area - show custom OR regular, not both */}
          {(() => {
            const hasCustomDescription = displayConfig?.customDescription && displayConfig?.showCustomDescription;
            const showDescription = hasCustomDescription || plan.description;
            
            if (!showDescription) return null;
            
            return (
              <div className="text-sm text-gray-600">
                {hasCustomDescription ? (
                  <p 
                    className="leading-relaxed whitespace-pre-line"
                    style={{ color: promotionalConfig?.descriptionColor || '#6B7280' }}
                  >
                    {displayConfig.customDescription}
                  </p>
                ) : (
                  <p className="leading-relaxed whitespace-pre-line">
                    {plan.description}
                  </p>
                )}
              </div>
            );
          })()}

          {/* Pricing section - now feels more integrated */}
          <div className="flex justify-end">
            {renderPricing()}
          </div>
        </div>
      </div>
    </div>
  );
};