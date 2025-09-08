// ABOUTME: Comprehensive webhook test for external integrations with all possible EVIDENS data points

// Comprehensive JSON model for EVIDENS external integrations
const evidensIntegrationSchema = {
  // Event metadata
  event: {
    type: "user.subscription.activated", // Event types: user.*, subscription.*, payment.*, content.*, community.*
    timestamp: "2025-01-08T15:30:45.123Z",
    version: "1.0.0",
    source: "evidens_app",
    environment: "production", // production | staging | development
    event_id: "evt_12345abcd",
    correlation_id: "corr_abc123def456", // For tracking related events
    retry_count: 0
  },

  // Core user information
  user: {
    id: "user_550e8400-e29b-41d4-a716-446655440000",
    email: "dr.joao.silva@gmail.com",
    email_verified: true,
    full_name: "Dr. João Silva",
    avatar_url: "https://storage.googleapis.com/avatars/dr-joao.jpg",
    profession: "Médico",
    role: "practitioner", // practitioner | admin | moderator
    contribution_score: 145,
    display_hover_card: true,
    created_at: "2024-12-01T10:00:00Z",
    last_login_at: "2025-01-08T14:00:00Z",
    
    // Auth method information
    auth_method: "google", // google | email | apple
    auth_provider_id: "google_12345678",
    
    // Social profiles
    social_profiles: {
      linkedin_url: "https://linkedin.com/in/drjoaosilva",
      youtube_url: "https://youtube.com/@drjoaosilva",
      instagram_url: "@drjoaosilva",
      facebook_url: "https://facebook.com/drjoaosilva",
      twitter_url: "@drjoaosilva",
      website_url: "https://drjoaosilva.med.br"
    },
    
    // Activity metrics
    activity_metrics: {
      posts_count: 23,
      comments_count: 87,
      reviews_count: 12,
      upvotes_received: 156,
      last_activity_at: "2025-01-08T13:45:00Z"
    },
    
    // User preferences and settings
    preferences: {
      language: "pt-BR",
      timezone: "America/Sao_Paulo",
      email_notifications: true,
      push_notifications: true,
      marketing_emails: true,
      display_hover_card: true
    }
  },

  // Subscription information
  subscription: {
    id: "sub_789xyz456abc",
    status: "active", // active | trialing | past_due | canceled | unpaid | suspended
    tier: "premium", // free | premium | professional | enterprise
    plan: "monthly_premium",
    billing_cycle: "monthly", // monthly | yearly | lifetime
    
    // Dates and timing
    created_at: "2025-01-01T00:00:00Z",
    trial_started_at: "2024-12-25T00:00:00Z",
    trial_end_date: "2025-01-01T00:00:00Z",
    current_period_start: "2025-01-01T00:00:00Z",
    current_period_end: "2025-02-01T00:00:00Z",
    subscription_end_date: "2025-02-01T00:00:00Z",
    next_billing_date: "2025-02-01T00:00:00Z",
    
    // Management info
    created_by: "user", // user | admin | webhook
    payment_method_preferred: "pix",
    subscription_days_granted: 30,
    admin_notes: null,
    
    // Cancel/pause information
    cancel_at_period_end: false,
    canceled_at: null,
    cancellation_reason: null,
    pause_collection: null,
    
    // Integration IDs
    pagarme_customer_id: "cust_pagarme_123456",
    pagarme_subscription_id: "sub_pagarme_789012",
    evidens_pagarme_customer_id: "cust_evidens_345678"
  },

  // Payment information
  payment: {
    id: "pay_abc123def456",
    pagarme_transaction_id: "tran_pagarme_987654",
    status: "paid", // pending | paid | failed | canceled | refunded
    amount: 9700, // Amount in cents (R$ 97.00)
    currency: "BRL",
    method: "pix", // pix | credit_card | boleto | debit_card
    
    // Payment dates
    created_at: "2025-01-01T12:00:00Z",
    paid_at: "2025-01-01T12:05:23Z",
    expires_at: "2025-01-01T23:59:59Z",
    
    // Customer information at payment time
    customer_info: {
      name: "Dr. João Silva",
      email: "dr.joao.silva@gmail.com",
      document: "123.456.789-00",
      phone: "+55 11 99999-9999",
      address: {
        street: "Rua das Flores, 123",
        neighborhood: "Jardins",
        city: "São Paulo",
        state: "SP",
        postal_code: "01234-567",
        country: "BR"
      }
    },
    
    // Payment metadata
    metadata: {
      plan_name: "Premium Mensal",
      campaign_source: "google_ads",
      referrer: "https://evidens.com.br/premium",
      user_agent: "Mozilla/5.0...",
      ip_address: "192.168.1.1"
    },
    
    // Gateway information
    gateway: {
      provider: "pagarme",
      gateway_id: "pagarme_charge_xyz789",
      gateway_status: "paid",
      gateway_response: {
        authorization_code: "AUTH123456",
        tid: "TID789012345",
        nsu: "NSU123456789"
      }
    },
    
    // Fees and breakdown
    fee_details: {
      gateway_fee: 290, // R$ 2.90 in cents
      platform_fee: 0,
      net_amount: 9410 // R$ 94.10 in cents
    }
  },

  // Content/Community context (if applicable)
  content: {
    type: null, // post | review | comment | announcement
    id: null,
    title: null,
    category: null,
    tags: [],
    engagement_metrics: {
      views: 0,
      likes: 0,
      comments: 0,
      shares: 0
    }
  },

  // Journey and context information
  journey: {
    source: "payment", // payment | google-auth | direct | campaign
    campaign: {
      name: "premium_upgrade_q1_2025",
      medium: "google_ads",
      source: "google",
      term: "plataforma médicos evidens",
      content: "premium_cta_banner"
    },
    funnel_step: "conversion", // awareness | consideration | trial | conversion | retention
    previous_page: "/pagamento",
    landing_page: "/premium",
    session_id: "sess_abc123def456",
    referrer: "https://google.com/search"
  },

  // Geographic and device information
  context: {
    location: {
      country: "BR",
      country_name: "Brazil",
      region: "SP",
      region_name: "São Paulo",
      city: "São Paulo",
      timezone: "America/Sao_Paulo",
      latitude: -23.5505,
      longitude: -46.6333
    },
    device: {
      type: "desktop", // desktop | mobile | tablet
      os: "Windows",
      os_version: "11",
      browser: "Chrome",
      browser_version: "120.0.0.0",
      screen_resolution: "1920x1080",
      language: "pt-BR"
    },
    app: {
      version: "1.2.3",
      build: "20250108.1",
      environment: "production"
    }
  },

  // Marketing and segmentation data
  marketing: {
    segments: ["healthcare_professionals", "premium_prospects", "sao_paulo_users"],
    cohort: "january_2025",
    lifecycle_stage: "customer", // lead | trial | customer | champion | churned
    customer_value_score: 85, // 0-100
    churn_risk_score: 15, // 0-100, lower is better
    engagement_level: "high", // low | medium | high
    
    // Attribution data
    attribution: {
      first_touch: {
        source: "google",
        medium: "organic",
        campaign: null,
        timestamp: "2024-11-15T10:00:00Z"
      },
      last_touch: {
        source: "google",
        medium: "cpc",
        campaign: "premium_upgrade_q1_2025",
        timestamp: "2025-01-01T11:30:00Z"
      }
    },
    
    // Email marketing data
    email_preferences: {
      subscribed_to_newsletter: true,
      subscribed_to_product_updates: true,
      subscribed_to_marketing: true,
      unsubscribe_reason: null,
      last_email_opened: "2025-01-07T09:00:00Z",
      email_engagement_score: 78
    }
  },

  // Business intelligence data
  business_metrics: {
    ltv_prediction: 485.50, // Lifetime Value prediction in BRL
    acquisition_cost: 45.20, // Customer Acquisition Cost in BRL
    payback_period_days: 30, // Days to recover acquisition cost
    monthly_recurring_revenue: 97.00, // MRR contribution in BRL
    revenue_growth_rate: 0.15, // 15% growth rate
    retention_probability: 0.87 // 87% retention probability
  },

  // Platform-specific data
  evidens_data: {
    user_tier: "premium",
    access_level: "full",
    feature_flags: {
      beta_editor: true,
      advanced_analytics: true,
      premium_content: true,
      priority_support: true
    },
    usage_metrics: {
      daily_active_days_last_30: 24,
      reviews_published: 12,
      community_interactions: 87,
      content_views_generated: 2450,
      average_session_duration: 1847 // seconds
    }
  }
};

