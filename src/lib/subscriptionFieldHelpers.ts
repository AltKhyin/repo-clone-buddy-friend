// ABOUTME: V2 subscription field update helpers for Practitioners table only

import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type Practitioner = Database['public']['Tables']['Practitioners']['Row'];

export interface SubscriptionFieldUpdate {
  // Core subscription fields
  status?: string;
  tier?: string;
  startDate?: string;
  endDate?: string;
  
  // Management fields
  daysGranted?: number;
  adminNotes?: string;
  
  // Metadata and tracking
  metadata?: Record<string, any>;
  activationSource?: string;
}

export interface SubscriptionUpdateResult {
  success: boolean;
  practitionerUpdated: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * V2 subscription field update service for Practitioners table
 */
export class UnifiedSubscriptionUpdater {
  
  /**
   * Updates subscription fields for a single user in V2 system
   */
  static async updateUserSubscription(
    userId: string,
    updates: SubscriptionFieldUpdate
  ): Promise<SubscriptionUpdateResult> {
    const result: SubscriptionUpdateResult = {
      success: false,
      practitionerUpdated: false,
      errors: [],
      warnings: []
    };
    
    try {
      console.log(`🔄 Updating subscription for user: ${userId}`, updates);
      
      // Build updates for Practitioners table (V2 fields only)
      const practitionerUpdates = this.buildPractitionerUpdates(updates);
      
      // Perform update
      const practitionerResult = await this.updatePractitionerFields(userId, practitionerUpdates);
      
      result.practitionerUpdated = practitionerResult.success;
      
      if (practitionerResult.error) result.errors.push(`Practitioner: ${practitionerResult.error}`);
      
      result.success = result.practitionerUpdated;
      
      console.log(`✅ Subscription update completed for user ${userId}:`, result);
      return result;
      
    } catch (error) {
      console.error(`❌ Subscription update failed for user ${userId}:`, error);
      result.errors.push(`Update failed: ${error.message}`);
      return result;
    }
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
        .select('subscription_ends_at')
        .eq('id', userId)
        .single();
      
      const currentEndDate = practitioner?.subscription_ends_at || new Date().toISOString();
      
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
        errors: [`Extension failed: ${error.message}`],
        warnings: []
      };
    }
  }
  
  /**
   * Build Practitioners table updates from generic updates (V2 fields only)
   */
  private static buildPractitionerUpdates(updates: SubscriptionFieldUpdate): Partial<Practitioner> {
    const practitionerUpdates: any = {};
    
    // Map generic fields to V2 Practitioners table fields
    if (updates.status) {
      practitionerUpdates.subscription_status = updates.status;
    }
    if (updates.tier) {
      practitionerUpdates.subscription_tier = updates.tier;
    }
    if (updates.startDate) practitionerUpdates.subscription_starts_at = updates.startDate;
    if (updates.endDate) {
      practitionerUpdates.subscription_ends_at = updates.endDate;
    }
    
    if (updates.daysGranted) practitionerUpdates.subscription_days_granted = updates.daysGranted;
    if (updates.adminNotes) practitionerUpdates.admin_subscription_notes = updates.adminNotes;
    
    // Merge metadata
    if (updates.metadata) {
      practitionerUpdates.payment_metadata = updates.metadata;
    }
    
    // Always update timestamp
    practitionerUpdates.updated_at = new Date().toISOString();
    
    return practitionerUpdates;
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
  
  downgradeToFree: (userId: string, reason?: string) => 
    UnifiedSubscriptionUpdater.updateSubscriptionTier(userId, 'free', reason),
  
  // Time extensions
  extend30Days: (userId: string, reason?: string) => 
    UnifiedSubscriptionUpdater.extendSubscription(userId, 30, reason),
  
  extend365Days: (userId: string, reason?: string) => 
    UnifiedSubscriptionUpdater.extendSubscription(userId, 365, reason),
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
    const validTiers = ['free', 'premium'];
    return validTiers.includes(tier);
  },
  
  validateUpdate: (updates: SubscriptionFieldUpdate): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (updates.status && !subscriptionValidation.isValidStatus(updates.status)) {
      errors.push(`Invalid status: ${updates.status}`);
    }
    
    if (updates.tier && !subscriptionValidation.isValidTier(updates.tier)) {
      errors.push(`Invalid tier: ${updates.tier}`);
    }
    
    if (updates.daysGranted && updates.daysGranted < 0) {
      errors.push(`Invalid days granted: ${updates.daysGranted}`);
    }
    
    return { valid: errors.length === 0, errors };
  }
};