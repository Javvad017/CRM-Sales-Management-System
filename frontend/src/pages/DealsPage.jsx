/**
 * Deals Page
 * Manage deals: create, update stage, view metrics.
 */

import React, { useEffect, useState, useCallback } from 'react'
import { dealAPI, leadAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { formatCurrency, formatDate } from '../utils/helpers'

const STAGES = ['New', 'Contacted', 'Demo', 'Proposal', 'Won', 'Lost']

export default function DealsPage() {
    const { isAdmin } = useAuth()
    const [deals, setDeals] = useState([])
    const [metrics, setMetrics] = useState(null)
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [editDeal, setEditDeal] = useState(null)
    const [filters, setFilters] = useState({ stage: '' })
    const [pagination, setPagination] = useState({ page: 1, pages: 1 })

    const fetchDeals = useCallback(async (page = 1) => {
        setLoading(true)
        try {
            const [dealsRes, metricsRes] = await Promise.all([
                dealAPI.getAll({ page, limit: 10, ...filters }),
                dealAPI.getMetrics(),
            ])
            setDeals(dealsRes.data.deals)
            setPagination({ page: dealsRes.data.page, pages: dealsRes.data.pages, total: dealsRes.data.total })
            setMetrics(metricsRes.data)
        } catch {
            toast.error('Failed to load deals')
        } finally {
            setLoading(false)
        }
    }, [filters])

    useEffect(() => { fetchDeals(1) }, [fetchDeals])

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this deal?')) return
        try {
            await dealAPI.delete(id)
            toast.success('Deal deleted')
            fetchDeals(pagination.page)
        } catch { toast.error('Failed') }
    }

    const t = metrics?.totals || {}

    return (
        <div>
            <div className="page-header">
                <div className="page-header-left">
                    <h2>Deals</h2>
                    <p>Track and manage your sales deals</p>
                </div>
                <button id="add-deal-btn" className="btn btn-primary" onClick={() => { setEditDeal(null); setShowModal(true) }}>
                    ＋ New Deal
                </button>
            </div>

            {/* Metrics */}
            <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(59,130,246,0.15)' }}>🤝</div>
                    <div className="stat-value">{t.totalDeals ?? 0}</div>
                    <div className="stat-label">Total Deals</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(34,197,94,0.15)' }}>🏆</div>
                    <div className="stat-value">{t.wonDeals ?? 0}</div>
                    <div className="stat-label">Won Deals</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(34,197,94,0.15)' }}>💰</div>
                    <div className="stat-value">{formatCurrency(t.wonRevenue ?? 0)}</div>
                    <div className="stat-label">Won Revenue</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(99,102,241,0.15)' }}>📊</div>
                    <div className="stat-value">{formatCurrency(t.totalRevenue ?? 0)}</div>
                    <div className="stat-label">Total Pipeline</div>
                </div>
            </div>

            {/* Filter */}
            <div className="filters-bar">
                <select className="form-select" style={{ width: 'auto' }} value={filters.stage}
                    onChange={(e) => setFilters({ ...filters, stage: e.target.value })}>
                    <option value="">All Stages</option>
                    {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <button className="btn btn-secondary" onClick={() => setFilters({ stage: '' })}>Clear</button>
            </div>

            {/* Table */}
            {loading ? (
                <div className="loading-center"><div className="spinner" /></div>
            ) : deals.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">💼</div>
                    <h3>No deals yet</h3>
                    <p>Create your first deal to track revenue</p>
                    <button className="btn btn-primary" onClick={() => setShowModal(true)}>New Deal</button>
                </div>
            ) : (
                <>
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>Title</th>
                                    <th>Lead</th>
                                    <th>Value</th>
                                    <th>Stage</th>
                                    <th>Probability</th>
                                    <th>Close Date</th>
                                    <th>Owner</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {deals.map((deal) => (
                                    <tr key={deal._id}>
                                        <td style={{ fontWeight: 600 }}>{deal.title}</td>
                                        <td style={{ color: 'var(--color-text-muted)' }}>{deal.leadId?.name || '—'}</td>
                                        <td style={{ color: 'var(--color-success)', fontWeight: 700 }}>{formatCurrency(deal.value)}</td>
                                        <td><span className={`badge badge-${deal.stage?.toLowerCase()}`}>{deal.stage}</span></td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'var(--color-border)' }}>
                                                    <div style={{ width: `${deal.probability}%`, height: '100%', borderRadius: 3, background: 'var(--color-primary)' }} />
                                                </div>
                                                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{deal.probability}%</span>
                                            </div>
                                        </td>
                                        <td style={{ color: 'var(--color-text-muted)' }}>{formatDate(deal.closeDate)}</td>
                                        <td style={{ color: 'var(--color-text-muted)' }}>{deal.createdBy?.name || '—'}</td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button className="btn btn-secondary btn-sm" onClick={() => { setEditDeal(deal); setShowModal(true) }}>Edit</button>
                                                {isAdmin && <button className="btn btn-danger btn-sm" onClick={() => handleDelete(deal._id)}>Del</button>}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {pagination.pages > 1 && (
                        <div className="pagination">
                            <button disabled={pagination.page === 1} onClick={() => fetchDeals(pagination.page - 1)}>←</button>
                            {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
                                <button key={p} className={pagination.page === p ? 'active' : ''} onClick={() => fetchDeals(p)}>{p}</button>
                            ))}
                            <button disabled={pagination.page === pagination.pages} onClick={() => fetchDeals(pagination.page + 1)}>→</button>
                        </div>
                    )}
                </>
            )}

            {showModal && (
                <DealModal
                    deal={editDeal}
                    onClose={() => setShowModal(false)}
                    onSaved={() => { setShowModal(false); fetchDeals(pagination.page) }}
                />
            )}
        </div>
    )
}

