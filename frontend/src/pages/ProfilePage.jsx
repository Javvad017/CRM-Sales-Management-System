/**
 * Profile Page
 * Update name/email and change password.
 */

import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { authAPI } from '../services/api'
import toast from 'react-hot-toast'

export default function ProfilePage() {
    const { user, updateUser } = useAuth()
    const [profileForm, setProfileForm] = useState({ name: user?.name || '', email: user?.email || '' })
    const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
    const [profileLoading, setProfileLoading] = useState(false)
    const [passwordLoading, setPasswordLoading] = useState(false)

    const handleProfileUpdate = async (e) => {
        e.preventDefault()
        setProfileLoading(true)
        try {
            const { data } = await authAPI.updateProfile(profileForm)
            updateUser(data.user)
            toast.success('Profile updated!')
        } catch (err) {
            toast.error(err.response?.data?.message || 'Update failed')
        } finally {
            setProfileLoading(false)
        }
    }

    const handlePasswordChange = async (e) => {
        e.preventDefault()
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            toast.error('New passwords do not match')
            return
        }
        if (passwordForm.newPassword.length < 8) {
            toast.error('Password must be at least 8 characters')
            return
        }
        setPasswordLoading(true)
        try {
            await authAPI.changePassword({
                currentPassword: passwordForm.currentPassword,
                newPassword: passwordForm.newPassword,
            })
            toast.success('Password changed successfully!')
            setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
        } catch (err) {
            toast.error(err.response?.data?.message || 'Password change failed')
        } finally {
            setPasswordLoading(false)
        }
    }

    return (
        <div style={{ maxWidth: 680 }}>
            <div className="page-header">
                <div className="page-header-left">
                    <h2>My Profile</h2>
                    <p>Manage your account settings</p>
                </div>
            </div>

            {/* Profile Card */}
            <div className="card" style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem' }}>
                    <div style={{
                        width: 72, height: 72, borderRadius: '50%',
                        background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '2rem', fontWeight: 800, color: 'white', flexShrink: 0
                    }}>
                        {user?.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h3>{user?.name}</h3>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>{user?.email}</p>
                        <span className={`badge badge-${user?.role}`} style={{ marginTop: '0.5rem' }}>{user?.role}</span>
                    </div>
                </div>

                <form onSubmit={handleProfileUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <h3 style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem', marginBottom: '0.5rem' }}>
                        ✏️ Update Profile
                    </h3>
                    <div className="grid-2">
                        <div className="form-group">
                            <label className="form-label">Full Name</label>
                            <input className="form-input" value={profileForm.name}
                                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Email Address</label>
                            <input className="form-input" type="email" value={profileForm.email}
                                onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })} required />
                        </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button id="update-profile-btn" type="submit" className="btn btn-primary" disabled={profileLoading}>
                            {profileLoading ? <><span className="spinner spinner-sm" /> Saving...</> : '💾 Save Changes'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Password Change */}
            <div className="card">
                <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <h3 style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem', marginBottom: '0.5rem' }}>
                        🔑 Change Password
                    </h3>
                    <div className="form-group">
                        <label className="form-label">Current Password</label>
                        <input className="form-input" type="password" value={passwordForm.currentPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} required />
                    </div>
                    <div className="grid-2">
                        <div className="form-group">
                            <label className="form-label">New Password</label>
                            <input className="form-input" type="password" value={passwordForm.newPassword}
                                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} required minLength={8} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Confirm New Password</label>
                            <input className="form-input" type="password" value={passwordForm.confirmPassword}
                                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} required />
                        </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button id="change-password-btn" type="submit" className="btn btn-danger" disabled={passwordLoading}>
                            {passwordLoading ? <><span className="spinner spinner-sm" /> Changing...</> : '🔒 Change Password'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Account Info */}
            <div className="card" style={{ marginTop: '1.5rem' }}>
                <h3 style={{ marginBottom: '1rem' }}>ℹ️ Account Information</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {[
                        { label: 'Account ID', value: user?._id },
                        { label: 'Role', value: user?.role },
                        { label: 'Email Verified', value: user?.isVerified ? '✅ Yes' : '❌ No' },
                    ].map(({ label, value }) => (
                        <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0', borderBottom: '1px solid var(--color-border)' }}>
                            <span style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>{label}</span>
                            <span style={{ fontWeight: 600, fontSize: '0.875rem', fontFamily: 'monospace', wordBreak: 'break-all', textAlign: 'right', maxWidth: '60%' }}>{value}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
