// ABOUTME: Unified subscription field update helpers ensuring data consistency across all subscription-related tables

import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type Practitioner = Database['public']['Tables']['Practitioners']['Row'];
type EvidensSubscription = Database['public']['Tables']['evidens_subscriptions']['Row'];

export interface SubscriptionFieldUpdate {
  // Core subscription fields
  status?: string;
  tier?: string;
  plan?: string;
  startDate?: string;
  endDate?: string;
  nextBillingDate?: string;
  lastPaymentDate?: string;
  
  // Payment and billing fields
  paymentMethod?: string;
  paymentMethodUsed?: string;
  amount?: number;
  currency?: string;
  billingCycle?: string;
  
  // Management fields
  createdBy?: string;
  daysGranted?: number;
  adminNotes?: string;
  
  // Integration fields
  pagarmeCustomerId?: string;
  pagarmeSubscriptionId?: string;
  evidensCustomerId?: string;
  
  // Metadata and tracking
  metadata?: Record<string, any>;
  activationSource?: string;
}

export interface SubscriptionUpdateResult {
  success: boolean;
  practitionerUpdated: boolean;
  subscriptionRecordUpdated: boolean;
  subscriptionId?: string;
  errors: string[];
  warnings: string[];
}

/**
 * Unified subscription field update service
 * Ensures consistency between Practitioners table and evidens_subscriptions table
 */
export class UnifiedSubscriptionUpdater {
  
  /**
   * Updates subscription fields for a single user with full data consistency
   */
  static async updateUserSubscription(
    userId: string,
    updates: SubscriptionFieldUpdate
  ): Promise<SubscriptionUpdateResult> {
    const result: SubscriptionUpdateResult = {
      success: false,
      practitionerUpdated: false,
      subscriptionRecordUpdated: false,
      errors: [],
      warnings: []
    };
    
    try {
      console.log(`🔄 Updating subscription for user: ${userId}`, updates);
      
      // Build updates for Practitioners table
      const practitionerUpdates = this.buildPractitionerUpdates(updates);
      
      // Build updates for evidens_subscriptions table
      const subscriptionUpdates = this.buildSubscriptionUpdates(updates);
      
      // Perform updates in transaction-like manner
      const practitionerResult = await this.updatePractitionerFields(userId, practitionerUpdates);
      const subscriptionResult = await this.updateSubscriptionRecord(userId, subscriptionUpdates);
      
      result.practitionerUpdated = practitionerResult.success;
      result.subscriptionRecordUpdated = subscriptionResult.success;
      result.subscriptionId = subscriptionResult.subscriptionId;
      
      if (practitionerResult.error) result.errors.push(`Practitioner: ${practitionerResult.error}`);
      if (subscriptionResult.error) result.errors.push(`Subscription: ${subscriptionResult.error}`);
      
      // Add warnings for partial updates
      if (result.practitionerUpdated && !result.subscriptionRecordUpdated) {
        result.warnings.push('Practitioner updated but subscription record failed');
      } else if (!result.practitionerUpdated && result.subscriptionRecordUpdated) {
        result.warnings.push('Subscription record updated but Practitioner failed');
      }
      
      result.success = result.practitionerUpdated || result.subscriptionRecordUpdated;
      
      console.log(`✅ Subscription update completed for user ${userId}:`, result);
      return result;
      
    } catch (error) {
      console.error(`❌ Subscription update failed for user ${userId}:`, error);
      result.errors.push(`Update failed: ${error.message}`);
      return result;
    }
  }
  
