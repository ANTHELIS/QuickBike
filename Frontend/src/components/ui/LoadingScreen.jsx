import './LoadingScreen.css';

export default function LoadingScreen() {
  return (
    <div className="loading-screen" id="loading-screen">
      <div className="loading-screen__content">
        <div className="loading-screen__logo">
          <div className="loading-screen__icon">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <circle cx="24" cy="24" r="22" stroke="#E87A20" strokeWidth="3" fill="none" opacity="0.15"/>
              <path d="M16 32C16 32 18 28 24 28C30 28 32 32 32 32" stroke="#E87A20" strokeWidth="2.5" strokeLinecap="round"/>
              <circle cx="16" cy="32" r="6" stroke="#E87A20" strokeWidth="2.5" fill="none"/>
              <circle cx="32" cy="32" r="6" stroke="#E87A20" strokeWidth="2.5" fill="none"/>
              <path d="M20 20L24 12L28 20" stroke="#E87A20" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="loading-screen__title">QuickBike</span>
        </div>
        <div className="loading-screen__bar">
          <div className="loading-screen__bar-fill" />
        </div>
      </div>
    </div>
  );
}
