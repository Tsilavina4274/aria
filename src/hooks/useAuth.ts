import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi, TokenManager } from '@/services/api';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: any | null;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    user: null
  });
  const navigate = useNavigate();

  const checkAuthentication = async () => {
    try {
      const token = TokenManager.getToken();
      
      if (!token) {
        setAuthState({
          isAuthenticated: false,
          isLoading: false,
          user: null
        });
        return false;
      }

      const response = await adminApi.verifyToken();
      
      if (response.success) {
        setAuthState({
          isAuthenticated: true,
          isLoading: false,
          user: response.user || null
        });
        localStorage.setItem("isAuthenticated", "true");
        return true;
      } else {
        // Token invalide
        TokenManager.removeToken();
        localStorage.removeItem("isAuthenticated");
        setAuthState({
          isAuthenticated: false,
          isLoading: false,
          user: null
        });
        return false;
      }
    } catch (error) {
      console.error('Erreur vérification auth:', error);
      TokenManager.removeToken();
      localStorage.removeItem("isAuthenticated");
      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        user: null
      });
      return false;
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      
      const response = await adminApi.login(email, password);
      
      if (response.success) {
        setAuthState({
          isAuthenticated: true,
          isLoading: false,
          user: response.user
        });
        localStorage.setItem("isAuthenticated", "true");
        return response;
      } else {
        setAuthState({
          isAuthenticated: false,
          isLoading: false,
          user: null
        });
        return response;
      }
    } catch (error) {
      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        user: null
      });
      throw error;
    }
  };

  const logout = async () => {
    try {
      await adminApi.logout();
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    } finally {
      TokenManager.removeToken();
      localStorage.removeItem("isAuthenticated");
      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        user: null
      });
      navigate("/admin", { replace: true });
    }
  };

  const requireAuth = async () => {
    const isAuth = await checkAuthentication();
    if (!isAuth) {
      navigate("/admin", { replace: true });
    }
    return isAuth;
  };

  useEffect(() => {
    checkAuthentication();
  }, []);

  return {
    ...authState,
    login,
    logout,
    checkAuthentication,
    requireAuth
  };
};

export default useAuth;
