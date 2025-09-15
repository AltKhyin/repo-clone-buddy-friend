// ABOUTME: Clean payment success component matching login page aesthetic with email instructions
import React from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Mail, CreditCard, QrCode, ExternalLink } from 'lucide-react';

interface PaymentSuccessV2Props {
  customerName: string;
  customerEmail: string;
  paymentMethod: 'pix' | 'credit_card';
  amount: number;
  orderId?: string;
  planName?: string;
  onContinue: () => void;
  className?: string;
}

export function PaymentSuccessV2({
  customerName,
  customerEmail,
  paymentMethod,
  amount,
  orderId,
  planName = "Reviews Premium",
  onContinue,
  className
}: PaymentSuccessV2Props) {
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount / 100);
  };

  const firstName = customerName.split(' ')[0];

  return (
    <div className="space-y-6">
      {/* Success Icon */}
      <div className="flex justify-center">
        <CheckCircle2 className="h-12 w-12 text-green-600" />
      </div>

      {/* Title */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-medium text-black">
          Parabéns, {firstName}!
        </h1>
        <p className="text-sm text-gray-600">
          Seu pagamento foi confirmado
        </p>
      </div>

      {/* Payment Summary */}
      <div className="space-y-3 text-sm">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Plano</span>
          <span className="font-medium text-black">{planName}</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-gray-600">Valor</span>
          <span className="font-medium text-black">{formatAmount(amount)}</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-gray-600">Método</span>
          <div className="flex items-center gap-2">
            {paymentMethod === 'pix' ? (
              <>
                <QrCode className="h-4 w-4 text-gray-600" />
                <span className="font-medium text-black">PIX</span>
              </>
            ) : (
              <>
                <CreditCard className="h-4 w-4 text-gray-600" />
                <span className="font-medium text-black">Cartão de Crédito</span>
              </>
            )}
          </div>
        </div>

        {orderId && (
          <div className="flex justify-between items-center">
            <span className="text-gray-600">ID</span>
            <span className="font-mono text-xs text-gray-700">
              {orderId.length > 16 ? `${orderId.slice(0, 16)}...` : orderId}
            </span>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-gray-100"></div>

      {/* Email Instructions */}
      <div className="text-center space-y-3">
        <div className="flex justify-center">
          <Mail className="h-5 w-5 text-gray-600" />
        </div>

        <div className="space-y-2">
          <h3 className="font-medium text-black">Próximos passos</h3>
          <p className="text-sm text-gray-600">
            Enviamos um email para <strong>{customerEmail}</strong> com instruções para:
          </p>
        </div>

        <div className="text-sm text-gray-700 space-y-1">
          <p>• Ativar sua conta Reviews</p>
          <p>• Definir sua senha de acesso</p>
          <p>• Acessar todos os recursos premium</p>
        </div>
      </div>

      {/* Warning */}
      <div className="text-center text-xs text-gray-500 bg-gray-50 p-3 rounded">
        <p><strong>Importante:</strong> Verifique sua caixa de spam se não encontrar o email.</p>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <Button
          onClick={onContinue}
          className="w-full bg-black hover:bg-gray-800 text-white"
        >
          Continuar para Reviews
        </Button>
      </div>

      {/* Welcome Message */}
      <div className="text-center text-xs text-gray-500">
        <p>Bem-vindo(a) ao Reviews! Sua assinatura premium está ativa por 1 ano.</p>
      </div>
    </div>
  );
}