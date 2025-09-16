// Manual account creation for igorcogok3@gmail.com
// Run this in browser console on reviews.igoreckert.com.br

(async () => {
  console.log('🚀 Starting manual account creation for igorcogok3@gmail.com');

  try {
    // Import the account linking service
    const { linkPaymentToAccount } = await import('./src/services/accountLinkingService.js');

    // Prepare the linking data based on the payment webhook data
    const linkingData = {
      email: 'igorcogok3@gmail.com',
      paymentData: {
        planId: 'testcheap', // Based on your logs showing "testcheap"
        amount: 4900,
        paymentMethod: 'credit_card',
        transactionId: 'ch_XpYRepnFXC8ZOVqr',
        paidAt: '2025-09-16T18:10:42.418Z',
      },
      customerData: {
        name: 'igor',
        email: 'igorcogok3@gmail.com',
        document: '', // Not provided in webhook data
        phone: '', // Not provided in webhook data
      },
      planData: {
        id: 'testcheap',
        name: 'test',
        description: 'Test plan',
        durationDays: 365,
        finalAmount: 4900,
      },
    };

    console.log('📋 Linking data prepared:', linkingData);

    // Execute the account linking
    const result = await linkPaymentToAccount(linkingData);

    console.log('✅ Account linking result:', result);

    if (result.success) {
      console.log('🎉 Account created successfully!');
      console.log('📧 User should receive email at:', linkingData.email);
    } else {
      console.error('❌ Account creation failed:', result.error);
    }

  } catch (error) {
    console.error('💥 Error in manual account creation:', error);
  }
})();