import React, { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { authAPI } from '../services/api'
import toast from 'react-hot-toast'

export default function ResetPasswordPage() {
    const { token } = useParams()
    const navigate = useNavigate()
    const [form, setForm] = useState({ password: '', confirmPassword: '' })
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (form.password !== form.confirmPassword) {
            toast.error('Passwords do not match')
            return
        }
        setLoading(true)
        try {
            await authAPI.resetPassword(token, { password: form.password })
            toast.success('Password reset! Please log in.')
            navigate('/login')
        } catch (err) {
            toast.error(err.response?.data?.message || 'Reset failed. Link may be expired.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="auth-page">
            <div className="auth-card">
                <h1 className="auth-title">Reset Password</h1>
                <p className="auth-subtitle">Choose a strong new password</p>
                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">New Password</label>
                        <input
                            id="reset-password"
                            className="form-input"
                            type="password"
                            placeholder="Min 8 characters"
                            value={form.password}
                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Confirm Password</label>
                        <input
                            id="reset-confirm"
                            className="form-input"
                            type="password"
                            placeholder="••••••••"
                            value={form.confirmPassword}
                            onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                            required
                        />
                    </div>
                    <button id="reset-submit" className="btn btn-primary btn-lg w-full" disabled={loading}>
                        {loading ? <><span className="spinner spinner-sm" /> Resetting...</> : '🔑 Reset Password'}
                    </button>
                </form>
                <p className="auth-footer"><Link to="/login">← Back to Login</Link></p>
            </div>
        </div>
    )
}