// Realistic Test Scenarios for EVIDENS Webhook Integration

// Scenario 1: New User Trial Activation
const trialActivationScenario = {
  ...evidensIntegrationSchema,
  event: {
    type: "user.trial.activated",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    source: "evidens_app",
    environment: "production",
    event_id: `evt_trial_${Date.now()}`,
    correlation_id: `corr_trial_${Date.now()}`,
    retry_count: 0
  },
  user: {
    ...evidensIntegrationSchema.user,
    id: "user_new_trial_123",
    full_name: "Dra. Maria Santos",
    email: "dra.maria.santos@outlook.com",
    created_at: new Date().toISOString(),
    contribution_score: 0,
    activity_metrics: {
      posts_count: 0,
      comments_count: 0,
      reviews_count: 0,
      upvotes_received: 0,
      last_activity_at: new Date().toISOString()
    }
  },
  subscription: {
    ...evidensIntegrationSchema.subscription,
    status: "trialing",
    tier: "free",
    plan: "trial_premium",
    trial_started_at: new Date().toISOString(),
    trial_end_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days
    subscription_days_granted: 14
  },
  marketing: {
    ...evidensIntegrationSchema.marketing,
    lifecycle_stage: "trial",
    segments: ["healthcare_professionals", "trial_users", "new_users"],
    churn_risk_score: 45 // Higher risk for trial users
  }
};

