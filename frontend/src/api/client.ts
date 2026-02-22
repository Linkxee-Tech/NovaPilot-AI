import axios from 'axios';
import { toast } from 'sonner';
import { normalizeApiErrorMessage } from '../utils/apiError';

const envApiUrl = (import.meta.env.VITE_API_URL || '').trim();
const resolvedApiBaseUrl = envApiUrl ? envApiUrl.replace(/\/+$/, '') : '/api/v1';

const client = axios.create({
    baseURL: resolvedApiBaseUrl,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Response interceptor to handle errors
client.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error.response?.status;
        const message = normalizeApiErrorMessage(
            error.response?.data?.detail ?? error.response?.data?.message ?? error.message,
            'An unexpected error occurred'
        );

        if (status === 401) {
            localStorage.removeItem('novapilot-auth');
            if (window.location.pathname !== '/login') {
                toast.error('Session expired. Please login again.');
                window.location.href = '/login';
            }
        } else if (status === 403) {
            toast.error('Access denied.');
        } else if (status === 429) {
            toast.error('Rate limit exceeded. Please try again shortly.');
        } else if (status >= 500) {
            toast.error('Server error. Please try again.');
        } else if (error.code === 'ERR_NETWORK') {
            toast.error('Network error. Please check your connection.');
        } else {
            toast.error(message);
        }

        return Promise.reject(error);
    }
);

export default client;
