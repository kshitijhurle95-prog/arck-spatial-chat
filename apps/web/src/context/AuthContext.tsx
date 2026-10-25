import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserSummary, UserPreferences, RegisterInput, LoginInput, UpdateProfileInput, UpdatePreferencesInput } from '@nebula/shared';
import { api, setApiToken, getApiToken } from '../lib/api';
import { sounds } from '../brand/SoundEffects';

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
      const data = await api.login(input);
      setApiToken(data.token);
      setUser(data.user);
      setPreferences(data.preferences);
      sounds.enabled = data.preferences?.soundEnabled ?? true;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (input: RegisterInput) => {
    setIsLoading(true);
    try {
      const data = await api.register(input);
      setApiToken(data.token);
      setUser(data.user);
      setPreferences(data.preferences);
      sounds.enabled = data.preferences?.soundEnabled ?? true;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch {}
    setApiToken(null);
    setUser(null);
    setPreferences(null);
  };

  const updateProfile = async (input: UpdateProfileInput) => {
    const res = await api.updateProfile(input);
    setUser((prev) => (prev ? { ...prev, ...res.user } : res.user));
  };

  const updatePreferences = async (input: UpdatePreferencesInput) => {
    const res = await api.updatePreferences(input);
    setPreferences((prev) => (prev ? { ...prev, ...res.preferences } : res.preferences));
    if (res.preferences.soundEnabled !== undefined) {
      sounds.enabled = res.preferences.soundEnabled;
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
