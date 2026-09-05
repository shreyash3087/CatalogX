'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthUser, getStoredUser, storeUser, clearUser, isAdmin } from '@/lib/auth';

interface AuthContextType {
  user: AuthUser | null;
  isAdmin: boolean;
  login: (user: AuthUser) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAdmin: false,
  login: () => {},
  logout: () => {},
  isLoading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setUser(getStoredUser());
    setIsLoading(false);

    const handleStorageChange = () => {
      setUser(getStoredUser());
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('urbanstride_auth_change', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('urbanstride_auth_change', handleStorageChange);
    };
  }, []);

  const login = (newUser: AuthUser) => {
    storeUser(newUser);
    setUser(newUser);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('urbanstride_auth_change'));
    }
  };

  const logout = () => {
    clearUser();
    setUser(null);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('urbanstride_auth_change'));
    }
  };

  const userIsAdmin = user ? isAdmin(user.email) : false;

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin: userIsAdmin,
        login,
        logout,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
