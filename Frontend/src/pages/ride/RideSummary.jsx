import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IoCheckmarkCircle, IoTimeOutline, IoSpeedometerOutline, IoLocationOutline, IoWalletOutline, IoCardOutline } from 'react-icons/io5';
import { HiOutlineStar, HiStar } from 'react-icons/hi2';
import Header from '../../components/layout/Header';
import useRideStore from '../../store/rideStore';
import toast from 'react-hot-toast';
import './Ride.css';

export default function RideSummary() {
  const navigate = useNavigate();
  const { completedRide, resetRide } = useRideStore();
  const [rating, setRating] = useState(4);
  const [paymentMethod, setPaymentMethod] = useState('wallet');

  // Demo data when no completed ride
  const ride = completedRide || {
    fare: 245.50,
    pickup: 'Indiranagar, Bangalore',
    destination: 'MG Road Metro Station',
    duration: 1680,
    distance: 12400,
    captain: {
      fullname: { firstname: 'Marcus', lastname: '' },
    },
  };

  const baseFare = Math.round(ride.fare * 0.32);
  const distanceFare = Math.round(ride.fare * 0.53);
  const taxes = Math.round(ride.fare * 0.15);
  const durationMins = ride.duration ? Math.round(ride.duration / 60) : 28;
  const distanceKm = ride.distance ? (ride.distance / 1000).toFixed(1) : '12.4';
  const captainName = ride.captain?.fullname ? `${ride.captain.fullname.firstname} ${ride.captain.fullname.lastname || ''}`.trim() : 'Your Driver';

  const handlePay = () => {
    toast.success('Payment successful!');
    resetRide();
    navigate('/home');
  };

  return (
    <div className="page page-enter">
      <Header minimal showClose title="QuickBike" onClose={() => { resetRide(); navigate('/home'); }} />

      <div className="summary-content">
        {/* Success Animation */}
        <div className="summary-success animate-bounceIn">
          <div className="summary-success__icon">
            <IoCheckmarkCircle size={36} />
          </div>
          <h2 className="summary-success__title">Ride Completed</h2>
          <p className="summary-success__desc">Thank you for riding with QuickBike today.</p>
        </div>

        {/* Fare Card */}
        <div className="summary-fare-card animate-slideUp" style={{ animationDelay: '100ms' }}>
          <div className="summary-fare-card__label">TOTAL FARE</div>
          <div className="summary-fare-card__amount">
            ₹{ride.fare}
            <span className="summary-fare-card__currency">INR</span>
          </div>
          <div className="summary-fare-breakdown">
            <div className="divider" style={{ margin: 'var(--space-2) 0' }} />
            <div className="summary-fare-row">
              <span>Base Fare</span>
              <span>₹{baseFare}.00</span>
            </div>
            <div className="summary-fare-row">
              <span>Distance ({distanceKm} km)</span>
              <span>₹{distanceFare}.20</span>
            </div>
            <div className="summary-fare-row">
              <span>Taxes & Fees</span>
              <span>₹{taxes}.30</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="summary-stats animate-slideUp" style={{ animationDelay: '160ms' }}>
          <div className="summary-stat">
            <IoTimeOutline className="summary-stat__icon" />
            <div className="summary-stat__label">DURATION</div>
            <div className="summary-stat__value">{durationMins} mins</div>
          </div>
          <div className="summary-stat">
            <IoSpeedometerOutline className="summary-stat__icon" />
            <div className="summary-stat__label">DISTANCE</div>
            <div className="summary-stat__value">{distanceKm} km</div>
          </div>
        </div>

        {/* Route */}
        <div className="summary-route animate-slideUp" style={{ animationDelay: '220ms' }}>
          <div className="summary-route-point">
            <div className="ride-location-dot ride-location-dot--pickup" style={{ marginTop: 4 }} />
            <div>
              <div className="summary-route-point__label">PICKUP • 09:12 AM</div>
              <div className="summary-route-point__text">{ride.pickup}</div>
            </div>
          </div>
          <div style={{ width: 2, height: 16, background: 'var(--color-gray-300)', marginLeft: 5, borderRadius: 2 }} />
          <div className="summary-route-point">
            <div className="ride-location-dot ride-location-dot--drop" style={{ marginTop: 4 }} />
            <div>
              <div className="summary-route-point__label">DROPOFF • 09:40 AM</div>
              <div className="summary-route-point__text">{ride.destination}</div>
            </div>
          </div>
        </div>

        {/* Rate Driver */}
        <div className="summary-rating-card animate-slideUp" style={{ animationDelay: '280ms' }}>
          <div className="summary-rating-card__avatar">🧑</div>
          <div className="summary-rating-card__info">
            <div className="summary-rating-card__name">Rate {captainName}</div>
            <div className="summary-rating-card__desc">How was your trip with QuickBike Pro?</div>
            <div className="rating" style={{ marginTop: 'var(--space-2)' }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  className={`rating__star ${star <= rating ? 'rating__star--filled' : ''}`}
                  onClick={() => setRating(star)}
                  id={`star-${star}`}
                >
                  {star <= rating ? <HiStar /> : <HiOutlineStar />}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Payment Method */}
        <div className="summary-payment animate-slideUp" style={{ animationDelay: '340ms' }}>
          <h3 className="summary-payment__title">Payment Method</h3>

          <button
            className={`summary-payment-option ${paymentMethod === 'wallet' ? 'summary-payment-option--selected' : ''}`}
            onClick={() => setPaymentMethod('wallet')}
            id="payment-wallet"
          >
            <div className="summary-payment-option__icon">
              <IoWalletOutline size={20} />
            </div>
            <div className="summary-payment-option__info">
              <div className="summary-payment-option__name">QuickBike Wallet</div>
              <div className="summary-payment-option__desc">Balance: ₹4,210</div>
            </div>
            <div className="summary-payment-option__radio" />
          </button>

          <button
            className={`summary-payment-option ${paymentMethod === 'upi' ? 'summary-payment-option--selected' : ''}`}
            onClick={() => setPaymentMethod('upi')}
            id="payment-upi"
          >
            <div className="summary-payment-option__icon">
              <IoCardOutline size={20} />
            </div>
            <div className="summary-payment-option__info">
              <div className="summary-payment-option__name">UPI ID: user@okaxis</div>
              <div className="summary-payment-option__desc">Linked via BHIM</div>
            </div>
            <div className="summary-payment-option__radio" />
          </button>
        </div>

        {/* Pay Button */}
        <div style={{ marginTop: 'auto' }}>
          <button className="btn btn--primary btn--block btn--lg" onClick={handlePay} id="btn-pay">
            Pay ₹{ride.fare} Now
          </button>
          <p className="summary-tos">
            By clicking Pay, you agree to our <a href="#terms">Terms of Service</a>
          </p>
        </div>
      </div>
    </div>
  );
}
