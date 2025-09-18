// ABOUTME: Enhanced V2 Payment Plans admin page with real-time pricing preview and advanced UI

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  CreditCard,
  Trash2,
  Edit3,
  Plus,
  AlertTriangle,
  TrendingUp,
  Eye,
  BarChart,
  Building
} from 'lucide-react';
import { toast } from 'sonner';
import { usePaymentPlansV2 } from '@/hooks/usePaymentPlansV2';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import PaymentPlanV2Form from '@/components/payment-v2/PaymentPlanV2Form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { PaymentPlanV2FormData, PaymentPlanV2Row } from '@/types/paymentV2.types';
import { InstitutionalRequestsTab } from '@/components/admin/InstitutionalRequestsTab';

export default function AdminPaymentV2Management() {
  const {
    plans,
    activePlans,
    isLoading,
    isCreating,
    isUpdating,
    isDeleting,
    error,
    createPlan,
    updatePlan,
    deletePlan,
    togglePlan,
  } = usePaymentPlansV2();

  const siteSettings = useSiteSettings();

  const [activeTab, setActiveTab] = useState<'overview' | 'create' | 'edit' | 'institutional-requests'>('overview');
  const [editingPlan, setEditingPlan] = useState<PaymentPlanV2Row | null>(null);

  // Handle form submission
  const handleFormSubmit = async (data: PaymentPlanV2FormData) => {
    try {
      if (editingPlan) {
        await updatePlan(editingPlan.id, data);
      } else {
        await createPlan(data);
      }
      
      // Reset form state
      setEditingPlan(null);
      setActiveTab('overview');
    } catch (error) {
      // Error handling is done in the hook
      console.error('Form submission error:', error);
    }
  };

  // Handle form cancel
  const handleFormCancel = () => {
    setEditingPlan(null);
    setActiveTab('overview');
  };

  // Handle edit click
  const handleEdit = (plan: PaymentPlanV2Row) => {
    setEditingPlan(plan);
    setActiveTab('edit');
  };

  // Handle delete
  const handleDelete = async (plan: PaymentPlanV2Row) => {
    if (window.confirm(`Tem certeza que deseja excluir o plano "${plan.name}"?`)) {
      try {
        await deletePlan(plan.id);
      } catch (error) {
        // Error handling is done in the hook
      }
    }
  };

  // Handle toggle
  const handleToggle = async (plan: PaymentPlanV2Row) => {
    try {
      await togglePlan(plan.id, !plan.is_active);
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  // Format currency
  const formatCurrency = (amountInCents: number): string => {
    return (amountInCents / 100).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };


  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Gestão de Pagamentos V2.0
            </h1>
            <p className="text-muted-foreground mt-1">
              Sistema isolado com cálculo de desconto pré-requisição
            </p>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50 mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <h3 className="font-medium text-red-900">Erro no Sistema</h3>
                <p className="text-sm text-red-700">{error.message}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)}>
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart className="h-4 w-4" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="create" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Criar Plano
          </TabsTrigger>
          <TabsTrigger value="institutional-requests" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            Requisições de planos
          </TabsTrigger>
          {editingPlan && (
            <TabsTrigger value="edit" className="flex items-center gap-2">
              <Edit3 className="h-4 w-4" />
              Editar Plano
            </TabsTrigger>
          )}
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          
          {/* Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total de Planos</p>
                    <p className="text-2xl font-bold">{plans.length}</p>
                  </div>
                  <CreditCard className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Planos Ativos</p>
                    <p className="text-2xl font-bold text-green-600">{activePlans.length}</p>
                  </div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total de Vendas</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {plans.reduce((sum, plan) => sum + (plan.usage_count || 0), 0)}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Sistema</p>
                    <p className="text-sm font-bold text-blue-600">V2.0 Isolado</p>
                  </div>
                  <Badge variant="outline" className="text-blue-600">ATIVO</Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Default Offer Configuration */}
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="text-orange-900 flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Configurar Oferta Padrão
              </CardTitle>
              <CardDescription className="text-orange-700">
                Selecione qual plano será exibido por padrão na página /pagamento quando não houver parâmetros na URL
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-orange-900 mb-2">
                    Plano padrão para /pagamento
                  </label>
                  <Select
                    value={siteSettings.getSetting('default_payment_offer', null) || '__none__'}
                    onValueChange={(value) => {
                      const actualValue = value === '__none__' ? null : value;
                      siteSettings.updateSetting({
                        key: 'default_payment_offer',
                        value: actualValue,
                        description: 'Default payment plan custom_link_parameter shown on /pagamento when no URL parameters are provided'
                      });
                    }}
                    disabled={siteSettings.isUpdating}
                  >
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Selecionar plano padrão" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Nenhum (sem plano padrão)</SelectItem>
                      {activePlans
                        .filter((plan) => plan.custom_link_parameter && plan.custom_link_parameter.trim() !== '')
                        .map((plan) => (
                        <SelectItem 
                          key={plan.id} 
                          value={plan.custom_link_parameter!}
                        >
                          {plan.name} - {formatCurrency(plan.final_amount)}
                          {` (${plan.custom_link_parameter})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="text-sm text-orange-700">
                  <div className="bg-white p-3 rounded border border-orange-200">
                    <strong>Atual:</strong> {siteSettings.getSetting('default_payment_offer', null) || 'Nenhum'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-6">
            
            {/* Plans List */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Planos V2.0 Criados</span>
                    <Button 
                      onClick={() => setActiveTab('create')}
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Novo
                    </Button>
                  </CardTitle>
                  <CardDescription>
                    Lista de todos os planos no sistema V2.0 (isolado do V1)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                      <p>Carregando planos V2...</p>
                    </div>
                  ) : plans.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Nenhum plano V2 criado ainda</p>
                      <Button 
                        onClick={() => setActiveTab('create')}
                        variant="outline" 
                        className="mt-3"
                      >
                        Criar Primeiro Plano
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {plans.map((plan) => (
                        <div 
                          key={plan.id} 
                          className={`border rounded-lg p-4 transition-all ${
                            !plan.is_active ? 'opacity-70 bg-gray-50' : 'bg-white hover:shadow-sm'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="font-semibold text-lg">{plan.name}</h3>
                                <Badge variant={plan.plan_type === 'premium' ? 'default' : 'secondary'}>
                                  {plan.plan_type}
                                </Badge>
                                {!plan.is_active && (
                                  <Badge variant="destructive">Inativo</Badge>
                                )}
                              </div>
                              
                              {plan.description && (
                                <p className="text-sm text-muted-foreground mb-2">{plan.description}</p>
                              )}
                              
                              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-lg text-gray-900">
                                    {formatCurrency(plan.base_amount)}
                                  </span>
                                  {plan.final_amount !== plan.base_amount && (
                                    <span className="text-green-600">
                                      → {formatCurrency(plan.final_amount)}
                                    </span>
                                  )}
                                </div>
                                <span>•</span>
                                <span>{plan.duration_days} dias</span>
                                {plan.usage_count && plan.usage_count > 0 && (
                                  <>
                                    <span>•</span>
                                    <span className="text-green-600">{plan.usage_count} vendas</span>
                                  </>
                                )}
                              </div>
                            </div>
                            
                            {/* Actions */}
                            <div className="flex items-center gap-2">
                              {/* Active Toggle */}
                              <div className="flex items-center gap-1">
                                <Switch
                                  checked={plan.is_active || false}
                                  onCheckedChange={() => handleToggle(plan)}
                                  disabled={isUpdating}
                                  size="sm"
                                />
                              </div>
                              
                              {/* Edit Button */}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(plan)}
                                className="h-8 w-8 p-0"
                                title="Editar plano"
                              >
                                <Edit3 className="h-3 w-3" />
                              </Button>
                              
                              {/* Delete Button */}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(plan)}
                                disabled={isDeleting}
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                title="Excluir plano"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          
                          {/* Plan Details */}
                          <div className="mt-3 pt-3 border-t border-gray-100">
                            <div className="text-xs text-muted-foreground flex justify-between">
                              <span>Slug: {plan.slug || 'N/A'}</span>
                              <span>Criado em: {new Date(plan.created_at || '').toLocaleDateString('pt-BR')}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

          </div>
        </TabsContent>

        {/* Create Tab */}
        <TabsContent value="create">
          <PaymentPlanV2Form
            mode="create"
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
            isSubmitting={isCreating}
          />
        </TabsContent>

        {/* Institutional Requests Tab */}
        <TabsContent value="institutional-requests">
          <InstitutionalRequestsTab />
        </TabsContent>

        {/* Edit Tab */}
        <TabsContent value="edit">
          {editingPlan && (
            <PaymentPlanV2Form
              mode="edit"
              initialData={editingPlan}
              onSubmit={handleFormSubmit}
              onCancel={handleFormCancel}
              isSubmitting={isUpdating}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}