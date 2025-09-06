// ABOUTME: Simple admin payment management page for creating custom payment plans and generating shareable links

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { CreditCard, Link, Copy, Check, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Database } from '@/integrations/supabase/types';

type PaymentPlan = Database['public']['Tables']['PaymentPlans']['Row'];
type PaymentPlanInsert = Database['public']['Tables']['PaymentPlans']['Insert'];
type PaymentPlanUpdate = Database['public']['Tables']['PaymentPlans']['Update'];

export default function AdminPaymentManagement() {
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const queryClient = useQueryClient();
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    amount: '',
    days: '',
    type: 'one-time' as 'one-time' | 'subscription',
    billing_interval: 'month' as 'day' | 'week' | 'month' | 'year',
    billing_interval_count: '1',
    billing_type: 'prepaid' as 'prepaid' | 'postpaid' | 'exact_day'
  });

  // Fetch payment plans
  const { data: plans = [], isLoading } = useQuery({
    queryKey: ['payment-plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('PaymentPlans')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    }
  });

  // Create payment plan mutation
  const createPlanMutation = useMutation({
    mutationFn: async (planData: PaymentPlanInsert) => {
      const { data, error } = await supabase
        .from('PaymentPlans')
        .insert(planData)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-plans'] });
      resetForm();
      toast.success('Plano criado com sucesso!');
    },
    onError: (error) => {
      console.error('Error creating plan:', error);
      toast.error('Erro ao criar plano');
    }
  });

  // Toggle plan activation mutation
  const togglePlanMutation = useMutation({
    mutationFn: async ({ planId, isActive }: { planId: string; isActive: boolean }) => {
      const { data, error } = await supabase
        .from('PaymentPlans')
        .update({ is_active: isActive, updated_at: new Date().toISOString() })
        .eq('id', planId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (updatedPlan) => {
      queryClient.invalidateQueries({ queryKey: ['payment-plans'] });
      toast.success(`Plano ${updatedPlan.is_active ? 'ativado' : 'desativado'} com sucesso!`);
    },
    onError: (error) => {
      console.error('Error toggling plan:', error);
      toast.error('Erro ao alterar status do plano');
    }
  });

  // Delete plan mutation
  const deletePlanMutation = useMutation({
    mutationFn: async (planId: string) => {
      const { error } = await supabase
        .from('PaymentPlans')
        .delete()
        .eq('id', planId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-plans'] });
      toast.success('Plano excluído com sucesso!');
    },
    onError: (error) => {
      console.error('Error deleting plan:', error);
      toast.error('Erro ao excluir plano');
    }
  });

  // Fetch default payment plan setting
  const { data: defaultPlanSetting } = useQuery({
    queryKey: ['default-payment-plan'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('SiteSettings')
        .select('value')
        .eq('key', 'default_payment_plan_id')
        .single();
      
      if (error) throw error;
      
      // Handle empty string or null values
      if (!data?.value || data.value === '""' || data.value === '') {
        return '';
      }
      
      // Handle both JSON string and plain string formats
      try {
        // Try parsing as JSON first (new format)
        return JSON.parse(data.value as string);
      } catch {
        // Fallback to plain string (current format)
        return data.value as string;
      }
    }
  });

  // Set default plan mutation
  const setDefaultPlanMutation = useMutation({
    mutationFn: async (planId: string) => {
      console.log('Mutation executing for planId:', planId);
      
      const { data, error } = await supabase
        .from('SiteSettings')
        .update({ 
          value: JSON.stringify(planId),
          updated_at: new Date().toISOString()
        })
        .eq('key', 'default_payment_plan_id');
      
      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      console.log('Supabase update successful');
      return planId;
    },
    onMutate: async (planId) => {
      // Cancel outgoing refetches to prevent race conditions
      await queryClient.cancelQueries({ queryKey: ['default-payment-plan'] });
      
      // Snapshot the previous value
      const previousDefaultPlan = queryClient.getQueryData(['default-payment-plan']);
      
      // Optimistically update to the new value
      queryClient.setQueryData(['default-payment-plan'], planId);
      
      console.log('Optimistic update: setting default plan to', planId);
      
      // Return a context with the previous and new value
      return { previousDefaultPlan, planId };
    },
    onSuccess: (planId, variables, context) => {
      console.log('Mutation onSuccess with planId:', planId);
      // Update the cache with the successful result (don't invalidate yet - let onSettled handle it)
      queryClient.setQueryData(['default-payment-plan'], planId);
      toast.success('Plano padrão atualizado com sucesso!');
    },
    onError: (error, variables, context) => {
      console.error('Mutation onError:', error);
      // If the mutation fails, use the context to roll back
      if (context?.previousDefaultPlan !== undefined) {
        queryClient.setQueryData(['default-payment-plan'], context.previousDefaultPlan);
      }
      toast.error('Erro ao configurar plano padrão');
    },
    onSettled: () => {
      // Always refetch after error or success to ensure we're in sync
      queryClient.invalidateQueries({ queryKey: ['default-payment-plan'] });
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      amount: '',
      days: '',
      type: 'one-time',
      billing_interval: 'month',
      billing_interval_count: '1',
      billing_type: 'prepaid'
    });
  };

  // Generate URL-friendly slug from plan name
  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .normalize('NFD') // Decompose accented characters
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .trim()
      .slice(0, 50); // Limit length
  };

  const handleCreatePlan = async () => {
    if (!formData.name || !formData.amount || !formData.days) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    // Parse currency value to decimal number
    const parsedAmount = parseCurrency(formData.amount);
    if (!parsedAmount || parseFloat(parsedAmount) <= 0) {
      toast.error('Insira um valor válido');
      return;
    }

    const planData: PaymentPlanInsert = {
      name: formData.name,
      description: formData.description || null,
      amount: Math.round(parseFloat(parsedAmount) * 100), // Convert to cents
      days: parseInt(formData.days),
      type: formData.type,
      billing_interval: formData.type === 'subscription' ? formData.billing_interval : null,
      billing_interval_count: formData.type === 'subscription' ? parseInt(formData.billing_interval_count) : null,
      billing_type: formData.type === 'subscription' ? formData.billing_type : null,
      is_active: true, // New plans are active by default
      slug: generateSlug(formData.name), // Generate URL-friendly slug
      metadata: {}
    };

    createPlanMutation.mutate(planData);
  };

  // Format currency input (BRL)
  const formatCurrency = (value: string): string => {
    // Remove all non-numeric characters
    const numericValue = value.replace(/\D/g, '');
    
    if (!numericValue) return '';
    
    // Convert to number and format as currency
    const numberValue = parseInt(numericValue) / 100;
    return numberValue.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2
    });
  };

  // Parse currency value back to decimal
  const parseCurrency = (formattedValue: string): string => {
    const numericValue = formattedValue.replace(/[^\d,]/g, '').replace(',', '.');
    return numericValue;
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const formattedValue = formatCurrency(inputValue);
    setFormData(prev => ({ ...prev, amount: formattedValue }));
  };

  const generatePaymentLink = (plan: PaymentPlan): string => {
    const baseUrl = window.location.origin;
    // Pretty URL: use plan slug for better customer experience
    const params = new URLSearchParams({
      plan: plan.slug || plan.id // Fallback to ID if slug not available
    });
    return `${baseUrl}/pagamento?${params.toString()}`;
  };

  const handleTogglePlan = (planId: string, currentStatus: boolean) => {
    togglePlanMutation.mutate({ planId, isActive: !currentStatus });
  };

  const handleDeletePlan = (planId: string, planName: string) => {
    if (window.confirm(`Tem certeza que deseja excluir o plano "${planName}"? Esta ação não pode ser desfeita.`)) {
      deletePlanMutation.mutate(planId);
    }
  };

  const copyToClipboard = async (link: string, planId: string) => {
    try {
      await navigator.clipboard.writeText(link);
      setCopiedLink(planId);
      toast.success('Link copiado!');
      setTimeout(() => setCopiedLink(null), 2000);
    } catch (error) {
      toast.error('Erro ao copiar link');
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestão de Pagamentos</h1>
            <p className="text-muted-foreground">
              Crie planos customizados e gere links de pagamento para compartilhar com clientes
            </p>
          </div>
        </div>

        {/* Create New Plan */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Criar Novo Plano
            </CardTitle>
            <CardDescription>
              Configure um plano de pagamento personalizado
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Plano *</Label>
                <Input
                  id="name"
                  placeholder="Ex: Plano Premium 1 Ano"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="type">Tipo do Plano</Label>
                <Select 
                  value={formData.type} 
                  onValueChange={(value: 'one-time' | 'subscription') => 
                    setFormData(prev => ({ ...prev, type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="one-time">Pagamento Único</SelectItem>
                    <SelectItem value="subscription">Assinatura Recorrente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Subscription-specific fields */}
            {formData.type === 'subscription' && (
              <div className="space-y-4 p-4 bg-blue-50 rounded-lg border">
                <h4 className="font-medium text-blue-900">Configurações de Recorrência</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="billing_interval">Intervalo de Cobrança</Label>
                    <Select 
                      value={formData.billing_interval} 
                      onValueChange={(value: 'day' | 'week' | 'month' | 'year') => 
                        setFormData(prev => ({ ...prev, billing_interval: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="day">Diário</SelectItem>
                        <SelectItem value="week">Semanal</SelectItem>
                        <SelectItem value="month">Mensal</SelectItem>
                        <SelectItem value="year">Anual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="interval_count">A Cada</Label>
                    <Input
                      id="interval_count"
                      type="number"
                      min="1"
                      max="12"
                      placeholder="1"
                      value={formData.billing_interval_count}
                      onChange={(e) => setFormData(prev => ({ ...prev, billing_interval_count: e.target.value }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="billing_type">Tipo de Cobrança</Label>
                    <Select 
                      value={formData.billing_type} 
                      onValueChange={(value: 'prepaid' | 'postpaid' | 'exact_day') => 
                        setFormData(prev => ({ ...prev, billing_type: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="prepaid">Pré-pago</SelectItem>
                        <SelectItem value="postpaid">Pós-pago</SelectItem>
                        <SelectItem value="exact_day">Dia Exato</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Valor (R$) *</Label>
                <Input
                  id="amount"
                  type="text"
                  placeholder="R$ 99,90"
                  value={formData.amount}
                  onChange={handleAmountChange}
                />
                <p className="text-xs text-muted-foreground">
                  Digite apenas números. Ex: 9990 = R$ 99,90
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="days">Dias de Acesso *</Label>
                <Input
                  id="days"
                  type="number"
                  placeholder="365"
                  value={formData.days}
                  onChange={(e) => setFormData(prev => ({ ...prev, days: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                placeholder="Descrição opcional do plano..."
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <Button 
              onClick={handleCreatePlan} 
              disabled={createPlanMutation.isPending}
              className="w-full md:w-auto"
            >
              {createPlanMutation.isPending ? 'Criando...' : 'Criar Plano'}
            </Button>
          </CardContent>
        </Card>

        {/* Default Plan Setting */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ToggleRight className="h-5 w-5" />
              Plano Padrão
            </CardTitle>
            <CardDescription>
              Defina qual plano será usado quando nenhum parâmetro for especificado na URL
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="default-plan">Plano Padrão</Label>
              <Select 
                value={defaultPlanSetting || ""} 
                onValueChange={(planId) => {
                  console.log('Select onValueChange triggered with planId:', planId);
                  console.log('Current defaultPlanSetting:', defaultPlanSetting);
                  console.log('Available plans:', plans.map(p => ({ id: p.id, name: p.name })));
                  setDefaultPlanMutation.mutate(planId);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um plano padrão" />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.name} - R$ {(plan.amount / 100).toFixed(2)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {/* Debug information - remove after testing */}
              <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                <div>Current defaultPlanSetting: {JSON.stringify(defaultPlanSetting)}</div>
                <div>Mutation pending: {setDefaultPlanMutation.isPending ? 'Yes' : 'No'}</div>
                <div>Available plans: {plans.length}</div>
              </div>
              <p className="text-xs text-muted-foreground">
                Este plano será usado quando alguém acessar /pagamento sem especificar um plano
              </p>
              
              {setDefaultPlanMutation.isPending && (
                <p className="text-xs text-blue-600">Configurando...</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Plans List */}
        <Card>
          <CardHeader>
            <CardTitle>Planos Criados</CardTitle>
            <CardDescription>
              Links de pagamento gerados automaticamente para cada plano
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p>Carregando planos...</p>
              </div>
            ) : plans.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum plano criado ainda</p>
                <p className="text-sm">Crie seu primeiro plano acima</p>
              </div>
            ) : (
              <div className="space-y-4">
                {plans.map((plan) => {
                  const paymentLink = generatePaymentLink(plan);
                  const billingInfo = plan.type === 'subscription' && plan.billing_interval 
                    ? `${plan.billing_interval_count || 1}x por ${plan.billing_interval === 'day' ? 'dia' : plan.billing_interval === 'week' ? 'semana' : plan.billing_interval === 'month' ? 'mês' : 'ano'}`
                    : null;
                  
                  return (
                    <div key={plan.id} className={`border rounded-lg p-4 space-y-3 transition-opacity ${!plan.is_active ? 'opacity-60 bg-gray-50' : ''}`}>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">{plan.name}</h3>
                            <Badge variant={plan.type === 'subscription' ? 'default' : 'secondary'}>
                              {plan.type === 'subscription' ? 'Recorrente' : 'Único'}
                            </Badge>
                            {!plan.is_active && (
                              <Badge variant="destructive">Inativo</Badge>
                            )}
                          </div>
                          {plan.description && (
                            <p className="text-sm text-muted-foreground">{plan.description}</p>
                          )}
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>R$ {(plan.amount / 100).toFixed(2)}</span>
                            <span>{plan.days} dias de acesso</span>
                            {billingInfo && <span>{billingInfo}</span>}
                            <span>Criado em {new Date(plan.created_at).toLocaleDateString('pt-BR')}</span>
                          </div>
                          {plan.usage_count !== null && (
                            <div className="text-xs text-muted-foreground">
                              Usado {plan.usage_count} vezes
                              {plan.last_used_at && ` • Último uso: ${new Date(plan.last_used_at).toLocaleDateString('pt-BR')}`}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {/* Activation Toggle */}
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={plan.is_active}
                              onCheckedChange={() => handleTogglePlan(plan.id, plan.is_active)}
                              disabled={togglePlanMutation.isPending}
                            />
                            <span className="text-xs text-muted-foreground">
                              {plan.is_active ? 'Ativo' : 'Inativo'}
                            </span>
                          </div>
                          
                          {/* Delete Button */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeletePlan(plan.id, plan.name)}
                            disabled={deletePlanMutation.isPending}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 p-2 bg-muted rounded border">
                        <Link className="h-4 w-4 text-muted-foreground" />
                        <code className="text-xs flex-1 break-all">{paymentLink}</code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(paymentLink, plan.id)}
                          className="h-8 w-8 p-0"
                          disabled={!plan.is_active}
                        >
                          {copiedLink === plan.id ? (
                            <Check className="h-3 w-3 text-green-600" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                      
                      {!plan.is_active && (
                        <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded border-amber-200">
                          ⚠️ Este plano está inativo. Links não funcionarão até ser reativado.
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
  );
}