// ABOUTME: Automatic subscription activation service triggered by successful payments

import { supabase } from '@/integrations/supabase/client';
import { 
  SubscriptionEventProcessor, 
  SubscriptionUpdateRequest, 
  SubscriptionAnalytics 
} from '@/lib/subscriptionEventHandlers';
import { triggerPaymentSuccessWebhook } from './makeWebhookService';

export interface PaymentSuccessData {
  paymentId: string;
  userId: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  planId?: string;
  planName?: string;
  planDays?: number;
  pagarmeTransactionId?: string;
  pagarmeCustomerId?: string;
  metadata?: Record<string, any>;
}

export interface SubscriptionActivationResult {
  success: boolean;
  subscriptionId?: string;
  subscriptionTier: string;
  expiresAt: string;
  activatedFeatures: string[];
  error?: string;
  webhookTriggered: boolean;
}

/**
 * Automatically activates subscription based on successful payment
 */
export const activateSubscriptionFromPayment = async (
  paymentData: PaymentSuccessData
): Promise<SubscriptionActivationResult> => {
  console.log('🔄 Starting automatic subscription activation for payment:', paymentData.paymentId);
  
  try {
    // Determine subscription tier and duration from payment amount and plan
    const subscriptionConfig = determineSubscriptionConfig(paymentData);
    
    // Create or update subscription record
    const subscriptionResult = await createSubscriptionRecord(paymentData, subscriptionConfig);
    
    // Update user's subscription status in Practitioners table
    const practitionerUpdate = await updatePractitionerSubscriptionStatus(
      paymentData.userId, 
      subscriptionConfig,
      paymentData
    );
    
    // Activate subscription features
    const activatedFeatures = await activateSubscriptionFeatures(
      paymentData.userId, 
      subscriptionConfig.tier
    );
    
    // Trigger business logic (emails, analytics, etc.)
    await executeSubscriptionBusinessLogic(paymentData, subscriptionConfig);
    
    // Trigger webhook for external integrations
    let webhookTriggered = false;
    try {
      await triggerPaymentSuccessWebhook(paymentData.userId, {
        id: paymentData.paymentId,
        amount: paymentData.amount,
        method: paymentData.paymentMethod,
        status: 'paid',
        metadata: paymentData.metadata,
        pagarme_transaction_id: paymentData.pagarmeTransactionId
      });
      webhookTriggered = true;
      console.log('✅ Webhook triggered successfully for subscription activation');
    } catch (webhookError) {
      console.error('⚠️ Webhook failed but subscription activation continued:', webhookError);
      // Don't fail the entire activation process for webhook issues
    }
    
    console.log('✅ Subscription activation completed successfully');
    
    return {
      success: true,
      subscriptionId: subscriptionResult.subscriptionId,
      subscriptionTier: subscriptionConfig.tier,
      expiresAt: subscriptionConfig.expiresAt,
      activatedFeatures,
      webhookTriggered
    };
    
  } catch (error) {
    console.error('❌ Subscription activation failed:', error);
    
    return {
      success: false,
      subscriptionTier: 'free',
      expiresAt: new Date().toISOString(),
      activatedFeatures: [],
      error: error.message || 'Unknown error during subscription activation',
      webhookTriggered: false
    };
  }
};

/**
 * Determines subscription configuration based on payment data
 */
const determineSubscriptionConfig = (paymentData: PaymentSuccessData) => {
  const now = new Date();
  const amount = paymentData.amount;
  
  // Default configurations based on amount (in cents)
  let tier = 'free';
  let duration = 30; // days
  let features = ['basic_access'];
  
  if (paymentData.planDays) {
    // Use explicit plan duration if provided
    duration = paymentData.planDays;
  }
  
  // Determine tier based on amount or explicit plan data
  if (amount >= 58800) { // R$ 588+ (yearly plans)
    tier = 'professional';
    duration = paymentData.planDays || 365;
    features = ['premium_access', 'advanced_analytics', 'priority_support', 'beta_features'];
  } else if (amount >= 9700) { // R$ 97+ (premium plans)  
    tier = 'premium';
    duration = paymentData.planDays || 30;
    features = ['premium_access', 'advanced_analytics', 'priority_support'];
  } else if (amount >= 2900) { // R$ 29+ (basic premium)
    tier = 'basic_premium';
    duration = paymentData.planDays || 30;
    features = ['premium_access'];
  }
  
  const expiresAt = new Date(now.getTime() + duration * 24 * 60 * 60 * 1000);
  
  return {
    tier,
    duration,
    features,
    expiresAt: expiresAt.toISOString(),
    startDate: now.toISOString(),
    planName: paymentData.planName || `${tier}_${duration}d`
  };
};

