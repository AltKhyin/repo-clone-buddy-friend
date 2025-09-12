// ABOUTME: Standalone email dispatch service for payment-to-account linking notifications

import { createClient } from 'jsr:@supabase/supabase-js@2';

interface EmailDispatchRequest {
  type: 'login_prompt' | 'registration_invite';
  recipientEmail: string;
  recipientName: string;
  token: string;
  linkUrl: string;
  expiresAt: string;
  planData: {
    name: string;
    description?: string;
    finalAmount: number;
    durationDays: number;
  };
  customization?: {
    brandName?: string;
    brandColor?: string;
    supportEmail?: string;
  };
}

// CORS headers for development and production
const getCorsHeaders = (requestOrigin?: string) => {
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',  
    'http://localhost:8080',
    'http://localhost:8081',
    'https://reviews.igoreckert.com.br',
    'https://www.reviews.igoreckert.com.br',
    'https://evidens-reviews.vercel.app',
  ];

  // Check for development network IPs
  if (requestOrigin) {
    const url = new URL(requestOrigin);
    const host = url.hostname;
    const port = url.port;
    
    if ((port === '8080' || port === '8081') && (
      host === 'localhost' || host === '127.0.0.1' ||
      /^192\.168\.\d{1,3}\.\d{1,3}$/.test(host) ||
      /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host) ||
      /^172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}$/.test(host)
    )) {
      allowedOrigins.push(requestOrigin);
    }
  }

  const origin = requestOrigin && allowedOrigins.includes(requestOrigin) 
    ? requestOrigin 
    : allowedOrigins[0];

  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Credentials': 'true',
  };
};

// Error response helper
const createErrorResponse = (error: any, origin?: string) => {
  let status = 500;
  let code = 'INTERNAL_ERROR';
  let message = 'An unexpected error occurred';

  if (error instanceof Error) {
    message = error.message;
    if (message.startsWith('VALIDATION_FAILED:')) {
      status = 400;
      code = 'VALIDATION_FAILED';
      message = message.replace('VALIDATION_FAILED: ', '');
    }
  }

  return new Response(
    JSON.stringify({
      error: { message, code },
    }),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
        ...getCorsHeaders(origin),
      },
    }
  );
};

// Success response helper
const createSuccessResponse = (data: any, origin?: string) => {
  return new Response(
    JSON.stringify({
      success: true,
      data,
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...getCorsHeaders(origin),
      },
    }
  );
};

Deno.serve(async (req: Request) => {
  const origin = req.headers.get('Origin');
  console.log('📧 Email dispatch service - Origin:', origin, 'Method:', req.method);
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    const corsHeaders = getCorsHeaders(origin);
    console.log('📧 CORS preflight response headers:', corsHeaders);
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  try {
    // Validate request method
    if (req.method !== 'POST') {
      throw new Error('VALIDATION_FAILED: Only POST method is allowed');
    }

    // Parse request body
    const body = await req.json() as EmailDispatchRequest;
    
    // Validate required fields
    if (!body.type || !body.recipientEmail || !body.token || !body.linkUrl || !body.planData) {
      throw new Error('VALIDATION_FAILED: Missing required fields');
    }

    // Validate email type
    if (!['login_prompt', 'registration_invite'].includes(body.type)) {
      throw new Error('VALIDATION_FAILED: Invalid email type');
    }

    console.log('📧 Dispatching email:', { 
      type: body.type, 
      email: body.recipientEmail,
      plan: body.planData.name 
    });

    // Generate appropriate email content based on type
    const emailContent = body.type === 'login_prompt' 
      ? generateLoginPromptEmail(body)
      : generateRegistrationInviteEmail(body);

    // For now, we'll simulate email sending and log the content
    console.log('📬 Email content generated:', {
      to: body.recipientEmail,
      subject: emailContent.subject,
      preview: emailContent.html.substring(0, 200) + '...'
    });

    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Store email dispatch record for tracking
    const { error: insertError } = await supabase
      .from('email_dispatch_log')
      .insert({
        recipient_email: body.recipientEmail,
        email_type: body.type,
        token_used: body.token,
        plan_name: body.planData.name,
        subject: emailContent.subject,
        sent_at: new Date().toISOString(),
        status: 'sent'
      });

    if (insertError) {
      console.warn('⚠️ Failed to log email dispatch:', insertError);
      // Don't fail the request for logging issues
    }

    return createSuccessResponse({
      message: 'Email dispatched successfully',
      type: body.type,
      recipientEmail: body.recipientEmail,
      subject: emailContent.subject,
    }, origin);

  } catch (error) {
    console.error('💥 Email dispatch error:', error);
    return createErrorResponse(error, origin);
  }
});

