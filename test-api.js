#!/usr/bin/env node

// Test du CRUD avec la vraie API
const API_URL = 'http://localhost:3001/api';

// Credentials admin
const ADMIN_EMAIL = 'admin@aria-creative.com';
const ADMIN_PASSWORD = 'admin@aria25!!';

let authToken = '';

async function login() {
  console.log('🔐 Test de connexion admin...');
  
  const response = await fetch(`${API_URL}/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    })
  });

  if (response.ok) {
    const data = await response.json();
    authToken = data.token;
    console.log('✅ Connexion admin réussie');
    return true;
  } else {
    const error = await response.text();
    console.error('❌ Échec de connexion:', error);
    return false;
  }
}

async function testProjectsCRUD() {
  console.log('\n📂 Test du CRUD des projets...');

  // 1. Lister les projets existants
  console.log('1️⃣ Récupération des projets admin...');
  const listResponse = await fetch(`${API_URL}/projects/admin`, {
    headers: { 'Authorization': `Bearer ${authToken}` }
  });

  if (listResponse.ok) {
    const data = await listResponse.json();
    console.log(`✅ ${data.data.projects.length} projets récupérés de la base`);
    data.data.projects.forEach(p => {
      console.log(`   - ${p.title} (${p.status})`);
    });
  } else {
    console.error('❌ Échec de récupération des projets');
    return false;
  }

  // 2. Créer un nouveau projet
  console.log('\n2️⃣ Création d\'un nouveau projet...');
  const newProject = {
    title: 'Test CRUD - ' + Date.now(),
    description: 'Projet de test pour vérifier le CRUD avec la vraie base de données',
    technologies: ['React', 'Node.js', 'PostgreSQL'],
    client: 'Test Client',
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
  } else {
    console.error('❌ Échec de création du projet');
    return false;
  }

  // 3. Modifier le projet
  console.log('\n3️⃣ Modification du projet...');
  const updatedProject = {
    ...newProject,
    title: newProject.title + ' - MODIFIÉ',
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
  } else {
    console.error('❌ Échec de modification du projet');
    return false;
  }

  // 4. Changer le statut
  console.log('\n4️⃣ Changement de statut...');
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

  // 5. Supprimer le projet
  console.log('\n5️⃣ Suppression du projet...');
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

async function testMessages() {
  console.log('\n📧 Test de la gestion des messages...');

  // Récupérer les messages
  const messagesResponse = await fetch(`${API_URL}/contact/admin`, {
    headers: { 'Authorization': `Bearer ${authToken}` }
  });

  if (messagesResponse.ok) {
    const data = await messagesResponse.json();
    console.log(`✅ ${data.data.messages.length} messages récupérés de la base`);
    data.data.messages.forEach(m => {
      console.log(`   - ${m.subject} de ${m.name} (${m.status})`);
    });
    return true;
  } else {
    console.error('❌ Échec de récupération des messages');
    return false;
  }
}

async function main() {
  console.log('🧪 Test du CRUD avec la vraie base de données\n');

  try {
    // Test de connexion
    const loginSuccess = await login();
    if (!loginSuccess) {
      process.exit(1);
    }

    // Test du CRUD des projets
    const projectsSuccess = await testProjectsCRUD();
    if (!projectsSuccess) {
      process.exit(1);
    }

    // Test des messages
    const messagesSuccess = await testMessages();
    if (!messagesSuccess) {
      process.exit(1);
    }

    console.log('\n🎉 Tous les tests ont réussi ! Le CRUD fonctionne avec la vraie base de données.');

  } catch (error) {
    console.error('\n❌ Erreur lors des tests:', error.message);
    process.exit(1);
  }
}

main();
