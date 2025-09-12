// ABOUTME: Clean subscription actions component with elegant premium design and refined terminology

import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  Settings,
  CreditCard, 
  X,
  Pause,
  Play,
  AlertTriangle
} from 'lucide-react';
import { useEnhancedUserStatus } from '@/hooks/useEnhancedUserStatus';
import { useSubscriptionActions, useUpdateSubscription } from '@/hooks/mutations/useSubscriptionMutations';
import { useToast } from '@/hooks/use-toast';

export const SubscriptionActions: React.FC = () => {
  const enhancedStatus = useEnhancedUserStatus();
  const subscriptionActions = useSubscriptionActions();
  const updateSubscription = useUpdateSubscription();
  const { toast } = useToast();
  
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showPauseDialog, setShowPauseDialog] = useState(false);

  // Don't show actions for free users or if no active subscription
  if (enhancedStatus.subscriptionTier === 'free' || !enhancedStatus.isActive) {
    return null;
  }

  const subscriptionId = enhancedStatus.userProfile.subscription_id;
  const isSubscriptionPaused = enhancedStatus.userProfile.subscription_status === 'paused';

  const handleCancelSubscription = async () => {
    if (!subscriptionId) {
      toast({
        title: 'Ação não disponível',
        description: 'Entre em contato com o suporte para gerenciar sua assinatura.',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      await subscriptionActions.cancelSubscription(subscriptionId, 'user_requested');
      
      toast({
        title: 'Assinatura cancelada',
        description: 'Você ainda terá acesso até o final do período atual.',
      });
      
      setShowCancelDialog(false);
    } catch (error) {
      toast({
        title: 'Erro ao cancelar',
        description: 'Não foi possível cancelar sua assinatura.',
        variant: 'destructive',
      });
    }
  };

  const handleUpdatePaymentMethod = async () => {
    if (!subscriptionId) {
      toast({
        title: 'Ação não disponível',
        description: 'Entre em contato com o suporte para gerenciar seu pagamento.',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      window.location.href = '/pagamento?mode=update&subscription_id=' + subscriptionId;
      
      toast({
        title: 'Redirecionando...',
        description: 'Você será redirecionado para atualizar seu pagamento.',
      });
    } catch (error) {
      toast({
        title: 'Erro ao redirecionar',
        description: 'Não foi possível redirecionar.',
        variant: 'destructive',
      });
    }
  };

  const handlePauseSubscription = async () => {
    if (!subscriptionId) return;
    
    try {
      await subscriptionActions.pauseSubscription(subscriptionId, 'user_requested');
      
      toast({
        title: 'Assinatura pausada',
        description: 'Você pode retomar a qualquer momento.',
      });
      
      setShowPauseDialog(false);
    } catch (error) {
      toast({
        title: 'Erro ao pausar',
        description: 'Não foi possível pausar sua assinatura.',
        variant: 'destructive',
      });
    }
  };

  const handleResumeSubscription = async () => {
    if (!subscriptionId) return;
    
    try {
      await subscriptionActions.reactivateSubscription(subscriptionId);
      
      toast({
        title: 'Assinatura retomada',
        description: 'Sua assinatura foi retomada com sucesso.',
      });
    } catch (error) {
      toast({
        title: 'Erro ao retomar',
        description: 'Não foi possível retomar sua assinatura.',
        variant: 'destructive',
      });
    }
  };

  return (
    <>
      <Card className="border-0 shadow-sm bg-background/95 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-black"></span>
            <h3 className="font-serif text-base tracking-tight text-black font-medium">Gerenciar assinatura</h3>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            {/* Update Payment Method */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleUpdatePaymentMethod}
              disabled={subscriptionActions.isUpdating}
              className="w-full justify-start gap-2 bg-background hover:bg-muted border-gray-300 text-gray-700 font-normal"
            >
              <CreditCard className="h-4 w-4" />
              {enhancedStatus.isPastDue ? 'Atualizar pagamento' : 'Alterar método de pagamento'}
            </Button>

            {/* Pause/Resume Subscription */}
            {!enhancedStatus.isPastDue && (
              <>
                {isSubscriptionPaused ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleResumeSubscription}
                    disabled={updateSubscription.isPending}
                    className="w-full justify-start gap-2 bg-background hover:bg-muted border-gray-300 text-gray-700 font-normal"
                  >
                    <Play className="h-4 w-4" />
                    Retomar assinatura
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPauseDialog(true)}
                    disabled={updateSubscription.isPending}
                    className="w-full justify-start gap-2 bg-background hover:bg-muted border-gray-300 text-gray-700 font-normal"
                  >
                    <Pause className="h-4 w-4" />
                    Pausar assinatura
                  </Button>
                )}
              </>
            )}

            {/* Cancel Subscription */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCancelDialog(true)}
              disabled={updateSubscription.isPending}
              className="w-full justify-start gap-2 bg-background hover:bg-red-50 border-gray-300 text-gray-700 hover:text-red-700 hover:border-red-300 font-normal"
            >
              <X className="h-4 w-4" />
              Cancelar assinatura
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent className="bg-background border-0 shadow-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 font-serif tracking-tight">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Confirmar cancelamento
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600">
              Tem certeza que deseja cancelar sua assinatura? Você ainda terá acesso aos recursos até o final do período atual.
              
              {enhancedStatus.userProfile?.subscription_ends_at && (
                <div className="mt-3 p-3 bg-gray-50 rounded">
                  <p className="text-sm font-medium">
                    Acesso até: {new Date(enhancedStatus.userProfile.subscription_ends_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-background hover:bg-muted border-gray-300 text-gray-700 font-normal">
              Manter assinatura
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelSubscription}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Confirmar cancelamento
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Pause Confirmation Dialog */}
      <AlertDialog open={showPauseDialog} onOpenChange={setShowPauseDialog}>
        <AlertDialogContent className="bg-background border-0 shadow-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 font-serif tracking-tight">
              <Pause className="h-5 w-5 text-blue-600" />
              Pausar assinatura
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600">
              Tem certeza que deseja pausar sua assinatura? Você perderá o acesso aos recursos imediatamente, mas pode retomar a qualquer momento.
              
              <div className="mt-3 p-3 bg-blue-50 rounded">
                <p className="text-sm">
                  Durante a pausa, você não será cobrado e pode retomar com o mesmo plano.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-background hover:bg-muted border-gray-300 text-gray-700 font-normal">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handlePauseSubscription}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Pausar assinatura
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};