import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav';
import useAuthStore from '../../store/authStore';

export default function AppLayout() {
  const { fetchProfile, isAuthenticated } = useAuthStore();

  // Refresh user profile from backend on mount
  // This keeps localStorage data in sync with the DB
  useEffect(() => {
    if (isAuthenticated) {
      fetchProfile();
    }
  }, [isAuthenticated, fetchProfile]);

  return (
    <div className="page page--with-nav">
      <Outlet />
      <BottomNav />
    </div>
  );
}
