// Test script to validate PIX payment request format with real credentials
const testPayment = async () => {
  const supabaseUrl = 'https://qjoxiowuiiupbvqlssgk.supabase.co'
  
  // This is the exact payload from your error log
  const paymentData = {
    customerId: "temp_customer_id",
    amount: 1990, // R$ 19.90 in cents
    description: "EVIDENS - Plano Mensal",
    metadata: {
      customerName: "igor cogo koehler",
      customerEmail: "igorcogok@gmail.com",
      customerDocument: "04094922059",
      planName: "Plano Mensal"
    }
  }
  
  console.log('🧪 Testing PIX payment with REAL credentials...')
  console.log('📦 Payload:', JSON.stringify(paymentData, null, 2))
  console.log('🔐 Using real Pagar.me secret key: sk_test_635827fe8bc44b8e9983e3a4ad3b07f9')
  
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/create-pix-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Using the anon key from your .env file
        'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqb3hpb3d1aWl1cGJ2cWxzc2drIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5MzU0MjIsImV4cCI6MjA2NTUxMTQyMn0.3NP22ssdBY7Jub2dPdt9Owxcum8Hp59-B4C8hiBz-wg`
      },
      body: JSON.stringify(paymentData)
    })
    
    const result = await response.json()
    
    console.log('\n📊 PAYMENT TEST RESULTS:')
    console.log('Status Code:', response.status)
    console.log('Response:', JSON.stringify(result, null, 2))
    
    if (response.ok) {
      console.log('\n✅ SUCCESS! Payment request worked!')
      if (result.qr_code) {
        console.log('📱 QR Code Generated:', result.qr_code.slice(0, 50) + '...')
      }
      if (result.qr_code_url) {
        console.log('🔗 QR Code URL:', result.qr_code_url)
      }
      console.log('💰 Amount:', result.amount, 'cents (R$' + (result.amount/100).toFixed(2) + ')')
      console.log('🏷️ Order ID:', result.order_id)
      console.log('⏰ Expires At:', result.expires_at)
    } else {
      console.log('\n❌ FAILED - Status:', response.status)
      console.log('Error:', result.error)
      
      if (result.error.includes('credentials') || result.error.includes('Credenciais')) {
        console.log('\n🔧 CREDENTIAL ISSUE DETECTED')
        console.log('The Pagar.me API rejected our credentials.')
        console.log('This could mean:')
        console.log('1. The secret key is invalid')
        console.log('2. The secret key is not active')
        console.log('3. The API endpoint is wrong')
      }
    }
    
  } catch (error) {
    console.error('\n🚨 NETWORK ERROR:', error.message)
  }
}

testPayment()