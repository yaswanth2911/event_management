// src/context/AuthContext.jsx
import { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restore session on browser reload
    const username = localStorage.getItem('username');
    const isStudent = localStorage.getItem('is_student') === 'true';
    const isOrganizer = localStorage.getItem('is_organizer') === 'true';

    if (username) {
      setUser({ username, isStudent, isOrganizer });
    }
    setLoading(false);
  }, []);

  const login = (userData, accessToken, refreshToken) => {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
    localStorage.setItem('username', userData.username);
    localStorage.setItem('is_student', userData.is_student);
    localStorage.setItem('is_organizer', userData.is_organizer);

    setUser({
      username: userData.username,
      isStudent: userData.is_student,
      isOrganizer: userData.is_organizer
    });
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};