// Scenario 2: Payment Failure
const paymentFailureScenario = {
  ...evidensIntegrationSchema,
  event: {
    type: "payment.failed",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    source: "evidens_app",
    environment: "production",
    event_id: `evt_payment_fail_${Date.now()}`,
    correlation_id: `corr_payment_fail_${Date.now()}`,
    retry_count: 2 // Second retry
  },
  user: {
    ...evidensIntegrationSchema.user,
    id: "user_payment_issue_456",
    email: "dr.carlos.oliveira@gmail.com",
    full_name: "Dr. Carlos Oliveira"
  },
  subscription: {
    ...evidensIntegrationSchema.subscription,
    status: "past_due",
    tier: "premium",
    plan: "monthly_premium"
  },
  payment: {
    ...evidensIntegrationSchema.payment,
    id: "pay_failed_789",
    status: "failed",
    method: "credit_card",
    paid_at: null,
    gateway: {
      provider: "pagarme",
      gateway_id: "pagarme_charge_failed_xyz",
      gateway_status: "failed",
      gateway_response: {
        error_code: "insufficient_funds",
        error_message: "Insufficient funds on credit card",
        decline_reason: "generic_decline"
      }
    }
  },
  marketing: {
    ...evidensIntegrationSchema.marketing,
    lifecycle_stage: "customer",
    churn_risk_score: 75, // High churn risk due to payment failure
    segments: ["payment_failed", "premium_users", "at_risk"]
  }
};

// Scenario 3: Subscription Cancellation
const subscriptionCancellationScenario = {
  ...evidensIntegrationSchema,
  event: {
    type: "subscription.cancelled",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    source: "evidens_app",
    environment: "production",
    event_id: `evt_cancel_${Date.now()}`,
    correlation_id: `corr_cancel_${Date.now()}`,
    retry_count: 0
  },
  user: {
    ...evidensIntegrationSchema.user,
    id: "user_cancelling_789",
    email: "dr.ana.costa@hospital.com.br",
    full_name: "Dra. Ana Costa"
  },
  subscription: {
    ...evidensIntegrationSchema.subscription,
    status: "canceled",
    tier: "free", // Downgraded to free
    plan: null,
    cancel_at_period_end: true,
    canceled_at: new Date().toISOString(),
    cancellation_reason: "too_expensive",
    admin_notes: "User cited cost as primary reason for cancellation"
  },
  marketing: {
    ...evidensIntegrationSchema.marketing,
    lifecycle_stage: "churned",
    churn_risk_score: 100, // Already churned
    segments: ["churned_users", "cost_sensitive", "former_premium"]
  }
};

// Scenario 4: High-Value Customer Payment Success
const highValueCustomerScenario = {
  ...evidensIntegrationSchema,
  event: {
    type: "payment.success.high_value",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    source: "evidens_app",
    environment: "production",
    event_id: `evt_high_value_${Date.now()}`,
    correlation_id: `corr_high_value_${Date.now()}`,
    retry_count: 0
  },
  user: {
    ...evidensIntegrationSchema.user,
    id: "user_high_value_999",
    email: "prof.ricardo.silva@usp.br",
    full_name: "Prof. Dr. Ricardo Silva",
    profession: "Professor de Medicina",
    contribution_score: 850, // Very high contributor
    activity_metrics: {
      posts_count: 145,
      comments_count: 423,
      reviews_count: 67,
      upvotes_received: 1250,
      last_activity_at: new Date().toISOString()
    }
  },
  subscription: {
    ...evidensIntegrationSchema.subscription,
    tier: "professional",
    plan: "yearly_professional",
    billing_cycle: "yearly",
    subscription_days_granted: 365
  },
  payment: {
    ...evidensIntegrationSchema.payment,
    amount: 58800, // R$ 588.00 (yearly plan with discount)
    method: "credit_card",
    metadata: {
      ...evidensIntegrationSchema.payment.metadata,
      plan_name: "Profissional Anual",
      discount_applied: 1200, // R$ 12.00 discount
      campaign_source: "email_campaign"
    }
  },
  business_metrics: {
    ...evidensIntegrationSchema.business_metrics,
    ltv_prediction: 1250.00, // Higher LTV for professional plan
    monthly_recurring_revenue: 49.00, // Yearly plan normalized to monthly
    retention_probability: 0.95 // Very high retention for engaged users
  },
  marketing: {
    ...evidensIntegrationSchema.marketing,
    segments: ["high_value_customers", "professors", "yearly_subscribers", "power_users"],
    lifecycle_stage: "champion",
    customer_value_score: 95,
    churn_risk_score: 5 // Very low churn risk
  }
};

