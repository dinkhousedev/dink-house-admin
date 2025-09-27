#!/usr/bin/env node

/**
 * Test script for the Allowed Emails API
 *
 * Usage: node test-allowed-emails-api.js
 *
 * Make sure your Next.js server is running on port 3000
 */

const BASE_URL = 'http://localhost:3000';

// Test data
const testEmail = {
  email: 'new.employee@dinkhouse.com',
  firstName: 'New',
  lastName: 'Employee',
  role: 'coach',
  notes: 'Added via API test'
};

// Helper function to make requests
async function makeRequest(method, endpoint, body = null, sessionToken = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    }
  };

  if (sessionToken) {
    options.headers['Cookie'] = `session=${sessionToken}`;
  }

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await response.json();
    return { status: response.status, data };
  } catch (error) {
    return { error: error.message };
  }
}

// Create a mock session for testing (in production, this would come from actual login)
function createMockAdminSession() {
  const sessionData = {
    email: 'admin@dinkhouse.com',
    role: 'admin',
    firstName: 'Admin',
    lastName: 'User',
    timestamp: Date.now()
  };
  return Buffer.from(JSON.stringify(sessionData)).toString('base64');
}

async function runTests() {
  console.log('🧪 Testing Allowed Emails API\n');
  console.log('================================\n');

  const adminSession = createMockAdminSession();

  // Test 1: GET all allowed emails
  console.log('📋 Test 1: GET all allowed emails');
  const getResult = await makeRequest('GET', '/api/admin/allowed-emails', null, adminSession);
  console.log(`Status: ${getResult.status}`);
  if (getResult.status === 200) {
    console.log(`✅ Found ${getResult.data.count} allowed emails\n`);
  } else {
    console.log('❌ Failed to get allowed emails');
    console.log(getResult.data);
    console.log('\n');
  }

  // Test 2: POST - Add new allowed email
  console.log('➕ Test 2: POST - Add new allowed email');
  const postResult = await makeRequest('POST', '/api/admin/allowed-emails', testEmail, adminSession);
  console.log(`Status: ${postResult.status}`);
  if (postResult.status === 200) {
    console.log('✅ Successfully added new email');
    console.log(`Email: ${postResult.data.data.email}`);
    console.log(`Role: ${postResult.data.data.role}\n`);
  } else {
    console.log('❌ Failed to add email');
    console.log(postResult.data);
    console.log('\n');
  }

  // Test 3: POST - Try to add duplicate email
  console.log('🔄 Test 3: POST - Try to add duplicate email');
  const duplicateResult = await makeRequest('POST', '/api/admin/allowed-emails', testEmail, adminSession);
  console.log(`Status: ${duplicateResult.status}`);
  if (duplicateResult.status === 409) {
    console.log('✅ Correctly rejected duplicate email\n');
  } else {
    console.log('❌ Should have rejected duplicate');
    console.log(duplicateResult.data);
    console.log('\n');
  }

  // Test 4: DELETE - Remove allowed email
  console.log('🗑️  Test 4: DELETE - Remove allowed email');
  const deleteResult = await makeRequest(
    'DELETE',
    `/api/admin/allowed-emails?email=${encodeURIComponent(testEmail.email)}`,
    null,
    adminSession
  );
  console.log(`Status: ${deleteResult.status}`);
  if (deleteResult.status === 200) {
    console.log('✅ Successfully removed email');
    console.log(deleteResult.data.message);
    console.log('\n');
  } else {
    console.log('❌ Failed to remove email');
    console.log(deleteResult.data);
    console.log('\n');
  }

  // Test 5: Unauthorized access (no session)
  console.log('🔒 Test 5: Unauthorized access test');
  const unauthorizedResult = await makeRequest('GET', '/api/admin/allowed-emails');
  console.log(`Status: ${unauthorizedResult.status}`);
  if (unauthorizedResult.status === 401) {
    console.log('✅ Correctly blocked unauthorized access\n');
  } else {
    console.log('❌ Should have blocked unauthorized access');
    console.log(unauthorizedResult.data);
    console.log('\n');
  }

  console.log('================================');
  console.log('✨ Tests complete!\n');
}

// Run tests
console.log('Note: Make sure your Next.js server is running on port 3000\n');
runTests().catch(console.error);