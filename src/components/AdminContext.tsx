import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

interface AdminContextValue {
  isAdmin: boolean;
  login: (secret: string) => Promise<boolean>;
  logout: () => void;
}

const AdminContext = createContext<AdminContextValue | undefined>(undefined);

const ADMIN_TOKEN = (import.meta as any).env?.VITE_ADMIN_TOKEN || 'cringe-admin-token';
const STORAGE_KEY = 'adminToken';
const API_BASE = (import.meta as any).env?.VITE_API_BASE || 'http://localhost:3001';

export function AdminProvider({ children }: { children: ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && stored === ADMIN_TOKEN) {
      setIsAdmin(true);
    }
  }, []);

  const value = useMemo<AdminContextValue>(() => {
    const login = async (secret: string) => {
      try {
        const response = await fetch(`${API_BASE}/api/admin/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ secret }),
        });

        if (!response.ok) return false;

        const result = await response.json();
        if (result.success) {
          localStorage.setItem(STORAGE_KEY, ADMIN_TOKEN);
          setIsAdmin(true);
          return true;
        }
        return false;
      } catch {
        return false;
      }
    };

    const logout = () => {
      localStorage.removeItem(STORAGE_KEY);
      setIsAdmin(false);
    };

    return { isAdmin, login, logout };
  }, [isAdmin]);

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error('useAdmin must be used within an AdminProvider');
  return ctx;
}

// Utility function to get admin token for API requests
export function getAdminToken() {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === ADMIN_TOKEN ? ADMIN_TOKEN : null;
}

export function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { isAdmin } = useAdmin();
  const location = useLocation();
  if (!isAdmin) return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  return children;
}
