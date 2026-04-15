import { useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  getTokenFromStorage, 
  verifyToken, 
  isTokenExpired, 
  removeTokenFromStorage 
} from '@/utils/jwt';

export const useJwtAuth = () => {
  const { token, refreshToken, isAuthenticated } = useAuth();

  const getAuthToken = useCallback(() => {
    return getTokenFromStorage();
  }, []);

  const validateToken = useCallback(async () => {
    const currentToken = getTokenFromStorage();
    
    if (!currentToken) {
      return false;
    }

    if (isTokenExpired(currentToken)) {
      removeTokenFromStorage();
      return false;
    }

    const decoded = await verifyToken(currentToken);
    return !!decoded;
  }, []);

  const getTokenPayload = useCallback(async () => {
    const currentToken = getTokenFromStorage();
    
    if (!currentToken || isTokenExpired(currentToken)) {
      return null;
    }

    return await verifyToken(currentToken);
  }, []);

  const ensureValidToken = useCallback(async (): Promise<boolean> => {
    if (!token) {
      return false;
    }

    if (isTokenExpired(token)) {
      return await refreshToken();
    }

    return true;
  }, [token, refreshToken]);

  const getAuthHeaders = useCallback(() => {
    const currentToken = getTokenFromStorage();
    
    if (!currentToken || isTokenExpired(currentToken)) {
      return {};
    }

    return {
      'Authorization': `Bearer ${currentToken}`,
      'Content-Type': 'application/json',
    };
  }, []);

  return {
    token,
    isAuthenticated,
    getAuthToken,
    validateToken,
    getTokenPayload,
    ensureValidToken,
    getAuthHeaders,
    refreshToken,
  };
};

export default useJwtAuth;
