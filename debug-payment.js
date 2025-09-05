// Debug script to test the payment directly
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://qjoxiowuiiupbvqlssgk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqb3hpb3d1aWl1cGJ2cWxzc2drIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE0MzI0NzMsImV4cCI6MjA0NzAwODQ3M30.WQZ_WnVHvPGT_EDy6PPqkJrM3a5I1pLLnHb89Q5aPm0';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function debugPayment() {
  console.log('🔍 Debugging Credit Card Payment...');
  
  try {
    // Sign in first
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'igor@igoreckert.com.br',
      password: 'temp123456'
    });

    if (authError) {
      console.error('❌ Auth error:', authError);
      return;
    }

    console.log('✅ Authenticated successfully');
    
    // Get the session
    const { data: session } = await supabase.auth.getSession();
    const jwt = session.session?.access_token;
    
    if (!jwt) {
      console.error('❌ No JWT token found');
      return;
    }

    // Make the payment request
    console.log('📤 Making payment request...');
    
    const response = await fetch(`${SUPABASE_URL}/functions/v1/evidens-create-payment`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${jwt}`,
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY
      },
      body: JSON.stringify({
        customerId: 'igor@igoreckert.com.br',
        amount: 1, // R$ 0.01 
        description: 'Teste do sistema - Debug',
        paymentMethod: 'credit_card',
        cardToken: 'tokenize_on_server', // Server-side tokenization
        installments: 1,
        metadata: {
          customerName: 'Igor Eckert',
          customerEmail: 'igor@igoreckert.com.br', 
          customerDocument: '12345678901',
          planName: 'Teste - R$ 0,01'
        },
        cardData: {
          number: '4000000000000010', // Valid test card
          holderName: 'Igor Eckert',
          expirationMonth: '12',
          expirationYear: '25', 
          cvv: '123'
        }
      })
    });
    
    console.log('📥 Response status:', response.status);
    console.log('📥 Response headers:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('📄 Raw response:', responseText);
    
    if (response.ok) {
      const data = JSON.parse(responseText);
      console.log('✅ Payment successful!', data);
    } else {
      console.error('❌ Payment failed with status:', response.status);
      try {
        const errorData = JSON.parse(responseText);
        console.error('❌ Error details:', errorData);
      } catch {
        console.error('❌ Raw error:', responseText);
      }
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

debugPayment();