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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  CreditCard, 
  Percent, 
  Calculator, 
  AlertTriangle, 
  CheckCircle,
  Settings
} from 'lucide-react';
import { usePaymentPricingV2 } from '@/hooks/usePaymentPricingV2';
import type { 
  PaymentPlanV2FormData, 
  PaymentPlanV2Row, 
  DiscountConfigV2,
  InstallmentConfigV2
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

// =============================================================================
// BI-DIRECTIONAL CALCULATION FUNCTIONS
// =============================================================================

// Linear fee calculation helper - 3-month fee becomes the base reference
const generateLinearInstallmentOptions = (baseFeeRate: number = 0.06) => {
  const options = [];
  for (let i = 1; i <= 12; i++) {
    let feeRate = 0;
    if (i === 1) {
      feeRate = 0; // 1x always 0% fee
    } else if (i <= 3) {
      // Linear interpolation from 0% (1x) to baseFeeRate (3x)
      feeRate = baseFeeRate * (i - 1) / 2;
    } else {
      // Linear progression: 6x = baseFee * 2, 12x = baseFee * 4
      feeRate = baseFeeRate * (i - 1) / 2;
    }
    options.push({ installments: i, feeRate });
  }
  return options;
};

// Calculate linear fee for any month based on 3-month reference
const calculateLinearFeeRate = (months: number, baseFeeFor3Months: number): number => {
  if (months === 1) return 0; // 1x always free
  return baseFeeFor3Months * (months - 1) / 2;
};

// Reverse calculate base fee rate from any month's fee
const calculateBaseFeeFromMonth = (months: number, monthFeeRate: number): number => {
  if (months === 1) return 0.06; // Default if trying to reverse from 1x
  return (monthFeeRate * 2) / (months - 1);
};

// Calculate all installment options from base fee rate
const recalculateAllInstallments = (baseFeeRate: number) => {
  return generateLinearInstallmentOptions(baseFeeRate);
};

// Reverse calculate base fee from target installment value
const calculateBaseFeeFromTargetValue = (
  months: number, 
  targetValueInCents: number, 
  baseAmount: number
): number => {
  if (months === 1) {
    // For 1x, target should equal baseAmount (0% fee)
    return 0.06; // Return default base fee
  }
  
  // target = (baseAmount * (1 + feeRate)) / months
  // feeRate = (target * months / baseAmount) - 1
  const requiredFeeRate = Math.max(0, (targetValueInCents * months / baseAmount) - 1);
  
  // Convert this specific month's fee rate back to base 3-month fee
  return calculateBaseFeeFromMonth(months, requiredFeeRate);
};

// Calculate installment value from fee rate
const calculateInstallmentValue = (baseAmount: number, months: number, feeRate: number): number => {
  const totalWithFee = baseAmount * (1 + feeRate);
  return Math.round(totalWithFee / months);
};

// Calculate total value from fee rate
const calculateTotalValue = (baseAmount: number, feeRate: number): number => {
  return Math.round(baseAmount * (1 + feeRate));
};

// Currency formatting utilities - cents-first input mask
const formatCurrencyInputCentsFirst = (value: string): string => {
  // Remove all non-numeric characters
  const digits = value.replace(/\D/g, '');
  
  // If empty, return empty
  if (!digits) return '';
  
  // Convert to number and format as cents-first
  const numericValue = parseInt(digits, 10);
  
  // Format as decimal with 2 decimal places, then use Brazilian comma
  const formatted = (numericValue / 100).toFixed(2);
  return formatted.replace('.', ',');
};

// Regular currency formatting for non-table inputs
const formatCurrencyInput = (value: string): string => {
  // Remove non-numeric characters except comma and dot
  const cleaned = value.replace(/[^\d,\.]/g, '');
  
  // Allow natural typing - don't auto-format until blur
  // Just clean unwanted characters and ensure proper decimal separator
  if (cleaned.includes('.')) {
    return cleaned.replace('.', ',');
  }
  
  return cleaned;
};

const parseCurrencyInput = (value: string): number => {
  // Convert Brazilian format (comma as decimal) to cents
  const normalized = value.replace(',', '.');
  const parsed = parseFloat(normalized) || 0;
  return Math.round(parsed * 100); // Convert to cents
};

const formatCurrencyDisplay = (amountInCents: number): string => {
  // Format amount from cents to Brazilian decimal format (x,xx)
  return (amountInCents / 100).toFixed(2).replace('.', ',');
};

const getDefaultFormData = (): PaymentPlanV2FormData => ({
  name: '',
  description: '',
  planType: 'premium', // Always premium, but will be removed from UI
  durationDays: 365,
  baseAmount: 1990, // R$ 19.90
  installmentConfig: {
    enabled: true, // Always enabled
    options: generateLinearInstallmentOptions(0.06) // 6% base fee for 3x
  },
  discountConfig: {
    enabled: false,
    type: 'percentage'
  },
  // PIX is always enabled and free - no configuration needed
  pixConfig: {
    enabled: true,
    expirationMinutes: 60,
    baseFeeRate: 0, // PIX is always free
    discountPercentage: 0 // No PIX discount needed since it's free
  },
  creditCardConfig: {
    enabled: true,
    requireCvv: true
  },
  // Full promotional config with visual customization
  promotionalConfig: {
    isActive: false,
    titleColor: '#111827',
    descriptionColor: '#6B7280',
    borderColor: '#E5E7EB',
    savingsColor: '#059669',
    discountTagBackgroundColor: '#111827',
    discountTagTextColor: '#FFFFFF'
  },
  displayConfig: {
    showDiscountAmount: true,
    showSavingsAmount: true,
    customName: '',
    customDescription: '',
    showCustomName: false,
    showCustomDescription: false,
    focusOnInstallments: false,
    showCountdownTimer: false,
    countdownEndDate: '',
    countdownText: 'Oferta por tempo limitado!'
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
        promotionalConfig: (() => {
          try {
            const config = initialData.promotional_config;
            return config ? (typeof config === 'string' ? JSON.parse(config) : config) : getDefaultFormData().promotionalConfig;
          } catch {
            return getDefaultFormData().promotionalConfig;
          }
        })(),
        displayConfig: (() => {
          try {
            const config = initialData.display_config;
            return config ? (typeof config === 'string' ? JSON.parse(config) : config) : getDefaultFormData().displayConfig;
          } catch {
            return getDefaultFormData().displayConfig;
          }
        })(),
        customLinkParameter: (initialData as any)?.custom_link_parameter || ''
      };
    }
    return getDefaultFormData();
  });

  // Local state for table input values (to prevent read-only warning)
  const [inputValues, setInputValues] = useState<{[key: string]: string}>({});

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

  // Update promotional configuration
  const updatePromotionalConfig = (updates: any) => {
    setFormData(prev => ({
      ...prev,
      promotionalConfig: {
        ...prev.promotionalConfig,
        ...updates
      }
    }));
  };

  // Update display configuration
  const updateDisplayConfig = (updates: any) => {
    setFormData(prev => ({
      ...prev,
      displayConfig: {
        ...prev.displayConfig,
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

  // Promotional and display configs are now minimal and don't need update functions

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

      {/* Form Section */}
      <div className="space-y-6">
          
          {/* Basic Information - Simplified */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informações Básicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Nome do Plano *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Premium Anual"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="baseAmount">Preço (R$) *</Label>
                  <Input
                    id="baseAmount"
                    type="text"
                    value={inputValues['baseAmount'] ?? formatCurrencyDisplay(formData.baseAmount)}
                    onChange={(e) => {
                      // Allow natural typing without aggressive formatting
                      const cleaned = formatCurrencyInput(e.target.value);
                      setInputValues(prev => ({ ...prev, baseAmount: cleaned }));
                    }}
                    onBlur={(e) => {
                      const amountInCents = parseCurrencyInput(e.target.value);
                      setFormData(prev => ({ ...prev, baseAmount: amountInCents }));
                      setInputValues(prev => {
                        const { baseAmount: removed, ...rest } = prev;
                        return rest;
                      });
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const amountInCents = parseCurrencyInput(e.currentTarget.value);
                        setFormData(prev => ({ ...prev, baseAmount: amountInCents }));
                        setInputValues(prev => {
                          const { baseAmount: removed, ...rest } = prev;
                          return rest;
                        });
                        e.currentTarget.blur();
                      }
                    }}
                    placeholder="19,90"
                    required
                    step="0.01"
                  />
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
              
              <div>
                <Label htmlFor="customLinkParameter">Parâmetro do Link</Label>
                <Input
                  id="customLinkParameter"
                  value={formData.customLinkParameter}
                  onChange={(e) => setFormData(prev => ({ ...prev, customLinkParameter: e.target.value }))}
                  placeholder="premium-anual"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {formData.customLinkParameter ? (
                    <>Link: <code className="bg-gray-100 px-1 rounded text-xs">/pagamento?plano={formData.customLinkParameter}</code></>
                  ) : (
                    'Parâmetro para links diretos (ex: "premium-anual")'
                  )}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Consolidated Price Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                Configurações de Preço
              </CardTitle>
              <CardDescription>
                PIX sempre ativo e gratuito • Parcelamentos sempre habilitados
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Discount Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Desconto</Label>
                    <p className="text-sm text-muted-foreground">
                      Aplicar desconto no preço base
                    </p>
                  </div>
                  <Switch
                    checked={formData.discountConfig.enabled}
                    onCheckedChange={(enabled) => updateDiscountConfig({ enabled })}
                  />
                </div>

                {formData.discountConfig.enabled && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

                    {formData.discountConfig.type === 'percentage' ? (
                      <div>
                        <Label htmlFor="discountPercentage">Desconto (%)</Label>
                        <Input
                          id="discountPercentage"
                          type="number"
                          value={inputValues['discountPercentage'] ?? ((formData.discountConfig.percentage || 0) * 100).toFixed(1)}
                          onChange={(e) => {
                            setInputValues(prev => ({ ...prev, discountPercentage: e.target.value }));
                          }}
                          onBlur={(e) => {
                            updateDiscountConfig({ 
                              percentage: (parseFloat(e.target.value) || 0) / 100 
                            });
                            setInputValues(prev => {
                              const { discountPercentage: removed, ...rest } = prev;
                              return rest;
                            });
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              updateDiscountConfig({ 
                                percentage: (parseFloat(e.currentTarget.value) || 0) / 100 
                              });
                              e.currentTarget.blur();
                              setInputValues(prev => {
                                const { discountPercentage: removed, ...rest } = prev;
                                return rest;
                              });
                            }
                          }}
                          placeholder="20.0"
                          min="0"
                          max="100"
                          step="0.1"
                          className="text-center"
                        />
                      </div>
                    ) : (
                      <div>
                        <Label htmlFor="discountAmount">Desconto (R$)</Label>
                        <Input
                          id="discountAmount"
                          type="text"
                          value={inputValues['discountAmount'] ?? formatCurrencyDisplay(formData.discountConfig.fixedAmount || 0)}
                          onChange={(e) => {
                            const cleaned = formatCurrencyInput(e.target.value);
                            setInputValues(prev => ({ ...prev, discountAmount: cleaned }));
                          }}
                          onBlur={(e) => {
                            updateDiscountConfig({ 
                              fixedAmount: parseCurrencyInput(e.target.value)
                            });
                            setInputValues(prev => {
                              const { discountAmount: removed, ...rest } = prev;
                              return rest;
                            });
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              updateDiscountConfig({ 
                                fixedAmount: parseCurrencyInput(e.currentTarget.value)
                              });
                              e.currentTarget.blur();
                              setInputValues(prev => {
                                const { discountAmount: removed, ...rest } = prev;
                                return rest;
                              });
                            }
                          }}
                          placeholder="2,00"
                          min="0"
                          step="0.01"
                          className="text-center"
                        />
                      </div>
                    )}
                    
                    {/* Preview discounted price */}
                    <div>
                      <Label>Preço com desconto</Label>
                      <div className="h-9 flex items-center justify-center border rounded-md bg-green-50 text-sm font-medium text-green-700">
                        {pricing ? formatCurrency(pricing.finalAmount) : formatCurrency(formData.baseAmount)}
                      </div>
                    </div>
                  </div>
                )}
              </div>

            </CardContent>
          </Card>

          {/* Installment Table - 12 Rows */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Configurações de Parcelamento</CardTitle>
              <CardDescription>
                1x sempre gratuito • PIX sempre gratuito • Edite qualquer campo para recalcular automaticamente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-200">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-200 px-3 py-2 text-left font-medium">Parcelas</th>
                      <th className="border border-gray-200 px-3 py-2 text-center font-medium">Taxa %</th>
                      <th className="border border-gray-200 px-3 py-2 text-center font-medium">Parcela</th>
                      <th className="border border-gray-200 px-3 py-2 text-center font-medium">Total R$</th>
                      <th className="border border-gray-200 px-3 py-2 text-center font-medium">Total %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* PIX Row - Always First */}
                    <tr className="bg-green-50">
                      <td className="border border-gray-200 px-3 py-2 font-medium text-green-700">PIX</td>
                      <td className="border border-gray-200 px-3 py-2 text-center text-green-700 font-medium">0%</td>
                      <td className="border border-gray-200 px-3 py-2 text-center text-green-700 font-medium">
                        {pricing ? formatCurrency(pricing.finalAmount) : formatCurrency(formData.baseAmount)}
                      </td>
                      <td className="border border-gray-200 px-3 py-2 text-center text-green-700 font-medium">
                        {pricing ? formatCurrency(pricing.finalAmount) : formatCurrency(formData.baseAmount)}
                      </td>
                      <td className="border border-gray-200 px-3 py-2 text-center text-green-700 font-medium">0%</td>
                    </tr>
                    
                    {/* Installment Rows - 1x to 12x */}
                    {formData.installmentConfig.options?.map((option, index) => {
                      const currentBaseAmount = pricing?.finalAmount || formData.baseAmount;
                      const installmentValue = calculateInstallmentValue(currentBaseAmount, option.installments, option.feeRate);
                      const totalValue = calculateTotalValue(currentBaseAmount, option.feeRate);
                      const totalPercentage = currentBaseAmount > 0 ? ((totalValue - currentBaseAmount) / currentBaseAmount) * 100 : 0;
                      
                      return (
                        <tr key={option.installments} className={option.installments === 1 ? 'bg-blue-50' : 'hover:bg-gray-50'}>
                          <td className="border border-gray-200 px-3 py-2 font-medium">
                            {option.installments === 1 ? 'À vista' : `${option.installments}x`}
                          </td>
                          <td className="border border-gray-200 px-2 py-1">
                            {option.installments === 1 ? (
                              <div className="text-center font-medium text-blue-700">0%</div>
                            ) : (
                              <Input
                                type="number"
                                value={inputValues[`fee-${option.installments}`] ?? (option.feeRate * 100).toFixed(2)}
                                onChange={(e) => {
                                  // Update local state only
                                  setInputValues(prev => ({
                                    ...prev,
                                    [`fee-${option.installments}`]: e.target.value
                                  }));
                                }}
                                onBlur={(e) => {
                                  const newFeeRate = (parseFloat(e.target.value) || 0) / 100;
                                  const newBaseFeeRate = calculateBaseFeeFromMonth(option.installments, newFeeRate);
                                  const newOptions = recalculateAllInstallments(newBaseFeeRate);
                                  updateInstallmentConfig({ options: newOptions });
                                  // Clear local state after sync
                                  setInputValues(prev => {
                                    const { [`fee-${option.installments}`]: removed, ...rest } = prev;
                                    return rest;
                                  });
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    const newFeeRate = (parseFloat(e.currentTarget.value) || 0) / 100;
                                    const newBaseFeeRate = calculateBaseFeeFromMonth(option.installments, newFeeRate);
                                    const newOptions = recalculateAllInstallments(newBaseFeeRate);
                                    updateInstallmentConfig({ options: newOptions });
                                    e.currentTarget.blur(); // Remove focus after Enter
                                    // Clear local state after sync
                                    setInputValues(prev => {
                                      const { [`fee-${option.installments}`]: removed, ...rest } = prev;
                                      return rest;
                                    });
                                  }
                                }}
                                className="text-center text-xs h-8 border-0 bg-transparent focus:bg-white focus:ring-1"
                                step="0.01"
                                min="0"
                                max="50"
                              />
                            )}
                          </td>
                          <td className="border border-gray-200 px-2 py-1">
                            <Input
                              type="text"
                              value={inputValues[`installment-${option.installments}`] ?? formatCurrencyDisplay(installmentValue)}
                              onChange={(e) => {
                                // Use cents-first input mask for table fields
                                const formatted = formatCurrencyInputCentsFirst(e.target.value);
                                setInputValues(prev => ({
                                  ...prev,
                                  [`installment-${option.installments}`]: formatted
                                }));
                              }}
                              onBlur={(e) => {
                                const targetValue = parseCurrencyInput(e.target.value);
                                if (targetValue > 0) {
                                  const newBaseFeeRate = calculateBaseFeeFromTargetValue(
                                    option.installments, 
                                    targetValue, 
                                    currentBaseAmount
                                  );
                                  const newOptions = recalculateAllInstallments(newBaseFeeRate);
                                  updateInstallmentConfig({ options: newOptions });
                                }
                                // Clear local state after sync
                                setInputValues(prev => {
                                  const { [`installment-${option.installments}`]: removed, ...rest } = prev;
                                  return rest;
                                });
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  const targetValue = parseCurrencyInput(e.currentTarget.value);
                                  if (targetValue > 0) {
                                    const newBaseFeeRate = calculateBaseFeeFromTargetValue(
                                      option.installments, 
                                      targetValue, 
                                      currentBaseAmount
                                    );
                                    const newOptions = recalculateAllInstallments(newBaseFeeRate);
                                    updateInstallmentConfig({ options: newOptions });
                                    e.currentTarget.blur(); // Remove focus after Enter
                                  }
                                  // Clear local state after sync
                                  setInputValues(prev => {
                                    const { [`installment-${option.installments}`]: removed, ...rest } = prev;
                                    return rest;
                                  });
                                }
                              }}
                              className="text-center text-xs h-8 border-0 bg-transparent focus:bg-white focus:ring-1"
                              step="0.01"
                              min="0"
                            />
                          </td>
                          <td className="border border-gray-200 px-2 py-1">
                            <Input
                              type="text"
                              value={inputValues[`total-${option.installments}`] ?? formatCurrencyDisplay(totalValue)}
                              onChange={(e) => {
                                // Use cents-first input mask for table fields
                                const formatted = formatCurrencyInputCentsFirst(e.target.value);
                                setInputValues(prev => ({
                                  ...prev,
                                  [`total-${option.installments}`]: formatted
                                }));
                              }}
                              onBlur={(e) => {
                                const targetCents = parseCurrencyInput(e.target.value);
                                if (targetCents > 0 && option.installments > 1) {
                                  // Calculate required fee rate to reach target total
                                  const newFeeRate = Math.max(0, (targetCents / currentBaseAmount) - 1);
                                  const newBaseFeeRate = calculateBaseFeeFromMonth(option.installments, newFeeRate);
                                  const newOptions = recalculateAllInstallments(newBaseFeeRate);
                                  updateInstallmentConfig({ options: newOptions });
                                }
                                // Clear local state after sync
                                setInputValues(prev => {
                                  const { [`total-${option.installments}`]: removed, ...rest } = prev;
                                  return rest;
                                });
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  const targetCents = parseCurrencyInput(e.currentTarget.value);
                                  if (targetCents > 0 && option.installments > 1) {
                                    // Calculate required fee rate to reach target total
                                    const newFeeRate = Math.max(0, (targetCents / currentBaseAmount) - 1);
                                    const newBaseFeeRate = calculateBaseFeeFromMonth(option.installments, newFeeRate);
                                    const newOptions = recalculateAllInstallments(newBaseFeeRate);
                                    updateInstallmentConfig({ options: newOptions });
                                    e.currentTarget.blur(); // Remove focus after Enter
                                  }
                                  // Clear local state after sync
                                  setInputValues(prev => {
                                    const { [`total-${option.installments}`]: removed, ...rest } = prev;
                                    return rest;
                                  });
                                }
                              }}
                              className="text-center text-xs h-8 border-0 bg-transparent focus:bg-white focus:ring-1"
                              step="0.01"
                              min="0"
                              disabled={option.installments === 1}
                            />
                          </td>
                          <td className="border border-gray-200 px-3 py-2 text-center text-sm">
                            {totalPercentage.toFixed(1)}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              
              {/* Quick Fee Templates */}
              <div className="mt-4 pt-4 border-t">
                <Label className="text-sm">Templates rápidos:</Label>
                <div className="flex gap-2 mt-2 flex-wrap">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newOptions = recalculateAllInstallments(0.04); // 4% base fee
                      updateInstallmentConfig({ options: newOptions });
                    }}
                  >
                    Baixo (+2% p/mês)
                  </Button>
                  
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newOptions = recalculateAllInstallments(0.06); // 6% base fee
                      updateInstallmentConfig({ options: newOptions });
                    }}
                  >
                    Padrão (+3% p/mês)
                  </Button>
                  
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newOptions = recalculateAllInstallments(0.08); // 8% base fee
                      updateInstallmentConfig({ options: newOptions });
                    }}
                  >
                    Alto (+4% p/mês)
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

      </div>

      {/* Validation Errors and Form Actions */}
          
          
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

          {/* Visual Customization Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Personalização Visual
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Main Toggle */}
              <div className="flex items-center justify-between pb-4 border-b">
                <Label className="text-base font-medium">Ativar Personalização</Label>
                <Switch
                  checked={formData.promotionalConfig.isActive}
                  onCheckedChange={(checked) => 
                    updatePromotionalConfig({ isActive: checked })
                  }
                  disabled={!formData.discountConfig.enabled}
                />
              </div>

              {/* Settings Grid - Always visible when enabled */}
              {formData.promotionalConfig.isActive && formData.discountConfig.enabled && (
                <div className="space-y-6">
                  
                  {/* Visual Elements */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-gray-700">Elementos</Label>
                    <div className="flex gap-6">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={formData.displayConfig.showDiscountAmount}
                          onChange={(e) => 
                            updateDisplayConfig({ showDiscountAmount: e.target.checked })
                          }
                          className="rounded w-4 h-4"
                        />
                        Mostrar desconto
                      </label>
                      
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={formData.displayConfig.showSavingsAmount}
                          onChange={(e) => 
                            updateDisplayConfig({ showSavingsAmount: e.target.checked })
                          }
                          className="rounded w-4 h-4"
                        />
                        Mostrar economia
                      </label>
                      
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={formData.displayConfig.focusOnInstallments || false}
                          onChange={(e) => 
                            updateDisplayConfig({ focusOnInstallments: e.target.checked })
                          }
                          className="rounded w-4 h-4"
                        />
                        Focar em parcelas
                      </label>
                    </div>
                  </div>

                  {/* Countdown Timer */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-gray-700">Timer</Label>
                    <div className="space-y-3">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={formData.displayConfig.showCountdownTimer || false}
                          onChange={(e) => 
                            updateDisplayConfig({ showCountdownTimer: e.target.checked })
                          }
                          className="rounded w-4 h-4"
                        />
                        Exibir timer de oferta
                      </label>
                      
                      {formData.displayConfig.showCountdownTimer && (
                        <div className="mt-3">
                          <div className="space-y-2">
                            <Label htmlFor="countdownEndDate" className="text-sm">Data final</Label>
                            <Input
                              id="countdownEndDate"
                              type="datetime-local"
                              value={formData.displayConfig.countdownEndDate || ''}
                              onChange={(e) => 
                                updateDisplayConfig({ countdownEndDate: e.target.value })
                              }
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Custom Content */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-gray-700">Conteúdo</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={formData.displayConfig.showCustomName || false}
                            onChange={(e) => 
                              updateDisplayConfig({ showCustomName: e.target.checked })
                            }
                            className="rounded w-4 h-4"
                          />
                          <Label htmlFor="customName" className="text-sm">Nome customizado</Label>
                        </div>
                        <Input
                          id="customName"
                          value={formData.displayConfig.customName || ''}
                          onChange={(e) => 
                            updateDisplayConfig({ customName: e.target.value })
                          }
                          placeholder="Nome promocional"
                          disabled={!formData.displayConfig.showCustomName}
                          className="h-8"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={formData.displayConfig.showCustomDescription || false}
                            onChange={(e) => 
                              updateDisplayConfig({ showCustomDescription: e.target.checked })
                            }
                            className="rounded w-4 h-4"
                          />
                          <Label htmlFor="customDescription" className="text-sm">Descrição customizada</Label>
                        </div>
                        <Textarea
                          id="customDescription"
                          value={formData.displayConfig.customDescription || ''}
                          onChange={(e) => 
                            updateDisplayConfig({ customDescription: e.target.value })
                          }
                          placeholder="Descrição promocional"
                          disabled={!formData.displayConfig.showCustomDescription}
                          rows={2}
                          className="text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Colors */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-gray-700">Cores</Label>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <Label htmlFor="titleColor" className="text-xs text-gray-500">Título</Label>
                        <Input
                          id="titleColor"
                          type="color"
                          value={formData.promotionalConfig.titleColor || '#111827'}
                          onChange={(e) => 
                            updatePromotionalConfig({ titleColor: e.target.value })
                          }
                          className="h-8 p-1 cursor-pointer"
                        />
                      </div>
                      
                      <div className="space-y-1">
                        <Label htmlFor="descriptionColor" className="text-xs text-gray-500">Descrição</Label>
                        <Input
                          id="descriptionColor"
                          type="color"
                          value={formData.promotionalConfig.descriptionColor || '#6B7280'}
                          onChange={(e) => 
                            updatePromotionalConfig({ descriptionColor: e.target.value })
                          }
                          className="h-8 p-1 cursor-pointer"
                        />
                      </div>
                      
                      <div className="space-y-1">
                        <Label htmlFor="borderColor" className="text-xs text-gray-500">Borda</Label>
                        <Input
                          id="borderColor"
                          type="color"
                          value={formData.promotionalConfig.borderColor || '#E5E7EB'}
                          onChange={(e) => 
                            updatePromotionalConfig({ borderColor: e.target.value })
                          }
                          className="h-8 p-1 cursor-pointer"
                        />
                      </div>
                      
                      <div className="space-y-1">
                        <Label htmlFor="savingsColor" className="text-xs text-gray-500">Economia</Label>
                        <Input
                          id="savingsColor"
                          type="color"
                          value={formData.promotionalConfig.savingsColor || '#059669'}
                          onChange={(e) => 
                            updatePromotionalConfig({ savingsColor: e.target.value })
                          }
                          className="h-8 p-1 cursor-pointer"
                        />
                      </div>
                      
                      <div className="space-y-1">
                        <Label htmlFor="discountTagBackgroundColor" className="text-xs text-gray-500">Tag Fundo</Label>
                        <Input
                          id="discountTagBackgroundColor"
                          type="color"
                          value={formData.promotionalConfig.discountTagBackgroundColor || '#111827'}
                          onChange={(e) => 
                            updatePromotionalConfig({ discountTagBackgroundColor: e.target.value })
                          }
                          className="h-8 p-1 cursor-pointer"
                        />
                      </div>
                      
                      <div className="space-y-1">
                        <Label htmlFor="discountTagTextColor" className="text-xs text-gray-500">Tag Texto</Label>
                        <Input
                          id="discountTagTextColor"
                          type="color"
                          value={formData.promotionalConfig.discountTagTextColor || '#FFFFFF'}
                          onChange={(e) => 
                            updatePromotionalConfig({ discountTagTextColor: e.target.value })
                          }
                          className="h-8 p-1 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Disabled State Message */}
              {!formData.discountConfig.enabled && (
                <div className="text-center py-8 text-gray-400">
                  <Settings className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Configure um desconto primeiro para personalizar a aparência</p>
                </div>
              )}
            </CardContent>
          </Card>

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
  );
}