// Test simple de connexion à l'API
const testApiConnection = async () => {
  try {
    console.log('🔍 Test de connexion à l\'API...');
    
    const response = await fetch('http://localhost:3001/api/health');
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ API accessible');
      console.log('📊 Response:', data);
      
      // Test des projets publics
      const projectsResponse = await fetch('http://localhost:3001/api/projects');
      const projectsData = await projectsResponse.json();
      
      if (projectsResponse.ok) {
        console.log('✅ Endpoint projets accessible');
        console.log('📂 Projets:', projectsData.data?.projects?.length || 0);
      } else {
        console.log('❌ Endpoint projets non accessible');
      }
    } else {
      console.log('❌ API non accessible');
    }
  } catch (error) {
    console.log('❌ Erreur:', error.message);
  }
};

testApiConnection();
