// ABOUTME: Promotional configuration section V2.0 component for PaymentPlansV2 visual customization
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Settings, ChevronDown, ChevronUp, Clock, Eye, Palette } from 'lucide-react';
import type { PromotionalConfigV2, DisplayConfigV2 } from '@/types/paymentV2.types';

interface PromotionalConfigurationSectionV2Props {
  promotionalConfig: PromotionalConfigV2;
  displayConfig: DisplayConfigV2;
  discountConfig: { enabled: boolean; type: 'percentage' | 'fixed_amount'; percentage?: number; fixedAmount?: number };
  onPromotionalConfigChange: (updates: Partial<PromotionalConfigV2>) => void;
  onDisplayConfigChange: (updates: Partial<DisplayConfigV2>) => void;
}

export function PromotionalConfigurationSectionV2({
  promotionalConfig,
  displayConfig,
  discountConfig,
  onPromotionalConfigChange,
  onDisplayConfigChange
}: PromotionalConfigurationSectionV2Props) {
  const [isExpanded, setIsExpanded] = React.useState(false);

  // Calculate current promotion value from discount config
  const currentPromotionValue = React.useMemo(() => {
    if (!discountConfig.enabled) return 0;
    if (discountConfig.type === 'percentage') {
      return (discountConfig.percentage || 0) * 100; // Convert to percentage display
    } else {
      return discountConfig.fixedAmount || 0;
    }
  }, [discountConfig]);

  // Check if discount is enabled (promotional features are only available with discounts)
  const hasDiscount = discountConfig.enabled && currentPromotionValue > 0;

  // Auto-sync promotional config with discount config
  React.useEffect(() => {
    if (hasDiscount) {
      onPromotionalConfigChange({
        promotionValue: currentPromotionValue,
        displayAsPercentage: discountConfig.type === 'percentage'
      });
    }
  }, [currentPromotionValue, discountConfig.type, hasDiscount, onPromotionalConfigChange]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Palette className="h-4 w-4" />
          Personalização Visual
          <Badge variant="secondary" className="text-xs">
            {hasDiscount && promotionalConfig.isActive ? 'Ativa' : 'Inativa'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Discount Status */}
        {!hasDiscount && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-yellow-400" />
              <span className="text-sm font-medium text-yellow-800">
                Desconto Necessário
              </span>
            </div>
            <p className="text-sm text-yellow-700 mt-1">
              Para usar recursos promocionais visuais, primeiro configure um desconto na seção "Configuração de Desconto" acima.
            </p>
          </div>
        )}

        {/* Promotional Settings */}
        {hasDiscount && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Ativar Recursos Promocionais</Label>
                <p className="text-sm text-muted-foreground">
                  Habilita descontos visuais, countdown e customizações
                </p>
              </div>
              <Switch
                checked={promotionalConfig.isActive}
                onCheckedChange={(checked) => 
                  onPromotionalConfigChange({ isActive: checked })
                }
              />
            </div>

          {promotionalConfig.isActive && (
            <div className="space-y-4 pl-4 border-l-2 border-blue-200">
              
              {/* Current Promotion Value Display */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium text-blue-800">
                      Valor da Promoção (Baseado no Desconto Configurado)
                    </Label>
                    <p className="text-sm text-blue-600 mt-1">
                      {discountConfig.type === 'percentage' 
                        ? `${currentPromotionValue}% de desconto` 
                        : `R$ ${(currentPromotionValue / 100).toFixed(2).replace('.', ',')} de desconto`
                      }
                    </p>
                  </div>
                  <Badge variant="outline" className="bg-blue-100 text-blue-800">
                    {discountConfig.type === 'percentage' ? 'Percentual' : 'Valor Fixo'}
                  </Badge>
                </div>
                <p className="text-xs text-blue-600 mt-2">
                  💡 Para alterar o valor do desconto, use a seção "Configuração de Desconto" acima
                </p>
              </div>

              {/* Visual Features */}
              <div className="space-y-3">
                <Label>Elementos Visuais</Label>
                
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={promotionalConfig.showDiscountAmount}
                      onChange={(e) => 
                        onPromotionalConfigChange({ showDiscountAmount: e.target.checked })
                      }
                      className="rounded"
                    />
                    <span className="text-sm">Mostrar Valor do Desconto</span>
                  </label>
                  
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={promotionalConfig.showSavingsAmount}
                      onChange={(e) => 
                        onPromotionalConfigChange({ showSavingsAmount: e.target.checked })
                      }
                      className="rounded"
                    />
                    <span className="text-sm">Mostrar Economia Total</span>
                  </label>
                  
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={promotionalConfig.showCountdownTimer}
                      onChange={(e) => 
                        onPromotionalConfigChange({ showCountdownTimer: e.target.checked })
                      }
                      className="rounded"
                    />
                    <span className="text-sm">Countdown Timer</span>
                  </label>
                </div>
              </div>

              {/* Expiration Date */}
              {promotionalConfig.showCountdownTimer && (
                <div>
                  <Label htmlFor="expiresAt">Data de Expiração</Label>
                  <Input
                    id="expiresAt"
                    type="datetime-local"
                    value={promotionalConfig.expiresAt || ''}
                    onChange={(e) => 
                      onPromotionalConfigChange({ expiresAt: e.target.value })
                    }
                  />
                </div>
              )}
            </div>
          )}
          </div>
        )}

        <Separator />

        {/* Display Customization */}
        <div className="space-y-4">
          <Label className="text-base font-semibold">Customização de Exibição</Label>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="customName">Nome Customizado</Label>
              <Input
                id="customName"
                value={displayConfig.customName || ''}
                onChange={(e) => 
                  onDisplayConfigChange({ customName: e.target.value })
                }
                placeholder="Nome promocional do plano"
              />
              <div className="flex items-center space-x-2 mt-2">
                <input
                  type="checkbox"
                  checked={displayConfig.showCustomName || false}
                  onChange={(e) => 
                    onDisplayConfigChange({ showCustomName: e.target.checked })
                  }
                  className="rounded"
                />
                <span className="text-sm">Usar nome customizado</span>
              </div>
            </div>
            
            <div>
              <Label htmlFor="customDescription">Descrição Customizada</Label>
              <Textarea
                id="customDescription"
                value={displayConfig.customDescription || ''}
                onChange={(e) => 
                  onDisplayConfigChange({ customDescription: e.target.value })
                }
                placeholder="Descrição promocional..."
                rows={3}
              />
              <div className="flex items-center space-x-2 mt-2">
                <input
                  type="checkbox"
                  checked={displayConfig.showCustomDescription || false}
                  onChange={(e) => 
                    onDisplayConfigChange({ showCustomDescription: e.target.checked })
                  }
                  className="rounded"
                />
                <span className="text-sm">Usar descrição customizada</span>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Color Customization */}
        <div className="space-y-4">
          <Label className="text-base font-semibold">Personalização de Cores</Label>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="titleColor">Cor do Título</Label>
              <Input
                id="titleColor"
                type="color"
                value={promotionalConfig.titleColor || '#111827'}
                onChange={(e) => 
                  onPromotionalConfigChange({ titleColor: e.target.value })
                }
              />
            </div>
            
            <div>
              <Label htmlFor="descriptionColor">Cor da Descrição</Label>
              <Input
                id="descriptionColor"
                type="color"
                value={promotionalConfig.descriptionColor || '#6B7280'}
                onChange={(e) => 
                  onPromotionalConfigChange({ descriptionColor: e.target.value })
                }
              />
            </div>
            
            <div>
              <Label htmlFor="borderColor">Cor da Borda</Label>
              <Input
                id="borderColor"
                type="color"
                value={promotionalConfig.borderColor || '#E5E7EB'}
                onChange={(e) => 
                  onPromotionalConfigChange({ borderColor: e.target.value })
                }
              />
            </div>
            
            <div>
              <Label htmlFor="savingsColor">Cor da Economia</Label>
              <Input
                id="savingsColor"
                type="color"
                value={promotionalConfig.savingsColor || '#059669'}
                onChange={(e) => 
                  onPromotionalConfigChange({ savingsColor: e.target.value })
                }
              />
            </div>
            
            <div>
              <Label htmlFor="discountTagBackgroundColor">Fundo do Tag de Desconto</Label>
              <Input
                id="discountTagBackgroundColor"
                type="color"
                value={promotionalConfig.discountTagBackgroundColor || '#111827'}
                onChange={(e) => 
                  onPromotionalConfigChange({ discountTagBackgroundColor: e.target.value })
                }
              />
            </div>
            
            <div>
              <Label htmlFor="discountTagTextColor">Texto do Tag de Desconto</Label>
              <Input
                id="discountTagTextColor"
                type="color"
                value={promotionalConfig.discountTagTextColor || '#FFFFFF'}
                onChange={(e) => 
                  onPromotionalConfigChange({ discountTagTextColor: e.target.value })
                }
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}