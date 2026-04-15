import { supabase } from '@/integrations/supabase/client';
import { verifyToken, getTokenFromStorage } from '@/utils/jwt';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials extends LoginCredentials {
  displayName: string;
  role: 'teacher' | 'student';
}

export interface AuthResponse {
  success: boolean;
  error?: string;
  user?: any;
  token?: string;
  profile?: any;
}

export const authService = {
  // JWT-based login
  async loginWithJWT(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      // First authenticate with Supabase
      const { data, error } = await supabase.auth.signInWithPassword(credentials);
      
      if (error) {
        return { success: false, error: error.message };
      }

      if (!data.user) {
        return { success: false, error: 'Login failed' };
      }

      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', data.user.id)
        .single();

      if (profileError) {
        return { success: false, error: 'Failed to fetch user profile' };
      }

      return {
        success: true,
        user: data.user,
        profile,
      };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'An unexpected error occurred' 
      };
    }
  },

  // JWT-based signup
  async signupWithJWT(credentials: SignupCredentials): Promise<AuthResponse> {
    try {
      // Create user with Supabase
      const { data, error } = await supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
        options: {
          data: { 
            display_name: credentials.displayName, 
            role: credentials.role 
          },
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (!data.user) {
        return { success: false, error: 'Signup failed' };
      }

      // Create profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .upsert({
          user_id: data.user.id,
          display_name: credentials.displayName,
          role: credentials.role,
        })
        .select('*')
        .single();

      if (profileError) {
        return { success: false, error: 'Failed to create user profile' };
      }

      return {
        success: true,
        user: data.user,
        profile,
      };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'An unexpected error occurred' 
      };
    }
  },

  // Verify JWT token
  async verifyToken(token: string): Promise<AuthResponse> {
    try {
      const decoded = await verifyToken(token);
      
      if (!decoded) {
        return { success: false, error: 'Invalid token' };
      }

      // Get user profile to verify user still exists
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', decoded.userId)
        .single();

      if (profileError) {
        return { success: false, error: 'User not found' };
      }

      return {
        success: true,
        profile,
        token,
      };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Token verification failed' 
      };
    }
  },

  // Get current authenticated user from JWT
  async getCurrentUser(): Promise<AuthResponse> {
    const token = getTokenFromStorage();
    
    if (!token) {
      return { success: false, error: 'No token found' };
    }

    return this.verifyToken(token);
  },

  // Logout
  async logout(): Promise<AuthResponse> {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Logout failed' 
      };
    }
  },
};
