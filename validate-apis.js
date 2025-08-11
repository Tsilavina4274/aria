/**
 * Script de validation des APIs CRUD pour Aria Creative
 * Teste toutes les fonctionnalités CRUD des projets et des messages de contact
 */

console.log('🚀 === VALIDATION DES APIS ARIA CREATIVE ===\n');

// Configuration
const BACKEND_URL = 'http://localhost:3002/api';
const ADMIN_CREDENTIALS = {
  email: 'admin@aria-creative.com',
  password: 'admin@aria25!!'
};

// Couleurs pour la sortie console
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  warn: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  title: (msg) => console.log(`${colors.bold}${colors.cyan}=== ${msg} ===${colors.reset}`),
  step: (msg) => console.log(`${colors.blue}🔸 ${msg}${colors.reset}`)
};

// Résumé des tests
const testResults = {
  total: 0,
  passed: 0,
  failed: 0
};

function addTestResult(passed, testName) {
  testResults.total++;
  if (passed) {
    testResults.passed++;
    log.success(`${testName} - PASSÉ`);
  } else {
    testResults.failed++;
    log.error(`${testName} - ÉCHEC`);
  }
}

// Test des endpoints disponibles
const tests = {
  // Tests de base
  healthCheck: {
    name: 'Health Check',
    endpoint: '/health',
    method: 'GET',
    expected: { status: 'OK' }
  },
  
  // Tests des projets
  getPublicProjects: {
    name: 'GET Projects (Public)',
    endpoint: '/projects',
    method: 'GET',
    expected: { success: true }
  },
  
  // Tests d'authentification admin
  adminLogin: {
    name: 'Admin Login',
    endpoint: '/admin/login',
    method: 'POST',
    body: ADMIN_CREDENTIALS,
    expected: { success: true, token: true }
  },
  
  // Tests des projets admin (nécessite auth)
  getAdminProjects: {
    name: 'GET Projects (Admin)',
    endpoint: '/projects/admin',
    method: 'GET',
    requiresAuth: true,
    expected: { success: true }
  },
  
  // Tests des messages de contact
  sendContactMessage: {
    name: 'Send Contact Message',
    endpoint: '/contact',
    method: 'POST',
    body: {
      name: 'Test Validation',
      email: 'test-validation@aria-creative.com',
      company: 'Test Company',
      subject: 'Test de validation API',
      message: 'Ceci est un message de test pour valider le fonctionnement de l\'API de contact.'
    },
    expected: { success: true }
  },
  
  // Tests admin des messages de contact
  getContactMessages: {
    name: 'GET Contact Messages (Admin)',
    endpoint: '/contact/admin',
    method: 'GET',
    requiresAuth: true,
    expected: { success: true }
  },
  
  getContactStats: {
    name: 'GET Contact Stats',
    endpoint: '/contact/admin/stats',
    method: 'GET',
    requiresAuth: true,
    expected: { success: true }
  }
};

// Variables globales pour les tests
let authToken = null;
let testProjectId = null;
let testMessageId = null;

async function makeRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
        ...options.headers
      },
      ...options
    });
    
    const data = await response.json();
    return { ok: response.ok, status: response.status, data };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

async function runBasicTests() {
  log.title('TESTS DE BASE');
  
  // Health Check
  log.step('Test du Health Check...');
  const healthResult = await makeRequest(`${BACKEND_URL}/health`);
  addTestResult(
    healthResult.ok && healthResult.data.status === 'OK',
    'Health Check'
  );
  
  // Projets publics
  log.step('Test GET Projects (Public)...');
  const projectsResult = await makeRequest(`${BACKEND_URL}/projects`);
  addTestResult(
    projectsResult.ok && projectsResult.data.success,
    'GET Projects Public'
  );
  
  if (projectsResult.ok && projectsResult.data.data?.projects) {
    log.info(`   📊 ${projectsResult.data.data.projects.length} projets publics trouvés`);
  }
}

