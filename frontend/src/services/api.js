/**
 * Axios API Service
 * Configures a base axios instance with:
 * - Base URL
 * - Auth header injection
 * - Automatic token refresh on 401
 * - Consistent error handling
 */

import axios from 'axios'

const api = axios.create({
    baseURL: '/api',
    headers: { 'Content-Type': 'application/json' },
    timeout: 15000,
})

// ── Request Interceptor: Attach Bearer Token ──────────────────────────────────
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken')
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }
        return config
    },
    (error) => Promise.reject(error)
)

// ── Response Interceptor: Handle Token Expiry ─────────────────────────────────
let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
    failedQueue.forEach((prom) => {
        if (error) prom.reject(error)
        else prom.resolve(token)
    })
    failedQueue = []
}

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config

        if (
            error.response?.status === 401 &&
            error.response?.data?.code === 'TOKEN_EXPIRED' &&
            !originalRequest._retry
        ) {
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject })
                })
                    .then((token) => {
                        originalRequest.headers.Authorization = `Bearer ${token}`
                        return api(originalRequest)
                    })
                    .catch((err) => Promise.reject(err))
            }

            originalRequest._retry = true
            isRefreshing = true

            const refreshToken = localStorage.getItem('refreshToken')
            if (!refreshToken) {
                isRefreshing = false
                localStorage.clear()
                window.location.href = '/login'
                return Promise.reject(error)
            }

            try {
                const { data } = await axios.post('/api/auth/refresh-token', { refreshToken })
                localStorage.setItem('accessToken', data.accessToken)
                localStorage.setItem('refreshToken', data.refreshToken)
                api.defaults.headers.common.Authorization = `Bearer ${data.accessToken}`
                processQueue(null, data.accessToken)
                return api(originalRequest)
            } catch (refreshError) {
                processQueue(refreshError, null)
                localStorage.clear()
                window.location.href = '/login'
                return Promise.reject(refreshError)
            } finally {
                isRefreshing = false
            }
        }

        return Promise.reject(error)
    }
)

export default api

// ── Auth API ──────────────────────────────────────────────────────────────────
export const authAPI = {
    register: (data) => api.post('/auth/register', data),
    login: (data) => api.post('/auth/login', data),
    getMe: () => api.get('/auth/me'),
    forgotPassword: (data) => api.post('/auth/forgot-password', data),
    resetPassword: (token, data) => api.post(`/auth/reset-password/${token}`, data),
    verifyEmail: (token) => api.get(`/auth/verify-email/${token}`),
    updateProfile: (data) => api.put('/auth/update-profile', data),
    changePassword: (data) => api.put('/auth/change-password', data),
}

// ── Lead API ──────────────────────────────────────────────────────────────────
export const leadAPI = {
    getAll: (params) => api.get('/leads', { params }),
    getById: (id) => api.get(`/leads/${id}`),
    create: (data) => api.post('/leads', data),
    update: (id, data) => api.put(`/leads/${id}`, data),
    delete: (id) => api.delete(`/leads/${id}`),
    addActivity: (id, data) => api.post(`/leads/${id}/activities`, data),
    getPipeline: () => api.get('/leads/pipeline'),
}

// ── Deal API ──────────────────────────────────────────────────────────────────
export const dealAPI = {
    getAll: (params) => api.get('/deals', { params }),
    getById: (id) => api.get(`/deals/${id}`),
    create: (data) => api.post('/deals', data),
    update: (id, data) => api.put(`/deals/${id}`, data),
    delete: (id) => api.delete(`/deals/${id}`),
    getMetrics: () => api.get('/deals/metrics'),
}

// ── Admin API ─────────────────────────────────────────────────────────────────
export const adminAPI = {
    getStats: () => api.get('/admin/stats'),
    getAnalytics: (period) => api.get('/admin/analytics', { params: { period } }),
    getUsers: (params) => api.get('/admin/users', { params }),
    createUser: (data) => api.post('/admin/users', data),
    getUserById: (id) => api.get(`/admin/users/${id}`),
    updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
    deleteUser: (id) => api.delete(`/admin/users/${id}`),
    assignLead: (leadId, userId) => api.put(`/admin/leads/${leadId}/assign`, { userId }),
}
