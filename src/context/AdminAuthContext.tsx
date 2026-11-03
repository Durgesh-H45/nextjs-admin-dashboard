'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { AdminProfile } from '@/lib/types';
import { useRouter } from 'next/navigation';

interface AdminAuthContextType {
  admin: AdminProfile | null;
  loading: boolean;
  coldStarting: boolean;
  pendingSeconds: number;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [coldStarting, setColdStarting] = useState<boolean>(false);
  const [pendingSeconds, setPendingSeconds] = useState<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const coldStartTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  const startColdStartTracking = () => {
    setPendingSeconds(0);
    coldStartTimeoutRef.current = setTimeout(() => {
      setColdStarting(true);
      timerRef.current = setInterval(() => {
        setPendingSeconds((prev) => prev + 1);
      }, 1000);
    }, 2500);
  };

  const stopColdStartTracking = () => {
    if (coldStartTimeoutRef.current) clearTimeout(coldStartTimeoutRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    setColdStarting(false);
    setPendingSeconds(0);
  };

  const refreshProfile = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/auth/profile');
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.user) {
          setAdmin(json.user);
        } else {
          setAdmin(null);
        }
      } else {
        setAdmin(null);
      }
    } catch {
      setAdmin(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    startColdStartTracking();
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Admin login failed' };
      }

      if (data.user) {
        setAdmin(data.user);
      } else {
        await refreshProfile();
      }
      return { success: true };
    } catch (err: unknown) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Network error during admin login',
      };
    } finally {
      stopColdStartTracking();
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    } finally {
      setAdmin(null);
      router.push('/login');
    }
  };

  return (
    <AdminAuthContext.Provider
      value={{
        admin,
        loading,
        coldStarting,
        pendingSeconds,
        login,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
}
