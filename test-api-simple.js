#!/usr/bin/env node

// Test simple des APIs sans utiliser fetch externe
const http = require('http');

function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function testAPI() {
  console.log('🚀 Test des APIs Aria Creative\n');

  try {
    // Test 1: Health check
    console.log('1. Test Health Check...');
    const health = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/health',
      method: 'GET'
    });
    console.log(`   Status: ${health.status}`, health.data);

    // Test 2: Get projects (public)
    console.log('\n2. Test GET Projects (Public)...');
    const projects = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/projects',
      method: 'GET'
    });
    console.log(`   Status: ${projects.status}`);
    if (projects.data.data?.projects) {
      console.log(`   Projects found: ${projects.data.data.projects.length}`);
    }

    // Test 3: Admin login
    console.log('\n3. Test Admin Login...');
    const login = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/admin/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, {
      email: 'admin@aria-creative.com',
      password: 'admin@aria25!!'
    });
    console.log(`   Status: ${login.status}`);
    
    let token = null;
    if (login.data.token) {
      token = login.data.token;
      console.log('   ✅ Token obtenu');
    }

    if (token) {
      // Test 4: Get projects admin
      console.log('\n4. Test GET Projects (Admin)...');
      const adminProjects = await makeRequest({
        hostname: 'localhost',
        port: 3001,
        path: '/api/projects/admin',
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log(`   Status: ${adminProjects.status}`);
      if (adminProjects.data.data?.projects) {
        console.log(`   Admin projects found: ${adminProjects.data.data.projects.length}`);
      }

      // Test 5: Contact messages
      console.log('\n5. Test GET Contact Messages (Admin)...');
      const messages = await makeRequest({
        hostname: 'localhost',
        port: 3001,
        path: '/api/contact/admin',
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log(`   Status: ${messages.status}`);
      if (messages.data.data?.messages) {
        console.log(`   Contact messages found: ${messages.data.data.messages.length}`);
      }
    }

    // Test 6: Send contact message
    console.log('\n6. Test POST Contact Message...');
    const contact = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/contact',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, {
      name: 'Test User',
      email: 'test@example.com',
      company: 'Test Company',
      subject: 'Test API',
      message: 'Ceci est un test de l\'API de contact.'
    });
    console.log(`   Status: ${contact.status}`);
    if (contact.data.success) {
      console.log('   ✅ Message de contact envoyé');
    }

    console.log('\n✅ Tests terminés');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

testAPI();
