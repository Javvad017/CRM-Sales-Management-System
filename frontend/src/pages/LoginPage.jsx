/**
 * Login Page
 */

import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function LoginPage() {
    const [form, setForm] = useState({ email: '', password: '' })
    const [loading, setLoading] = useState(false)
    const { login } = useAuth()
    const navigate = useNavigate()

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!form.email || !form.password) {
            toast.error('Please fill in all fields')
            return
        }
        setLoading(true)
        try {
            await login(form.email, form.password)
            toast.success('Welcome back! 👋')
            navigate('/dashboard')
        } catch (err) {
            const msg = err.response?.data?.message || 'Login failed. Please try again.'
            toast.error(msg)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-logo">
                    <div style={{
                        width: 48, height: 48,
                        background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
                        borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1.4rem', fontWeight: 800, color: 'white'
                    }}>C</div>
                    <span style={{ fontSize: '1.4rem', fontWeight: 800 }}>CRM <span style={{ color: 'var(--color-primary)' }}>Pro</span></span>
                </div>

                <h1 className="auth-title">Welcome back</h1>
                <p className="auth-subtitle">Sign in to your CRM dashboard</p>

                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Email Address</label>
                        <input
                            id="login-email"
                            className="form-input"
                            type="email"
                            name="email"
                            placeholder="admin@crm.com"
                            value={form.email}
                            onChange={handleChange}
                            autoComplete="email"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <input
                            id="login-password"
                            className="form-input"
                            type="password"
                            name="password"
                            placeholder="••••••••"
                            value={form.password}
                            onChange={handleChange}
                            autoComplete="current-password"
                            required
                        />
                    </div>

                    <div style={{ textAlign: 'right' }}>
                        <Link to="/forgot-password" style={{ fontSize: '0.875rem', color: 'var(--color-primary)' }}>
                            Forgot password?
                        </Link>
                    </div>

                    <button id="login-submit" className="btn btn-primary btn-lg w-full" type="submit" disabled={loading}>
                        {loading ? <><span className="spinner spinner-sm" /> Signing in...</> : '🔐 Sign In'}
                    </button>
                </form>

                <p className="auth-footer">
                    Don't have an account?{' '}
                    <Link to="/register">Create one</Link>
                </p>

                <div style={{
                    marginTop: '1.5rem', padding: '1rem',
                    background: 'rgba(99,102,241,0.1)', borderRadius: 8,
                    fontSize: '0.8rem', color: 'var(--color-text-muted)', lineHeight: 1.6
                }}>
                    <strong style={{ color: 'var(--color-text)' }}>Demo Credentials:</strong><br />
                    Admin: admin@crm.com / Admin@123456
                </div>
            </div>
        </div>
    )
}
