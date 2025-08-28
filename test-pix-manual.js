// Manual test to verify PIX payment logic with improved customer format
const testManualPix = async () => {
  const PAGARME_SECRET_KEY = 'sk_test_635827fe8bc44b8e9983e3a4ad3b07f9'
  const PAGARME_API_URL = 'https://api.pagar.me/core/v5'
  
  // Test customer data (same as from user's error logs)
  const customerData = {
    name: "igor cogo koehler",
    email: "igorcogok@gmail.com", 
    document: "04094922059"
  }
  
  console.log('🧪 Testing manual PIX payment flow...')
  console.log('📋 Customer data:', customerData)
  
  try {
    // Step 1: Create customer (this should work now based on curl test)
    const cleanDocument = customerData.document?.replace(/\D/g, '') || ''
    const documentType = cleanDocument.length === 14 ? 'company' : 'individual'
    
    const customerPayload = {
      name: customerData.name,
      email: customerData.email,
      document: cleanDocument,
      type: documentType,
      phones: {
        mobile_phone: {
          country_code: '55',
          area_code: '11', 
          number: '999999999'
        }
      },
      address: {
        country: 'BR',
        state: 'SP',
        city: 'São Paulo',
        neighborhood: 'Centro',
        street: 'Rua Exemplo',
        street_number: '123',
        zip_code: '01310100'  // Fixed: was zipcode, now zip_code
      }
    }
    
    console.log('📦 Creating customer with payload:', JSON.stringify(customerPayload, null, 2))
    
    const customerResponse = await fetch(`${PAGARME_API_URL}/customers`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(PAGARME_SECRET_KEY + ':').toString('base64')}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(customerPayload)
    })
    
    if (!customerResponse.ok) {
      const errorData = await customerResponse.json()
      console.error('❌ Customer creation failed:', errorData)
      return
    }
    
    const customer = await customerResponse.json()
    console.log('✅ Customer created successfully!')
    console.log('👤 Customer ID:', customer.id)
    
    // Step 2: Create PIX payment order
    const orderPayload = {
      customer_id: customer.id,
      items: [
        {
          description: 'EVIDENS - Plano Mensal',
          quantity: 1,
          amount: 1990  // R$ 19.90
        }
      ],
      payments: [
        {
          payment_method: 'pix',
          pix: {
            expires_in: 3600,
            additional_info: [
              {
                name: 'Produto',
                value: 'EVIDENS - Plano Mensal'
              },
              {
                name: 'Plataforma', 
                value: 'EVIDENS'
              }
            ]
          }
        }
      ],
      metadata: {
        platform: 'evidens',
        customerName: customerData.name,
        customerEmail: customerData.email,
        planName: 'Plano Mensal'
      }
    }
    
    console.log('📦 Creating PIX order...')
    
    const orderResponse = await fetch(`${PAGARME_API_URL}/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(PAGARME_SECRET_KEY + ':').toString('base64')}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(orderPayload)
    })
    
    const order = await orderResponse.json()
    
    if (!orderResponse.ok) {
      console.error('❌ Order creation failed:', order)
      return
    }
    
    console.log('✅ Order created successfully!')
    console.log('🏷️ Order ID:', order.id)
    console.log('📊 Order Status:', order.status)
    
    // Extract PIX information like the Edge Function does
    const charge = order.charges?.[0]
    const transaction = charge?.last_transaction
    
    const pixData = {
      order_id: order.id,
      charge_id: charge?.id,
      status: charge?.status,
      amount: order.amount,
      qr_code: transaction?.qr_code,
      qr_code_url: transaction?.qr_code_url,
      qr_code_text: transaction?.qr_code_text,
      expires_at: transaction?.expires_at,
      created_at: order.created_at
    }
    
    console.log('\n📋 PIX PAYMENT RESULTS:')
    console.log('💰 Amount: R$' + (pixData.amount / 100).toFixed(2))
    console.log('📱 QR Code:', pixData.qr_code ? 'Generated' : 'Not available')
    console.log('🔗 QR Code URL:', pixData.qr_code_url || 'Not available') 
    console.log('⏰ Expires At:', pixData.expires_at)
    console.log('📊 Status:', pixData.status)
    
    if (charge?.last_transaction?.gateway_response?.errors) {
      console.log('\n⚠️ Gateway Errors:')
      charge.last_transaction.gateway_response.errors.forEach(error => {
        console.log('- ' + error.message)
      })
    }
    
    console.log('\n✅ MANUAL TEST COMPLETED - Customer and Order creation logic verified!')
    
  } catch (error) {
    console.error('🚨 Manual test error:', error.message)
  }
}

testManualPix()