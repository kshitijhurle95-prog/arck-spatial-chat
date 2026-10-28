import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserSummary, UserPreferences, RegisterInput, LoginInput, UpdateProfileInput, UpdatePreferencesInput } from '@nebula/shared';
import { api, setApiToken, getApiToken } from '../lib/api';
import { sounds } from '../brand/SoundEffects';
import { getFallbackDemoAuth, DEFAULT_PREFERENCES } from '../lib/mockData';

interface AuthContextType {
  user: UserSummary | null;
  preferences: UserPreferences | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (input: UpdateProfileInput) => Promise<void>;
  updatePreferences: (input: UpdatePreferencesInput) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSummary | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function initAuth() {
      const token = getApiToken();
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const data = await api.getMe();
        setUser(data.user);
        setPreferences(data.preferences);
        sounds.enabled = data.preferences?.soundEnabled ?? true;
      } catch (err) {
        // If backend API is unreachable, restore cached demo user if present
        const savedUserJson = localStorage.getItem('arck_demo_user');
        if (savedUserJson) {
          try {
            const parsed = JSON.parse(savedUserJson);
            setUser(parsed.user);
            setPreferences(parsed.preferences || DEFAULT_PREFERENCES);
            sounds.enabled = parsed.preferences?.soundEnabled ?? true;
            setIsLoading(false);
            return;
          } catch {}
        }
        setApiToken(null);
        setUser(null);
        setPreferences(null);
      } finally {
        setIsLoading(false);
      }
    }

    initAuth();
  }, []);

  const login = async (input: LoginInput) => {
    setIsLoading(true);
    try {
      let data: { token: string; user: UserSummary; preferences: UserPreferences };
      try {
        data = await api.login(input);
      } catch (apiErr) {
        // Fallback for static hosting (e.g. GitHub Pages) or offline backend
        console.warn('Backend API login unavailable; activating demo session:', apiErr);
        data = getFallbackDemoAuth(input.login);
      }

      setApiToken(data.token);
      setUser(data.user);
      setPreferences(data.preferences);
      sounds.enabled = data.preferences?.soundEnabled ?? true;
      localStorage.setItem('arck_demo_user', JSON.stringify({ user: data.user, preferences: data.preferences }));
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (input: RegisterInput) => {
    setIsLoading(true);
    try {
      let data: { token: string; user: UserSummary; preferences: UserPreferences };
      try {
        data = await api.register(input);
      } catch (apiErr) {
        console.warn('Backend API register unavailable; activating demo session:', apiErr);
        data = getFallbackDemoAuth(input.username);
        data.user.displayName = input.displayName;
        data.user.email = input.email;
      }

      setApiToken(data.token);
      setUser(data.user);
      setPreferences(data.preferences);
      sounds.enabled = data.preferences?.soundEnabled ?? true;
      localStorage.setItem('arck_demo_user', JSON.stringify({ user: data.user, preferences: data.preferences }));
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch {}
    localStorage.removeItem('arck_demo_user');
    setApiToken(null);
    setUser(null);
    setPreferences(null);
  };

  const updateProfile = async (input: UpdateProfileInput) => {
    try {
      const res = await api.updateProfile(input);
      setUser((prev) => (prev ? { ...prev, ...res.user } : res.user));
    } catch {
      setUser((prev) => (prev ? { ...prev, ...input } : null));
    }
  };

  const updatePreferences = async (input: UpdatePreferencesInput) => {
    try {
      const res = await api.updatePreferences(input);
      setPreferences((prev) => (prev ? { ...prev, ...res.preferences } : res.preferences));
      if (res.preferences.soundEnabled !== undefined) {
        sounds.enabled = res.preferences.soundEnabled;
      }
    } catch {
      setPreferences((prev) => (prev ? { ...prev, ...input } : null));
      if (input.soundEnabled !== undefined) {
        sounds.enabled = input.soundEnabled;
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        preferences,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        updateProfile,
        updatePreferences,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
