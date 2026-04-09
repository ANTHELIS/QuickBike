import api from './axios';

/* ── User Auth ── */
export const userAPI = {
  register: (data) => api.post('/users/register', data),
  login: (data) => api.post('/users/login', data),
  getProfile: () => api.get('/users/profile'),
  logout: () => api.post('/users/logout'),
};

/* ── Captain Auth ── */
export const captainAPI = {
  register: (data) => api.post('/captains/register', data),
  login: (data) => api.post('/captains/login', data),
  getProfile: () => api.get('/captains/profile'),
  logout: () => api.post('/captains/logout'),
};

/* ── Rides ── */
export const rideAPI = {
  create: (data) => api.post('/rides/create', data),
  getFare: (pickup, destination) =>
    api.get('/rides/get-fare', { params: { pickup, destination } }),
  confirm: (rideId) => api.post('/rides/confirm', { rideId }),
  start: (rideId, otp) =>
    api.get('/rides/start-ride', { params: { rideId, otp } }),
  end: (rideId) => api.post('/rides/end-ride', { rideId }),
  getHistory: ({ userType, page = 1, limit = 20, status } = {}) =>
    api.get('/rides/history', { params: { userType, page, limit, status } }),
  getStats: (userType) =>
    api.get('/rides/stats', { params: { userType } }),
};

/* ── Maps ── */
export const mapsAPI = {
  getCoordinates: (address) =>
    api.get('/maps/get-coordinates', { params: { address } }),
  getDistanceTime: (origin, destination) =>
    api.get('/maps/get-distance-time', { params: { origin, destination } }),
  getSuggestions: (input) =>
    api.get('/maps/get-suggestions', { params: { input } }),
};
