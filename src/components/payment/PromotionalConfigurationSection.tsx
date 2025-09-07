// ABOUTME: Promotional configuration section component extracted from AdminPaymentManagement to fix JSX syntax issues

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Settings, ChevronDown, ChevronUp, Clock, Eye, Save } from 'lucide-react';
import { EnhancedPlanDisplay } from '@/components/payment/EnhancedPlanDisplay';
import type { Database } from '@/integrations/supabase/types';

type PaymentPlan = Database['public']['Tables']['PaymentPlans']['Row'];

interface PromotionalConfigurationSectionProps {
  plan: PaymentPlan;
  expandedPromotionalPlan: string | null;
  setExpandedPromotionalPlan: (planId: string | null) => void;
  promotionalConfigs: Record<string, any>;
  displayConfigs: Record<string, any>;
  showPreview: Record<string, boolean>;
  initPromotionalConfig: (plan: PaymentPlan) => void;
  updatePromotionalConfig: (planId: string, key: string, value: any) => void;
  updateDisplayConfig: (planId: string, key: string, value: any) => void;
  savePromotionalConfig: (planId: string) => void;
  togglePreview: (planId: string) => void;
  updatePromotionalConfigMutation: { isPending: boolean };
}

export function PromotionalConfigurationSection({
  plan,
  expandedPromotionalPlan,
  setExpandedPromotionalPlan,
  promotionalConfigs,
  displayConfigs,
  showPreview,
  initPromotionalConfig,
  updatePromotionalConfig,
  updateDisplayConfig,
  savePromotionalConfig,
  togglePreview,
  updatePromotionalConfigMutation
}: PromotionalConfigurationSectionProps) {
  initPromotionalConfig(plan);
  const isExpanded = expandedPromotionalPlan === plan.id;
  const promoConfig = promotionalConfigs[plan.id] || {};
  const displayConfig = displayConfigs[plan.id] || {};

  return (
    <div className="border border-gray-200 rounded-lg">
      {/* Header */}
      <button
        onClick={() => setExpandedPromotionalPlan(isExpanded ? null : plan.id)}
        className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Settings className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">
            Configuração Promocional
          </span>
          {promoConfig.isActive && (
            <Badge variant="secondary" className="text-xs bg-blue-50 text-blue-600">
              Ativa
            </Badge>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-gray-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-400" />
        )}
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-gray-200 p-4 space-y-4 bg-gray-50">
          {/* Main Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium">Ativar Promoção</Label>
              <Switch
                checked={promoConfig.isActive || false}
                onCheckedChange={(checked) => 
                  updatePromotionalConfig(plan.id, 'isActive', checked)
                }
              />
            </div>
          </div>

          {/* Always show Display Customization - not gated behind promotion */}
          <div className="space-y-6">
            {/* Display Customization - Always Available */}
            <div className="space-y-4 p-4 bg-white border border-gray-200 rounded-lg">
              <div className="flex items-center gap-2 text-gray-900 mb-3">
                <span className="text-sm font-semibold">Personalização de Exibição</span>
                <span className="text-xs text-gray-500">(Disponível para todos os planos)</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Custom Name */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={displayConfig.showCustomName || false}
                      onCheckedChange={(checked) => 
                        updateDisplayConfig(plan.id, 'showCustomName', checked)
                      }
                      size="sm"
                    />
                    <Label className="text-sm font-medium text-gray-700">Nome Personalizado</Label>
                  </div>
                  <Input
                    placeholder="Ex: Plano Premium Plus"
                    value={promoConfig.customName || ''}
                    onChange={(e) => 
                      updatePromotionalConfig(plan.id, 'customName', e.target.value)
                    }
                    disabled={!displayConfig.showCustomName}
                    className="text-sm"
                  />
                </div>

                {/* Custom Description */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={displayConfig.showCustomDescription || false}
                      onCheckedChange={(checked) => 
                        updateDisplayConfig(plan.id, 'showCustomDescription', checked)
                      }
                      size="sm"
                    />
                    <Label className="text-sm font-medium text-gray-700">Descrição Personalizada</Label>
                  </div>
                  <Textarea
                    placeholder="Acesso completo + recursos exclusivos"
                    value={promoConfig.customDescription || ''}
                    onChange={(e) => 
                      updatePromotionalConfig(plan.id, 'customDescription', e.target.value)
                    }
                    disabled={!displayConfig.showCustomDescription}
                    className="text-sm min-h-[60px] resize-none"
                  />
                </div>
              </div>

              {/* Display Colors - Always Available */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-gray-900">
                  <span className="text-sm font-medium">Cores de Exibição</span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-gray-700">Título</Label>
                    <Input
                      type="color"
                      value={promoConfig.titleColor || '#111827'}
                      onChange={(e) => 
                        updatePromotionalConfig(plan.id, 'titleColor', e.target.value)
                      }
                      className="h-8 w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-gray-700">Descrição</Label>
                    <Input
                      type="color"
                      value={promoConfig.descriptionColor || '#6B7280'}
                      onChange={(e) => 
                        updatePromotionalConfig(plan.id, 'descriptionColor', e.target.value)
                      }
                      className="h-8 w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-gray-700">Borda</Label>
                    <Input
                      type="color"
                      value={promoConfig.borderColor || '#E5E7EB'}
                      onChange={(e) => 
                        updatePromotionalConfig(plan.id, 'borderColor', e.target.value)
                      }
                      className="h-8 w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-gray-700">Fundo</Label>
                    <Input
                      type="color"
                      value={promoConfig.backgroundColor || ''}
                      onChange={(e) => 
                        updatePromotionalConfig(plan.id, 'backgroundColor', e.target.value)
                      }
                      className="h-8 w-full"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Promotional Features - Only visible when promotion is active */}
          {promoConfig.isActive && (
            <div className="space-y-6">
              {/* Promotional Features - Discount Specific */}
              <div className="space-y-4 p-4 bg-white border border-gray-200 rounded-lg">
                <div className="flex items-center gap-2 text-gray-900 mb-3">
                  <span className="text-sm font-semibold">Recursos de Desconto</span>
                  <span className="text-xs text-gray-500">(Apenas para promoções ativas)</span>
                </div>

                {/* Pricing Configuration */}
                <div className="space-y-4 p-4 bg-white border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-2 text-gray-900 mb-3">
                    <span className="text-sm font-semibold">Configuração de Preços</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Promotion Value */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">Valor da Promoção (R$)</Label>
                      <Input
                        type="text"
                        placeholder="0,00"
                        value={promoConfig.promotionValue ? `${(promoConfig.promotionValue / 100).toFixed(2).replace('.', ',')}` : ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          // Remove all non-numeric characters except comma
                          const numericValue = value.replace(/[^\d,]/g, '');
                          // Replace comma with dot for parsing
                          const parsedValue = parseFloat(numericValue.replace(',', '.') || '0');
                          if (!isNaN(parsedValue)) {
                            updatePromotionalConfig(plan.id, 'promotionValue', Math.round(parsedValue * 100));
                          }
                        }}
                        className="text-sm"
                      />
                    </div>

                    {/* Display Format */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">Formato de Exibição</Label>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <input
                            type="radio"
                            id={`percentage-${plan.id}`}
                            name={`displayFormat-${plan.id}`}
                            checked={promoConfig.displayAsPercentage || false}
                            onChange={() => updatePromotionalConfig(plan.id, 'displayAsPercentage', true)}
                            className="w-4 h-4 text-blue-600"
                          />
                          <label htmlFor={`percentage-${plan.id}`} className="text-sm text-gray-700">%</label>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="radio"
                            id={`nominal-${plan.id}`}
                            name={`displayFormat-${plan.id}`}
                            checked={!promoConfig.displayAsPercentage}
                            onChange={() => updatePromotionalConfig(plan.id, 'displayAsPercentage', false)}
                            className="w-4 h-4 text-blue-600"
                          />
                          <label htmlFor={`nominal-${plan.id}`} className="text-sm text-gray-700">R$</label>
                        </div>
                      </div>
                    </div>

                    {/* Show Discount */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={displayConfig.showDiscountAmount || false}
                          onCheckedChange={(checked) => 
                            updateDisplayConfig(plan.id, 'showDiscountAmount', checked)
                          }
                          size="sm"
                        />
                        <Label className="text-sm font-medium text-gray-700">Mostrar Desconto</Label>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Switch
                      checked={displayConfig.showSavingsAmount || false}
                      onCheckedChange={(checked) => 
                        updateDisplayConfig(plan.id, 'showSavingsAmount', checked)
                      }
                      size="sm"
                    />
                    <Label className="text-sm font-medium text-gray-700">Mostrar Economia Total</Label>
                  </div>
                </div>

                {/* Timer Configuration */}
                <div className="space-y-4 p-4 bg-white border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={displayConfig.showCountdownTimer || false}
                      onCheckedChange={(checked) => {
                        updateDisplayConfig(plan.id, 'showCountdownTimer', checked);
                        updatePromotionalConfig(plan.id, 'showCountdownTimer', checked);
                      }}
                      size="sm"
                    />
                    <Label className="text-sm font-semibold text-gray-900">Contador Regressivo</Label>
                  </div>

                  {displayConfig.showCountdownTimer && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Data de Expiração
                      </Label>
                      <Input
                        type="datetime-local"
                        value={promoConfig.expiresAt || ''}
                        onChange={(e) => 
                          updatePromotionalConfig(plan.id, 'expiresAt', e.target.value)
                        }
                        className="text-sm"
                        lang="pt-BR"
                      />
                      {promoConfig.expiresAt && (
                        <p className="text-xs text-gray-500">
                          Expira em: {new Date(promoConfig.expiresAt).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit', 
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Individual Color Customization */}
                <div className="space-y-4 p-4 bg-white border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-2 text-gray-900 mb-3">
                    <span className="text-sm font-semibold">Cores dos Elementos</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Title Color */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">Cor do Título</Label>
                      <Input
                        type="color"
                        value={promoConfig.titleColor || '#111827'}
                        onChange={(e) => 
                          updatePromotionalConfig(plan.id, 'titleColor', e.target.value)
                        }
                        className="h-8 w-full"
                      />
                    </div>

                    {/* Description Color */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">Cor da Descrição</Label>
                      <Input
                        type="color"
                        value={promoConfig.descriptionColor || '#6B7280'}
                        onChange={(e) => 
                          updatePromotionalConfig(plan.id, 'descriptionColor', e.target.value)
                        }
                        className="h-8 w-full"
                      />
                    </div>

                    {/* Timer Color */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">Cor do Timer</Label>
                      <Input
                        type="color"
                        value={promoConfig.timerColor || '#374151'}
                        onChange={(e) => 
                          updatePromotionalConfig(plan.id, 'timerColor', e.target.value)
                        }
                        className="h-8 w-full"
                      />
                    </div>

                    {/* Border Color */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">Cor da Borda</Label>
                      <Input
                        type="color"
                        value={promoConfig.borderColor || '#E5E7EB'}
                        onChange={(e) => 
                          updatePromotionalConfig(plan.id, 'borderColor', e.target.value)
                        }
                        className="h-8 w-full"
                      />
                    </div>

                    {/* Discount Tag Background */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">Fundo Tag de Desconto</Label>
                      <Input
                        type="color"
                        value={promoConfig.discountTagBackgroundColor || '#111827'}
                        onChange={(e) => 
                          updatePromotionalConfig(plan.id, 'discountTagBackgroundColor', e.target.value)
                        }
                        className="h-8 w-full"
                      />
                    </div>

                    {/* Discount Tag Text */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">Texto Tag de Desconto</Label>
                      <Input
                        type="color"
                        value={promoConfig.discountTagTextColor || '#FFFFFF'}
                        onChange={(e) => 
                          updatePromotionalConfig(plan.id, 'discountTagTextColor', e.target.value)
                        }
                        className="h-8 w-full"
                      />
                    </div>

                    {/* Savings Color */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">Cor "Economia de..."</Label>
                      <Input
                        type="color"
                        value={promoConfig.savingsColor || '#059669'}
                        onChange={(e) => 
                          updatePromotionalConfig(plan.id, 'savingsColor', e.target.value)
                        }
                        className="h-8 w-full"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-200">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => togglePreview(plan.id)}
                className="text-xs"
              >
                <Eye className="h-3 w-3 mr-1" />
                {showPreview[plan.id] ? 'Ocultar Preview' : 'Ver Preview'}
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="default"
                size="sm"
                onClick={() => savePromotionalConfig(plan.id)}
                disabled={updatePromotionalConfigMutation.isPending}
                className="text-xs"
              >
                <Save className="h-3 w-3 mr-1" />
                {updatePromotionalConfigMutation.isPending ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </div>

          {/* Preview Section */}
          {showPreview[plan.id] && (
            <div className="mt-4 p-3 bg-white border border-gray-200 rounded-lg">
              <div className="text-xs text-gray-600 mb-2 flex items-center gap-1">
                <Eye className="h-3 w-3" />
                Preview do Plano:
              </div>
              <EnhancedPlanDisplay 
                plan={{
                  ...plan,
                  promotional_config: promotionalConfigs[plan.id],
                  display_config: displayConfigs[plan.id]
                }}
                className="max-w-md"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}