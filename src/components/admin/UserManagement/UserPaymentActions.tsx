// ABOUTME: Payment action buttons for individual user management in admin interface, extends existing user management functionality
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  CreditCard, 
  Plus, 
  Clock, 
  UserX, 
  DollarSign, 
  Calendar,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';

// =================================================================
// Types & Interfaces
// =================================================================

interface UserPaymentData {
  userId: string;
  fullName: string;
  email: string;
  subscriptionStatus: 'active' | 'inactive' | 'past_due' | 'suspended' | 'canceled' | 'trialing';
  subscriptionPlan?: string;
  subscriptionExpiresAt?: string;
  pagarmeCustomerId?: string;
  lastPaymentDate?: string;
  totalRevenue?: number;
}

interface UserPaymentActionsProps {
  user: UserPaymentData;
  onUserUpdate?: (userId: string, updates: Partial<UserPaymentData>) => void;
}

// =================================================================
// Payment Status Helpers
// =================================================================

const getSubscriptionStatusBadge = (status: UserPaymentData['subscriptionStatus']) => {
  const statusConfig = {
    active: { label: 'Ativo', className: 'bg-green-100 text-green-800 hover:bg-green-100' },
    inactive: { label: 'Inativo', className: 'bg-gray-100 text-gray-800 hover:bg-gray-100' },
    past_due: { label: 'Vencido', className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100' },
    suspended: { label: 'Suspenso', className: 'bg-red-100 text-red-800 hover:bg-red-100' },
    canceled: { label: 'Cancelado', className: 'bg-red-100 text-red-800 hover:bg-red-100' },
    trialing: { label: 'Teste', className: 'bg-blue-100 text-blue-800 hover:bg-blue-100' }
  };
  
  const config = statusConfig[status] || statusConfig.inactive;
  return <Badge className={config.className}>{config.label}</Badge>;
};

const getStatusIcon = (status: UserPaymentData['subscriptionStatus']) => {
  switch (status) {
    case 'active':
    case 'trialing':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'past_due':
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    case 'suspended':
    case 'canceled':
      return <XCircle className="h-4 w-4 text-red-500" />;
    default:
      return <XCircle className="h-4 w-4 text-gray-500" />;
  }
};

// =================================================================
// Grant Access Modal Component
// =================================================================

const GrantAccessModal: React.FC<{ 
  user: UserPaymentData; 
  onGrant: (userId: string, duration: number, reason: string) => void; 
}> = ({ user, onGrant }) => {
  const [duration, setDuration] = useState('30');
  const [reason, setReason] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const handleGrant = () => {
    if (!reason.trim()) {
      toast.error('Motivo é obrigatório');
      return;
    }

    onGrant(user.userId, parseInt(duration), reason);
    setIsOpen(false);
    setDuration('30');
    setReason('');
    toast.success(`Acesso concedido para ${user.fullName} por ${duration} dias`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-green-600 border-green-200 hover:bg-green-50">
          <Plus className="h-3 w-3 mr-1" />
          Conceder Acesso
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Conceder Acesso Premium</DialogTitle>
          <DialogDescription>
            Conceder acesso premium temporário para {user.fullName} ({user.email})
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="duration">Duração do Acesso</Label>
            <Select value={duration} onValueChange={setDuration}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 dias</SelectItem>
                <SelectItem value="15">15 dias</SelectItem>
                <SelectItem value="30">30 dias</SelectItem>
                <SelectItem value="60">60 dias</SelectItem>
                <SelectItem value="90">90 dias</SelectItem>
                <SelectItem value="365">1 ano</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="reason">Motivo (obrigatório)</Label>
            <Textarea
              id="reason"
              placeholder="Ex: Tester beta, parceiro estratégico, compensação por problema técnico..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleGrant} className="bg-green-600 hover:bg-green-700">
            Conceder Acesso
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// =================================================================
// Extend Subscription Modal Component
// =================================================================

const ExtendSubscriptionModal: React.FC<{ 
  user: UserPaymentData; 
  onExtend: (userId: string, months: number, reason: string) => void; 
}> = ({ user, onExtend }) => {
  const [months, setMonths] = useState('1');
  const [reason, setReason] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const handleExtend = () => {
    if (!reason.trim()) {
      toast.error('Motivo é obrigatório');
      return;
    }

    onExtend(user.userId, parseInt(months), reason);
    setIsOpen(false);
    setMonths('1');
    setReason('');
    toast.success(`Assinatura de ${user.fullName} estendida por ${months} mês(es)`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-blue-600 border-blue-200 hover:bg-blue-50">
          <Clock className="h-3 w-3 mr-1" />
          Estender
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Estender Assinatura</DialogTitle>
          <DialogDescription>
            Estender assinatura ativa de {user.fullName} ({user.email})
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="months">Período de Extensão</Label>
            <Select value={months} onValueChange={setMonths}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 mês</SelectItem>
                <SelectItem value="2">2 meses</SelectItem>
                <SelectItem value="3">3 meses</SelectItem>
                <SelectItem value="6">6 meses</SelectItem>
                <SelectItem value="12">12 meses</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="reason">Motivo (obrigatório)</Label>
            <Textarea
              id="reason"
              placeholder="Ex: Compensação por indisponibilidade, desconto promocional, fidelização..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleExtend} className="bg-blue-600 hover:bg-blue-700">
            Estender Assinatura
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// =================================================================
// Main UserPaymentActions Component
// =================================================================

export const UserPaymentActions: React.FC<UserPaymentActionsProps> = ({ 
  user, 
  onUserUpdate 
}) => {
  const handleGrantAccess = (userId: string, duration: number, reason: string) => {
    // PLACEHOLDER IMPLEMENTATION: This would call Supabase Edge Function to grant access
    console.log('PLACEHOLDER: Grant access action:', { userId, duration, reason });
    
    // PLACEHOLDER: Update user status locally (should be API call + webhook)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + duration);
    
    onUserUpdate?.(userId, {
      subscriptionStatus: 'active',
      subscriptionExpiresAt: expiresAt.toISOString(),
      subscriptionPlan: 'admin-granted' // HARDCODED: Should be dynamic plan assignment
    });
  };

  const handleExtendSubscription = (userId: string, months: number, reason: string) => {
    // PLACEHOLDER IMPLEMENTATION: This would call Supabase Edge Function to extend subscription
    console.log('PLACEHOLDER: Extend subscription action:', { userId, months, reason });
    
    // PLACEHOLDER: Update user status locally (should be API call + database update)
    const currentExpiry = user.subscriptionExpiresAt ? new Date(user.subscriptionExpiresAt) : new Date();
    currentExpiry.setMonth(currentExpiry.getMonth() + months);
    
    onUserUpdate?.(userId, {
      subscriptionExpiresAt: currentExpiry.toISOString()
    });
  };

  const handleSuspendUser = () => {
    // PLACEHOLDER IMPLEMENTATION: This would call Supabase to update user status
    console.log('PLACEHOLDER: Suspend user action:', user.userId);
    onUserUpdate?.(user.userId, {
      subscriptionStatus: 'suspended'
    });
    toast.success(`Usuário ${user.fullName} suspenso`);
  };

  const handleReactivateUser = () => {
    // PLACEHOLDER IMPLEMENTATION: This would call Supabase to reactivate user  
    console.log('PLACEHOLDER: Reactivate user action:', user.userId);
    onUserUpdate?.(user.userId, {
      subscriptionStatus: 'active'
    });
    toast.success(`Usuário ${user.fullName} reativado`);
  };

  // Calculate days remaining if subscription is active
  const daysRemaining = user.subscriptionExpiresAt 
    ? Math.ceil((new Date(user.subscriptionExpiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="space-y-3">
      {/* Payment Status Display */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {getStatusIcon(user.subscriptionStatus)}
          {getSubscriptionStatusBadge(user.subscriptionStatus)}
          {user.subscriptionPlan && (
            <Badge variant="outline" className="text-xs">
              {user.subscriptionPlan}
            </Badge>
          )}
        </div>
        
        {daysRemaining !== null && daysRemaining > 0 && (
          <span className="text-xs text-muted-foreground">
            {daysRemaining} dias restantes
          </span>
        )}
      </div>

      {/* Payment Actions */}
      <div className="flex flex-wrap gap-2">
        {user.subscriptionStatus === 'inactive' && (
          <GrantAccessModal user={user} onGrant={handleGrantAccess} />
        )}
        
        {(['active', 'trialing'].includes(user.subscriptionStatus)) && (
          <ExtendSubscriptionModal user={user} onExtend={handleExtendSubscription} />
        )}
        
        {(['active', 'trialing', 'past_due'].includes(user.subscriptionStatus)) && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleSuspendUser}
            className="text-red-600 border-red-200 hover:bg-red-50"
          >
            <UserX className="h-3 w-3 mr-1" />
            Suspender
          </Button>
        )}
        
        {user.subscriptionStatus === 'suspended' && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleReactivateUser}
            className="text-green-600 border-green-200 hover:bg-green-50"
          >
            <CheckCircle className="h-3 w-3 mr-1" />
            Reativar
          </Button>
        )}
      </div>

      {/* Additional Payment Info */}
      {user.totalRevenue && user.totalRevenue > 0 && (
        <div className="text-xs text-muted-foreground">
          Receita total: R$ {(user.totalRevenue / 100).toFixed(2).replace('.', ',')}
        </div>
      )}
    </div>
  );
};

export default UserPaymentActions;