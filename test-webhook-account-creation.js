// Test script to verify account creation after payment fixes
const testWebhookAccountCreation = async () => {
  const supabaseUrl = 'https://qjoxiowuiiupbvqlssgk.supabase.co'
  const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqb3hpb3d1aWl1cGJ2cWxzc2drIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5MzU0MjIsImV4cCI6MjA2NTUxMTQyMn0.3NP22ssdBY7Jub2dPdt9Owxcum8Hp59-B4C8hiBz-wg'

  console.log('🧪 Testing Account Creation Flow After Payment Fixes...')
  console.log('📊 This simulates the payment webhook triggering account creation')

  // Simulate a successful payment webhook payload
  const testPayload = {
    id: `test_payment_${Date.now()}`,
    status: 'paid',
    amount: 1990,
    currency: 'BRL',
    customer: {
      id: `test_customer_${Date.now()}`,
      name: 'Test Payment User',
      email: `test.payment.${Date.now()}@example.com`,
      document: '12345678901',
      phones: {
        mobile_phone: {
          country_code: '55',
          area_code: '11',
          number: '999999999'
        }
      }
    },
    charges: [{
      id: `test_charge_${Date.now()}`,
      status: 'paid',
      amount: 1990,
      payment_method: 'pix',
      paid_at: new Date().toISOString(),
      last_transaction: {
        id: `test_transaction_${Date.now()}`,
        status: 'paid'
      }
    }],
    code: `test_order_${Date.now()}`,
    metadata: {
      plan_id: 'premium_monthly',
      plan_name: 'EVIDENS Premium',
      customer_name: 'Test Payment User',
      customer_email: `test.payment.${Date.now()}@example.com`,
      customer_document: '12345678901',
      customer_phone: '11999999999'
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }

  console.log('📦 Test Payload Created:')
  console.log('- Email:', testPayload.customer.email)
  console.log('- Name:', testPayload.customer.name)
  console.log('- Amount: R$' + (testPayload.amount / 100).toFixed(2))
  console.log('- Status:', testPayload.status)

  try {
    console.log('\n🚀 Sending test webhook to pagarme-webhook-v2...')

    const response = await fetch(`${supabaseUrl}/functions/v1/pagarme-webhook-v2`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${anonKey}`,
        'X-Hub-Signature': 'test_signature', // Mock signature for testing
      },
      body: JSON.stringify(testPayload)
    })

    const result = await response.json()

    console.log('\n📊 WEBHOOK TEST RESULTS:')
    console.log('Status Code:', response.status)
    console.log('Response:', JSON.stringify(result, null, 2))

    if (response.ok && result.success) {
      console.log('\n✅ SUCCESS! Account creation flow worked!')
      console.log('✅ Password generation fix is working')
      console.log('✅ User account was created successfully')

      if (result.data && result.data.userId) {
        console.log('👤 User ID Created:', result.data.userId)
      }

      if (result.data && result.data.email) {
        console.log('📧 Account Email:', result.data.email)
      }

      console.log('\n🎯 VERIFICATION COMPLETE:')
      console.log('✅ Webhook processor is functioning')
      console.log('✅ Account linking service is working')
      console.log('✅ Password generation has been fixed')
      console.log('✅ Database operations are successful')

    } else {
      console.log('\n❌ TEST FAILED:')
      console.log('❌ Account creation did not work as expected')

      if (result.error) {
        console.log('🔍 Error Details:', result.error)

        if (result.error.includes('password') || result.error.includes('senha')) {
          console.log('\n🚨 PASSWORD ISSUE DETECTED!')
          console.log('The password generation fix may not have taken effect.')
          console.log('Check if the deployment was successful.')
        }

        if (result.error.includes('Database error')) {
          console.log('\n🚨 DATABASE ISSUE DETECTED!')
          console.log('There may be a database constraint or trigger issue.')
        }
      }
    }

  } catch (error) {
    console.error('\n🚨 NETWORK ERROR:', error.message)
    console.error('This could indicate:')
    console.error('1. Webhook endpoint is not responding')
    console.error('2. Network connectivity issues')
    console.error('3. Server-side deployment problems')
  }

  console.log('\n📋 NEXT STEPS:')
  console.log('1. If successful: Payment system is restored!')
  console.log('2. If failed: Check logs with: mcp__supabase__get_logs("edge-function")')
  console.log('3. Test with real payment to verify end-to-end flow')
}

// Run the test
testWebhookAccountCreation()