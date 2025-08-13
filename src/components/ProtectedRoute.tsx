import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();

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
