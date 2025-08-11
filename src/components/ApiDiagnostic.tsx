import { useState, useEffect } from 'react';
import { healthApi, projectsApi, contactApi } from '@/services/api';
import { isInFallbackMode } from '@/services/apiMock';

const ApiDiagnostic = () => {
  const [diagnosis, setDiagnosis] = useState({
    health: 'checking',
    projects: 'checking',
    contact: 'checking',
    fallbackMode: false
  });

  const runDiagnostic = async () => {
    console.log('🔍 Diagnostic de l\'API en cours...');
    
    const results = {
      health: 'error',
      projects: 'error', 
      contact: 'error',
      fallbackMode: isInFallbackMode()
    };

    // Test Health
    try {
      const healthResponse = await healthApi.checkHealth();
      results.health = healthResponse.success ? 'success' : 'error';
      console.log('✅ Health API:', healthResponse.success ? 'OK' : 'FAIL');
    } catch (error) {
      console.log('❌ Health API: FAIL', error.message);
    }

    // Test Projects
    try {
      const projectsResponse = await projectsApi.getAllProjects();
      results.projects = projectsResponse.success ? 'success' : 'error';
      console.log('✅ Projects API:', projectsResponse.success ? `OK (${projectsResponse.data?.projects?.length || 0} projets)` : 'FAIL');
    } catch (error) {
      console.log('❌ Projects API: FAIL', error.message);
    }

    // Test Contact
    try {
      const contactResponse = await contactApi.getAllMessages();
      results.contact = contactResponse.success ? 'success' : 'error';
      console.log('✅ Contact API:', contactResponse.success ? `OK (${contactResponse.data?.messages?.length || 0} messages)` : 'FAIL');
    } catch (error) {
      console.log('❌ Contact API: FAIL', error.message);
    }

    setDiagnosis(results);
    
    console.log('📊 Diagnostic terminé:', results);
  };

  useEffect(() => {
    runDiagnostic();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'checking': return '🔄';
      default: return '❓';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-400';
      case 'error': return 'text-red-400';
      case 'checking': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="bg-black/20 backdrop-blur-sm border border-gray-700 rounded-lg p-4 mb-6">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-semibold text-orange-400">🔧 Diagnostic API</h3>
        <button 
          onClick={runDiagnostic}
          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition"
        >
          Relancer
        </button>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div className={`${getStatusColor(diagnosis.health)}`}>
          {getStatusIcon(diagnosis.health)} Health API
        </div>
        <div className={`${getStatusColor(diagnosis.projects)}`}>
          {getStatusIcon(diagnosis.projects)} Projects API
        </div>
        <div className={`${getStatusColor(diagnosis.contact)}`}>
          {getStatusIcon(diagnosis.contact)} Contact API
        </div>
        <div className={diagnosis.fallbackMode ? 'text-orange-400' : 'text-green-400'}>
          {diagnosis.fallbackMode ? '⚠️ Mode Fallback' : '✅ API Réelle'}
        </div>
      </div>
      
      {(diagnosis.health === 'success' && diagnosis.projects === 'success' && diagnosis.contact === 'success' && !diagnosis.fallbackMode) && (
        <div className="mt-3 p-2 bg-green-900/20 border border-green-500/30 rounded text-green-400 text-sm">
          🎉 Toutes les APIs fonctionnent correctement avec la base de données !
        </div>
      )}
    </div>
  );
};

export default ApiDiagnostic;
