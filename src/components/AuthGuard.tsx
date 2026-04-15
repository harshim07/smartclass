import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: 'teacher' | 'student';
  fallbackPath?: string;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ 
  children, 
  requiredRole, 
  fallbackPath = '/login' 
}) => {
  const { user, profile, loading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (!loading) {
      setIsChecking(false);
      
      if (!isAuthenticated()) {
        navigate(fallbackPath);
        return;
      }

      if (requiredRole && profile?.role !== requiredRole) {
        const redirectPath = profile?.role === 'teacher' ? '/teacher/dashboard' : '/student/dashboard';
        navigate(redirectPath);
        return;
      }
    }
  }, [loading, isAuthenticated, profile, requiredRole, navigate, fallbackPath]);

  if (loading || isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated()) {
    return null;
  }

  if (requiredRole && profile?.role !== requiredRole) {
    return null;
  }

  return <>{children}</>;
};

export default AuthGuard;