// Scenario 5: Mobile User PIX Payment
const mobilePixPaymentScenario = {
  ...evidensIntegrationSchema,
  event: {
    type: "payment.success.mobile_pix",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    source: "evidens_mobile_app",
    environment: "production",
    event_id: `evt_mobile_pix_${Date.now()}`,
    correlation_id: `corr_mobile_pix_${Date.now()}`,
    retry_count: 0
  },
  user: {
    ...evidensIntegrationSchema.user,
    id: "user_mobile_123",
    email: "dra.julia.mendes@clinica.com.br",
    full_name: "Dra. Júlia Mendes"
  },
  payment: {
    ...evidensIntegrationSchema.payment,
    method: "pix",
    paid_at: new Date(Date.now() - 30000).toISOString(), // Paid 30 seconds ago (fast PIX)
    gateway: {
      provider: "pagarme",
      gateway_id: "pagarme_pix_instant_xyz",
      gateway_status: "paid",
      gateway_response: {
        pix_qr_code: "00020101021226580014br.gov.bcb.pix...",
        pix_expiration: new Date(Date.now() + 10 * 60 * 1000).toISOString()
      }
    }
  },
  context: {
    ...evidensIntegrationSchema.context,
    device: {
      type: "mobile",
      os: "iOS",
      os_version: "17.2",
      browser: "Safari",
      browser_version: "17.2",
      screen_resolution: "390x844",
      language: "pt-BR"
    }
  },
  journey: {
    ...evidensIntegrationSchema.journey,
    source: "mobile_app",
    campaign: {
      name: "mobile_first_premium",
      medium: "push_notification",
      source: "app",
      term: "premium_upgrade",
      content: "mobile_exclusive_offer"
    }
  }
};

// Function to send test webhook with scenario details
async function sendTestWebhook(scenario, scenarioName) {
  const webhookUrl = "https://hook.us2.make.com/qjdetduht1g375p7l556yrrutbi3j6cv";
  
  console.log(`\n🚀 Sending ${scenarioName} webhook to Make.com...`);
  console.log("📦 Payload size:", JSON.stringify(scenario).length, "characters");
  console.log("👤 User:", scenario.user.full_name);
  console.log("🎯 Event:", scenario.event.type);
  console.log("💰 Payment Status:", scenario.payment.status);
  console.log("📱 Device:", scenario.context.device.type);
  
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Evidens-Event': scenario.event.type,
        'X-Evidens-Version': scenario.event.version,
        'X-Evidens-Signature': 'sha256=mock_signature_for_security_validation',
        'X-Evidens-Scenario': scenarioName
      },
      body: JSON.stringify(scenario)
    });
    
    if (response.ok) {
      console.log("✅ Webhook sent successfully!");
      console.log("📊 Response status:", response.status);
      const responseText = await response.text();
      console.log("📋 Response body:", responseText || "Empty response");
    } else {
      console.error("❌ Webhook failed:", response.status, response.statusText);
    }
  } catch (error) {
    console.error("💥 Error sending webhook:", error);
  }
}

// Execute comprehensive test scenarios
async function runComprehensiveTests() {
  console.log("🧪 Starting comprehensive EVIDENS webhook integration tests...");
  console.log("📅 Test Date:", new Date().toLocaleString('pt-BR'));
  console.log("🌐 Environment: Production");
  
  const scenarios = [
    { data: evidensIntegrationSchema, name: "Premium Subscription Success" },
    { data: trialActivationScenario, name: "New User Trial Activation" },
    { data: paymentFailureScenario, name: "Payment Failure Recovery" },
    { data: subscriptionCancellationScenario, name: "Subscription Cancellation" },
    { data: highValueCustomerScenario, name: "High-Value Customer Success" },
    { data: mobilePixPaymentScenario, name: "Mobile PIX Payment" }
  ];
  
  for (let i = 0; i < scenarios.length; i++) {
    await sendTestWebhook(scenarios[i].data, scenarios[i].name);
    
    // Add delay between requests to avoid rate limiting
    if (i < scenarios.length - 1) {
      console.log("⏱️ Waiting 2 seconds before next test...");
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  console.log("\n🎉 All webhook integration tests completed!");
  console.log("📊 Total scenarios tested:", scenarios.length);
}

// Execute the comprehensive test suite
runComprehensiveTests();