// ── Deal Modal ────────────────────────────────────────────────────────────────
function DealModal({ deal, onClose, onSaved }) {
    const isEdit = !!deal
    const [form, setForm] = useState({
        title: deal?.title || '',
        leadId: deal?.leadId?._id || deal?.leadId || '',
        value: deal?.value || '',
        stage: deal?.stage || 'New',
        probability: deal?.probability || 10,
        closeDate: deal?.closeDate ? new Date(deal.closeDate).toISOString().split('T')[0] : '',
        description: deal?.description || '',
    })
    const [leads, setLeads] = useState([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        leadAPI.getAll({ limit: 100 }).then(({ data }) => setLeads(data.leads)).catch(() => { })
    }, [])

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            if (isEdit) {
                await dealAPI.update(deal._id, form)
                toast.success('Deal updated!')
            } else {
                await dealAPI.create(form)
                toast.success('Deal created!')
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
                    <h2 className="modal-title">{isEdit ? 'Edit Deal' : 'New Deal'}</h2>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>
                <form className="modal-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Deal Title *</label>
                        <input className="form-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required placeholder="e.g. Enterprise SaaS Deal" />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Lead *</label>
                        <select className="form-select" value={form.leadId} onChange={(e) => setForm({ ...form, leadId: e.target.value })} required>
                            <option value="">Select a Lead</option>
                            {leads.map((l) => <option key={l._id} value={l._id}>{l.name} {l.company ? `(${l.company})` : ''}</option>)}
                        </select>
                    </div>
                    <div className="grid-2">
                        <div className="form-group">
                            <label className="form-label">Value ($) *</label>
                            <input className="form-input" type="number" min="0" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Stage</label>
                            <select className="form-select" value={form.stage} onChange={(e) => setForm({ ...form, stage: e.target.value })}>
                                {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="grid-2">
                        <div className="form-group">
                            <label className="form-label">Win Probability ({form.probability}%)</label>
                            <input className="form-input" type="range" min="0" max="100" value={form.probability}
                                onChange={(e) => setForm({ ...form, probability: parseInt(e.target.value) })} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Close Date *</label>
                            <input className="form-input" type="date" value={form.closeDate} onChange={(e) => setForm({ ...form, closeDate: e.target.value })} required />
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Notes</label>
                        <textarea className="form-textarea" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? <><span className="spinner spinner-sm" /> Saving...</> : (isEdit ? 'Update Deal' : 'Create Deal')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
