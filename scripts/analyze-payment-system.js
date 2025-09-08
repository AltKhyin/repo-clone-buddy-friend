// ABOUTME: Script to analyze the current payment system and generate a comprehensive report

import { createClient } from '@supabase/supabase-js';
import { analyzePaymentRouting } from '../src/lib/paymentRouter.js';

// Mock environment setup for standalone script
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'your-supabase-url';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function analyzeCurrentSystem() {
  try {
    console.log('🔍 Analyzing EVIDENS Payment System...\n');
    
    // Fetch all payment plans
    const { data: plans, error } = await supabase
      .from('PaymentPlans')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Failed to fetch payment plans:', error);
      return;
    }

    if (!plans || plans.length === 0) {
      console.log('⚠️  No payment plans found in database');
      return;
    }

    console.log(`📊 Found ${plans.length} payment plans\n`);
    
    // Analyze routing
    const analysis = analyzePaymentRouting(plans);
    
    // Generate detailed report
    console.log('='.repeat(60));
    console.log('📋 EVIDENS PAYMENT SYSTEM ANALYSIS REPORT');
    console.log('='.repeat(60));
    console.log();
    
    console.log('📈 SYSTEM OVERVIEW:');
    console.log(`   Total Plans: ${analysis.totalPlans}`);
    console.log(`   Subscription Plans: ${analysis.subscriptionPlans} (${((analysis.subscriptionPlans / analysis.totalPlans) * 100).toFixed(1)}%)`);
    console.log(`   One-time Plans: ${analysis.oneTimePlans} (${((analysis.oneTimePlans / analysis.totalPlans) * 100).toFixed(1)}%)`);
    console.log(`   Promotional Plans: ${analysis.promotionalPlans}`);
    console.log(`   Expired Promotions: ${analysis.expiredPromotions}`);
    console.log();
    
    console.log('📅 BILLING INTERVALS:');
    Object.entries(analysis.billingIntervals).forEach(([interval, count]) => {
      console.log(`   ${interval}: ${count} plans`);
    });
    console.log();
    
    console.log('💰 AVERAGE PLAN VALUES:');
    console.log(`   Subscription Plans: R$ ${(analysis.avgAmounts.subscription / 100).toFixed(2)}`);
    console.log(`   One-time Plans: R$ ${(analysis.avgAmounts.oneTime / 100).toFixed(2)}`);
    console.log();
    
    console.log('🔧 DETAILED PLAN ANALYSIS:');
    console.log('-'.repeat(40));
    
    plans.filter(p => p.is_active).forEach(plan => {
      console.log(`📦 ${plan.name} (${plan.id.substring(0, 8)}...)`);
      console.log(`   Type: ${plan.type}`);
      console.log(`   Amount: R$ ${(plan.amount / 100).toFixed(2)}`);
      console.log(`   Billing: ${plan.billing_interval || 'one-time'}`);
      
      // Check promotional config
      const promoConfig = plan.promotional_config;
      if (promoConfig && promoConfig.isActive) {
        const expired = promoConfig.expiresAt ? new Date(promoConfig.expiresAt) < new Date() : false;
        const finalPrice = promoConfig.finalPrice || promoConfig.promotionValue;
        
        console.log(`   Promotion: ${expired ? '❌ EXPIRED' : '✅ ACTIVE'}`);
        if (finalPrice && !expired) {
          const discount = plan.amount - finalPrice;
          const discountPercent = ((discount / plan.amount) * 100).toFixed(1);
          console.log(`   Final Price: R$ ${(finalPrice / 100).toFixed(2)} (${discountPercent}% off)`);
        }
        if (promoConfig.customName) {
          console.log(`   Promo Name: ${promoConfig.customName}`);
        }
      }
      console.log();
    });
    
    console.log('🚨 IMPLEMENTATION REQUIREMENTS:');
    console.log('-'.repeat(40));
    
    if (analysis.subscriptionPlans > 0) {
      console.log('❗ CRITICAL: Subscription implementation required!');
      console.log(`   ${analysis.subscriptionPlans} plans need subscription flow`);
      console.log('   Currently routing to one-time payments as fallback');
      console.log();
    }
    
    if (analysis.expiredPromotions > 0) {
      console.log(`⚠️  WARNING: ${analysis.expiredPromotions} expired promotions detected`);
      console.log('   Consider updating or deactivating expired promotions');
      console.log();
    }
    
    console.log('📋 NEXT STEPS:');
    console.log('   1. ✅ Phase 1: Payment Flow Analysis - COMPLETED');
    console.log('   2. 🔄 Phase 2: Pagar.me Plan Synchronization - IN PROGRESS');
    console.log('   3. 🔄 Phase 3: Subscription Implementation - REQUIRED');
    console.log('   4. 🔄 Phase 4: Webhook Enhancement - REQUIRED');
    console.log('   5. 🔄 Phase 5: Testing & Validation - REQUIRED');
    
    console.log();
    console.log('='.repeat(60));
    console.log(`✅ Analysis completed at ${new Date().toLocaleString()}`);
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('❌ Analysis failed:', error);
  }
}

// Run analysis
analyzeCurrentSystem();