/**
 * Generate login prompt email for existing users
 */
function generateLoginPromptEmail(data: EmailDispatchRequest) {
  const { recipientName, recipientEmail, linkUrl, planData, expiresAt, customization } = data;
  
  const brandName = customization?.brandName || 'EVIDENS';
  const brandColor = customization?.brandColor || '#111827';
  const supportEmail = customization?.supportEmail || 'support@evidens.com';
  
  const subject = `Complete Your ${planData.name} Subscription Activation`;
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #374151; background-color: #f9fafb;">
  <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 40px 32px;">
    
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 40px;">
      <h1 style="color: ${brandColor}; font-size: 28px; font-weight: 700; margin: 0; letter-spacing: -0.025em;">
        ${brandName}
      </h1>
    </div>

    <!-- Main Content -->
    <div style="margin-bottom: 40px;">
      <h2 style="color: #111827; font-size: 24px; font-weight: 600; margin: 0 0 24px 0; line-height: 1.3;">
        Welcome back! Complete your subscription activation
      </h2>
      
      <p style="margin: 0 0 20px 0; font-size: 16px; color: #6b7280;">
        Hello${recipientName ? ` ${recipientName}` : ''},
      </p>
      
      <p style="margin: 0 0 20px 0; font-size: 16px; color: #374151;">
        Great news! Your payment for <strong>${planData.name}</strong> has been processed successfully. 
        To activate your subscription, please log in to your existing account.
      </p>

      <!-- Call to Action -->
      <div style="text-align: center; margin: 32px 0;">
        <a href="${linkUrl}" style="display: inline-block; background-color: ${brandColor}; color: white; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
          Complete Activation
        </a>
      </div>

      <p style="margin: 24px 0 0 0; font-size: 14px; color: #6b7280; text-align: center;">
        This link expires on ${new Date(expiresAt).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}
      </p>
    </div>

    <!-- Footer -->
    <div style="border-top: 1px solid #e5e7eb; padding-top: 32px; text-align: center;">
      <p style="margin: 0; font-size: 12px; color: #9ca3af;">
        This email was sent to ${recipientEmail}. If you didn't make this purchase, please contact support.
      </p>
    </div>

  </div>
</body>
</html>`;

  return { subject, html };
}

/**
 * Generate registration invite email for new users
 */
function generateRegistrationInviteEmail(data: EmailDispatchRequest) {
  const { recipientName, recipientEmail, linkUrl, planData, expiresAt, customization } = data;
  
  const brandName = customization?.brandName || 'EVIDENS';
  const brandColor = customization?.brandColor || '#111827';
  const supportEmail = customization?.supportEmail || 'support@evidens.com';
  
  const subject = `Create Your Account & Activate ${planData.name}`;
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #374151; background-color: #f9fafb;">
  <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 40px 32px;">
    
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 40px;">
      <h1 style="color: ${brandColor}; font-size: 28px; font-weight: 700; margin: 0; letter-spacing: -0.025em;">
        ${brandName}
      </h1>
    </div>

    <!-- Main Content -->
    <div style="margin-bottom: 40px;">
      <h2 style="color: #111827; font-size: 24px; font-weight: 600; margin: 0 0 24px 0; line-height: 1.3;">
        Welcome! Create your account to get started
      </h2>
      
      <p style="margin: 0 0 20px 0; font-size: 16px; color: #6b7280;">
        Hello${recipientName ? ` ${recipientName}` : ''},
      </p>
      
      <p style="margin: 0 0 20px 0; font-size: 16px; color: #374151;">
        Thank you for your purchase! Your payment for <strong>${planData.name}</strong> has been processed successfully. 
        Now let's create your account to unlock all the premium features.
      </p>

      <!-- Call to Action -->
      <div style="text-align: center; margin: 32px 0;">
        <a href="${linkUrl}" style="display: inline-block; background-color: ${brandColor}; color: white; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
          Create Your Account
        </a>
      </div>

      <p style="margin: 24px 0 0 0; font-size: 14px; color: #6b7280; text-align: center;">
        This link expires on ${new Date(expiresAt).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}
      </p>
    </div>

    <!-- Footer -->
    <div style="border-top: 1px solid #e5e7eb; padding-top: 32px; text-align: center;">
      <p style="margin: 0; font-size: 12px; color: #9ca3af;">
        This email was sent to ${recipientEmail}. If you didn't make this purchase, please contact support.
      </p>
    </div>

  </div>
</body>
</html>`;

  return { subject, html };
}