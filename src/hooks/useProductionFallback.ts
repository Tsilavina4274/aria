import { useEffect } from 'react';

export const useProductionFallback = () => {
  useEffect(() => {
    // En production (pas en mode développement), activer automatiquement le mode fallback
    if (!import.meta.env.DEV) {
      // Vérifier si on est vraiment en production (URL contient fly.dev ou autre)
      const isProductionDomain = window.location.hostname.includes('fly.dev') || 
                                 window.location.hostname.includes('vercel.app') ||
                                 window.location.hostname.includes('netlify.app') ||
                                 (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1');
      
      if (isProductionDomain) {
        console.log('🌐 Mode production détecté - Activation du mode fallback');
        localStorage.setItem('api_fallback_mode', 'true');
      }
    }
  }, []);
};
