// Script de test pour vérifier le CRUD des projets via l'API admin

const API_BASE = 'http://localhost:3001/api';

// Données de connexion admin (depuis le .env)
const ADMIN_CREDENTIALS = {
  email: 'admin@aria-creative.com',
  password: 'admin@aria25!!'
};

// Test des opérations CRUD
async function testCRUD() {
  console.log('🧪 Test du CRUD des projets via l\'API...\n');

  let authToken = '';

  try {
    // 1. Connexion admin
    console.log('1️⃣ Test de connexion admin...');
    const loginResponse = await fetch(`${API_BASE}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ADMIN_CREDENTIALS)
    });

    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status}`);
    }

    const loginData = await loginResponse.json();
    authToken = loginData.token;
    console.log('✅ Connexion admin réussie\n');

    // 2. Récupérer les projets existants
    console.log('2️⃣ Test de récupération des projets...');
    const getProjectsResponse = await fetch(`${API_BASE}/projects/admin`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    if (!getProjectsResponse.ok) {
      throw new Error(`Get projects failed: ${getProjectsResponse.status}`);
    }

    const projectsData = await getProjectsResponse.json();
    console.log(`✅ ${projectsData.data.projects.length} projets récupérés\n`);

    // 3. Créer un nouveau projet
    console.log('3️⃣ Test de création d\'un projet...');
    const newProject = {
      title: 'Test Project - ' + Date.now(),
      description: 'Projet de test pour vérifier le CRUD',
      technologies: ['React', 'TypeScript', 'Node.js'],
      client: 'Client Test',
      duration: '1 mois',
      status: 'EN_COURS',
      url: 'https://test-project.com',
      date: new Date().toISOString().slice(0, 10)
    };

    const createResponse = await fetch(`${API_BASE}/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(newProject)
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      throw new Error(`Create project failed: ${createResponse.status} - ${errorText}`);
    }

    const createdProject = await createResponse.json();
    const projectId = createdProject.data.project.id;
    console.log(`✅ Projet créé avec ID: ${projectId}\n`);

    // 4. Mettre à jour le projet
    console.log('4️⃣ Test de mise à jour du projet...');
    const updateData = {
      ...newProject,
      title: 'Test Project UPDATED - ' + Date.now(),
      status: 'TERMINE'
    };

    const updateResponse = await fetch(`${API_BASE}/projects/${projectId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(updateData)
    });

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      throw new Error(`Update project failed: ${updateResponse.status} - ${errorText}`);
    }

    const updatedProject = await updateResponse.json();
    console.log(`✅ Projet mis à jour: ${updatedProject.data.project.title}\n`);

    // 5. Changer le statut
    console.log('5️⃣ Test de changement de statut...');
    const statusResponse = await fetch(`${API_BASE}/projects/${projectId}/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ status: 'EN_ATTENTE' })
    });

    if (!statusResponse.ok) {
      const errorText = await statusResponse.text();
      throw new Error(`Update status failed: ${statusResponse.status} - ${errorText}`);
    }

    const statusProject = await statusResponse.json();
    console.log(`✅ Statut changé vers: ${statusProject.data.project.status}\n`);

    // 6. Supprimer le projet
    console.log('6️⃣ Test de suppression du projet...');
    const deleteResponse = await fetch(`${API_BASE}/projects/${projectId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    if (!deleteResponse.ok) {
      const errorText = await deleteResponse.text();
      throw new Error(`Delete project failed: ${deleteResponse.status} - ${errorText}`);
    }

    console.log('✅ Projet supprimé avec succès\n');

    console.log('🎉 Tous les tests CRUD ont réussi !');

  } catch (error) {
    console.error('❌ Erreur lors des tests:', error.message);
    process.exit(1);
  }
}

// Exécuter les tests
testCRUD();
