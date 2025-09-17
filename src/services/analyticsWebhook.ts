// ABOUTME: Analytics webhook service for sending comprehensive payment event data to Make.com for analytics and ad tracking

import { getDeviceInfo } from '@/utils/deviceDetection';

interface AnalyticsWebhookPayload {
  // Event metadata
  event: {
    type: 'payment_success' | 'payment_initiated' | 'pix_generated';
    timestamp: string;
    source: 'evidens_v2';
    platform: 'web';
    environment: 'production' | 'development';
    session_id?: string;
  };

  // Customer data (for ad tracking & CRM)
  customer: {
    name: string;
    email: string;
    document: string;
    phone: string;
    address: {
      street: string;
      zip_code: string;
      city: string;
      state: string;
      country: 'BR';
    };
    // Hash for privacy while maintaining tracking capability
    customer_id_hash?: string;
  };

  // Transaction details (for revenue tracking)
  transaction: {
    id: string;
    code: string;
    payment_method: 'credit_card' | 'pix';
    status: 'pending' | 'paid' | 'failed';
    currency: 'BRL';
    amounts: {
      base_amount: number; // Original price in decimal format (x.xx)
      final_amount: number; // Amount actually paid in decimal format (x.xx)
      discount_amount: number; // Discount applied in decimal format (x.xx)
      fee_amount?: number; // Processing fees in decimal format (x.xx)
    };
    installments?: {
      count: number;
      amount_per_installment: number; // Per installment in decimal format (x.xx)
      total_with_fees: number; // Total with fees in decimal format (x.xx)
      fee_rate: string;
    };
  };

  // Product/Plan data (for conversion tracking)
  product: {
    plan_id: string;
    plan_name: string;
    plan_type: string;
    duration_days: number;
    category: 'subscription';
    sku: string; // For Google Analytics Enhanced Ecommerce
    pricing_tier: 'basic' | 'premium' | 'enterprise';
  };

  // Marketing attribution (for ad performance)
  marketing: {
    source?: string; // UTM source
    medium?: string; // UTM medium  
    campaign?: string; // UTM campaign
    term?: string; // UTM term
    content?: string; // UTM content
    referrer?: string;
    landing_page?: string;
    custom_parameter?: string; // From URL ?plano= parameter
  };

  // Technical metadata (for debugging & analytics)
  technical: {
    user_agent?: string;
    ip_address?: string;
    browser_info?: {
      name?: string;
      version?: string;
      language?: string;
    };
    device_info?: {
      type: 'desktop' | 'mobile' | 'tablet';
      screen_resolution?: string;
      browser?: string;
      os?: string;
      os_version?: string;
    };
  };

  // Conversion data (for ad platforms)
  conversion: {
    value: number; // Conversion value for Facebook/Google
    currency: 'BRL';
    conversion_type: 'purchase';
    customer_lifetime_value?: number;
    is_new_customer: boolean;
  };
}

const ANALYTICS_WEBHOOK_URL = 'https://hook.us2.make.com/qjdetduht1g375p7l556yrrutbi3j6cv';

/**
 * Convert cents to decimal format (x.xx) for analytics
 */
const formatCentsToDecimal = (amountInCents: number): number => {
  return Math.round((amountInCents / 100) * 100) / 100; // Ensures 2 decimal places
};

/**
 * Sends comprehensive analytics data to Make.com webhook for processing
 */
