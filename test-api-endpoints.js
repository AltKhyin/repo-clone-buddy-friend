// Test script to explore available Pagar.me API endpoints
const testApiEndpoints = async () => {
  const PAGARME_SECRET_KEY = process.env.PAGARME_SECRET_KEY || 'sk_test_635827fe8bc44b8e9983e3a4ad3b07f9'
  const TEST_API_URL = 'https://sdx-api.pagar.me/core/v5'
  const PROD_API_URL = 'https://api.pagar.me/core/v5'
  
  console.log('🔍 Testing Pagar.me API endpoints availability...')
  
  const authHeader = `Basic ${Buffer.from(PAGARME_SECRET_KEY + ':').toString('base64')}`
  
  const endpoints = [
    { name: 'Orders (Test)', url: `${TEST_API_URL}/orders` },
    { name: 'Customers (Test)', url: `${TEST_API_URL}/customers` },
    { name: 'Subscriptions (Test)', url: `${TEST_API_URL}/subscriptions` },
    { name: 'Orders (Prod)', url: `${PROD_API_URL}/orders` },
    { name: 'Customers (Prod)', url: `${PROD_API_URL}/customers` },
    { name: 'Subscriptions (Prod)', url: `${PROD_API_URL}/subscriptions` }
  ]
  
  for (const endpoint of endpoints) {
    try {
      console.log(`\n🔍 Testing: ${endpoint.name}`)
      console.log(`URL: ${endpoint.url}`)
      
      const response = await fetch(endpoint.url, {
        method: 'GET',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      })
      
      const statusText = response.statusText
      
      if (response.status === 200) {
        console.log('✅ Available - Status: 200 OK')
      } else if (response.status === 401) {
        console.log('🔐 Available but needs auth - Status: 401 Unauthorized')
      } else if (response.status === 404) {
        console.log('❌ Not available - Status: 404 Not Found')
      } else if (response.status === 405) {
        console.log('⚠️ Available but method not allowed - Status: 405 Method Not Allowed')
      } else {
        console.log(`⚠️ Status: ${response.status} ${statusText}`)
      }
      
      // Try to get some response data for context
      try {
        const data = await response.text()
        if (data && data.length < 200) {
          console.log(`Response: ${data.substring(0, 100)}...`)
        }
      } catch (e) {
        // Ignore response parsing errors
      }
      
    } catch (error) {
      console.log(`❌ Connection error: ${error.message}`)
    }
  }
  
  // Test a simple order creation to see if the API is working at all
  console.log('\n🚀 Testing simple order creation to validate API connection...')
  
  const simpleOrderPayload = {
    customer: {
      name: "Igor Test",
      type: "individual",
      email: "test@evidens.com",
      document: "04094922059",
      address: {
        line_1: "Test Address",
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
        description: "Test Item",
        quantity: 1,
        amount: 1000
      }
    ],
    payments: [
      {
        payment_method: "pix",
        pix: {
          expires_in: 3600
        }
      }
    ]
  }
  
  try {
    const orderResponse = await fetch(`${TEST_API_URL}/orders`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(simpleOrderPayload)
    })
    
    const orderData = await orderResponse.json()
    
    if (orderResponse.ok) {
      console.log('✅ Order creation works! API is functional')
      console.log(`Order ID: ${orderData.id}`)
    } else {
      console.log('❌ Order creation failed:')
      console.log(`Status: ${orderResponse.status}`)
      console.log('Response:', JSON.stringify(orderData, null, 2))
    }
    
  } catch (error) {
    console.log(`❌ Order test error: ${error.message}`)
  }
}

testApiEndpoints()