  /**
   * Batch update subscription fields for multiple users
   */
  static async batchUpdateSubscriptions(
    userUpdates: Array<{ userId: string; updates: SubscriptionFieldUpdate }>
  ): Promise<{ results: SubscriptionUpdateResult[]; summary: any }> {
    console.log(`🔄 Starting batch subscription update for ${userUpdates.length} users`);
    
    const results: SubscriptionUpdateResult[] = [];
    let successCount = 0;
    let partialCount = 0;
    let failureCount = 0;
    
    for (const { userId, updates } of userUpdates) {
      try {
        const result = await this.updateUserSubscription(userId, updates);
        results.push(result);
        
        if (result.success) {
          if (result.practitionerUpdated && result.subscriptionRecordUpdated) {
            successCount++;
          } else {
            partialCount++;
          }
        } else {
          failureCount++;
        }
        
        // Small delay to avoid overwhelming the database
        await new Promise(resolve => setTimeout(resolve, 50));
        
      } catch (error) {
        console.error(`❌ Batch update failed for user ${userId}:`, error);
        results.push({
          success: false,
          practitionerUpdated: false,
          subscriptionRecordUpdated: false,
          errors: [error.message],
          warnings: []
        });
        failureCount++;
      }
    }
    
    const summary = {
      total: userUpdates.length,
      successful: successCount,
      partial: partialCount,
      failed: failureCount,
      successRate: ((successCount + partialCount) / userUpdates.length * 100).toFixed(2) + '%'
    };
    
    console.log(`✅ Batch subscription update completed:`, summary);
    return { results, summary };
  }
  
  /**
   * Quick status update (common use case)
   */
  static async updateSubscriptionStatus(
    userId: string,
    status: string,
    reason?: string
  ): Promise<SubscriptionUpdateResult> {
    const updates: SubscriptionFieldUpdate = {
      status,
      metadata: {
        status_change_reason: reason,
        status_changed_at: new Date().toISOString(),
        changed_by: 'system'
      }
    };
    
    return this.updateUserSubscription(userId, updates);
  }
  
  /**
   * Quick tier upgrade/downgrade (common use case)
   */
  static async updateSubscriptionTier(
    userId: string,
    newTier: string,
    reason?: string
  ): Promise<SubscriptionUpdateResult> {
    const updates: SubscriptionFieldUpdate = {
      tier: newTier,
      metadata: {
        tier_change_reason: reason,
        tier_changed_at: new Date().toISOString(),
        changed_by: 'system'
      }
    };
    
    return this.updateUserSubscription(userId, updates);
  }
  
  /**
   * Extend subscription (common admin use case)
   */
  static async extendSubscription(
    userId: string,
    additionalDays: number,
    reason?: string
  ): Promise<SubscriptionUpdateResult> {
    try {
      // Get current subscription end date
      const { data: practitioner } = await supabase
        .from('Practitioners')
        .select('subscription_end_date, evidens_subscription_expires_at')
        .eq('id', userId)
        .single();
      
      const currentEndDate = practitioner?.evidens_subscription_expires_at || 
                           practitioner?.subscription_end_date || 
                           new Date().toISOString();
      
      const newEndDate = new Date(new Date(currentEndDate).getTime() + additionalDays * 24 * 60 * 60 * 1000);
      
      const updates: SubscriptionFieldUpdate = {
        endDate: newEndDate.toISOString(),
        daysGranted: additionalDays,
        metadata: {
          extension_reason: reason,
          days_added: additionalDays,
          extended_at: new Date().toISOString(),
          extended_by: 'admin'
        }
      };
      
      return this.updateUserSubscription(userId, updates);
      
    } catch (error) {
      console.error(`❌ Failed to extend subscription for user ${userId}:`, error);
      return {
        success: false,
        practitionerUpdated: false,
        subscriptionRecordUpdated: false,
        errors: [`Extension failed: ${error.message}`],
        warnings: []
      };
    }
  }
  
