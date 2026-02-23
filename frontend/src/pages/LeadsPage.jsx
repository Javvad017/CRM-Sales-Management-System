/**
 * Leads Page
 * Full lead management with table, search/filter, create/edit modals.
 */

import React, { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { leadAPI, adminAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { formatDate, stageBadge } from '../utils/helpers'

const STAGES = ['New', 'Contacted', 'Demo', 'Proposal', 'Won', 'Lost']
const PRIORITIES = ['low', 'medium', 'high']
const SOURCES = ['website', 'referral', 'cold-call', 'email', 'social-media', 'other']

export default function LeadsPage() {
    const { isAdmin } = useAuth()
    const navigate = useNavigate()
    const [leads, setLeads] = useState([])
    const [loading, setLoading] = useState(true)
    const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 })
    const [filters, setFilters] = useState({ search: '', status: '', priority: '' })
    const [showModal, setShowModal] = useState(false)
    const [editLead, setEditLead] = useState(null)
    const [users, setUsers] = useState([])
    const [deleting, setDeleting] = useState(null)

    const fetchLeads = useCallback(async (page = 1) => {
        setLoading(true)
        try {
            const params = { page, limit: 10, ...filters }
            const { data } = await leadAPI.getAll(params)
            setLeads(data.leads)
            setPagination({ page: data.page, pages: data.pages, total: data.total })
        } catch (err) {
            toast.error('Failed to load leads')
        } finally {
            setLoading(false)
        }
    }, [filters])

    useEffect(() => { fetchLeads(1) }, [fetchLeads])

    useEffect(() => {
        if (isAdmin) {
            adminAPI.getUsers({ limit: 50 }).then(({ data }) => setUsers(data.users)).catch(() => { })
        }
    }, [isAdmin])

    const handleDelete = async (id) => {
        if (!window.confirm('Archive this lead?')) return
        setDeleting(id)
        try {
            await leadAPI.delete(id)
            toast.success('Lead archived')
            fetchLeads(pagination.page)
        } catch { toast.error('Failed to archive lead') }
        finally { setDeleting(null) }
    }

    return (
        <div>
            <div className="page-header">
                <div className="page-header-left">
                    <h2>Lead Management</h2>
                    <p>{pagination.total} total leads</p>
                </div>
                <button id="add-lead-btn" className="btn btn-primary" onClick={() => { setEditLead(null); setShowModal(true) }}>
                    ＋ Add Lead
                </button>
            </div>

            {/* Filters */}
            <div className="filters-bar">
                <div className="search-input-wrapper">
                    <span className="search-icon">🔍</span>
                    <input
                        className="form-input"
                        placeholder="Search by name, email, company..."
                        value={filters.search}
                        onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    />
                </div>
                <select className="form-select" style={{ width: 'auto' }} value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
                    <option value="">All Stages</option>
                    {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <select className="form-select" style={{ width: 'auto' }} value={filters.priority}
                    onChange={(e) => setFilters({ ...filters, priority: e.target.value })}>
                    <option value="">All Priorities</option>
                    {PRIORITIES.map((p) => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                </select>
                <button className="btn btn-secondary" onClick={() => setFilters({ search: '', status: '', priority: '' })}>
                    Clear
                </button>
            </div>

            {/* Table */}
            {loading ? (
                <div className="loading-center"><div className="spinner" /></div>
            ) : leads.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">👥</div>
                    <h3>No leads found</h3>
                    <p>Add your first lead to get started</p>
                    <button className="btn btn-primary" onClick={() => setShowModal(true)}>Add Lead</button>
                </div>
            ) : (
                <>
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Company</th>
                                    <th>Email</th>
                                    <th>Stage</th>
                                    <th>Priority</th>
                                    <th>Assigned To</th>
                                    <th>Follow Up</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {leads.map((lead) => (
                                    <tr key={lead._id}>
                                        <td>
                                            <button
                                                style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem', textAlign: 'left' }}
                                                onClick={() => navigate(`/leads/${lead._id}`)}>
                                                {lead.name}
                                            </button>
                                        </td>
                                        <td style={{ color: 'var(--color-text-muted)' }}>{lead.company || '—'}</td>
                                        <td style={{ color: 'var(--color-text-muted)' }}>{lead.email}</td>
                                        <td><span className={`badge badge-${lead.status?.toLowerCase()}`}>{lead.status}</span></td>
                                        <td><span className={`badge badge-${lead.priority}`}>{lead.priority}</span></td>
                                        <td style={{ color: 'var(--color-text-muted)' }}>{lead.assignedTo?.name || '—'}</td>
                                        <td style={{ color: lead.followUpDate && new Date(lead.followUpDate) < new Date() ? 'var(--color-danger)' : 'var(--color-text-muted)' }}>
                                            {lead.followUpDate ? formatDate(lead.followUpDate) : '—'}
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button className="btn btn-secondary btn-sm" onClick={() => { setEditLead(lead); setShowModal(true) }}>Edit</button>
                                                {isAdmin && (
                                                    <button className="btn btn-danger btn-sm" disabled={deleting === lead._id} onClick={() => handleDelete(lead._id)}>
                                                        {deleting === lead._id ? '...' : 'Archive'}
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {pagination.pages > 1 && (
                        <div className="pagination">
                            <button disabled={pagination.page === 1} onClick={() => fetchLeads(pagination.page - 1)}>←</button>
                            {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
                                <button key={p} className={pagination.page === p ? 'active' : ''} onClick={() => fetchLeads(p)}>{p}</button>
                            ))}
                            <button disabled={pagination.page === pagination.pages} onClick={() => fetchLeads(pagination.page + 1)}>→</button>
                        </div>
                    )}
                </>
            )}

            {/* Lead Modal */}
            {showModal && (
                <LeadModal
                    lead={editLead}
                    users={users}
                    isAdmin={isAdmin}
                    onClose={() => setShowModal(false)}
                    onSaved={() => { setShowModal(false); fetchLeads(pagination.page) }}
                />
            )}
        </div>
    )
}

// ── Lead Create/Edit Modal ────────────────────────────────────────────────────
function LeadModal({ lead, users, isAdmin, onClose, onSaved }) {
    const isEdit = !!lead
    const [form, setForm] = useState({
        name: lead?.name || '',
        email: lead?.email || '',
        phone: lead?.phone || '',
        company: lead?.company || '',
        website: lead?.website || '',
        source: lead?.source || 'other',
        status: lead?.status || 'New',
        priority: lead?.priority || 'medium',
        expectedValue: lead?.expectedValue || '',
        description: lead?.description || '',
        followUpDate: lead?.followUpDate ? new Date(lead.followUpDate).toISOString().split('T')[0] : '',
        assignedTo: lead?.assignedTo?._id || lead?.assignedTo || '',
    })
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            const payload = { ...form }
            if (!payload.assignedTo) delete payload.assignedTo
            if (!payload.followUpDate) delete payload.followUpDate

            if (isEdit) {
                await leadAPI.update(lead._id, payload)
                toast.success('Lead updated!')
            } else {
                await leadAPI.create(payload)
                toast.success('Lead created!')
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
                    <h2 className="modal-title">{isEdit ? 'Edit Lead' : 'Add New Lead'}</h2>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>
                <form className="modal-form" onSubmit={handleSubmit}>
                    <div className="grid-2">
                        <div className="form-group">
                            <label className="form-label">Full Name *</label>
                            <input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Email *</label>
                            <input className="form-input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                        </div>
                    </div>
                    <div className="grid-2">
                        <div className="form-group">
                            <label className="form-label">Phone</label>
                            <input className="form-input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Company</label>
                            <input className="form-input" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
                        </div>
                    </div>
                    <div className="grid-2">
                        <div className="form-group">
                            <label className="form-label">Stage</label>
                            <select className="form-select" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                                {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Priority</label>
                            <select className="form-select" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                                {PRIORITIES.map((p) => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="grid-2">
                        <div className="form-group">
                            <label className="form-label">Expected Value ($)</label>
                            <input className="form-input" type="number" min="0" value={form.expectedValue} onChange={(e) => setForm({ ...form, expectedValue: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Source</label>
                            <select className="form-select" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}>
                                {SOURCES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="grid-2">
                        <div className="form-group">
                            <label className="form-label">Follow-Up Date</label>
                            <input className="form-input" type="date" value={form.followUpDate} onChange={(e) => setForm({ ...form, followUpDate: e.target.value })} />
                        </div>
                        {isAdmin && (
                            <div className="form-group">
                                <label className="form-label">Assign To</label>
                                <select className="form-select" value={form.assignedTo} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}>
                                    <option value="">Unassigned</option>
                                    {users.map((u) => <option key={u._id} value={u._id}>{u.name}</option>)}
                                </select>
                            </div>
                        )}
                    </div>
                    <div className="form-group">
                        <label className="form-label">Description</label>
                        <textarea className="form-textarea" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Notes about this lead..." />
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? <><span className="spinner spinner-sm" /> Saving...</> : (isEdit ? 'Update Lead' : 'Create Lead')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
