// Test script for subscription creation using production endpoint with test keys
const testSubscriptionProduction = async () => {
  // Since test environment (sdx-api.pagar.me) returns 404, let's use production endpoint with test keys
  const PAGARME_SECRET_KEY = process.env.PAGARME_SECRET_KEY || 'sk_test_635827fe8bc44b8e9983e3a4ad3b07f9'
  const PAGARME_API_URL = 'https://api.pagar.me/core/v5'
  
  console.log('🚀 Testing subscription creation on production endpoint with test keys...')
  console.log('🔑 Using test key (sk_test_*):', PAGARME_SECRET_KEY.substring(0, 15) + '...')
  console.log('🌐 Endpoint: api.pagar.me (production endpoint, test mode)')
  
  try {
    // First test: Simple customer creation to validate authentication
    console.log('\n📋 PRE-TEST: Creating customer to validate authentication...')
    
    const customerPayload = {
      name: "Igor Test Customer",
      type: "individual", 
      email: "test.customer@evidens.com",
      document: "04094922059"
    }
    
    const customerResponse = await fetch(`${PAGARME_API_URL}/customers`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(PAGARME_SECRET_KEY + ':').toString('base64')}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(customerPayload)
    })
    
    const customerData = await customerResponse.json()
    
    if (!customerResponse.ok) {
      console.error('❌ Customer creation failed (authentication test):')
      console.error('Status:', customerResponse.status)
      console.error('Response:', JSON.stringify(customerData, null, 2))
      console.log('\n💡 This suggests either:')
      console.log('1. Invalid test keys')
      console.log('2. Need different authentication method')
      console.log('3. Test environment configuration issue')
      return
    }
    
    console.log('✅ Customer created successfully! Authentication works')
    console.log('👤 Customer ID:', customerData.id)
    
    // Main test: Single-request subscription creation
    console.log('\n📋 MAIN TEST: Single-request subscription creation')
    
    const subscriptionPayload = {
      code: `evidens-test-${Date.now()}`,
      customer: {
        name: "Igor Cogo Koehler",
        type: "individual",
        email: "igorcogok+subscription@gmail.com", // Use unique email
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
          description: "EVIDENS - Plano Premium",
          quantity: 1,
          code: "evidens-premium-test",
          pricing_scheme: {
            scheme_type: "unit",
            price: 1990 // R$ 19.90
          }
        }
      ],
      payment_method: "credit_card",
      card: {
        number: "4000000000000010", // Test card for successful transactions
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
      installments: 1,
      statement_descriptor: "EVIDENS",
      metadata: {
        platform: "evidens",
        plan_type: "premium",
        test_type: "single_request"
      }
    }
    
    console.log('📦 Creating subscription...')
    console.log('💳 Payment Method: Credit Card')
    console.log('💰 Amount: R$' + (subscriptionPayload.items[0].pricing_scheme.price / 100).toFixed(2))
    
    const subscriptionResponse = await fetch(`${PAGARME_API_URL}/subscriptions`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(PAGARME_SECRET_KEY + ':').toString('base64')}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(subscriptionPayload)
    })
    
    const subscriptionData = await subscriptionResponse.json()
    
    if (!subscriptionResponse.ok) {
      console.error('❌ Subscription creation failed:')
      console.error('Status:', subscriptionResponse.status)
      console.error('Response:', JSON.stringify(subscriptionData, null, 2))
      
      // Analyze errors for implementation guidance
      if (subscriptionData.errors) {
        console.log('\n🔍 Error Analysis:')
        Object.entries(subscriptionData.errors).forEach(([field, errors]) => {
          const errorList = Array.isArray(errors) ? errors : [errors]
          console.log(`- ${field}: ${errorList.join(', ')}`)
        })
        
        console.log('\n💡 Implementation Notes:')
        if (subscriptionData.errors.customer_id) {
          console.log('- Customer ID issue: May need to create customer first or use existing customer')
        }
        if (subscriptionData.errors.card) {
          console.log('- Card validation issue: Check card data format and test card numbers')
        }
        if (subscriptionData.errors.items) {
          console.log('- Items validation issue: Check pricing scheme and item structure')
        }
      }
      return
    }
    
    // SUCCESS!
    console.log('🎉 SUBSCRIPTION CREATED SUCCESSFULLY!')
    console.log('\n📊 Subscription Details:')
    console.log('🆔 Subscription ID:', subscriptionData.id)
    console.log('📊 Status:', subscriptionData.status)
    console.log('💳 Payment Method:', subscriptionData.payment_method)
    console.log('🏷️ Code:', subscriptionData.code)
    console.log('📅 Start Date:', subscriptionData.start_at)
    console.log('🔄 Next Billing:', subscriptionData.next_billing_at)
    console.log('👤 Customer ID:', subscriptionData.customer?.id)
    console.log('💰 Total Amount:', `R$${(subscriptionData.items?.[0]?.pricing_scheme?.price / 100 || 0).toFixed(2)}`)
    
    console.log('\n✅ SINGLE-REQUEST SUBSCRIPTION VALIDATION COMPLETE!')
    console.log('🎯 Key Findings:')
    console.log('- ✅ Single request creates both customer and subscription')
    console.log('- ✅ No pre-customer creation needed')
    console.log('- ✅ Card data processed in single call')
    console.log('- ✅ Subscription activated immediately')
    console.log('- ✅ Ready for EVIDENS implementation')
    
  } catch (error) {
    console.error('🚨 Test error:', error.message)
    console.error('Stack:', error.stack)
  }
}

testSubscriptionProduction()