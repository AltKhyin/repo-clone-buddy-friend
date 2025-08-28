// Test script to validate admin config update with real session token
const testAdminConfig = async () => {
  // Real session token will need to be provided manually
  const sessionToken = 'USER_SESSION_TOKEN_HERE' // This needs to be obtained from browser
  
  const supabaseUrl = 'https://qjoxiowuiiupbvqlssgk.supabase.co'
  
  // This is the exact payload from the PaymentConfigurationModal
  const config = {
    publicKey: "pk_test_gjB1ZQAFVBH5LDlG",
    secretKey: "sk_test_635827fe8bc44b8e9983e3a4ad3b07f9",
    webhookEndpointId: "hookset_dmYVRkrSNvtXAo6A",
    webhookSecret: "test_webhook_secret",
    webhookAuthEnabled: true,
    webhookUser: "evidens_webhook_user",
    webhookPassword: "evidens_secure_password_2025",
    apiVersion: "2019-09-01"
  }
  
  console.log('🧪 Testing admin config with session token...')
  console.log('📦 Config payload:', JSON.stringify(config, null, 2))
  
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/admin-update-payment-config`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionToken}`
      },
      body: JSON.stringify(config)
    })
    
    const result = await response.json()
    
    console.log('\n📊 ADMIN CONFIG TEST RESULTS:')
    console.log('Status Code:', response.status)
    console.log('Response:', JSON.stringify(result, null, 2))
    
    if (response.ok) {
      console.log('\n✅ SUCCESS! Config update worked!')
      if (result.next_steps) {
        console.log('📋 Next steps:', result.next_steps.instructions)
      }
    } else {
      console.log('\n❌ FAILED - Status:', response.status)
      console.log('Error:', result.error || result)
    }
    
  } catch (error) {
    console.error('\n🚨 NETWORK ERROR:', error.message)
  }
}

// Instructions for getting session token
console.log('🔑 To get the session token:')
console.log('1. Open browser dev tools on EVIDENS app')
console.log('2. Run: JSON.parse(localStorage.getItem("supabase.auth.token")).access_token')
console.log('3. Replace USER_SESSION_TOKEN_HERE with the result')
console.log('4. Then run this script')

testAdminConfig()