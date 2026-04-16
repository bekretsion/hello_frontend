import axios from 'axios';

export const httpClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

httpClient.interceptors.response.use(
  (response) => {
    // Handle case where response data might be an object being converted to string incorrectly
    if (response.data && typeof response.data === 'object' && response.data.constructor === Object) {
      // Data is already a proper object, no conversion needed
      return response;
    }
    
    // If response data is a string, try to parse it as JSON
    if (typeof response.data === 'string') {
      try {
        response.data = JSON.parse(response.data);
      } catch (e) {
        // If parsing fails, leave as is but log warning
        console.warn('Failed to parse response data as JSON:', response.data);
      }
    }
    
    return response;
  },
  (error) => {
    // Preserve the original error structure but use the backend message if available
    if (error.response?.data?.message) {
      error.message = error.response.data.message;
    } else if (error.response?.data?.error) {
      error.message = error.response.data.error;
    }
    return Promise.reject(error);
  }
);


