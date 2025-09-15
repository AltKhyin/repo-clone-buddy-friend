// ABOUTME: Component for managing customer support contact settings in admin panel

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { MessageCircle, Mail, Phone, Globe, Save, AlertCircle, Link, Settings } from 'lucide-react';
import { useCustomerSupportSettings, useUpdateCustomerSupportSettings, type CustomerSupportSettings } from '@/hooks/useCustomerSupportSettings';
import { toast } from 'sonner';

export const CustomerSupportSettingsCard: React.FC = () => {
  const { data: settings, isLoading, error } = useCustomerSupportSettings();
  const updateSettingsMutation = useUpdateCustomerSupportSettings();
  
  const [formData, setFormData] = useState<CustomerSupportSettings>({
    mode: 'simple',
    supportUrl: '',
    email: '',
    phone: '',
    whatsapp: '',
    website: ''
  });
  
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Update form when settings are loaded
  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  const handleInputChange = (field: keyof CustomerSupportSettings, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Check if there are unsaved changes
    if (settings) {
      const hasChanges = Object.keys(formData).some(key => 
        formData[key as keyof CustomerSupportSettings] !== settings[key as keyof CustomerSupportSettings]
      ) || formData[field] !== settings[field];
      setHasUnsavedChanges(hasChanges);
    }
  };

  const handleSave = async () => {
    // Validate based on mode
    if (formData.mode === 'simple') {
      // Simple mode: validate support URL
      if (!formData.supportUrl || !formData.supportUrl.trim()) {
        toast.error('URL de suporte é obrigatório no modo simples');
        return;
      }

      // Basic URL validation
      try {
        new URL(formData.supportUrl);
      } catch {
        toast.error('Por favor, insira uma URL válida (ex: https://evidens.com.br/suporte)');
        return;
      }
    } else {
      // Advanced mode: validate email field
      if (!formData.email || !formData.email.trim()) {
        toast.error('Email é obrigatório no modo avançado');
        return;
      }

      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        toast.error('Por favor, insira um email válido');
        return;
      }
    }

    try {
      await updateSettingsMutation.mutateAsync(formData);
      setHasUnsavedChanges(false);
    } catch (error) {
      // Error is handled by the mutation's onError
    }
  };

  const handleReset = () => {
    if (settings) {
      setFormData(settings);
      setHasUnsavedChanges(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            <CardTitle>Configurações de Suporte</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            <CardTitle>Configurações de Suporte</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500 opacity-50" />
            <p className="text-red-600 mb-4">Erro ao carregar configurações</p>
            <Button onClick={() => window.location.reload()} variant="outline">
              Tentar Novamente
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <MessageCircle className="h-5 w-5" />
              Configurações de Suporte
            </CardTitle>
            <CardDescription className="mt-1">
              Configure os contatos de suporte exibidos nas páginas de pagamento e autenticação
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-xs">
            Passo 3
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Mode Toggle */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Modo de Configuração</Label>
              <p className="text-xs text-muted-foreground mt-1">
                Escolha entre configuração simples (URL única) ou avançada (múltiplos contatos)
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm">
                <Link className="h-4 w-4" />
                <span className={formData.mode === 'simple' ? 'font-medium' : 'text-muted-foreground'}>
                  Simples
                </span>
              </div>
              <Switch
                checked={formData.mode === 'advanced'}
                onCheckedChange={(checked) => 
                  handleInputChange('mode', checked ? 'advanced' : 'simple')
                }
              />
              <div className="flex items-center gap-2 text-sm">
                <Settings className="h-4 w-4" />
                <span className={formData.mode === 'advanced' ? 'font-medium' : 'text-muted-foreground'}>
                  Avançado
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Simple Mode */}
        {formData.mode === 'simple' && (
          <div className="space-y-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <Label htmlFor="support-url" className="text-sm font-medium flex items-center gap-2">
              <Link className="h-4 w-4" />
              URL de Suporte *
            </Label>
            <Input
              id="support-url"
              type="url"
              placeholder="https://evidens.com.br/suporte"
              value={formData.supportUrl}
              onChange={(e) => handleInputChange('supportUrl', e.target.value)}
              className="h-10"
              required
            />
            <p className="text-xs text-muted-foreground">
              URL única para onde os usuários serão redirecionados ao clicar "Entre em contato".
              Pode ser seu site, WhatsApp, formulário de contato, etc.
            </p>
          </div>
        )}

        {/* Advanced Mode */}
        {formData.mode === 'advanced' && (
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            {/* Email Field (Required) */}
            <div className="space-y-2">
              <Label htmlFor="support-email" className="text-sm font-medium flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email de Suporte *
              </Label>
              <Input
                id="support-email"
                type="email"
                placeholder="suporte@igoreckert.com.br"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="h-10"
                required
              />
              <p className="text-xs text-muted-foreground">
                Email principal para contato. Será exibido em casos de erro ou problemas de pagamento.
              </p>
            </div>

            {/* Phone Field (Optional) */}
            <div className="space-y-2">
              <Label htmlFor="support-phone" className="text-sm font-medium flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Telefone (Opcional)
              </Label>
              <Input
                id="support-phone"
                type="tel"
                placeholder="+55 (11) 99999-9999"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className="h-10"
              />
            </div>

            {/* WhatsApp Field (Optional) */}
            <div className="space-y-2">
              <Label htmlFor="support-whatsapp" className="text-sm font-medium flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                WhatsApp (Opcional)
              </Label>
              <Input
                id="support-whatsapp"
                type="tel"
                placeholder="+55 11 99999-9999"
                value={formData.whatsapp}
                onChange={(e) => handleInputChange('whatsapp', e.target.value)}
                className="h-10"
              />
              <p className="text-xs text-muted-foreground">
                Número do WhatsApp com código do país (ex: +55 11 99999-9999)
              </p>
            </div>

            {/* Website Field (Optional) */}
            <div className="space-y-2">
              <Label htmlFor="support-website" className="text-sm font-medium flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Website/FAQ (Opcional)
              </Label>
              <Input
                id="support-website"
                type="url"
                placeholder="https://evidens.com.br/suporte"
                value={formData.website}
                onChange={(e) => handleInputChange('website', e.target.value)}
                className="h-10"
              />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-xs text-muted-foreground">
            {hasUnsavedChanges && (
              <span className="text-amber-600 flex items-center gap-1">
                <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                Alterações não salvas
              </span>
            )}
          </div>
          
          <div className="flex gap-3">
            {hasUnsavedChanges && (
              <Button
                type="button"
                variant="outline"
                onClick={handleReset}
                disabled={updateSettingsMutation.isPending}
              >
                Cancelar
              </Button>
            )}
            
            <Button
              onClick={handleSave}
              disabled={updateSettingsMutation.isPending || !hasUnsavedChanges}
              className="flex items-center gap-2"
            >
              {updateSettingsMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Salvar Alterações
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Preview Section */}
        {((formData.mode === 'simple' && formData.supportUrl) || 
          (formData.mode === 'advanced' && formData.email)) && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Preview</h4>
            <p className="text-sm text-gray-600 mb-2">
              Como aparecerá nos formulários de pagamento:
            </p>
            <div className="text-sm text-gray-500 bg-white p-3 rounded-lg border">
              <p>Problemas com o pagamento?{' '}
                <a 
                  href={formData.mode === 'simple' ? formData.supportUrl : `mailto:${formData.email}`}
                  className="text-black font-medium hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Entre em contato
                </a>
              </p>
            </div>
            {formData.mode === 'simple' && formData.supportUrl && (
              <p className="text-xs text-muted-foreground mt-2">
                Link será aberto em nova aba: {formData.supportUrl}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};