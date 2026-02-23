import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { authAPI } from '../services/api'

export default function VerifyEmailPage() {
    const { token } = useParams()
    const [status, setStatus] = useState('loading') // loading | success | error

    useEffect(() => {
        authAPI.verifyEmail(token)
            .then(() => setStatus('success'))
            .catch(() => setStatus('error'))
    }, [token])

    return (
        <div className="auth-page">
            <div className="auth-card" style={{ textAlign: 'center' }}>
                {status === 'loading' && (
                    <>
                        <div className="spinner" style={{ margin: '0 auto 1.5rem' }} />
                        <p className="auth-subtitle">Verifying your email...</p>
                    </>
                )}
                {status === 'success' && (
                    <>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
                        <h1 className="auth-title">Email Verified!</h1>
                        <p className="auth-subtitle">Your account is now active. You can sign in.</p>
                        <Link to="/login" className="btn btn-primary btn-lg" style={{ marginTop: '1.5rem' }}>Go to Login</Link>
                    </>
                )}
                {status === 'error' && (
                    <>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>❌</div>
                        <h1 className="auth-title" style={{ color: 'var(--color-danger)' }}>Verification Failed</h1>
                        <p className="auth-subtitle">The link is invalid or has expired.</p>
                        <Link to="/login" className="btn btn-secondary btn-lg" style={{ marginTop: '1.5rem' }}>Back to Login</Link>
                    </>
                )}
            </div>
        </div>
    )
}
