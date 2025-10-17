import { useAuth } from '../AppContext';

export const useApiErrorHandler = () => {
  const { handleApiError } = useAuth();

  const handleError = (error) => {
    console.error('API Error:', error);
    
    // Check if it's an authorization error
    if (error?.status === 401 || error?.status === 403) {
      console.log('Authorization error detected, logging out user');
      handleApiError(error);
    }
    
    // Return the error for further handling if needed
    return error;
  };

  return { handleError };
};