export async function sendAnalyticsWebhook(payload: AnalyticsWebhookPayload): Promise<void> {
  const startTime = Date.now();

  try {
    console.group('🚀 MAKE.COM WEBHOOK DEBUG');
    console.log('📅 Timestamp:', new Date().toISOString());
    console.log('🌐 Webhook URL:', ANALYTICS_WEBHOOK_URL);
    console.log('📦 Payload size:', JSON.stringify(payload).length, 'characters');
    console.log('📋 Full payload:', JSON.stringify(payload, null, 2));

    // Log key customer data for easy identification
    console.log('🧑‍💼 Customer:', {
      email: payload.customer?.email,
      name: payload.customer?.name,
      transaction_id: payload.transaction?.id
    });

    // Log marketing attribution data
    console.log('📊 Marketing data:', {
      utm_source: payload.marketing?.source,
      utm_medium: payload.marketing?.medium,
      utm_campaign: payload.marketing?.campaign,
      landing_page: payload.marketing?.landing_page,
      referrer: payload.marketing?.referrer
    });

    console.log('💰 Transaction:', {
      amount: payload.transaction?.amounts?.final_amount,
      method: payload.transaction?.payment_method,
      currency: payload.transaction?.currency
    });

    console.log('⏱️ Sending webhook request...');

    const response = await fetch(ANALYTICS_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const duration = Date.now() - startTime;
    console.log('⏱️ Request duration:', duration + 'ms');
    console.log('📈 Response status:', response.status, response.statusText);
    console.log('🌐 Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Response error body:', errorText);
      throw new Error(`Analytics webhook failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const responseText = await response.text();
    console.log('✅ Response body:', responseText || 'Empty response');
    console.log('🎉 MAKE.COM WEBHOOK SUCCESS!');

    // Summary for quick scanning
    console.log(`📝 SUMMARY: Sent ${payload.event?.type} for ${payload.customer?.email} (${payload.transaction?.amounts?.final_amount} ${payload.transaction?.currency})`);

  } catch (error) {
    const duration = Date.now() - startTime;

    console.error('💥 MAKE.COM WEBHOOK ERROR DETAILS:');
    console.error('⏱️ Failed after:', duration + 'ms');
    console.error('🔴 Error type:', error.constructor.name);
    console.error('📝 Error message:', error.message);
    console.error('🔍 Full error:', error);

    // Log network-specific errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.error('🌐 Network error - possible causes:');
      console.error('  - CORS policy blocking request');
      console.error('  - Make.com webhook URL unreachable');
      console.error('  - Internet connection issues');
    }

    // Log make.com specific error hints
    console.error('🔧 Debug hints:');
    console.error('  - Check make.com webhook is active');
    console.error('  - Verify webhook URL is correct');
    console.error('  - Check make.com scenario execution logs');

    // Non-blocking error - don't break user experience
    console.error('⚠️ Continuing with payment process (webhook error is non-blocking)');

  } finally {
    console.groupEnd();
  }
}

/**
 * Helper to build comprehensive analytics payload for payment success
 */
export function buildPaymentSuccessWebhookPayload({
  // Customer data
  customerName,
  customerEmail, 
  customerDocument,
  customerPhone,
  billingStreet,
  billingZipCode,
  billingCity,
  billingState,

  // Transaction data  
  transactionId,
  transactionCode,
  paymentMethod,
  baseAmount,
  finalAmount,
  installments,
  feeAmount,
  feeRate,

  // Plan data
  planId,
  planName,
  planType,
  durationDays,

  // Marketing data
  customParameter,
  utmSource,
  utmMedium,
  utmCampaign,
  utmTerm,
  utmContent,
  referrer,
  landingPage,

  // Optional technical data
  userAgent,
  
}: {
  // Customer data
  customerName: string;
  customerEmail: string;
  customerDocument: string;
  customerPhone: string;
  billingStreet?: string;
  billingZipCode?: string;
  billingCity?: string;
  billingState?: string;

  // Transaction data
  transactionId: string;
  transactionCode: string;
  paymentMethod: 'credit_card' | 'pix';
  baseAmount: number;
  finalAmount: number;
  installments?: number;
  feeAmount?: number;
  feeRate?: string;

  // Plan data
  planId: string;
  planName: string;
  planType: string;
  durationDays: number;

  // Marketing data
  customParameter?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  referrer?: string;
  landingPage?: string;

  // Technical data
  userAgent?: string;
}): AnalyticsWebhookPayload {

  // Generate customer ID hash for privacy-compliant tracking
  const customerIdHash = btoa(`${customerEmail}-${customerDocument}`).slice(0, 12);

  // Calculate discount amount
  const discountAmount = baseAmount - finalAmount;

  // Build comprehensive payload
  return {
    event: {
      type: 'payment_success',
      timestamp: new Date().toISOString(),
      source: 'evidens_v2',
      platform: 'web',
      environment: process.env.NODE_ENV === 'production' ? 'production' : 'development',
      session_id: `session_${Date.now()}`,
    },

    customer: {
      name: customerName,
      email: customerEmail,
      document: customerDocument.replace(/\D/g, ''), // Clean format
      phone: customerPhone.replace(/\D/g, ''), // Clean format
      address: {
        street: billingStreet || '',
        zip_code: billingZipCode || '',
        city: billingCity || '',
        state: billingState || '',
        country: 'BR',
      },
      customer_id_hash: customerIdHash,
    },

    transaction: {
      id: transactionId,
      code: transactionCode,
      payment_method: paymentMethod,
      status: paymentMethod === 'pix' ? 'pending' : 'paid',
      currency: 'BRL',
      amounts: {
        base_amount: formatCentsToDecimal(baseAmount),
        final_amount: formatCentsToDecimal(finalAmount),
        discount_amount: formatCentsToDecimal(discountAmount),
        fee_amount: formatCentsToDecimal(feeAmount || 0),
      },
      ...(installments && installments > 1 && {
        installments: {
          count: installments,
          amount_per_installment: formatCentsToDecimal(Math.round(finalAmount / installments)),
          total_with_fees: formatCentsToDecimal(finalAmount + (feeAmount || 0)),
          fee_rate: feeRate || '0%',
        },
      }),
    },

    product: {
      plan_id: planId,
      plan_name: planName,
      plan_type: planType,
      duration_days: durationDays,
      category: 'subscription',
      sku: `evidens-${planType}-${installments || 1}x`,
      pricing_tier: planType as 'basic' | 'premium' | 'enterprise',
    },

    marketing: {
      custom_parameter: customParameter,
      landing_page: landingPage || (typeof window !== 'undefined' ? window.location.href : undefined),
      referrer: referrer || (typeof document !== 'undefined' ? document.referrer : undefined) || undefined,
      // UTM parameters from passed values or URL fallback
      source: utmSource || (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('utm_source')) || undefined,
      medium: utmMedium || (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('utm_medium')) || undefined,
      campaign: utmCampaign || (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('utm_campaign')) || undefined,
      term: utmTerm || (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('utm_term')) || undefined,
      content: utmContent || (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('utm_content')) || undefined,
    },

    technical: {
      user_agent: userAgent || navigator.userAgent,
      browser_info: {
        language: navigator.language,
      },
      device_info: (() => {
        const deviceInfo = getDeviceInfo();
        return {
          type: deviceInfo.isMobile ? 'mobile' : deviceInfo.isTablet ? 'tablet' : 'desktop',
          screen_resolution: `${screen.width}x${screen.height}`,
          browser: deviceInfo.browser,
          os: deviceInfo.isIOS ? 'iOS' : deviceInfo.isAndroid ? 'Android' : 'Desktop',
          os_version: deviceInfo.osVersion,
        };
      })(),
    },

    conversion: {
      value: formatCentsToDecimal(finalAmount), // Convert cents to decimal for ad platforms
      currency: 'BRL',
      conversion_type: 'purchase',
      customer_lifetime_value: formatCentsToDecimal(finalAmount), // Could be enhanced with historical data
      is_new_customer: true, // Could be enhanced with database check
    },
  };
}