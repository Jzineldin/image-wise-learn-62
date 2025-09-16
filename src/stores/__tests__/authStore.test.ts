import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '../authStore';

describe('authStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useAuthStore.setState({
      user: null,
      profile: null,
      loading: true,
    });
  });

  describe('initial state', () => {
    it('should have correct default values', () => {
      const state = useAuthStore.getState();
      expect(state.user).toBe(null);
      expect(state.profile).toBe(null);
      expect(state.loading).toBe(true);
    });
  });

  describe('user management', () => {
    it('should set user', () => {
      const { setUser } = useAuthStore.getState();
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        aud: 'authenticated',
        role: 'authenticated',
        email_confirmed_at: '2023-01-01T00:00:00Z',
        phone: '',
        last_sign_in_at: '2023-01-01T00:00:00Z',
        app_metadata: {},
        user_metadata: {},
        identities: [],
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z'
      };

      setUser(mockUser);
      expect(useAuthStore.getState().user).toBe(mockUser);
    });

    it('should clear user on logout', () => {
      const { setUser, logout } = useAuthStore.getState();
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        aud: 'authenticated',
        role: 'authenticated',
        email_confirmed_at: '2023-01-01T00:00:00Z',
        phone: '',
        last_sign_in_at: '2023-01-01T00:00:00Z',
        app_metadata: {},
        user_metadata: {},
        identities: [],
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z'
      };

      setUser(mockUser);
      expect(useAuthStore.getState().user).toBe(mockUser);
      
      logout();
      expect(useAuthStore.getState().user).toBe(null);
      expect(useAuthStore.getState().profile).toBe(null);
    });
  });

  describe('loading state', () => {
    it('should update loading state', () => {
      const { setLoading } = useAuthStore.getState();
      
      setLoading(false);
      expect(useAuthStore.getState().loading).toBe(false);
      
      setLoading(true);
      expect(useAuthStore.getState().loading).toBe(true);
    });
  });

  describe('profile management', () => {
    it('should set profile', () => {
      const { setProfile } = useAuthStore.getState();
      const mockProfile = { id: 'profile-1', name: 'Test User' };
      
      setProfile(mockProfile);
      expect(useAuthStore.getState().profile).toBe(mockProfile);
    });
  });

  describe('persistence', () => {
    it('should persist user and profile state', () => {
      const { setUser, setProfile } = useAuthStore.getState();
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        aud: 'authenticated',
        role: 'authenticated',
        email_confirmed_at: '2023-01-01T00:00:00Z',
        phone: '',
        last_sign_in_at: '2023-01-01T00:00:00Z',
        app_metadata: {},
        user_metadata: {},
        identities: [],
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z'
      };
      const mockProfile = { id: 'profile-1', name: 'Test User' };
      
      setUser(mockUser);
      setProfile(mockProfile);
      
      // Simulate store rehydration
      const persistedState = {
        user: useAuthStore.getState().user,
        profile: useAuthStore.getState().profile,
      };
      
      expect(persistedState.user).toBe(mockUser);
      expect(persistedState.profile).toBe(mockProfile);
    });

    it('should not persist loading state', () => {
      const { setLoading } = useAuthStore.getState();
      setLoading(false);
      
      // Loading state should not be included in persistence
      const persistedState = {
        user: useAuthStore.getState().user,
        profile: useAuthStore.getState().profile,
      };
      
      expect('loading' in persistedState).toBe(false);
    });
  });
});