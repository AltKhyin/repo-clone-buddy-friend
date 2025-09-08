// ABOUTME: Simple admin payment management page for creating custom payment plans and generating shareable links

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { CreditCard, Link, Copy, Check, ToggleLeft, ToggleRight, Trash2, RefreshCw, Settings, ChevronDown, ChevronUp, Clock, Eye, Save } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Database } from '@/integrations/supabase/types';
import { EnhancedPlanDisplay } from '@/components/payment/EnhancedPlanDisplay';
import { PromotionalConfigurationSection } from '@/components/payment/PromotionalConfigurationSection';
import { CustomerSupportSettingsCard } from '@/components/admin/CustomerSupportSettings';
import { sendTestWebhook } from '@/services/makeWebhookService';

type PaymentPlan = Database['public']['Tables']['PaymentPlans']['Row'];
type PaymentPlanInsert = Database['public']['Tables']['PaymentPlans']['Insert'];
type PaymentPlanUpdate = Database['public']['Tables']['PaymentPlans']['Update'];

export default function AdminPaymentManagement() {
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [pendingDefaultPlan, setPendingDefaultPlan] = useState<string>(''); // For save button functionality
  const [expandedPromotionalPlan, setExpandedPromotionalPlan] = useState<string | null>(null);
  const [promotionalConfigs, setPromotionalConfigs] = useState<Record<string, any>>({});
  const [displayConfigs, setDisplayConfigs] = useState<Record<string, any>>({});
  const [showPreview, setShowPreview] = useState<Record<string, boolean>>({});
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

  // Fetch payment plans with enhanced error handling
  const { data: plans = [], isLoading, isError: plansError, error: plansErrorData } = useQuery({
    queryKey: ['payment-plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('PaymentPlans')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Payment plans query error:', {
          error,
          timestamp: new Date().toISOString()
        });
        
        throw new Error(`Erro ao carregar planos de pagamento: ${error.message}`);
      }
      
      return data || [];
    },
    retry: (failureCount, error) => {
      // Retry up to 2 times on network errors
      return failureCount < 2 && !error.message.includes('permission');
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
  });

  // Create payment plan mutation with enhanced error handling
  const createPlanMutation = useMutation({
    mutationFn: async (planData: PaymentPlanInsert) => {
      const { data, error } = await supabase
        .from('PaymentPlans')
        .insert(planData)
        .select()
        .single();
      
      if (error) {
        // Enhanced error reporting
        console.error('Plan creation error:', {
          error,
          planData,
          timestamp: new Date().toISOString()
        });
        
        // Handle specific database errors
        if (error.code === '23505') {
          throw new Error('Um plano com este nome ou slug já existe. Escolha um nome diferente.');
        }
        if (error.code === '23502') {
          throw new Error('Campos obrigatórios estão faltando. Verifique todos os dados.');
        }
        if (error.message.includes('slug')) {
          throw new Error('Erro na criação do identificador único. Tente novamente com nome diferente.');
        }
        
        throw new Error(`Erro ao salvar plano: ${error.message}`);
      }
      
      return data;
    },
    onSuccess: (newPlan) => {
      queryClient.invalidateQueries({ queryKey: ['payment-plans'] });
      resetForm();
      toast.success(`Plano "${newPlan.name}" criado com sucesso!`);
    },
    onError: (error: Error) => {
      console.error('Plan creation failed:', error);
      toast.error(error.message || 'Erro desconhecido ao criar plano');
    }
  });

  // Toggle plan activation mutation with enhanced error handling
  const togglePlanMutation = useMutation({
    mutationFn: async ({ planId, isActive }: { planId: string; isActive: boolean }) => {
      // Check if trying to deactivate the default plan
      if (!isActive && defaultPlanSetting === planId) {
        throw new Error('Não é possível desativar o plano padrão. Primeiro defina outro plano como padrão.');
      }
      
      const { data, error } = await supabase
        .from('PaymentPlans')
        .update({ is_active: isActive, updated_at: new Date().toISOString() })
        .eq('id', planId)
        .select()
        .single();
      
      if (error) {
        console.error('Toggle plan error:', {
          error,
          planId,
          isActive,
          timestamp: new Date().toISOString()
        });
        
        if (error.code === 'PGRST116') {
          throw new Error('Plano não encontrado. Pode ter sido removido por outro administrador.');
        }
        
        throw new Error(`Erro na base de dados: ${error.message}`);
      }
      
      return data;
    },
    onSuccess: (updatedPlan) => {
      queryClient.invalidateQueries({ queryKey: ['payment-plans'] });
      toast.success(`Plano "${updatedPlan.name}" ${updatedPlan.is_active ? 'ativado' : 'desativado'} com sucesso!`);
    },
    onError: (error: Error) => {
      console.error('Plan toggle failed:', error);
      toast.error(error.message || 'Erro ao alterar status do plano');
    }
  });

  // Delete plan mutation with enhanced error handling
  const deletePlanMutation = useMutation({
    mutationFn: async (planId: string) => {
      // Prevent deletion of default plan
      if (defaultPlanSetting === planId) {
        throw new Error('Não é possível excluir o plano padrão. Primeiro defina outro plano como padrão.');
      }
      
      // Get plan name for better success message
      const planToDelete = plans.find(p => p.id === planId);
      
      const { error } = await supabase
        .from('PaymentPlans')
        .delete()
        .eq('id', planId);
      
      if (error) {
        console.error('Delete plan error:', {
          error,
          planId,
          planName: planToDelete?.name,
          timestamp: new Date().toISOString()
        });
        
        if (error.code === 'PGRST116') {
          throw new Error('Plano não encontrado. Pode ter sido removido por outro administrador.');
        }
        
        if (error.code === '23503') {
          throw new Error('Este plano tem vendas associadas e não pode ser excluído. Considere desativá-lo.');
        }
        
        throw new Error(`Erro ao excluir plano: ${error.message}`);
      }
      
      return planToDelete?.name || 'Plano';
    },
    onSuccess: (planName) => {
      queryClient.invalidateQueries({ queryKey: ['payment-plans'] });
      toast.success(`Plano "${planName}" excluído com sucesso!`);
    },
    onError: (error: Error) => {
      console.error('Plan deletion failed:', error);
      toast.error(error.message || 'Erro ao excluir plano');
    }
  });

  // Fetch default payment plan setting with enhanced error handling
  const { data: defaultPlanSetting, isError: defaultPlanError } = useQuery({
    queryKey: ['default-payment-plan'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('SiteSettings')
        .select('value')
        .eq('key', 'default_payment_plan_id')
        .single();
      
      if (error) {
        // Handle case where setting doesn't exist yet
        if (error.code === 'PGRST116') {
          console.log('No default payment plan configured yet');
          return '';
        }
        
        console.error('Error fetching default plan setting:', error);
        throw new Error(`Erro ao carregar configuração padrão: ${error.message}`);
      }
      
      // Handle empty string or null values
      if (!data?.value || data.value === '""' || data.value === '') {
        return '';
      }
      
      // Return as plain string (simplified format)
      return data.value as string;
    },
    retry: (failureCount, error) => {
      // Don't retry on expected "no setting" errors
      return failureCount < 2 && !error.message.includes('PGRST116');
    },
    staleTime: 5000, // Cache for 5 seconds to reduce API calls
  });

  // Sync pending state with current default plan when it loads
  useEffect(() => {
    if (defaultPlanSetting && !pendingDefaultPlan) {
      setPendingDefaultPlan(defaultPlanSetting);
    }
  }, [defaultPlanSetting, pendingDefaultPlan]);

  // Set default plan mutation (simple direct database approach)
  const setDefaultPlanMutation = useMutation({
    mutationFn: async (planId: string) => {
      console.log('🔄 Starting database update for planId:', planId);
      console.time('Database Update Duration');
      
      // Simple update operation
      const { data, error } = await supabase
        .from('SiteSettings')
        .update({ 
          value: planId,
          updated_at: new Date().toISOString()
        })
        .eq('key', 'default_payment_plan_id')
        .select()
        .single();
      
      console.timeEnd('Database Update Duration');
      
      if (error) {
        console.error('❌ Database update failed:', error);
        throw new Error(`Falha ao salvar: ${error.message}`);
      }
      
      console.log('✅ Database update successful:', data);
      
      // Get plan name for better UX
      const { data: planData } = await supabase
        .from('PaymentPlans')
        .select('name')
        .eq('id', planId)
        .single();
      
      return {
        planId,
        planName: planData?.name || 'Plano',
        updated: data
      };
    },
    // NO onMutate - no optimistic updates!
    onSuccess: (result) => {
      console.log('🎉 Mutation completed successfully:', result);
      
      // Only now update the cache after database confirmation
      queryClient.setQueryData(['default-payment-plan'], result.planId);
      
      // Invalidate related queries to ensure fresh data
      queryClient.invalidateQueries({ 
        queryKey: ['default-payment-plan-id'],
        exact: true 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['payment-plan'],
        type: 'all'
      });
      
      // Update pending state only after confirmed success
      setPendingDefaultPlan(result.planId);
      
      // Show success message with plan name for better UX
      toast.success(`✅ Plano padrão alterado para "${result.planName}" com sucesso!`);
      
      console.log('🔄 Cache updated and queries invalidated');
    },
    onError: (error: Error) => {
      console.error('💥 Mutation failed:', error.message);
      
      // Show specific error message
      toast.error(`❌ ${error.message}`);
      
      // Invalidate queries to ensure we have fresh server state
      queryClient.invalidateQueries({ queryKey: ['default-payment-plan'] });
      queryClient.invalidateQueries({ queryKey: ['default-payment-plan-id'] });
      queryClient.invalidateQueries({ queryKey: ['payment-plan'] });
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

  // Regenerate slug mutation
  const regenerateSlugMutation = useMutation({
    mutationFn: async (planId: string) => {
      const { data, error } = await supabase
        .from('PaymentPlans')
        .update({ 
          slug: null, // Trigger will auto-generate new slug
          updated_at: new Date().toISOString()
        })
        .eq('id', planId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-plans'] });
      toast.success('Slug regenerado com sucesso!');
    },
    onError: (error) => {
      console.error('Error regenerating slug:', error);
      toast.error('Erro ao regenerar slug');
    }
  });

  // Update promotional configuration mutation
  const updatePromotionalConfigMutation = useMutation({
    mutationFn: async ({ planId, promotionalConfig, displayConfig }: { 
      planId: string; 
      promotionalConfig?: any; 
      displayConfig?: any; 
    }) => {
      const updateData: any = {};
      if (promotionalConfig !== undefined) updateData.promotional_config = promotionalConfig;
      if (displayConfig !== undefined) updateData.display_config = displayConfig;
      
      const { data, error } = await supabase
        .from('PaymentPlans')
        .update(updateData)
        .eq('id', planId)
        .select()
        .single();
        
      if (error) throw error;
      return data;
    },
    onSuccess: (updatedPlan) => {
      queryClient.invalidateQueries({ queryKey: ['payment-plans'] });
      toast.success('Configuração promocional salva com sucesso!');
    },
    onError: (error) => {
      console.error('Error updating promotional config:', error);
      toast.error('Erro ao salvar configuração promocional');
    }
  });

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

  // Helper functions for default plan management
  const handleDefaultPlanChange = (planId: string) => {
    setPendingDefaultPlan(planId);
  };

  const handleSaveDefaultPlan = () => {
    if (pendingDefaultPlan && pendingDefaultPlan !== defaultPlanSetting) {
      setDefaultPlanMutation.mutate(pendingDefaultPlan);
    }
  };

  const isDefaultPlanChanged = pendingDefaultPlan !== defaultPlanSetting;

  // Helper functions for promotional configuration
  const initPromotionalConfig = (plan: PaymentPlan) => {
    if (!promotionalConfigs[plan.id]) {
      const config = {
        isActive: false,
        promotionValue: 0,
        displayAsPercentage: false,
        promotionalName: '',
        customMessage: '',
        showDiscountAmount: false,
        showSavingsAmount: false,
        showCountdownTimer: false,
        expiresAt: '',
        // Display customization (always available)
        customName: '',
        customDescription: '',
        titleColor: '#111827',
        descriptionColor: '#6B7280',
        borderColor: '#E5E7EB',
        backgroundColor: '',
        // Promotional features (discount-specific)
        timerColor: '#374151',
        discountTagBackgroundColor: '#111827',
        discountTagTextColor: '#FFFFFF',
        savingsColor: '#059669'
      };
      setPromotionalConfigs(prev => ({ ...prev, [plan.id]: config }));
      
      // Parse existing promotional config
      if (plan.promotional_config) {
        try {
          const existingConfig = typeof plan.promotional_config === 'string' 
            ? JSON.parse(plan.promotional_config) 
            : plan.promotional_config;
          setPromotionalConfigs(prev => ({ ...prev, [plan.id]: { ...config, ...existingConfig } }));
        } catch (e) {
          console.warn('Failed to parse promotional_config for plan', plan.id, e);
        }
      }
    }

    if (!displayConfigs[plan.id]) {
      const config = {
        showCustomName: false,
        showCustomDescription: false,
        showDiscountAmount: false,
        showSavingsAmount: false,
        showCountdownTimer: false
      };
      setDisplayConfigs(prev => ({ ...prev, [plan.id]: config }));
      
      // Parse existing display config
      if (plan.display_config) {
        try {
          const existingConfig = typeof plan.display_config === 'string' 
            ? JSON.parse(plan.display_config) 
            : plan.display_config;
          setDisplayConfigs(prev => ({ ...prev, [plan.id]: { ...config, ...existingConfig } }));
        } catch (e) {
          console.warn('Failed to parse display_config for plan', plan.id, e);
        }
      }
    }
  };

  const updatePromotionalConfig = (planId: string, key: string, value: any) => {
    setPromotionalConfigs(prev => ({
      ...prev,
      [planId]: { ...prev[planId], [key]: value }
    }));
  };

  const updateDisplayConfig = (planId: string, key: string, value: any) => {
    setDisplayConfigs(prev => ({
      ...prev,
      [planId]: { ...prev[planId], [key]: value }
    }));
  };

  const savePromotionalConfig = (planId: string) => {
    updatePromotionalConfigMutation.mutate({
      planId,
      promotionalConfig: promotionalConfigs[planId],
      displayConfig: displayConfigs[planId]
    });
  };

  const togglePreview = (planId: string) => {
    setShowPreview(prev => ({ ...prev, [planId]: !prev[planId] }));
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestão de Pagamentos</h1>
            <p className="text-muted-foreground mt-1">
              Crie, gerencie e monitore planos de pagamento personalizados
            </p>
          </div>
          <div className="text-sm text-muted-foreground">
              {plans.length > 0 && (
                <div className="text-right">
                  <div>{plans.filter(p => p.is_active).length} planos ativos</div>
                  <div>{plans.length} total</div>
                </div>
              )}
          </div>
        </div>
      </div>

        {/* Error States */}
        {(plansError || defaultPlanError) && (
          <div className="mb-6 space-y-3">
            {plansError && (
              <Card className="border-red-200 bg-red-50">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.232 15.5c-.77.833.192 2.5 1.732 2.5z"></path>
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-red-900">Erro ao carregar planos</h3>
                      <p className="text-sm text-red-700">
                        {plansErrorData?.message || 'Não foi possível carregar os planos de pagamento. Tente recarregar a página.'}
                      </p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.location.reload()}
                      className="border-red-300 text-red-700 hover:bg-red-100"
                    >
                      Recarregar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {defaultPlanError && (
              <Card className="border-orange-200 bg-orange-50">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.232 15.5c-.77.833.192 2.5 1.732 2.5z"></path>
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-orange-900">Aviso de configuração</h3>
                      <p className="text-sm text-orange-700">
                        Não foi possível carregar as configurações do plano padrão. O sistema continuará funcionando normalmente.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Main Content */}
        <div className="w-full space-y-6">
            
            {/* Create New Plan - Simplified & Focused */}
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <CreditCard className="h-5 w-5" />
                      Criar Novo Plano
                    </CardTitle>
                    <CardDescription className="mt-1">
                      Configure um plano de pagamento personalizado
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    Passo 1
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Essential Plan Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium">Nome do Plano *</Label>
                    <Input
                      id="name"
                      placeholder="Ex: Plano Premium 1 Ano"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="h-10"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="type" className="text-sm font-medium">Tipo do Plano</Label>
                    <Select 
                      value={formData.type} 
                      onValueChange={(value: 'one-time' | 'subscription') => 
                        setFormData(prev => ({ ...prev, type: value }))
                      }
                    >
                      <SelectTrigger className="h-10">
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
                  <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <h4 className="font-medium text-blue-900">Configurações de Recorrência</h4>
                    </div>
                
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

                {/* Pricing Section - More Prominent */}
                <div className="bg-gray-50 p-4 rounded-lg border">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <h4 className="font-medium text-gray-900">Preço & Duração</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="amount" className="text-sm font-medium">Valor (R$) *</Label>
                      <Input
                        id="amount"
                        type="text"
                        placeholder="R$ 99,90"
                        value={formData.amount}
                        onChange={handleAmountChange}
                        className="h-10 text-lg font-semibold"
                      />
                      <p className="text-xs text-muted-foreground">
                        Digite apenas números. Ex: 9990 = R$ 99,90
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="days" className="text-sm font-medium">Dias de Acesso *</Label>
                      <Input
                        id="days"
                        type="number"
                        placeholder="365"
                        value={formData.days}
                        onChange={(e) => setFormData(prev => ({ ...prev, days: e.target.value }))}
                        className="h-10"
                      />
                    </div>
                  </div>
                </div>

                {/* Optional Description */}
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-medium">Descrição (Opcional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Descrição opcional do plano..."
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="min-h-[80px] resize-none"
                  />
                </div>

                {/* Create Button */}
                <div className="flex justify-end pt-2">
                  <Button 
                    onClick={handleCreatePlan} 
                    disabled={createPlanMutation.isPending || !formData.name || !formData.amount || !formData.days}
                    className="px-8"
                    size="default"
                  >
                    {createPlanMutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Criando...
                      </>
                    ) : (
                      'Criar Plano'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Default Plan Settings - Simplified & Focused */}
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <ToggleRight className="h-5 w-5" />
                      Plano Padrão
                    </CardTitle>
                    <CardDescription className="mt-1">
                      Configure qual plano será usado por padrão em /pagamento
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    Passo 2
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Default Plan Selector with Save Button */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="default-plan" className="text-sm font-medium">Selecionar Plano Padrão</Label>
                    <div className="text-xs text-muted-foreground">
                      {plans.filter(p => p.is_active).length} planos ativos disponíveis
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <Select 
                      value={pendingDefaultPlan || ""} 
                      onValueChange={handleDefaultPlanChange}
                      disabled={plans.length === 0}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Selecione um plano padrão" />
                      </SelectTrigger>
                      <SelectContent>
                        {plans.filter(p => p.is_active).map((plan) => (
                          <SelectItem key={plan.id} value={plan.id}>
                            <div className="flex items-center justify-between w-full">
                              <span>{plan.name}</span>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground ml-2">
                                <span>R$ {(plan.amount / 100).toFixed(2)}</span>
                                <Badge variant={plan.type === 'subscription' ? 'default' : 'secondary'} className="text-xs">
                                  {plan.type === 'subscription' ? 'Sub' : 'Único'}
                                </Badge>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                        {plans.filter(p => !p.is_active).length > 0 && (
                          <>
                            <SelectItem disabled value="separator" className="text-xs text-muted-foreground">
                              ─── Planos Inativos ───
                            </SelectItem>
                            {plans.filter(p => !p.is_active).map((plan) => (
                              <SelectItem key={plan.id} value={plan.id} disabled>
                                <div className="flex items-center justify-between w-full opacity-50">
                                  <span>{plan.name}</span>
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground ml-2">
                                    <span>R$ {(plan.amount / 100).toFixed(2)}</span>
                                    <Badge variant="outline" className="text-xs">Inativo</Badge>
                                  </div>
                                </div>
                              </SelectItem>
                            ))}
                          </>
                        )}
                      </SelectContent>
                    </Select>
                    
                    {/* Save Button */}
                    <Button
                      onClick={handleSaveDefaultPlan}
                      disabled={!isDefaultPlanChanged || setDefaultPlanMutation.isPending || !pendingDefaultPlan}
                      variant={isDefaultPlanChanged ? "default" : "outline"}
                      className="shrink-0"
                    >
                      {setDefaultPlanMutation.isPending ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Salvando...
                        </>
                      ) : isDefaultPlanChanged ? (
                        'Salvar'
                      ) : (
                        'Salvo'
                      )}
                    </Button>
                  </div>
                  
                  {!isDefaultPlanChanged && defaultPlanSetting && (
                    <p className="text-xs text-muted-foreground">
                      ✓ Plano padrão configurado. Clientes verão este plano em /pagamento
                    </p>
                  )}
                  
                  {isDefaultPlanChanged && (
                    <p className="text-xs text-amber-600">
                      ⚠️ Alterações não salvas. Clique em "Salvar" para aplicar.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Customer Support Settings - Step 3 */}
            <CustomerSupportSettingsCard />

            {/* Webhook Testing - Step 4 */}
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Settings className="h-5 w-5" />
                      Webhook Testing
                    </CardTitle>
                    <CardDescription className="mt-1">
                      Teste a integração com aplicativos externos usando dados reais
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    Passo 4
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-1">
                      <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-blue-900">Teste de Integração</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        Este botão simula um pagamento bem-sucedido e envia todos os dados para Make.com, 
                        permitindo que você configure suas integrações externas com dados reais.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-center">
                  <Button
                    onClick={async () => {
                      try {
                        toast.loading('Enviando webhook de teste...', { id: 'webhook-test' });
                        const result = await sendTestWebhook();
                        
                        if (result.success) {
                          toast.success('Webhook de teste enviado com sucesso!', { id: 'webhook-test' });
                          console.log('Test webhook result:', result);
                        } else {
                          toast.error(`Erro ao enviar webhook: ${result.error}`, { id: 'webhook-test' });
                          console.error('Test webhook failed:', result.error);
                        }
                      } catch (error) {
                        toast.error('Erro inesperado ao enviar webhook', { id: 'webhook-test' });
                        console.error('Unexpected webhook error:', error);
                      }
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
                    size="default"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Enviar Webhook de Teste
                  </Button>
                </div>
                
                <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded-lg">
                  <p className="font-medium mb-1">O que este teste envia:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Dados completos de usuário autenticado</li>
                    <li>Informações de assinatura e preferências</li>
                    <li>Dados simulados de transação (PIX)</li>
                    <li>Métricas de engajamento e perfil</li>
                    <li>Timestamp e identificadores únicos</li>
                  </ul>
                  <p className="mt-2 text-gray-500">
                    URL de destino: <code className="bg-white px-1 rounded">https://hook.us2.make.com/qjdetduht1g375p7l556yrrutbi3j6cv</code>
                  </p>
                </div>
              </CardContent>
            </Card>

        {/* Full Width Plans List Section */}
        <Card className="mt-8">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">Todos os Planos</CardTitle>
                <CardDescription className="mt-1">
                  Gerencie e monitore todos os planos de pagamento criados
                </CardDescription>
              </div>
              {plans.length > 0 && (
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span>{plans.filter(p => p.is_active).length} Ativos</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                    <span>{plans.filter(p => !p.is_active).length} Inativos</span>
                  </div>
                </div>
              )}
            </div>
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
                    <div key={plan.id} className={`border rounded-lg transition-all hover:shadow-sm ${!plan.is_active ? 'opacity-70 bg-gray-50' : 'bg-white'}`}>
                      {/* Plan Header */}
                      <div className="p-4 border-b border-gray-100">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <h3 className="font-semibold text-lg">{plan.name}</h3>
                              <div className="flex items-center gap-2">
                                <Badge variant={plan.type === 'subscription' ? 'default' : 'secondary'} className="text-xs">
                                  {plan.type === 'subscription' ? 'Recorrente' : 'Único'}
                                </Badge>
                                {!plan.is_active && (
                                  <Badge variant="destructive" className="text-xs">Inativo</Badge>
                                )}
                                {defaultPlanSetting === plan.id && (
                                  <Badge variant="outline" className="text-xs bg-green-50 border-green-200 text-green-700">
                                    Padrão
                                  </Badge>
                                )}
                              </div>
                            </div>
                            
                            {plan.description && (
                              <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
                            )}
                            
                            <div className="flex items-center gap-6 text-sm text-muted-foreground mt-2">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-lg text-gray-900">R$ {(plan.amount / 100).toFixed(2)}</span>
                                <span>•</span>
                                <span>{plan.days} dias</span>
                              </div>
                              {billingInfo && (
                                <>
                                  <span>•</span>
                                  <span>{billingInfo}</span>
                                </>
                              )}
                              {plan.usage_count > 0 && (
                                <>
                                  <span>•</span>
                                  <span className="text-green-600">{plan.usage_count} vendas</span>
                                </>
                              )}
                            </div>
                          </div>
                          
                          {/* Plan Actions */}
                          <div className="flex items-center gap-3">
                            {/* Active Toggle */}
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={plan.is_active}
                                onCheckedChange={() => handleTogglePlan(plan.id, plan.is_active)}
                                disabled={togglePlanMutation.isPending}
                                size="sm"
                              />
                              <span className="text-xs text-muted-foreground">
                                {plan.is_active ? 'Ativo' : 'Inativo'}
                              </span>
                            </div>
                            
                            {/* Secondary Actions */}
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => regenerateSlugMutation.mutate(plan.id)}
                                disabled={regenerateSlugMutation.isPending}
                                className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                title="Regenerar URL amigável"
                              >
                                <RefreshCw className="h-3 w-3" />
                              </Button>
                              
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeletePlan(plan.id, plan.name)}
                                disabled={deletePlanMutation.isPending}
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                title="Excluir plano"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Plan Details */}
                      <div className="p-4 space-y-3">
                        {/* Link Copy Section */}
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <Link className="h-4 w-4 text-gray-500" />
                            <span className="text-sm font-medium text-gray-700">Link de Pagamento</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <code className="text-xs flex-1 break-all bg-white p-2 rounded border font-mono">
                              {paymentLink}
                            </code>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyToClipboard(paymentLink, plan.id)}
                              className="shrink-0"
                              disabled={!plan.is_active}
                            >
                              {copiedLink === plan.id ? (
                                <>
                                  <Check className="h-3 w-3 text-green-600 mr-1" />
                                  Copiado
                                </>
                              ) : (
                                <>
                                  <Copy className="h-3 w-3 mr-1" />
                                  Copiar
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                        
                        {/* Promotional Configuration Section */}
                        <PromotionalConfigurationSection 
                          plan={plan}
                          expandedPromotionalPlan={expandedPromotionalPlan}
                          setExpandedPromotionalPlan={setExpandedPromotionalPlan}
                          promotionalConfigs={promotionalConfigs}
                          displayConfigs={displayConfigs}
                          showPreview={showPreview}
                          initPromotionalConfig={initPromotionalConfig}
                          updatePromotionalConfig={updatePromotionalConfig}
                          updateDisplayConfig={updateDisplayConfig}
                          savePromotionalConfig={savePromotionalConfig}
                          togglePreview={togglePreview}
                          updatePromotionalConfigMutation={updatePromotionalConfigMutation}
                        />
                        
                        {/* Additional Info */}
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Criado em {new Date(plan.created_at).toLocaleDateString('pt-BR')}</span>
                          {plan.last_used_at && (
                            <span>Último uso: {new Date(plan.last_used_at).toLocaleDateString('pt-BR')}</span>
                          )}
                        </div>
                        
                        {/* Inactive Warning */}
                        {!plan.is_active && (
                          <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded border-amber-200">
                            ⚠️ Este plano está inativo. Links não funcionarão até ser reativado.
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
        </div>
    </div>
  );
}