/**
 * Creates or updates subscription record in evidens_subscriptions table
 */
const createSubscriptionRecord = async (
  paymentData: PaymentSuccessData,
  config: any
) => {
  // Check if subscription already exists for this user
  const { data: existingSubscription } = await supabase
    .from('evidens_subscriptions')
    .select('id, status')
    .eq('user_id', paymentData.userId)
    .eq('status', 'active')
    .single();
  
  if (existingSubscription) {
    // Update existing active subscription
    const { data: updatedSubscription, error } = await supabase
      .from('evidens_subscriptions')
      .update({
        status: 'active',
        current_period_start: config.startDate,
        current_period_end: config.expiresAt,
        next_billing_date: config.expiresAt,
        updated_at: new Date().toISOString(),
        amount: paymentData.amount,
        payment_method: paymentData.paymentMethod
      })
      .eq('id', existingSubscription.id)
      .select()
      .single();
    
    if (error) throw new Error(`Failed to update subscription: ${error.message}`);
    
    return { subscriptionId: updatedSubscription.id };
  } else {
    // Create new subscription record
    const { data: newSubscription, error } = await supabase
      .from('evidens_subscriptions')
      .insert({
        user_id: paymentData.userId,
        status: 'active',
        plan_id: paymentData.planId || 'direct_payment',
        amount: paymentData.amount,
        currency: paymentData.currency,
        billing_cycle: config.duration >= 365 ? 'yearly' : 'monthly',
        current_period_start: config.startDate,
        current_period_end: config.expiresAt,
        next_billing_date: config.expiresAt,
        payment_method: paymentData.paymentMethod,
        pagarme_customer_id: paymentData.pagarmeCustomerId,
        pagarme_subscription_id: null, // Single payment, not recurring
        metadata: paymentData.metadata || {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) throw new Error(`Failed to create subscription: ${error.message}`);
    
    return { subscriptionId: newSubscription.id };
  }
};

/**
 * Updates user's subscription status in Practitioners table
 */
const updatePractitionerSubscriptionStatus = async (
  userId: string,
  config: any,
  paymentData: PaymentSuccessData
) => {
  const updateData = {
    subscription_status: 'active',
    subscription_tier: config.tier,
    subscription_plan: config.planName,
    subscription_start_date: config.startDate,
    subscription_end_date: config.expiresAt,
    subscription_expires_at: config.expiresAt,
    next_billing_date: config.expiresAt,
    last_payment_date: new Date().toISOString(),
    subscription_created_by: 'payment_success',
    subscription_payment_method_used: paymentData.paymentMethod,
    subscription_days_granted: config.duration,
    // Update EVIDENS-specific fields as well
    evidens_subscription_status: 'active',
    evidens_subscription_tier: config.tier,
    evidens_subscription_expires_at: config.expiresAt,
    evidens_payment_method_preference: paymentData.paymentMethod,
    // Update payment metadata
    payment_metadata: {
      ...paymentData.metadata,
      activation_date: new Date().toISOString(),
      payment_id: paymentData.paymentId,
      pagarme_transaction_id: paymentData.pagarmeTransactionId,
      subscription_activated_automatically: true,
      activated_features: config.features
    },
    updated_at: new Date().toISOString()
  };
  
  const { data, error } = await supabase
    .from('Practitioners')
    .update(updateData)
    .eq('id', userId)
    .select()
    .single();
  
  if (error) {
    throw new Error(`Failed to update practitioner subscription status: ${error.message}`);
  }
  
  console.log('✅ Practitioner subscription status updated successfully');
  return data;
};

/**
 * Activates subscription features for the user
 */
const activateSubscriptionFeatures = async (
  userId: string,
  subscriptionTier: string
): Promise<string[]> => {
  const featureConfig = {
    'free': [],
    'basic_premium': ['premium_access'],
    'premium': ['premium_access', 'advanced_analytics', 'priority_support'],
    'professional': ['premium_access', 'advanced_analytics', 'priority_support', 'beta_features', 'unlimited_reviews']
  };
  
  const features = featureConfig[subscriptionTier] || [];
  
  // Here you could update user feature flags or permissions
  // For now, we'll log the features that should be activated
  console.log(`🔧 Activating features for ${subscriptionTier} subscription:`, features);
  
  return features;
};

/**
 * Executes business logic after subscription activation
 */
const executeSubscriptionBusinessLogic = async (
  paymentData: PaymentSuccessData,
  config: any
) => {
  console.log('📧 Executing subscription business logic...');
  
  // Log subscription activation for analytics
  try {
    // This would trigger analytics events, welcome emails, etc.
    console.log('📊 Logging subscription activation analytics');
    
    // Calculate and log business metrics
    const healthScore = SubscriptionAnalytics.calculateHealthScore(['subscription.charged']);
    const churnRisk = SubscriptionAnalytics.predictChurnRisk(0, 0, 1); // New subscription
    const ltv = SubscriptionAnalytics.calculateLTV(paymentData.amount / 100, 1, churnRisk);
    
    console.log('📈 Subscription metrics calculated:', { healthScore, churnRisk, ltv });
    
    // Here you would trigger:
    // - Welcome email sending
    // - Feature access activation
    // - Analytics event logging
    // - Third-party integrations
    
  } catch (error) {
    console.error('⚠️ Business logic execution failed (non-critical):', error);
    // Don't fail the entire activation for business logic issues
  }
};

/**
 * Batch activation for multiple payments (useful for admin operations)
 */
export const batchActivateSubscriptions = async (
  paymentDataList: PaymentSuccessData[]
): Promise<SubscriptionActivationResult[]> => {
  console.log(`🔄 Starting batch subscription activation for ${paymentDataList.length} payments`);
  
  const results: SubscriptionActivationResult[] = [];
  
  for (const paymentData of paymentDataList) {
    try {
      const result = await activateSubscriptionFromPayment(paymentData);
      results.push(result);
      
      // Add small delay between activations to avoid overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.error(`❌ Batch activation failed for payment ${paymentData.paymentId}:`, error);
      results.push({
        success: false,
        subscriptionTier: 'free',
        expiresAt: new Date().toISOString(),
        activatedFeatures: [],
        error: error.message,
        webhookTriggered: false
      });
    }
  }
  
  const successCount = results.filter(r => r.success).length;
  console.log(`✅ Batch activation completed: ${successCount}/${paymentDataList.length} successful`);
  
  return results;
};

/**
 * Helper function to reactivate subscription for payment retry success
 */
export const reactivateSubscriptionFromPayment = async (
  paymentData: PaymentSuccessData
): Promise<SubscriptionActivationResult> => {
  console.log('🔄 Reactivating subscription after payment retry success:', paymentData.paymentId);
  
  // Use the main activation function but with reactivation context
  const result = await activateSubscriptionFromPayment({
    ...paymentData,
    metadata: {
      ...paymentData.metadata,
      reactivation: true,
      previous_failure_recovered: true
    }
  });
  
  if (result.success) {
    // Reset failure count and churn risk indicators
    await supabase
      .from('Practitioners')
      .update({
        payment_metadata: {
          ...paymentData.metadata,
          failure_count: 0,
          reactivated_at: new Date().toISOString(),
          last_successful_recovery: new Date().toISOString()
        }
      })
      .eq('id', paymentData.userId);
  }
  
  return result;
};