// ABOUTME: Admin payment creation modal with support for custom one-time payments and subscription plans

import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  CreditCard,
  QrCode,
  Calendar,
  DollarSign,
  User,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  Info,
} from 'lucide-react';

interface User {
  id: string;
  full_name: string;
  email: string;
  subscription_tier: string;
}

interface AdminPaymentCreationModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
  paymentType: 'one-time' | 'subscription' | null;
  onPaymentCreate: (paymentData: any) => Promise<any>;
  isLoading?: boolean;
}

interface PaymentFormData {
  // Common fields
  amount: string;
  description: string;
  adminNotes: string;
  paymentMethod: 'pix' | 'credit_card';
  
  // One-time payment specific
  subscriptionDaysToGrant: string;
  
  // Subscription specific
  planName: string;
  billingInterval: 'month' | 'year';
  intervalCount: string;
  trialDays: string;
  
  // Customer data
  customerName: string;
  customerEmail: string;
  customerDocument: string;
  customerPhone: string;
  
  // Billing address (for credit card)
  addressLine1: string;
  addressZipCode: string;
  addressCity: string;
  addressState: string;
  addressCountry: string;
  
  // Card data (for credit card payments)
  cardNumber: string;
  cardHolderName: string;
  cardExpiryMonth: string;
  cardExpiryYear: string;
  cardCVV: string;
}

const initialFormData: PaymentFormData = {
  amount: '',
  description: '',
  adminNotes: '',
  paymentMethod: 'pix',
  subscriptionDaysToGrant: '30',
  planName: '',
  billingInterval: 'month',
  intervalCount: '1',
  trialDays: '0',
  customerName: '',
  customerEmail: '',
  customerDocument: '',
  customerPhone: '',
  addressLine1: '',
  addressZipCode: '',
  addressCity: '',
  addressState: '',
  addressCountry: 'BR',
  cardNumber: '',
  cardHolderName: '',
  cardExpiryMonth: '',
  cardExpiryYear: '',
  cardCVV: '',
};

