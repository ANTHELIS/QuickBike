import { useNavigate } from 'react-router-dom';
import { HiOutlineBars3 } from 'react-icons/hi2';
import { IoChevronBack, IoClose } from 'react-icons/io5';
import useAuthStore from '../../store/authStore';

export default function Header({ title, showBack, showClose, onClose, minimal }) {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const initials = user?.fullname
    ? `${user.fullname.firstname?.[0] || ''}${user.fullname.lastname?.[0] || ''}`
    : '?';

  if (minimal) {
    return (
      <header className="header">
        {showBack ? (
          <button className="header__menu-btn" onClick={() => navigate(-1)} id="btn-back">
            <IoChevronBack size={22} />
          </button>
        ) : showClose ? (
          <button className="header__menu-btn" onClick={onClose || (() => navigate(-1))} id="btn-close">
            <IoClose size={22} />
          </button>
        ) : (
          <div style={{ width: 40 }} />
        )}
        <span className="header__logo">{title || 'QuickBike'}</span>
        <div className="header__avatar" id="header-avatar">
          {initials}
        </div>
      </header>
    );
  }

  return (
    <header className="header">
      <button className="header__menu-btn" onClick={() => {}} id="btn-menu">
        <HiOutlineBars3 size={24} />
      </button>
      <span className="header__logo">QuickBike</span>
      <div
        className="header__avatar"
        onClick={() => navigate('/account')}
        style={{ cursor: 'pointer' }}
        id="header-avatar"
      >
        {initials}
      </div>
    </header>
  );
}
