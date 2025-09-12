// ABOUTME: Core access time management utilities for subscription payments and role management

export interface AccessTimeUpdate {
  newEndDate: string;
  newTier: 'free' | 'premium';
  shouldUpgrade: boolean;
  daysAdded: number;
}

/**
 * Calculate new access end date by adding days from a payment plan
 * Handles overdue scenarios by adding FULL purchased time
 */
export function calculateAccessTimeFromPayment(
  currentEndDate: string | null,
  planDays: number,
  paymentDate: Date = new Date()
): AccessTimeUpdate {
  console.log('🕐 Calculating access time:', {
    currentEndDate,
    planDays,
    paymentDate: paymentDate.toISOString()
  });

  let newEndDate: Date;
  let shouldUpgrade = false;
  
  if (!currentEndDate) {
    // No existing access - start from payment date
    newEndDate = new Date(paymentDate);
    newEndDate.setDate(newEndDate.getDate() + planDays);
    shouldUpgrade = true;
  } else {
    const existingEndDate = new Date(currentEndDate);
    const now = paymentDate;
    
    if (existingEndDate <= now) {
      // User is overdue - add FULL time from payment date (as requested)
      console.log('📅 User is overdue, adding FULL purchased time');
      newEndDate = new Date(paymentDate);
      newEndDate.setDate(newEndDate.getDate() + planDays);
      shouldUpgrade = true;
    } else {
      // User still has active access - extend existing time
      console.log('📅 User has active access, extending existing time');
      newEndDate = new Date(existingEndDate);
      newEndDate.setDate(newEndDate.getDate() + planDays);
    }
  }

  const result: AccessTimeUpdate = {
    newEndDate: newEndDate.toISOString(),
    newTier: 'premium',
    shouldUpgrade,
    daysAdded: planDays
  };

  console.log('✅ Access time calculation result:', result);
  return result;
}

/**
 * Determine if user should have premium access based on end date
 */
export function determineUserTier(endDate: string | null, currentDate: Date = new Date()): 'free' | 'premium' {
  if (!endDate) return 'free';
  
  const accessEndDate = new Date(endDate);
  return accessEndDate > currentDate ? 'premium' : 'free';
}

/**
 * Calculate remaining days until access expires
 */
export function calculateRemainingDays(endDate: string | null, currentDate: Date = new Date()): number | null {
  if (!endDate) return null;
  
  const accessEndDate = new Date(endDate);
  const diffTime = accessEndDate.getTime() - currentDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
}

/**
 * Create database update object for V2 subscription payment
 */
export function createSubscriptionUpdateData(
  accessUpdate: AccessTimeUpdate,
  subscriptionData?: {
    plan_name?: string;
  }
): Record<string, any> {
  const updateData: Record<string, any> = {
    // Core V2 access time fields
    subscription_ends_at: accessUpdate.newEndDate,
    subscription_tier: accessUpdate.newTier,
    subscription_status: 'active',
    subscription_starts_at: new Date().toISOString(),
    
    // Metadata tracking
    payment_metadata: {
      payment_processed_at: new Date().toISOString(),
      days_added: accessUpdate.daysAdded,
      upgraded_to_premium: accessUpdate.shouldUpgrade,
      plan_name: subscriptionData?.plan_name || 'premium'
    },
    
    // Timestamp
    updated_at: new Date().toISOString()
  };

  return updateData;
}

/**
 * Log access time operation for debugging
 */
export function logAccessTimeOperation(
  userId: string,
  operation: string,
  details: Record<string, any>
): void {
  console.log(`🔐 Access Time Manager [${operation}]`, {
    userId,
    timestamp: new Date().toISOString(),
    ...details
  });
}