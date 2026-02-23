/**
 * Register Page
 */

import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authAPI } from '../services/api'
import toast from 'react-hot-toast'

export default function RegisterPage() {
    const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' })
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (form.password !== form.confirmPassword) {
            toast.error('Passwords do not match')
            return
        }
        if (form.password.length < 8) {
            toast.error('Password must be at least 8 characters')
            return
        }
        setLoading(true)
        try {
            await authAPI.register({ name: form.name, email: form.email, password: form.password })
            toast.success('Registration successful! Check your email to verify your account.')
            navigate('/login')
        } catch (err) {
            const errors = err.response?.data?.errors
            if (errors?.length) {
                errors.forEach((e) => toast.error(e.message))
            } else {
                toast.error(err.response?.data?.message || 'Registration failed')
            }
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

                <h1 className="auth-title">Create account</h1>
                <p className="auth-subtitle">Start managing your sales pipeline</p>

                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Full Name</label>
                        <input id="reg-name" className="form-input" type="text" name="name" placeholder="John Doe" value={form.name} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Email Address</label>
                        <input id="reg-email" className="form-input" type="email" name="email" placeholder="you@company.com" value={form.email} onChange={handleChange} required />
                    </div>
                    <div className="grid-2">
                        <div className="form-group">
                            <label className="form-label">Password</label>
                            <input id="reg-password" className="form-input" type="password" name="password" placeholder="••••••••" value={form.password} onChange={handleChange} required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Confirm Password</label>
                            <input id="reg-confirm" className="form-input" type="password" name="confirmPassword" placeholder="••••••••" value={form.confirmPassword} onChange={handleChange} required />
                        </div>
                    </div>
                    <button id="reg-submit" className="btn btn-primary btn-lg w-full" type="submit" disabled={loading}>
                        {loading ? <><span className="spinner spinner-sm" /> Creating...</> : '✨ Create Account'}
                    </button>
                </form>
                <p className="auth-footer">Already have an account? <Link to="/login">Sign in</Link></p>
            </div>
        </div>
    )
}
