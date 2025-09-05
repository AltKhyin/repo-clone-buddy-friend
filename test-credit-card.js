// Test script for credit card payment with server-side tokenization
const SUPABASE_URL = 'https://vwxrqhghawoztzjwontr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ3eHJxaGdoYXdvenR6andvbnRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE0MzI4NTIsImV4cCI6MjA0NzAwODg1Mn0.1Haa0Ue4ZLNfHCr5nNBqSfQzYFkc4QsG-Jn5qoFfqvU';

async function testCreditCardPayment() {
  console.log('🧪 Testing Credit Card Payment with Server-side Tokenization');

  try {
    // First, we need to authenticate a user to get a JWT token
    console.log('1. Authenticating user...');
    const authResponse = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY
      },
      body: JSON.stringify({
        email: 'igor@igoreckert.com.br',
        password: 'temp123456',
      })
    });

    if (!authResponse.ok) {
      const authError = await authResponse.text();
      throw new Error(`Authentication failed: ${authError}`);
    }

    const authData = await authResponse.json();
    const jwt = authData.access_token;
    console.log('✅ Authentication successful');

    // Now test the credit card payment
    console.log('2. Testing credit card payment...');
    const paymentResponse = await fetch(`${SUPABASE_URL}/functions/v1/evidens-create-payment`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${jwt}`,
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY
      },
      body: JSON.stringify({
        customerId: 'igor@igoreckert.com.br',
        amount: 1, // R$ 0.01 for testing
        description: 'Teste do sistema de pagamento - Server-side tokenization',
        paymentMethod: 'credit_card',
        cardToken: 'tokenize_on_server', // Signal for server-side tokenization
        installments: 1,
        metadata: {
          customerName: 'Igor Eckert',
          customerEmail: 'igor@igoreckert.com.br',
          customerDocument: '12345678901',
          planName: 'Teste - R$ 0,01'
        },
        cardData: {
          number: '4000000000000010', // Pagar.me test card
          holderName: 'Igor Eckert',
          expirationMonth: '12',
          expirationYear: '25',
          cvv: '123'
        }
      })
    });

    if (!paymentResponse.ok) {
      const errorText = await paymentResponse.text();
      throw new Error(`Payment failed: ${paymentResponse.status} ${errorText}`);
    }

    const paymentData = await paymentResponse.json();
    console.log('✅ Credit card payment successful!');
    console.log('📄 Payment Details:', {
      id: paymentData.id,
      status: paymentData.status,
      amount: paymentData.amount,
      payment_method: paymentData.payment_method,
      authorization_code: paymentData.authorization_code
    });

    if (paymentData.status === 'paid' || paymentData.status === 'pending') {
      console.log('🎉 CORS issue fixed! Server-side tokenization working correctly.');
    } else {
      console.log('⚠️ Payment created but status is:', paymentData.status);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    // Check if this is still a CORS-related error
    if (error.message.includes('CORS') || error.message.includes('blocked')) {
      console.log('🚨 CORS issue still exists - need to investigate further');
    }
  }
}

testCreditCardPayment();