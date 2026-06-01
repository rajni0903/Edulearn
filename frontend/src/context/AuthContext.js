/**
 * =============================================================================
 * AUTH CONTEXT — src/context/AuthContext.js
 * =============================================================================
 * Global auth state manager.
 * 
 * FIX: Network error pe user logout NAHI hoga.
 * Sirf 401/403 (actual auth failure) pe logout hoga.
 * =============================================================================
 */

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { login as loginAPI, register as registerAPI, getProfile } from '../services/api';
import { toast } from 'react-toastify';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);
  // Ref to prevent multiple simultaneous profile fetches
  const fetchingRef = useRef(false);

  // ─── App start par auth check ──────────────────────────────────────────────
  useEffect(() => {
    const initAuth = async () => {
      if (fetchingRef.current) return;
      fetchingRef.current = true;

      const savedToken = localStorage.getItem('edulearn_token');
      const savedUser  = localStorage.getItem('edulearn_user');

      if (savedToken && savedUser) {
        try {
          // Pehle saved user set karo — fast display ke liye
          const parsedUser = JSON.parse(savedUser);
          setUser(parsedUser);

          // Backend se fresh profile verify karo
          const res = await getProfile();
          const freshUser = res.data.user;
          setUser(freshUser);
          localStorage.setItem('edulearn_user', JSON.stringify(freshUser));
        } catch (err) {
          const status = err?.response?.status;

          if (status === 401 || status === 403) {
            // Token genuinely expired/invalid — logout karo
            localStorage.removeItem('edulearn_token');
            localStorage.removeItem('edulearn_user');
            setUser(null);
          }
          // Network error (status undefined) — keep user logged in with cached data
          // savedUser already set above via setUser(parsedUser)
        }
      }

      fetchingRef.current = false;
      setLoading(false);
    };

    initAuth();
  }, []); // runs once on mount only

  // ─── LOGIN ──────────────────────────────────────────────────────────────────
  const login = async (email, password) => {
    const res = await loginAPI({ email, password });
    const { token, user } = res.data;
    localStorage.setItem('edulearn_token', token);
    localStorage.setItem('edulearn_user', JSON.stringify(user));
    setUser(user);
    toast.success(`Welcome back, ${user.name}! 🎉`);
    return user;
  };

  // ─── REGISTER ───────────────────────────────────────────────────────────────
  const register = async (name, email, password, role) => {
    const res = await registerAPI({ name, email, password, role });
    if (res.data.pending) {
      return { pending: true };
    }
    const { token, user } = res.data;
    localStorage.setItem('edulearn_token', token);
    localStorage.setItem('edulearn_user', JSON.stringify(user));
    setUser(user);
    toast.success(`Welcome to EduLearn, ${user.name}! 🎉`);
    return user;
  };

  // ─── LOGOUT ─────────────────────────────────────────────────────────────────
  const logout = () => {
    localStorage.removeItem('edulearn_token');
    localStorage.removeItem('edulearn_user');
    setUser(null);
    toast.info('Logged out successfully. See you again!');
    window.location.href = '/login';
  };

  const contextValue = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside <AuthProvider>.');
  }
  return context;
};
