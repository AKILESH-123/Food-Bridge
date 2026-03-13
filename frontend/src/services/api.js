import axios from 'axios';

const configuredApiUrl = process.env.REACT_APP_API_URL?.trim();
export const configuredBackendOrigin = configuredApiUrl
  ? configuredApiUrl.replace(/\/+$/, '').replace(/\/api$/, '')
  : null;
const normalizedApiBaseUrl = configuredApiUrl
  ? `${configuredBackendOrigin}/api`
  : '/api';

export const buildBackendUrl = (resourcePath = '') => {
  const normalizedPath = resourcePath.startsWith('/') ? resourcePath : `/${resourcePath}`;

  if (!configuredApiUrl) {
    return normalizedPath;
  }

  return `${configuredBackendOrigin}${normalizedPath}`;
};

const api = axios.create({
  baseURL: normalizedApiBaseUrl,
  headers: { 'Content-Type': 'application/json' },
});

// Attach token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('foodbridge_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle 401 globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('foodbridge_token');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
