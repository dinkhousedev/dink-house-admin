/**
 * Test script for /api/auth/user endpoint
 * Run with: node test-user-api.js
 */

const testUserAPI = async () => {
  const baseUrl = 'http://localhost:3000';

  try {
    console.log('Testing /api/auth/user endpoint...\n');

    // Test 1: Unauthenticated request
    console.log('Test 1: Unauthenticated request');
    const unauthResponse = await fetch(`${baseUrl}/api/auth/user`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const unauthData = await unauthResponse.json();
    console.log(`Status: ${unauthResponse.status}`);
    console.log('Response:', JSON.stringify(unauthData, null, 2));

    if (unauthResponse.status === 401) {
      console.log('✓ Correctly returned 401 for unauthenticated request\n');
    }

    // Test 2: Authenticated request (requires valid cookies)
    console.log('Test 2: Authenticated request');
    console.log('Note: This test requires you to be logged in via the browser');
    console.log('Copy your session_token cookie value from browser DevTools');
    console.log('and update the sessionToken variable below\n');

    // To test authenticated request:
    // 1. Login via browser at http://localhost:3000/auth/login
    // 2. Open DevTools > Application > Cookies
    // 3. Copy the session_token value
    // 4. Paste it below
    const sessionToken = ''; // Paste your session token here

    if (sessionToken) {
      const authResponse = await fetch(`${baseUrl}/api/auth/user`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `session_token=${sessionToken}`,
        },
      });

      const authData = await authResponse.json();
      console.log(`Status: ${authResponse.status}`);
      console.log('Response:', JSON.stringify(authData, null, 2));

      if (authResponse.status === 200 && authData.success) {
        console.log('✓ Successfully retrieved user information');
        console.log('User details:');
        console.log(`  - Name: ${authData.user.first_name} ${authData.user.last_name}`);
        console.log(`  - Position: ${authData.user.position}`);
        console.log(`  - Email: ${authData.user.email}`);
        console.log(`  - User Type: ${authData.user.user_type}`);
      }
    } else {
      console.log('Skipping authenticated test - no session token provided');
    }

  } catch (error) {
    console.error('Error testing API:', error);
  }
};

// Run the test
testUserAPI();