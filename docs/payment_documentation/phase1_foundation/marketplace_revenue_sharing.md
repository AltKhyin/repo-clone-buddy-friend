# 1.3 Marketplace & Revenue Sharing Deep Dive

> **Strategic Framework: Split Payment Architecture for EVIDENS Marketplace**  
> *Sources: [Recipients](https://docs.pagar.me/reference/recebedores-1), [Split Rules](https://docs.pagar.me/reference/regras-de-split), [KYC](https://docs.pagar.me/docs/kyc)*

## 🎯 **Executive Summary**

EVIDENS marketplace requires a **sophisticated split payment system** combining Pagar.me's native Recipients management with custom creator onboarding and flexible revenue sharing models. This enables seamless monetization for content creators while maintaining platform control and compliance.

---

## 🏗️ **Marketplace Architecture Overview**

### **Revenue Flow Philosophy: "Creator-First, Platform-Sustainable"**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Customer      │    │   EVIDENS       │    │   Content       │
│   Payment       │ →  │   Platform      │ →  │   Creator       │
│                 │    │                 │    │                 │
│ • Full amount   │    │ • Platform fee  │    │ • Creator share │
│ • Single trans  │    │ • Processing    │    │ • Direct payout │
│ • Any method    │    │ • Compliance    │    │ • Automatic     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### **Core Marketplace Requirements**
- **Creator Revenue Sharing**: 70-85% to creators, 15-30% platform fee
- **Flexible Split Models**: Percentage, fixed, or hybrid approaches
- **Automated Payouts**: Weekly/monthly distribution to creators
- **Compliance Handling**: KYC/AML for all marketplace participants
- **Financial Transparency**: Real-time reporting for creators and platform

---

## 📋 **Recipients Management Architecture**

### **Pagar.me Recipients System**
**Source**: [Recipients API Reference](https://docs.pagar.me/reference/recebedores-1)

#### **Recipient Creation Pattern**
```javascript
// Content Creator Onboarding Flow
const createContentCreatorRecipient = async (creatorData) => {
  const recipient = await pagarme.recipients.create({
    // Basic Creator Information
    name: creatorData.displayName,
    email: creatorData.email,
    description: `EVIDENS Creator: ${creatorData.username}`,
    
    // Document Information (Required for KYC)
    document: creatorData.cpfOrCnpj,
    type: creatorData.accountType, // "individual" or "corporation"
    
    // Bank Account Information
    bank_account: {
      bank_code: creatorData.bankCode,
      agencia: creatorData.agency,
      conta: creatorData.account,
      conta_dv: creatorData.accountDigit,
      type: "conta_corrente", // or "conta_poupanca"
      legal_name: creatorData.legalName
    },
    
    // Transfer Settings
    transfer_settings: {
      transfer_enabled: true,
      transfer_interval: "weekly", // or "monthly"
      transfer_day: 5 // 5th day of interval
    },
    
    // EVIDENS Metadata
    metadata: {
      creator_id: creatorData.creatorId,
      creator_tier: creatorData.tier, // "starter", "pro", "premium" 
      onboarding_date: new Date().toISOString(),
      revenue_model: "percentage_split",
      default_split_percentage: "75", // Creator gets 75%
      platform_fee_model: "percentage", // vs "fixed"
      content_categories: creatorData.categories.join(","),
      payout_preference: "weekly"
    }
  })
  
  return recipient
}
```

### **Creator Status Management**
```javascript
// Creator Lifecycle Management
const creatorStatusTypes = {
  pending_kyc: {
    description: "KYC documentation under review",
    can_receive_payments: false,
    actions: ["submit_documents", "update_info"]
  },
  
  active: {
    description: "Active creator receiving payments",
    can_receive_payments: true,
    actions: ["pause_account", "update_split_rules", "view_analytics"]
  },
  
  paused: {
    description: "Temporarily suspended by creator or platform",
    can_receive_payments: false,
    actions: ["resume_account", "update_documents"]
  },
  
  suspended: {
    description: "Platform suspended due to policy violations",
    can_receive_payments: false,
    actions: ["appeal_suspension", "contact_support"]
  }
}

// Creator Status Update Function
const updateCreatorStatus = async (recipientId, newStatus, reason) => {
  await pagarme.recipients.update(recipientId, {
    transfer_settings: {
      transfer_enabled: newStatus === 'active'
    },
    metadata: {
      status: newStatus,
      status_change_date: new Date().toISOString(),
      status_change_reason: reason,
      last_updated_by: "platform_admin"
    }
  })
}
```

---

## 🔧 **Split Rules Configuration System**

### **Flexible Split Models**
**Source**: [Split Rules Documentation](https://docs.pagar.me/reference/regras-de-split)

#### **Model 1: Percentage-Based Split (Recommended)**
```javascript
// Most common model for EVIDENS marketplace
const percentageSplitRule = {
  // Creator receives majority
  creator_split: {
    recipient_id: "rp_creator_123456",
    type: "percentage",
    amount: 7500, // 75% (in basis points: 75.00%)
    charge_processing_fee: false, // Platform absorbs processing fees
    liable: false, // Platform liable for chargebacks
    charge_remainder_fee: false
  },
  
  // Platform fee
  platform_split: {
    recipient_id: "rp_evidens_platform", 
    type: "percentage", 
    amount: 2500, // 25% platform fee
    charge_processing_fee: true, // Platform pays processing
    liable: true, // Platform handles disputes
    charge_remainder_fee: true
  }
}
```

#### **Model 2: Fixed Fee + Percentage**
```javascript
// For premium content or special arrangements
const hybridSplitRule = {
  // Platform takes fixed fee first
  platform_fixed: {
    recipient_id: "rp_evidens_platform",
    type: "fixed", 
    amount: 500, // R$ 5.00 fixed fee per transaction
    charge_processing_fee: true,
    liable: true
  },
  
  // Creator gets percentage of remainder
  creator_remainder: {
    recipient_id: "rp_creator_123456",
    type: "percentage",
    amount: 8500, // 85% of amount after fixed fee
    charge_processing_fee: false,
    liable: false
  }
}
```

#### **Model 3: Tiered Creator Revenue**
```javascript
// Revenue sharing based on creator tier/performance
const tieredSplitCalculator = (creatorTier, transactionAmount) => {
  const tierRates = {
    starter: { creator: 70, platform: 30 },
    pro: { creator: 75, platform: 25 },
    premium: { creator: 80, platform: 20 },
    featured: { creator: 85, platform: 15 }
  }
  
  const rates = tierRates[creatorTier] || tierRates.starter
  
  return {
    creator_split: {
      recipient_id: getCreatorRecipientId(),
      type: "percentage",
      amount: rates.creator * 100, // Convert to basis points
      charge_processing_fee: false,
      liable: false
    },
    platform_split: {
      recipient_id: "rp_evidens_platform",
      type: "percentage", 
      amount: rates.platform * 100,
      charge_processing_fee: true,
      liable: true
    }
  }
}
```

### **Dynamic Split Rule Application**
```javascript
// Apply split rules to subscription or purchase
const createTransactionWithSplit = async (transactionData) => {
  const { creatorId, amount, customerId, productType } = transactionData
  
  // Get creator recipient info
  const creator = await getCreatorById(creatorId)
  const splitRules = calculateSplitRules(creator, amount, productType)
  
  const transaction = await pagarme.orders.create({
    customer_id: customerId,
    items: [
      {
        description: `EVIDENS Content - ${creator.displayName}`,
        quantity: 1,
        amount: amount
      }
    ],
    
    // Apply dynamic split rules
    split_rules: splitRules,
    
    metadata: {
      creator_id: creatorId,
      split_model: creator.revenueModel,
      creator_tier: creator.tier,
      transaction_type: productType
    }
  })
  
  return transaction
}
```

---

## 🏛️ **Compliance & KYC Requirements**

### **Brazilian Marketplace Compliance**
**Source**: [KYC Documentation](https://docs.pagar.me/docs/kyc)

#### **Required Creator Documentation**
```javascript
// KYC Requirements for Content Creators
const kycRequirements = {
  individual_creators: {
    required_documents: [
      "cpf", // Brazilian tax ID
      "identity_document", // RG, CNH, or Passport
      "proof_of_address", // Recent utility bill
      "bank_account_proof" // Bank statement or proof
    ],
    additional_info: [
      "phone_number",
      "full_legal_name",
      "date_of_birth",
      "occupation"
    ]
  },
  
  business_creators: {
    required_documents: [
      "cnpj", // Business tax ID
      "company_registration", // Registration certificate
      "articles_of_incorporation",
      "authorized_representative_cpf",
      "business_bank_account_proof"
    ],
    additional_info: [
      "business_type",
      "business_address",
      "authorized_representative",
      "business_phone"
    ]
  }
}

// KYC Verification Flow
const processCreatorKYC = async (creatorId, documents) => {
  // Submit documents to Pagar.me for verification
  const kycSubmission = await pagarme.recipients.create_kyc(creatorId, {
    documents: documents.map(doc => ({
      type: doc.type,
      file: doc.base64Content // Base64 encoded file
    }))
  })
  
  // Update creator status while pending
  await updateCreatorStatus(creatorId, 'pending_kyc', 'KYC documents submitted')
  
  return kycSubmission
}
```

### **Anti-Money Laundering (AML) Monitoring**
```javascript
// AML Monitoring for Creator Transactions
const amlMonitoring = {
  transaction_limits: {
    daily: 50000, // R$ 500.00 daily limit for new creators
    monthly: 500000, // R$ 5,000.00 monthly limit
    annual: 12000000 // R$ 120,000.00 annual limit
  },
  
  suspicious_activity_flags: [
    "rapid_high_volume_transactions",
    "unusual_geographic_patterns", 
    "split_rule_manipulation_attempts",
    "document_inconsistencies"
  ],
  
  monitoring_actions: {
    flag_review: "Manual review by compliance team",
    temporary_hold: "Pause payouts pending investigation", 
    account_suspension: "Suspend creator account",
    report_authorities: "Report to Brazilian financial authorities"
  }
}
```

---

## 📊 **Financial Reconciliation & Reporting**

### **Revenue Tracking Architecture**
```javascript
// Comprehensive Revenue Tracking for Marketplace
const revenueTrackingSystem = {
  // Platform Revenue Streams
  platform_revenue: {
    subscription_fees: "Monthly/annual subscription platform fees",
    transaction_fees: "Percentage of each creator transaction", 
    premium_features: "Advanced analytics, promotion tools",
    payment_processing: "Processing fee markup"
  },
  
  // Creator Revenue Streams  
  creator_revenue: {
    content_sales: "Individual content purchases",
    subscription_shares: "Recurring subscription revenue shares",
    tip_donations: "Direct fan support payments",
    merchandise: "Creator merchandise sales"
  },
  
  // Financial Reconciliation Rules
  reconciliation: {
    frequency: "daily", // Daily reconciliation with Pagar.me
    variance_threshold: 0.01, // 1 cent variance tolerance
    dispute_handling: "automatic_escalation",
    settlement_schedule: "weekly_creators_monthly_platform"
  }
}

// Creator Revenue Dashboard Data
const generateCreatorDashboard = async (creatorId, dateRange) => {
  const transactions = await getCreatorTransactions(creatorId, dateRange)
  
  return {
    revenue_summary: {
      total_earnings: calculateTotalEarnings(transactions),
      platform_fees: calculatePlatformFees(transactions), 
      net_earnings: calculateNetEarnings(transactions),
      pending_payouts: getPendingPayouts(creatorId),
      next_payout_date: getNextPayoutDate(creatorId)
    },
    
    performance_metrics: {
      total_sales: transactions.length,
      average_transaction: calculateAverageTransaction(transactions),
      top_content: getTopPerformingContent(transactions),
      revenue_trend: calculateRevenueTrend(transactions),
      conversion_rate: calculateConversionRate(creatorId, dateRange)
    },
    
    payout_history: {
      recent_payouts: getRecentPayouts(creatorId, 10),
      total_paid_out: getTotalPaidOut(creatorId),
      payout_schedule: getPayoutSchedule(creatorId)
    }
  }
}
```

### **Platform Financial Management**
```javascript
// EVIDENS Platform Financial Overview
const platformFinancialManagement = {
  // Revenue Collection
  revenue_collection: {
    automatic_platform_fees: "Collected via split rules",
    processing_fee_management: "Platform absorbs or passes through", 
    subscription_revenue: "Direct platform subscriptions",
    premium_feature_revenue: "Enhanced creator tools"
  },
  
  // Payout Management
  payout_management: {
    creator_payouts: "Automated weekly/monthly transfers",
    payout_scheduling: "Configurable per creator preference",
    failed_payout_handling: "Retry logic + notifications",
    payout_reconciliation: "Match payouts with split rule calculations"
  },
  
  // Financial Reporting
  financial_reporting: {
    daily_reconciliation: "Platform revenue vs creator payouts",
    monthly_summaries: "Creator performance + platform metrics",
    tax_reporting: "Automated 1099/tax document generation", 
    audit_trails: "Complete transaction history for compliance"
  }
}
```

---

## 🔄 **Creator Onboarding Workflow**

### **Streamlined Creator Registration**
```javascript
// Complete Creator Onboarding Process
const creatorOnboardingFlow = {
  // Step 1: Basic Registration
  basic_registration: {
    required_fields: [
      "display_name",
      "email", 
      "content_category",
      "expected_monthly_revenue"
    ],
    validation: {
      email_verification: true,
      duplicate_check: true,
      content_policy_acceptance: true
    }
  },
  
  // Step 2: Tax & Legal Information
  tax_legal_setup: {
    document_type: "cpf_or_cnpj_selection",
    tax_information: "tax_id_verification",
    legal_structure: "individual_or_business_selection",
    address_verification: "proof_of_address_upload"
  },
  
  // Step 3: Banking & Payout Setup
  banking_setup: {
    bank_account_info: "account_details_entry",
    payout_preference: "weekly_or_monthly_selection", 
    minimum_payout_threshold: "configurable_minimum",
    bank_verification: "micro_deposit_verification"
  },
  
  // Step 4: Content & Revenue Configuration
  content_setup: {
    content_pricing: "default_pricing_strategy",
    revenue_split_agreement: "terms_acceptance",
    content_categories: "category_selection",
    promotion_preferences: "marketing_opt_ins"
  },
  
  // Step 5: KYC & Final Approval
  kyc_approval: {
    document_upload: "required_kyc_documents",
    automated_verification: "pagar_me_kyc_processing",
    manual_review: "compliance_team_review_if_needed", 
    account_activation: "recipient_creation_and_activation"
  }
}

// Onboarding Progress Tracking
const trackOnboardingProgress = (creatorId) => {
  return {
    current_step: getCurrentOnboardingStep(creatorId),
    completion_percentage: calculateCompletionPercentage(creatorId),
    required_actions: getPendingActions(creatorId),
    estimated_approval_time: getEstimatedApprovalTime(creatorId),
    support_contact: "creator-support@evidens.com"
  }
}
```

---

## 🎯 **Split Payment Decision Matrix**

| **Split Model** | **Use Case** | **Creator %** | **Platform %** | **Complexity** | **Best For** |
|-----------------|--------------|---------------|----------------|-----------------|--------------|
| **Fixed Percentage** | Standard content | 75% | 25% | Low | New creators |
| **Tiered Percentage** | Performance-based | 70-85% | 15-30% | Medium | Established creators |
| **Fixed Fee + %** | Premium content | 85%* | 15% + fee | Medium | High-value content |
| **Custom Hybrid** | Special partnerships | Variable | Variable | High | Enterprise creators |

*Percentage of amount after fixed fee

---

## 📝 **Implementation Priority Roadmap**

| **Feature** | **Priority** | **Implementation** | **Timeline** | **Dependencies** |
|-------------|-------------|-------------------|-------------|------------------|
| **Basic Split Rules** | HIGH | Percentage-based splits | Week 1-2 | PSP Integration |
| **Creator Onboarding** | HIGH | KYC + Bank setup | Week 2-3 | Recipients API |
| **Revenue Dashboard** | MEDIUM | Creator analytics | Week 3-4 | Transaction tracking |
| **Advanced Split Models** | MEDIUM | Tiered + Hybrid rules | Week 4-5 | Basic splits working |
| **Automated Payouts** | MEDIUM | Scheduled transfers | Week 5-6 | Banking integration |
| **Compliance Monitoring** | LOW | AML + fraud detection | Week 6+ | Full system operational |

---

## 🔗 **Essential Documentation References**

- **[Recipients API Reference](https://docs.pagar.me/reference/recebedores-1)**: Creator account management
- **[Split Rules Reference](https://docs.pagar.me/reference/regras-de-split)**: Revenue sharing configuration  
- **[KYC Documentation](https://docs.pagar.me/docs/kyc)**: Compliance and verification requirements
- **[Transfers API](https://docs.pagar.me/reference/transferências-1)**: Payout management
- **[Webhook Events](https://docs.pagar.me/reference/webhooks-1)**: Real-time recipient updates

---

*This marketplace architecture enables EVIDENS to operate as a comprehensive content creator platform while maintaining full compliance with Brazilian financial regulations and maximizing creator satisfaction through transparent, automated revenue sharing.*