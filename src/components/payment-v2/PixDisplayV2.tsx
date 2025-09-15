// ABOUTME: PIX QR Code display component for Payment V2.0 with copy functionality
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { QrCode } from 'lucide-react';
import { toast } from 'sonner';

interface PixDisplayV2Props {
  qrCode: string;
  qrCodeUrl: string;
  amount: number;
  onBack: () => void;
  className?: string;
}

export function PixDisplayV2({ qrCode, qrCodeUrl, amount, onBack, className }: PixDisplayV2Props) {
  const [imageError, setImageError] = useState(false);

  // Debug logging for PIX display data
  React.useEffect(() => {
    console.log('🖼️ PixDisplayV2 - Rendering with data:', {
      qrCode: qrCode ? `${qrCode.substring(0, 50)}...` : 'null',
      qrCodeUrl,
      amount,
      imageError
    });
  }, [qrCode, qrCodeUrl, amount, imageError]);

  const handleImageError = () => {
    console.error('❌ PixDisplayV2 - QR Code image failed to load:', qrCodeUrl);
    console.error('❌ PixDisplayV2 - This is likely a CORS issue with Pagar.me QR code URL');
    setImageError(true);
    toast.error('Erro ao carregar QR Code. Use o botão "Copiar código PIX" abaixo.');
  };

  const handleImageLoad = () => {
    console.log('✅ PixDisplayV2 - QR Code image loaded successfully:', qrCodeUrl);
    setImageError(false);
  };

  const handleCopyPixCode = async () => {
    if (!qrCode) {
      toast.error('Código PIX não disponível');
      return;
    }

    try {
      // Check if clipboard API is available
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(qrCode);
        toast.success('Código PIX copiado!');
      } else {
        // Fallback for non-HTTPS or unsupported browsers
        const textArea = document.createElement('textarea');
        textArea.value = qrCode;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
          document.execCommand('copy');
          toast.success('Código PIX copiado!');
        } catch (fallbackError) {
          console.error('Fallback clipboard error:', fallbackError);
          toast.error('Não foi possível copiar automaticamente. Selecione e copie manualmente.');
        }
        
        document.body.removeChild(textArea);
      }
    } catch (error) {
      console.error('Clipboard error:', error);
      toast.error('Erro ao copiar código PIX');
    }
  };

  return (
    <div className={`bg-white/95 backdrop-blur-sm p-4 sm:p-6 md:p-8 rounded-xl shadow-lg w-full max-w-[400px] ${className || ''}`}>
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
            <QrCode className="h-6 w-6 text-green-600" />
          </div>
        </div>
        
        <h2 className="text-xl font-serif tracking-tight text-black mb-2">
          Pague com PIX
        </h2>
        
        <p className="text-sm text-gray-600 mb-6">
          Use o QR Code ou copie o código PIX abaixo. O pagamento é confirmado instantaneamente.
        </p>

        {/* PIX QR Code */}
        <div className="bg-white h-48 w-48 mx-auto mb-4 flex items-center justify-center rounded-lg border">
          {qrCodeUrl && !imageError ? (
            <img
              src={qrCodeUrl}
              alt="PIX QR Code"
              className="h-44 w-44 object-contain"
              onError={handleImageError}
              onLoad={handleImageLoad}
            />
          ) : (
            <div className="text-center">
              <QrCode className="h-16 w-16 text-gray-400 mx-auto mb-2" />
              <p className="text-xs text-gray-500">
                {imageError ? 'Erro ao carregar QR Code' : 'QR Code PIX'}
              </p>
              {imageError && (
                <p className="text-xs text-red-500 mt-1">
                  Use o botão abaixo para copiar
                </p>
              )}
            </div>
          )}
        </div>

        {/* Copy PIX Code Button */}
        <Button 
          onClick={handleCopyPixCode}
          variant="outline" 
          className="w-full h-11 sm:h-12 bg-white hover:bg-gray-50 border-gray-300 text-gray-700 mb-3 touch-manipulation"
        >
          Copiar código PIX
        </Button>

        <div className="text-xs sm:text-sm text-gray-500 mb-4">
          Válido por 1 hora • R$ {(amount / 100).toFixed(2).replace('.', ',')}
        </div>

        <Button 
          onClick={onBack}
          variant="outline"
          className="w-full h-11 sm:h-12 mt-3 bg-white hover:bg-gray-50 border-gray-300 text-gray-700 touch-manipulation"
        >
          Voltar
        </Button>

        {/* Security and Support Info */}
        <div className="mt-4 sm:mt-6 text-center">
          <div className="flex items-center justify-center space-x-3 sm:space-x-4 text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4">
            <div className="flex items-center space-x-1">
              <span className="h-2 w-2 bg-green-500 rounded-full"></span>
              <span>Pagamento seguro</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="h-2 w-2 bg-blue-500 rounded-full"></span>
              <span>PIX instantâneo</span>
            </div>
          </div>
          
          <p className="text-sm text-gray-700">
            Problemas com o pagamento?{' '}
            <a 
              href="mailto:suporte@evidens.com.br" 
              className="text-black font-medium hover:underline touch-manipulation"
              target="_blank"
              rel="noopener noreferrer"
            >
              Entre em contato
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}