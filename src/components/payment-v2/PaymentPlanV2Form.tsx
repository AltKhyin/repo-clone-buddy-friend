// ABOUTME: Advanced V2 Payment Plan form component with real-time pricing preview and comprehensive configuration

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CreditCard, 
  Percent, 
  Calculator, 
  AlertTriangle, 
  CheckCircle,
  TrendingDown,
  Clock,
  Zap
} from 'lucide-react';
import { usePaymentPricingV2 } from '@/hooks/usePaymentPricingV2';
import { PromotionalConfigurationSectionV2 } from './PromotionalConfigurationSectionV2';
import { EnhancedPlanDisplayV2 } from './EnhancedPlanDisplayV2';
import type { 
  PaymentPlanV2FormData, 
  PaymentPlanV2Row, 
  DiscountConfigV2,
  InstallmentConfigV2,
  PromotionalConfigV2,
  DisplayConfigV2
} from '@/types/paymentV2.types';

// =============================================================================
// COMPONENT PROPS
// =============================================================================

interface PaymentPlanV2FormProps {
  initialData?: PaymentPlanV2Row | null;
  onSubmit: (data: PaymentPlanV2FormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
  mode: 'create' | 'edit';
}

// =============================================================================
// DEFAULT VALUES
// =============================================================================

const getDefaultFormData = (): PaymentPlanV2FormData => ({
  name: '',
  description: '',
  planType: 'premium',
  durationDays: 365,
  baseAmount: 1990, // R$ 19.90
  installmentConfig: {
    enabled: true,
    options: [
      { installments: 1, feeRate: 0.0299 },
      { installments: 3, feeRate: 0.0699 },
      { installments: 6, feeRate: 0.0999 },
      { installments: 12, feeRate: 0.1499 }
    ]
  },
  discountConfig: {
    enabled: false,
    type: 'percentage'
  },
  pixConfig: {
    enabled: true,
    expirationMinutes: 60,
    baseFeeRate: 0.014, // 1.4% PIX processing fee
    discountPercentage: 0.05 // 5% PIX discount
  },
  creditCardConfig: {
    enabled: true,
    requireCvv: true
  },
  promotionalConfig: {
    isActive: false,
    promotionValue: 0,
    displayAsPercentage: false,
    showDiscountAmount: true,
    showSavingsAmount: true,
    showCountdownTimer: false,
    titleColor: '#111827',
    descriptionColor: '#6B7280',
    borderColor: '#E5E7EB',
    timerColor: '#374151',
    discountTagBackgroundColor: '#111827',
    discountTagTextColor: '#FFFFFF',
    savingsColor: '#059669'
  },
  displayConfig: {
    customName: '',
    customDescription: '',
    showCustomName: false,
    showCustomDescription: false,
    showDiscountAmount: true,
    showSavingsAmount: true,
    showCountdownTimer: false
  },
  customLinkParameter: ''
});

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function PaymentPlanV2Form({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
  mode
}: PaymentPlanV2FormProps) {
  const [formData, setFormData] = useState<PaymentPlanV2FormData>(() => {
    if (initialData) {
      return {
        name: initialData.name,
        description: initialData.description || '',
        planType: initialData.plan_type as 'premium' | 'basic' | 'custom',
        durationDays: initialData.duration_days || 365,
        baseAmount: initialData.base_amount,
        installmentConfig: (initialData.installment_config as InstallmentConfigV2) || getDefaultFormData().installmentConfig,
        discountConfig: (initialData.discount_config as DiscountConfigV2) || getDefaultFormData().discountConfig,
        pixConfig: (initialData.pix_config as any) || getDefaultFormData().pixConfig,
        creditCardConfig: (initialData.credit_card_config as any) || getDefaultFormData().creditCardConfig,
        promotionalConfig: (initialData.promotional_config as PromotionalConfigV2) || getDefaultFormData().promotionalConfig,
        displayConfig: (initialData.display_config as DisplayConfigV2) || getDefaultFormData().displayConfig,
        customLinkParameter: (initialData as any)?.custom_link_parameter || ''
      };
    }
    return getDefaultFormData();
  });

  // Create a mock plan for pricing preview
  const previewPlan: PaymentPlanV2Row = useMemo(() => ({
    id: 'preview',
    name: formData.name || 'Preview Plan',
    description: formData.description,
    base_amount: formData.baseAmount,
    final_amount: formData.baseAmount,
    plan_type: formData.planType,
    duration_days: formData.durationDays,
    installment_config: formData.installmentConfig,
    discount_config: formData.discountConfig,
    pix_config: formData.pixConfig,
    credit_card_config: formData.creditCardConfig,
    promotional_config: formData.promotionalConfig,
    display_config: formData.displayConfig,
    is_active: true,
    slug: null,
    usage_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    created_by: null
  }), [formData]);

  // Use pricing hook for real-time calculations
  const { pricing, isValid, validationErrors, formatCurrency, formatPercentage } = usePaymentPricingV2({
    plan: previewPlan,
    autoCalculate: true
  });

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isValid) {
      alert('Por favor, corrija os erros antes de continuar.');
      return;
    }
    
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  // Update discount configuration
  const updateDiscountConfig = (updates: Partial<DiscountConfigV2>) => {
    setFormData(prev => ({
      ...prev,
      discountConfig: {
        ...prev.discountConfig,
        ...updates
      }
    }));
  };

