// ABOUTME: Enhanced editable subscription cell with timing management and admin payment creation capabilities

import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Calendar, Clock, CreditCard, Plus, User } from 'lucide-react';

interface SubscriptionTimingData {
  subscription_start_date?: string;
  subscription_end_date?: string;
  subscription_created_by?: string;
  admin_subscription_notes?: string;
  subscription_days_granted?: number;
  trial_end_date?: string;
  last_payment_date?: string;
  next_billing_date?: string;
}

interface EditableSubscriptionCellProps {
  value: string;
  isEditing: boolean;
  isPending?: boolean;
  onValueChange: (newValue: string) => void;
  className?: string;
  // Enhanced props for subscription timing
  userId?: string;
  subscriptionData?: SubscriptionTimingData;
  onTimeAdjustment?: (userId: string, days: number, notes: string) => void;
  onPaymentCreation?: (userId: string, type: 'one-time' | 'subscription') => void;
  isAdmin?: boolean;
}

export const EditableSubscriptionCell: React.FC<EditableSubscriptionCellProps> = ({
  value,
  isEditing,
  isPending = false,
  onValueChange,
  className = '',
  userId,
  subscriptionData,
  onTimeAdjustment,
  onPaymentCreation,
  isAdmin = false,
}) => {
  const [isTimeDialogOpen, setIsTimeDialogOpen] = useState(false);
  const [adjustmentDays, setAdjustmentDays] = useState('');
  const [adjustmentNotes, setAdjustmentNotes] = useState('');
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);

  const getSubscriptionLabel = (tier: string): string => {
    switch (tier) {
      case 'premium':
        return 'Premium';
      case 'free':
        return 'Gratuito';
      default:
        return tier;
    }
  };

  const getSubscriptionBadgeVariant = (tier: string) => {
    return tier === 'premium' ? 'default' : 'secondary';
  };

  const calculateRemainingDays = (): number | null => {
    if (!subscriptionData?.subscription_end_date) return null;
    
    const endDate = new Date(subscriptionData.subscription_end_date);
    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getRemainingDaysColor = (days: number | null): string => {
    if (days === null) return 'text-muted-foreground';
    if (days <= 3) return 'text-red-500';
    if (days <= 7) return 'text-orange-500';
    if (days <= 30) return 'text-yellow-600';
    return 'text-green-600';
  };

  const handleTimeAdjustment = () => {
    if (!userId || !onTimeAdjustment) return;
    
    const days = parseInt(adjustmentDays);
    if (isNaN(days) || days === 0) return;
    
    onTimeAdjustment(userId, days, adjustmentNotes);
    setIsTimeDialogOpen(false);
    setAdjustmentDays('');
    setAdjustmentNotes('');
  };

  const handlePaymentCreation = (type: 'one-time' | 'subscription') => {
    if (!userId || !onPaymentCreation) return;
    
    onPaymentCreation(userId, type);
    setIsPaymentDialogOpen(false);
  };

  const remainingDays = calculateRemainingDays();

  if (isEditing) {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        <Select
          value={value}
          onValueChange={onValueChange}
          disabled={isPending}
        >
          <SelectTrigger className="w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="free">Gratuito</SelectItem>
            <SelectItem value="premium">Premium</SelectItem>
          </SelectContent>
        </Select>
        {isPending && (
          <div className="animate-spin rounded-full h-3 w-3 border-b border-primary" />
        )}
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {/* Main subscription tier badge */}
      <div className="flex items-center gap-2">
        <Badge variant={getSubscriptionBadgeVariant(value)}>
          {getSubscriptionLabel(value)}
        </Badge>
        
        {/* Remaining days indicator */}
        {remainingDays !== null && (
          <span className={`text-xs font-medium ${getRemainingDaysColor(remainingDays)}`}>
            {remainingDays > 0 ? `${remainingDays} dias` : 'Expirado'}
          </span>
        )}
      </div>

      {/* Subscription timing information */}
      {subscriptionData && (subscriptionData.subscription_end_date || subscriptionData.subscription_start_date) && (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs justify-start hover:bg-muted/50">
              <Clock className="h-3 w-3 mr-1" />
              Ver detalhes
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="start">
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Detalhes da Assinatura</h4>
              
              <div className="grid gap-2 text-xs">
                {subscriptionData.subscription_start_date && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Início:</span>
                    <span>{formatDate(subscriptionData.subscription_start_date)}</span>
                  </div>
                )}
                
                {subscriptionData.subscription_end_date && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fim:</span>
                    <span className={getRemainingDaysColor(remainingDays)}>
                      {formatDate(subscriptionData.subscription_end_date)}
                    </span>
                  </div>
                )}

                {subscriptionData.trial_end_date && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Trial até:</span>
                    <span>{formatDate(subscriptionData.trial_end_date)}</span>
                  </div>
                )}

                {subscriptionData.last_payment_date && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Último pag.:</span>
                    <span>{formatDate(subscriptionData.last_payment_date)}</span>
                  </div>
                )}

                {subscriptionData.next_billing_date && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Próxima cobrança:</span>
                    <span>{formatDate(subscriptionData.next_billing_date)}</span>
                  </div>
                )}

                {subscriptionData.subscription_created_by && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Criado por:</span>
                    <span className="capitalize">{subscriptionData.subscription_created_by}</span>
                  </div>
                )}

                {subscriptionData.subscription_days_granted && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Dias concedidos:</span>
                    <span>{subscriptionData.subscription_days_granted}</span>
                  </div>
                )}
              </div>

              {subscriptionData.admin_subscription_notes && (
                <div className="mt-3 pt-2 border-t">
                  <p className="text-xs text-muted-foreground mb-1">Notas do Admin:</p>
                  <p className="text-xs bg-muted/50 p-2 rounded">
                    {subscriptionData.admin_subscription_notes}
                  </p>
                </div>
              )}

              {/* Admin actions */}
              {isAdmin && userId && (
                <div className="flex gap-2 mt-3 pt-2 border-t">
                  <Dialog open={isTimeDialogOpen} onOpenChange={setIsTimeDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="text-xs">
                        <Calendar className="h-3 w-3 mr-1" />
                        Ajustar Tempo
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Ajustar Tempo de Assinatura</DialogTitle>
                        <DialogDescription>
                          Adicione ou remova dias da assinatura do usuário. Use valores negativos para reduzir o tempo.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="days">Dias para ajustar</Label>
                          <Input
                            id="days"
                            type="number"
                            placeholder="Ex: 30 (adicionar) ou -7 (remover)"
                            value={adjustmentDays}
                            onChange={(e) => setAdjustmentDays(e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="notes">Notas do admin (opcional)</Label>
                          <Textarea
                            id="notes"
                            placeholder="Motivo do ajuste..."
                            value={adjustmentNotes}
                            onChange={(e) => setAdjustmentNotes(e.target.value)}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsTimeDialogOpen(false)}>
                          Cancelar
                        </Button>
                        <Button onClick={handleTimeAdjustment} disabled={!adjustmentDays || adjustmentDays === '0'}>
                          Aplicar Ajuste
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="text-xs">
                        <CreditCard className="h-3 w-3 mr-1" />
                        Criar Pagamento
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Criar Pagamento Administrativo</DialogTitle>
                        <DialogDescription>
                          Escolha o tipo de pagamento a ser criado para este usuário.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <Button 
                          onClick={() => handlePaymentCreation('one-time')}
                          className="w-full justify-start"
                          variant="outline"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Pagamento Único (uma vez só)
                        </Button>
                        <Button 
                          onClick={() => handlePaymentCreation('subscription')}
                          className="w-full justify-start"
                          variant="outline"
                        >
                          <User className="h-4 w-4 mr-2" />
                          Plano de Assinatura (recorrente)
                        </Button>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>
                          Cancelar
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
};