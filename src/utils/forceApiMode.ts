// Utilitaire pour forcer l'utilisation de l'API réelle
export const forceApiMode = () => {
  // Supprimer le flag de mode fallback
  localStorage.removeItem('api_fallback_mode');
  
  // Afficher dans la console que l'API réelle est utilisée
  console.log('🔄 Mode API réelle forcé - connexion à la base de données');
  
  // Retourner true pour confirmer
  return true;
};

// Vérifier si on est en mode API réelle
export const isUsingRealApi = (): boolean => {
  return !localStorage.getItem('api_fallback_mode');
};

// Réinitialiser complètement l'état de l'application
export const resetAppState = () => {
  // Nettoyer le localStorage
  localStorage.removeItem('api_fallback_mode');
  localStorage.removeItem('isAuthenticated');
  localStorage.removeItem('adminUser');
  
  console.log('🔄 État de l\'application réinitialisé');
  
  // Recharger la page pour un état propre
  window.location.reload();
};
