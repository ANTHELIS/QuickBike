import { IoDocumentTextOutline, IoSchoolOutline, IoHeadsetOutline } from 'react-icons/io5';
import './Onboarding.css';

const NAV_ITEMS = [
  { key: 'registration', label: 'Registration', icon: IoDocumentTextOutline },
  { key: 'training', label: 'Training', icon: IoSchoolOutline },
  { key: 'support', label: 'Support', icon: IoHeadsetOutline },
];

export default function OnboardingNav({ active = 'registration' }) {
  return (
    <div className="onboarding-nav">
      {NAV_ITEMS.map(({ key, label, icon: Icon }) => (
        <button
          key={key}
          className={`onboarding-nav__item ${active === key ? 'onboarding-nav__item--active' : ''}`}
          id={`onboarding-nav-${key}`}
        >
          <Icon className="onboarding-nav__icon" />
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
}