  // Update installment configuration
  const updateInstallmentConfig = (updates: Partial<InstallmentConfigV2>) => {
    setFormData(prev => ({
      ...prev,
      installmentConfig: {
        ...prev.installmentConfig,
        ...updates
      }
    }));
  };

  // Update PIX configuration
  const updatePixConfig = (updates: any) => {
    setFormData(prev => ({
      ...prev,
      pixConfig: {
        ...prev.pixConfig,
        ...updates
      }
    }));
  };

  // Update promotional configuration
  const updatePromotionalConfig = (updates: Partial<PromotionalConfigV2>) => {
    setFormData(prev => ({
      ...prev,
      promotionalConfig: {
        ...prev.promotionalConfig,
        ...updates
      }
    }));
  };

  // Update display configuration
  const updateDisplayConfig = (updates: Partial<DisplayConfigV2>) => {
    setFormData(prev => ({
      ...prev,
      displayConfig: {
        ...prev.displayConfig,
        ...updates
      }
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            {mode === 'create' ? 'Criar Novo Plano V2.0' : 'Editar Plano V2.0'}
          </CardTitle>
          <CardDescription>
            Configure um plano de pagamento com cálculo de desconto pré-requisição
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form Section */}
        <div className="space-y-6">
          
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informações Básicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nome do Plano *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Premium V2 Anual"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="planType">Tipo do Plano</Label>
                  <Select 
                    value={formData.planType} 
                    onValueChange={(value: 'premium' | 'basic' | 'custom') => 
                      setFormData(prev => ({ ...prev, planType: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="premium">Premium</SelectItem>
                      <SelectItem value="basic">Básico</SelectItem>
                      <SelectItem value="custom">Personalizado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="baseAmount">Valor Base (centavos) *</Label>
                  <Input
                    id="baseAmount"
                    type="number"
                    value={formData.baseAmount}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      baseAmount: parseInt(e.target.value) || 0 
                    }))}
                    placeholder="1990"
                    required
                    min="100"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Valor atual: {formatCurrency(formData.baseAmount)}
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="durationDays">Duração (dias) *</Label>
                  <Input
                    id="durationDays"
                    type="number"
                    value={formData.durationDays}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      durationDays: parseInt(e.target.value) || 0 
                    }))}
                    placeholder="365"
                    required
                    min="1"
                    max="3650"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descrição opcional do plano..."
                  rows={3}
                />
              </div>
              
              {/* Custom Link Parameter */}
              <div>
                <Label htmlFor="customLinkParameter">Parâmetro Personalizado do Link</Label>
                <Input
                  id="customLinkParameter"
                  value={formData.customLinkParameter}
                  onChange={(e) => setFormData(prev => ({ ...prev, customLinkParameter: e.target.value }))}
                  placeholder="premium-20-off"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {formData.customLinkParameter ? (
                    <>Link gerado: <code className="bg-gray-100 px-1 rounded text-xs">/pagamento-v2?plano={formData.customLinkParameter}</code></>
                  ) : (
                    'Digite um valor personalizado como "premium-20-off" para criar links diretos'
                  )}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Discount Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Percent className="h-4 w-4" />
                Configuração de Desconto
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Habilitar Desconto</Label>
                  <p className="text-sm text-muted-foreground">
                    Aplicar desconto antes do envio para Pagar.me
                  </p>
                </div>
                <Switch
                  checked={formData.discountConfig.enabled}
                  onCheckedChange={(enabled) => updateDiscountConfig({ enabled })}
                />
              </div>

              {formData.discountConfig.enabled && (
                <div className="space-y-4">
                  <div>
                    <Label>Tipo de Desconto</Label>
                    <Select 
                      value={formData.discountConfig.type} 
                      onValueChange={(value: 'percentage' | 'fixed_amount') => 
                        updateDiscountConfig({ type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Percentual</SelectItem>
                        <SelectItem value="fixed_amount">Valor Fixo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.discountConfig.type === 'percentage' && (
                    <div>
                      <Label htmlFor="discountPercentage">Percentual de Desconto (%)</Label>
                      <Input
                        id="discountPercentage"
                        type="number"
                        value={(formData.discountConfig.percentage || 0) * 100}
                        onChange={(e) => updateDiscountConfig({ 
                          percentage: (parseFloat(e.target.value) || 0) / 100 
                        })}
                        placeholder="20"
                        min="0"
                        max="100"
                        step="0.1"
                      />
                    </div>
                  )}

                  {formData.discountConfig.type === 'fixed_amount' && (
                    <div>
                      <Label htmlFor="discountAmount">Valor do Desconto (centavos)</Label>
                      <Input
                        id="discountAmount"
                        type="number"
                        value={formData.discountConfig.fixedAmount || 0}
                        onChange={(e) => updateDiscountConfig({ 
                          fixedAmount: parseInt(e.target.value) || 0 
                        })}
                        placeholder="200"
                        min="0"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Valor do desconto: {formatCurrency(formData.discountConfig.fixedAmount || 0)}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* PIX Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Configuração PIX
              </CardTitle>
              <CardDescription>
                Configure taxas e descontos específicos para pagamento PIX
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Habilitar PIX</Label>
                  <p className="text-sm text-muted-foreground">
                    Pagamento instantâneo via PIX
                  </p>
                </div>
                <Switch
                  checked={formData.pixConfig.enabled}
                  onCheckedChange={(enabled) => updatePixConfig({ enabled })}
                />
              </div>

              {formData.pixConfig.enabled && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="pixBaseFee">Taxa Base PIX (%)</Label>
                      <Input
                        id="pixBaseFee"
                        type="number"
                        value={((formData.pixConfig.baseFeeRate || 0.014) * 100).toFixed(2)}
                        onChange={(e) => updatePixConfig({ 
                          baseFeeRate: (parseFloat(e.target.value) || 0) / 100 
                        })}
                        placeholder="1.40"
                        min="0"
                        max="10"
                        step="0.01"
                        className="text-center"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Taxa de processamento base do PIX (padrão: 1.4%)
                      </p>
                    </div>
                    
                    <div>
                      <Label htmlFor="pixDiscount">Desconto PIX (%)</Label>
                      <Input
                        id="pixDiscount"
                        type="number"
                        value={((formData.pixConfig.discountPercentage || 0) * 100).toFixed(1)}
                        onChange={(e) => updatePixConfig({ 
                          discountPercentage: (parseFloat(e.target.value) || 0) / 100 
                        })}
                        placeholder="5.0"
                        min="0"
                        max="15"
                        step="0.1"
                        className="text-center"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Desconto adicional para incentivar pagamento PIX
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="pixTargetValue">Valor alvo PIX (R$)</Label>
                      <Input
                        id="pixTargetValue"
                        type="number"
                        placeholder="18.50"
                        onChange={(e) => {
                          const targetValue = parseFloat(e.target.value) || 0;
                          if (targetValue > 0) {
                            // Reverse calculation for PIX
                            // target = baseAmount * (1 + baseFeeRate) * (1 - discountPercentage)
                            // Assuming we want to adjust discountPercentage to reach target
                            const targetCents = Math.round(targetValue * 100);
                            const baseAmount = pricing?.baseAmount || formData.baseAmount;
                            const baseFeeRate = formData.pixConfig.baseFeeRate || 0.014;
                            const amountWithBaseFee = baseAmount * (1 + baseFeeRate);
                            
                            // discountPercentage = 1 - (target / amountWithBaseFee)
                            const newDiscountPercentage = Math.max(0, Math.min(0.15, 1 - (targetCents / amountWithBaseFee)));
                            
                            updatePixConfig({ 
                              discountPercentage: newDiscountPercentage
                            });
                          }
                        }}
                        step="0.01"
                        className="text-center"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Digite o valor final desejado para PIX
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="pixExpiration">Expiração (minutos)</Label>
                      <Input
                        id="pixExpiration"
                        type="number"
                        value={formData.pixConfig.expirationMinutes || 60}
                        onChange={(e) => updatePixConfig({ 
                          expirationMinutes: parseInt(e.target.value) || 60 
                        })}
                        placeholder="60"
                        min="5"
                        max="1440"
                        className="text-center"
                      />
                    </div>
                  </div>

                  {/* PIX Result Preview */}
                  {pricing && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-green-800">PIX Final:</span>
                        <span className="text-lg font-bold text-green-600">
                          {formatCurrency(pricing.pixFinalAmount)}
                        </span>
                      </div>
                      <div className="text-xs text-green-600 mt-1 space-y-1">
                        <div>Base: {formatCurrency(formData.baseAmount)}</div>
                        <div>Taxa base ({((formData.pixConfig.baseFeeRate || 0.014) * 100).toFixed(2)}%): +{formatCurrency(Math.round(formData.baseAmount * (formData.pixConfig.baseFeeRate || 0.014)))}</div>
                        {pricing.pixDiscount.amount > 0 && (
                          <div>Desconto ({((formData.pixConfig.discountPercentage || 0) * 100).toFixed(1)}%): -{formatCurrency(pricing.pixDiscount.amount)}</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Installment Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                Configuração de Parcelamento
              </CardTitle>
              <CardDescription>
                Customize as taxas para cada opção de parcelamento ou use o cálculo reverso
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Habilitar Parcelamento</Label>
                  <p className="text-sm text-muted-foreground">
                    Permitir pagamento parcelado no cartão de crédito
                  </p>
                </div>
                <Switch
                  checked={formData.installmentConfig.enabled}
                  onCheckedChange={(enabled) => updateInstallmentConfig({ enabled })}
                />
              </div>

              {formData.installmentConfig.enabled && (
                <div className="space-y-4">
                  <Alert>
                    <Calculator className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Cálculo Reverso:</strong> Digite o valor desejado no campo "Valor alvo" de qualquer parcela e os outros campos serão calculados automaticamente.
                    </AlertDescription>
                  </Alert>

                  {formData.installmentConfig.options?.map((option, index) => (
                    <div key={option.installments} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-base font-medium">
                          {option.installments === 1 ? 'À vista' : `${option.installments}x`}
                        </Label>
                        <Badge variant="outline">
                          Taxa atual: {(option.feeRate * 100).toFixed(2)}%
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Fee Rate Input */}
                        <div>
                          <Label htmlFor={`fee-${option.installments}`}>Taxa (%)</Label>
                          <Input
                            id={`fee-${option.installments}`}
                            type="number"
                            value={(option.feeRate * 100).toFixed(2)}
                            onChange={(e) => {
                              const newFeeRate = (parseFloat(e.target.value) || 0) / 100;
                              const newOptions = [...(formData.installmentConfig.options || [])];
                              newOptions[index] = { ...option, feeRate: newFeeRate };
                              updateInstallmentConfig({ options: newOptions });
                            }}
                            placeholder="2.99"
                            min="0"
                            max="50"
                            step="0.01"
                            className="text-center"
                          />
                        </div>

                        {/* Target Value Input (Reverse Calculation) */}
                        <div>
                          <Label htmlFor={`target-${option.installments}`}>
                            Valor alvo {option.installments === 1 ? '(total)' : '(por parcela)'}
                          </Label>
                          <Input
                            id={`target-${option.installments}`}
                            type="number"
                            placeholder={option.installments === 1 ? "19.90" : "29.90"}
                            onChange={(e) => {
                              const targetValue = parseFloat(e.target.value) || 0;
                              if (targetValue > 0) {
                                // Reverse calculation logic
                                const targetCents = Math.round(targetValue * 100);
                                let newFeeRate: number;
                                
                                if (option.installments === 1) {
                                  // For single payment: target = finalAmount * (1 + feeRate)
                                  // So: feeRate = (target / finalAmount) - 1
                                  const finalAmount = pricing?.finalAmount || formData.baseAmount;
                                  newFeeRate = Math.max(0, (targetCents / finalAmount) - 1);
                                } else {
                                  // For installments: target = (finalAmount * (1 + feeRate)) / installments
                                  // So: feeRate = (target * installments / finalAmount) - 1
                                  const finalAmount = pricing?.finalAmount || formData.baseAmount;
                                  newFeeRate = Math.max(0, (targetCents * option.installments / finalAmount) - 1);
                                }
                                
                                const newOptions = [...(formData.installmentConfig.options || [])];
                                newOptions[index] = { ...option, feeRate: newFeeRate };
                                updateInstallmentConfig({ options: newOptions });
                              }
                            }}
                            step="0.01"
                            className="text-center"
                          />
                        </div>

                        {/* Calculated Result Display */}
                        <div>
                          <Label>Resultado calculado</Label>
                          <div className="h-9 flex items-center justify-center border rounded-md bg-gray-50 text-sm font-medium">
                            {pricing && pricing.installmentOptions.find(opt => opt.installments === option.installments) && (
                              option.installments === 1 
                                ? formatCurrency(pricing.installmentOptions.find(opt => opt.installments === option.installments)!.totalAmount)
                                : `${formatCurrency(pricing.installmentOptions.find(opt => opt.installments === option.installments)!.installmentAmount)}/parcela`
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {pricing && pricing.installmentOptions.find(opt => opt.installments === option.installments) && (
                        <div className="text-xs text-muted-foreground">
                          Total com taxas: {formatCurrency(pricing.installmentOptions.find(opt => opt.installments === option.installments)!.totalAmount)}
                          {option.feeRate > 0 && (
                            <> • Taxas: {formatCurrency(pricing.installmentOptions.find(opt => opt.installments === option.installments)!.totalFees)}</>
                          )}
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Quick Fee Templates */}
                  <div className="border-t pt-4">
                    <Label className="text-sm">Templates rápidos:</Label>
                    <div className="flex gap-2 mt-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const templateOptions = [
                            { installments: 1, feeRate: 0.029 },
                            { installments: 3, feeRate: 0.069 },
                            { installments: 6, feeRate: 0.099 },
                            { installments: 12, feeRate: 0.149 }
                          ];
                          updateInstallmentConfig({ options: templateOptions });
                        }}
                      >
                        Padrão Conservador
                      </Button>
                      
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const templateOptions = [
                            { installments: 1, feeRate: 0.0199 },
                            { installments: 3, feeRate: 0.0499 },
                            { installments: 6, feeRate: 0.0799 },
                            { installments: 12, feeRate: 0.1199 }
                          ];
                          updateInstallmentConfig({ options: templateOptions });
                        }}
                      >
                        Competitivo
                      </Button>
                      
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const templateOptions = [
                            { installments: 1, feeRate: 0.0399 },
                            { installments: 3, feeRate: 0.0899 },
                            { installments: 6, feeRate: 0.1299 },
                            { installments: 12, feeRate: 0.1799 }
                          ];
                          updateInstallmentConfig({ options: templateOptions });
                        }}
                      >
                        Premium
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Visual Customization Section */}
          <PromotionalConfigurationSectionV2 
            promotionalConfig={formData.promotionalConfig}
            displayConfig={formData.displayConfig}
            discountConfig={formData.discountConfig}
            onPromotionalConfigChange={updatePromotionalConfig}
            onDisplayConfigChange={updateDisplayConfig}
          />
        </div>

        {/* Preview Section */}
        <div className="space-y-6">
          
          {/* Plan Preview */}
          <Card className="border-purple-200">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15 12C15 13.6569 13.6569 15 12 15C10.3431 15 9 13.6569 9 12C9 10.3431 10.3431 9 12 9C13.6569 9 15 10.3431 15 12Z" stroke="currentColor" strokeWidth="2"/>
                  <path d="M2.458 12C3.732 7.943 7.523 5 12 5C16.478 5 20.268 7.943 21.542 12C20.268 16.057 16.478 19 12 19C7.523 19 3.732 16.057 2.458 12Z" stroke="currentColor" strokeWidth="2"/>
                </svg>
                Prévia Visual do Plano
              </CardTitle>
              <CardDescription>
                Como o plano aparecerá para os usuários com as customizações aplicadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EnhancedPlanDisplayV2 
                plan={previewPlan}
                className="max-w-md"
              />
            </CardContent>
          </Card>
          
          {/* Validation Errors */}
          {!isValid && validationErrors.length > 0 && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <p className="font-medium">Corrija os seguintes erros:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {validationErrors.map((error, index) => (
                      <li key={index} className="text-sm">{error}</li>
                    ))}
                  </ul>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Pricing Preview */}
          {pricing && (
            <Card className="border-green-200">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calculator className="h-4 w-4" />
                  Prévia de Preços
                </CardTitle>
                <CardDescription>
                  Cálculos em tempo real baseados na configuração
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                
                {/* Base Price */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Valor Base:</span>
                  <span className="font-medium">{formatCurrency(pricing.baseAmount)}</span>
                </div>

                {/* Discount */}
                {pricing.metadata.hasDiscount && (
                  <div className="flex items-center justify-between text-red-600">
                    <span className="text-sm">Desconto:</span>
                    <span className="font-medium flex items-center gap-1">
                      <TrendingDown className="h-3 w-3" />
                      -{formatCurrency(pricing.discountAmount)}
                    </span>
                  </div>
                )}

                {/* Final Amount */}
                <div className="flex items-center justify-between border-t pt-2">
                  <span className="text-sm font-medium">Valor Final (Cartão):</span>
                  <span className="font-bold text-lg">{formatCurrency(pricing.finalAmount)}</span>
                </div>

                {/* PIX Price */}
                {pricing.metadata.hasPixDiscount && (
                  <>
                    <div className="flex items-center justify-between text-green-600">
                      <span className="text-sm">Desconto PIX adicional:</span>
                      <span className="font-medium flex items-center gap-1">
                        <TrendingDown className="h-3 w-3" />
                        -{formatCurrency(pricing.pixDiscount.amount)}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between border-t pt-2">
                      <span className="text-sm font-medium">Valor Final (PIX):</span>
                      <span className="font-bold text-lg text-green-600">
                        {formatCurrency(pricing.pixFinalAmount)}
                      </span>
                    </div>
                  </>
                )}

                <Separator />

                {/* Installment Options */}
                <div>
                  <Label className="text-sm font-medium">Opções de Parcelamento:</Label>
                  <div className="mt-2 space-y-2">
                    {pricing.installmentOptions.map((option, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <span>
                          {option.installments}x de {formatCurrency(option.installmentAmount)}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          Total: {formatCurrency(option.totalAmount)}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Total Savings */}
                {pricing.savings.amount > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-800">
                        Economia Total: {formatCurrency(pricing.savings.amount)}
                      </span>
                    </div>
                    <p className="text-xs text-green-600 mt-1">
                      {formatPercentage(pricing.savings.percentage)} de desconto no valor original
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Form Actions */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col gap-3">
                <Button 
                  onClick={handleSubmit}
                  disabled={isSubmitting || !isValid}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {mode === 'create' ? 'Criando...' : 'Atualizando...'}
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {mode === 'create' ? 'Criar Plano V2' : 'Atualizar Plano'}
                    </>
                  )}
                </Button>
                
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={onCancel}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}