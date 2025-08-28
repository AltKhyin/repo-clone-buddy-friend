# 2.1 Payment Method Implementation Guide

> **Comprehensive Brazilian Payment Methods Integration**  
> *Sources: [Payment Methods](https://docs.pagar.me/reference/meios-de-pagamento-1), [PIX](https://docs.pagar.me/docs/pix), [Boleto](https://docs.pagar.me/docs/boleto), [Credit Cards](https://docs.pagar.me/docs/cartão-de-crédito)*

## 🎯 **Executive Summary**

EVIDENS payment system supports all major Brazilian payment methods with optimized user experience for each method type. The implementation prioritizes **native Pagar.me features** while providing seamless customer experience across Pix (instant), Boleto (bank slip), and Credit Cards (with installments).

---

## 💳 **Payment Method Architecture Overview**

### **Brazilian Payment Landscape Priority**

```
┌─────────────────────────────────────────────────────────────────┐
│                    EVIDENS Payment Methods                      │
├─────────────────────────────────────────────────────────────────┤
│  PRIMARY (85% of transactions)                                 │
│  • PIX (instant, 0% fee to customer)                          │
│  • Credit Card (installments, immediate access)                │
│                                                                 │
│  SECONDARY (15% of transactions)                               │
│  • Boleto (bank slip, 2-3 day processing)                     │
│  • International Cards (5% international users)                │
└─────────────────────────────────────────────────────────────────┘
```

### **Payment Method Decision Tree**
```javascript
// Customer Payment Method Selection Logic
const paymentMethodSelector = {
  customer_profile_based: {
    immediate_access_needed: ["pix", "credit_card"],
    privacy_conscious: ["boleto", "pix"],
    installment_preference: ["credit_card"],
    no_bank_account: ["credit_card"],
    international: ["credit_card"]
  },
  
  transaction_amount_based: {
    small_amounts: ["pix"], // Under R$ 50
    medium_amounts: ["pix", "credit_card"], // R$ 50-500
    large_amounts: ["credit_card", "boleto"] // Over R$ 500
  },
  
  business_rules: {
    subscription_payments: ["credit_card"], // Recurring needs stored card
    one_time_purchases: ["pix", "credit_card", "boleto"],
    international_customers: ["credit_card"],
    high_risk_transactions: ["pix", "boleto"] // No chargebacks
  }
}
```

---

## 🚀 **PIX Implementation (Priority #1)**

### **PIX Integration Strategy**
**Source**: [PIX Documentation](https://docs.pagar.me/docs/pix)

#### **Why PIX is Priority #1 for EVIDENS:**
- ✅ **Instant Payment Confirmation** (real-time access to content)
- ✅ **Zero Customer Fees** (higher conversion rates)
- ✅ **No Chargebacks** (reduced disputes)
- ✅ **24/7 Availability** (weekend/holiday transactions)
- ✅ **Universal Adoption** (95%+ of Brazilian banks support PIX)

#### **PIX Implementation Pattern**
```javascript
// PIX Payment Creation for EVIDENS
const createPixPayment = async (orderData) => {
  const { customerId, amount, productDescription, creatorSplit } = orderData
  
  const pixOrder = await pagarme.orders.create({
    customer_id: customerId,
    
    items: [
      {
        description: productDescription,
        quantity: 1,
        amount: amount // Amount in cents (R$ 19.90 = 1990)
      }
    ],
    
    payments: [
      {
        payment_method: "pix",
        pix: {
          expires_in: 3600, // 1 hour expiration (recommended)
          additional_info: [
            {
              name: "Produto",
              value: productDescription
            },
            {
              name: "Plataforma", 
              value: "EVIDENS"
            }
          ]
        }
      }
    ],
    
    // Split rules for marketplace
    split_rules: creatorSplit,
    
    metadata: {
      payment_method: "pix",
      expected_confirmation_time: "instant",
      customer_access_type: "immediate",
      platform: "evidens"
    }
  })
  
  return {
    order_id: pixOrder.id,
    pix_qr_code: pixOrder.charges[0].last_transaction.qr_code,
    pix_qr_code_url: pixOrder.charges[0].last_transaction.qr_code_url,
    pix_copy_paste: pixOrder.charges[0].last_transaction.qr_code_text,
    expires_at: pixOrder.charges[0].last_transaction.expires_at,
    amount: pixOrder.amount,
    status: pixOrder.status
  }
}
```

#### **PIX User Experience Flow**
```javascript
// Complete PIX Payment UX Implementation
const pixPaymentUX = {
  // Step 1: Payment Method Selection
  method_selection: {
    display: "PIX - Pagamento instantâneo",
    benefits: ["Confirmação imediata", "Sem taxas", "Disponível 24h"],
    recommendation_badge: "Recomendado"
  },
  
  // Step 2: PIX Code Generation
  code_generation: {
    loading_message: "Gerando código PIX...",
    generation_time: "< 2 seconds",
    fallback_message: "Se demorar mais que 10s, recarregue a página"
  },
  
  // Step 3: PIX Code Display
  code_display: {
    qr_code_size: "256x256px", // Large enough for phone scanning
    copy_paste_button: "Copiar código PIX",
    instructions: [
      "1. Abra o app do seu banco",
      "2. Escolha PIX > Pagar",
      "3. Escaneie o QR Code ou cole o código",
      "4. Confirme o pagamento"
    ],
    expiration_timer: "Válido por 1 hora"
  },
  
  // Step 4: Payment Confirmation Waiting
  confirmation_waiting: {
    polling_interval: 5000, // Check status every 5 seconds
    loading_message: "Aguardando confirmação do pagamento...",
    average_time: "Confirmação em até 10 segundos",
    timeout_handling: "Se não confirmar em 5 minutos, recarregue"
  },
  
  // Step 5: Success & Access
  success_flow: {
    confirmation_message: "Pagamento confirmado! 🎉",
    access_message: "Acesso liberado automaticamente",
    next_steps: "Você já pode acessar o conteúdo",
    redirect_delay: 3000 // 3 seconds before redirect
  }
}

// PIX Status Polling Implementation
const pollPixPaymentStatus = async (orderId, onStatusUpdate) => {
  const maxAttempts = 60 // 5 minutes maximum (5s intervals)
  let attempts = 0
  
  const checkStatus = async () => {
    try {
      const order = await pagarme.orders.get(orderId)
      const status = order.charges[0].status
      
      onStatusUpdate({ status, order })
      
      if (status === 'paid') {
        return { success: true, order }
      }
      
      if (status === 'failed' || status === 'canceled') {
        return { success: false, error: 'Payment failed or canceled' }
      }
      
      attempts++
      if (attempts < maxAttempts) {
        setTimeout(checkStatus, 5000) // Check again in 5 seconds
      } else {
        return { success: false, error: 'Timeout waiting for payment confirmation' }
      }
    } catch (error) {
      console.error('Error polling PIX status:', error)
      return { success: false, error: 'Error checking payment status' }
    }
  }
  
  return checkStatus()
}
```

---

## 💳 **Credit Card Implementation (Priority #2)**

### **Credit Card Integration Strategy**
**Source**: [Credit Card Documentation](https://docs.pagar.me/docs/cartão-de-crédito)

#### **Credit Card Features for EVIDENS:**
- ✅ **Installments** (1x to 12x for subscriptions)
- ✅ **Immediate Access** (upon approval)
- ✅ **Recurring Billing** (for subscriptions)
- ✅ **International Support** (Visa, Mastercard, Amex)
- ✅ **Tokenization** (secure card storage)

#### **Credit Card Payment Implementation**
```javascript
// Credit Card Payment with Installments
const createCreditCardPayment = async (orderData, cardData) => {
  const { customerId, amount, installments, productDescription, creatorSplit } = orderData
  
  const creditCardOrder = await pagarme.orders.create({
    customer_id: customerId,
    
    items: [
      {
        description: productDescription,
        quantity: 1,
        amount: amount
      }
    ],
    
    payments: [
      {
        payment_method: "credit_card",
        credit_card: {
          // Card tokenization (secure)
          card_token: cardData.card_token, // Generated via client-side tokenization
          
          // Installment configuration
          installments: installments,
          statement_descriptor: "EVIDENS", // Appears on card statement
          
          // Authentication (3DS when required)
          authentication: {
            type: "threed_secure",
            threed_secure: {
              mpi: "pagarme", // Use Pagar.me's 3DS
              cavv: cardData.cavv,
              eci: cardData.eci,
              transaction_id: cardData.transaction_id
            }
          }
        }
      }
    ],
    
    // Marketplace split rules
    split_rules: creatorSplit,
    
    metadata: {
      payment_method: "credit_card",
      installments: installments.toString(),
      expected_confirmation_time: "immediate",
      customer_access_type: "immediate"
    }
  })
  
  return {
    order_id: creditCardOrder.id,
    status: creditCardOrder.charges[0].status,
    authorization_code: creditCardOrder.charges[0].last_transaction.authorization_code,
    installment_amount: Math.round(amount / installments),
    total_amount: amount,
    installments: installments
  }
}
```

#### **Installment Calculation Logic**
```javascript
// Dynamic Installment Options for EVIDENS
const calculateInstallmentOptions = (amount, customerTier = 'regular') => {
  const baseAmount = amount / 100 // Convert from cents to reais
  
  // Installment rules based on amount
  const installmentRules = {
    // Minimum amount per installment: R$ 10.00
    minInstallmentAmount: 1000, // R$ 10.00 in cents
    
    // Maximum installments by customer tier
    maxInstallments: {
      regular: 6,
      premium: 12,
      creator: 12
    },
    
    // Interest rates (0% for first 6 installments)
    interestRates: {
      1: 0,   // 1x - no interest
      2: 0,   // 2x - no interest
      3: 0,   // 3x - no interest
      4: 0,   // 4x - no interest
      5: 0,   // 5x - no interest
      6: 0,   // 6x - no interest
      7: 2.99, // 7x - 2.99% monthly interest
      8: 2.99,
      9: 2.99,
      10: 2.99,
      11: 2.99,
      12: 2.99
    }
  }
  
  const maxInstallments = Math.min(
    installmentRules.maxInstallments[customerTier],
    Math.floor(amount / installmentRules.minInstallmentAmount)
  )
  
  const options = []
  
  for (let i = 1; i <= maxInstallments; i++) {
    const interestRate = installmentRules.interestRates[i] || 0
    const installmentAmount = interestRate > 0 
      ? calculateWithInterest(amount, i, interestRate)
      : Math.round(amount / i)
    
    options.push({
      installments: i,
      installment_amount: installmentAmount,
      total_amount: installmentAmount * i,
      interest_rate: interestRate,
      interest_free: interestRate === 0,
      display_text: i === 1 
        ? `1x de R$ ${(installmentAmount/100).toFixed(2)}` 
        : `${i}x de R$ ${(installmentAmount/100).toFixed(2)} ${interestRate === 0 ? 'sem juros' : `(${interestRate}% a.m.)`}`
    })
  }
  
  return options
}

// Interest calculation helper
const calculateWithInterest = (principal, installments, monthlyRate) => {
  const rate = monthlyRate / 100
  const factor = Math.pow(1 + rate, installments)
  const installmentAmount = principal * (rate * factor) / (factor - 1)
  return Math.round(installmentAmount)
}
```

#### **Card Tokenization (Client-Side Security)**
```javascript
// Secure card tokenization implementation
const tokenizeCard = async (cardData) => {
  // This runs on the client-side using Pagar.me's public key
  const cardToken = await pagarme.security.encrypt({
    card_number: cardData.number.replace(/\s/g, ''), // Remove spaces
    card_holder_name: cardData.holderName.toUpperCase(),
    card_expiration_date: cardData.expirationDate, // MMYY format
    card_cvv: cardData.cvv
  })
  
  return {
    card_token: cardToken,
    card_last_digits: cardData.number.slice(-4),
    card_brand: detectCardBrand(cardData.number),
    card_holder_name: cardData.holderName.toUpperCase()
  }
}

// Card brand detection
const detectCardBrand = (cardNumber) => {
  const brands = {
    visa: /^4[0-9]{12}(?:[0-9]{3})?$/,
    mastercard: /^5[1-5][0-9]{14}$/,
    amex: /^3[47][0-9]{13}$/,
    elo: /^((((636368)|(438935)|(504175)|(451416)|(636297))\d{10})|((5067)|(4576)|(4011))\d{12})$/,
    hipercard: /^(606282\d{10}(\d{3})?)|(3841\d{15})$/
  }
  
  for (const [brand, regex] of Object.entries(brands)) {
    if (regex.test(cardNumber)) {
      return brand
    }
  }
  
  return 'unknown'
}
```

---

## 🏦 **Boleto Implementation (Secondary)**

### **Boleto Integration Strategy** 
**Source**: [Boleto Documentation](https://docs.pagar.me/docs/boleto)

#### **Boleto Use Cases for EVIDENS:**
- ✅ **Privacy-Conscious Users** (no card required)
- ✅ **Large Purchases** (R$ 500+)
- ✅ **No Bank Account** (pay at lottery houses, banks)
- ✅ **Scheduled Payments** (users can pay when convenient)

#### **Boleto Payment Implementation**
```javascript
// Boleto Payment Creation
const createBoletoPayment = async (orderData) => {
  const { customerId, amount, productDescription, creatorSplit, dueDate } = orderData
  
  const boletoOrder = await pagarme.orders.create({
    customer_id: customerId,
    
    items: [
      {
        description: productDescription,
        quantity: 1,
        amount: amount
      }
    ],
    
    payments: [
      {
        payment_method: "boleto",
        boleto: {
          bank: "033", // Santander (reliable for boleto processing)
          instructions: "Pagamento para EVIDENS - Plataforma de Reviews",
          due_at: dueDate || getDefaultDueDate(), // 7 days from creation
          document_number: generateBoletoDocumentNumber(),
          type: "dm" // Document type: DM (Demonstrative)
        }
      }
    ],
    
    // Split rules for marketplace
    split_rules: creatorSplit,
    
    metadata: {
      payment_method: "boleto",
      expected_confirmation_time: "2-3_business_days",
      customer_access_type: "after_confirmation",
      boleto_due_date: dueDate
    }
  })
  
  return {
    order_id: boletoOrder.id,
    boleto_url: boletoOrder.charges[0].last_transaction.url,
    boleto_barcode: boletoOrder.charges[0].last_transaction.line,
    boleto_pdf: boletoOrder.charges[0].last_transaction.pdf,
    due_date: boletoOrder.charges[0].last_transaction.due_at,
    amount: boletoOrder.amount
  }
}

// Boleto helper functions
const getDefaultDueDate = () => {
  const dueDate = new Date()
  dueDate.setDate(dueDate.getDate() + 7) // 7 days from now
  return dueDate.toISOString()
}

const generateBoletoDocumentNumber = () => {
  const prefix = "EVID" // EVIDENS prefix
  const timestamp = Date.now().toString().slice(-8) // Last 8 digits of timestamp
  const random = Math.random().toString(36).substr(2, 4).toUpperCase()
  return `${prefix}${timestamp}${random}`
}
```

#### **Boleto User Experience Considerations**
```javascript
// Boleto UX Special Handling
const boletoUX = {
  // Clear expectations setting
  expectation_management: {
    processing_time: "2 a 3 dias úteis para confirmação",
    access_timing: "Acesso liberado após confirmação do pagamento",
    payment_locations: "Pague em bancos, lotéricas, internet banking ou PIX",
    due_date_warning: "Boleto vence em 7 dias"
  },
  
  // Multiple payment options for boleto
  payment_options: {
    print_and_pay: "Imprimir boleto e pagar presencialmente",
    copy_barcode: "Copiar código de barras para internet banking",
    pix_from_boleto: "Pagar boleto via PIX (instantâneo)",
    email_boleto: "Enviar boleto por email"
  },
  
  // Payment confirmation flow
  confirmation_flow: {
    manual_check: "Usuário pode informar pagamento manualmente",
    automatic_webhook: "Confirmação automática via webhook",
    status_page: "Página de status para acompanhar pagamento",
    notification_options: "SMS/email quando confirmado"
  },
  
  // Late payment handling
  late_payment_handling: {
    grace_period: "3 dias de tolerância após vencimento",
    reissue_boleto: "Opção de gerar novo boleto se vencido",
    convert_to_pix: "Oferecer PIX como alternativa rápida",
    contact_support: "Opção de contato para casos especiais"
  }
}
```

---

## 🌍 **International Payment Support**

### **International Customer Payment Strategy**
**5% of EVIDENS customer base (international users)**

#### **Supported International Payment Methods**
```javascript
// International Payment Configuration
const internationalPaymentConfig = {
  // Supported countries (exclude US due to regulation complexity)
  supported_countries: [
    "AR", // Argentina
    "CL", // Chile  
    "CO", // Colombia
    "MX", // Mexico
    "PE", // Peru
    "UY", // Uruguay
    "PT", // Portugal
    "ES", // Spain
  ],
  
  // Payment methods by region
  payment_methods: {
    latin_america: ["credit_card", "debit_card"],
    europe: ["credit_card", "debit_card"],
    other: ["credit_card"] // Conservative approach for other regions
  },
  
  // Currency handling (always charge in BRL)
  currency_policy: {
    base_currency: "BRL",
    display_conversion: true, // Show equivalent in local currency
    conversion_disclaimer: "Cobrança em Real Brasileiro (BRL)",
    fx_provider: "exchangerate_api" // For display purposes only
  },
  
  // Pricing adjustment for international
  pricing_adjustments: {
    base_multiplier: 1.0, // Same price as Brazilian customers
    processing_fee_adjustment: 0.05, // 5% additional for international processing
    tax_handling: "customer_responsibility" // Customer handles local taxes
  }
}

// International Payment Implementation
const createInternationalPayment = async (orderData, customerCountry) => {
  const { customerId, amount, productDescription, creatorSplit } = orderData
  
  // Add international processing fee
  const adjustedAmount = Math.round(amount * 1.05) // 5% processing fee
  
  const internationalOrder = await pagarme.orders.create({
    customer_id: customerId,
    
    items: [
      {
        description: `${productDescription} (International)`,
        quantity: 1,
        amount: adjustedAmount
      }
    ],
    
    payments: [
      {
        payment_method: "credit_card",
        credit_card: {
          card_token: orderData.cardToken,
          installments: 1, // International customers: no installments
          statement_descriptor: "EVIDENS BR" // Clear Brazil origin
        }
      }
    ],
    
    // Adjusted split rules (account for processing fee)
    split_rules: adjustSplitRulesForInternational(creatorSplit, 0.05),
    
    metadata: {
      customer_country: customerCountry,
      payment_type: "international",
      processing_fee_applied: "5%",
      original_amount: amount.toString(),
      adjusted_amount: adjustedAmount.toString()
    }
  })
  
  return internationalOrder
}
```

---

## 📊 **Payment Method Performance Optimization**

### **Method Selection Optimization**
```javascript
// Intelligent Payment Method Recommendation
const recommendPaymentMethod = (customerProfile, transactionContext) => {
  const { 
    previousPayments, 
    customerTier, 
    deviceType, 
    timeOfDay, 
    transactionAmount 
  } = customerProfile
  
  const recommendations = []
  
  // PIX Recommendation Logic
  if (transactionAmount < 50000) { // Under R$ 500
    recommendations.push({
      method: "pix",
      score: 95,
      reasons: ["Instant access", "No fees", "Most popular"],
      priority: 1
    })
  }
  
  // Credit Card for Installments
  if (transactionAmount > 5000 && customerTier !== 'student') { // Over R$ 50
    recommendations.push({
      method: "credit_card",
      score: 85,
      reasons: ["Installment options", "Immediate access", "Familiar"],
      priority: 2
    })
  }
  
  // Boleto for Large Amounts
  if (transactionAmount > 50000) { // Over R$ 500
    recommendations.push({
      method: "boleto",
      score: 70,
      reasons: ["No transaction limits", "High privacy", "Bank security"],
      priority: 3
    })
  }
  
  return recommendations.sort((a, b) => b.score - a.score)
}

// Conversion Rate Tracking by Payment Method
const trackPaymentMethodPerformance = {
  metrics_to_track: [
    "conversion_rate", // Initiated vs completed payments
    "abandonment_rate", // Started but not completed
    "time_to_complete", // Average completion time
    "failure_rate", // Technical failures
    "chargeback_rate", // Disputes (credit cards only)
    "customer_satisfaction" // Post-payment surveys
  ],
  
  optimization_triggers: {
    low_conversion: "< 85% conversion rate",
    high_abandonment: "> 20% abandonment rate", 
    slow_completion: "> 5 minutes average time",
    high_failures: "> 5% failure rate"
  },
  
  improvement_actions: [
    "A/B test payment form layouts",
    "Optimize payment method order",
    "Improve error messages and guidance",
    "Add progress indicators",
    "Implement abandoned payment recovery"
  ]
}
```

---

## 🔧 **Payment Method Testing Strategy**

### **Comprehensive Testing Framework**
```javascript
// Payment Method Test Scenarios
const paymentTestingFramework = {
  // PIX Testing
  pix_scenarios: [
    "successful_payment_immediate_confirmation",
    "expired_qr_code_handling",
    "invalid_qr_code_generation", 
    "network_timeout_during_polling",
    "webhook_delayed_arrival",
    "duplicate_payment_prevention"
  ],
  
  // Credit Card Testing
  credit_card_scenarios: [
    "successful_1x_payment",
    "successful_12x_installment_payment",
    "insufficient_funds_rejection",
    "invalid_card_data_rejection",
    "3ds_authentication_required",
    "international_card_processing",
    "tokenization_security_test"
  ],
  
  // Boleto Testing  
  boleto_scenarios: [
    "successful_boleto_generation",
    "boleto_payment_confirmation",
    "expired_boleto_handling",
    "invalid_customer_data_rejection",
    "payment_after_due_date",
    "multiple_payment_attempts"
  ],
  
  // Integration Testing
  integration_scenarios: [
    "payment_method_switching",
    "failed_payment_retry_flow",
    "webhook_processing_all_methods",
    "split_payment_calculation",
    "customer_access_automation",
    "refund_processing_per_method"
  ]
}

// Test Data Sets
const paymentTestData = {
  // Test cards (Pagar.me test environment)
  test_cards: {
    visa_approved: "4111111111111111",
    mastercard_approved: "5555555555554444", 
    visa_declined: "4000000000000002",
    insufficient_funds: "4000000000009995",
    expired_card: "4000000000000069",
    invalid_cvc: "4000000000000127"
  },
  
  // Test PIX scenarios
  test_pix: {
    approved_amount: 1000, // R$ 10.00 - auto-approves
    pending_amount: 1001,  // R$ 10.01 - stays pending 
    failed_amount: 1002    // R$ 10.02 - auto-fails
  },
  
  // Test boleto scenarios
  test_boleto: {
    approved_cpf: "11111111111", // Auto-approves after 24h
    rejected_cpf: "22222222222", // Auto-rejects
    pending_cpf: "33333333333"   // Stays pending
  }
}
```

---

## 📋 **Payment Method Implementation Checklist**

### **Pre-Production Checklist**

| **Component** | **PIX** | **Credit Card** | **Boleto** | **International** |
|---------------|---------|-----------------|------------|-------------------|
| **API Integration** | ✅ | ✅ | ✅ | ✅ |
| **UI Components** | ✅ | ✅ | ✅ | ✅ |
| **Error Handling** | ✅ | ✅ | ✅ | ✅ |
| **Webhook Processing** | ✅ | ✅ | ✅ | ✅ |
| **Security Testing** | ✅ | ✅ | ✅ | ✅ |
| **Split Rule Integration** | ✅ | ✅ | ✅ | ✅ |
| **Customer Access Automation** | ✅ | ✅ | ✅ | ✅ |
| **Refund Processing** | N/A | ✅ | ✅ | ✅ |
| **Performance Testing** | ✅ | ✅ | ✅ | ✅ |
| **Documentation** | ✅ | ✅ | ✅ | ✅ |

---

## 🔗 **Essential Documentation References**

- **[Payment Methods Overview](https://docs.pagar.me/reference/meios-de-pagamento-1)**: All supported payment methods
- **[PIX Implementation](https://docs.pagar.me/docs/pix)**: Instant payment integration
- **[Credit Card Processing](https://docs.pagar.me/docs/cartão-de-crédito)**: Card payments and installments  
- **[Boleto Integration](https://docs.pagar.me/docs/boleto)**: Bank slip payment method
- **[Tokenization Security](https://docs.pagar.me/docs/tokenização)**: Secure card data handling
- **[3D Secure](https://docs.pagar.me/docs/3d-secure)**: Enhanced card security

---

*This payment method guide ensures EVIDENS can handle all Brazilian payment preferences while maintaining optimal user experience and security standards.*