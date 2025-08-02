import React, { createContext, useState, useEffect, useCallback, useContext } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkSession = useCallback(() => {
    try {
      setLoading(true);
      const storedSession = localStorage.getItem('session');
      if (storedSession) {
        const parsedSession = JSON.parse(storedSession);
        if (parsedSession.expires_at > Date.now()) {
          setSession(parsedSession);
        } else {
          localStorage.removeItem('session');
          setSession(null);
        }
      } else {
        setSession(null);
      }
    } catch (error) {
      console.error('Error reading session from localStorage:', error);
      setSession(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkSession();
    
    const handleStorageChange = (event) => {
      if (event.key === 'session') {
        checkSession();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [checkSession]);

  const signIn = (email, password) => {
    return new Promise((resolve, reject) => {
      if (email === 'admin@cherolee.us' && password === 'password') {
        const newSession = { user: { id: 'local-user', email: 'admin@cherolee.us' }, expires_at: Date.now() + 3600 * 1000 };
        localStorage.setItem('session', JSON.stringify(newSession));
        setSession(newSession);
        resolve({ data: { session: newSession }, error: null });
      } else {
        reject({ message: 'Invalid credentials' });
      }
    });
  };

  const signOut = () => {
    return new Promise((resolve) => {
      localStorage.removeItem('session');
      setSession(null);
      resolve({ error: null });
    });
  };

  const value = {
    session,
    user: session?.user,
    loading,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};