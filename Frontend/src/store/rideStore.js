import { create } from 'zustand';
import { rideAPI, mapsAPI } from '../api/services';

const useRideStore = create((set, get) => ({
  // Search state
  pickup: '',
  destination: '',
  pickupSuggestions: [],
  destinationSuggestions: [],

  // Ride selection
  fares: null,           // { auto, car, moto }
  selectedVehicle: null, // 'moto' | 'auto' | 'car'

  // Active ride
  currentRide: null,
  rideStatus: null,      // 'pending' | 'accepted' | 'ongoing' | 'completed'

  // Completed ride (for summary)
  completedRide: null,

  // Ride history (for Activity page)
  rideHistory: [],
  historyPagination: null,
  historyLoading: false,

  // User stats (for Account page)
  userStats: null,
  statsLoading: false,

  // UI
  isLoading: false,
  error: null,

  /* ── Location Search ── */
  setPickup: (value) => set({ pickup: value }),
  setDestination: (value) => set({ destination: value }),

  fetchSuggestions: async (input, type) => {
    if (!input || input.length < 3) {
      set({ [`${type}Suggestions`]: [] });
      return;
    }
    try {
      const { data } = await mapsAPI.getSuggestions(input);
      // Backend returns array of strings — normalize to objects for the UI
      const suggestions = Array.isArray(data)
        ? data.map((item) =>
            typeof item === 'string' ? { description: item } : item
          )
        : [];
      set({ [`${type}Suggestions`]: suggestions });
    } catch {
      // Silently fail for autocomplete
    }
  },

  clearSuggestions: (type) => set({ [`${type}Suggestions`]: [] }),

  /* ── Fare Calculation ── */
  fetchFares: async () => {
    const { pickup, destination } = get();
    if (!pickup || !destination) return;
    set({ isLoading: true, error: null });
    try {
      const { data } = await rideAPI.getFare(pickup, destination);
      set({ fares: data, selectedVehicle: 'moto' });
      return data;
    } catch (err) {
      set({ error: err.message });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  selectVehicle: (type) => set({ selectedVehicle: type }),

  /* ── Ride Lifecycle ── */
  createRide: async () => {
    const { pickup, destination, selectedVehicle } = get();
    set({ isLoading: true, error: null });
    try {
      const { data } = await rideAPI.create({
        pickup,
        destination,
        vehicleType: selectedVehicle,
      });
      set({ currentRide: data, rideStatus: 'pending' });
      return data;
    } catch (err) {
      set({ error: err.message });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  updateRideFromSocket: (ride) => {
    set({
      currentRide: ride,
      rideStatus: ride.status,
    });
  },

  completeRide: (ride) => {
    set({
      completedRide: ride,
      currentRide: null,
      rideStatus: null,
    });
  },

  /* ── Ride History (Activity page) ── */
  fetchRideHistory: async ({ userType, page = 1, status } = {}) => {
    set({ historyLoading: true });
    try {
      const { data } = await rideAPI.getHistory({ userType, page, status });
      set({
        rideHistory: page === 1 ? data.rides : [...get().rideHistory, ...data.rides],
        historyPagination: data.pagination,
      });
      return data;
    } catch (err) {
      set({ error: err.message });
      throw err;
    } finally {
      set({ historyLoading: false });
    }
  },

  /* ── User Stats (Account page) ── */
  fetchUserStats: async (userType) => {
    set({ statsLoading: true });
    try {
      const { data } = await rideAPI.getStats(userType);
      set({ userStats: data });
      return data;
    } catch (err) {
      // Silently fail — page can show defaults
      set({ userStats: null });
    } finally {
      set({ statsLoading: false });
    }
  },

  /* ── Reset ── */
  resetRide: () =>
    set({
      pickup: '',
      destination: '',
      pickupSuggestions: [],
      destinationSuggestions: [],
      fares: null,
      selectedVehicle: null,
      currentRide: null,
      rideStatus: null,
      completedRide: null,
      error: null,
    }),

  clearError: () => set({ error: null }),
}));

export default useRideStore;