async function runAuthTests() {
  log.title('TESTS D\'AUTHENTIFICATION');
  
  // Login admin
  log.step('Test Login Admin...');
  const loginResult = await makeRequest(`${BACKEND_URL}/admin/login`, {
    method: 'POST',
    body: JSON.stringify(ADMIN_CREDENTIALS)
  });
  
  const loginSuccess = loginResult.ok && loginResult.data.success && loginResult.data.token;
  addTestResult(loginSuccess, 'Admin Login');
  
  if (loginSuccess) {
    authToken = loginResult.data.token;
    log.info(`   🔐 Token d'authentification obtenu: ${authToken.substring(0, 20)}...`);
    
    // Test de vérification du token
    log.step('Test de vérification du token...');
    const verifyResult = await makeRequest(`${BACKEND_URL}/admin/verify`, {
      method: 'POST'
    });
    addTestResult(
      verifyResult.ok && verifyResult.data.success,
      'Token Verification'
    );
  } else {
    log.error('   ❌ Impossible d\'obtenir le token d\'authentification');
  }
}

async function runProjectCrudTests() {
  if (!authToken) {
    log.warn('Pas de token - CRUD projets ignoré');
    return;
  }
  
  log.title('TESTS CRUD DES PROJETS');
  
  // GET tous les projets (admin)
  log.step('Test GET Projects (Admin)...');
  const adminProjectsResult = await makeRequest(`${BACKEND_URL}/projects/admin`);
  addTestResult(
    adminProjectsResult.ok && adminProjectsResult.data.success,
    'GET Projects Admin'
  );
  
  if (adminProjectsResult.ok && adminProjectsResult.data.data?.projects) {
    log.info(`   📊 ${adminProjectsResult.data.data.projects.length} projets admin trouvés`);
  }
  
  // CREATE projet
  log.step('Test CREATE Project...');
  const newProject = {
    title: 'Projet Test API Validation',
    description: 'Projet créé automatiquement pour valider les APIs CRUD',
    technologies: ['Test', 'Validation', 'API', 'CRUD'],
    client: 'Client Test Validation',
    duration: '1 semaine',
    status: 'EN_COURS',
    url: 'https://test-validation.aria-creative.com',
    date: new Date().toISOString().split('T')[0]
  };
  
  const createResult = await makeRequest(`${BACKEND_URL}/projects`, {
    method: 'POST',
    body: JSON.stringify(newProject)
  });
  
  const createSuccess = createResult.ok && createResult.data.success && createResult.data.data?.project?.id;
  addTestResult(createSuccess, 'CREATE Project');
  
  if (createSuccess) {
    testProjectId = createResult.data.data.project.id;
    log.info(`   📝 Projet créé avec ID: ${testProjectId}`);
    
    // READ projet spécifique
    log.step('Test READ Project...');
    const readResult = await makeRequest(`${BACKEND_URL}/projects/${testProjectId}`);
    addTestResult(
      readResult.ok && readResult.data.success,
      'READ Project'
    );
    
    // UPDATE projet
    log.step('Test UPDATE Project...');
    const updateData = {
      ...newProject,
      title: 'Projet Test API Validation - MODIFIÉ',
      status: 'TERMINE'
    };
    
    const updateResult = await makeRequest(`${BACKEND_URL}/projects/${testProjectId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData)
    });
    addTestResult(
      updateResult.ok && updateResult.data.success,
      'UPDATE Project'
    );
    
    // UPDATE status projet
    log.step('Test UPDATE Project Status...');
    const statusResult = await makeRequest(`${BACKEND_URL}/projects/${testProjectId}/status`, {
      method: 'POST',
      body: JSON.stringify({ status: 'EN_ATTENTE' })
    });
    addTestResult(
      statusResult.ok && statusResult.data.success,
      'UPDATE Project Status'
    );
    
    // DELETE projet
    log.step('Test DELETE Project...');
    const deleteResult = await makeRequest(`${BACKEND_URL}/projects/${testProjectId}`, {
      method: 'DELETE'
    });
    addTestResult(
      deleteResult.ok && deleteResult.data.success,
      'DELETE Project'
    );
    
    if (deleteResult.ok) {
      log.info(`   🗑️  Projet test supprimé: ${testProjectId}`);
    }
  }
}

async function runContactCrudTests() {
  log.title('TESTS CRUD DES MESSAGES DE CONTACT');
  
  // CREATE message de contact
  log.step('Test CREATE Contact Message...');
  const contactMessage = {
    name: 'Validation Test User',
    email: 'validation-test@aria-creative.com',
    company: 'Validation Test Company',
    subject: 'Test de validation des APIs CRUD',
    message: 'Ce message a été créé automatiquement pour tester les APIs CRUD des messages de contact. Il peut être supprimé.'
  };
  
  const contactResult = await makeRequest(`${BACKEND_URL}/contact`, {
    method: 'POST',
    body: JSON.stringify(contactMessage)
  });
  
  addTestResult(
    contactResult.ok && contactResult.data.success,
    'CREATE Contact Message'
  );
  
  if (!authToken) {
    log.warn('Pas de token - Tests admin des messages ignorés');
    return;
  }
  
  // READ tous les messages (admin)
  log.step('Test READ Contact Messages (Admin)...');
  const messagesResult = await makeRequest(`${BACKEND_URL}/contact/admin`);
  addTestResult(
    messagesResult.ok && messagesResult.data.success,
    'READ Contact Messages'
  );
  
  if (messagesResult.ok && messagesResult.data.data?.messages?.length > 0) {
    const messages = messagesResult.data.data.messages;
    log.info(`   📊 ${messages.length} messages trouvés`);
    
    // Prendre le premier message pour les tests
    testMessageId = messages[0].id;
    
    // READ message spécifique
    log.step('Test READ Contact Message by ID...');
    const messageResult = await makeRequest(`${BACKEND_URL}/contact/admin/${testMessageId}`);
    addTestResult(
      messageResult.ok && messageResult.data.success,
      'READ Contact Message by ID'
    );
    
    // UPDATE status du message
    log.step('Test UPDATE Contact Message Status...');
    const updateStatusResult = await makeRequest(`${BACKEND_URL}/contact/admin/${testMessageId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status: 'LU' })
    });
    addTestResult(
      updateStatusResult.ok && updateStatusResult.data.success,
      'UPDATE Contact Message Status'
    );
  }
  
  // READ statistiques des messages
  log.step('Test READ Contact Stats...');
  const statsResult = await makeRequest(`${BACKEND_URL}/contact/admin/stats`);
  addTestResult(
    statsResult.ok && statsResult.data.success,
    'READ Contact Stats'
  );
  
  if (statsResult.ok && statsResult.data.data?.stats) {
    const stats = statsResult.data.data.stats;
    log.info(`   📊 Stats: ${stats.total} total, ${stats.nouveau} nouveaux, ${stats.traite} traités`);
  }
}

