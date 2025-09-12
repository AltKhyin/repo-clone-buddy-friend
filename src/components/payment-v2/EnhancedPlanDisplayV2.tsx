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


  const renderPricing = () => {
    // If no discount or customization is active, show normal pricing
    if (!isPromotionActive || savingsAmount === 0) {
      return (
        <div className="text-right">
          <p className="text-lg font-semibold text-gray-900">
            {formatCurrency(discountedPrice)}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {plan.duration_days} dias
          </p>
        </div>
      );
    }

    // Show promotional pricing with customization
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
        <p className="text-xs text-gray-500">
          {plan.duration_days} dias
        </p>
        {displayConfig?.showSavingsAmount && savingsAmount > 0 && (
          <p 
            className="text-xs font-medium"
            style={{ color: promotionalConfig?.savingsColor || '#059669' }}
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
          </div>
          {renderPricing()}
        </div>
      </div>
    </div>
  );
};