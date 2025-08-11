import fetch from 'node:fetch';

// Configuration
const API_BASE = 'http://localhost:3001/api';
const SIMPLE_API_BASE = 'http://localhost:3001/api';

// Colors for output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  warn: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`)
};

async function testEndpoint(name, url, options = {}) {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    
    let data;
    try {
      data = await response.json();
    } catch (e) {
      data = await response.text();
    }
    
    if (response.ok) {
      log.success(`${name} - ${response.status}`);
      return { success: true, data, status: response.status };
    } else {
      log.error(`${name} - ${response.status}: ${JSON.stringify(data)}`);
      return { success: false, data, status: response.status };
    }
  } catch (error) {
    log.error(`${name} - Network Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function testProjectsCRUD() {
  log.info('=== TESTS DES APIS PROJETS ===');
  
  // Test 1: Health check
  await testEndpoint('Health Check', `${API_BASE}/health`);
  
  // Test 2: Récupérer tous les projets (public)
  const projectsResult = await testEndpoint('GET Projects (Public)', `${API_BASE}/projects`);
  
  // Test 3: Login admin
  const loginResult = await testEndpoint('POST Admin Login', `${API_BASE}/admin/login`, {
    method: 'POST',
    body: JSON.stringify({
      email: 'admin@aria-creative.com',
      password: 'admin@aria25!!'
    })
  });
  
  let authToken = null;
  if (loginResult.success && loginResult.data.token) {
    authToken = loginResult.data.token;
    log.success('Token d\'authentification obtenu');
  }
  
  if (authToken) {
    const authHeaders = { 'Authorization': `Bearer ${authToken}` };
    
    // Test 4: Récupérer tous les projets (admin)
    await testEndpoint('GET Projects (Admin)', `${API_BASE}/projects/admin`, {
      headers: authHeaders
    });
    
    // Test 5: Créer un nouveau projet
    const createResult = await testEndpoint('POST Create Project', `${API_BASE}/projects`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        title: 'Test Project API',
        description: 'Projet de test pour vérifier l\'API CRUD',
        technologies: ['React', 'Node.js', 'Test'],
        client: 'Test Client',
        duration: '1 mois',
        status: 'EN_COURS',
        url: 'https://test.com',
        date: '2024-01-01'
      })
    });
    
    let projectId = null;
    if (createResult.success && createResult.data?.project?.id) {
      projectId = createResult.data.project.id;
      log.success(`Projet créé avec ID: ${projectId}`);
    }
    
    if (projectId) {
      // Test 6: Récupérer le projet spécifique
      await testEndpoint('GET Project by ID', `${API_BASE}/projects/${projectId}`);
      
      // Test 7: Mettre à jour le projet
      await testEndpoint('PUT Update Project', `${API_BASE}/projects/${projectId}`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({
          title: 'Test Project Updated',
          description: 'Projet de test mis à jour',
          technologies: ['React', 'Node.js', 'Test', 'Updated'],
          client: 'Test Client Updated',
          duration: '2 mois',
          status: 'TERMINE',
          url: 'https://test-updated.com',
          date: '2024-01-15'
        })
      });
      
      // Test 8: Changer le statut du projet
      await testEndpoint('POST Update Project Status', `${API_BASE}/projects/${projectId}/status`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          status: 'EN_ATTENTE'
        })
      });
      
      // Test 9: Supprimer le projet
      await testEndpoint('DELETE Project', `${API_BASE}/projects/${projectId}`, {
        method: 'DELETE',
        headers: authHeaders
      });
    }
  }
}

async function testContactCRUD() {
  log.info('\n=== TESTS DES APIS CONTACT ===');
  
  // Test 1: Envoyer un message de contact
  const contactResult = await testEndpoint('POST Send Contact Message', `${API_BASE}/contact`, {
    method: 'POST',
    body: JSON.stringify({
      name: 'Test User',
      email: 'test@example.com',
      company: 'Test Company',
      subject: 'Test Message',
      message: 'Ceci est un message de test pour vérifier l\'API de contact.'
    })
  });
  
  // Test 2: Test de configuration email
  await testEndpoint('GET Email Config Test', `${API_BASE}/contact/test`);
  
  // Test admin avec authentification
  const loginResult = await testEndpoint('POST Admin Login', `${API_BASE}/admin/login`, {
    method: 'POST',
    body: JSON.stringify({
      email: 'admin@aria-creative.com',
      password: 'admin@aria25!!'
    })
  });
  
  let authToken = null;
  if (loginResult.success && loginResult.data.token) {
    authToken = loginResult.data.token;
  }
  
  if (authToken) {
    const authHeaders = { 'Authorization': `Bearer ${authToken}` };
    
    // Test 3: Récupérer tous les messages (admin)
    const messagesResult = await testEndpoint('GET Contact Messages (Admin)', `${API_BASE}/contact/admin`, {
      headers: authHeaders
    });
    
    // Test 4: Statistiques des messages
    await testEndpoint('GET Contact Stats', `${API_BASE}/contact/admin/stats`, {
      headers: authHeaders
    });
    
    // Si on a des messages, tester les opérations sur un message
    if (messagesResult.success && messagesResult.data?.messages?.length > 0) {
      const messageId = messagesResult.data.messages[0].id;
      log.success(`Test avec message ID: ${messageId}`);
      
      // Test 5: Récupérer un message spécifique
      await testEndpoint('GET Contact Message by ID', `${API_BASE}/contact/admin/${messageId}`, {
        headers: authHeaders
      });
      
      // Test 6: Changer le statut du message
      await testEndpoint('PUT Update Message Status', `${API_BASE}/contact/admin/${messageId}/status`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({
          status: 'LU'
        })
      });
      
      // Test 7: Supprimer le message (optionnel - commenté pour préserver les données)
      // await testEndpoint('DELETE Contact Message', `${API_BASE}/contact/admin/${messageId}`, {
      //   method: 'DELETE',
      //   headers: authHeaders
      // });
      log.warn('Suppression du message ignorée pour préserver les données');
    }
  }
}

async function testSimpleApiCRUD() {
  log.info('\n=== TESTS DE L\'API SIMPLE (api/) ===');
  
  // L'API simple fonctionne sur le même port, testons ses endpoints
  await testEndpoint('Simple API Health', `${SIMPLE_API_BASE}/health`);
  await testEndpoint('Simple API Projects', `${SIMPLE_API_BASE}/projects`);
  await testEndpoint('Simple API Admin Login', `${SIMPLE_API_BASE}/admin/login`, {
    method: 'POST',
    body: JSON.stringify({
      email: 'admin@aria-creative.com',
      password: 'admin@aria25!!'
    })
  });
}

async function runAllTests() {
  console.log(`${colors.blue}🚀 === TESTS DES APIS ARIA CREATIVE ===${colors.reset}\n`);
  
  try {
    await testProjectsCRUD();
    await testContactCRUD();
    await testSimpleApiCRUD();
    
    log.info('\n=== TESTS TERMINÉS ===');
    log.success('Vérification des APIs CRUD terminée');
  } catch (error) {
    log.error(`Erreur générale: ${error.message}`);
  }
}

// Exécuter tous les tests
runAllTests();
