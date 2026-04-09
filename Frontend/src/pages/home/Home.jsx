import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { IoSearchOutline, IoHomeOutline, IoBriefcaseOutline, IoAddOutline, IoLocationOutline, IoEllipsisHorizontal, IoLocate } from 'react-icons/io5';
import { HiOutlineSparkles } from 'react-icons/hi2';
import { RiMotorbikeFill } from 'react-icons/ri';
import Header from '../../components/layout/Header';
import useRideStore from '../../store/rideStore';
import { mapsAPI } from '../../api/services';
import toast from 'react-hot-toast';
import './Home.css';

const RECENT_PLACES = [
  { name: 'Orchard Central', address: '181 Orchard Rd, Singapore' },
  { name: 'Marina Bay Sands', address: '10 Bayfront Ave, Singapore' },
];

// Default pickup when geolocation unavailable
const DEFAULT_PICKUP = 'Indiranagar, Bangalore, Karnataka, India';

export default function Home() {
  const navigate = useNavigate();
  const { setPickup, setDestination, fetchSuggestions, destinationSuggestions, clearSuggestions } = useRideStore();
  const [searchValue, setSearchValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [currentPickup, setCurrentPickup] = useState(DEFAULT_PICKUP);
  const [locating, setLocating] = useState(false);
  const debounceRef = useRef(null);

  // Try to get pickup from browser geolocation on mount
  useEffect(() => {
    if (!navigator.geolocation) return;

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          // Reverse geocode using the maps API
          const { data } = await mapsAPI.getCoordinates(
            `${pos.coords.latitude},${pos.coords.longitude}`
          );
          if (data && (data.address || data.ltd)) {
            // If backend returns a formatted address, use it
            setCurrentPickup(data.address || `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
          }
        } catch {
          // Geolocation worked but reverse geocoding failed — use default
        } finally {
          setLocating(false);
        }
      },
      () => {
        // Geolocation permission denied or unavailable
        setLocating(false);
      },
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 300000 }
    );
  }, []);

  const handleSearch = useCallback((val) => {
    setSearchValue(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (val.length >= 3) {
      debounceRef.current = setTimeout(() => {
        fetchSuggestions(val, 'destination');
        setShowSuggestions(true);
      }, 300);
    } else {
      clearSuggestions('destination');
      setShowSuggestions(false);
    }
  }, [fetchSuggestions, clearSuggestions]);

  const handleSelectPlace = (place) => {
    const destination = place.description || place.address || place.name;
    setDestination(destination);
    setSearchValue('');
    setShowSuggestions(false);
    clearSuggestions('destination');
    // Use resolved pickup address (not "Current Location")
    setPickup(currentPickup);
    navigate('/select-ride');
  };

  const handleRecentClick = (place) => {
    setDestination(place.address || place.name);
    setPickup(currentPickup);
    navigate('/select-ride');
  };

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation not supported');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCurrentPickup(`${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
        setLocating(false);
        toast.success('Location updated');
      },
      () => {
        setLocating(false);
        toast.error('Unable to get location');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <>
      <Header />

      <div className="home-content">
        {/* Search Card */}
        <div className="home-search-card animate-scaleIn" id="search-card">
          <h2 className="home-search-card__title">Where to?</h2>
          <div className="home-search-wrapper">
            <IoSearchOutline className="home-search-icon" />
            <input
              className="home-search-input"
              type="text"
              placeholder="Enter destination"
              value={searchValue}
              onChange={(e) => handleSearch(e.target.value)}
              id="input-destination-search"
            />
          </div>

          {/* Suggestions Dropdown */}
          {showSuggestions && destinationSuggestions.length > 0 && (
            <div className="home-suggestions animate-slideDown">
              {destinationSuggestions.map((s, i) => (
                <button key={i} className="home-suggestion-item" onClick={() => handleSelectPlace(s)}>
                  <IoLocationOutline className="home-suggestion-icon" />
                  <span>{s.description || s.name || s}</span>
                </button>
              ))}
            </div>
          )}

          {/* Quick Shortcuts */}
          <div className="home-shortcuts">
            <button className="home-shortcut" id="shortcut-home">
              <IoHomeOutline /> Home
            </button>
            <button className="home-shortcut" id="shortcut-work">
              <IoBriefcaseOutline /> Work
            </button>
            <button className="home-shortcut home-shortcut--add" id="shortcut-add">
              <IoAddOutline /> Add New
            </button>
          </div>
        </div>

        {/* Recent Places */}
        <div className="home-recents animate-slideUp" style={{ animationDelay: '80ms' }}>
          <div className="home-recents__header">
            <h3 className="home-recents__title">Recents</h3>
            <button className="btn btn--icon btn--ghost">
              <IoEllipsisHorizontal size={18} />
            </button>
          </div>
          {RECENT_PLACES.map((place) => (
            <button
              key={place.name}
              className="home-recent-item"
              onClick={() => handleRecentClick(place)}
              id={`recent-${place.name.toLowerCase().replace(/\s/g, '-')}`}
            >
              <div className="home-recent-item__icon">
                <IoLocationOutline size={20} />
              </div>
              <div className="home-recent-item__info">
                <div className="home-recent-item__name">{place.name}</div>
                <div className="home-recent-item__address">{place.address}</div>
              </div>
            </button>
          ))}
        </div>

        {/* Promo Card */}
        <div className="home-promo animate-slideUp" style={{ animationDelay: '160ms' }} id="promo-card">
          <div className="home-promo__badge">
            <HiOutlineSparkles /> ACTIVE DEAL
          </div>
          <div className="home-promo__row">
            <div>
              <div className="home-promo__name">QuickBike Pro</div>
              <div className="home-promo__desc">Available nearby • 3 min away</div>
            </div>
            <div className="home-promo__price">₹375</div>
          </div>
          <button className="btn btn--primary btn--block" style={{ marginTop: 'var(--space-3)' }} id="btn-quick-book">
            Quick Book
          </button>
        </div>

        {/* Weekly Streak */}
        <div className="home-streak animate-slideUp" style={{ animationDelay: '240ms' }} id="streak-card">
          <div className="home-streak__label">WEEKLY STREAK</div>
          <div className="home-streak__text">Get 30% off your next ride!</div>
        </div>

        {/* Locate button */}
        <button className="home-locate-btn" onClick={handleLocateMe} disabled={locating} id="btn-locate">
          <IoLocate size={22} />
        </button>

        {/* Map background placeholder */}
        <div className="home-map-bg">
          <div className="home-map-grid" />
        </div>
      </div>
    </>
  );
}
