// ABOUTME: Make.com webhook integration service for sending comprehensive transaction data on payment success

import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

// Make.com webhook URL
const MAKE_WEBHOOK_URL = 'https://hook.us2.make.com/qjdetduht1g375p7l556yrrutbi3j6cv';

// Comprehensive webhook data interface
export interface WebhookEventData {
  event: {
    type: string;
    timestamp: string;
    version: string;
    source: string;
    environment: string;
    event_id: string;
    correlation_id: string;
    retry_count: number;
  };
  user: {
    id: string;
    email: string;
    email_verified: boolean;
    full_name: string | null;
    avatar_url: string | null;
    profession: string | null;
    role: string;
    contribution_score: number;
    display_hover_card: boolean;
    created_at: string;
    last_login_at: string | null;
    auth_method: string;
    auth_provider_id: string | null;
    social_profiles: {
      linkedin_url: string | null;
      youtube_url: string | null;
      instagram_url: string | null;
      facebook_url: string | null;
      twitter_url: string | null;
      website_url: string | null;
    };
    activity_metrics: {
      posts_count: number;
      comments_count: number;
      reviews_count: number;
      upvotes_received: number;
      last_activity_at: string | null;
    };
    preferences: {
      language: string;
      timezone: string;
      email_notifications: boolean;
      push_notifications: boolean;
      marketing_emails: boolean;
      display_hover_card: boolean;
    };
  };
  subscription: {
    id: string | null;
    status: string | null;
    tier: string;
    plan: string | null;
    billing_cycle: string | null;
    created_at: string | null;
    trial_started_at: string | null;
    trial_end_date: string | null;
    current_period_start: string | null;
    current_period_end: string | null;
    subscription_end_date: string | null;
    next_billing_date: string | null;
    created_by: string | null;
    payment_method_preferred: string | null;
    subscription_days_granted: number | null;
    admin_notes: string | null;
    cancel_at_period_end: boolean;
    canceled_at: string | null;
    cancellation_reason: string | null;
    pause_collection: string | null;
    pagarme_customer_id: string | null;
    pagarme_subscription_id: string | null;
    evidens_pagarme_customer_id: string | null;
  };
  payment: {
    id: string;
    pagarme_transaction_id?: string;
    status: string;
    amount: number;
    currency: string;
    method: string;
    created_at: string;
    paid_at?: string;
    expires_at?: string;
    customer_info: {
      name: string;
      email: string;
      document?: string;
      phone?: string;
    };
    metadata: Record<string, any>;
    gateway: {
      provider: string;
      gateway_id?: string;
      gateway_status?: string;
      gateway_response?: Record<string, any>;
    };
  };
  context: {
    location: {
      country: string;
      timezone: string;
    };
    device: {
      type: string;
      os?: string;
      browser?: string;
      language: string;
    };
    app: {
      version: string;
      environment: string;
    };
  };
  marketing: {
    segments: string[];
    cohort: string;
    lifecycle_stage: string;
    customer_value_score: number;
    churn_risk_score: number;
    engagement_level: string;
    attribution: {
      first_touch: {
        source: string | null;
        medium: string | null;
        campaign: string | null;
        timestamp: string | null;
      };
      last_touch: {
        source: string | null;
        medium: string | null;
        campaign: string | null;
        timestamp: string | null;
      };
    };
    email_preferences: {
      subscribed_to_newsletter: boolean;
      subscribed_to_product_updates: boolean;
      subscribed_to_marketing: boolean;
      unsubscribe_reason: string | null;
      last_email_opened: string | null;
      email_engagement_score: number;
    };
  };
}

/**
 * Collect comprehensive user and transaction data for webhook
 */