export const AdminPaymentCreationModal: React.FC<AdminPaymentCreationModalProps> = ({
  isOpen,
  onOpenChange,
  user,
  paymentType,
  onPaymentCreate,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<PaymentFormData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [step, setStep] = useState<'details' | 'customer' | 'payment' | 'review'>('details');

  // Auto-populate customer data when user changes
  React.useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        customerName: user.full_name || '',
        customerEmail: user.email || '',
      }));
    }
  }, [user]);

  // Reset form when modal closes
  React.useEffect(() => {
    if (!isOpen) {
      setFormData(initialFormData);
      setErrors({});
      setStep('details');
    }
  }, [isOpen]);

  const updateFormData = (field: keyof PaymentFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateStep = (currentStep: string): boolean => {
    const newErrors: Record<string, string> = {};

    if (currentStep === 'details') {
      if (!formData.amount || parseFloat(formData.amount) <= 0) {
        newErrors.amount = 'Valor deve ser maior que zero';
      }
      if (!formData.description.trim()) {
        newErrors.description = 'Descrição é obrigatória';
      }
      
      if (paymentType === 'one-time') {
        if (!formData.subscriptionDaysToGrant || parseInt(formData.subscriptionDaysToGrant) < 1) {
          newErrors.subscriptionDaysToGrant = 'Deve conceder pelo menos 1 dia';
        }
      } else if (paymentType === 'subscription') {
        if (!formData.planName.trim()) {
          newErrors.planName = 'Nome do plano é obrigatório';
        }
        if (!formData.intervalCount || parseInt(formData.intervalCount) < 1 || parseInt(formData.intervalCount) > 12) {
          newErrors.intervalCount = 'Intervalo deve ser entre 1 e 12';
        }
      }
    }

    if (currentStep === 'customer') {
      if (!formData.customerName.trim()) {
        newErrors.customerName = 'Nome é obrigatório';
      }
      if (!formData.customerEmail.trim()) {
        newErrors.customerEmail = 'Email é obrigatório';
      }
      if (!formData.customerDocument.trim()) {
        newErrors.customerDocument = 'Documento é obrigatório';
      }
      if (!formData.customerPhone.trim()) {
        newErrors.customerPhone = 'Telefone é obrigatório';
      }
    }

    if (currentStep === 'payment' && formData.paymentMethod === 'credit_card') {
      if (!formData.cardNumber.trim()) {
        newErrors.cardNumber = 'Número do cartão é obrigatório';
      }
      if (!formData.cardHolderName.trim()) {
        newErrors.cardHolderName = 'Nome no cartão é obrigatório';
      }
      if (!formData.cardExpiryMonth.trim()) {
        newErrors.cardExpiryMonth = 'Mês de expiração é obrigatório';
      }
      if (!formData.cardExpiryYear.trim()) {
        newErrors.cardExpiryYear = 'Ano de expiração é obrigatório';
      }
      if (!formData.cardCVV.trim()) {
        newErrors.cardCVV = 'CVV é obrigatório';
      }
      if (!formData.addressLine1.trim()) {
        newErrors.addressLine1 = 'Endereço é obrigatório';
      }
      if (!formData.addressZipCode.trim()) {
        newErrors.addressZipCode = 'CEP é obrigatório';
      }
      if (!formData.addressCity.trim()) {
        newErrors.addressCity = 'Cidade é obrigatória';
      }
      if (!formData.addressState.trim()) {
        newErrors.addressState = 'Estado é obrigatório';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (!validateStep(step)) return;

    const steps = ['details', 'customer', 'payment', 'review'];
    const currentIndex = steps.indexOf(step);
    if (currentIndex < steps.length - 1) {
      setStep(steps[currentIndex + 1] as any);
    }
  };

  const handleBack = () => {
    const steps = ['details', 'customer', 'payment', 'review'];
    const currentIndex = steps.indexOf(step);
    if (currentIndex > 0) {
      setStep(steps[currentIndex - 1] as any);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep('review') || !user) return;

    try {
      const amountInCents = Math.round(parseFloat(formData.amount) * 100);
      
      const basePaymentData = {
        targetUserId: user.id,
        amount: amountInCents,
        description: formData.description,
        paymentMethod: formData.paymentMethod,
        adminNotes: formData.adminNotes,
        metadata: {
          customerName: formData.customerName,
          customerEmail: formData.customerEmail,
          customerDocument: formData.customerDocument,
          customerPhone: formData.customerPhone,
          planName: paymentType === 'one-time' ? 'Pagamento Único Admin' : formData.planName,
          adminCreated: true,
          adminUserId: '', // Will be set by the Edge Function
        },
        billingAddress: formData.paymentMethod === 'credit_card' ? {
          line_1: formData.addressLine1,
          zip_code: formData.addressZipCode,
          city: formData.addressCity,
          state: formData.addressState,
          country: formData.addressCountry,
        } : undefined,
        cardData: formData.paymentMethod === 'credit_card' ? {
          number: formData.cardNumber,
          holderName: formData.cardHolderName,
          expirationMonth: formData.cardExpiryMonth,
          expirationYear: formData.cardExpiryYear,
          cvv: formData.cardCVV,
        } : undefined,
      };

      let paymentData;
      
      if (paymentType === 'one-time') {
        paymentData = {
          ...basePaymentData,
          subscriptionDaysToGrant: parseInt(formData.subscriptionDaysToGrant),
          cardToken: formData.paymentMethod === 'credit_card' ? 'tokenize_on_server' : undefined,
        };
      } else {
        paymentData = {
          ...basePaymentData,
          planName: formData.planName,
          billingInterval: formData.billingInterval,
          intervalCount: parseInt(formData.intervalCount),
          trialDays: parseInt(formData.trialDays),
          cardToken: formData.paymentMethod === 'credit_card' ? 'tokenize_on_server' : undefined,
        };
      }

      await onPaymentCreate(paymentData);
      onOpenChange(false);
    } catch (error) {
      console.error('Payment creation failed:', error);
    }
  };

  const formatCurrency = (value: string): string => {
    if (!value) return '';
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return '';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(numValue);
  };

  const getStepTitle = (): string => {
    switch (step) {
      case 'details': return 'Detalhes do Pagamento';
      case 'customer': return 'Dados do Cliente';
      case 'payment': return 'Método de Pagamento';
      case 'review': return 'Revisão Final';
      default: return '';
    }
  };

  if (!user || !paymentType) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            {paymentType === 'one-time' ? 'Criar Pagamento Único' : 'Criar Plano de Assinatura'}
          </DialogTitle>
          <DialogDescription>
            {paymentType === 'one-time' 
              ? 'Criar um pagamento único que concede tempo de assinatura imediatamente'
              : 'Criar um plano de assinatura recorrente com cobrança automática'
            }
          </DialogDescription>
        </DialogHeader>

        {/* Progress indicator */}
        <div className="flex items-center gap-2 mb-6">
          {['details', 'customer', 'payment', 'review'].map((s, index) => (
            <React.Fragment key={s}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                s === step ? 'bg-primary text-primary-foreground' :
                ['details', 'customer', 'payment', 'review'].indexOf(step) > index ? 'bg-primary/20 text-primary' :
                'bg-muted text-muted-foreground'
              }`}>
                {index + 1}
              </div>
              {index < 3 && <div className="flex-1 h-px bg-muted" />}
            </React.Fragment>
          ))}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{getStepTitle()}</CardTitle>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span className="text-sm">Para: {user.full_name} ({user.email})</span>
                <Badge variant={user.subscription_tier === 'premium' ? 'default' : 'secondary'}>
                  {user.subscription_tier === 'premium' ? 'Premium' : 'Gratuito'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {step === 'details' && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="amount">Valor (R$) *</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="0.00"
                      value={formData.amount}
                      onChange={(e) => updateFormData('amount', e.target.value)}
                      className={errors.amount ? 'border-red-500' : ''}
                    />
                    {errors.amount && <p className="text-sm text-red-500 mt-1">{errors.amount}</p>}
                    {formData.amount && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Valor: {formatCurrency(formData.amount)}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="description">Descrição *</Label>
                    <Input
                      id="description"
                      placeholder="Ex: Pagamento premium mensal"
                      value={formData.description}
                      onChange={(e) => updateFormData('description', e.target.value)}
                      className={errors.description ? 'border-red-500' : ''}
                    />
                    {errors.description && <p className="text-sm text-red-500 mt-1">{errors.description}</p>}
                  </div>

                  {paymentType === 'one-time' ? (
                    <div>
                      <Label htmlFor="subscriptionDays">Dias de assinatura a conceder *</Label>
                      <Input
                        id="subscriptionDays"
                        type="number"
                        min="1"
                        max="3650"
                        placeholder="30"
                        value={formData.subscriptionDaysToGrant}
                        onChange={(e) => updateFormData('subscriptionDaysToGrant', e.target.value)}
                        className={errors.subscriptionDaysToGrant ? 'border-red-500' : ''}
                      />
                      {errors.subscriptionDaysToGrant && <p className="text-sm text-red-500 mt-1">{errors.subscriptionDaysToGrant}</p>}
                      <p className="text-sm text-muted-foreground mt-1">
                        O usuário receberá acesso premium por este período após o pagamento
                      </p>
                    </div>
                  ) : (
                    <>
                      <div>
                        <Label htmlFor="planName">Nome do plano *</Label>
                        <Input
                          id="planName"
                          placeholder="Ex: Premium Mensal Personalizado"
                          value={formData.planName}
                          onChange={(e) => updateFormData('planName', e.target.value)}
                          className={errors.planName ? 'border-red-500' : ''}
                        />
                        {errors.planName && <p className="text-sm text-red-500 mt-1">{errors.planName}</p>}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="billingInterval">Intervalo de cobrança *</Label>
                          <Select value={formData.billingInterval} onValueChange={(value: 'month' | 'year') => updateFormData('billingInterval', value)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="month">Mensal</SelectItem>
                              <SelectItem value="year">Anual</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="intervalCount">Quantidade de intervalos *</Label>
                          <Input
                            id="intervalCount"
                            type="number"
                            min="1"
                            max="12"
                            placeholder="1"
                            value={formData.intervalCount}
                            onChange={(e) => updateFormData('intervalCount', e.target.value)}
                            className={errors.intervalCount ? 'border-red-500' : ''}
                          />
                          {errors.intervalCount && <p className="text-sm text-red-500 mt-1">{errors.intervalCount}</p>}
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="trialDays">Dias de trial (opcional)</Label>
                        <Input
                          id="trialDays"
                          type="number"
                          min="0"
                          max="365"
                          placeholder="0"
                          value={formData.trialDays}
                          onChange={(e) => updateFormData('trialDays', e.target.value)}
                        />
                        <p className="text-sm text-muted-foreground mt-1">
                          Deixe 0 para começar cobrando imediatamente
                        </p>
                      </div>
                    </>
                  )}

                  <div>
                    <Label htmlFor="adminNotes">Notas do admin (opcional)</Label>
                    <Textarea
                      id="adminNotes"
                      placeholder="Observações internas sobre este pagamento..."
                      value={formData.adminNotes}
                      onChange={(e) => updateFormData('adminNotes', e.target.value)}
                    />
                  </div>
                </div>
              )}

              {step === 'customer' && (
                <div className="space-y-4">
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      Estes dados serão usados para criar o cliente no sistema de pagamentos.
                    </AlertDescription>
                  </Alert>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="customerName">Nome completo *</Label>
                      <Input
                        id="customerName"
                        placeholder="Nome do cliente"
                        value={formData.customerName}
                        onChange={(e) => updateFormData('customerName', e.target.value)}
                        className={errors.customerName ? 'border-red-500' : ''}
                      />
                      {errors.customerName && <p className="text-sm text-red-500 mt-1">{errors.customerName}</p>}
                    </div>

                    <div>
                      <Label htmlFor="customerEmail">Email *</Label>
                      <Input
                        id="customerEmail"
                        type="email"
                        placeholder="email@exemplo.com"
                        value={formData.customerEmail}
                        onChange={(e) => updateFormData('customerEmail', e.target.value)}
                        className={errors.customerEmail ? 'border-red-500' : ''}
                      />
                      {errors.customerEmail && <p className="text-sm text-red-500 mt-1">{errors.customerEmail}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="customerDocument">CPF/CNPJ *</Label>
                      <Input
                        id="customerDocument"
                        placeholder="000.000.000-00"
                        value={formData.customerDocument}
                        onChange={(e) => updateFormData('customerDocument', e.target.value)}
                        className={errors.customerDocument ? 'border-red-500' : ''}
                      />
                      {errors.customerDocument && <p className="text-sm text-red-500 mt-1">{errors.customerDocument}</p>}
                    </div>

                    <div>
                      <Label htmlFor="customerPhone">Telefone *</Label>
                      <Input
                        id="customerPhone"
                        placeholder="(11) 99999-9999"
                        value={formData.customerPhone}
                        onChange={(e) => updateFormData('customerPhone', e.target.value)}
                        className={errors.customerPhone ? 'border-red-500' : ''}
                      />
                      {errors.customerPhone && <p className="text-sm text-red-500 mt-1">{errors.customerPhone}</p>}
                    </div>
                  </div>
                </div>
              )}

              {step === 'payment' && (
                <div className="space-y-4">
                  <div>
                    <Label>Método de pagamento *</Label>
                    <Tabs value={formData.paymentMethod} onValueChange={(value: string) => updateFormData('paymentMethod', value as 'pix' | 'credit_card')}>
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="pix" className="flex items-center gap-2">
                          <QrCode className="h-4 w-4" />
                          PIX
                        </TabsTrigger>
                        <TabsTrigger value="credit_card" className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4" />
                          Cartão de Crédito
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>

                  {formData.paymentMethod === 'pix' && (
                    <Alert>
                      <QrCode className="h-4 w-4" />
                      <AlertDescription>
                        Será gerado um código PIX que o cliente pode usar para pagamento. O PIX expira em 1 hora.
                      </AlertDescription>
                    </Alert>
                  )}

                  {formData.paymentMethod === 'credit_card' && (
                    <>
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          Cartão será tokenizado de forma segura. Nunca armazenamos dados completos do cartão.
                        </AlertDescription>
                      </Alert>

                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="cardNumber">Número do cartão *</Label>
                          <Input
                            id="cardNumber"
                            placeholder="0000 0000 0000 0000"
                            value={formData.cardNumber}
                            onChange={(e) => updateFormData('cardNumber', e.target.value)}
                            className={errors.cardNumber ? 'border-red-500' : ''}
                          />
                          {errors.cardNumber && <p className="text-sm text-red-500 mt-1">{errors.cardNumber}</p>}
                        </div>

                        <div>
                          <Label htmlFor="cardHolderName">Nome no cartão *</Label>
                          <Input
                            id="cardHolderName"
                            placeholder="Nome como impresso no cartão"
                            value={formData.cardHolderName}
                            onChange={(e) => updateFormData('cardHolderName', e.target.value)}
                            className={errors.cardHolderName ? 'border-red-500' : ''}
                          />
                          {errors.cardHolderName && <p className="text-sm text-red-500 mt-1">{errors.cardHolderName}</p>}
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <Label htmlFor="cardExpiryMonth">Mês *</Label>
                            <Input
                              id="cardExpiryMonth"
                              placeholder="01"
                              maxLength={2}
                              value={formData.cardExpiryMonth}
                              onChange={(e) => updateFormData('cardExpiryMonth', e.target.value)}
                              className={errors.cardExpiryMonth ? 'border-red-500' : ''}
                            />
                            {errors.cardExpiryMonth && <p className="text-sm text-red-500 mt-1">{errors.cardExpiryMonth}</p>}
                          </div>

                          <div>
                            <Label htmlFor="cardExpiryYear">Ano *</Label>
                            <Input
                              id="cardExpiryYear"
                              placeholder="25"
                              maxLength={2}
                              value={formData.cardExpiryYear}
                              onChange={(e) => updateFormData('cardExpiryYear', e.target.value)}
                              className={errors.cardExpiryYear ? 'border-red-500' : ''}
                            />
                            {errors.cardExpiryYear && <p className="text-sm text-red-500 mt-1">{errors.cardExpiryYear}</p>}
                          </div>

                          <div>
                            <Label htmlFor="cardCVV">CVV *</Label>
                            <Input
                              id="cardCVV"
                              placeholder="123"
                              maxLength={4}
                              value={formData.cardCVV}
                              onChange={(e) => updateFormData('cardCVV', e.target.value)}
                              className={errors.cardCVV ? 'border-red-500' : ''}
                            />
                            {errors.cardCVV && <p className="text-sm text-red-500 mt-1">{errors.cardCVV}</p>}
                          </div>
                        </div>

                        <Separator />

                        <div className="space-y-4">
                          <h4 className="font-medium">Endereço de cobrança</h4>
                          
                          <div>
                            <Label htmlFor="addressLine1">Endereço *</Label>
                            <Input
                              id="addressLine1"
                              placeholder="Rua, número"
                              value={formData.addressLine1}
                              onChange={(e) => updateFormData('addressLine1', e.target.value)}
                              className={errors.addressLine1 ? 'border-red-500' : ''}
                            />
                            {errors.addressLine1 && <p className="text-sm text-red-500 mt-1">{errors.addressLine1}</p>}
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="addressZipCode">CEP *</Label>
                              <Input
                                id="addressZipCode"
                                placeholder="00000-000"
                                value={formData.addressZipCode}
                                onChange={(e) => updateFormData('addressZipCode', e.target.value)}
                                className={errors.addressZipCode ? 'border-red-500' : ''}
                              />
                              {errors.addressZipCode && <p className="text-sm text-red-500 mt-1">{errors.addressZipCode}</p>}
                            </div>

                            <div>
                              <Label htmlFor="addressCity">Cidade *</Label>
                              <Input
                                id="addressCity"
                                placeholder="São Paulo"
                                value={formData.addressCity}
                                onChange={(e) => updateFormData('addressCity', e.target.value)}
                                className={errors.addressCity ? 'border-red-500' : ''}
                              />
                              {errors.addressCity && <p className="text-sm text-red-500 mt-1">{errors.addressCity}</p>}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="addressState">Estado *</Label>
                              <Input
                                id="addressState"
                                placeholder="SP"
                                maxLength={2}
                                value={formData.addressState}
                                onChange={(e) => updateFormData('addressState', e.target.value.toUpperCase())}
                                className={errors.addressState ? 'border-red-500' : ''}
                              />
                              {errors.addressState && <p className="text-sm text-red-500 mt-1">{errors.addressState}</p>}
                            </div>

                            <div>
                              <Label htmlFor="addressCountry">País</Label>
                              <Input
                                id="addressCountry"
                                value="BR"
                                disabled
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {step === 'review' && (
                <div className="space-y-6">
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      Revise todas as informações antes de criar o pagamento.
                    </AlertDescription>
                  </Alert>

                  <div className="grid gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Detalhes do Pagamento</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Tipo:</span>
                          <span>{paymentType === 'one-time' ? 'Pagamento Único' : 'Assinatura Recorrente'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Valor:</span>
                          <span className="font-medium">{formatCurrency(formData.amount)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Método:</span>
                          <span className="flex items-center gap-1">
                            {formData.paymentMethod === 'pix' ? <QrCode className="h-3 w-3" /> : <CreditCard className="h-3 w-3" />}
                            {formData.paymentMethod === 'pix' ? 'PIX' : 'Cartão de Crédito'}
                          </span>
                        </div>
                        {paymentType === 'one-time' && (
                          <div className="flex justify-between">
                            <span>Dias a conceder:</span>
                            <span>{formData.subscriptionDaysToGrant} dias</span>
                          </div>
                        )}
                        {paymentType === 'subscription' && (
                          <>
                            <div className="flex justify-between">
                              <span>Plano:</span>
                              <span>{formData.planName}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Cobrança:</span>
                              <span>
                                A cada {formData.intervalCount} {formData.billingInterval === 'month' ? 'mês(es)' : 'ano(s)'}
                              </span>
                            </div>
                            {parseInt(formData.trialDays) > 0 && (
                              <div className="flex justify-between">
                                <span>Trial:</span>
                                <span>{formData.trialDays} dias</span>
                              </div>
                            )}
                          </>
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Cliente</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Nome:</span>
                          <span>{formData.customerName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Email:</span>
                          <span>{formData.customerEmail}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Documento:</span>
                          <span>{formData.customerDocument}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Telefone:</span>
                          <span>{formData.customerPhone}</span>
                        </div>
                      </CardContent>
                    </Card>

                    {formData.adminNotes && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Notas do Admin
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground">{formData.adminNotes}</p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => step === 'details' ? onOpenChange(false) : handleBack()}>
            {step === 'details' ? 'Cancelar' : 'Voltar'}
          </Button>
          
          {step !== 'review' ? (
            <Button onClick={handleNext}>
              Próximo
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={isLoading}>
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b border-white mr-2" />
                  Criando...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Criar Pagamento
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};