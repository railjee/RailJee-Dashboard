'use client';

import { useState, useEffect } from 'react';
import { getSession, clearSession, type User } from '@/lib/auth';
import LoginForm from './LoginForm';
import { LayoutWrapper } from './LayoutWrapper';

interface AuthProviderProps {
  children: React.ReactNode;
}

export default function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const session = getSession();
    setUser(session);
    setLoading(false);
  }, []);

  const handleLoginSuccess = () => {
    const session = getSession();
    setUser(session);
  };

  const handleLogout = () => {
    clearSession();
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-slate-600">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <LoginForm onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    // pass the current user down so the sidebar can display their info
    <LayoutWrapper user={user} onLogout={handleLogout}>
      {children}
    </LayoutWrapper>
  );
}