export const collectWebhookData = async (
  userId: string,
  paymentData: {
    id: string;
    amount: number;
    method: string;
    status: string;
    metadata?: Record<string, any>;
    pagarme_transaction_id?: string;
  }
): Promise<WebhookEventData> => {
  try {
    // Get comprehensive user data
    const { data: practitioner } = await supabase
      .from('Practitioners')
      .select('*')
      .eq('id', userId)
      .single();

    // Get auth user data
    const { data: { user } } = await supabase.auth.getUser();

    // Get recent activity metrics (simplified for now)
    const activityMetrics = {
      posts_count: 0, // TODO: Implement when community features are fully integrated
      comments_count: 0,
      reviews_count: 0,
      upvotes_received: practitioner?.contribution_score || 0,
      last_activity_at: new Date().toISOString()
    };

    // Generate event ID and correlation ID
    const eventId = `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const correlationId = `corr_${userId}_${paymentData.id}`;

    // Build comprehensive webhook data
    const webhookData: WebhookEventData = {
      event: {
        type: 'payment.success',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        source: 'evidens_app',
        environment: import.meta.env.PROD ? 'production' : 'development',
        event_id: eventId,
        correlation_id: correlationId,
        retry_count: 0
      },
      user: {
        id: userId,
        email: user?.email || practitioner?.id || 'unknown@evidens.com.br',
        email_verified: user?.email_confirmed_at ? true : false,
        full_name: practitioner?.full_name,
        avatar_url: practitioner?.avatar_url,
        profession: practitioner?.profession,
        role: practitioner?.role || 'practitioner',
        contribution_score: practitioner?.contribution_score || 0,
        display_hover_card: practitioner?.display_hover_card ?? true,
        created_at: practitioner?.created_at || new Date().toISOString(),
        last_login_at: user?.last_sign_in_at,
        auth_method: user?.app_metadata?.provider || 'email',
        auth_provider_id: user?.app_metadata?.provider_id,
        social_profiles: {
          linkedin_url: practitioner?.linkedin_url,
          youtube_url: practitioner?.youtube_url,
          instagram_url: practitioner?.instagram_url,
          facebook_url: practitioner?.facebook_url,
          twitter_url: practitioner?.twitter_url,
          website_url: practitioner?.website_url
        },
        activity_metrics: activityMetrics,
        preferences: {
          language: 'pt-BR',
          timezone: 'America/Sao_Paulo',
          email_notifications: true,
          push_notifications: true,
          marketing_emails: true,
          display_hover_card: practitioner?.display_hover_card ?? true
        }
      },
      subscription: {
        id: practitioner?.subscription_id,
        status: practitioner?.subscription_status,
        tier: practitioner?.subscription_tier || 'free',
        plan: practitioner?.subscription_plan,
        billing_cycle: practitioner?.subscription_tier === 'premium' ? 'monthly' : null,
        created_at: practitioner?.subscription_start_date,
        trial_started_at: practitioner?.evidens_trial_started_at,
        trial_end_date: practitioner?.trial_end_date,
        current_period_start: practitioner?.subscription_start_date,
        current_period_end: practitioner?.subscription_end_date,
        subscription_end_date: practitioner?.subscription_end_date,
        next_billing_date: practitioner?.next_billing_date,
        created_by: practitioner?.subscription_created_by,
        payment_method_preferred: practitioner?.payment_method_preferred,
        subscription_days_granted: practitioner?.subscription_days_granted,
        admin_notes: practitioner?.admin_subscription_notes,
        cancel_at_period_end: false,
        canceled_at: null,
        cancellation_reason: null,
        pause_collection: null,
        pagarme_customer_id: practitioner?.pagarme_customer_id,
        pagarme_subscription_id: practitioner?.subscription_id,
        evidens_pagarme_customer_id: practitioner?.evidens_pagarme_customer_id
      },
      payment: {
        id: paymentData.id,
        pagarme_transaction_id: paymentData.pagarme_transaction_id,
        status: paymentData.status,
        amount: paymentData.amount,
        currency: 'BRL',
        method: paymentData.method,
        created_at: new Date().toISOString(),
        paid_at: new Date().toISOString(),
        customer_info: {
          name: paymentData.metadata?.customerName || practitioner?.full_name || 'Unknown',
          email: paymentData.metadata?.customerEmail || user?.email || 'unknown@evidens.com.br',
          document: paymentData.metadata?.customerDocument,
          phone: paymentData.metadata?.customerPhone
        },
        metadata: paymentData.metadata || {},
        gateway: {
          provider: 'pagarme',
          gateway_id: paymentData.pagarme_transaction_id,
          gateway_status: paymentData.status
        }
      },
      context: {
        location: {
          country: 'BR',
          timezone: 'America/Sao_Paulo'
        },
        device: {
          type: 'desktop',
          language: 'pt-BR'
        },
        app: {
          version: '1.0.0',
          environment: import.meta.env.PROD ? 'production' : 'development'
        }
      },
      marketing: {
        segments: ['healthcare_professionals', practitioner?.subscription_tier === 'premium' ? 'premium_users' : 'free_users'],
        cohort: new Date().toISOString().slice(0, 7), // YYYY-MM format
        lifecycle_stage: practitioner?.subscription_tier === 'premium' ? 'customer' : 'prospect',
        customer_value_score: calculateCustomerValue(practitioner),
        churn_risk_score: calculateChurnRisk(practitioner),
        engagement_level: calculateEngagementLevel(practitioner),
        attribution: {
          first_touch: {
            source: null,
            medium: null,
            campaign: null,
            timestamp: practitioner?.created_at
          },
          last_touch: {
            source: paymentData.metadata?.campaign_source || null,
            medium: paymentData.metadata?.campaign_medium || null,
            campaign: paymentData.metadata?.campaign_name || null,
            timestamp: new Date().toISOString()
          }
        },
        email_preferences: {
          subscribed_to_newsletter: true,
          subscribed_to_product_updates: true,
          subscribed_to_marketing: true,
          unsubscribe_reason: null,
          last_email_opened: null,
          email_engagement_score: 50 // Default neutral score
        }
      }
    };

    return webhookData;
  } catch (error) {
    console.error('Error collecting webhook data:', error);
    throw new Error(`Failed to collect webhook data: ${error.message}`);
  }
};

/**
 * Send webhook to Make.com with retry logic
 */
export const sendWebhookToMake = async (
  webhookData: WebhookEventData,
  options: {
    retries?: number;
    timeout?: number;
  } = {}
): Promise<{ success: boolean; response?: any; error?: string }> => {
  const { retries = 3, timeout = 30000 } = options;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`Sending webhook to Make.com (attempt ${attempt}/${retries})`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(MAKE_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookData),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const result = await response.text();
        console.log('Webhook sent successfully to Make.com');
        return { success: true, response: result };
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error(`Webhook attempt ${attempt} failed:`, error);
      
      if (attempt === retries) {
        return { 
          success: false, 
          error: `All ${retries} attempts failed. Last error: ${error.message}` 
        };
      }
      
      // Exponential backoff: wait 2^attempt seconds before retry
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }

  return { success: false, error: 'Unexpected error in webhook retry logic' };
};

/**
 * Main function to trigger webhook after payment success
 */
export const triggerPaymentSuccessWebhook = async (
  userId: string,
  paymentData: {
    id: string;
    amount: number;
    method: string;
    status: string;
    metadata?: Record<string, any>;
    pagarme_transaction_id?: string;
  }
): Promise<void> => {
  try {
    console.log('Triggering payment success webhook for user:', userId);
    
    // Collect comprehensive data
    const webhookData = await collectWebhookData(userId, paymentData);
    
    // Send to Make.com (non-blocking - don't throw if it fails)
    const result = await sendWebhookToMake(webhookData);
    
    if (result.success) {
      console.log('Payment success webhook sent successfully');
    } else {
      console.error('Payment success webhook failed:', result.error);
    }
  } catch (error) {
    console.error('Error in payment success webhook:', error);
    // Don't throw - we don't want webhook failures to affect payment success
  }
};

// Helper functions for calculating marketing metrics
const calculateCustomerValue = (practitioner: any): number => {
  if (!practitioner) return 0;
  
  let score = 0;
  if (practitioner.subscription_tier === 'premium') score += 80;
  if (practitioner.contribution_score > 100) score += 20;
  
  return Math.min(score, 100);
};

const calculateChurnRisk = (practitioner: any): number => {
  if (!practitioner) return 50;
  
  let risk = 20; // Base risk
  if (practitioner.subscription_status === 'past_due') risk += 50;
  if (practitioner.subscription_status === 'canceled') risk = 100;
  if (!practitioner.last_payment_date) risk += 20;
  
  return Math.min(risk, 100);
};

const calculateEngagementLevel = (practitioner: any): string => {
  if (!practitioner) return 'low';
  
  const score = practitioner.contribution_score || 0;
  if (score > 200) return 'high';
  if (score > 100) return 'medium';
  return 'low';
};

/**
 * Create a test webhook with sample data for admin testing
 */
export const createTestWebhook = async (): Promise<WebhookEventData> => {
  const sampleData: WebhookEventData = {
    event: {
      type: 'payment.success.test',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      source: 'evidens_app',
      environment: 'test',
      event_id: `evt_test_${Date.now()}`,
      correlation_id: `corr_test_${Date.now()}`,
      retry_count: 0
    },
    user: {
      id: 'user_test_123',
      email: 'dr.teste@evidens.com.br',
      email_verified: true,
      full_name: 'Dr. João da Silva (Teste)',
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=test',
      profession: 'Médico',
      role: 'practitioner',
      contribution_score: 150,
      display_hover_card: true,
      created_at: '2024-12-01T10:00:00Z',
      last_login_at: new Date().toISOString(),
      auth_method: 'google',
      auth_provider_id: 'google_test_12345',
      social_profiles: {
        linkedin_url: 'https://linkedin.com/in/drjoaoteste',
        youtube_url: null,
        instagram_url: '@drjoaoteste',
        facebook_url: null,
        twitter_url: '@drjoaoteste',
        website_url: 'https://drjoaoteste.med.br'
      },
      activity_metrics: {
        posts_count: 5,
        comments_count: 25,
        reviews_count: 3,
        upvotes_received: 150,
        last_activity_at: new Date().toISOString()
      },
      preferences: {
        language: 'pt-BR',
        timezone: 'America/Sao_Paulo',
        email_notifications: true,
        push_notifications: true,
        marketing_emails: true,
        display_hover_card: true
      }
    },
    subscription: {
      id: 'sub_test_123',
      status: 'active',
      tier: 'premium',
      plan: 'monthly_premium',
      billing_cycle: 'monthly',
      created_at: new Date().toISOString(),
      trial_started_at: null,
      trial_end_date: null,
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      subscription_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      next_billing_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      created_by: 'user',
      payment_method_preferred: 'pix',
      subscription_days_granted: 30,
      admin_notes: null,
      cancel_at_period_end: false,
      canceled_at: null,
      cancellation_reason: null,
      pause_collection: null,
      pagarme_customer_id: 'cust_test_123',
      pagarme_subscription_id: 'sub_pagarme_test_123',
      evidens_pagarme_customer_id: 'cust_evidens_test_123'
    },
    payment: {
      id: 'pay_test_123',
      pagarme_transaction_id: 'tran_test_123',
      status: 'paid',
      amount: 9700,
      currency: 'BRL',
      method: 'pix',
      created_at: new Date().toISOString(),
      paid_at: new Date().toISOString(),
      customer_info: {
        name: 'Dr. João da Silva (Teste)',
        email: 'dr.teste@evidens.com.br',
        document: '123.456.789-00',
        phone: '+55 11 99999-9999'
      },
      metadata: {
        customerName: 'Dr. João da Silva (Teste)',
        customerEmail: 'dr.teste@evidens.com.br',
        planName: 'Premium Mensal',
        campaign_source: 'google',
        campaign_medium: 'cpc'
      },
      gateway: {
        provider: 'pagarme',
        gateway_id: 'tran_test_123',
        gateway_status: 'paid'
      }
    },
    context: {
      location: {
        country: 'BR',
        timezone: 'America/Sao_Paulo'
      },
      device: {
        type: 'desktop',
        os: 'Windows',
        browser: 'Chrome',
        language: 'pt-BR'
      },
      app: {
        version: '1.0.0',
        environment: 'test'
      }
    },
    marketing: {
      segments: ['healthcare_professionals', 'premium_users', 'test_users'],
      cohort: new Date().toISOString().slice(0, 7),
      lifecycle_stage: 'customer',
      customer_value_score: 85,
      churn_risk_score: 15,
      engagement_level: 'high',
      attribution: {
        first_touch: {
          source: 'google',
          medium: 'organic',
          campaign: null,
          timestamp: '2024-12-01T10:00:00Z'
        },
        last_touch: {
          source: 'google',
          medium: 'cpc',
          campaign: 'premium_test',
          timestamp: new Date().toISOString()
        }
      },
      email_preferences: {
        subscribed_to_newsletter: true,
        subscribed_to_product_updates: true,
        subscribed_to_marketing: true,
        unsubscribe_reason: null,
        last_email_opened: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        email_engagement_score: 85
      }
    }
  };

  return sampleData;
};

/**
 * Send test webhook to Make.com (for admin testing)
 */
export const sendTestWebhook = async (): Promise<{ success: boolean; response?: any; error?: string }> => {
  try {
    const testData = await createTestWebhook();
    return await sendWebhookToMake(testData);
  } catch (error) {
    return { success: false, error: error.message };
  }
};