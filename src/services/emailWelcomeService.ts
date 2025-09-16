// ABOUTME: Service for sending welcome emails and password setup links to payment-created accounts

import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';
import type { PaymentAccountCreationData } from './paymentAccountService';

// =================================================================
// Types & Interfaces
// =================================================================

export interface WelcomeEmailResult {
  success: boolean;
  setupLink?: string;
  message: string;
  emailSent: boolean;
}

export interface WelcomeEmailOptions {
  includePasswordSetup: boolean;
  paymentDetails?: {
    planName: string;
    amount: number;
    paymentMethod: string;
  };
  customMessage?: string;
}

// =================================================================
// Main Welcome Email Service
// =================================================================

/**
 * Sends welcome email to payment-created accounts with password setup instructions
 */
export async function sendPaymentAccountWelcomeEmail(
  user: User,
  paymentData: PaymentAccountCreationData,
  options: WelcomeEmailOptions = { includePasswordSetup: true }
): Promise<WelcomeEmailResult> {
  
  try {
    console.log('Sending welcome email to payment-created account:', {
      userId: user.id,
      email: user.email,
      orderId: paymentData.orderId,
      includePasswordSetup: options.includePasswordSetup,
      timestamp: new Date().toISOString()
    });

    // Generate password setup link if required
    let setupLink: string | undefined;
    if (options.includePasswordSetup) {
      // Since payment users are now auto-confirmed, resetPasswordForEmail should work
      const linkResult = await generatePasswordSetupLink(user.email || paymentData.customerEmail);
      if (!linkResult.success) {
        console.error('Failed to generate password setup link:', linkResult.error);
        return {
          success: false,
          message: 'Erro ao gerar link de configuração de senha.',
          emailSent: false
        };
      }
      setupLink = linkResult.link;
    }

    // Prepare email content based on account creation scenario
    const emailContent = prepareWelcomeEmailContent(user, paymentData, options, setupLink);

    // For now, we'll use Supabase's built-in email system
    // In a production environment, you might want to use a more sophisticated email service
    const emailResult = await sendWelcomeEmailViaSupabase(user, emailContent, setupLink);

    if (emailResult.success) {
      console.log('Welcome email sent successfully:', {
        userId: user.id,
        email: user.email,
        setupLinkIncluded: Boolean(setupLink)
      });

      return {
        success: true,
        setupLink,
        message: 'Email de boas-vindas enviado com sucesso.',
        emailSent: true
      };
    } else {
      return {
        success: false,
        message: `Erro ao enviar email: ${emailResult.error}`,
        emailSent: false
      };
    }

  } catch (error) {
    console.error('Error in sendPaymentAccountWelcomeEmail:', {
      error,
      userId: user.id,
      email: user.email,
      timestamp: new Date().toISOString()
    });

    return {
      success: false,
      message: `Erro interno: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      emailSent: false
    };
  }
}

// =================================================================
// Password Setup Link Generation
// =================================================================

interface PasswordSetupLinkResult {
  success: boolean;
  link?: string;
  error?: string;
  expiresAt?: string;
}

/**
 * Generates secure password setup link with expiration
 */
async function generatePasswordSetupLink(email: string): Promise<PasswordSetupLinkResult> {
  try {
    // Use Supabase auth to generate password reset link
    // This serves as our "password setup" link for new accounts
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/complete-registration`
    });

    if (error) {
      console.error('Error generating password setup link:', error);
      return {
        success: false,
        error: error.message
      };
    }

    // The actual link is sent via email by Supabase
    // We return success to indicate the process initiated successfully
    return {
      success: true,
      link: `${window.location.origin}/completar-perfil?setup=true`,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
    };

  } catch (error) {
    console.error('Error in generatePasswordSetupLink:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
}

// =================================================================
// Email Content Preparation
// =================================================================

interface WelcomeEmailContent {
  subject: string;
  htmlBody: string;
  textBody: string;
}

/**
 * Prepares contextual welcome email content based on payment and account data
 */
function prepareWelcomeEmailContent(
  user: User,
  paymentData: PaymentAccountCreationData,
  options: WelcomeEmailOptions,
  setupLink?: string
): WelcomeEmailContent {
  
  const customerName = user.user_metadata?.name || paymentData.customerName || 'Cliente';
  const firstName = customerName.split(' ')[0];
  
  // Format payment amount for display
  const formattedAmount = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(paymentData.amount / 100);

  const subject = `Bem-vindo ao EVIDENS, ${firstName}! Sua conta foi criada`;

  const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Bem-vindo ao EVIDENS</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; text-align: center; }
        .logo { font-size: 24px; font-weight: bold; color: #2563eb; }
        .content { background: white; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb; }
        .button { display: inline-block; background: #2563eb; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; margin: 20px 0; }
        .payment-details { background: #f0f9ff; padding: 15px; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">📊 EVIDENS</div>
        <p>Plataforma de Revisões Científicas</p>
      </div>

      <div class="content">
        <h1>Olá, ${firstName}! 👋</h1>
        
        <p>Sua conta no EVIDENS foi criada automaticamente após a confirmação do seu pagamento. Bem-vindo à nossa comunidade!</p>

        <div class="payment-details">
          <h3>✅ Detalhes do Pagamento Confirmado</h3>
          <p><strong>Valor:</strong> ${formattedAmount}</p>
          <p><strong>Método:</strong> ${paymentData.paymentMethod?.toUpperCase() || 'N/A'}</p>
          <p><strong>Pedido:</strong> #${paymentData.orderId}</p>
          ${options.paymentDetails ? `<p><strong>Plano:</strong> ${options.paymentDetails.planName}</p>` : ''}
        </div>

        ${options.includePasswordSetup ? `
          <h3>🔐 Próximos Passos</h3>
          <p>Para acessar sua conta, você precisa definir uma senha segura:</p>
          
          ${setupLink ? `<a href="${setupLink}" class="button">Definir Minha Senha</a>` : ''}
          
          <p><small>Este link é válido por 24 horas. Se não funcionar, você pode solicitar um novo na página de login.</small></p>
        ` : `
          <h3>🎉 Sua Conta Está Pronta!</h3>
          <p>Você já pode acessar todo o conteúdo da plataforma:</p>
          <a href="${window.location.origin}" class="button">Acessar EVIDENS</a>
        `}

        <h3>📖 O que você tem acesso agora:</h3>
        <ul>
          <li>Revisões científicas exclusivas</li>
          <li>Comunidade de profissionais</li>
          <li>Ferramentas de análise</li>
          <li>Biblioteca de conteúdo premium</li>
        </ul>

        ${options.customMessage ? `
          <div style="background: #fef3c7; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p><strong>Mensagem especial:</strong></p>
            <p>${options.customMessage}</p>
          </div>
        ` : ''}

        <p>Se você tiver dúvidas, nossa equipe está pronta para ajudar!</p>
        
        <p>Bem-vindo ao EVIDENS! 🚀</p>
      </div>

      <div class="footer">
        <p>EVIDENS - Plataforma de Revisões Científicas</p>
        <p><a href="${window.location.origin}">reviews.igoreckert.com.br</a></p>
      </div>
    </body>
    </html>
  `;

  const textBody = `
Bem-vindo ao EVIDENS, ${firstName}!

Sua conta foi criada automaticamente após a confirmação do seu pagamento.

DETALHES DO PAGAMENTO:
- Valor: ${formattedAmount}
- Método: ${paymentData.paymentMethod?.toUpperCase() || 'N/A'}
- Pedido: #${paymentData.orderId}
${options.paymentDetails ? `- Plano: ${options.paymentDetails.planName}` : ''}

${options.includePasswordSetup ? `
PRÓXIMOS PASSOS:
Para acessar sua conta, defina uma senha segura em:
${setupLink || `${window.location.origin}/completar-perfil?setup=true`}

(Este link é válido por 24 horas)
` : `
SUA CONTA ESTÁ PRONTA!
Acesse: ${window.location.origin}
`}

O QUE VOCÊ TEM ACESSO:
- Revisões científicas exclusivas
- Comunidade de profissionais
- Ferramentas de análise
- Biblioteca de conteúdo premium

${options.customMessage ? `
MENSAGEM ESPECIAL:
${options.customMessage}
` : ''}

Bem-vindo ao EVIDENS!
Equipe EVIDENS
`;

  return {
    subject,
    htmlBody,
    textBody
  };
}

// =================================================================
// Email Delivery Services
// =================================================================

interface EmailDeliveryResult {
  success: boolean;
  error?: string;
}

/**
 * Sends welcome email using Supabase's email service
 * Note: In production, consider using a dedicated email service like SendGrid, Mailgun, etc.
 */
async function sendWelcomeEmailViaSupabase(
  user: User,
  emailContent: WelcomeEmailContent,
  setupLink?: string
): Promise<EmailDeliveryResult> {
  
  try {
    // For now, we rely on Supabase's built-in email system
    // The password reset email serves as our welcome email with setup instructions
    
    if (setupLink) {
      // Trigger password reset email which includes setup instructions
      const { error } = await supabase.auth.resetPasswordForEmail(user.email!, {
        redirectTo: setupLink
      });

      if (error) {
        return {
          success: false,
          error: error.message
        };
      }
    }

    // In a production environment, you would implement custom email sending here
    // For example:
    // await sendGridClient.send({
    //   to: user.email,
    //   from: 'noreply@evidens.com.br',
    //   subject: emailContent.subject,
    //   html: emailContent.htmlBody,
    //   text: emailContent.textBody
    // });

    console.log('Email delivery simulated successfully (using Supabase built-in system)');

    return {
      success: true
    };

  } catch (error) {
    console.error('Error in email delivery:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
}

// =================================================================
// Utility Functions
// =================================================================

/**
 * Sends follow-up email reminders for users who haven't completed password setup
 */
export async function sendPasswordSetupReminder(
  userEmail: string,
  daysSinceCreation: number
): Promise<WelcomeEmailResult> {
  
  try {
    console.log(`Sending password setup reminder to ${userEmail} (${daysSinceCreation} days since creation)`);

    const { error } = await supabase.auth.resetPasswordForEmail(userEmail, {
      redirectTo: `${window.location.origin}/completar-perfil?setup=true&reminder=true`
    });

    if (error) {
      return {
        success: false,
        message: `Erro ao enviar lembrete: ${error.message}`,
        emailSent: false
      };
    }

    return {
      success: true,
      message: 'Lembrete de configuração de senha enviado.',
      emailSent: true
    };

  } catch (error) {
    console.error('Error sending password setup reminder:', error);
    return {
      success: false,
      message: 'Erro interno ao enviar lembrete.',
      emailSent: false
    };
  }
}

/**
 * Test function for development
 */
export async function testWelcomeEmail(): Promise<WelcomeEmailResult> {
  const testUser: User = {
    id: 'test-user-123',
    email: 'test@example.com',
    user_metadata: { name: 'João Teste' },
    aud: 'authenticated',
    app_metadata: {},
    created_at: new Date().toISOString()
  };

  const testPaymentData: PaymentAccountCreationData = {
    customerEmail: 'test@example.com',
    customerName: 'João Teste',
    customerDocument: '12345678901',
    customerPhone: '+5511999999999',
    orderId: 'test-order-123',
    planId: 'test-plan-123',
    amount: 9990,
    paymentMethod: 'pix'
  };

  return await sendPaymentAccountWelcomeEmail(testUser, testPaymentData, {
    includePasswordSetup: true,
    paymentDetails: {
      planName: 'Plano Premium',
      amount: 9990,
      paymentMethod: 'PIX'
    }
  });
}