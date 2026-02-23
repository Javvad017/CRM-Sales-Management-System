/**
 * App Root — Routing & Providers
 */

import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'

// Pages
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import VerifyEmailPage from './pages/VerifyEmailPage'
import DashboardPage from './pages/DashboardPage'
import LeadsPage from './pages/LeadsPage'
import LeadDetailPage from './pages/LeadDetailPage'
import DealsPage from './pages/DealsPage'
import PipelinePage from './pages/PipelinePage'
import AdminUsersPage from './pages/AdminUsersPage'
import AdminAnalyticsPage from './pages/AdminAnalyticsPage'
import ProfilePage from './pages/ProfilePage'
import Layout from './components/Layout'

// ── Protected Route ───────────────────────────────────────────────────────────
const ProtectedRoute = ({ children, adminOnly = false }) => {
    const { user, loading } = useAuth()

    if (loading) {
        return (
            <div className="loading-center" style={{ minHeight: '100vh' }}>
                <div className="spinner" />
            </div>
        )
    }

    if (!user) return <Navigate to="/login" replace />
    if (adminOnly && user.role !== 'admin') return <Navigate to="/dashboard" replace />

    return children
}

// ── Public Route (redirect logged in users) ───────────────────────────────────
const PublicRoute = ({ children }) => {
    const { user, loading } = useAuth()
    if (loading) return null
    if (user) return <Navigate to="/dashboard" replace />
    return children
}

// ── App Routes ────────────────────────────────────────────────────────────────
function AppRoutes() {
    return (
        <Routes>
            {/* Public */}
            <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
            <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />
            <Route path="/reset-password/:token" element={<PublicRoute><ResetPasswordPage /></PublicRoute>} />
            <Route path="/verify-email/:token" element={<VerifyEmailPage />} />

            {/* Protected */}
            <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="leads" element={<LeadsPage />} />
                <Route path="leads/:id" element={<LeadDetailPage />} />
                <Route path="deals" element={<DealsPage />} />
                <Route path="pipeline" element={<PipelinePage />} />
                <Route path="profile" element={<ProfilePage />} />

                {/* Admin only */}
                <Route path="admin/users" element={<ProtectedRoute adminOnly><AdminUsersPage /></ProtectedRoute>} />
                <Route path="admin/analytics" element={<ProtectedRoute adminOnly><AdminAnalyticsPage /></ProtectedRoute>} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
    )
}

export default function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <AppRoutes />
                <Toaster
                    position="top-right"
                    toastOptions={{
                        duration: 3500,
                        style: {
                            background: '#1a1d27',
                            color: '#e2e8f0',
                            border: '1px solid #2d3154',
                            borderRadius: '10px',
                            fontSize: '14px',
                        },
                        success: { iconTheme: { primary: '#22c55e', secondary: '#1a1d27' } },
                        error: { iconTheme: { primary: '#ef4444', secondary: '#1a1d27' } },
                    }}
                />
            </BrowserRouter>
        </AuthProvider>
    )
}
