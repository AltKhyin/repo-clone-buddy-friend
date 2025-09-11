// ABOUTME: V2.0 Payment Plans hook with complete CRUD operations and V1 isolation

import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { 
  PaymentPlanV2Row, 
  PaymentPlanV2Insert, 
  PaymentPlanV2FormData,
  UsePaymentPlansV2Result,
  ValidationError 
} from '@/types/paymentV2.types';

// =============================================================================
// VALIDATION FUNCTIONS
// =============================================================================

const validateFormData = (data: PaymentPlanV2FormData): ValidationError[] => {
  const errors: ValidationError[] = [];

  // Required field validation
  if (!data.name?.trim()) {
    errors.push({ field: 'name', message: 'Nome do plano é obrigatório' });
  }

  if (!data.baseAmount || data.baseAmount <= 0) {
    errors.push({ field: 'baseAmount', message: 'Valor base deve ser maior que zero' });
  }

  if (!data.durationDays || data.durationDays <= 0) {
    errors.push({ field: 'durationDays', message: 'Duração deve ser maior que zero' });
  }

  // Business logic validation
  if (data.name && data.name.length < 3) {
    errors.push({ field: 'name', message: 'Nome deve ter pelo menos 3 caracteres' });
  }

  if (data.baseAmount && data.baseAmount < 100) { // Minimum R$ 1.00
    errors.push({ field: 'baseAmount', message: 'Valor mínimo é R$ 1,00' });
  }

  if (data.durationDays && data.durationDays > 3650) { // Max 10 years
    errors.push({ field: 'durationDays', message: 'Duração máxima é 10 anos' });
  }

  // Configuration validation
  if (data.discountConfig?.enabled && data.discountConfig.type === 'percentage') {
    if (!data.discountConfig.percentage || data.discountConfig.percentage <= 0 || data.discountConfig.percentage > 1) {
      errors.push({ field: 'discountConfig.percentage', message: 'Desconto percentual deve estar entre 0% e 100%' });
    }
  }

  if (data.discountConfig?.enabled && data.discountConfig.type === 'fixed_amount') {
    if (!data.discountConfig.fixedAmount || data.discountConfig.fixedAmount <= 0) {
      errors.push({ field: 'discountConfig.fixedAmount', message: 'Valor do desconto deve ser maior que zero' });
    }
  }

  return errors;
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

const calculateFinalAmount = (baseAmount: number, discountConfig: PaymentPlanV2FormData['discountConfig']): number => {
  if (!discountConfig?.enabled) return baseAmount;

  switch (discountConfig.type) {
    case 'percentage':
      const discountPercent = discountConfig.percentage || 0;
      return Math.round(baseAmount * (1 - discountPercent));
      
    case 'fixed_amount':
      const discountAmount = discountConfig.fixedAmount || 0;
      return Math.max(100, baseAmount - discountAmount); // Minimum R$ 1.00
      
    default:
      return baseAmount;
  }
};

const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    .slice(0, 50);
};

const transformFormDataToInsert = (data: PaymentPlanV2FormData): PaymentPlanV2Insert => {
  const finalAmount = calculateFinalAmount(data.baseAmount, data.discountConfig);
  
  return {
    name: data.name,
    description: data.description || null,
    base_amount: data.baseAmount,
    final_amount: finalAmount,
    plan_type: data.planType,
    duration_days: data.durationDays,
    installment_config: data.installmentConfig,
    discount_config: data.discountConfig,
    pix_config: data.pixConfig,
    credit_card_config: data.creditCardConfig,
    is_active: data.isActive ?? true,
    slug: data.slug || generateSlug(data.name),
    custom_link_parameter: data.customLinkParameter || null
  };
};

