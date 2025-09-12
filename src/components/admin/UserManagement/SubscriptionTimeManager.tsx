// ABOUTME: Comprehensive subscription time management component with bulk operations and detailed analytics

import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Calendar,
  Clock,
  Users,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Plus,
  Minus,
  RotateCcw,
  FileText,
} from 'lucide-react';

interface User {
  id: string;
  full_name: string;
  email: string;
  subscription_tier: string;
  subscription_starts_at?: string;
  subscription_ends_at?: string;
  subscription_created_by?: string;
  admin_subscription_notes?: string;
  subscription_days_granted?: number;
  trial_end_date?: string;
  last_payment_date?: string;
}

interface SubscriptionTimeManagerProps {
  users: User[];
  onBulkTimeAdjustment: (userIds: string[], days: number, notes: string) => void;
  onUserTimeAdjustment: (userId: string, days: number, notes: string) => void;
  onSubscriptionReset: (userId: string, notes: string) => void;
  isLoading?: boolean;
}

interface SubscriptionStats {
  totalUsers: number;
  activeSubscriptions: number;
  expiringSoon: number;
  expired: number;
  adminCreated: number;
  userCreated: number;
  totalDaysGranted: number;
}

export const SubscriptionTimeManager: React.FC<SubscriptionTimeManagerProps> = ({
  users,
  onBulkTimeAdjustment,
  onUserTimeAdjustment,
  onSubscriptionReset,
  isLoading = false,
}) => {
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [bulkDays, setBulkDays] = useState('');
  const [bulkNotes, setBulkNotes] = useState('');
  const [filterExpiring, setFilterExpiring] = useState<string>('all');
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);

  // Calculate subscription statistics
  const calculateStats = (): SubscriptionStats => {
    const now = new Date();
    
    return users.reduce((stats, user) => {
      stats.totalUsers++;
      
      if (user.subscription_tier === 'premium' && user.subscription_ends_at) {
        stats.activeSubscriptions++;
        
        const endDate = new Date(user.subscription_ends_at);
        const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysRemaining <= 0) {
          stats.expired++;
        } else if (daysRemaining <= 7) {
          stats.expiringSoon++;
        }
      }
      
      if (user.subscription_created_by === 'admin') {
        stats.adminCreated++;
      } else if (user.subscription_created_by === 'user') {
        stats.userCreated++;
      }
      
      if (user.subscription_days_granted) {
        stats.totalDaysGranted += user.subscription_days_granted;
      }
      
      return stats;
    }, {
      totalUsers: 0,
      activeSubscriptions: 0,
      expiringSoon: 0,
      expired: 0,
      adminCreated: 0,
      userCreated: 0,
      totalDaysGranted: 0,
    } as SubscriptionStats);
  };

  const getFilteredUsers = (): User[] => {
    if (filterExpiring === 'all') return users;
    
    const now = new Date();
    return users.filter(user => {
      if (!user.subscription_ends_at) return false;
      
      const endDate = new Date(user.subscription_ends_at);
      const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      switch (filterExpiring) {
        case 'expiring_soon':
          return daysRemaining > 0 && daysRemaining <= 7;
        case 'expired':
          return daysRemaining <= 0;
        case 'active':
          return daysRemaining > 7;
        default:
          return true;
      }
    });
  };

  const getRemainingDays = (endDate?: string): number | null => {
    if (!endDate) return null;
    
    const end = new Date(endDate);
    const now = new Date();
    return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getDaysColor = (days: number | null): string => {
    if (days === null) return 'text-muted-foreground';
    if (days <= 0) return 'text-red-600';
    if (days <= 3) return 'text-red-500';
    if (days <= 7) return 'text-orange-500';
    if (days <= 30) return 'text-yellow-600';
    return 'text-green-600';
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const handleUserSelection = (userId: string, selected: boolean) => {
    const newSelection = new Set(selectedUsers);
    if (selected) {
      newSelection.add(userId);
    } else {
      newSelection.delete(userId);
    }
    setSelectedUsers(newSelection);
  };

  const handleSelectAll = () => {
    const filteredUsers = getFilteredUsers();
    if (selectedUsers.size === filteredUsers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(filteredUsers.map(u => u.id)));
    }
  };

  const handleBulkAdjustment = () => {
    const days = parseInt(bulkDays);
    if (isNaN(days) || days === 0 || selectedUsers.size === 0) return;
    
    onBulkTimeAdjustment(Array.from(selectedUsers), days, bulkNotes);
    setIsBulkDialogOpen(false);
    setBulkDays('');
    setBulkNotes('');
    setSelectedUsers(new Set());
  };

  const stats = calculateStats();
  const filteredUsers = getFilteredUsers();

  return (
    <div className="space-y-6">
      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Total</p>
                <p className="text-2xl font-bold">{stats.totalUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm font-medium">Ativos</p>
                <p className="text-2xl font-bold text-green-600">{stats.activeSubscriptions}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              <div>
                <p className="text-sm font-medium">Expirando</p>
                <p className="text-2xl font-bold text-orange-600">{stats.expiringSoon}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <XCircle className="h-4 w-4 text-red-500" />
              <div>
                <p className="text-sm font-medium">Expirados</p>
                <p className="text-2xl font-bold text-red-600">{stats.expired}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-purple-500" />
              <div>
                <p className="text-sm font-medium">Admin</p>
                <p className="text-2xl font-bold text-purple-600">{stats.adminCreated}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-indigo-500" />
              <div>
                <p className="text-sm font-medium">Dias Concedidos</p>
                <p className="text-2xl font-bold text-indigo-600">{stats.totalDaysGranted}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Bulk Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Gerenciamento de Assinaturas
          </CardTitle>
          <CardDescription>
            Visualize e gerencie o tempo de assinatura dos usuários
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row gap-4 mb-4">
            <div className="flex-1">
              <Label htmlFor="filter">Filtrar por status</Label>
              <Select value={filterExpiring} onValueChange={setFilterExpiring}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os usuários</SelectItem>
                  <SelectItem value="active">Assinaturas ativas</SelectItem>
                  <SelectItem value="expiring_soon">Expirando em 7 dias</SelectItem>
                  <SelectItem value="expired">Expirados</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end gap-2">
              <Button
                variant="outline"
                onClick={handleSelectAll}
                disabled={filteredUsers.length === 0}
              >
                {selectedUsers.size === filteredUsers.length ? 'Desmarcar Todos' : 'Marcar Todos'}
              </Button>

              <Dialog open={isBulkDialogOpen} onOpenChange={setIsBulkDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    disabled={selectedUsers.size === 0}
                    variant="default"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Ajuste em Lote ({selectedUsers.size})
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Ajuste de Tempo em Lote</DialogTitle>
                    <DialogDescription>
                      Ajustar tempo de assinatura para {selectedUsers.size} usuários selecionados.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="bulk-days">Dias para ajustar</Label>
                      <Input
                        id="bulk-days"
                        type="number"
                        placeholder="Ex: 30 (adicionar) ou -7 (remover)"
                        value={bulkDays}
                        onChange={(e) => setBulkDays(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="bulk-notes">Notas do admin</Label>
                      <Textarea
                        id="bulk-notes"
                        placeholder="Motivo do ajuste em lote..."
                        value={bulkNotes}
                        onChange={(e) => setBulkNotes(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsBulkDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button 
                      onClick={handleBulkAdjustment} 
                      disabled={!bulkDays || bulkDays === '0'}
                    >
                      Aplicar Ajuste
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Users List */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredUsers.length === 0 ? (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Nenhum usuário encontrado com os filtros aplicados.
                </AlertDescription>
              </Alert>
            ) : (
              filteredUsers.map((user) => {
                const remainingDays = getRemainingDays(user.subscription_ends_at);
                const isSelected = selectedUsers.has(user.id);

                return (
                  <Card key={user.id} className={`transition-colors ${isSelected ? 'border-primary bg-primary/5' : ''}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => handleUserSelection(user.id, e.target.checked)}
                            className="rounded"
                          />
                          
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{user.full_name}</span>
                              <Badge variant={user.subscription_tier === 'premium' ? 'default' : 'secondary'}>
                                {user.subscription_tier === 'premium' ? 'Premium' : 'Gratuito'}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          {/* Subscription timing info */}
                          <div className="text-right">
                            {remainingDays !== null ? (
                              <div>
                                <span className={`text-sm font-medium ${getDaysColor(remainingDays)}`}>
                                  {remainingDays > 0 ? `${remainingDays} dias` : 'Expirado'}
                                </span>
                                <p className="text-xs text-muted-foreground">
                                  até {formatDate(user.subscription_ends_at)}
                                </p>
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground">Sem assinatura</span>
                            )}
                          </div>

                          {/* Individual actions */}
                          <div className="flex gap-1">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Calendar className="h-3 w-3" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Ajustar Tempo - {user.full_name}</DialogTitle>
                                </DialogHeader>
                                <IndividualTimeAdjuster 
                                  user={user}
                                  onAdjustment={(days, notes) => onUserTimeAdjustment(user.id, days, notes)}
                                  onReset={(notes) => onSubscriptionReset(user.id, notes)}
                                />
                              </DialogContent>
                            </Dialog>
                          </div>
                        </div>
                      </div>

                      {/* Admin notes preview */}
                      {user.admin_subscription_notes && (
                        <div className="mt-2 pt-2 border-t">
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            {user.admin_subscription_notes.length > 50 
                              ? `${user.admin_subscription_notes.substring(0, 50)}...`
                              : user.admin_subscription_notes
                            }
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Individual Time Adjuster Component
interface IndividualTimeAdjusterProps {
  user: User;
  onAdjustment: (days: number, notes: string) => void;
  onReset: (notes: string) => void;
}

const IndividualTimeAdjuster: React.FC<IndividualTimeAdjusterProps> = ({
  user,
  onAdjustment,
  onReset,
}) => {
  const [days, setDays] = useState('');
  const [notes, setNotes] = useState('');
  const [resetNotes, setResetNotes] = useState('');

  const remainingDays = user.subscription_ends_at 
    ? Math.ceil((new Date(user.subscription_ends_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const handleAdjustment = () => {
    const dayAmount = parseInt(days);
    if (isNaN(dayAmount) || dayAmount === 0) return;
    
    onAdjustment(dayAmount, notes);
    setDays('');
    setNotes('');
  };

  const handleReset = () => {
    onReset(resetNotes);
    setResetNotes('');
  };

  return (
    <Tabs defaultValue="adjust" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="adjust">Ajustar Tempo</TabsTrigger>
        <TabsTrigger value="reset">Resetar Assinatura</TabsTrigger>
      </TabsList>
      
      <TabsContent value="adjust" className="space-y-4">
        <div className="space-y-4">
          {/* Current status */}
          <div className="p-3 bg-muted/50 rounded">
            <p className="text-sm font-medium mb-1">Status Atual:</p>
            <div className="flex justify-between text-sm">
              <span>Dias restantes:</span>
              <span className={remainingDays ? (remainingDays > 0 ? 'text-green-600' : 'text-red-600') : 'text-muted-foreground'}>
                {remainingDays ? (remainingDays > 0 ? `${remainingDays} dias` : 'Expirado') : 'Sem assinatura'}
              </span>
            </div>
            {user.subscription_ends_at && (
              <div className="flex justify-between text-sm">
                <span>Expira em:</span>
                <span>{new Date(user.subscription_ends_at).toLocaleDateString('pt-BR')}</span>
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="days-adjust">Dias para ajustar</Label>
            <Input
              id="days-adjust"
              type="number"
              placeholder="Ex: 30 (adicionar) ou -7 (remover)"
              value={days}
              onChange={(e) => setDays(e.target.value)}
            />
          </div>
          
          <div>
            <Label htmlFor="notes-adjust">Notas do admin</Label>
            <Textarea
              id="notes-adjust"
              placeholder="Motivo do ajuste..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <Button onClick={handleAdjustment} disabled={!days || days === '0'} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Aplicar Ajuste
          </Button>
        </div>
      </TabsContent>
      
      <TabsContent value="reset" className="space-y-4">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Esta ação irá remover completamente a assinatura do usuário. Esta ação não pode ser desfeita.
          </AlertDescription>
        </Alert>

        <div>
          <Label htmlFor="reset-notes">Motivo do reset</Label>
          <Textarea
            id="reset-notes"
            placeholder="Descreva o motivo para resetar a assinatura..."
            value={resetNotes}
            onChange={(e) => setResetNotes(e.target.value)}
            required
          />
        </div>

        <Button 
          onClick={handleReset} 
          disabled={!resetNotes.trim()} 
          variant="destructive" 
          className="w-full"
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Resetar Assinatura
        </Button>
      </TabsContent>
    </Tabs>
  );
};