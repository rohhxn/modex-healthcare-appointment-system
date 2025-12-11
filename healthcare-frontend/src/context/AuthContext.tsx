import React, { createContext, useContext, ReactNode, useState, useCallback } from 'react';
import { AuthContext as IAuthContext } from '../types';

const AuthContext = createContext<IAuthContext | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [userRole, setUserRole] = useState<'admin' | 'patient' | null>(() => {
    const stored = localStorage.getItem('userRole');
    return (stored as 'admin' | 'patient') || null;
  });

  const [userId, setUserId] = useState<string | null>(() => {
    return localStorage.getItem('userId');
  });

  const [userEmail, setUserEmail] = useState<string | null>(() => {
    return localStorage.getItem('userEmail');
  });

  const login = useCallback(
    (role: 'admin' | 'patient', id: string, email: string) => {
      setUserRole(role);
      setUserId(id);
      setUserEmail(email);
      localStorage.setItem('userRole', role);
      localStorage.setItem('userId', id);
      localStorage.setItem('userEmail', email);
    },
    []
  );

  const logout = useCallback(() => {
    setUserRole(null);
    setUserId(null);
    setUserEmail(null);
    localStorage.removeItem('userRole');
    localStorage.removeItem('userId');
    localStorage.removeItem('userEmail');
  }, []);

  const value: IAuthContext = {
    userRole,
    userId,
    userEmail,
    login,
    logout,
    isAuthenticated: userRole !== null,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
