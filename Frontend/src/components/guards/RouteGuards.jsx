import { Navigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';

export function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

export function GuestRoute({ children }) {
  const { isAuthenticated, userType } = useAuthStore();
  if (isAuthenticated) {
    const redirect = userType === 'captain' ? '/captain/home' : '/home';
    return <Navigate to={redirect} replace />;
  }
  return children;
}
