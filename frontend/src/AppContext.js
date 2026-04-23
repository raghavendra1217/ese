// import React, { createContext, useState, useContext, useEffect } from 'react';
// import { jwtDecode } from 'jwt-decode';

// import { useNavigate } from 'react-router-dom';

// const AuthContext = createContext(null);

// export const AppProvider = ({ children }) => {
//   const [token, setToken] = useState(null);
//   const [user, setUser] = useState(null);
//   const [loading, setLoading] = useState(true); 

//   const navigate = useNavigate();

//   useEffect(() => {
//     const storedToken = localStorage.getItem('authToken');
//     const storedUser = localStorage.getItem('authUser'); // ✅ NEW LINE

//     if (storedToken) {
//       try {
//         const decodedUser = jwtDecode(storedToken);
//         if (decodedUser.exp * 1000 < Date.now()) {
//           localStorage.removeItem('authToken');
//           localStorage.removeItem('authUser'); // ✅ NEW LINE
//         } else {
//           setToken(storedToken);
//           // ✅ Prefer full user from storage, fallback to decoded one
//           setUser(storedUser ? JSON.parse(storedUser) : {
//             userId: decodedUser.userId,
//             email: decodedUser.email,
//             role: decodedUser.role
//           });
//         }
//       } catch (error) {
//         localStorage.removeItem('authToken');
//         localStorage.removeItem('authUser'); // ✅ NEW LINE
//       }
//     }
//     setLoading(false);
//   }, []);

//   // ✅ Save both token and user to localStorage
//   const login = (newToken, newUser) => {
//     localStorage.setItem('authToken', newToken);
//     localStorage.setItem('authUser', JSON.stringify(newUser)); // ✅ NEW LINE
//     setToken(newToken);
//     setUser(newUser);
//   };

//   // ✅ Clear both token and user on logout
//   const logout = () => {
//     console.log("Logging out and redirecting...");
//     localStorage.removeItem('authToken');
//     localStorage.removeItem('authUser'); // ✅ NEW LINE
//     setToken(null);
//     setUser(null);
//     navigate('/login', { replace: true }); 
//   };

//   const value = { user, token, loading, login, logout };
//   return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
// };

// export const useAuth = () => {
//   const context = useContext(AuthContext);
//   if (context === undefined) {
//     throw new Error('useAuth must be used within an AppProvider');
//   }
//   return context;
  
// };






import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

// storage keys + broadcast channel
const AUTH_TOKEN_KEY = 'authToken';
const AUTH_USER_KEY  = 'authUser';
const CHANNEL_NAME   = 'auth-bc';

export const AppProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [user, setUser]   = useState(null);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  // helpers
  const clearStorage = useCallback(() => {
    try {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(AUTH_USER_KEY);
    } catch {}
  }, []);

  const readFromStorage = useCallback(() => {
    const storedToken = localStorage.getItem(AUTH_TOKEN_KEY);
    const storedUser  = localStorage.getItem(AUTH_USER_KEY);

    if (!storedToken) {
      setToken(null);
      setUser(null);
      return;
    }

    try {
      const decoded = jwtDecode(storedToken);
      // exp is in seconds
      if (!decoded?.exp || decoded.exp * 1000 < Date.now()) {
        clearStorage();
        setToken(null);
        setUser(null);
        return;
      }

      setToken(storedToken);
      // Always use the stored user object from the backend response
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      } else {
        // Fallback to JWT data if no stored user (shouldn't happen in normal flow)
        setUser({
          id: decoded.userId, // Use 'id' to match backend userForClient structure
          email: decoded.email,
          role: decoded.role,
        });
      }
    } catch {
      clearStorage();
      setToken(null);
      setUser(null);
    }
  }, [clearStorage]);

  // initial bootstrap + cross-tab sync
  useEffect(() => {
    let bc;
    readFromStorage();
    setLoading(false);

    try {
      bc = new BroadcastChannel(CHANNEL_NAME);
      bc.onmessage = (e) => {
        if (e?.data?.type === 'logout') {
          clearStorage();
          setToken(null);
          setUser(null);
          if (window.location.pathname !== '/login') {
            navigate('/login', { replace: true });
          }
        } else if (e?.data?.type === 'login') {
          // another tab logged in — re-read storage
          readFromStorage();
        }
      };
    } catch {
      // BroadcastChannel not supported; storage event fallback below will handle
    }

    const onStorage = (e) => {
      if (e.key === AUTH_TOKEN_KEY || e.key === AUTH_USER_KEY) {
        readFromStorage();
      }
    };
    window.addEventListener('storage', onStorage);

    return () => {
      window.removeEventListener('storage', onStorage);
      try { bc && bc.close(); } catch {}
    };
  }, [navigate, readFromStorage]);

  // save both token + user and broadcast to other tabs
  const login = (newToken, newUser) => {
    localStorage.setItem(AUTH_TOKEN_KEY, newToken);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(newUser || null));
    setToken(newToken);
    setUser(newUser || null);
    try {
      const bc = new BroadcastChannel(CHANNEL_NAME);
      bc.postMessage({ type: 'login' });
      bc.close();
    } catch {}
  };

  // clear creds, broadcast, redirect
  const logout = useCallback(() => {
    clearStorage();
    setToken(null);
    setUser(null);
    try {
      const bc = new BroadcastChannel(CHANNEL_NAME);
      bc.postMessage({ type: 'logout' });
      bc.close();
    } catch {}
    navigate('/login', { replace: true });
  }, [navigate]);

  // Function to handle API errors and automatically logout if needed
  const handleApiError = useCallback((error) => {
    // If it's a 401 (Unauthorized) or 403 (Forbidden), logout the user
    if (error?.status === 401 || error?.status === 403) {
      console.log('API authorization error, logging out user');
      logout();
    }
  }, [logout]);

  const value = { user, token, loading, login, logout, handleApiError };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (ctx === undefined) {
    throw new Error('useAuth must be used within an AppProvider');
  }
  return ctx;
};
