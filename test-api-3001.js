/**
 * Test de l'API sur port 3001 - API simple avec validation améliorée
 */

console.log('🚀 Test API Aria Creative (Port 3001)\n');

const API_BASE = 'http://localhost:3001/api';

// Test avec Node.js built-in fetch (Node 18+)
if (typeof fetch === 'undefined') {
  console.log('❌ fetch non disponible. Node.js 18+ requis.');
  process.exit(1);
}

let testResults = { passed: 0, failed: 0, total: 0 };

async function test(name, testFn) {
  try {
    testResults.total++;
    console.log(`🔸 ${name}...`);
    await testFn();
    testResults.passed++;
    console.log(`✅ ${name} - RÉUSSI\n`);
  } catch (error) {
    testResults.failed++;
    console.log(`❌ ${name} - ÉCHEC: ${error.message}\n`);
  }
}

async function apiCall(endpoint, options = {}) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(`${response.status}: ${data.error || data.message || 'Erreur API'}`);
  }
  
  return data;
}

async function runTests() {
  let authToken = '';
  let testProjectId = '';
  
  // Tests de base
  await test('Health Check', async () => {
    const result = await apiCall('/health');
    if (result.data?.status !== 'OK') throw new Error('Status incorrect');
  });
  
  await test('GET Projects (Public)', async () => {
    const result = await apiCall('/projects');
    if (!result.success || !Array.isArray(result.data.projects)) {
      throw new Error('Format de réponse incorrect');
    }
    console.log(`   📊 ${result.data.projects.length} projets publics`);
  });
  
  // Test login admin
  await test('Admin Login', async () => {
    const result = await apiCall('/admin/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'admin@aria-creative.com',
        password: 'admin@aria25!!'
      })
    });
    
    if (!result.success || !result.token) {
      throw new Error('Login failed');
    }
    authToken = result.token;
    console.log(`   🔐 Token obtenu: ${authToken.substring(0, 20)}...`);
  });
  
  const authHeaders = { 'Authorization': `Bearer ${authToken}` };
  
  await test('GET Projects (Admin)', async () => {
    const result = await apiCall('/projects/admin', { headers: authHeaders });
    if (!result.success || !Array.isArray(result.data.projects)) {
      throw new Error('Format incorrect');
    }
    console.log(`   📊 ${result.data.projects.length} projets admin`);
  });
  
  // Test CRUD complet des projets
  await test('CREATE Project', async () => {
    const projectData = {
      title: 'Test Project CRUD',
      description: 'Projet créé pour tester les APIs CRUD améliorées',
      technologies: ['React', 'Node.js', 'Test'],
      client: 'Client Test',
      duration: '2 semaines',
      status: 'EN_COURS',
      url: 'https://test.example.com'
    };
    
    const result = await apiCall('/projects', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(projectData)
    });
    
    if (!result.success || !result.data?.project?.id) {
      throw new Error('Création échouée');
    }
    
    testProjectId = result.data.project.id;
    console.log(`   📝 Projet créé: ${testProjectId}`);
  });
  
  await test('READ Project', async () => {
    const result = await apiCall(`/projects/${testProjectId}`);
    if (!result.success || !result.project) {
      throw new Error('Lecture échouée');
    }
    console.log(`   📖 Projet lu: ${result.project.title}`);
  });
  
  await test('UPDATE Project', async () => {
    const updateData = {
      title: 'Test Project CRUD - MODIFIÉ',
      description: 'Description mise à jour',
      technologies: ['React', 'Node.js', 'Test', 'Updated'],
      client: 'Client Test Updated',
      duration: '3 semaines',
      status: 'TERMINE'
    };
    
    const result = await apiCall(`/projects/${testProjectId}`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify(updateData)
    });
    
    if (!result.success || result.data.project.title !== updateData.title) {
      throw new Error('Mise à jour échouée');
    }
    console.log(`   ✏️ Projet mis à jour`);
  });
  
  await test('UPDATE Project Status', async () => {
    const result = await apiCall(`/projects/${testProjectId}/status`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ status: 'EN_ATTENTE' })
    });
    
    if (!result.success || result.data.project.status !== 'EN_ATTENTE') {
      throw new Error('Mise à jour statut échouée');
    }
    console.log(`   📊 Statut mis à jour: EN_ATTENTE`);
  });
  
  await test('DELETE Project', async () => {
    const result = await apiCall(`/projects/${testProjectId}`, {
      method: 'DELETE',
      headers: authHeaders
    });
    
    if (!result.success) {
      throw new Error('Suppression échouée');
    }
    console.log(`   🗑️ Projet supprimé`);
  });
  
  // Test CRUD des messages de contact
  await test('Send Contact Message', async () => {
    const messageData = {
      name: 'Test User',
      email: 'test@example.com',
      company: 'Test Company',
      subject: 'Test Message API',
      message: 'Ceci est un message de test pour vérifier les APIs de contact.'
    };
    
    const result = await apiCall('/contact', {
      method: 'POST',
      body: JSON.stringify(messageData)
    });
    
    if (!result.success) {
      throw new Error('Envoi message échoué');
    }
    console.log(`   📧 Message envoyé`);
  });
  
  await test('GET Contact Messages (Admin)', async () => {
    const result = await apiCall('/contact/admin', { headers: authHeaders });
    if (!result.success || !Array.isArray(result.data.messages)) {
      throw new Error('Récupération messages échouée');
    }
    console.log(`   📊 ${result.data.messages.length} messages trouvés`);
    
    // Test mise à jour statut si on a des messages
    if (result.data.messages.length > 0) {
      const firstMessage = result.data.messages[0];
      const statusResult = await apiCall(`/contact/admin/${firstMessage.id}/status`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({ status: 'LU' })
      });
      
      if (!statusResult.success) {
        throw new Error('Mise à jour statut message échouée');
      }
      console.log(`   📊 Statut message mis à jour: LU`);
    }
  });
  
  // Résumé
  console.log('📊 === RÉSUMÉ DES TESTS ===');
  console.log(`Total: ${testResults.total}`);
  console.log(`✅ Réussis: ${testResults.passed}`);
  console.log(`❌ Échoués: ${testResults.failed}`);
  
  const successRate = ((testResults.passed / testResults.total) * 100).toFixed(1);
  console.log(`🎯 Taux de réussite: ${successRate}%`);
  
  if (testResults.failed === 0) {
    console.log('\n🎉 TOUTES LES APIs CRUD FONCTIONNENT CORRECTEMENT !');
  } else {
    console.log('\n⚠️ Certains tests ont échoué.');
  }
}

runTests().catch(error => {
  console.error('❌ Erreur générale:', error.message);
  process.exit(1);
});
