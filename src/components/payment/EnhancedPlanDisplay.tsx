// ABOUTME: Enhanced plan display component with promotional features and customizable visual elements
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Clock, Star, Zap, Gift, TrendingUp } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';

type PaymentPlan = Tables<'PaymentPlans'>;

interface PromotionalConfig {
  isActive: boolean;
  discountPercentage?: number;
  originalPrice?: number;
  urgencyMessage?: string;
  promotionalBadge?: string;
  customMessage?: string;
  showSavingsAmount?: boolean;
  expiresAt?: string;
  features?: string[];
}

interface DisplayConfig {
  layout?: 'default' | 'compact' | 'featured';
  theme?: 'default' | 'promotional' | 'premium';
  showBadge?: boolean;
  borderStyle?: 'default' | 'dashed' | 'double' | 'gradient';
  backgroundColor?: string;
  textColor?: string;
  accentColor?: string;
  icon?: 'star' | 'zap' | 'gift' | 'trending' | 'clock';
}

interface EnhancedPlanDisplayProps {
  plan: PaymentPlan;
  className?: string;
}

const iconMap = {
  star: Star,
  zap: Zap,
  gift: Gift,
  trending: TrendingUp,
  clock: Clock,
};

export const EnhancedPlanDisplay: React.FC<EnhancedPlanDisplayProps> = ({
  plan,
  className,
}) => {
  // Parse promotional configuration
  const promotionalConfig = React.useMemo((): PromotionalConfig => {
    if (!plan.promotional_config) {
      return { isActive: false };
    }
    
    try {
      const config = typeof plan.promotional_config === 'string' 
        ? JSON.parse(plan.promotional_config) 
        : plan.promotional_config;
      return { isActive: false, ...config };
    } catch {
      return { isActive: false };
    }
  }, [plan.promotional_config]);

  // Parse display configuration
  const displayConfig = React.useMemo((): DisplayConfig => {
    if (!plan.display_config) {
      return { layout: 'default', theme: 'default' };
    }
    
    try {
      const config = typeof plan.display_config === 'string' 
        ? JSON.parse(plan.display_config) 
        : plan.display_config;
      return { layout: 'default', theme: 'default', ...config };
    } catch {
      return { layout: 'default', theme: 'default' };
    }
  }, [plan.display_config]);

  // Calculate display price and savings
  const displayPrice = promotionalConfig.isActive && promotionalConfig.originalPrice
    ? promotionalConfig.originalPrice - (promotionalConfig.originalPrice * (promotionalConfig.discountPercentage || 0) / 100)
    : plan.amount;

  const savingsAmount = promotionalConfig.isActive && promotionalConfig.originalPrice
    ? promotionalConfig.originalPrice - displayPrice
    : 0;

  const formatPrice = (price: number) => {
    return `R$ ${(price / 100).toFixed(2).replace('.', ',')}`;
  };

  // Check if promotion has expired
  const isPromotionExpired = promotionalConfig.expiresAt 
    ? new Date(promotionalConfig.expiresAt) < new Date() 
    : false;

  const isPromotionActive = promotionalConfig.isActive && !isPromotionExpired;

  // Get theme styles
  const getThemeStyles = () => {
    const baseStyles = "p-3 sm:p-4 rounded-lg mb-4 transition-all duration-200";
    
    if (isPromotionActive && displayConfig.theme === 'promotional') {
      return cn(
        baseStyles,
        "bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200",
        "shadow-md hover:shadow-lg",
        displayConfig.backgroundColor && `bg-[${displayConfig.backgroundColor}]`
      );
    }
    
    if (displayConfig.theme === 'premium') {
      return cn(
        baseStyles,
        "bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200"
      );
    }
    
    return cn(
      baseStyles,
      "bg-gray-50",
      displayConfig.backgroundColor && `bg-[${displayConfig.backgroundColor}]`,
      displayConfig.borderStyle === 'dashed' && "border-2 border-dashed border-gray-300",
      displayConfig.borderStyle === 'double' && "border-4 border-double border-gray-300",
      displayConfig.borderStyle === 'gradient' && "border-2 border-transparent bg-gradient-to-r from-blue-200 to-purple-200"
    );
  };

  // Get layout component based on configuration
  const renderLayout = () => {
    const IconComponent = displayConfig.icon ? iconMap[displayConfig.icon] : null;

    if (displayConfig.layout === 'compact') {
      return (
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              {IconComponent && (
                <IconComponent className="w-4 h-4 text-blue-600" />
              )}
              <h3 className="font-medium text-black text-sm">{plan.name}</h3>
            </div>
            {plan.description && (
              <p className="text-xs text-gray-600 mt-1">{plan.description}</p>
            )}
          </div>
          <div className="text-right">
            {renderPricing()}
          </div>
        </div>
      );
    }

    if (displayConfig.layout === 'featured') {
      return (
        <div className="text-center space-y-3">
          {IconComponent && (
            <div className="flex justify-center">
              <div className="p-2 bg-blue-100 rounded-full">
                <IconComponent className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          )}
          <div>
            <h3 className="font-bold text-black text-lg mb-1">{plan.name}</h3>
            {plan.description && (
              <p className="text-sm text-gray-600 mb-3">{plan.description}</p>
            )}
          </div>
          {renderPricing()}
          {promotionalConfig.features && promotionalConfig.features.length > 0 && (
            <div className="mt-3 space-y-1">
              {promotionalConfig.features.map((feature, index) => (
                <div key={index} className="flex items-center justify-center gap-2 text-xs text-gray-700">
                  <div className="w-1 h-1 bg-blue-500 rounded-full"></div>
                  {feature}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    // Default layout
    return (
      <div>
        <div className="flex items-center gap-2 mb-1">
          {IconComponent && (
            <IconComponent className="w-4 h-4 text-blue-600" />
          )}
          <h3 className="font-medium text-black text-sm sm:text-base">{plan.name}</h3>
        </div>
        {plan.description && (
          <p className="text-xs sm:text-sm text-gray-600 mb-2">{plan.description}</p>
        )}
        {renderPricing()}
        {promotionalConfig.customMessage && isPromotionActive && (
          <p className="text-xs text-blue-700 mt-2 font-medium">
            {promotionalConfig.customMessage}
          </p>
        )}
      </div>
    );
  };

  const renderPricing = () => {
    if (!isPromotionActive) {
      return (
        <p className="text-base sm:text-lg font-semibold text-black">
          {formatPrice(plan.amount)}
        </p>
      );
    }

    return (
      <div className="space-y-1">
        {promotionalConfig.originalPrice && (
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm text-gray-500 line-through">
              {formatPrice(promotionalConfig.originalPrice)}
            </p>
            {promotionalConfig.discountPercentage && (
              <Badge variant="destructive" className="text-xs px-1.5 py-0.5">
                -{promotionalConfig.discountPercentage}%
              </Badge>
            )}
          </div>
        )}
        <p className="text-base sm:text-lg font-bold text-green-600">
          {formatPrice(displayPrice)}
        </p>
        {promotionalConfig.showSavingsAmount && savingsAmount > 0 && (
          <p className="text-xs text-green-600 font-medium">
            Economia de {formatPrice(savingsAmount)}
          </p>
        )}
      </div>
    );
  };

  const renderPromotionalBadges = () => {
    if (!isPromotionActive) return null;

    return (
      <div className="absolute -top-2 -right-2 flex gap-2">
        {promotionalConfig.promotionalBadge && (
          <Badge 
            variant="secondary" 
            className="bg-red-500 text-white text-xs px-2 py-1 shadow-md"
          >
            {promotionalConfig.promotionalBadge}
          </Badge>
        )}
        {promotionalConfig.discountPercentage && (
          <Badge 
            variant="secondary"
            className="bg-orange-500 text-white text-xs px-2 py-1 shadow-md animate-pulse"
          >
            {promotionalConfig.discountPercentage}% OFF
          </Badge>
        )}
      </div>
    );
  };

  const renderUrgencyMessage = () => {
    if (!isPromotionActive || !promotionalConfig.urgencyMessage) return null;

    return (
      <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-center">
        <div className="flex items-center justify-center gap-1 text-yellow-700">
          <Clock className="w-3 h-3" />
          <p className="text-xs font-medium">{promotionalConfig.urgencyMessage}</p>
        </div>
        {promotionalConfig.expiresAt && (
          <p className="text-xs text-yellow-600 mt-1">
            Válida até {new Date(promotionalConfig.expiresAt).toLocaleDateString('pt-BR')}
          </p>
        )}
      </div>
    );
  };

  return (
    <div className={cn("relative", className)}>
      <div className={getThemeStyles()}>
        {renderPromotionalBadges()}
        {renderLayout()}
        {renderUrgencyMessage()}
      </div>
    </div>
  );
};