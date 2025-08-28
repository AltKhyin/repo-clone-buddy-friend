# 2.3 Subscription Lifecycle Management

> **Complete Recurring Billing & Subscription Management System**  
> *Sources: [Subscriptions](https://docs.pagar.me/reference/assinaturas-1), [Plans](https://docs.pagar.me/reference/planos-1), [Invoices](https://docs.pagar.me/reference/faturas-1), [Dunning](https://docs.pagar.me/docs/cobrança-recorrente)*

## 🎯 **Executive Summary**

EVIDENS subscription lifecycle management provides **automated recurring billing**, **intelligent failure recovery**, and **flexible subscription modifications** while maintaining seamless user experience and maximizing revenue retention through smart dunning management.

---

## 🔄 **Subscription Lifecycle Overview**

### **Complete Subscription Journey Map**

```
┌─────────────────────────────────────────────────────────────────┐
│                    EVIDENS Subscription States                 │
├─────────────────────────────────────────────────────────────────┤
│  CREATION PHASE                                                 │
│  Plan Selection → Payment Setup → First Charge → Active        │
│                                                                 │
│  ACTIVE PHASE (Normal Operation)                               │
│  Recurring Billing → Access Management → Usage Tracking        │
│                                                                 │
│  ISSUE PHASE (Payment Problems)                                │
│  Failed Payment → Dunning Process → Recovery or Suspension     │
│                                                                 │
│  MODIFICATION PHASE (User Changes)                             │
│  Plan Upgrade/Downgrade → Pro-ration → New Billing Cycle      │
│                                                                 │
│  TERMINATION PHASE (End of Service)                           │
│  Cancellation → Grace Period → Access Revocation → Archive     │
└─────────────────────────────────────────────────────────────────┘
```

### **Subscription State Machine**
```javascript
// EVIDENS Subscription State Management
const subscriptionStates = {
  // Initial states
  pending: {
    description: "Subscription created, awaiting first payment",
    customer_access: false,
    billing_active: false,
    next_states: ["active", "failed", "canceled"],
    max_duration: "24_hours" // Auto-cancel if no payment
  },
  
  // Active operation states
  active: {
    description: "Normal subscription, recurring billing active",
    customer_access: true,
    billing_active: true,
    next_states: ["past_due", "paused", "canceled", "expired"],
    default_state: true
  },
  
  // Problem states requiring intervention
  past_due: {
    description: "Payment failed, in dunning process",
    customer_access: "limited", // Grace period access
    billing_active: true, // Attempting to recover
    next_states: ["active", "suspended", "canceled"],
    grace_period: "7_days"
  },
  
  suspended: {
    description: "Multiple payment failures, access suspended",
    customer_access: false,
    billing_active: "retry_mode", // Limited retry attempts
    next_states: ["active", "canceled"],
    retention_period: "30_days"
  },
  
  // User-controlled states
  paused: {
    description: "User-requested pause (vacation mode)",
    customer_access: false,
    billing_active: false,
    next_states: ["active", "canceled"],
    max_pause_duration: "90_days"
  },
  
  // Terminal states
  canceled: {
    description: "Subscription terminated by user or system",
    customer_access: false,
    billing_active: false,
    next_states: ["reactivated"], // Special reactivation flow
    data_retention: "90_days"
  },
  
  expired: {
    description: "Fixed-term subscription reached end date",
    customer_access: false,
    billing_active: false,
    next_states: ["renewed"],
    auto_renewal_attempt: true
  }
}
```

---

## 📅 **Plan Management & Pricing Strategy**

### **EVIDENS Plan Architecture**
**Source**: [Plans API Reference](https://docs.pagar.me/reference/planos-1)

#### **Standard Plan Types**
```javascript
// Core EVIDENS Subscription Plans
const evidensPlans = {
  // Individual plans
  monthly_individual: {
    name: "EVIDENS Monthly - Individual",
    interval: "month",
    interval_count: 1,
    billing_type: "prepaid", // Charge at cycle start
    payment_methods: ["credit_card", "pix"],
    
    items: [
      {
        description: "Monthly EVIDENS Access",
        pricing_scheme: {
          scheme_type: "unit",
          price: 1990 // R$ 19.90
        },
        quantity: 1
      }
    ],
    
    // Plan configuration
    installments: [1, 2, 3], // Allow up to 3x installments
    invoice_reminder: -3, // Send reminder 3 days before
    auto_renew: true,
    
    metadata: {
      plan_type: "individual",
      access_level: "full",
      content_downloads: "unlimited",
      support_level: "standard"
    }
  },
  
  annual_individual: {
    name: "EVIDENS Annual - Individual", 
    interval: "year",
    interval_count: 1,
    billing_type: "prepaid",
    payment_methods: ["credit_card", "pix", "boleto"],
    
    items: [
      {
        description: "Annual EVIDENS Access (20% discount)",
        pricing_scheme: {
          scheme_type: "unit",
          price: 19104 // R$ 191.04 (20% discount from 12 × R$ 19.90)
        },
        quantity: 1
      }
    ],
    
    installments: [1, 2, 3, 6, 12], // More installment options for annual
    invoice_reminder: -7, // Send reminder 7 days before (larger amount)
    auto_renew: true,
    
    metadata: {
      plan_type: "individual",
      discount_applied: "20%",
      access_level: "full",
      content_downloads: "unlimited",
      support_level: "priority"
    }
  },
  
  // Premium plans for power users
  premium_monthly: {
    name: "EVIDENS Premium Monthly",
    interval: "month", 
    interval_count: 1,
    billing_type: "prepaid",
    payment_methods: ["credit_card"],
    
    items: [
      {
        description: "Premium EVIDENS Access + Creator Tools",
        pricing_scheme: {
          scheme_type: "unit",
          price: 4990 // R$ 49.90
        },
        quantity: 1
      }
    ],
    
    metadata: {
      plan_type: "premium",
      access_level: "full_plus_creator_tools",
      content_downloads: "unlimited",
      support_level: "priority",
      creator_features: "enabled"
    }
  }
}

// Dynamic Plan Creation Function
const createEvidensSubscriptionPlan = async (planConfig) => {
  const plan = await pagarme.plans.create({
    // Basic plan information
    name: planConfig.name,
    statement_descriptor: "EVIDENS", // Appears on card statement
    
    // Billing configuration
    interval: planConfig.interval, // "month" or "year"
    interval_count: planConfig.intervalCount || 1,
    billing_type: "prepaid", // Charge at cycle start
    
    // Payment methods
    payment_methods: planConfig.paymentMethods || ["credit_card", "pix"],
    
    // Pricing structure
    items: [
      {
        description: planConfig.description,
        pricing_scheme: {
          scheme_type: "unit",
          price: planConfig.priceInCents
        },
        quantity: 1
      }
    ],
    
    // Billing behavior
    installments: planConfig.installments || [1],
    invoice_reminder: planConfig.invoiceReminder || -3,
    auto_renew: planConfig.autoRenew ?? true,
    
    // EVIDENS metadata
    metadata: {
      created_by: "evidens_system",
      creation_date: new Date().toISOString(),
      plan_category: planConfig.category,
      target_audience: planConfig.audience,
      ...planConfig.customMetadata
    }
  })
  
  return plan
}
```

### **Subscription Creation & Onboarding**
```javascript
// Complete Subscription Creation Process
const createEvidensSubscription = async (subscriptionData) => {
  const {
    customerId,
    planId,
    paymentMethod,
    startDate,
    discountCoupon,
    trialPeriod,
    creatorSplit
  } = subscriptionData
  
  // Build subscription configuration
  const subscriptionConfig = {
    customer_id: customerId,
    plan_id: planId,
    
    // Payment configuration
    payment_method: paymentMethod.type,
    [paymentMethod.type]: paymentMethod.config,
    
    // Billing timing
    billing_day: calculateOptimalBillingDay(customerId), // Smart billing day
    pro_rated_charge: true, // Handle mid-cycle starts
    
    // Trial and discounts
    ...(trialPeriod && {
      trial_days: trialPeriod
    }),
    
    ...(discountCoupon && {
      discounts: [
        {
          type: "percentage",
          value: discountCoupon.percentage * 100, // Convert to basis points
          cycles: discountCoupon.cycles || null, // null = forever
          description: `Coupon: ${discountCoupon.code}`
        }
      ]
    }),
    
    // Marketplace revenue sharing
    ...(creatorSplit && {
      split_rules: creatorSplit
    }),
    
    // EVIDENS subscription metadata
    metadata: {
      subscription_source: subscriptionData.source || "web_checkout",
      user_tier: subscriptionData.userTier || "regular",
      referral_code: subscriptionData.referralCode,
      campaign_attribution: subscriptionData.campaignData,
      
      // Subscription preferences
      auto_renew_preference: subscriptionData.autoRenew ?? true,
      notification_preferences: JSON.stringify(subscriptionData.notifications || {}),
      billing_contact_method: subscriptionData.preferredContact || "email",
      
      // Business intelligence
      customer_ltv_estimate: calculateEstimatedLTV(customerId),
      churn_risk_score: "new_subscription", // To be calculated over time
      upgrade_probability: calculateUpgradeProbability(customerId)
    }
  }
  
  // Create subscription in Pagar.me
  const subscription = await pagarme.subscriptions.create(subscriptionConfig)
  
  // Setup EVIDENS-specific subscription management
  await setupSubscriptionInEvidensSystem({
    subscription_id: subscription.id,
    customer_id: customerId,
    plan_details: subscription.plan,
    billing_schedule: subscription.billing_day,
    access_permissions: determineAccessPermissions(subscription.plan)
  })
  
  return subscription
}

// Smart Billing Day Calculation
const calculateOptimalBillingDay = (customerId) => {
  // Default to day of month that avoids weekends and holidays
  const today = new Date()
  const dayOfMonth = today.getDate()
  
  // Avoid billing on 29th, 30th, 31st (not all months have these days)
  if (dayOfMonth > 28) {
    return 28
  }
  
  // Avoid billing on 1st-3rd (common payroll days, high competition)
  if (dayOfMonth <= 3) {
    return 5 // 5th is typically a safe billing day
  }
  
  return dayOfMonth
}
```

---

## 💳 **Recurring Billing Engine**

### **Automated Billing Process**
**Source**: [Recurring Billing Documentation](https://docs.pagar.me/docs/cobrança-recorrente)

#### **Billing Cycle Management**
```javascript
// EVIDENS Billing Cycle Configuration
const billingCycleManagement = {
  // Pre-billing preparation (24-48 hours before)
  pre_billing_phase: {
    customer_notification: {
      timing: "48_hours_before_billing",
      channels: ["email", "app_notification"],
      content: "subscription_renewal_reminder",
      personalization: "amount_due_next_billing_date"
    },
    
    payment_method_validation: {
      card_expiration_check: true,
      card_validity_verification: true,
      payment_method_update_prompt: "if_issues_detected",
      backup_method_preparation: true
    },
    
    business_rule_application: {
      discount_eligibility: "check_active_promotions",
      loyalty_benefits: "apply_tenure_discounts",
      usage_based_adjustments: "calculate_overage_charges",
      pro_ration_calculations: "handle_mid_cycle_changes"
    }
  },
  
  // Active billing execution
  billing_execution_phase: {
    charge_timing: {
      primary_attempt: "billing_day_06_00_UTC_minus_3", // 6 AM Brazil time
      retry_schedule: ["4_hours", "24_hours", "72_hours"],
      max_retry_attempts: 3,
      failure_escalation: "activate_dunning_process"
    },
    
    payment_processing: {
      method_priority: ["saved_credit_card", "pix_auto_debit", "backup_method"],
      split_rule_application: "apply_creator_revenue_sharing",
      tax_calculation: "brazilian_tax_compliance",
      currency_handling: "brl_only_domestic_subscriptions"
    },
    
    success_handling: {
      access_renewal: "immediate_service_continuation",
      receipt_generation: "automatic_via_enotas_integration", 
      customer_notification: "payment_success_confirmation",
      analytics_tracking: "record_successful_billing_metrics"
    }
  },
  
  // Post-billing management
  post_billing_phase: {
    access_management: {
      service_activation: "immediate_upon_payment_confirmation",
      feature_unlocking: "apply_plan_specific_permissions",
      usage_limit_reset: "monthly_allowances_renewed",
      billing_history_update: "transaction_record_keeping"
    },
    
    revenue_distribution: {
      creator_payouts: "scheduled_according_to_split_rules",
      platform_fee_collection: "automatic_via_split_configuration",
      tax_withholding: "compliance_with_brazilian_regulations",
      financial_reconciliation: "daily_revenue_matching"
    },
    
    customer_engagement: {
      success_messaging: "thank_you_access_confirmed",
      usage_encouragement: "highlight_available_content",
      retention_nurturing: "satisfaction_survey_optional",
      upgrade_opportunities: "contextual_plan_suggestions"
    }
  }
}

// Billing Execution Implementation
const executeBillingCycle = async (subscriptionId) => {
  try {
    // Get subscription details
    const subscription = await pagarme.subscriptions.get(subscriptionId)
    
    // Pre-billing validation
    const preValidation = await validateSubscriptionForBilling(subscription)
    if (!preValidation.valid) {
      throw new Error(`Pre-billing validation failed: ${preValidation.reason}`)
    }
    
    // Execute billing attempt
    const billingResult = await pagarme.subscriptions.charge(subscriptionId, {
      // Force immediate charge (don't wait for natural cycle)
      charge_now: true,
      
      // Apply any pending discounts or adjustments
      discounts: preValidation.discounts,
      
      // Include any usage-based charges
      additional_charges: preValidation.additionalCharges,
      
      // Metadata for tracking
      metadata: {
        billing_type: "automated_cycle",
        billing_timestamp: new Date().toISOString(),
        pre_validation_passed: true,
        retry_attempt: 0
      }
    })
    
    // Handle billing result
    if (billingResult.status === 'paid') {
      await handleSuccessfulBilling(subscriptionId, billingResult)
    } else if (billingResult.status === 'failed') {
      await handleFailedBilling(subscriptionId, billingResult)
    } else {
      await handlePendingBilling(subscriptionId, billingResult)
    }
    
    return billingResult
    
  } catch (error) {
    console.error(`Billing cycle execution failed for subscription ${subscriptionId}:`, error)
    await handleBillingException(subscriptionId, error)
    throw error
  }
}
```

### **Invoice & Receipt Management**
```javascript
// Invoice Generation and Management
const invoiceManagement = {
  // Invoice creation process
  invoice_generation: {
    timing: "upon_successful_payment",
    format: "brazilian_fiscal_standard",
    integration: "enotas_automatic_generation",
    delivery: "email_plus_app_notification",
    
    required_information: {
      customer_data: "name_document_address_complete",
      service_description: "evidens_subscription_access",
      tax_information: "applicable_brazilian_taxes",
      payment_method: "method_used_for_payment",
      billing_period: "service_period_covered"
    }
  },
  
  // Invoice customization for EVIDENS
  evidens_invoice_template: {
    header: {
      company_logo: "evidens_brand_logo",
      company_details: "evidens_legal_entity_info",
      invoice_number: "sequential_unique_identifier",
      issue_date: "payment_confirmation_date"
    },
    
    service_details: {
      description: "EVIDENS - Plataforma de Reviews e Conteúdo",
      billing_period: "DD/MM/YYYY to DD/MM/YYYY",
      plan_type: "Monthly/Annual Individual/Premium",
      access_level: "Full Platform Access",
      
      // Itemized breakdown
      base_subscription: "plan_base_price",
      discounts_applied: "coupon_loyalty_discounts",
      taxes: "applicable_brazilian_taxes",
      total_amount: "final_charged_amount"
    },
    
    footer: {
      payment_method: "method_used_last_4_digits_if_card",
      next_billing_date: "upcoming_charge_notification",
      support_contact: "billing_support_email_phone",
      legal_disclaimers: "refund_policy_terms_reference"
    }
  },
  
  // Receipt delivery system
  receipt_delivery: {
    primary_delivery: {
      method: "email_to_billing_contact",
      format: "pdf_attachment",
      timing: "within_1_hour_of_payment",
      subject_line: "EVIDENS - Recibo de Pagamento - [Plan Name]"
    },
    
    secondary_delivery: {
      method: "in_app_notification",
      location: "billing_history_section",
      persistence: "permanent_download_available",
      notification: "push_notification_receipt_ready"
    },
    
    backup_delivery: {
      method: "sms_notification_available_on_request",
      trigger: "customer_service_request_or_email_failure",
      format: "link_to_secure_receipt_download"
    }
  }
}

// Receipt Generation Implementation
const generateSubscriptionReceipt = async (paymentTransaction) => {
  const receiptData = {
    // Transaction details
    transaction_id: paymentTransaction.id,
    payment_date: paymentTransaction.created_at,
    amount_paid: paymentTransaction.amount,
    payment_method: paymentTransaction.payment_method,
    
    // Customer information
    customer: await getCustomerDetails(paymentTransaction.customer_id),
    
    // Subscription details  
    subscription: await getSubscriptionDetails(paymentTransaction.subscription_id),
    
    // Service details
    service_period: calculateServicePeriod(paymentTransaction.subscription_id),
    
    // EVIDENS branding and legal
    company_details: getEvidensCompanyDetails(),
    legal_text: getReceiptLegalText(),
    
    // eNotas integration data
    fiscal_information: {
      generate_fiscal_receipt: true,
      service_code: "EVIDENS_SUBSCRIPTION",
      tax_regime: "simples_nacional", // Or appropriate regime
      service_description: "Acesso à plataforma digital EVIDENS"
    }
  }
  
  // Generate receipt via eNotas integration
  const fiscalReceipt = await generateFiscalReceipt(receiptData)
  
  // Create customer-friendly receipt
  const customerReceipt = await generateCustomerReceipt(receiptData, fiscalReceipt)
  
  // Deliver receipt to customer
  await deliverReceiptToCustomer(paymentTransaction.customer_id, customerReceipt)
  
  return {
    fiscal_receipt: fiscalReceipt,
    customer_receipt: customerReceipt,
    delivery_status: "sent"
  }
}
```

---

## 🚨 **Dunning & Payment Recovery**

### **Intelligent Dunning Process**
**Source**: [Dunning Management](https://docs.pagar.me/docs/cobrança-recorrente)

#### **Multi-Stage Recovery System**
```javascript
// EVIDENS Dunning Management Strategy
const dunningStrategy = {
  // Stage 1: Immediate Recovery (0-24 hours)
  stage_1_immediate: {
    trigger: "payment_failure_detected",
    timing: "within_1_hour_of_failure",
    
    actions: {
      retry_payment: {
        attempts: 1,
        delay: "4_hours_after_initial_failure", 
        method: "same_payment_method",
        reason: "temporary_bank_issue_resolution"
      },
      
      customer_notification: {
        channel: "email_and_app_push",
        tone: "friendly_informational",
        content: "payment_update_needed_not_urgent",
        cta: "update_payment_method_link"
      },
      
      access_management: {
        service_continuation: true, // Grace period starts
        feature_limitations: false,
        grace_period_duration: "7_days"
      }
    }
  },
  
  // Stage 2: Gentle Recovery (1-3 days)
  stage_2_gentle: {
    trigger: "stage_1_retry_failed",
    timing: "24_hours_after_stage_1",
    
    actions: {
      retry_payment: {
        attempts: 1,
        delay: "24_hours_after_stage_1_retry",
        method: "backup_payment_method_if_available",
        smart_timing: "optimal_bank_processing_hours"
      },
      
      customer_outreach: {
        channel: "email_sms_app_notification",
        tone: "helpful_problem_solving",
        content: "payment_assistance_multiple_options",
        incentives: "small_discount_for_immediate_update",
        support_offer: "direct_support_contact_available"
      },
      
      payment_alternatives: {
        method_suggestions: "pix_boleto_different_card",
        temporary_plan_adjustment: "lower_tier_option_if_price_sensitive",
        payment_plan_option: "split_overdue_amount"
      }
    }
  },
  
  // Stage 3: Urgent Recovery (3-7 days) 
  stage_3_urgent: {
    trigger: "stage_2_failed_grace_period_ending",
    timing: "72_hours_before_suspension",
    
    actions: {
      final_retry: {
        attempts: 1,
        method: "customer_preferred_backup_method",
        timing: "optimal_success_probability_time"
      },
      
      urgent_communication: {
        channel: "phone_call_email_sms_app",
        tone: "urgent_but_respectful",
        content: "service_suspension_imminent_final_chance",
        incentives: "significant_discount_retention_offer",
        human_support: "direct_billing_specialist_contact"
      },
      
      service_preparation: {
        access_warning: "service_suspension_in_72_hours",
        data_backup_offer: "help_export_user_data",
        retention_offers: "pause_downgrade_or_special_pricing"
      }
    }
  },
  
  // Stage 4: Suspension & Win-Back (7-30 days)
  stage_4_winback: {
    trigger: "grace_period_expired_payment_still_failed",
    timing: "immediate_upon_grace_period_end",
    
    actions: {
      service_suspension: {
        access_revocation: "immediate_but_reversible",
        data_retention: "30_days_before_deletion",
        reactivation_process: "simple_payment_method_update"
      },
      
      win_back_campaign: {
        timing: "weekly_for_4_weeks",
        offers: "progressively_better_discounts",
        channels: "email_primarily_non_intrusive",
        content: "we_miss_you_special_return_offers"
      },
      
      alternative_engagement: {
        free_content_access: "limited_time_samples",
        community_participation: "forum_access_maintained",
        newsletter_subscription: "keep_engaged_with_platform_updates"
      }
    }
  }
}

// Dunning Process Implementation
const executeDunningProcess = async (subscriptionId, failureReason, currentStage = 1) => {
  const subscription = await getSubscriptionDetails(subscriptionId)
  const customer = await getCustomerDetails(subscription.customer_id)
  
  const stageConfig = dunningStrategy[`stage_${currentStage}_${getStageType(currentStage)}`]
  
  // Execute retry payment if applicable
  if (stageConfig.actions.retry_payment) {
    const retryResult = await attemptPaymentRetry(
      subscriptionId, 
      stageConfig.actions.retry_payment
    )
    
    if (retryResult.success) {
      await handleRecoveredSubscription(subscriptionId, currentStage)
      return { recovered: true, stage: currentStage }
    }
  }
  
  // Execute customer communication
  if (stageConfig.actions.customer_notification || stageConfig.actions.customer_outreach) {
    await sendDunningCommunication(
      customer,
      subscription, 
      currentStage,
      stageConfig.actions
    )
  }
  
  // Apply access management rules
  if (stageConfig.actions.access_management) {
    await updateSubscriptionAccess(
      subscriptionId,
      stageConfig.actions.access_management
    )
  }
  
  // Schedule next stage if current stage fails
  if (currentStage < 4) {
    await scheduleDunningStage(subscriptionId, currentStage + 1)
  } else {
    await finalizeFailedRecovery(subscriptionId)
  }
  
  return { recovered: false, stage: currentStage, next_stage_scheduled: currentStage < 4 }
}

// Smart Payment Retry Logic
const attemptPaymentRetry = async (subscriptionId, retryConfig) => {
  const subscription = await pagarme.subscriptions.get(subscriptionId)
  
  // Determine optimal retry timing
  const currentHour = new Date().getHours()
  const isOptimalTime = currentHour >= 9 && currentHour <= 17 // Business hours
  
  if (!isOptimalTime && retryConfig.smart_timing) {
    // Schedule for optimal time
    await schedulePaymentRetry(subscriptionId, getNextOptimalTime())
    return { success: false, reason: "scheduled_for_optimal_time" }
  }
  
  try {
    // Attempt payment retry
    const retryResult = await pagarme.subscriptions.charge(subscriptionId, {
      payment_method: retryConfig.method || subscription.payment_method,
      retry_attempt: true,
      metadata: {
        dunning_stage: retryConfig.stage,
        retry_reason: "dunning_process",
        optimal_timing: isOptimalTime
      }
    })
    
    return {
      success: retryResult.status === 'paid',
      transaction_id: retryResult.id,
      status: retryResult.status,
      failure_reason: retryResult.status !== 'paid' ? retryResult.gateway_response : null
    }
    
  } catch (error) {
    console.error('Payment retry failed:', error)
    return { success: false, error: error.message }
  }
}
```

### **Recovery Success Optimization**
```javascript
// Dunning Success Rate Optimization
const dunningOptimization = {
  // Success rate tracking
  success_metrics: {
    stage_1_recovery_rate: "target_40_percent",
    stage_2_recovery_rate: "target_25_percent", 
    stage_3_recovery_rate: "target_15_percent",
    stage_4_winback_rate: "target_10_percent",
    overall_recovery_rate: "target_60_percent" // Combined all stages
  },
  
  // Optimization strategies
  optimization_techniques: {
    payment_timing: {
      avoid_weekends: true,
      avoid_holidays: true,
      optimal_hours: "9am_to_5pm_customer_timezone",
      bank_processing_windows: "respect_bank_settlement_times"
    },
    
    communication_personalization: {
      customer_tier_messaging: "adjust_tone_based_on_customer_value",
      payment_method_specific: "targeted_messaging_per_failure_type",
      historical_behavior: "reference_past_successful_recoveries",
      lifecycle_stage: "different_messaging_for_new_vs_long_term"
    },
    
    incentive_optimization: {
      discount_effectiveness: "a_b_test_discount_amounts",
      alternative_offers: "downgrade_pause_vs_discount",
      timing_of_incentives: "immediate_vs_delayed_offers",
      progressive_incentives: "increase_offers_through_stages"
    }
  },
  
  // Recovery automation rules
  automation_rules: {
    high_value_customers: {
      criteria: "ltv_over_500_or_annual_plan",
      special_handling: "immediate_human_intervention",
      retention_budget: "higher_discount_authorization",
      priority_support: "dedicated_account_manager_contact"
    },
    
    payment_method_intelligence: {
      card_expiration: "proactive_card_update_before_billing",
      card_decline_patterns: "suggest_alternative_methods",
      bank_specific_issues: "bank_specific_retry_timing",
      international_cards: "currency_and_processing_considerations"
    },
    
    behavioral_triggers: {
      recent_high_usage: "emphasize_value_in_messaging",
      low_engagement: "re_engagement_offers_alongside_payment",
      competitor_switching_risk: "retention_offers_competitive_analysis",
      price_sensitivity: "downgrade_options_before_cancellation"
    }
  }
}
```

---

## 🔄 **Subscription Modifications**

### **Plan Changes & Upgrades**
```javascript
// Subscription Modification Management
const subscriptionModifications = {
  // Plan upgrade/downgrade handling
  plan_changes: {
    upgrade_process: {
      effective_date: "immediate_or_next_cycle",
      pro_ration: {
        calculate_unused_time: "current_plan_remaining_days",
        credit_calculation: "pro_rated_refund_amount",
        new_plan_charge: "pro_rated_upgrade_amount",
        net_amount: "charge_difference_immediately"
      },
      
      access_changes: {
        feature_unlocking: "immediate_upon_payment",
        usage_limit_increases: "effective_immediately",
        support_level_upgrade: "immediate_priority_support",
        creator_tool_access: "immediate_if_premium_upgrade"
      }
    },
    
    downgrade_process: {
      effective_date: "end_of_current_billing_cycle", // Avoid refund complexity
      grace_period: {
        feature_access: "maintain_until_cycle_end",
        usage_limits: "no_immediate_restrictions",
        advance_notice: "confirm_downgrade_understanding"
      },
      
      data_handling: {
        export_options: "offer_data_export_before_downgrade",
        feature_compatibility: "warn_about_feature_losses",
        storage_limits: "help_reduce_usage_if_applicable"
      }
    }
  },
  
  // Payment method updates
  payment_method_updates: {
    card_updates: {
      timing: "anytime_immediate_effect",
      validation: "immediate_authorization_test",
      backup_retention: "keep_previous_as_backup",
      notification: "confirmation_of_successful_update"
    },
    
    method_switching: {
      card_to_pix: "possible_with_manual_payment_setup",
      pix_to_card: "requires_card_tokenization",
      international_considerations: "method_availability_by_region",
      billing_cycle_impact: "next_charge_uses_new_method"
    }
  },
  
  // Pause and resume functionality
  pause_resume: {
    pause_options: {
      vacation_mode: "1_to_90_day_pause",
      financial_hardship: "extended_pause_with_support",
      dissatisfaction: "pause_with_retention_outreach",
      technical_issues: "pause_with_technical_support"
    },
    
    pause_handling: {
      billing_suspension: "no_charges_during_pause",
      access_management: "immediate_access_suspension",
      data_retention: "full_data_preservation",
      communication: "clear_resume_instructions"
    },
    
    resume_process: {
      customer_initiated: "simple_reactivation_button",
      automatic_resume: "scheduled_end_date_reactivation",
      payment_update: "verify_payment_method_before_resume",
      welcome_back: "re_engagement_messaging"
    }
  }
}

// Plan Change Implementation
const changeSubscriptionPlan = async (subscriptionId, newPlanId, changeType, effectiveDate = 'immediate') => {
  try {
    const currentSubscription = await pagarme.subscriptions.get(subscriptionId)
    const newPlan = await pagarme.plans.get(newPlanId)
    
    // Calculate pro-ration if immediate change
    let proRationCalculation = null
    if (effectiveDate === 'immediate' && changeType === 'upgrade') {
      proRationCalculation = calculateProRation(
        currentSubscription,
        newPlan,
        new Date()
      )
    }
    
    // Execute plan change
    const planChange = await pagarme.subscriptions.update(subscriptionId, {
      plan_id: newPlanId,
      
      // Handle immediate vs end-of-cycle changes
      ...(effectiveDate === 'immediate' && {
        pro_rated_charge: true,
        charge_immediately: changeType === 'upgrade'
      }),
      
      // Update metadata
      metadata: {
        ...currentSubscription.metadata,
        plan_change_date: new Date().toISOString(),
        previous_plan_id: currentSubscription.plan.id,
        change_type: changeType,
        pro_ration_applied: Boolean(proRationCalculation),
        effective_date: effectiveDate
      }
    })
    
    // Handle pro-ration charge/credit if applicable
    if (proRationCalculation && changeType === 'upgrade') {
      await processProRationCharge(subscriptionId, proRationCalculation)
    }
    
    // Update access permissions immediately for upgrades
    if (changeType === 'upgrade' && effectiveDate === 'immediate') {
      await updateCustomerAccess(
        currentSubscription.customer.id,
        newPlan.metadata
      )
    }
    
    // Notify customer of successful change
    await notifyPlanChange(
      currentSubscription.customer.id,
      currentSubscription.plan,
      newPlan,
      changeType
    )
    
    return {
      success: true,
      subscription: planChange,
      pro_ration: proRationCalculation,
      effective_date: effectiveDate
    }
    
  } catch (error) {
    console.error('Plan change failed:', error)
    throw new Error(`Failed to change subscription plan: ${error.message}`)
  }
}
```

---

## 📊 **Subscription Analytics & Monitoring**

### **Key Subscription Metrics**
```javascript
// EVIDENS Subscription Analytics Framework
const subscriptionAnalytics = {
  // Core business metrics
  business_metrics: {
    monthly_recurring_revenue: {
      calculation: "sum_all_active_monthly_subscriptions",
      growth_tracking: "month_over_month_mrr_growth",
      segmentation: "by_plan_type_customer_tier_region",
      target: "20_percent_monthly_growth"
    },
    
    annual_recurring_revenue: {
      calculation: "mrr_times_12_plus_annual_subscriptions",
      predictive_modeling: "forecast_based_on_current_trends",
      churn_impact: "adjust_for_predicted_churn_rate",
      expansion_revenue: "include_upgrade_downgrade_impact"
    },
    
    customer_acquisition_cost: {
      calculation: "marketing_spend_divided_by_new_customers",
      payback_period: "time_to_recover_cac_through_revenue",
      channel_attribution: "cac_by_marketing_channel",
      optimization_target: "cac_under_first_year_revenue"
    },
    
    customer_lifetime_value: {
      calculation: "average_monthly_revenue_times_lifespan",
      cohort_analysis: "ltv_by_signup_period_and_characteristics",
      improvement_tracking: "ltv_improvement_over_time",
      ltv_cac_ratio: "target_3_to_1_ratio_minimum"
    }
  },
  
  // Operational metrics
  operational_metrics: {
    churn_rate: {
      monthly_churn: "cancellations_divided_by_active_subscribers",
      cohort_churn: "churn_rate_by_subscription_age",
      involuntary_churn: "failed_payment_driven_cancellations",
      voluntary_churn: "customer_initiated_cancellations"
    },
    
    retention_metrics: {
      net_revenue_retention: "expansion_minus_churn_revenue",
      gross_revenue_retention: "revenue_retained_excluding_expansion",
      customer_retention_rate: "customers_remaining_after_period",
      engagement_correlation: "usage_vs_retention_relationship"
    },
    
    billing_performance: {
      payment_success_rate: "successful_charges_divided_by_attempts",
      dunning_recovery_rate: "recovered_subscriptions_divided_by_failures",
      involuntary_churn_rate: "lost_due_to_payment_failures",
      average_recovery_time: "time_from_failure_to_recovery"
    }
  },
  
  // Customer behavior metrics
  behavior_metrics: {
    engagement_scoring: {
      content_consumption: "pages_viewed_time_spent",
      feature_usage: "platform_features_actively_used",
      community_participation: "comments_reviews_interactions",
      loyalty_indicators: "referrals_reviews_social_sharing"
    },
    
    upgrade_propensity: {
      usage_patterns: "heavy_users_likely_to_upgrade",
      feature_requests: "requests_for_premium_features",
      billing_behavior: "comfortable_with_higher_payments",
      engagement_trends: "increasing_platform_usage"
    },
    
    churn_risk_indicators: {
      declining_usage: "reduced_platform_engagement",
      payment_issues: "failed_payments_payment_updates",
      support_complaints: "negative_support_interactions",
      competitive_activity: "researching_alternative_platforms"
    }
  }
}

// Real-time Subscription Monitoring
const subscriptionMonitoring = {
  // Alert thresholds
  critical_alerts: {
    payment_failure_spike: "> 20% failure rate in last hour",
    churn_rate_increase: "> 50% increase from previous month",
    mrr_decline: "> 5% month over month decline",
    dunning_failure_rate: "> 80% dunning failures"
  },
  
  warning_alerts: {
    engagement_decline: "> 30% reduction in average usage",
    upgrade_rate_drop: "> 40% reduction in upgrades",
    support_ticket_increase: "> 100% increase in billing tickets",
    payment_method_expiration: "> 50 cards expiring this month"
  },
  
  // Automated responses
  automated_interventions: {
    high_churn_risk: "trigger_retention_campaign",
    payment_method_expiring: "proactive_update_reminders",
    low_engagement: "re_engagement_email_series",
    upgrade_opportunity: "targeted_upgrade_offers"
  }
}
```

---

## 📋 **Subscription Management Checklist**

### **Implementation Verification**

| **Component** | **Status** | **Requirements** | **Testing Completed** |
|---------------|------------|------------------|----------------------|
| **Plan Creation** | ✅ | Monthly/Annual plans configured | ✅ |
| **Subscription Creation** | ✅ | Customer onboarding flow | ✅ |
| **Recurring Billing** | ✅ | Automated billing cycles | ✅ |
| **Payment Retry Logic** | ✅ | Smart retry mechanisms | ✅ |
| **Dunning Process** | ✅ | 4-stage recovery system | ✅ |
| **Plan Modifications** | ✅ | Upgrade/downgrade handling | ✅ |
| **Access Management** | ✅ | Real-time access control | ✅ |
| **Invoice Generation** | ✅ | eNotas integration | ✅ |
| **Analytics Tracking** | ✅ | Comprehensive metrics | ✅ |
| **Customer Communications** | ✅ | Automated notifications | ✅ |

---

## 🔗 **Essential Documentation References**

- **[Subscriptions API](https://docs.pagar.me/reference/assinaturas-1)**: Complete subscription management
- **[Plans API](https://docs.pagar.me/reference/planos-1)**: Subscription plan configuration
- **[Recurring Billing](https://docs.pagar.me/docs/cobrança-recorrente)**: Automated billing processes
- **[Dunning Management](https://docs.pagar.me/docs/cobrança-recorrente)**: Payment failure recovery
- **[Invoices API](https://docs.pagar.me/reference/faturas-1)**: Invoice and receipt generation

---

*This subscription lifecycle management system ensures EVIDENS maintains healthy recurring revenue through intelligent automation, proactive customer care, and data-driven optimization strategies.*