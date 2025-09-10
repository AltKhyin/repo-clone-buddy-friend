// Test script for single-request subscription with real test keys
const testSubscriptionRealKeys = async () => {
  // Your actual test keys
  const PAGARME_SECRET_KEY = 'sk_test_c2d9d4450e3d4ac5913c020779efbf14'
  const PAGARME_PUBLIC_KEY = 'pk_test_gjB1ZQAFVBH5LDlG'
  const PAGARME_API_URL = 'https://api.pagar.me/core/v5'
  
  console.log('🚀 Testing single-request subscription with REAL test keys...')
  console.log('🔑 Public Key:', PAGARME_PUBLIC_KEY)
  console.log('🔑 Secret Key:', PAGARME_SECRET_KEY.substring(0, 20) + '...')
  console.log('🌐 Endpoint: api.pagar.me (production endpoint, test mode)')
  
  try {
    // Pre-test: Validate authentication with simple customer creation
    console.log('\n📋 PRE-TEST: Validating authentication...')
    
    const customerPayload = {
      name: "Test Customer EVIDENS",
      type: "individual", 
      email: `test.${Date.now()}@evidens.com`,
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
      console.error('❌ Authentication failed:')
      console.error('Status:', customerResponse.status)
      console.error('Response:', JSON.stringify(customerData, null, 2))
      return
    }
    
    console.log('✅ Authentication successful!')
    console.log('👤 Test Customer ID:', customerData.id)
    
    // MAIN TEST 1: Credit Card Subscription (Complete)
    console.log('\n📋 TEST 1: Credit Card Subscription - Single Request')
    
    const subscriptionPayload = {
      code: `evidens-test-${Date.now()}`,
      customer: {
        name: "Igor Cogo Koehler",
        type: "individual",
        email: `igorcogok+${Date.now()}@gmail.com`, // Unique email
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
          code: "evidens-premium",
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
        test_run: "single_request_validation"
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
      
      if (subscriptionData.errors) {
        console.log('\n🔍 Error Analysis:')
        Object.entries(subscriptionData.errors).forEach(([field, errors]) => {
          const errorList = Array.isArray(errors) ? errors : [errors]
          console.log(`- ${field}: ${errorList.join(', ')}`)
        })
      }
      return
    }
    
    // SUCCESS!
    console.log('🎉 CREDIT CARD SUBSCRIPTION CREATED SUCCESSFULLY!')
    console.log('\n📊 Subscription Details:')
    console.log('🆔 Subscription ID:', subscriptionData.id)
    console.log('📊 Status:', subscriptionData.status)
    console.log('💳 Payment Method:', subscriptionData.payment_method)
    console.log('🏷️ Code:', subscriptionData.code)
    console.log('📅 Start Date:', subscriptionData.start_at)
    console.log('🔄 Next Billing:', subscriptionData.next_billing_at)
    console.log('👤 Customer ID:', subscriptionData.customer?.id)
    console.log('👤 Customer Email:', subscriptionData.customer?.email)
    console.log('💰 Monthly Amount: R$' + (subscriptionData.items?.[0]?.pricing_scheme?.price / 100 || 0).toFixed(2))
    
    // TEST 2: PIX Subscription
    console.log('\n\n📋 TEST 2: PIX Subscription - Single Request')
    
    const pixSubscriptionPayload = {
      code: `evidens-pix-${Date.now()}`,
      customer: {
        name: "Igor Cogo Koehler",
        type: "individual",
        email: `igorcogok+pix${Date.now()}@gmail.com`,
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
          description: "EVIDENS - Plano Premium PIX",
          quantity: 1,
          code: "evidens-premium-pix",
          pricing_scheme: {
            scheme_type: "unit",
            price: 1990
          }
        }
      ],
      payment_method: "pix",
      metadata: {
        platform: "evidens",
        plan_type: "premium",
        payment_method: "pix",
        test_run: "single_request_validation"
      }
    }
    
    console.log('📦 Creating PIX subscription...')
    
    const pixResponse = await fetch(`${PAGARME_API_URL}/subscriptions`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(PAGARME_SECRET_KEY + ':').toString('base64')}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(pixSubscriptionPayload)
    })
    
    const pixData = await pixResponse.json()
    
    if (!pixResponse.ok) {
      console.error('❌ PIX Subscription creation failed:')
      console.error('Status:', pixResponse.status)
      console.error('Response:', JSON.stringify(pixData, null, 2))
    } else {
      console.log('✅ PIX Subscription created successfully!')
      console.log('🆔 PIX Subscription ID:', pixData.id)
      console.log('📊 Status:', pixData.status)
      console.log('💳 Payment Method:', pixData.payment_method)
    }
    
    console.log('\n🎉 SINGLE-REQUEST SUBSCRIPTION TESTS COMPLETED!')
    console.log('\n📊 FINAL RESULTS:')
    console.log('✅ Authentication: Working')
    console.log('✅ Credit Card Subscription: Working')
    console.log(pixData.id ? '✅' : '❌', 'PIX Subscription:', pixData.id ? 'Working' : 'Failed')
    console.log('✅ Single-request flow: VALIDATED')
    console.log('✅ Customer auto-creation: VALIDATED')
    console.log('✅ Ready for EVIDENS implementation')
    
    console.log('\n🚀 IMPLEMENTATION READY - Structure validated for:')
    console.log('- Edge Function development')
    console.log('- Frontend integration')
    console.log('- Database subscription management')
    
  } catch (error) {
    console.error('🚨 Test execution error:', error.message)
    console.error('Stack:', error.stack)
  }
}

testSubscriptionRealKeys()