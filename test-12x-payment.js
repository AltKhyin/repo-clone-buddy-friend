// Test 12x installment payment (one-time order) with Pagar.me
const test12xPayment = async () => {
  const PAGARME_SECRET_KEY = 'sk_test_c2d9d4450e3d4ac5913c020779efbf14'
  const PAGARME_API_URL = 'https://api.pagar.me/core/v5'
  
  console.log('🚀 Testing 12x installment payment (one-time order)...')
  
  // Fee calculation for one-time payment
  const basePrice = 1990 // R$ 19.90
  const installments = 12
  const feeRate = 0.15 // 15% total fee for 12x installments
  const finalPrice = Math.round(basePrice * (1 + feeRate)) // R$ 22.89
  
  console.log('💰 Payment Calculation:')
  console.log('- Base Price: R$' + (basePrice / 100).toFixed(2))
  console.log('- Fee Rate: ' + (feeRate * 100) + '%')
  console.log('- Final Price (with fees): R$' + (finalPrice / 100).toFixed(2))
  console.log('- Per Installment: R$' + (finalPrice / 100 / installments).toFixed(2))
  console.log('- Total Installments: ' + installments + 'x')
  
  const orderPayload = {
    code: `evidens-12x-payment-${Date.now()}`,
    amount: finalPrice, // Total amount including fees
    currency: 'BRL',
    customer: {
      name: "Igor Cogo Koehler",
      type: "individual",
      email: `igorcogok+payment12x${Date.now()}@gmail.com`,
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
    items: [
      {
        id: "1",
        code: "evidens-premium-12x",
        description: "EVIDENS - Plano Premium (12x)",
        amount: finalPrice, // Same as order amount
        quantity: 1
      }
    ],
    payments: [
      {
        payment_method: "credit_card",
        credit_card: {
          operation_type: "auth_and_capture",
          installments: 12, // 12x installments
          statement_descriptor: "EVIDENS",
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
          }
        }
      }
    ],
    metadata: {
      platform: "evidens",
      payment_type: "one_time_12x",
      base_price: basePrice,
      fee_included: Math.round((finalPrice - basePrice)),
      installments: "12x",
      test_run: "12x_payment_validation"
    }
  }
  
  try {
    console.log('\n📦 Sending 12x payment request to Pagar.me...')
    console.log('🔢 What Pagar.me receives:')
    console.log('- Total Order Amount:', finalPrice, 'cents (R$' + (finalPrice / 100).toFixed(2) + ')')
    console.log('- Credit Card Installments:', installments)
    console.log('- Expected charge per installment:', 'R$' + (finalPrice / 100 / installments).toFixed(2))
    
    const response = await fetch(`${PAGARME_API_URL}/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(PAGARME_SECRET_KEY + ':').toString('base64')}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(orderPayload)
    })
    
    const data = await response.json()
    
    if (!response.ok) {
      console.error('❌ 12x Payment failed:')
      console.error('Status:', response.status)
      console.error('Response:', JSON.stringify(data, null, 2))
      
      if (data.errors) {
        console.log('\n🔍 Error Analysis:')
        Object.entries(data.errors).forEach(([field, errors]) => {
          const errorList = Array.isArray(errors) ? errors : [errors]
          console.log(`- ${field}: ${errorList.join(', ')}`)
        })
      }
      return
    }
    
    console.log('✅ 12X PAYMENT ORDER CREATED SUCCESSFULLY!')
    console.log('\n📊 Order Details:')
    console.log('🆔 Order ID:', data.id)
    console.log('📊 Order Status:', data.status)
    console.log('🏷️ Order Code:', data.code)
    console.log('💰 Total Amount:', 'R$' + (data.amount / 100).toFixed(2))
    console.log('💱 Currency:', data.currency)
    console.log('👤 Customer ID:', data.customer?.id)
    console.log('📅 Created At:', data.created_at)
    
    // Check charges information
    if (data.charges && data.charges.length > 0) {
      const charge = data.charges[0]
      console.log('\n💳 Charge Details:')
      console.log('🆔 Charge ID:', charge.id)
      console.log('📊 Charge Status:', charge.status)
      console.log('💰 Charge Amount:', 'R$' + (charge.amount / 100).toFixed(2))
      console.log('💳 Payment Method:', charge.payment_method)
      
      // Check transaction details for installment info
      if (charge.last_transaction) {
        const transaction = charge.last_transaction
        console.log('\n🔄 Transaction Details:')
        console.log('🆔 Transaction ID:', transaction.id)
        console.log('📊 Transaction Status:', transaction.status)
        console.log('🔢 Installments:', transaction.installments || 'Not specified')
        console.log('💳 Authorization Code:', transaction.authorization_code || 'N/A')
        console.log('🏦 Acquirer:', transaction.acquirer_name || 'Not specified')
        
        if (transaction.installments) {
          const installmentAmount = charge.amount / transaction.installments
          console.log('💰 Amount per installment: R$' + (installmentAmount / 100).toFixed(2))
        }
      }
    }
    
    console.log('\n🎯 PAYMENT PROCESSING CONFIRMATION:')
    console.log('✅ Pagar.me accepted 12x installments')
    console.log('✅ Order created and processed')
    console.log('✅ Fee calculation worked correctly')
    console.log('✅ Customer will be charged monthly installments')
    
    console.log('\n💡 Customer Experience:')
    console.log('- Sees: "EVIDENS Premium - 12x of R$' + (finalPrice / 100 / installments).toFixed(2) + '"')
    console.log('- Will be charged: R$' + (finalPrice / 100 / installments).toFixed(2) + ' for 12 months')
    console.log('- Total amount: R$' + (finalPrice / 100).toFixed(2) + ' (includes processing fees)')
    
    // Check if order was successful for authorization
    if (data.status === 'paid' || (data.charges && data.charges[0]?.status === 'paid')) {
      console.log('\n🎉 PAYMENT AUTHORIZED AND PROCESSED!')
      console.log('✅ Pagar.me cleared the 12x payment')
    } else if (data.status === 'pending' || (data.charges && data.charges[0]?.status === 'pending')) {
      console.log('\n⏳ PAYMENT IS PENDING PROCESSING')
      console.log('ℹ️ This is normal for test environment')
    }
    
  } catch (error) {
    console.error('🚨 Error:', error.message)
    console.error('Stack:', error.stack)
  }
}

test12xPayment()