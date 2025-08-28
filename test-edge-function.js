// Test script to check Edge Function response structure
const fetch = require('node-fetch');

async function testEdgeFunction() {
  try {
    const response = await fetch('https://qjoxiowuiiupbvqlssgk.supabase.co/functions/v1/admin-manage-users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqb3hpb3d1aWl1cGJ2cWxzc2drIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5MzU0MjIsImV4cCI6MjA2NTUxMTQyMn0.3NP22ssdBY7Jub2dPdt9Owxcum8Hp59-B4C8hiBz-wg'
      },
      body: JSON.stringify({
        action: 'list',
        filters: { limit: 2 }
      })
    });

    const data = await response.json();
    
    console.log('=== Edge Function Response Structure ===');
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (data.users && data.users.length > 0) {
      console.log('\n=== First User Structure ===');
      console.log('User keys:', Object.keys(data.users[0]));
      console.log('JWT Claims:', data.users[0].jwtClaims);
      console.log('Activity Metrics:', data.users[0].activityMetrics);
      console.log('Social Media:', data.users[0].socialMediaLinks);
    }
    
  } catch (error) {
    console.error('Error testing edge function:', error);
  }
}

testEdgeFunction();