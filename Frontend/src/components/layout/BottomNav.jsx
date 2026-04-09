import { Link, useLocation } from 'react-router-dom';
import { HiOutlineHome } from 'react-icons/hi2';
import { MdOutlineHistory, MdOutlinePersonOutline } from 'react-icons/md';
import { RiMotorbikeFill } from 'react-icons/ri';
import useAuthStore from '../../store/authStore';
import './BottomNav.css';

const userTabs = [
  { path: '/home', label: 'Ride', icon: RiMotorbikeFill },
  { path: '/activity', label: 'Activity', icon: MdOutlineHistory },
  { path: '/account', label: 'Account', icon: MdOutlinePersonOutline },
];

const captainTabs = [
  { path: '/captain/home', label: 'Home', icon: HiOutlineHome },
  { path: '/activity', label: 'Activity', icon: MdOutlineHistory },
  { path: '/account', label: 'Account', icon: MdOutlinePersonOutline },
];

export default function BottomNav() {
  const location = useLocation();
  const { userType } = useAuthStore();
  const tabs = userType === 'captain' ? captainTabs : userTabs;

  return (
    <nav className="bottom-nav" id="bottom-navigation">
      {tabs.map(({ path, label, icon: Icon }) => {
        const isActive = location.pathname === path;
        return (
          <Link
            key={path}
            to={path}
            className={`bottom-nav__item ${isActive ? 'bottom-nav__item--active' : ''}`}
            id={`nav-${label.toLowerCase()}`}
          >
            <Icon className="bottom-nav__icon" />
            <span className="bottom-nav__label">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
