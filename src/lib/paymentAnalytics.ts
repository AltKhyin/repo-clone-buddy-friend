// ABOUTME: Payment system analytics and monitoring utilities for tracking routing decisions and system health

import { supabase } from '@/integrations/supabase/client';
import { analyzePaymentRouting, type PaymentRoutingAnalysis } from './paymentRouter';
import type { Database } from '@/integrations/supabase/types';

type PaymentPlan = Database['public']['Tables']['PaymentPlans']['Row'];

/**
 * Comprehensive payment system analysis
 */
export interface PaymentSystemAnalysis extends PaymentRoutingAnalysis {
  // Database health
  activePlans: number;
  inactivePlans: number;
  
  // Revenue analysis
  potentialMonthlyRevenue: number;
  potentialYearlyRevenue: number;
  promotionalDiscount: number;
  
  // System status
  needsSubscriptionImplementation: boolean;
  plansRequiringMigration: string[];
  
  // Warnings
  warnings: string[];
}

/**
 * Fetches and analyzes all payment plans from the database
 */
export async function analyzePaymentSystem(): Promise<PaymentSystemAnalysis> {
  // Fetch all plans from database
  const { data: plans, error } = await supabase
    .from('PaymentPlans')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch payment plans: ${error.message}`);
  }

  if (!plans || plans.length === 0) {
    throw new Error('No payment plans found in database');
  }

  // Get basic routing analysis
  const routingAnalysis = analyzePaymentRouting(plans);
  
  // Calculate additional metrics
  const activePlans = plans.filter(p => p.is_active).length;
  const inactivePlans = plans.filter(p => !p.is_active).length;
  
  // Revenue analysis
  let potentialMonthlyRevenue = 0;
  let potentialYearlyRevenue = 0;
  let totalOriginalValue = 0;
  let totalPromotionalValue = 0;
  
  const plansRequiringMigration: string[] = [];
  const warnings: string[] = [];
  
  plans.forEach(plan => {
    if (!plan.is_active) return;
    
    // Calculate promotional pricing
    const originalAmount = plan.amount;
    let finalAmount = originalAmount;
    
    const promoConfig = plan.promotional_config as any;
    if (promoConfig?.isActive && promoConfig.finalPrice > 0) {
      // Check expiration
      const expired = promoConfig.expiresAt ? new Date(promoConfig.expiresAt) < new Date() : false;
      if (!expired) {
        finalAmount = promoConfig.finalPrice;
      }
    }
    
    totalOriginalValue += originalAmount;
    totalPromotionalValue += finalAmount;
    
    // Revenue projection based on plan type
    if (plan.type === 'subscription' && plan.billing_interval) {
      switch (plan.billing_interval) {
        case 'day':
          potentialMonthlyRevenue += finalAmount * 30;
          potentialYearlyRevenue += finalAmount * 365;
          break;
        case 'week':
          potentialMonthlyRevenue += finalAmount * 4;
          potentialYearlyRevenue += finalAmount * 52;
          break;
        case 'month':
          potentialMonthlyRevenue += finalAmount;
          potentialYearlyRevenue += finalAmount * 12;
          break;
        case 'year':
          potentialMonthlyRevenue += finalAmount / 12;
          potentialYearlyRevenue += finalAmount;
          break;
      }
      
      // Track plans requiring subscription implementation
      plansRequiringMigration.push(plan.id);
    }
    
    // Add warnings for potential issues
    if (plan.type === 'subscription' && !plan.billing_interval) {
      warnings.push(`Plan ${plan.name} (${plan.id}) has subscription type but no billing_interval`);
    }
    
    if (finalAmount < 50) {
      warnings.push(`Plan ${plan.name} (${plan.id}) has amount below Pagar.me minimum (R$ 0.50)`);
    }
    
    if (promoConfig?.isActive && promoConfig.expiresAt) {
      const expirationDate = new Date(promoConfig.expiresAt);
      const daysTillExpiration = Math.ceil((expirationDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysTillExpiration <= 7 && daysTillExpiration > 0) {
        warnings.push(`Plan ${plan.name} promotion expires in ${daysTillExpiration} days`);
      } else if (daysTillExpiration <= 0) {
        warnings.push(`Plan ${plan.name} promotion has expired`);
      }
    }
  });
  
  const promotionalDiscount = totalOriginalValue - totalPromotionalValue;
  const needsSubscriptionImplementation = routingAnalysis.subscriptionPlans > 0;
  
  return {
    ...routingAnalysis,
    activePlans,
    inactivePlans,
    potentialMonthlyRevenue,
    potentialYearlyRevenue,
    promotionalDiscount,
    needsSubscriptionImplementation,
    plansRequiringMigration,
    warnings
  };
}

/**
 * Generates a readable report of the payment system analysis
 */
export function generateAnalysisReport(analysis: PaymentSystemAnalysis): string {
  const report = `
# EVIDENS Payment System Analysis Report

## 📊 **System Overview**
- **Total Plans**: ${analysis.totalPlans}
- **Active Plans**: ${analysis.activePlans}
- **Inactive Plans**: ${analysis.inactivePlans}

## 💰 **Revenue Analysis** 
- **Potential Monthly Revenue**: R$ ${(analysis.potentialMonthlyRevenue / 100).toFixed(2)}
- **Potential Yearly Revenue**: R$ ${(analysis.potentialYearlyRevenue / 100).toFixed(2)}
- **Total Promotional Discount**: R$ ${(analysis.promotionalDiscount / 100).toFixed(2)}

## 🔄 **Payment Flow Distribution**
- **Subscription Plans**: ${analysis.subscriptionPlans} (${((analysis.subscriptionPlans / analysis.totalPlans) * 100).toFixed(1)}%)
- **One-time Plans**: ${analysis.oneTimePlans} (${((analysis.oneTimePlans / analysis.totalPlans) * 100).toFixed(1)}%)
- **Promotional Plans**: ${analysis.promotionalPlans}

## 📅 **Billing Intervals**
${Object.entries(analysis.billingIntervals)
  .map(([interval, count]) => `- **${interval}**: ${count} plans`)
  .join('\n')}

## 💸 **Average Plan Values**
- **Subscription Plans**: R$ ${(analysis.avgAmounts.subscription / 100).toFixed(2)}
- **One-time Plans**: R$ ${(analysis.avgAmounts.oneTime / 100).toFixed(2)}

## 🚨 **Implementation Status**
- **Subscription Implementation Required**: ${analysis.needsSubscriptionImplementation ? '✅ YES' : '❌ NO'}
- **Plans Requiring Migration**: ${analysis.plansRequiringMigration.length}

${analysis.plansRequiringMigration.length > 0 ? `
### Plans Requiring Subscription Implementation:
${analysis.plansRequiringMigration.map(planId => `- ${planId}`).join('\n')}
` : ''}

${analysis.warnings.length > 0 ? `
## ⚠️ **Warnings**
${analysis.warnings.map(warning => `- ${warning}`).join('\n')}
` : ''}

---
*Generated at: ${new Date().toLocaleString()}*
`;

  return report.trim();
}

/**
 * Hook for getting real-time payment system analysis
 */
export function usePaymentSystemAnalysis() {
  const fetchAnalysis = async () => {
    const analysis = await analyzePaymentSystem();
    return analysis;
  };

  return { fetchAnalysis };
}