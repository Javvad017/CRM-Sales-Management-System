import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { authAPI } from '../services/api'
import toast from 'react-hot-toast'

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [sent, setSent] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            await authAPI.forgotPassword({ email })
            setSent(true)
            toast.success('Reset link sent if email exists!')
        } catch (err) {
            toast.error(err.response?.data?.message || 'Request failed')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="auth-page">
            <div className="auth-card">
                <h1 className="auth-title">Forgot Password</h1>
                <p className="auth-subtitle">Enter your email and we'll send a reset link</p>

                {sent ? (
                    <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📧</div>
                        <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
                            Check your inbox for a password reset link.
                        </p>
                        <Link to="/login" className="btn btn-primary">Back to Login</Link>
                    </div>
                ) : (
                    <form className="auth-form" onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label">Email Address</label>
                            <input
                                id="forgot-email"
                                className="form-input"
                                type="email"
                                placeholder="you@company.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <button id="forgot-submit" className="btn btn-primary btn-lg w-full" disabled={loading}>
                            {loading ? <><span className="spinner spinner-sm" /> Sending...</> : '📨 Send Reset Link'}
                        </button>
                    </form>
                )}
                <p className="auth-footer"><Link to="/login">← Back to Login</Link></p>
            </div>
        </div>
    )
}
