/**
 * Admin Users Page
 * Full user CRUD for admin role.
 */

import React, { useEffect, useState, useCallback } from 'react'
import { adminAPI } from '../services/api'
import toast from 'react-hot-toast'
import { formatDate } from '../utils/helpers'

const ROLES = ['admin', 'sales']

export default function AdminUsersPage() {
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 })
    const [filters, setFilters] = useState({ search: '', role: '' })
    const [showModal, setShowModal] = useState(false)
    const [editUser, setEditUser] = useState(null)

    const fetchUsers = useCallback(async (page = 1) => {
        setLoading(true)
        try {
            const { data } = await adminAPI.getUsers({ page, limit: 15, ...filters })
            setUsers(data.users)
            setPagination({ page: data.page, pages: data.pages, total: data.total })
        } catch {
            toast.error('Failed to load users')
        } finally {
            setLoading(false)
        }
    }, [filters])

    useEffect(() => { fetchUsers(1) }, [fetchUsers])

    const handleToggleActive = async (user) => {
        try {
            await adminAPI.updateUser(user._id, { isActive: !user.isActive })
            toast.success(`User ${user.isActive ? 'deactivated' : 'activated'}`)
            fetchUsers(pagination.page)
        } catch { toast.error('Operation failed') }
    }

    const handleDelete = async (id) => {
        if (!window.confirm('Deactivate this user?')) return
        try {
            await adminAPI.deleteUser(id)
            toast.success('User deactivated')
            fetchUsers(pagination.page)
        } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
    }

    return (
        <div>
            <div className="page-header">
                <div className="page-header-left">
                    <h2>User Management</h2>
                    <p>{pagination.total} total users</p>
                </div>
                <button id="add-user-btn" className="btn btn-primary" onClick={() => { setEditUser(null); setShowModal(true) }}>
                    ＋ Add User
                </button>
            </div>

            <div className="filters-bar">
                <div className="search-input-wrapper">
                    <span className="search-icon">🔍</span>
                    <input className="form-input" placeholder="Search by name or email..."
                        value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} />
                </div>
                <select className="form-select" style={{ width: 'auto' }} value={filters.role}
                    onChange={(e) => setFilters({ ...filters, role: e.target.value })}>
                    <option value="">All Roles</option>
                    {ROLES.map((r) => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                </select>
                <button className="btn btn-secondary" onClick={() => setFilters({ search: '', role: '' })}>Clear</button>
            </div>

            {loading ? (
                <div className="loading-center"><div className="spinner" /></div>
            ) : users.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">👤</div>
                    <h3>No users found</h3>
                    <button className="btn btn-primary" onClick={() => setShowModal(true)}>Add User</button>
                </div>
            ) : (
                <>
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>User</th>
                                    <th>Email</th>
                                    <th>Role</th>
                                    <th>Verified</th>
                                    <th>Status</th>
                                    <th>Last Login</th>
                                    <th>Joined</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((user) => (
                                    <tr key={user._id}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <div className="user-avatar" style={{ width: 32, height: 32, fontSize: '0.8rem' }}>
                                                    {user.name?.charAt(0).toUpperCase()}
                                                </div>
                                                <span style={{ fontWeight: 600 }}>{user.name}</span>
                                            </div>
                                        </td>
                                        <td style={{ color: 'var(--color-text-muted)' }}>{user.email}</td>
                                        <td><span className={`badge badge-${user.role}`}>{user.role}</span></td>
                                        <td>{user.isVerified ? '✅' : '⏳'}</td>
                                        <td>
                                            <span style={{
                                                padding: '0.2rem 0.6rem', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 600,
                                                background: user.isActive ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                                                color: user.isActive ? 'var(--color-success)' : 'var(--color-danger)',
                                            }}>{user.isActive ? 'Active' : 'Inactive'}</span>
                                        </td>
                                        <td style={{ color: 'var(--color-text-muted)' }}>{user.lastLogin ? formatDate(user.lastLogin) : '—'}</td>
                                        <td style={{ color: 'var(--color-text-muted)' }}>{formatDate(user.createdAt)}</td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '0.4rem' }}>
                                                <button className="btn btn-secondary btn-sm" onClick={() => { setEditUser(user); setShowModal(true) }}>Edit</button>
                                                <button
                                                    className={`btn btn-sm ${user.isActive ? 'btn-danger' : 'btn-success'}`}
                                                    onClick={() => handleToggleActive(user)}>
                                                    {user.isActive ? 'Deactivate' : 'Activate'}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {pagination.pages > 1 && (
                        <div className="pagination">
                            <button disabled={pagination.page === 1} onClick={() => fetchUsers(pagination.page - 1)}>←</button>
                            {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
                                <button key={p} className={pagination.page === p ? 'active' : ''} onClick={() => fetchUsers(p)}>{p}</button>
                            ))}
                            <button disabled={pagination.page === pagination.pages} onClick={() => fetchUsers(pagination.page + 1)}>→</button>
                        </div>
                    )}
                </>
            )}

            {showModal && (
                <UserModal
                    user={editUser}
                    onClose={() => setShowModal(false)}
                    onSaved={() => { setShowModal(false); fetchUsers(pagination.page) }}
                />
            )}
        </div>
    )
}

// ── User Modal ────────────────────────────────────────────────────────────────
function UserModal({ user, onClose, onSaved }) {
    const isEdit = !!user
    const [form, setForm] = useState({
        name: user?.name || '',
        email: user?.email || '',
        password: '',
        role: user?.role || 'sales',
        isActive: user?.isActive !== false,
    })
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            if (isEdit) {
                const updates = { role: form.role, isActive: form.isActive, name: form.name }
                await adminAPI.updateUser(user._id, updates)
                toast.success('User updated!')
            } else {
                await adminAPI.createUser(form)
                toast.success('User created!')
            }
            onSaved()
        } catch (err) {
            const errors = err.response?.data?.errors
            if (errors) errors.forEach((e) => toast.error(e.message))
            else toast.error(err.response?.data?.message || 'Operation failed')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="modal">
                <div className="modal-header">
                    <h2 className="modal-title">{isEdit ? 'Edit User' : 'Add User'}</h2>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>
                <form className="modal-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Full Name</label>
                        <input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                    </div>
                    {!isEdit && (
                        <>
                            <div className="form-group">
                                <label className="form-label">Email</label>
                                <input className="form-input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Password</label>
                                <input className="form-input" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={8} />
                            </div>
                        </>
                    )}
                    <div className="grid-2">
                        <div className="form-group">
                            <label className="form-label">Role</label>
                            <select className="form-select" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                                {ROLES.map((r) => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                            </select>
                        </div>
                        {isEdit && (
                            <div className="form-group">
                                <label className="form-label">Status</label>
                                <select className="form-select" value={form.isActive ? 'active' : 'inactive'}
                                    onChange={(e) => setForm({ ...form, isActive: e.target.value === 'active' })}>
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>
                        )}
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? <><span className="spinner spinner-sm" /> Saving...</> : (isEdit ? 'Update User' : 'Create User')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
