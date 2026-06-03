import { createContext, useContext, useState, useEffect } from 'react';
import API from '../api';
import { socket } from '../api/socket';

const AuthContext = createContext(null);

/**
 * Authentication Provider
 * Manages user login state, token storage, and session restoration.
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session from localStorage on app load
  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (token && storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);

      // Verify token is still valid with the server
      API.get('/auth/me')
        .then((res) => {
          setUser(res.data.user);
          localStorage.setItem('user', JSON.stringify(res.data.user));
        })
        .catch(() => {
          // Token invalid or expired
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  // Manage socket connection and automatic re-registration on connection/reconnection
  useEffect(() => {
    if (user) {
      socket.connect();

      const handleConnect = () => {
        socket.emit('register_user', user._id);
      };

      if (socket.connected) {
        handleConnect();
      }

      socket.on('connect', handleConnect);

      return () => {
        socket.off('connect', handleConnect);
      };
    } else {
      socket.disconnect();
    }
  }, [user]);

  /**
   * Login with email and password.
   * Stores JWT and user data in localStorage.
   */
  const login = async (email, password) => {
    const { data } = await API.post('/auth/login', { email, password });
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
    return data;
  };

  const signup = async (username, email, password) => {
    const { data } = await API.post('/auth/signup', { username, email, password });
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
    return data;
  };

  /**
   * Logout — clears token and user data.
   */
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Custom hook to access auth context.
 * Must be used within an AuthProvider.
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
