import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { IoCallOutline, IoChatbubbleOutline, IoShieldCheckmarkOutline, IoLockClosedOutline } from 'react-icons/io5';
import { RiMotorbikeFill } from 'react-icons/ri';
import { MdOutlineVerified } from 'react-icons/md';
import Header from '../../components/layout/Header';
import useRideStore from '../../store/rideStore';
import './Ride.css';

export default function OnTheWay() {
  const navigate = useNavigate();
  const { currentRide, rideStatus, completedRide } = useRideStore();

  // Navigate to summary when ride completes
  useEffect(() => {
    if (completedRide) {
      navigate('/ride-summary');
    }
  }, [completedRide, navigate]);

  // Mock ride data for demo when no active ride
  const ride = currentRide || {
    fare: 125.50,
    pickup: 'Indiranagar, Bangalore',
    destination: 'MG Road Metro Station',
    status: 'accepted',
  };

  const captain = currentRide?.captain || {
    fullname: { firstname: 'Budi', lastname: 'Santoso' },
    vehicle: { vehicleType: 'motorcycle', plate: 'B 4932 KLP', color: 'Honda Vario' },
  };

  const captainName = `${captain.fullname?.firstname || 'Driver'} ${captain.fullname?.lastname || ''}`;
  const vehicleInfo = `${captain.vehicle?.color || ''} • ${captain.vehicle?.plate || ''}`;

  const isAccepted = rideStatus === 'accepted' || !rideStatus;
  const statusText = isAccepted ? 'Arriving in 4 mins' : 'On the way';
  const distanceText = isAccepted ? '2.1 km to your destination' : 'En route to destination';

  return (
    <div className="page page-enter">
      <Header />

      <div className="otw-content">
        {/* Status Bar */}
        <div className="otw-status-bar animate-slideDown">
          <div className="otw-status-bar__left">
            <div className="otw-eta">{statusText}</div>
            <div className="otw-distance">{distanceText}</div>
          </div>
          <div className="otw-fare">
            <div className="otw-fare__amount">₹{ride.fare}</div>
            <div className="otw-fare__label">FIXED FARE</div>
          </div>
        </div>

        {/* Tags */}
        <div className="otw-tags animate-slideUp">
          <div className="otw-tag">
            <span style={{ fontWeight: 800, letterSpacing: 1 }}>HELMET</span>
            <span style={{ fontSize: 'var(--font-size-xs)' }}>Wear a Helmet</span>
          </div>
          <div className="otw-tag">
            <IoLockClosedOutline size={16} />
            Check OTP
          </div>
        </div>

        {/* Map */}
        <div className="otw-map">
          <div className="otw-map__grid" />
          {/* Route Path SVG */}
          <svg className="otw-map__route" viewBox="0 0 300 200" fill="none">
            <path
              d="M 50 180 Q 80 80 150 100 T 260 40"
              stroke="#E87A20"
              strokeWidth="4"
              strokeDasharray="8 6"
              fill="none"
              strokeLinecap="round"
              opacity="0.8"
            />
            <path
              d="M 150 100 Q 200 130 260 40"
              stroke="#E87A20"
              strokeWidth="6"
              fill="none"
              strokeLinecap="round"
              opacity="0.4"
            />
          </svg>
          <div className="otw-map__marker" style={{ top: '45%', left: '48%' }}>
            <RiMotorbikeFill />
          </div>
        </div>

        {/* Driver Card */}
        <div className="otw-driver-card animate-slideUp">
          <div className="otw-driver">
            <div className="otw-driver__avatar">
              🧑
              <div className="otw-driver__rating">⭐ 4.9</div>
            </div>
            <div className="otw-driver__info">
              <div className="otw-driver__name">{captainName}</div>
              <div className="otw-driver__vehicle">{vehicleInfo}</div>
            </div>
            <div className="otw-driver__pro">
              <div className="otw-driver__pro-badge">
                <MdOutlineVerified size={20} />
              </div>
              <span className="otw-driver__pro-label">PRO<br/>DRIVER</span>
            </div>
          </div>

          <div className="otw-actions">
            <button className="otw-action-btn" id="btn-call-driver">
              <IoCallOutline size={18} /> Call Driver
            </button>
            <button className="otw-action-btn" id="btn-message-driver">
              <IoChatbubbleOutline size={18} /> Message
            </button>
          </div>

          <button className="otw-sos" id="btn-sos">
            <IoShieldCheckmarkOutline size={20} />
            Safety Center & SOS
          </button>
        </div>
      </div>
    </div>
  );
}
