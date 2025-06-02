import axios from 'axios';

const getBaseUrl = () => {
  // Check if running locally by looking at the window location
  const isLocal = window.location.hostname === 'localhost' || 
                  window.location.hostname === '127.0.0.1';
                  
  return isLocal 
    ? 'http://localhost:8000'
    : 'https://aicehigh.onrender.com';
};

const api = axios.create({
  baseURL: getBaseUrl(),
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;