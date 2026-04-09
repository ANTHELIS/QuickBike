import { useState, useEffect, useCallback } from 'react';
import { IoLocationOutline, IoPowerOutline, IoCheckmarkCircle, IoWalletOutline, IoTrendingUp } from 'react-icons/io5';
import { RiMotorbikeFill } from 'react-icons/ri';
import Header from '../../components/layout/Header';
import { useSocket } from '../../context/SocketContext';
import { rideAPI } from '../../api/services';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';
import './CaptainHome.css';

export default function CaptainHome() {
  const { user } = useAuthStore();
  const { isConnected, updateLocation, updateCaptainStatus } = useSocket();
  const [isOnline, setIsOnline] = useState(false);
  const [newRide, setNewRide] = useState(null);
  const [earnings] = useState({ today: 1250, rides: 7, hours: 4.5 });

  const captainName = user?.fullname?.firstname || 'Captain';

  // Listen for incoming rides
  useEffect(() => {
    const handler = (e) => setNewRide(e.detail);
    window.addEventListener('quickbike:new-ride', handler);
    return () => window.removeEventListener('quickbike:new-ride', handler);
  }, []);

  // Update location when online
  useEffect(() => {
    if (!isOnline) return;
    const watchId = navigator.geolocation?.watchPosition(
      (pos) => updateLocation(pos.coords.latitude, pos.coords.longitude),
      () => {},
      { enableHighAccuracy: true, maximumAge: 10000 }
    );
    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, [isOnline, updateLocation]);

  const toggleOnline = useCallback(() => {
    setIsOnline((prev) => {
      const next = !prev;
      // Toggle captain status in the DB via socket
      updateCaptainStatus(next ? 'active' : 'inactive');
      toast.success(next ? 'You are now online!' : 'You are offline');
      return next;
    });
  }, [updateCaptainStatus]);

  const acceptRide = async () => {
    if (!newRide?._id) return;
    try {
      await rideAPI.confirm(newRide._id);
      toast.success('Ride accepted!');
      setNewRide(null);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const declineRide = () => setNewRide(null);

  return (
    <>
      <Header />

      <div className="captain-home-content">
        {/* Greeting */}
        <div className="captain-greeting animate-slideUp">
          <h1 className="captain-greeting__name">Hello, {captainName} 👋</h1>
          <p className="captain-greeting__status">
            {isOnline ? (
              <><span className="captain-status-dot captain-status-dot--online" /> Online — Waiting for rides</>
            ) : (
              <><span className="captain-status-dot" /> Offline</>
            )}
          </p>
        </div>

        {/* Go Online / Offline */}
        <button
          className={`captain-toggle-btn ${isOnline ? 'captain-toggle-btn--online' : ''}`}
          onClick={toggleOnline}
          id="btn-toggle-online"
        >
          <IoPowerOutline size={24} />
          <span>{isOnline ? 'Go Offline' : 'Go Online'}</span>
        </button>

        {/* Earnings Card */}
        <div className="captain-earnings-card animate-slideUp" style={{ animationDelay: '80ms' }}>
          <div className="captain-earnings-header">
            <div className="captain-earnings-header__label">TODAY'S EARNINGS</div>
            <div className="captain-earnings-header__trend">
              <IoTrendingUp size={14} /> +12%
            </div>
          </div>
          <div className="captain-earnings-amount">₹{earnings.today.toLocaleString()}</div>
          <div className="captain-earnings-stats">
            <div className="captain-earnings-stat">
              <span className="captain-earnings-stat__value">{earnings.rides}</span>
              <span className="captain-earnings-stat__label">Rides</span>
            </div>
            <div className="captain-earnings-stat__divider" />
            <div className="captain-earnings-stat">
              <span className="captain-earnings-stat__value">{earnings.hours}h</span>
              <span className="captain-earnings-stat__label">Online</span>
            </div>
            <div className="captain-earnings-stat__divider" />
            <div className="captain-earnings-stat">
              <span className="captain-earnings-stat__value">4.9</span>
              <span className="captain-earnings-stat__label">Rating</span>
            </div>
          </div>
        </div>

        {/* Connection Status */}
        <div className="captain-connection animate-slideUp" style={{ animationDelay: '120ms' }}>
          <div className={`captain-connection__dot ${isConnected ? 'captain-connection__dot--connected' : ''}`} />
          <span>{isConnected ? 'Connected to QuickBike Network' : 'Connecting...'}</span>
        </div>

        {/* Quick Actions */}
        <div className="captain-quick-actions animate-slideUp" style={{ animationDelay: '160ms' }}>
          <button className="captain-quick-action" id="btn-wallet">
            <IoWalletOutline size={22} />
            <span>Wallet</span>
          </button>
          <button className="captain-quick-action" id="btn-history">
            <IoLocationOutline size={22} />
            <span>History</span>
          </button>
          <button className="captain-quick-action" id="btn-performance">
            <IoTrendingUp size={22} />
            <span>Stats</span>
          </button>
        </div>

        {/* Map Placeholder */}
        <div className="captain-map animate-fadeIn">
          <div className="captain-map__grid" />
          {isOnline && (
            <div className="captain-map__marker animate-bounceIn">
              <RiMotorbikeFill size={20} />
            </div>
          )}
        </div>

        {/* Incoming Ride Modal */}
        {newRide && (
          <div className="captain-ride-modal animate-slideUp">
            <div className="captain-ride-modal__header">
              <span className="captain-ride-modal__badge">NEW RIDE REQUEST</span>
              <span className="captain-ride-modal__fare">₹{newRide.fare}</span>
            </div>
            <div className="captain-ride-modal__route">
              <div className="captain-ride-modal__point">
                <div className="ride-location-dot ride-location-dot--pickup" />
                <span>{newRide.pickup}</span>
              </div>
              <div className="captain-ride-modal__point">
                <div className="ride-location-dot ride-location-dot--drop" />
                <span>{newRide.destination}</span>
              </div>
            </div>
            <div className="captain-ride-modal__actions">
              <button className="btn btn--outline" onClick={declineRide} id="btn-decline-ride">Decline</button>
              <button className="btn btn--primary" onClick={acceptRide} id="btn-accept-ride">
                <IoCheckmarkCircle size={18} /> Accept
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