const transformFormDataToUpdate = (data: Partial<PaymentPlanV2FormData>): any => {
  const updateData: any = {};
  
  // Map form fields to database column names
  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description || null;
  if (data.baseAmount !== undefined) updateData.base_amount = data.baseAmount;
  if (data.planType !== undefined) updateData.plan_type = data.planType;
  if (data.durationDays !== undefined) updateData.duration_days = data.durationDays;
  if (data.installmentConfig !== undefined) updateData.installment_config = data.installmentConfig;
  if (data.discountConfig !== undefined) updateData.discount_config = data.discountConfig;
  if (data.pixConfig !== undefined) updateData.pix_config = data.pixConfig;
  if (data.creditCardConfig !== undefined) updateData.credit_card_config = data.creditCardConfig;
  if (data.isActive !== undefined) updateData.is_active = data.isActive;
  if (data.customLinkParameter !== undefined) updateData.custom_link_parameter = data.customLinkParameter || null;
  
  // Always update timestamp
  updateData.updated_at = new Date().toISOString();
  
  return updateData;
};

// =============================================================================
// MAIN HOOK
// =============================================================================

export const usePaymentPlansV2 = (): UsePaymentPlansV2Result => {
  const queryClient = useQueryClient();
  
  // =============================================================================
  // QUERIES
  // =============================================================================
  
  const { 
    data: plans = [], 
    isLoading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: ['payment-plans-v2'],
    queryFn: async (): Promise<PaymentPlanV2Row[]> => {
      console.log('🔄 Fetching V2 payment plans...');
      
      const { data, error } = await supabase
        .from('paymentplansv2')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('❌ Error fetching V2 payment plans:', error);
        throw new Error(`Erro ao carregar planos V2: ${error.message}`);
      }
      
      console.log('✅ V2 payment plans loaded:', data?.length || 0);
      return data || [];
    },
    retry: (failureCount, error) => {
      return failureCount < 2 && !error.message.includes('permission');
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
    staleTime: 30000, // 30 seconds
  });

  // =============================================================================
  // MUTATIONS
  // =============================================================================

  const createPlanMutation = useMutation({
    mutationFn: async (formData: PaymentPlanV2FormData): Promise<PaymentPlanV2Row> => {
      console.log('🔄 Creating V2 payment plan:', formData);
      
      // Validate form data
      const validationErrors = validateFormData(formData);
      if (validationErrors.length > 0) {
        const errorMessage = validationErrors.map(e => e.message).join(', ');
        throw new Error(errorMessage);
      }
      
      // Transform and insert
      const insertData = transformFormDataToInsert(formData);
      
      const { data, error } = await supabase
        .from('paymentplansv2')
        .insert(insertData)
        .select()
        .single();
      
      if (error) {
        console.error('❌ Error creating V2 payment plan:', error);
        
        if (error.code === '23505') {
          throw new Error('Já existe um plano com este nome ou slug');
        }
        if (error.code === '23502') {
          throw new Error('Dados obrigatórios estão faltando');
        }
        
        throw new Error(`Erro ao criar plano: ${error.message}`);
      }
      
      console.log('✅ V2 payment plan created:', data.id);
      return data;
    },
    onSuccess: (newPlan) => {
      queryClient.invalidateQueries({ queryKey: ['payment-plans-v2'] });
      toast.success(`Plano "${newPlan.name}" criado com sucesso!`);
    },
    onError: (error: Error) => {
      console.error('💥 Plan creation failed:', error);
      toast.error(error.message || 'Erro ao criar plano');
    }
  });

  const updatePlanMutation = useMutation({
    mutationFn: async ({ 
      id, 
      updates 
    }: { 
      id: string; 
      updates: Partial<PaymentPlanV2FormData> 
    }): Promise<PaymentPlanV2Row> => {
      console.log('🔄 Updating V2 payment plan:', id, updates);
      
      // Transform form data to database column names
      let updateData = transformFormDataToUpdate(updates);
      
      // If updating core pricing fields, recalculate final_amount
      if (updates.baseAmount !== undefined || updates.discountConfig !== undefined) {
        const baseAmount = updates.baseAmount ?? 
          plans.find(p => p.id === id)?.base_amount ?? 0;
        const discountConfig = updates.discountConfig ?? 
          plans.find(p => p.id === id)?.discount_config;
        
        updateData.final_amount = calculateFinalAmount(baseAmount, discountConfig);
      }
      
      // Generate new slug if name changed
      if (updates.name) {
        updateData.slug = generateSlug(updates.name);
      }
      
      const { data, error } = await supabase
        .from('paymentplansv2')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('❌ Error updating V2 payment plan:', error);
        
        if (error.code === 'PGRST116') {
          throw new Error('Plano não encontrado');
        }
        
        throw new Error(`Erro ao atualizar plano: ${error.message}`);
      }
      
      console.log('✅ V2 payment plan updated:', data.id);
      return data;
    },
    onSuccess: (updatedPlan) => {
      queryClient.invalidateQueries({ queryKey: ['payment-plans-v2'] });
      toast.success(`Plano "${updatedPlan.name}" atualizado com sucesso!`);
    },
    onError: (error: Error) => {
      console.error('💥 Plan update failed:', error);
      toast.error(error.message || 'Erro ao atualizar plano');
    }
  });

  const deletePlanMutation = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      console.log('🔄 Deleting V2 payment plan:', id);
      
      const planToDelete = plans.find(p => p.id === id);
      
      const { error } = await supabase
        .from('paymentplansv2')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('❌ Error deleting V2 payment plan:', error);
        
        if (error.code === 'PGRST116') {
          throw new Error('Plano não encontrado');
        }
        if (error.code === '23503') {
          throw new Error('Este plano tem vendas associadas e não pode ser excluído');
        }
        
        throw new Error(`Erro ao excluir plano: ${error.message}`);
      }
      
      console.log('✅ V2 payment plan deleted:', id);
      return;
    },
    onSuccess: (_, planId) => {
      const deletedPlan = plans.find(p => p.id === planId);
      queryClient.invalidateQueries({ queryKey: ['payment-plans-v2'] });
      toast.success(`Plano "${deletedPlan?.name || 'Plano'}" excluído com sucesso!`);
    },
    onError: (error: Error) => {
      console.error('💥 Plan deletion failed:', error);
      toast.error(error.message || 'Erro ao excluir plano');
    }
  });

  const togglePlanMutation = useMutation({
    mutationFn: async ({ 
      id, 
      isActive 
    }: { 
      id: string; 
      isActive: boolean 
    }): Promise<PaymentPlanV2Row> => {
      console.log('🔄 Toggling V2 payment plan status:', id, isActive);
      
      const { data, error } = await supabase
        .from('paymentplansv2')
        .update({ 
          is_active: isActive, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('❌ Error toggling V2 payment plan:', error);
        throw new Error(`Erro ao alterar status: ${error.message}`);
      }
      
      console.log('✅ V2 payment plan status toggled:', data.id);
      return data;
    },
    onSuccess: (updatedPlan) => {
      queryClient.invalidateQueries({ queryKey: ['payment-plans-v2'] });
      toast.success(
        `Plano "${updatedPlan.name}" ${updatedPlan.is_active ? 'ativado' : 'desativado'} com sucesso!`
      );
    },
    onError: (error: Error) => {
      console.error('💥 Plan toggle failed:', error);
      toast.error(error.message || 'Erro ao alterar status do plano');
    }
  });

  // =============================================================================
  // COMPUTED VALUES
  // =============================================================================

  const activePlans = useMemo(() => {
    return plans.filter(plan => plan.is_active === true);
  }, [plans]);

  const getPlanById = (id: string): PaymentPlanV2Row | undefined => {
    return plans.find(plan => plan.id === id);
  };

  const getPlanBySlug = (slug: string): PaymentPlanV2Row | undefined => {
    return plans.find(plan => plan.slug === slug);
  };

  // =============================================================================
  // RETURN INTERFACE
  // =============================================================================

  return {
    // Data
    plans,
    activePlans,
    
    // Loading states
    isLoading,
    isCreating: createPlanMutation.isPending,
    isUpdating: updatePlanMutation.isPending,
    isDeleting: deletePlanMutation.isPending,
    
    // Error handling
    error,
    
    // Actions
    createPlan: createPlanMutation.mutateAsync,
    updatePlan: (id: string, data: Partial<PaymentPlanV2FormData>) => 
      updatePlanMutation.mutateAsync({ id, updates: data }),
    deletePlan: deletePlanMutation.mutateAsync,
    togglePlan: (id: string, isActive: boolean) => 
      togglePlanMutation.mutateAsync({ id, isActive }),
    
    // Utilities
    getPlanById,
    getPlanBySlug,
    refetch: () => refetch()
  };
};