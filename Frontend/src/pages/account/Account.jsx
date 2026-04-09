import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { IoLogOutOutline, IoChevronForward, IoPersonOutline, IoShieldCheckmarkOutline, IoWalletOutline, IoHelpCircleOutline, IoSettingsOutline, IoInformationCircleOutline } from 'react-icons/io5';
import useAuthStore from '../../store/authStore';
import useRideStore from '../../store/rideStore';
import toast from 'react-hot-toast';
import './Account.css';

const MENU_ITEMS = [
  { icon: IoPersonOutline, label: 'Edit Profile', desc: 'Name, email, phone' },
  { icon: IoWalletOutline, label: 'Payment Methods', desc: 'Cards, UPI, wallet' },
  { icon: IoShieldCheckmarkOutline, label: 'Safety', desc: 'Emergency contacts, trusted people' },
  { icon: IoSettingsOutline, label: 'Settings', desc: 'Notifications, language, theme' },
  { icon: IoHelpCircleOutline, label: 'Help & Support', desc: 'FAQs, contact us' },
  { icon: IoInformationCircleOutline, label: 'About', desc: 'Version 2.1.0' },
];

export default function Account() {
  const navigate = useNavigate();
  const { user, userType, logout } = useAuthStore();
  const { userStats, statsLoading, fetchUserStats } = useRideStore();

  useEffect(() => {
    fetchUserStats(userType);
  }, [fetchUserStats, userType]);

  const name = user?.fullname
    ? `${user.fullname.firstname} ${user.fullname.lastname || ''}`
    : 'User';
  const initials = user?.fullname
    ? `${user.fullname.firstname?.[0] || ''}${user.fullname.lastname?.[0] || ''}`
    : '?';
  const email = user?.email || 'user@quickbike.com';

  // Use real stats from backend, or sensible defaults while loading
  const totalRides = userStats?.totalRides ?? '—';
  const totalSpent = userStats?.totalSpent != null ? `₹${userStats.totalSpent.toLocaleString()}` : '—';
  const rating = userStats?.rating ?? '—';

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out');
    navigate('/login');
  };

  return (
    <>
      <div className="account-content">
        {/* Profile Header */}
        <div className="account-header animate-scaleIn">
          <div className="account-avatar">
            <span>{initials}</span>
          </div>
          <h2 className="account-name">{name}</h2>
          <p className="account-email">{email}</p>
          <div className="account-role-badge">
            {userType === 'captain' ? '🏍️ Captain' : '👤 Rider'}
          </div>
        </div>

        {/* Stats */}
        <div className="account-stats animate-slideUp" style={{ animationDelay: '80ms' }}>
          <div className="account-stat">
            <div className="account-stat__value">{statsLoading ? '...' : totalRides}</div>
            <div className="account-stat__label">Total Rides</div>
          </div>
          <div className="account-stat__divider" />
          <div className="account-stat">
            <div className="account-stat__value">{statsLoading ? '...' : totalSpent}</div>
            <div className="account-stat__label">{userType === 'captain' ? 'Total Earned' : 'Total Spent'}</div>
          </div>
          <div className="account-stat__divider" />
          <div className="account-stat">
            <div className="account-stat__value">{statsLoading ? '...' : rating}</div>
            <div className="account-stat__label">Rating</div>
          </div>
        </div>

        {/* Menu */}
        <div className="account-menu stagger-children" style={{ animationDelay: '120ms' }}>
          {MENU_ITEMS.map(({ icon: Icon, label, desc }) => (
            <button key={label} className="account-menu-item" id={`menu-${label.toLowerCase().replace(/\s/g, '-')}`}>
              <div className="account-menu-item__icon">
                <Icon size={20} />
              </div>
              <div className="account-menu-item__info">
                <div className="account-menu-item__label">{label}</div>
                <div className="account-menu-item__desc">{desc}</div>
              </div>
              <IoChevronForward size={16} className="text-muted" />
            </button>
          ))}
        </div>

        {/* Logout */}
        <button className="account-logout animate-slideUp" onClick={handleLogout} id="btn-logout">
          <IoLogOutOutline size={20} />
          Sign Out
        </button>
      </div>
    </>
  );
}
