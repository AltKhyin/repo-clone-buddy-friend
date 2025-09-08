// ABOUTME: Configuration builders for common payment result scenarios with clear messaging and next steps

import type { PaymentResultData } from './PaymentResultDisplay';

interface PaymentContext {
  orderId?: string;
  amount?: number;
  paymentMethod?: 'pix' | 'credit_card';
  customerEmail?: string;
  planName?: string;
  installments?: number;
}

interface SupportInfo {
  email: string;
  link: string;
}

export class PaymentResultConfigs {
  constructor(private supportInfo: SupportInfo) {}

  // ✅ SUCCESS CONFIGURATIONS

  pixSuccess(context: PaymentContext): PaymentResultData {
    return {
      type: 'success',
      title: 'Pagamento PIX Aprovado!',
      message: 'Seu pagamento foi processado com sucesso. Verifique seu e-mail para instruções de acesso à plataforma.',
      orderId: context.orderId,
      amount: context.amount,
      paymentMethod: 'pix',
      nextSteps: {
        primary: {
          label: 'Continuar',
          action: () => window.location.href = '/login',
          variant: 'default'
        }
      }
    };
  }

  creditCardSuccess(context: PaymentContext): PaymentResultData {
    return {
      type: 'success',
      title: 'Pagamento Aprovado!',
      message: `Seu cartão foi cobrado com sucesso${context.installments && context.installments > 1 ? ` em ${context.installments}x` : ''}. Verifique seu e-mail para instruções de acesso à plataforma.`,
      orderId: context.orderId,
      amount: context.amount,
      paymentMethod: 'credit_card',
      nextSteps: {
        primary: {
          label: 'Continuar',
          action: () => window.location.href = '/login',
          variant: 'default'
        }
      }
    };
  }

  subscriptionSuccess(context: PaymentContext): PaymentResultData {
    return {
      type: 'success',
      title: 'Assinatura Ativada!',
      message: `Sua assinatura ${context.planName || ''} foi ativada com sucesso. Verifique seu e-mail para instruções de acesso à plataforma.`,
      orderId: context.orderId,
      amount: context.amount,
      paymentMethod: context.paymentMethod,
      nextSteps: {
        primary: {
          label: 'Continuar',
          action: () => window.location.href = '/login',
          variant: 'default'
        }
      }
    };
  }

  // ❌ FAILURE CONFIGURATIONS

  creditCardDeclined(context: PaymentContext, reason?: string): PaymentResultData {
    const commonReasons: Record<string, string> = {
      'insufficient_funds': 'Saldo insuficiente na conta',
      'invalid_card': 'Dados do cartão inválidos',
      'expired_card': 'Cartão vencido',
      'blocked_card': 'Cartão bloqueado',
      'installment_not_supported': 'Parcelamento não suportado para este valor',
      'minimum_amount': 'Valor mínimo não atendido para parcelamento'
    };

    const getDetailsMessage = () => {
      if (context.installments && context.installments > 1 && context.amount && context.amount < 500) {
        return 'Valores muito baixos geralmente não podem ser parcelados. Tente pagar à vista ou escolha outro método.';
      }
      return reason && commonReasons[reason] ? commonReasons[reason] : 'Verifique os dados do cartão e tente novamente.';
    };

    const getRecommendedAction = () => {
      if (context.installments && context.installments > 1 && context.amount && context.amount < 500) {
        return {
          label: 'Pagar À Vista',
          action: () => window.location.reload(),
          variant: 'default' as const
        };
      }
      return {
        label: 'Tentar Outro Cartão',
        action: () => window.location.reload(),
        variant: 'default' as const
      };
    };

    return {
      type: 'failure',
      title: 'Pagamento Não Autorizado',
      message: 'Seu cartão de crédito não aprovou a transação.',
      details: getDetailsMessage(),
      orderId: context.orderId,
      amount: context.amount,
      paymentMethod: 'credit_card',
      nextSteps: {
        primary: getRecommendedAction(),
        secondary: {
          label: 'Pagar com PIX',
          action: () => window.location.reload()
        },
        tertiary: {
          label: 'Voltar ao Pagamento',
          action: () => window.location.reload()
        }
      },
      supportInfo: this.supportInfo
    };
  }

