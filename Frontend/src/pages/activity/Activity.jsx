import { useState, useEffect } from 'react';
import { IoCheckmarkCircle, IoTimeOutline, IoCloseCircle, IoChevronForward } from 'react-icons/io5';
import { RiMotorbikeFill } from 'react-icons/ri';
import { TbSteeringWheel } from 'react-icons/tb';
import { IoCarSportOutline } from 'react-icons/io5';
import Header from '../../components/layout/Header';
import useRideStore from '../../store/rideStore';
import useAuthStore from '../../store/authStore';
import './Activity.css';

const STATUS_CONFIG = {
  completed: { label: 'Completed', icon: IoCheckmarkCircle, color: 'var(--color-success)' },
  cancelled: { label: 'Cancelled', icon: IoCloseCircle, color: 'var(--color-error)' },
  ongoing: { label: 'Ongoing', icon: IoTimeOutline, color: 'var(--color-primary)' },
  pending: { label: 'Pending', icon: IoTimeOutline, color: 'var(--color-warning, #F59E0B)' },
  accepted: { label: 'Accepted', icon: IoCheckmarkCircle, color: 'var(--color-primary)' },
};

const VEHICLE_ICON = {
  motorcycle: RiMotorbikeFill,
  moto: RiMotorbikeFill,
  auto: TbSteeringWheel,
  car: IoCarSportOutline,
};

function formatDate(dateStr) {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

  if (diffDays === 0) return `Today, ${time}`;
  if (diffDays === 1) return `Yesterday, ${time}`;
  return `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${time}`;
}

export default function Activity() {
  const { userType } = useAuthStore();
  const { rideHistory, historyPagination, historyLoading, fetchRideHistory } = useRideStore();
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchRideHistory({ userType, page: 1, status: filter === 'all' ? undefined : filter });
  }, [fetchRideHistory, userType, filter]);

  const handleLoadMore = () => {
    if (historyPagination && historyPagination.page < historyPagination.pages) {
      fetchRideHistory({
        userType,
        page: historyPagination.page + 1,
        status: filter === 'all' ? undefined : filter,
      });
    }
  };

  // Show real rides from backend, or empty state
  const rides = rideHistory;

  return (
    <>
      <Header />

      <div className="activity-content">
        <h1 className="activity-title animate-slideUp">Your Rides</h1>

        {/* Filters */}
        <div className="activity-filters animate-slideUp" style={{ animationDelay: '60ms' }}>
          {['all', 'completed', 'cancelled'].map((f) => (
            <button
              key={f}
              className={`activity-filter ${filter === f ? 'activity-filter--active' : ''}`}
              onClick={() => setFilter(f)}
              id={`filter-${f}`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Loading State */}
        {historyLoading && rides.length === 0 && (
          <div className="activity-empty animate-fadeIn">
            <div className="spinner" style={{ width: 32, height: 32 }} />
            <p>Loading rides...</p>
          </div>
        )}

        {/* Ride List */}
        <div className="activity-list stagger-children">
          {rides.map((ride) => {
            const statusConf = STATUS_CONFIG[ride.status] || STATUS_CONFIG.pending;
            const StatusIcon = statusConf.icon;
            const VehicleIcon = VEHICLE_ICON[ride.vehicleType] || RiMotorbikeFill;
            return (
              <button key={ride._id} className="activity-ride" id={`ride-${ride._id}`}>
                <div className="activity-ride__icon-wrap" style={{ color: statusConf.color }}>
                  <VehicleIcon size={24} />
                </div>
                <div className="activity-ride__info">
                  <div className="activity-ride__route">
                    {ride.pickup} → {ride.destination}
                  </div>
                  <div className="activity-ride__meta">
                    <StatusIcon size={14} style={{ color: statusConf.color }} />
                    <span style={{ color: statusConf.color }}>{statusConf.label}</span>
                    <span>•</span>
                    <span>{formatDate(ride.createdAt)}</span>
                  </div>
                  {ride.status === 'completed' && (ride.duration || ride.distance) && (
                    <div className="activity-ride__stats">
                      {ride.duration ? `${Math.round(ride.duration / 60)} min` : ''}
                      {ride.duration && ride.distance ? ' • ' : ''}
                      {ride.distance ? `${(ride.distance / 1000).toFixed(1)} km` : ''}
                    </div>
                  )}
                </div>
                <div className="activity-ride__right">
                  {ride.fare > 0 && (
                    <span className="activity-ride__fare">₹{ride.fare}</span>
                  )}
                  <IoChevronForward size={16} className="text-muted" />
                </div>
              </button>
            );
          })}
        </div>

        {/* Load More */}
        {historyPagination && historyPagination.page < historyPagination.pages && (
          <button
            className="btn btn--outline btn--block"
            onClick={handleLoadMore}
            disabled={historyLoading}
            style={{ marginTop: 'var(--space-3)' }}
            id="btn-load-more"
          >
            {historyLoading ? <span className="spinner spinner--white" /> : 'Load More'}
          </button>
        )}

        {!historyLoading && rides.length === 0 && (
          <div className="activity-empty animate-fadeIn">
            <IoTimeOutline size={48} />
            <p>No rides found</p>
          </div>
        )}
      </div>
    </>
  );
}
