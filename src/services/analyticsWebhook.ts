// ABOUTME: Analytics webhook service for sending comprehensive payment event data to Make.com for analytics and ad tracking

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
  try {
    console.log('🔥 Analytics Webhook - Sending payload:', payload);

    const response = await fetch(ANALYTICS_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Analytics webhook failed: ${response.status} ${response.statusText}`);
    }

    const responseText = await response.text();
    console.log('✅ Analytics Webhook - Success:', responseText || 'No response body');

  } catch (error) {
    // Non-blocking error - don't break user experience
    console.error('❌ Analytics Webhook - Error:', error);
    
    // Could also send to error monitoring service here
    // Sentry.captureException(error, { tags: { source: 'analytics_webhook' } });
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
      landing_page: window.location.href,
      referrer: document.referrer || undefined,
      // UTM parameters would be parsed from URL if available
      ...(new URLSearchParams(window.location.search).get('utm_source') && {
        source: new URLSearchParams(window.location.search).get('utm_source')!,
      }),
      ...(new URLSearchParams(window.location.search).get('utm_medium') && {
        medium: new URLSearchParams(window.location.search).get('utm_medium')!,
      }),
      ...(new URLSearchParams(window.location.search).get('utm_campaign') && {
        campaign: new URLSearchParams(window.location.search).get('utm_campaign')!,
      }),
    },

    technical: {
      user_agent: userAgent || navigator.userAgent,
      browser_info: {
        language: navigator.language,
      },
      device_info: {
        type: /Mobile|Android|iPhone|iPad/.test(navigator.userAgent) ? 'mobile' : 'desktop',
        screen_resolution: `${screen.width}x${screen.height}`,
      },
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