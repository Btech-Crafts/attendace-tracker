import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('attendance_token');
    if (!token) {
      setLoading(false);
      return;
    }

    // Temporary debugging aid (safe to remove later)
    console.debug('[AuthContext] token present:', Boolean(token));

    api.get('/auth/me')
      .then((response) => setUser(response.data.user))
      .catch(() => {
        localStorage.removeItem('attendance_token');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const value = useMemo(() => ({
    user,
    loading,
    async login(credentials) {
      const response = await api.post('/auth/login', credentials);
      localStorage.setItem('attendance_token', response.data.token);
      setUser(response.data.user);
      return response.data.user;
    },
    async register(userData) {
      const response = await api.post('/auth/register', userData);
      localStorage.setItem('attendance_token', response.data.token);
      setUser(response.data.user);
      return response.data.user;
    },
    async updateTargetPercentage(targetPercentage) {
      const response = await api.put('/auth/me', { targetPercentage });
      setUser(response.data.user);
      return response.data.user;
    },
    logout() {
      localStorage.removeItem('attendance_token');
      setUser(null);
    }
  }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}