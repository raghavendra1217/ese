// import { useState, useEffect, useCallback } from 'react';
// import { useAuth } from '../AppContext';

// const useApi = (url, endpoint) => {
//     const { token } = useAuth();
//     const [data, setData] = useState(null);
//     const [isLoading, setIsLoading] = useState(true);
//     const [error, setError] = useState(null);

// helo

//     const fetchData = useCallback(async () => {
//         if (!token) {
//             setIsLoading(false);
//             return;
//         }

//         setIsLoading(true);
//         setError(null);

//         try {
//             // ✅ --- CACHE BUSTING LOGIC ---
//             // Create a unique timestamp to append to the URL
//             const cacheBuster = `_t=${Date.now()}`;
            
//             // Smartly append the cache buster. If the URL already has a '?', use '&'. Otherwise, use '?'.
//             const finalUrl = endpoint.includes('?')
//                 ? `${url}${endpoint}&${cacheBuster}`
//                 : `${url}${endpoint}?${cacheBuster}`;
//             // --- END OF CACHE BUSTING LOGIC ---

//             // ✅ Use the new, unique URL for the fetch request
//             const response = await fetch(finalUrl, {
//                 headers: { 'Authorization': `Bearer ${token}` }
//             });

//             if (!response.ok) {
//                 const errorData = await response.json();
//                 throw new Error(errorData.message || 'Failed to fetch data');
//             }
            
//             const result = await response.json();
//             setData(result);
//         } catch (err) {
//             setError(err.message);
//         } finally {
//             setIsLoading(false);
//         }
//     }, [token, url, endpoint]);

//     useEffect(() => {
//         fetchData();
//     }, [fetchData]);

//     return { data, isLoading, error, refetch: fetchData };
// };

// export default useApi;







import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../AppContext';

const AUTH_KEYS = ['authToken', 'authUser', 'token', 'user', 'jwt', 'jwtToken']; // remove what you use

const broadcastLogout = () => {
  try {
    const bc = new BroadcastChannel('auth-bc');
    bc.postMessage({ type: 'logout' });
    bc.close();
  } catch {}
};

const clearCreds = () => {
  try {
    AUTH_KEYS.forEach((k) => {
      localStorage.removeItem(k);
      sessionStorage.removeItem(k);
    });
  } catch {}
};

const useApi = (url, endpoint) => {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const mounted = useRef(true);

  const fetchData = useCallback(async () => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const cacheBuster = `_t=${Date.now()}`;
    const finalUrl = endpoint.includes('?')
      ? `${url}${endpoint}&${cacheBuster}`
      : `${url}${endpoint}?${cacheBuster}`;

    try {
      const res = await fetch(finalUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // 🔒 global unauthorized handling
      if (res.status === 401 || res.status === 403) {
        clearCreds();
        broadcastLogout();
        if (mounted.current) {
          setData(null);
          setError('Unauthorized');
          setIsLoading(false);
        }
        window.location.replace('/login');
        return;
      }

      if (!res.ok) {
        // best-effort error body
        let msg = 'Failed to fetch data';
        try {
          const errJson = await res.json();
          msg = errJson?.message || msg;
        } catch {}
        throw new Error(msg);
      }

      const result = await res.json();
      if (mounted.current) setData(result);
    } catch (err) {
      if (mounted.current) setError(err.message || 'Request failed');
    } finally {
      if (mounted.current) setIsLoading(false);
    }
  }, [token, url, endpoint]);

  useEffect(() => {
    mounted.current = true;
    fetchData();
    return () => {
      mounted.current = false;
    };
  }, [fetchData]);

  return { data, isLoading, error, refetch: fetchData };
};

export default useApi;
