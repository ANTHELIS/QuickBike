import { create } from 'zustand';
import { userAPI, captainAPI } from '../api/services';

const useAuthStore = create((set, get) => ({
  user: JSON.parse(localStorage.getItem('qb_user') || 'null'),
  token: localStorage.getItem('qb_token') || null,
  userType: localStorage.getItem('qb_user_type') || null, // 'user' | 'captain'
  isAuthenticated: !!localStorage.getItem('qb_token'),
  isLoading: false,
  error: null,

  // Persist auth state to localStorage
  _persistAuth: (user, token, userType) => {
    localStorage.setItem('qb_token', token);
    localStorage.setItem('qb_user', JSON.stringify(user));
    localStorage.setItem('qb_user_type', userType);
    set({ user, token, userType, isAuthenticated: true, error: null });
  },

  _clearAuth: () => {
    localStorage.removeItem('qb_token');
    localStorage.removeItem('qb_user');
    localStorage.removeItem('qb_user_type');
    set({ user: null, token: null, userType: null, isAuthenticated: false });
  },

  /* ── User Actions ── */
  loginUser: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await userAPI.login({ email, password });
      get()._persistAuth(data.user, data.token, 'user');
      return data;
    } catch (err) {
      set({ error: err.message });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  registerUser: async (formData) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await userAPI.register(formData);
      get()._persistAuth(data.user, data.token, 'user');
      return data;
    } catch (err) {
      set({ error: err.message });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  /* ── Captain Actions ── */
  loginCaptain: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await captainAPI.login({ email, password });
      get()._persistAuth(data.captain, data.token, 'captain');
      return data;
    } catch (err) {
      set({ error: err.message });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  registerCaptain: async (formData) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await captainAPI.register(formData);
      get()._persistAuth(data.captain, data.token, 'captain');
      return data;
    } catch (err) {
      set({ error: err.message });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  /* ── Shared ── */
  logout: async () => {
    try {
      const userType = get().userType;
      if (userType === 'captain') {
        await captainAPI.logout();
      } else {
        await userAPI.logout();
      }
    } catch {
      // Proceed with local cleanup even if API fails
    } finally {
      get()._clearAuth();
    }
  },

  fetchProfile: async () => {
    const userType = get().userType;
    try {
      if (userType === 'captain') {
        const { data } = await captainAPI.getProfile();
        set({ user: data.captain || data });
      } else {
        const { data } = await userAPI.getProfile();
        set({ user: data.user || data });
      }
    } catch {
      get()._clearAuth();
    }
  },

  clearError: () => set({ error: null }),
}));

export default useAuthStore;
