import axios from 'axios';

// Base URL for your Node.js backend
const API_BASE_URL = 'http://localhost:3000/api';

// Create axios instance with default config
const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    },
    timeout: 10000 // 10 second timeout
});

// Add token to requests if available
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// =====================
// AUTH APIs (NEW)
// =====================
export const authAPI = {
    login: async (email, password) => {
        try {
            const response = await apiClient.post('/auth/login', { email, password });
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Login failed');
        }
    },

    signup: async (name, email, password) => {
        try {
            const response = await apiClient.post('/auth/signup', { name, email, password });
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Signup failed');
        }
    },

    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    }
};

// =====================
// Network Traffic APIs (EXISTING - Keep as is)
// =====================
export const networkAPI = {
    submit: (data) => apiClient.post('/network/submit', data),
    getAll: (params) => apiClient.get('/network', { params }),
    getById: (id) => apiClient.get(`/network/${id}`),
    getStatistics: () => apiClient.get('/network/statistics')
};

// =====================
// Email Communication APIs (EXISTING - Keep as is)
// =====================
export const emailAPI = {
    submit: (data) => apiClient.post('/email/submit', data),
    getAll: (params) => apiClient.get('/email', { params }),
    getById: (id) => apiClient.get(`/email/${id}`),
    getStatistics: () => apiClient.get('/email/statistics')
};

// =====================
// Alert APIs (EXISTING - Keep as is)
// =====================
export const alertAPI = {
    getAll: (params) => apiClient.get('/alerts', { params }),
    getById: (id) => apiClient.get(`/alerts/${id}`),
    updateStatus: (id, data) => apiClient.put(`/alerts/${id}/status`, data),
    addNote: (id, data) => apiClient.post(`/alerts/${id}/notes`, data),
    addAction: (id, data) => apiClient.post(`/alerts/${id}/actions`, data),
    getStatistics: () => apiClient.get('/alerts/statistics'),
    delete: (id) => apiClient.delete(`/alerts/${id}`)
};

// =====================
// ML Test APIs (EXISTING - Keep as is)
// =====================
export const mlAPI = {
    checkHealth: () => apiClient.get('/ml/health'),
    testNetwork: () => apiClient.get('/ml/test/network'),
    testEmail: () => apiClient.get('/ml/test/email')
};

export default apiClient;
