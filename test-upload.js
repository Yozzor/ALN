// Simple test script to verify Google Drive upload functionality
// Run with: node test-upload.js

const fs = require('fs');
const path = require('path');

// Mock a simple photo upload test
async function testUpload() {
  try {
    console.log('🧪 Testing Google Drive upload...');
    
    // Create a simple test image data (base64 encoded 1x1 pixel)
    const testImageBase64 = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8A8A';
    
    const testData = {
      photoData: testImageBase64,
      userName: 'TestUser',
      fileName: 'test-photo.jpg',
      timestamp: Date.now()
    };

    console.log('📤 Sending test request...');
    
    // Make request to local API endpoint (HTTP on port 5173)
    const response = await fetch('http://localhost:5173/api/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Test successful!');
      console.log('📄 Result:', result);
    } else {
      console.log('❌ Test failed!');
      console.log('📄 Error:', result);
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

// Simple test endpoint check
async function testEndpoint() {
  try {
    console.log('🔍 Testing API endpoint...');
    
    const response = await fetch('http://localhost:5173/api/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ test: true })
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ API endpoint is working!');
      console.log('📄 Response:', result);
      return true;
    } else {
      console.log('❌ API endpoint failed!');
      console.log('📄 Error:', result);
      return false;
    }
    
  } catch (error) {
    console.error('❌ Endpoint test error:', error.message);
    return false;
  }
}

// Run tests
async function runTests() {
  console.log('🚀 Starting Google Drive integration tests...\n');
  
  // First test if the endpoint is reachable
  const endpointWorking = await testEndpoint();
  
  if (endpointWorking) {
    console.log('\n');
    await testUpload();
  } else {
    console.log('❌ Cannot proceed with upload test - endpoint not working');
    console.log('💡 Make sure the development server is running: npm run dev');
  }
}

// Check if this is being run directly
if (require.main === module) {
  runTests();
}

module.exports = { testUpload, testEndpoint };
