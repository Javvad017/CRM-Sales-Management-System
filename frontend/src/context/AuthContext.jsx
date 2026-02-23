/**
 * Auth Context
 * Provides authentication state throughout the app.
 * Handles login, logout, and auto-rehydration from localStorage.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authAPI } from '../services/api'
import toast from 'react-hot-toast'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true) // Initial auth check

    // ── Rehydrate from localStorage on mount ──────────────────────────────────
    useEffect(() => {
        const initAuth = async () => {
            const token = localStorage.getItem('accessToken')
            if (!token) {
                setLoading(false)
                return
            }
            try {
                const { data } = await authAPI.getMe()
                setUser(data.user)
            } catch {
                // Token invalid/expired — clear storage
                localStorage.removeItem('accessToken')
                localStorage.removeItem('refreshToken')
            } finally {
                setLoading(false)
            }
        }
        initAuth()
    }, [])

    // ── Login ─────────────────────────────────────────────────────────────────
    const login = useCallback(async (email, password) => {
        const { data } = await authAPI.login({ email, password })
        localStorage.setItem('accessToken', data.accessToken)
        localStorage.setItem('refreshToken', data.refreshToken)
        setUser(data.user)
        return data.user
    }, [])

    // ── Logout ────────────────────────────────────────────────────────────────
    const logout = useCallback(() => {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        setUser(null)
        toast.success('Logged out successfully')
    }, [])

    // ── Update local user state ───────────────────────────────────────────────
    const updateUser = useCallback((updates) => {
        setUser((prev) => ({ ...prev, ...updates }))
    }, [])

    const value = {
        user,
        loading,
        login,
        logout,
        updateUser,
        isAdmin: user?.role === 'admin',
        isSales: user?.role === 'sales',
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
    const ctx = useContext(AuthContext)
    if (!ctx) throw new Error('useAuth must be used within AuthProvider')
    return ctx
}
