import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiFetch, clearStoredToken, getStoredToken, storeToken } from '../api/client';
import { avatarColor, User } from '../utils/helpers';

interface RegisterData {
  studentId?: string;
  email?: string;
  fullName: string;
  role: 'student' | 'lecturer';
  password: string;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updatePushToken: (pushToken: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};

function toUser(u: any): User {
  return {
    id: u.id,
    fullName: u.fullName,
    email: u.email ?? undefined,
    studentId: u.studentId ?? undefined,
    role: u.role as 'student' | 'lecturer',
    avatarColor: avatarColor(u.fullName),
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const token = await getStoredToken();
      if (token) {
        try {
          const res = await apiFetch<{ token: string; user: any }>('/api/auth/refresh', {
            method: 'POST',
          });
          await storeToken(res.token);
          setUser(toUser(res.user));
        } catch {
          await clearStoredToken();
        }
      }
      setLoading(false);
    })();
  }, []);

  const login = async (identifier: string, password: string) => {
    const res = await apiFetch<{ token: string; user: any }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
    });
    await storeToken(res.token);
    setUser(toUser(res.user));
  };

  const register = async (data: RegisterData) => {
    const res = await apiFetch<{ token: string; user: any }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    await storeToken(res.token);
    setUser(toUser(res.user));
  };

  const logout = async () => {
    await clearStoredToken();
    setUser(null);
  };

  const updatePushToken = async (pushToken: string) => {
    await apiFetch('/api/auth/push-token', {
      method: 'PATCH',
      body: JSON.stringify({ token: pushToken }),
    });
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updatePushToken }}>
      {children}
    </AuthContext.Provider>
  );
};