  /**
   * Build Practitioners table updates from generic updates
   */
  private static buildPractitionerUpdates(updates: SubscriptionFieldUpdate): Partial<Practitioner> {
    const practitionerUpdates: any = {};
    
    // Map generic fields to Practitioners table fields
    if (updates.status) {
      practitionerUpdates.subscription_status = updates.status;
      practitionerUpdates.evidens_subscription_status = updates.status;
    }
    if (updates.tier) {
      practitionerUpdates.subscription_tier = updates.tier;
      practitionerUpdates.evidens_subscription_tier = updates.tier;
    }
    if (updates.plan) practitionerUpdates.subscription_plan = updates.plan;
    if (updates.startDate) practitionerUpdates.subscription_start_date = updates.startDate;
    if (updates.endDate) {
      practitionerUpdates.subscription_end_date = updates.endDate;
      practitionerUpdates.subscription_expires_at = updates.endDate;
      practitionerUpdates.evidens_subscription_expires_at = updates.endDate;
    }
    if (updates.nextBillingDate) practitionerUpdates.next_billing_date = updates.nextBillingDate;
    if (updates.lastPaymentDate) practitionerUpdates.last_payment_date = updates.lastPaymentDate;
    
    if (updates.paymentMethod) practitionerUpdates.payment_method_preferred = updates.paymentMethod;
    if (updates.paymentMethodUsed) practitionerUpdates.subscription_payment_method_used = updates.paymentMethodUsed;
    
    if (updates.createdBy) practitionerUpdates.subscription_created_by = updates.createdBy;
    if (updates.daysGranted) practitionerUpdates.subscription_days_granted = updates.daysGranted;
    if (updates.adminNotes) practitionerUpdates.admin_subscription_notes = updates.adminNotes;
    
    if (updates.pagarmeCustomerId) practitionerUpdates.pagarme_customer_id = updates.pagarmeCustomerId;
    if (updates.evidensCustomerId) practitionerUpdates.evidens_pagarme_customer_id = updates.evidensCustomerId;
    
    // Merge metadata
    if (updates.metadata) {
      practitionerUpdates.payment_metadata = updates.metadata;
    }
    
    // Always update timestamp
    practitionerUpdates.updated_at = new Date().toISOString();
    
    return practitionerUpdates;
  }
  
  /**
   * Build evidens_subscriptions table updates from generic updates
   */
  private static buildSubscriptionUpdates(updates: SubscriptionFieldUpdate): Partial<EvidensSubscription> {
    const subscriptionUpdates: any = {};
    
    if (updates.status) subscriptionUpdates.status = updates.status;
    if (updates.amount) subscriptionUpdates.amount = updates.amount;
    if (updates.currency) subscriptionUpdates.currency = updates.currency;
    if (updates.billingCycle) subscriptionUpdates.billing_cycle = updates.billingCycle;
    if (updates.startDate) subscriptionUpdates.current_period_start = updates.startDate;
    if (updates.endDate) subscriptionUpdates.current_period_end = updates.endDate;
    if (updates.nextBillingDate) subscriptionUpdates.next_billing_date = updates.nextBillingDate;
    if (updates.paymentMethod) subscriptionUpdates.payment_method = updates.paymentMethod;
    if (updates.pagarmeCustomerId) subscriptionUpdates.pagarme_customer_id = updates.pagarmeCustomerId;
    if (updates.pagarmeSubscriptionId) subscriptionUpdates.pagarme_subscription_id = updates.pagarmeSubscriptionId;
    
    // Merge metadata
    if (updates.metadata) {
      subscriptionUpdates.metadata = updates.metadata;
    }
    
    // Always update timestamp
    subscriptionUpdates.updated_at = new Date().toISOString();
    
    return subscriptionUpdates;
  }
  