async function runAllTests() {
  try {
    await runBasicTests();
    await runAuthTests();
    await runProjectCrudTests();
    await runContactCrudTests();
    
    // Résumé final
    console.log('\n');
    log.title('RÉSUMÉ DES TESTS');
    log.info(`Total des tests: ${testResults.total}`);
    log.success(`Tests réussis: ${testResults.passed}`);
    if (testResults.failed > 0) {
      log.error(`Tests échoués: ${testResults.failed}`);
    }
    
    const successRate = ((testResults.passed / testResults.total) * 100).toFixed(1);
    console.log(`\n${colors.bold}Taux de réussite: ${successRate}%${colors.reset}`);
    
    if (testResults.failed === 0) {
      log.success('🎉 TOUTES LES APIS CRUD FONCTIONNENT CORRECTEMENT!');
    } else {
      log.warn('⚠️  Certains tests ont échoué. Vérifiez les logs ci-dessus.');
    }
    
  } catch (error) {
    log.error(`Erreur générale: ${error.message}`);
  }
}

// Vérifier si fetch est disponible (Node.js 18+)
if (typeof fetch === 'undefined') {
  console.log('❌ fetch n\'est pas disponible. Utilisez Node.js 18+ ou installez node-fetch');
  process.exit(1);
}

// Exécuter tous les tests
runAllTests();
