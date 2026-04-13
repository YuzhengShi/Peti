import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useOnboarding } from '../hooks/useOnboarding';

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { hasPet, onboarded, loading: onboardingLoading } = useOnboarding();

  if (authLoading || onboardingLoading) {
    return <div className="spinner">loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!onboarded) {
    if (!hasPet) {
      return <Navigate to="/pet/new" replace />;
    }
    return <Navigate to="/test" replace />;
  }

  if (user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
