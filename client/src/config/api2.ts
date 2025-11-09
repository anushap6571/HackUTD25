// API configuration - Hardcoded to Flask backend
const API_BASE_URL = 'http://127.0.0.1:5001';

console.log('🔍 API_BASE_URL:', API_BASE_URL);

export const api = {
  baseURL: API_BASE_URL,
  
  async request(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    console.log('🔍 Making request to:', url);
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'An error occurred' }));
      throw new Error(error.message || error.error || 'Request failed');
    }

    return response.json();
  },

  async post(endpoint: string, data: any) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async get(endpoint: string, config?: { params?: Record<string, any> }) {
    let url = `${API_BASE_URL}${endpoint}`;
    if (config?.params) {
      const queryString = new URLSearchParams(
        Object.entries(config.params).map(([key, val]) => [key, String(val)])
      ).toString();
      url += `?${queryString}`;
    }

    console.log('🔍 Making GET request to:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'An error occurred' }));
      throw new Error(error.message || error.error || 'Request failed');
    }

    const data = await response.json();
    return { data }; // mimic Axios response
  },
};

export default api;
