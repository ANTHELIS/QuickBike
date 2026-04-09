import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IoSwapVertical, IoInformationCircleOutline, IoCardOutline, IoChevronForward } from 'react-icons/io5';
import { RiMotorbikeFill } from 'react-icons/ri';
import { TbSteeringWheel } from 'react-icons/tb';
import { IoCarSportOutline } from 'react-icons/io5';
import Header from '../../components/layout/Header';
import useRideStore from '../../store/rideStore';
import toast from 'react-hot-toast';
import './Ride.css';

const VEHICLE_OPTIONS = [
  {
    type: 'moto',
    name: 'Bike Taxi',
    desc: 'Fastest in traffic',
    icon: RiMotorbikeFill,
    eta: '2 mins away',
    badge: 'RECOMMENDED',
    helmetTag: true,
  },
  {
    type: 'auto',
    name: 'Quick Auto',
    desc: 'Best for 2 people',
    icon: TbSteeringWheel,
    eta: '5 mins away',
  },
  {
    type: 'car',
    name: 'Mini Cab',
    desc: 'Comfort & A/C',
    icon: IoCarSportOutline,
    eta: '8 mins away',
  },
];

export default function SelectRide() {
  const navigate = useNavigate();
  const { pickup, destination, fares, selectedVehicle, fetchFares, selectVehicle, createRide, isLoading } = useRideStore();
  const [fareLoading, setFareLoading] = useState(false);

  useEffect(() => {
    if (!pickup || !destination) {
      navigate('/home');
      return;
    }
    const loadFares = async () => {
      setFareLoading(true);
      try {
        await fetchFares();
      } catch {
        // fares may fail silently with demo data
      } finally {
        setFareLoading(false);
      }
    };
    loadFares();
  }, [pickup, destination, fetchFares, navigate]);

  const handleConfirm = async () => {
    try {
      await createRide();
      toast.success('Looking for a rider...');
      navigate('/on-the-way');
    } catch (err) {
      toast.error(err.message);
    }
  };

  // Demo fares when API isn't available
  const displayFares = fares || { moto: 12.50, auto: 18.20, car: 24.00 };

  return (
    <div className="page page-enter">
      <Header minimal showBack title="QuickBike" />

      <div className="ride-content">
        {/* Location Card */}
        <div className="ride-location-card animate-slideUp">
          <div className="ride-location-point">
            <div className="ride-location-dot ride-location-dot--pickup" />
            <div className="ride-location-info">
              <div className="ride-location-label">PICK-UP POINT</div>
              <div className="ride-location-text">{pickup}</div>
            </div>
          </div>
          <div className="ride-location-line" />
          <div className="ride-location-point">
            <div className="ride-location-dot ride-location-dot--drop" />
            <div className="ride-location-info">
              <div className="ride-location-label">DROP-OFF POINT</div>
              <div className="ride-location-text">{destination}</div>
            </div>
          </div>
          <button className="ride-swap-btn" id="btn-swap-locations">
            <IoSwapVertical size={20} />
          </button>
        </div>

        {/* Vehicle Selection */}
        <h2 className="ride-section-title animate-slideUp" style={{ animationDelay: '80ms' }}>Choose your ride</h2>

        <div className="ride-options stagger-children">
          {VEHICLE_OPTIONS.map((v) => {
            const isSelected = selectedVehicle === v.type;
            const fare = displayFares[v.type];
            return (
              <button
                key={v.type}
                className={`ride-option ${isSelected ? 'ride-option--selected' : ''}`}
                onClick={() => selectVehicle(v.type)}
                id={`ride-option-${v.type}`}
              >
                <div className="ride-option__icon-wrap">
                  <v.icon className="ride-option__icon" />
                </div>
                <div className="ride-option__info">
                  <div className="ride-option__name">{v.name}</div>
                  <div className="ride-option__desc">
                    {v.desc} • {v.eta}
                  </div>
                  {v.helmetTag && (
                    <div className="ride-option__helmet">
                      <span style={{ fontWeight: 800, letterSpacing: '0.04em' }}>HELMET</span>
                      <span className="text-error" style={{ fontWeight: 600, fontSize: 'var(--font-size-xs)' }}>HELMET REQUIRED</span>
                    </div>
                  )}
                </div>
                <div className="ride-option__fare">
                  <span className="ride-option__price">
                    {fareLoading ? <span className="skeleton" style={{ width: 50, height: 20 }} /> : `₹${fare}`}
                  </span>
                  {v.badge && <span className="badge badge--recommended">{v.badge}</span>}
                </div>
              </button>
            );
          })}
        </div>

        {/* Info Banner */}
        <div className="ride-info-banner animate-slideUp" style={{ animationDelay: '300ms' }}>
          <IoInformationCircleOutline size={22} className="text-primary" style={{ flexShrink: 0 }} />
          <div>
            <div className="ride-info-banner__title">Kinetic Precision Pricing</div>
            <div className="ride-info-banner__desc">
              Fares are slightly higher than usual due to peak morning traffic. QuickBike remains 40% faster than cabs in this zone.
            </div>
          </div>
        </div>

        {/* Payment & CTA */}
        <div className="ride-bottom animate-slideUp" style={{ animationDelay: '350ms' }}>
          <div className="ride-payment">
            <IoCardOutline size={20} />
            <div className="ride-payment__info">
              <div className="ride-payment__label">PAYMENT METHOD</div>
              <div className="ride-payment__value">Visa •••• 4242</div>
            </div>
            <button className="ride-payment__change">Change</button>
          </div>

          <button
            className="btn btn--primary btn--block btn--lg"
            onClick={handleConfirm}
            disabled={isLoading || fareLoading}
            id="btn-confirm-ride"
          >
            {isLoading ? <span className="spinner spinner--white" /> : <>Confirm Ride <IoChevronForward /></>}
          </button>
        </div>
      </div>
    </div>
  );
}
