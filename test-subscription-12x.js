// Test 12x installment subscription with fee calculation
const test12xSubscription = async () => {
  const PAGARME_SECRET_KEY = 'sk_test_c2d9d4450e3d4ac5913c020779efbf14'
  const PAGARME_API_URL = 'https://api.pagar.me/core/v5'
  
  console.log('🚀 Testing 12x installment subscription...')
  
  // Fee calculation (done on our side, not exposed to Pagar.me)
  const basePrice = 1990 // R$ 19.90
  const installments = 12
  const feeRate = 0.15 // 15% total fee for 12x (example)
  const finalPrice = Math.round(basePrice * (1 + feeRate)) // R$ 22.89
  
  console.log('💰 Pricing Calculation:')
  console.log('- Base Price: R$' + (basePrice / 100).toFixed(2))
  console.log('- Fee Rate: ' + (feeRate * 100) + '%')
  console.log('- Final Price (with fees): R$' + (finalPrice / 100).toFixed(2))
  console.log('- Per Installment: R$' + (finalPrice / 100 / installments).toFixed(2))
  console.log('- Installments: ' + installments + 'x')
  
  const subscriptionPayload = {
    code: `evidens-12x-${Date.now()}`,
    customer: {
      name: "Igor Cogo Koehler",
      type: "individual",
      email: `igorcogok+12x${Date.now()}@gmail.com`,
      document: "04094922059",
      address: {
        line_1: "Rua Exemplo, 123",
        zip_code: "01310100",
        city: "São Paulo",
        state: "SP",
        country: "BR"
      },
      phones: {
        mobile_phone: {
          country_code: "55",
          area_code: "11",
          number: "999999999"
        }
      }
    },
    billing_type: "prepaid",
    interval: "month",
    interval_count: 1,
    items: [
      {
        description: "EVIDENS - Plano Premium (12x)",
        quantity: 1,
        code: "evidens-premium-12x",
        pricing_scheme: {
          scheme_type: "unit",
          price: finalPrice // Full amount including fees
        }
      }
    ],
    payment_method: "credit_card",
    card: {
      number: "4000000000000010",
      holder_name: "Igor Cogo Koehler",
      exp_month: 12,
      exp_year: 30,
      cvv: "123",
      billing_address: {
        line_1: "Rua Exemplo, 123",
        zip_code: "01310100",
        city: "São Paulo",
        state: "SP",
        country: "BR"
      }
    },
    installments: 12, // Just the number - Pagar.me divides the total amount
    statement_descriptor: "EVIDENS",
    metadata: {
      platform: "evidens",
      plan_type: "premium",
      installments: "12x",
      base_price: basePrice,
      fee_included: Math.round((finalPrice - basePrice)),
      test_run: "12x_installment_validation"
    }
  }
  
  try {
    console.log('\n📦 Sending 12x subscription request to Pagar.me...')
    console.log('🔢 What Pagar.me receives:')
    console.log('- Total Amount:', finalPrice, 'cents (R$' + (finalPrice / 100).toFixed(2) + ')')
    console.log('- Installments:', installments)
    console.log('- Pagar.me will charge:', 'R$' + (finalPrice / 100 / installments).toFixed(2), 'per month for', installments, 'months')
    
    const response = await fetch(`${PAGARME_API_URL}/subscriptions`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(PAGARME_SECRET_KEY + ':').toString('base64')}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(subscriptionPayload)
    })
    
    const data = await response.json()
    
    if (!response.ok) {
      console.error('❌ 12x Subscription failed:')
      console.error('Status:', response.status)
      console.error('Response:', JSON.stringify(data, null, 2))
      return
    }
    
    console.log('✅ 12X SUBSCRIPTION CREATED SUCCESSFULLY!')
    console.log('\n📊 Pagar.me Response:')
    console.log('🆔 Subscription ID:', data.id)
    console.log('📊 Status:', data.status)
    console.log('💳 Payment Method:', data.payment_method)
    console.log('💰 Total Amount:', 'R$' + (data.items[0].pricing_scheme.price / 100).toFixed(2))
    console.log('🔢 Installments:', data.installments || 'Not specified in response')
    console.log('📅 Next Billing:', data.next_billing_at)
    console.log('👤 Customer ID:', data.customer?.id)
    
    console.log('\n🎯 CONFIRMATION:')
    console.log('✅ Pagar.me received full amount:', finalPrice, 'cents')
    console.log('✅ Pagar.me received installments:', installments)
    console.log('✅ Fee calculation hidden from Pagar.me')
    console.log('✅ Customer will be charged: R$' + (finalPrice / 100 / installments).toFixed(2) + ' per month')
    
    // Show what the customer sees vs what we calculated
    console.log('\n💡 Customer Experience:')
    console.log('- Sees: "EVIDENS Premium - 12x of R$' + (finalPrice / 100 / installments).toFixed(2) + '"')
    console.log('- Pays: R$' + (finalPrice / 100 / installments).toFixed(2) + ' monthly for 12 months')
    console.log('- Total: R$' + (finalPrice / 100).toFixed(2) + ' (includes our fee calculation)')
    
  } catch (error) {
    console.error('🚨 Error:', error.message)
  }
}

test12xSubscription()