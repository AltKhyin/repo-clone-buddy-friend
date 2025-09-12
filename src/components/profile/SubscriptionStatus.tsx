// ABOUTME: Clean subscription status component with elegant premium design

import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Calendar, 
  CreditCard, 
  CheckCircle, 
  Clock, 
  AlertTriangle
} from 'lucide-react';
import { useEnhancedUserStatus } from '@/hooks/useEnhancedUserStatus';

export const SubscriptionStatus: React.FC = () => {
  const enhancedStatus = useEnhancedUserStatus();

  if (enhancedStatus.isLoading) {
    return (
      <Card className="border-0 shadow-sm bg-background">
        <CardHeader className="pb-4">
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent data-testid="subscription-loading">
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const formatPaymentMethod = (method: string | null | undefined): string => {
    if (!method) return 'N/A';
    
    const methodMap: Record<string, string> = {
      'credit_card': 'Cartão de Crédito',
      'pix': 'PIX',
      'boleto': 'Boleto',
      'debit_card': 'Cartão de Débito'
    };
    
    return methodMap[method] || method;
  };

  const formatSubscriptionTier = (tier: string | null | undefined): string => {
    if (!tier) return 'N/A';
    
    const tierMap: Record<string, string> = {
      'free': 'Gratuito',
      'premium': 'Premium'
    };
    
    return tierMap[tier] || tier;
  };

  const getStatusIcon = () => {
    if (enhancedStatus.isTrialing) return <Clock className="h-4 w-4 text-blue-600" />;
    if (enhancedStatus.isPastDue) return <AlertTriangle className="h-4 w-4 text-red-600" />;
    if (enhancedStatus.isActive) return <CheckCircle className="h-4 w-4 text-green-600" />;
    return <span className="h-4 w-4 rounded-full bg-gray-300"></span>;
  };

  const getStatusText = () => {
    if (enhancedStatus.isTrialing) return 'Período de teste';
    if (enhancedStatus.isPastDue) return 'Pagamento pendente';
    if (enhancedStatus.isActive) return 'Ativa';
    if (enhancedStatus.subscriptionTier === 'free') return enhancedStatus.membershipTier;
    return 'Inativa';
  };

  return (
    <Card className="border-0 shadow-sm bg-background/95 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-black"></span>
          <h3 className="font-serif text-base tracking-tight text-black font-medium">Status da assinatura</h3>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-4">
          {/* Status Overview - Clean */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Plano atual</span>
            <div className="flex items-center gap-2">
              {getStatusIcon()}
              <span className="text-sm font-medium text-black">{getStatusText()}</span>
            </div>
          </div>

          {/* Free User Info - Subtle */}
          {enhancedStatus.subscriptionTier === 'free' && (
            <div className="text-sm text-gray-600">
              Acesso aos recursos essenciais da plataforma
            </div>
          )}

          {/* Subscription Details for Premium Users - Clean Layout */}
          {enhancedStatus.isMember && (
            <div className="space-y-3">
              {enhancedStatus.subscriptionTier && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Plano</span>
                  <span className="text-sm font-medium text-black">
                    {formatSubscriptionTier(enhancedStatus.subscriptionTier)}
                  </span>
                </div>
              )}

              {/* Subscription End Date */}
              {enhancedStatus.userProfile?.subscription_ends_at && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    {enhancedStatus.isPastDue ? 'Expirou em' : 'Expira em'}
                  </span>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3 w-3 text-gray-400" />
                    <span className="text-sm font-medium text-black">
                      {formatDate(enhancedStatus.userProfile.subscription_ends_at)}
                    </span>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* Past Due Warning - Minimal */}
          {enhancedStatus.isPastDue && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <p className="text-sm text-red-800 font-medium">
                  Pagamento pendente
                </p>
              </div>
            </div>
          )}

          {/* Subscription Expiry Warning - Clean */}
          {enhancedStatus.userProfile?.subscription_ends_at && (
            (() => {
              const daysLeft = Math.ceil((new Date(enhancedStatus.userProfile.subscription_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
              if (daysLeft <= 7 && daysLeft > 0) {
                return (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-blue-600" />
                      <p className="text-sm text-blue-800 font-medium">
                        Assinatura expira em {daysLeft} {daysLeft === 1 ? 'dia' : 'dias'}
                      </p>
                    </div>
                  </div>
                );
              }
              return null;
            })()
          )}
        </div>
      </CardContent>
    </Card>
  );
};