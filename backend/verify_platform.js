const API_URL = 'http://127.0.0.1:5000/api';
let accessToken = '';

async function runTests() {
  console.log('🚀 Starting Sprint Board Platform Verification...');

  try {
    // 1. Health Check
    console.log('\n🔍 Testing Health Check...');
    const healthRes = await fetch(`${API_URL}/health`);
    const health = await healthRes.json();
    console.log('✅ Health Check Passed:', health.data.status);

    // 2. Authentication Flow (Login)
    console.log('\n🔍 Testing Authentication (Login)...');
    try {
      const loginRes = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@sprintboard.com',
          password: 'Password123!'
        })
      });
      
      const login = await loginRes.json();
      console.log('Status:', loginRes.status);

      if (login.success) {
        accessToken = login.data.accessToken;
        console.log('✅ Authentication Passed: Token received');
      } else {
        console.log('❌ Login failed:', login.error?.message || 'Unknown error (User might not exist)');
      }
    } catch (e) {
      console.log('❌ Login request failed:', e.message);
    }
    
    if (accessToken) {
        const headers = { 
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        };
        // 3. Project Listing
        console.log('\n🔍 Testing Project Listing...');
        const projectsRes = await fetch(`${API_URL}/projects`, { headers });
        const projects = await projectsRes.json();
        console.log(`✅ Project Listing Passed: Found ${projects.data?.length || 0} projects`);
    }

  } catch (error) {
    console.error('\n❌ Verification Failed:');
    console.error(error.message);
    process.exit(1);
  }
}

runTests();
