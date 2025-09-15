// ABOUTME: Clean payment processing component matching login page aesthetic with alternating messages
import React, { useState, useEffect } from 'react';
import { Loader2, CreditCard, QrCode } from 'lucide-react';

interface PaymentProcessingV2Props {
  paymentMethod: 'pix' | 'credit_card';
  customerEmail: string;
  onTimeout: () => void;
  className?: string;
}

const PROCESSING_MESSAGES = [
  "Processando seu pagamento...",
  "Verificando dados com o banco...",
  "Confirmando transação...",
  "Isso está demorando mais do que esperado...",
  "Aguarde, ainda estamos processando...",
  "Verificando confirmação final..."
];

export function PaymentProcessingV2({
  paymentMethod,
  customerEmail,
  onTimeout,
  className
}: PaymentProcessingV2Props) {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);

  // Total timeout in seconds (2 minutes)
  const TOTAL_TIMEOUT = 120;

  useEffect(() => {
    // Progress timer (updates every second)
    const progressInterval = setInterval(() => {
      setTimeElapsed(prev => {
        const newTime = prev + 1;

        // Trigger timeout
        if (newTime >= TOTAL_TIMEOUT) {
          onTimeout();
          return prev;
        }

        return newTime;
      });
    }, 1000);

    // Message rotation timer (every 4 seconds)
    const messageTimeout = setInterval(() => {
      setCurrentMessageIndex(prev => (prev + 1) % PROCESSING_MESSAGES.length);
    }, 4000);

    return () => {
      clearInterval(progressInterval);
      clearInterval(messageTimeout);
    };
  }, [onTimeout]);

  const currentMessage = PROCESSING_MESSAGES[currentMessageIndex];
  const isDelayed = timeElapsed > 30; // Show warning after 30 seconds

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-medium text-black">
          Processando pagamento
        </h1>
        <p className="text-sm text-gray-600">
          Não feche esta página
        </p>
      </div>

      {/* Processing Animation */}
      <div className="flex justify-center">
        <div className="flex items-center space-x-3">
          {paymentMethod === 'pix' ? (
            <QrCode className="h-5 w-5 text-gray-600" />
          ) : (
            <CreditCard className="h-5 w-5 text-gray-600" />
          )}
          <Loader2 className="h-5 w-5 animate-spin text-gray-600" />
        </div>
      </div>

      {/* Status Message */}
      <div className="text-center">
        <p className={`text-sm transition-colors duration-500 ${
          isDelayed ? 'text-yellow-700' : 'text-gray-700'
        }`}>
          {currentMessage}
        </p>
      </div>

      {/* Email Info */}
      <div className="text-center text-xs text-gray-500 space-y-1">
        <p>Você receberá a confirmação em:</p>
        <p className="font-medium text-gray-700">{customerEmail}</p>
      </div>

      {/* Progress Indicator (Simple dots) */}
      <div className="flex justify-center space-x-1">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className={`h-2 w-2 rounded-full transition-colors duration-500 ${
              i <= (timeElapsed % 4) ? 'bg-gray-400' : 'bg-gray-200'
            }`}
          />
        ))}
      </div>

      {/* Timer */}
      <div className="text-center text-xs text-gray-400">
        {timeElapsed}s / {TOTAL_TIMEOUT}s
      </div>

      {/* Delayed Warning */}
      {isDelayed && (
        <div className="text-center text-xs text-yellow-700 bg-yellow-50 p-3 rounded">
          <p>⚠️ Processamento demorado</p>
          <p className="mt-1">Verifique sua caixa de spam se não receber o email.</p>
        </div>
      )}
    </div>
  );
}