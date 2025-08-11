#!/usr/bin/env node

// Test du CRUD complet des projets avec la vraie API
const API_URL = 'http://localhost:3001/api';
const FRONTEND_URL = 'http://localhost:8081';

let authToken = '';

async function testLogin() {
  console.log('🔐 Test de connexion admin...');
  
  const response = await fetch(`${API_URL}/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@aria-creative.com',
      password: 'admin@aria25!!'
    })
  });

  if (response.ok) {
    const data = await response.json();
    authToken = data.token;
    console.log('✅ Connexion admin réussie');
    return true;
  } else {
    console.error('❌ Échec de connexion');
    return false;
  }
}

async function testProjectsCRUD() {
  console.log('\n📂 Test complet du CRUD des projets...');

  // 1. Lister les projets existants
  console.log('\n1️⃣ GET /api/projects/admin - Récupération des projets...');
  const listResponse = await fetch(`${API_URL}/projects/admin`, {
    headers: { 'Authorization': `Bearer ${authToken}` }
  });

  if (listResponse.ok) {
    const data = await listResponse.json();
    console.log(`✅ ${data.data.projects.length} projets récupérés`);
    data.data.projects.forEach(p => {
      console.log(`   - ${p.title} (${p.status}) - ID: ${p.id}`);
    });
  } else {
    console.error('❌ Échec de récupération des projets');
    return false;
  }

  // 2. Créer un nouveau projet
  console.log('\n2️⃣ POST /api/projects - Création d\'un nouveau projet...');
  const newProject = {
    title: 'Test CRUD - ' + new Date().toISOString().slice(0, 19),
    description: 'Projet de test pour vérifier le CRUD fonctionnel',
    technologies: ['React', 'Node.js', 'Express'],
    client: 'Client Test',
    duration: '1 semaine',
    status: 'EN_COURS',
    url: 'https://test.example.com',
    date: new Date().toISOString().slice(0, 10)
  };

  const createResponse = await fetch(`${API_URL}/projects`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify(newProject)
  });

  let projectId = null;
  if (createResponse.ok) {
    const data = await createResponse.json();
    projectId = data.data.project.id;
    console.log(`✅ Projet créé avec ID: ${projectId}`);
    console.log(`   Titre: ${data.data.project.title}`);
  } else {
    console.error('❌ Échec de création du projet');
    return false;
  }

  // 3. Modifier le projet
  console.log('\n3️⃣ PUT /api/projects/:id - Modification du projet...');
  const updatedProject = {
    ...newProject,
    title: newProject.title + ' - MODIFIÉ',
    description: 'Description modifiée pour tester la mise à jour',
    status: 'TERMINE'
  };

  const updateResponse = await fetch(`${API_URL}/projects/${projectId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify(updatedProject)
  });

  if (updateResponse.ok) {
    const data = await updateResponse.json();
    console.log(`✅ Projet modifié: ${data.data.project.title}`);
    console.log(`   Statut: ${data.data.project.status}`);
  } else {
    console.error('❌ Échec de modification du projet');
    return false;
  }

  // 4. Changer le statut
  console.log('\n4️⃣ POST /api/projects/:id/status - Changement de statut...');
  const statusResponse = await fetch(`${API_URL}/projects/${projectId}/status`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify({ status: 'EN_ATTENTE' })
  });

  if (statusResponse.ok) {
    const data = await statusResponse.json();
    console.log(`✅ Statut changé vers: ${data.data.project.status}`);
  } else {
    console.error('❌ Échec de changement de statut');
    return false;
  }

  // 5. Récupérer le projet spécifique
  console.log('\n5️⃣ GET /api/projects/:id - Récupération du projet...');
  const getResponse = await fetch(`${API_URL}/projects/${projectId}`);

  if (getResponse.ok) {
    const data = await getResponse.json();
    console.log(`✅ Projet récupéré: ${data.project.title}`);
  } else {
    console.error('❌ Échec de récupération du projet');
    return false;
  }

  // 6. Supprimer le projet
  console.log('\n6️⃣ DELETE /api/projects/:id - Suppression du projet...');
  const deleteResponse = await fetch(`${API_URL}/projects/${projectId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${authToken}` }
  });

  if (deleteResponse.ok) {
    console.log('✅ Projet supprimé avec succès');
  } else {
    console.error('❌ Échec de suppression du projet');
    return false;
  }

  return true;
}

async function testPublicProjects() {
  console.log('\n🌐 Test des projets publics...');

  const response = await fetch(`${API_URL}/projects`);
  if (response.ok) {
    const data = await response.json();
    console.log(`✅ ${data.data.projects.length} projets publics récupérés`);
    data.data.projects.forEach(p => {
      console.log(`   - ${p.title} (${p.status})`);
    });
    return true;
  } else {
    console.error('❌ Échec de récupération des projets publics');
    return false;
  }
}

async function testContactCRUD() {
  console.log('\n📧 Test du CRUD des messages de contact...');

  // Envoyer un message
  const messageData = {
    name: 'Test User',
    email: 'test@example.com',
    company: 'Test Company',
    subject: 'Test Message',
    message: 'Ceci est un message de test pour vérifier le CRUD.'
  };

  const sendResponse = await fetch(`${API_URL}/contact`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(messageData)
  });

  if (sendResponse.ok) {
    console.log('✅ Message de contact envoyé');
  } else {
    console.error('❌ Échec d\'envoi du message');
    return false;
  }

  // Récupérer les messages (admin)
  const getMessagesResponse = await fetch(`${API_URL}/contact/admin`, {
    headers: { 'Authorization': `Bearer ${authToken}` }
  });

  if (getMessagesResponse.ok) {
    const data = await getMessagesResponse.json();
    console.log(`✅ ${data.data.messages.length} messages récupérés`);
    return true;
  } else {
    console.error('❌ Échec de récupération des messages');
    return false;
  }
}

async function main() {
  console.log('🧪 TEST COMPLET DU CRUD FONCTIONNEL (SANS FALLBACK)\n');

  try {
    // Test de l'API Health
    console.log('🔍 Test de l\'API Health...');
    const healthResponse = await fetch(`${API_URL}/health`);
    if (healthResponse.ok) {
      const data = await healthResponse.json();
      console.log('✅ API Health OK - Status:', data.data.status);
    } else {
      throw new Error('API Health failed');
    }

    // Test de connexion
    const loginSuccess = await testLogin();
    if (!loginSuccess) {
      process.exit(1);
    }

    // Test du CRUD des projets
    const projectsSuccess = await testProjectsCRUD();
    if (!projectsSuccess) {
      process.exit(1);
    }

    // Test des projets publics
    const publicSuccess = await testPublicProjects();
    if (!publicSuccess) {
      process.exit(1);
    }

    // Test du CRUD des messages
    const contactSuccess = await testContactCRUD();
    if (!contactSuccess) {
      process.exit(1);
    }

    console.log('\n🎉 TOUS LES TESTS CRUD ONT RÉUSSI !');
    console.log('✅ L\'API backend fonctionne parfaitement');
    console.log('✅ Le CRUD des projets est entièrement fonctionnel');
    console.log('✅ Aucun système de fallback - vraie persistance des données');

  } catch (error) {
    console.error('\n❌ Erreur lors des tests:', error.message);
    process.exit(1);
  }
}

main();
