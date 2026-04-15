import { SignJWT, jwtVerify, decodeJwt } from 'jose';

const JWT_SECRET = import.meta.env.VITE_JWT_SECRET || 'fallback-secret-key-for-development';
const JWT_EXPIRES_IN = '7d';

// Convert string secret to Uint8Array for jose
const getSecretKey = () => new TextEncoder().encode(JWT_SECRET);

export interface JWTPayload {
  userId: string;
  email: string;
  role: 'teacher' | 'student';
  displayName: string;
  iat?: number;
  exp?: number;
}

export const generateToken = async (payload: Omit<JWTPayload, 'iat' | 'exp'>): Promise<string> => {
  const secretKey = getSecretKey();
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRES_IN)
    .sign(secretKey);
  return token;
};

export const verifyToken = async (token: string): Promise<JWTPayload | null> => {
  try {
    const secretKey = getSecretKey();
    const { payload } = await jwtVerify(token, secretKey);
    
    // Convert jose payload to our JWTPayload interface
    const jwtPayload: JWTPayload = {
      userId: payload.userId as string,
      email: payload.email as string,
      role: payload.role as 'teacher' | 'student',
      displayName: payload.displayName as string,
      iat: payload.iat,
      exp: payload.exp,
    };
    
    return jwtPayload;
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
};

export const isTokenExpired = (token: string): boolean => {
  try {
    const decoded = decodeJwt(token);
    if (!decoded || !decoded.exp) return true;
    
    const currentTime = Math.floor(Date.now() / 1000);
    return decoded.exp < currentTime;
  } catch (error) {
    return true;
  }
};

export const getTokenFromStorage = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('jwt_token');
  }
  return null;
};

export const setTokenToStorage = (token: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('jwt_token', token);
  }
};

export const removeTokenFromStorage = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('jwt_token');
  }
};

export const refreshAccessToken = async (token: string): Promise<string | null> => {
  const payload = await verifyToken(token);
  if (!payload) return null;
  
  const { iat, exp, ...newPayload } = payload;
  return await generateToken(newPayload);
};
