import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { adminApi, TokenManager } from "@/services/api";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const verifyAuthentication = async () => {
      try {
        // Vérifier si on a un token
        const token = TokenManager.getToken();
        if (!token) {
          setIsAuthenticated(false);
          setIsLoading(false);
          return;
        }

        // Vérifier la validité du token via l'API
        const response = await adminApi.verifyToken();

        if (response.success) {
          setIsAuthenticated(true);
          // Maintenir la compatibilité avec l'ancien système
          localStorage.setItem("isAuthenticated", "true");
        } else {
          // Token invalide
          setIsAuthenticated(false);
          TokenManager.removeToken();
          localStorage.removeItem("isAuthenticated");
        }
      } catch (error) {
        console.error('Erreur vérification auth:', error);
        // En cas d'erreur (token expiré, network error, etc.)
        setIsAuthenticated(false);
        TokenManager.removeToken();
        localStorage.removeItem("isAuthenticated");
      } finally {
        setIsLoading(false);
      }
    };

    verifyAuthentication();
  }, []);

  // Afficher un loader pendant la vérification
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-white">Vérification de l'authentification...</p>
        </div>
      </div>
    );
  }

  // Rediriger vers la page de login si pas authentifié
  if (!isAuthenticated) {
    return <Navigate to="/admin" replace />;
  }

  // Afficher le contenu protégé si authentifié
  return <>{children}</>;
};

export default ProtectedRoute;