  /**
   * Update Practitioners table fields
   */
  private static async updatePractitionerFields(
    userId: string,
    updates: Partial<Practitioner>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('Practitioners')
        .update(updates)
        .eq('id', userId);
      
      if (error) {
        console.error('Practitioner update failed:', error);
        return { success: false, error: error.message };
      }
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Update or create evidens_subscriptions record
   */
  private static async updateSubscriptionRecord(
    userId: string,
    updates: Partial<EvidensSubscription>
  ): Promise<{ success: boolean; subscriptionId?: string; error?: string }> {
    try {
      // Check if subscription record exists
      const { data: existingSubscription } = await supabase
        .from('evidens_subscriptions')
        .select('id, status')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (existingSubscription) {
        // Update existing subscription
        const { error } = await supabase
          .from('evidens_subscriptions')
          .update(updates)
          .eq('id', existingSubscription.id);
        
        if (error) {
          console.error('Subscription update failed:', error);
          return { success: false, error: error.message };
        }
        
        return { success: true, subscriptionId: existingSubscription.id };
      } else {
        // Create new subscription record
        const { data: newSubscription, error } = await supabase
          .from('evidens_subscriptions')
          .insert({
            user_id: userId,
            ...updates,
            created_at: new Date().toISOString()
          })
          .select('id')
          .single();
        
        if (error) {
          console.error('Subscription creation failed:', error);
          return { success: false, error: error.message };
        }
        
        return { success: true, subscriptionId: newSubscription.id };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

/**
 * Convenient helper functions for common subscription operations
 */
export const subscriptionHelpers = {
  // Quick status changes
  activate: (userId: string, reason?: string) => 
    UnifiedSubscriptionUpdater.updateSubscriptionStatus(userId, 'active', reason),
  
  cancel: (userId: string, reason?: string) => 
    UnifiedSubscriptionUpdater.updateSubscriptionStatus(userId, 'canceled', reason),
  
  suspend: (userId: string, reason?: string) => 
    UnifiedSubscriptionUpdater.updateSubscriptionStatus(userId, 'suspended', reason),
  
  setPastDue: (userId: string, reason?: string) => 
    UnifiedSubscriptionUpdater.updateSubscriptionStatus(userId, 'past_due', reason),
  
  // Tier changes
  upgradeToPremium: (userId: string, reason?: string) => 
    UnifiedSubscriptionUpdater.updateSubscriptionTier(userId, 'premium', reason),
  
  upgradeToProfessional: (userId: string, reason?: string) => 
    UnifiedSubscriptionUpdater.updateSubscriptionTier(userId, 'professional', reason),
  
  downgradeToFree: (userId: string, reason?: string) => 
    UnifiedSubscriptionUpdater.updateSubscriptionTier(userId, 'free', reason),
  
  // Time extensions
  extend30Days: (userId: string, reason?: string) => 
    UnifiedSubscriptionUpdater.extendSubscription(userId, 30, reason),
  
  extend365Days: (userId: string, reason?: string) => 
    UnifiedSubscriptionUpdater.extendSubscription(userId, 365, reason),
  
  // Payment updates
  updatePaymentMethod: async (userId: string, paymentMethod: string) => 
    UnifiedSubscriptionUpdater.updateUserSubscription(userId, {
      paymentMethod,
      paymentMethodUsed: paymentMethod,
      metadata: {
        payment_method_updated_at: new Date().toISOString()
      }
    }),
  
  // Admin operations
  addAdminNote: async (userId: string, note: string) =>
    UnifiedSubscriptionUpdater.updateUserSubscription(userId, {
      adminNotes: note,
      metadata: {
        admin_note_added_at: new Date().toISOString()
      }
    })
};

/**
 * Validation helpers for subscription data
 */
export const subscriptionValidation = {
  isValidStatus: (status: string): boolean => {
    const validStatuses = ['active', 'trialing', 'past_due', 'canceled', 'unpaid', 'suspended', 'inactive'];
    return validStatuses.includes(status);
  },
  
  isValidTier: (tier: string): boolean => {
    const validTiers = ['free', 'basic', 'premium', 'professional', 'enterprise'];
    return validTiers.includes(tier);
  },
  
  isValidPaymentMethod: (method: string): boolean => {
    const validMethods = ['pix', 'credit_card', 'debit_card', 'boleto', 'bank_transfer'];
    return validMethods.includes(method);
  },
  
  validateUpdate: (updates: SubscriptionFieldUpdate): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (updates.status && !subscriptionValidation.isValidStatus(updates.status)) {
      errors.push(`Invalid status: ${updates.status}`);
    }
    
    if (updates.tier && !subscriptionValidation.isValidTier(updates.tier)) {
      errors.push(`Invalid tier: ${updates.tier}`);
    }
    
    if (updates.paymentMethod && !subscriptionValidation.isValidPaymentMethod(updates.paymentMethod)) {
      errors.push(`Invalid payment method: ${updates.paymentMethod}`);
    }
    
    if (updates.amount && updates.amount < 0) {
      errors.push(`Invalid amount: ${updates.amount}`);
    }
    
    if (updates.daysGranted && updates.daysGranted < 0) {
      errors.push(`Invalid days granted: ${updates.daysGranted}`);
    }
    
    return { valid: errors.length === 0, errors };
  }
};