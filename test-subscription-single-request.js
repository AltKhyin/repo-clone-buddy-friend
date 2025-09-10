// Test script to validate single-request subscription creation with Pagar.me
const testSubscriptionSingleRequest = async () => {
  // Use test environment endpoint and credentials
  const PAGARME_SECRET_KEY = process.env.PAGARME_SECRET_KEY || 'sk_test_635827fe8bc44b8e9983e3a4ad3b07f9'
  const PAGARME_API_URL = 'https://sdx-api.pagar.me/core/v5'
  
  console.log('🚀 Testing single-request subscription creation...')
  console.log('🌐 Environment: Testing (sdx-api.pagar.me)')
  
  try {
    // Test 1: Credit Card Subscription (Minimum Required Fields)
    console.log('\n📋 TEST 1: Credit Card Subscription (Minimum Fields)')
    
    const subscriptionPayload = {
      customer: {
        name: "Igor Cogo Koehler",
        type: "individual",
        email: "igorcogok@gmail.com",
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
        number: "4000000000000010", // Test card number
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
      statement_descriptor: "EVIDENS"
    }
    
    console.log('📦 Sending subscription request...')
    console.log('💳 Payment Method: Credit Card')
    console.log('💰 Amount: R$' + (subscriptionPayload.items[0].pricing_scheme.price / 100).toFixed(2))
    
    const response = await fetch(`${PAGARME_API_URL}/subscriptions`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(PAGARME_SECRET_KEY + ':').toString('base64')}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(subscriptionPayload)
    })
    
    const responseData = await response.json()
    
    if (!response.ok) {
      console.error('❌ Subscription creation failed:')
      console.error('Status:', response.status)
      console.error('Response:', JSON.stringify(responseData, null, 2))
      
      // Analyze common errors
      if (responseData.errors) {
        console.log('\n🔍 Error Analysis:')
        Object.entries(responseData.errors).forEach(([field, errors]) => {
          console.log(`- ${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`)
        })
      }
      return
    }
    
    console.log('✅ Subscription created successfully!')
    console.log('🆔 Subscription ID:', responseData.id)
    console.log('📊 Status:', responseData.status)
    console.log('💳 Payment Method:', responseData.payment_method)
    console.log('🏷️ Code:', responseData.code)
    console.log('📅 Start Date:', responseData.start_at)
    console.log('🔄 Billing Interval:', `${responseData.interval_count} ${responseData.interval}`)
    console.log('👤 Customer ID:', responseData.customer?.id)
    
    // Show pricing information
    if (responseData.items && responseData.items.length > 0) {
      console.log('\n💰 Subscription Details:')
      responseData.items.forEach((item, index) => {
        console.log(`- Item ${index + 1}: ${item.description}`)
        console.log(`  Price: R$${(item.pricing_scheme?.price / 100).toFixed(2)}`)
        console.log(`  Quantity: ${item.quantity}`)
      })
    }
    
    // Show next billing information
    if (responseData.next_billing_at) {
      console.log('📅 Next Billing:', responseData.next_billing_at)
    }
    
    // Test 2: PIX Subscription
    console.log('\n\n📋 TEST 2: PIX Subscription')
    
    const pixSubscriptionPayload = {
      code: `evidens-pix-${Date.now()}`,
      customer: {
        name: "Igor Cogo Koehler",
        type: "individual",
        email: "igorcogok+pix@gmail.com", // Different email for PIX test
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
          description: "EVIDENS - Plano Premium (PIX)",
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
        test_type: "pix_subscription"
      }
    }
    
    console.log('📦 Sending PIX subscription request...')
    
    const pixResponse = await fetch(`${PAGARME_API_URL}/subscriptions`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(PAGARME_SECRET_KEY + ':').toString('base64')}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(pixSubscriptionPayload)
    })
    
    const pixResponseData = await pixResponse.json()
    
    if (!pixResponse.ok) {
      console.error('❌ PIX Subscription creation failed:')
      console.error('Status:', pixResponse.status)
      console.error('Response:', JSON.stringify(pixResponseData, null, 2))
      return
    }
    
    console.log('✅ PIX Subscription created successfully!')
    console.log('🆔 Subscription ID:', pixResponseData.id)
    console.log('📊 Status:', pixResponseData.status)
    console.log('💳 Payment Method:', pixResponseData.payment_method)
    
    console.log('\n🎉 ALL TESTS COMPLETED SUCCESSFULLY!')
    console.log('📊 Summary:')
    console.log('- Credit Card Subscription: ✅ Created')
    console.log('- PIX Subscription: ✅ Created')
    console.log('- Single-request flow: ✅ Validated')
    console.log('- Customer creation: ✅ Automatic (no pre-creation needed)')
    
  } catch (error) {
    console.error('🚨 Test error:', error.message)
    console.error('Stack:', error.stack)
  }
}

// Run the test
testSubscriptionSingleRequest()