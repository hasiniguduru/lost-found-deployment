import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  UserProfile,
  UserRole,
  NotificationItem,
  authApi,
  notificationsApi,
  getStoredToken,
  setStoredToken,
} from '../services/api';

interface AuthContextValue {
  user: UserProfile | null;
  token: string | null;
  loading: boolean;
  notifications: NotificationItem[];
  unreadCount: number;
  loginWithCredentials: (email: string, password: string) => Promise<void>;
  registerAccount: (payload: {
    fullName: string;
    email: string;
    password: string;
    campusId: string;
    department: string;
    phone: string;
    role: UserRole;
  }) => Promise<void>;
  switchActiveRole: (role: UserRole) => Promise<void>;
  logout: () => void;
  refreshNotifications: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(getStoredToken());
  const [loading, setLoading] = useState<boolean>(true);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const refreshNotifications = useCallback(async () => {
    if (!getStoredToken()) return;
    try {
      const list = await notificationsApi.listNotifications();
      setNotifications(list);
    } catch {
      // ignore if unauthenticated
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    async function restoreSession() {
      setLoading(true);
      try {
        const existingToken = getStoredToken();
        if (existingToken) {
          const profile = await authApi.getMe();
          if (mounted) {
            setUser(profile);
            setToken(existingToken);
          }
          const list = await notificationsApi.listNotifications();
          if (mounted) {
            setNotifications(list);
          }
        } else {
          if (mounted) {
            setUser(null);
            setToken(null);
          }
        }
      } catch {
        setStoredToken(null);
        if (mounted) {
          setToken(null);
          setUser(null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }
    restoreSession();
    return () => {
      mounted = false;
    };
  }, []);

  const loginWithCredentials = async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    setStoredToken(res.token);
    setToken(res.token);
    setUser(res.user);
    await refreshNotifications();
  };

  const registerAccount = async (payload: {
    fullName: string;
    email: string;
    password: string;
    campusId: string;
    department: string;
    phone: string;
    role: UserRole;
  }) => {
    const res = await authApi.register(payload);
    setStoredToken(res.token);
    setToken(res.token);
    setUser(res.user);
    await refreshNotifications();
  };

  const switchActiveRole = async (role: UserRole) => {
    const res = await authApi.switchRole(role);
    setStoredToken(res.token);
    setToken(res.token);
    setUser(res.user);
    await refreshNotifications();
  };

  const logout = () => {
    setStoredToken(null);
    setToken(null);
    setUser(null);
    setNotifications([]);
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        notifications,
        unreadCount,
        loginWithCredentials,
        registerAccount,
        switchActiveRole,
        logout,
        refreshNotifications,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
