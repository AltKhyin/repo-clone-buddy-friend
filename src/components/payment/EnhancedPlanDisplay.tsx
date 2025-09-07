// ABOUTME: Enhanced plan display component with sophisticated promotional features and Apple-inspired design
import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Clock } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';

type PaymentPlan = Tables<'PaymentPlans'>;

interface DisplayCustomization {
  customName?: string;
  customDescription?: string;
  titleColor?: string;
  descriptionColor?: string;
  borderColor?: string;
  backgroundColor?: string;
}

interface PromotionalConfig {
  isActive: boolean;
  promotionValue?: number;
  displayAsPercentage?: boolean;
  showDiscountAmount?: boolean;
  showSavingsAmount?: boolean;
  showCountdownTimer?: boolean;
  expiresAt?: string;
  // Promotional-specific colors
  timerColor?: string;
  discountTagBackgroundColor?: string;
  discountTagTextColor?: string;
  savingsColor?: string;
}

interface DisplaySettings {
  showCustomName?: boolean;
  showCustomDescription?: boolean;
  showDiscountAmount?: boolean;
  showSavingsAmount?: boolean;
  showCountdownTimer?: boolean;
}

interface EnhancedPlanDisplayProps {
  plan: PaymentPlan;
  className?: string;
}

export const EnhancedPlanDisplay: React.FC<EnhancedPlanDisplayProps> = ({
  plan,
  className,
}) => {
  // Parse display customization (always available)
  const displayCustomization = React.useMemo((): DisplayCustomization => {
    if (!plan.promotional_config) {
      return {};
    }
    
    try {
      const config = typeof plan.promotional_config === 'string' 
        ? JSON.parse(plan.promotional_config) 
        : plan.promotional_config;
      return {
        customName: config.customName || config.promotionalName,
        customDescription: config.customDescription || config.customMessage,
        titleColor: config.titleColor,
        descriptionColor: config.descriptionColor,
        borderColor: config.borderColor,
        backgroundColor: config.backgroundColor
      };
    } catch {
      return {};
    }
  }, [plan.promotional_config]);

  // Parse promotional configuration (discount-specific features)
  const promotionalConfig = React.useMemo((): PromotionalConfig => {
    if (!plan.promotional_config) {
      return { isActive: false };
    }
    
    try {
      const config = typeof plan.promotional_config === 'string' 
        ? JSON.parse(plan.promotional_config) 
        : plan.promotional_config;
      return { 
        isActive: false, 
        ...config,
        // Extract only promotional-specific properties
        promotionValue: config.promotionValue,
        displayAsPercentage: config.displayAsPercentage,
        showDiscountAmount: config.showDiscountAmount,
        showSavingsAmount: config.showSavingsAmount,
        showCountdownTimer: config.showCountdownTimer,
        expiresAt: config.expiresAt,
        timerColor: config.timerColor,
        discountTagBackgroundColor: config.discountTagBackgroundColor,
        discountTagTextColor: config.discountTagTextColor,
        savingsColor: config.savingsColor
      };
    } catch {
      return { isActive: false };
    }
  }, [plan.promotional_config]);

  // Parse display settings
  const displaySettings = React.useMemo((): DisplaySettings => {
    if (!plan.display_config) {
      return {};
    }
    
    try {
      const config = typeof plan.display_config === 'string' 
        ? JSON.parse(plan.display_config) 
        : plan.display_config;
      return config || {};
    } catch {
      return {};
    }
  }, [plan.display_config]);

  // Calculate promotional pricing
  const originalPrice = plan.amount;
  const finalPrice = promotionalConfig.finalPrice || 0;
  
  const displayPrice = promotionalConfig.isActive && finalPrice > 0
    ? finalPrice
    : originalPrice;

  const savingsAmount = promotionalConfig.isActive && finalPrice > 0 
    ? originalPrice - finalPrice 
    : 0;

  const formatPrice = (price: number) => {
    return `R$ ${(price / 100).toFixed(2).replace('.', ',')}`;
  };

  // Check if promotion has expired
  const isPromotionExpired = promotionalConfig.expiresAt 
    ? new Date(promotionalConfig.expiresAt) < new Date() 
    : false;

  const isPromotionActive = promotionalConfig.isActive && !isPromotionExpired;

  // Countdown timer state
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    if (!promotionalConfig.expiresAt || !promotionalConfig.showCountdownTimer || !isPromotionActive) {
      return;
    }

    const updateCountdown = () => {
      const now = new Date().getTime();
      const expiry = new Date(promotionalConfig.expiresAt!).getTime();
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
  }, [promotionalConfig.expiresAt, promotionalConfig.showCountdownTimer, isPromotionActive]);

  // Check if plan has any display customization
  const hasDisplayCustomization = displayCustomization.customName || 
    displayCustomization.customDescription || 
    displayCustomization.titleColor || 
    displayCustomization.descriptionColor || 
    displayCustomization.borderColor || 
    displayCustomization.backgroundColor;

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
    if (displayCustomization.borderColor) {
      styles.borderColor = displayCustomization.borderColor;
      styles.borderWidth = '2px';
    }
    
    // Apply custom background color if available
    if (displayCustomization.backgroundColor) {
      styles.backgroundColor = displayCustomization.backgroundColor;
    }
    
    return styles;
  };

  // Render plan name (custom or regular - always customizable)
  const renderPlanName = () => {
    const displayName = (displayCustomization.customName && displaySettings.showCustomName) 
      ? displayCustomization.customName 
      : plan.name;
    
    return (
      <h3 
        className="font-semibold text-base leading-tight"
        style={{ 
          color: displayCustomization.titleColor || '#111827'
        }}
      >
        {displayName}
      </h3>
    );
  };

  // Render custom description (always available)
  const renderCustomDescription = () => {
    if (!displayCustomization.customDescription || !displaySettings.showCustomDescription) {
      return null;
    }

    return (
      <p 
        className="text-sm mt-1 leading-relaxed"
        style={{ color: displayCustomization.descriptionColor || '#6B7280' }}
      >
        {displayCustomization.customDescription}
      </p>
    );
  };

  // Render countdown timer
  const renderCountdownTimer = () => {
    if (!isPromotionActive || !promotionalConfig.showCountdownTimer || !displaySettings.showCountdownTimer || !timeLeft) {
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
            {formatPrice(originalPrice)}
          </p>
        </div>
      );
    }

    return (
      <div className="text-right space-y-1">
        {displaySettings.showDiscountAmount && (
          <div className="flex items-center justify-end gap-2">
            <p className="text-sm text-gray-500 line-through">
              {formatPrice(originalPrice)}
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
                : formatPrice(savingsAmount)}
            </span>
          </div>
        )}
        <p className="text-lg font-semibold text-gray-900">
          {formatPrice(displayPrice)}
        </p>
        {displaySettings.showSavingsAmount && savingsAmount > 0 && (
          <p 
            className="text-xs font-medium"
            style={{ color: promotionalConfig.savingsColor || '#059669' }}
          >
            Economia de {formatPrice(savingsAmount)}
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
            {renderCustomDescription()}
            {renderCountdownTimer()}
          </div>
          {renderPricing()}
        </div>
      </div>
    </div>
  );
};