  pixExpired(context: PaymentContext): PaymentResultData {
    return {
      type: 'failure',
      title: 'PIX Expirado',
      message: 'O código PIX expirou. Você pode gerar um novo código para finalizar seu pagamento.',
      details: 'Códigos PIX são válidos por 1 hora por motivos de segurança.',
      orderId: context.orderId,
      amount: context.amount,
      paymentMethod: 'pix',
      nextSteps: {
        primary: {
          label: 'Gerar Novo PIX',
          action: () => window.location.reload(),
          variant: 'default'
        },
        secondary: {
          label: 'Pagar com Cartão',
          action: () => window.location.reload()
        },
        tertiary: {
          label: 'Voltar ao Pagamento',
          action: () => window.location.reload()
        }
      },
      supportInfo: this.supportInfo
    };
  }

  subscriptionFailed(context: PaymentContext): PaymentResultData {
    return {
      type: 'failure',
      title: 'Falha na Assinatura',
      message: 'Não foi possível processar sua assinatura. Seus dados estão seguros e nenhuma cobrança foi realizada.',
      details: 'Isso pode acontecer por problemas temporários com a operadora do cartão ou configurações do plano.',
      orderId: context.orderId,
      amount: context.amount,
      paymentMethod: context.paymentMethod,
      nextSteps: {
        primary: {
          label: 'Tentar Novamente',
          action: () => window.location.reload(),
          variant: 'default'
        },
        secondary: {
          label: 'Escolher Outro Plano',
          action: () => window.location.href = '/planos'
        },
        tertiary: {
          label: 'Voltar ao Pagamento',
          action: () => window.location.reload()
        }
      },
      supportInfo: this.supportInfo
    };
  }

  // ⏳ PENDING CONFIGURATIONS

  pixPending(context: PaymentContext): PaymentResultData {
    return {
      type: 'pending',
      title: 'Aguardando Pagamento PIX',
      message: 'Seu código PIX foi gerado com sucesso. Escaneie o QR Code ou copie o código para finalizar o pagamento.',
      details: 'O pagamento PIX é confirmado instantaneamente. Esta janela será atualizada automaticamente.',
      orderId: context.orderId,
      amount: context.amount,
      paymentMethod: 'pix',
      nextSteps: {
        secondary: {
          label: 'Voltar ao PIX',
          action: () => window.history.back()
        },
        tertiary: {
          label: 'Cancelar Pagamento',
          action: () => window.location.href = '/'
        }
      }
    };
  }

  creditCardProcessing(context: PaymentContext): PaymentResultData {
    return {
      type: 'processing',
      title: 'Processando Pagamento...',
      message: 'Estamos verificando seu pagamento com a operadora do cartão. Isso pode levar alguns instantes.',
      orderId: context.orderId,
      amount: context.amount,
      paymentMethod: 'credit_card',
      nextSteps: {
        tertiary: {
          label: 'Cancelar',
          action: () => window.location.href = '/'
        }
      }
    };
  }

  // 🔧 TECHNICAL ERROR CONFIGURATIONS

  technicalError(context: PaymentContext, errorCode?: string): PaymentResultData {
    return {
      type: 'failure',
      title: 'Erro Temporário',
      message: 'Ocorreu um problema técnico durante o processamento. Seus dados estão seguros.',
      details: 'Este erro é temporário e geralmente se resolve tentando novamente em alguns minutos.',
      errorCode,
      orderId: context.orderId,
      amount: context.amount,
      paymentMethod: context.paymentMethod,
      nextSteps: {
        primary: {
          label: 'Voltar ao Pagamento',
          action: () => window.location.reload(),
          variant: 'default'
        },
        secondary: {
          label: 'Reportar Problema',
          action: () => window.open(this.supportInfo.link, '_blank')
        },
        tertiary: {
          label: 'Voltar ao Pagamento',
          action: () => window.location.reload()
        }
      },
      supportInfo: this.supportInfo
    };
  }

  networkError(context: PaymentContext): PaymentResultData {
    return {
      type: 'failure',
      title: 'Problemas de Conexão',
      message: 'Não foi possível conectar com os serviços de pagamento. Verifique sua conexão com a internet.',
      details: 'Seus dados não foram enviados e estão seguros. Tente novamente quando sua conexão estiver estável.',
      orderId: context.orderId,
      paymentMethod: context.paymentMethod,
      nextSteps: {
        primary: {
          label: 'Tentar Novamente',
          action: () => window.location.reload(),
          variant: 'default'
        },
        tertiary: {
          label: 'Voltar ao Pagamento',
          action: () => window.location.reload()
        }
      },
      supportInfo: this.supportInfo
    };
  }
}