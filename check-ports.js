#!/usr/bin/env node

// Script pour vérifier que les services sont accessibles sur les bons ports
const BACKEND_URL = 'http://localhost:3001/api/health';
const FRONTEND_URL = 'http://localhost:8081';

async function checkService(url, name) {
  try {
    console.log(`🔍 Vérification de ${name}...`);
    const response = await fetch(url);
    
    if (response.ok) {
      console.log(`✅ ${name} est accessible sur ${url}`);
      return true;
    } else {
      console.log(`❌ ${name} répond avec le statut ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ ${name} n'est pas accessible : ${error.message}`);
    return false;
  }
}

async function checkFrontend(url) {
  try {
    console.log(`🔍 Vérification du frontend...`);
    const response = await fetch(url);
    
    if (response.ok) {
      console.log(`✅ Frontend est accessible sur ${url}`);
      return true;
    } else {
      console.log(`❌ Frontend répond avec le statut ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Frontend n'est pas accessible : ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🧪 Vérification des services CRUD\n');
  
  const backendOk = await checkService(BACKEND_URL, 'Backend API (port 3001)');
  const frontendOk = await checkFrontend(FRONTEND_URL);
  
  console.log('\n📊 Résultats :');
  
  if (backendOk && frontendOk) {
    console.log('🎉 Tous les services sont accessibles !');
    console.log(`\n🌐 Accédez à l'application :`);
    console.log(`   - Frontend : ${FRONTEND_URL}`);
    console.log(`   - Admin    : ${FRONTEND_URL}/admin`);
    console.log(`   - API      : ${BACKEND_URL.replace('/health', '')}`);
    console.log(`\n👤 Credentials admin :`);
    console.log(`   Email    : admin@aria-creative.com`);
    console.log(`   Password : admin@aria25!!`);
  } else {
    console.log('❌ Certains services ne sont pas accessibles');
    
    if (!backendOk) {
      console.log('\n🔧 Pour démarrer le backend :');
      console.log('   cd api && npm start');
    }
    
    if (!frontendOk) {
      console.log('\n🔧 Pour démarrer le frontend :');
      console.log('   npm run dev');
    }
    
    process.exit(1);
  }
}

main();
