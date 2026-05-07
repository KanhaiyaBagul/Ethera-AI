import { createContext, useState, useEffect } from 'react';
import { getMe, loginUser, registerUser } from '../api/auth.api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const res = await getMe();
          if (res.success) {
            setUser(res.user);
          } else {
            localStorage.removeItem('token');
          }
        } catch (error) {
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    };

    fetchUser();
  }, []);

  const login = async (credentials) => {
    const res = await loginUser(credentials);
    if (res.success) {
      localStorage.setItem('token', res.token);
      setUser(res.user);
    }
    return res;
  };

  const signup = async (userData) => {
    const res = await registerUser(userData);
    if (res.success) {
      localStorage.setItem('token', res.token);
      setUser(res.user);
    }
    return res;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
