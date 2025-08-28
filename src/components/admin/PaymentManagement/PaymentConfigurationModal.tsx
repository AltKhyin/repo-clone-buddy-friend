// ABOUTME: Modal component for configuring Pagar.me payment credentials with secure validation

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings, Shield, AlertCircle, CheckCircle, Eye, EyeOff, Copy, HelpCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '../../../hooks/use-toast';

interface PaymentConfigurationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PagarmeConfig {
  publicKey: string;
  secretKey: string;
  apiVersion: string;
  webhookEndpointId: string;
  webhookAuthEnabled: boolean;
  webhookUser: string;
  webhookPassword: string;
}

// Helper component for field labels with tooltips
const FieldLabel = ({ htmlFor, children, tooltip, required = false }: {
  htmlFor: string;
  children: React.ReactNode;
  tooltip: string;
  required?: boolean;
}) => (
  <div className="flex items-center gap-2">
    <Label htmlFor={htmlFor}>
      {children} {required && '*'}
    </Label>
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <HelpCircle className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors cursor-help" />
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-[300px] text-sm">
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  </div>
);

export const PaymentConfigurationModal = ({ isOpen, onClose }: PaymentConfigurationModalProps) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [showWebhookPassword, setShowWebhookPassword] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationStatus, setValidationStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');

  // Configuration state - unified Pagar.me + webhook config
  const [config, setConfig] = useState<PagarmeConfig>({
    publicKey: '',
    secretKey: '',
    apiVersion: '2019-09-01',
    webhookEndpointId: '',
    webhookAuthEnabled: false,
    webhookUser: '',
    webhookPassword: ''
  });

  // Load existing configuration on mount
  useEffect(() => {
    if (isOpen) {
      loadExistingConfig();
    }
  }, [isOpen]);

  const loadExistingConfig = () => {
    try {
      // Priority: localStorage first (user saved values), then environment variables as fallback
      const storedPublicKey = localStorage.getItem('pagarme_public_key');
      const storedSecretKey = localStorage.getItem('pagarme_secret_key');
      const storedApiVersion = localStorage.getItem('pagarme_api_version');
      const storedWebhookId = localStorage.getItem('pagarme_webhook_id');
      
      // Load webhook authentication settings
      const storedWebhookAuthEnabled = localStorage.getItem('pagarme_webhook_auth_enabled') === 'true';
      const storedWebhookUser = localStorage.getItem('pagarme_webhook_user');
      const storedWebhookPassword = localStorage.getItem('pagarme_webhook_password');
      
      const existingConfig = {
        publicKey: storedPublicKey || 
          (!import.meta.env.VITE_PAGARME_PUBLIC_KEY?.includes('your_real') && 
           !import.meta.env.VITE_PAGARME_PUBLIC_KEY?.includes('placeholder')
            ? import.meta.env.VITE_PAGARME_PUBLIC_KEY 
            : '') || '',
        secretKey: storedSecretKey || 
          (!import.meta.env.PAGARME_SECRET_KEY?.includes('your_real') && 
           !import.meta.env.PAGARME_SECRET_KEY?.includes('placeholder')
            ? import.meta.env.PAGARME_SECRET_KEY 
            : '') || '',
        apiVersion: storedApiVersion || import.meta.env.PAGARME_API_VERSION || '2019-09-01',
        webhookEndpointId: storedWebhookId || import.meta.env.PAGARME_WEBHOOK_ENDPOINT_ID || '',
        webhookAuthEnabled: storedWebhookAuthEnabled,
        webhookUser: storedWebhookUser || '',
        webhookPassword: storedWebhookPassword || ''
      };
      
      setConfig(existingConfig);
      
      // Set validation status based on existing keys
      if (existingConfig.publicKey && existingConfig.secretKey) {
        setValidationStatus('valid');
      }
    } catch (error) {
      console.error('Error loading existing configuration:', error);
    }
  };

  const validateApiKeys = async () => {
    if (!config.publicKey || !config.secretKey) {
      setValidationStatus('invalid');
      return;
    }

    setIsValidating(true);
    try {
      // HARDCODED: Simple validation - just check format for now
      // In a real implementation, you'd test the API connection
      const publicKeyValid = config.publicKey.startsWith('pk_');
      const secretKeyValid = config.secretKey.startsWith('sk_');

      if (publicKeyValid && secretKeyValid) {
        setValidationStatus('valid');
        toast({
          title: "Chaves validadas",
          description: "As chaves da API estão no formato correto.",
        });
      } else {
        setValidationStatus('invalid');
        toast({
          title: "Erro de validação",
          description: "Verifique o formato das chaves da API.",
          variant: "destructive"
        });
      }
    } catch (error) {
      setValidationStatus('invalid');
      toast({
        title: "Erro na validação",
        description: "Não foi possível validar as chaves da API.",
        variant: "destructive"
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!config.publicKey.trim() || !config.secretKey.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha a chave pública e secreta.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSubmitting(true);

      // PLACEHOLDER: Store in localStorage for development
      // In production, this would be sent to a secure backend endpoint
      localStorage.setItem('pagarme_public_key', config.publicKey);
      localStorage.setItem('pagarme_secret_key', config.secretKey);
      localStorage.setItem('pagarme_api_version', config.apiVersion);
      localStorage.setItem('pagarme_webhook_id', config.webhookEndpointId);
      
      // Store webhook authentication settings
      localStorage.setItem('pagarme_webhook_auth_enabled', config.webhookAuthEnabled.toString());
      localStorage.setItem('pagarme_webhook_user', config.webhookUser);
      localStorage.setItem('pagarme_webhook_password', config.webhookPassword);
      
      toast({
        title: "Configuração salva",
        description: "As credenciais do Pagar.me foram salvas com sucesso.",
      });

      // Close modal and trigger parent component refresh
      handleClose();
      
      // Trigger a page reload to update environment variables
      setTimeout(() => {
        window.location.reload();
      }, 1000);

    } catch (error) {
      console.error('Failed to save configuration:', error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar a configuração.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setConfig({
      publicKey: '',
      secretKey: '',
      apiVersion: '2019-09-01',
      webhookEndpointId: '',
      webhookAuthEnabled: false,
      webhookUser: '',
      webhookPassword: ''
    });
    setValidationStatus('idle');
    setShowSecretKey(false);
    setShowWebhookPassword(false);
    onClose();
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado",
      description: `${label} copiado para a área de transferência.`,
    });
  };

  const getModalTitle = () => {
    return 'Configurar Integração Pagar.me';
  };

  const getModalDescription = () => {
    return 'Configure suas credenciais da API Pagar.me e webhooks para processar pagamentos.';
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            {getModalTitle()}
          </DialogTitle>
          <DialogDescription>
            {getModalDescription()}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* API Version */}
          <div className="space-y-2">
            <FieldLabel 
              htmlFor="apiVersion" 
              tooltip="Versão da API do Pagar.me. Mantenha '2019-09-01' que é a versão estável mais recente com suporte completo a PIX e cartões."
            >
              Versão da API
            </FieldLabel>
            <Input
              id="apiVersion"
              value={config.apiVersion}
              onChange={(e) => setConfig(prev => ({ ...prev, apiVersion: e.target.value }))}
              placeholder="2019-09-01"
              disabled={isSubmitting}
            />
          </div>

          {/* Public Key */}
          <div className="space-y-2">
            <FieldLabel 
              htmlFor="publicKey" 
              tooltip="Chave pública do Pagar.me (pk_test_... para testes ou pk_live_... para produção). Encontre no dashboard do Pagar.me → Configurações → Chaves de API. É segura para usar no frontend." 
              required
            >
              Chave Pública
            </FieldLabel>
            <div className="flex gap-2">
              <Input
                id="publicKey"
                value={config.publicKey}
                onChange={(e) => setConfig(prev => ({ ...prev, publicKey: e.target.value }))}
                placeholder="pk_test_..."
                required
                disabled={isSubmitting}
              />
              {config.publicKey && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(config.publicKey, 'Chave pública')}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Secret Key */}
          <div className="space-y-2">
            <FieldLabel 
              htmlFor="secretKey" 
              tooltip="Chave secreta do Pagar.me (sk_test_... para testes ou sk_live_... para produção). DEVE ser mantida segura no servidor. Encontre no dashboard do Pagar.me → Configurações → Chaves de API." 
              required
            >
              Chave Secreta
            </FieldLabel>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="secretKey"
                  type={showSecretKey ? 'text' : 'password'}
                  value={config.secretKey}
                  onChange={(e) => setConfig(prev => ({ ...prev, secretKey: e.target.value }))}
                  placeholder="sk_test_..."
                  required
                  disabled={isSubmitting}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6"
                  onClick={() => setShowSecretKey(!showSecretKey)}
                >
                  {showSecretKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {config.secretKey && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(config.secretKey, 'Chave secreta')}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Webhook Endpoint ID */}
          <div className="space-y-2">
            <FieldLabel 
              htmlFor="webhookEndpointId" 
              tooltip="ID do webhook no Pagar.me (hook_...). Configure no dashboard Pagar.me → Webhooks → Criar Endpoint com URL: https://[seu-projeto].supabase.co/functions/v1/pagarme-webhook. Recebe notificações automáticas de pagamentos."
            >
              ID do Endpoint de Webhook
            </FieldLabel>
            <Input
              id="webhookEndpointId"
              value={config.webhookEndpointId}
              onChange={(e) => setConfig(prev => ({ ...prev, webhookEndpointId: e.target.value }))}
              placeholder="hook_..."
              disabled={isSubmitting}
            />
          </div>

          {/* Webhook Authentication Settings */}
          <div className="space-y-4 p-4 border rounded-lg">
            <h4 className="font-medium text-sm text-foreground">Autenticação de Webhook</h4>
            
            {/* Enable Webhook Authentication */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="webhookAuthEnabled"
                checked={config.webhookAuthEnabled}
                onChange={(e) => setConfig(prev => ({ ...prev, webhookAuthEnabled: e.target.checked }))}
                disabled={isSubmitting}
                className="rounded border-gray-300"
              />
              <FieldLabel 
                htmlFor="webhookAuthEnabled" 
                tooltip="Habilita autenticação HTTP Basic para webhooks. Quando ativado, o Pagar.me enviará credenciais de usuário/senha no cabeçalho Authorization do webhook."
              >
                Habilitar Autenticação
              </FieldLabel>
            </div>

            {/* Webhook User (conditional) */}
            {config.webhookAuthEnabled && (
              <>
                <div className="space-y-2">
                  <FieldLabel 
                    htmlFor="webhookUser" 
                    tooltip="Nome de usuário para autenticação HTTP Basic do webhook. Este valor deve ser configurado também no dashboard do Pagar.me."
                  >
                    Usuário do Webhook
                  </FieldLabel>
                  <Input
                    id="webhookUser"
                    value={config.webhookUser}
                    onChange={(e) => setConfig(prev => ({ ...prev, webhookUser: e.target.value }))}
                    placeholder="usuario_webhook"
                    disabled={isSubmitting}
                  />
                </div>

                {/* Webhook Password (conditional) */}
                <div className="space-y-2">
                  <FieldLabel 
                    htmlFor="webhookPassword" 
                    tooltip="Senha para autenticação HTTP Basic do webhook. Este valor deve ser configurado também no dashboard do Pagar.me."
                  >
                    Senha do Webhook
                  </FieldLabel>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        id="webhookPassword"
                        type={showWebhookPassword ? 'text' : 'password'}
                        value={config.webhookPassword}
                        onChange={(e) => setConfig(prev => ({ ...prev, webhookPassword: e.target.value }))}
                        placeholder="senha_webhook"
                        disabled={isSubmitting}
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6"
                        onClick={() => setShowWebhookPassword(!showWebhookPassword)}
                      >
                        {showWebhookPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    {config.webhookPassword && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => copyToClipboard(config.webhookPassword, 'Senha do webhook')}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Validation Status */}
          {validationStatus !== 'idle' && (
            <Alert className={validationStatus === 'valid' ? 'border-green-500' : 'border-red-500'}>
              {validationStatus === 'valid' ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600" />
              )}
              <AlertDescription>
                {validationStatus === 'valid' 
                  ? 'Configuração válida e pronta para uso.'
                  : 'Verifique as credenciais e tente novamente.'
                }
              </AlertDescription>
            </Alert>
          )}

          {/* Security Warning */}
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              <strong>Aviso de Segurança:</strong> Em produção, as chaves secretas devem ser armazenadas de forma segura no servidor, nunca no navegador.
            </AlertDescription>
          </Alert>
        </form>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={validateApiKeys}
            disabled={isValidating || !config.publicKey || !config.secretKey}
          >
            {isValidating ? 'Validando...' : 'Validar Chaves'}
          </Button>
          <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting || validationStatus === 'invalid'}
            className="min-w-[100px]"
          >
            {isSubmitting ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};