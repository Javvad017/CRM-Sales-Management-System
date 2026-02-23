/**
 * Lead Detail Page
 * Shows lead info, associated deals, and full activity timeline.
 */

import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { leadAPI, dealAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { formatDate, formatCurrency } from '../utils/helpers'

const ACTIVITY_TYPES = ['note', 'call', 'email', 'meeting', 'task']
const STAGES = ['New', 'Contacted', 'Demo', 'Proposal', 'Won', 'Lost']

export default function LeadDetailPage() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { user } = useAuth()
    const [lead, setLead] = useState(null)
    const [activities, setActivities] = useState([])
    const [deals, setDeals] = useState([])
    const [loading, setLoading] = useState(true)
    const [showActivityForm, setShowActivityForm] = useState(false)
    const [activityForm, setActivityForm] = useState({ type: 'note', note: '', outcome: '', nextFollowUp: '' })
    const [activityLoading, setActivityLoading] = useState(false)

    const fetchLead = async () => {
        try {
            const [leadRes, dealsRes] = await Promise.all([
                leadAPI.getById(id),
                dealAPI.getAll({ leadId: id }),
            ])
            setLead(leadRes.data.lead)
            setActivities(leadRes.data.activities || [])
            setDeals(dealsRes.data.deals || [])
        } catch (err) {
            toast.error('Lead not found')
            navigate('/leads')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { fetchLead() }, [id])

    const handleStatusChange = async (newStatus) => {
        try {
            const { data } = await leadAPI.update(id, { status: newStatus })
            setLead(data.lead)
            toast.success(`Stage updated to ${newStatus}`)
            fetchLead()
        } catch {
            toast.error('Failed to update stage')
        }
    }

    const handleAddActivity = async (e) => {
        e.preventDefault()
        if (!activityForm.note.trim()) { toast.error('Note is required'); return }
        setActivityLoading(true)
        try {
            await leadAPI.addActivity(id, activityForm)
            toast.success('Activity logged!')
            setActivityForm({ type: 'note', note: '', outcome: '', nextFollowUp: '' })
            setShowActivityForm(false)
            fetchLead()
        } catch {
            toast.error('Failed to add activity')
        } finally {
            setActivityLoading(false)
        }
    }

    if (loading) return <div className="loading-center"><div className="spinner" /></div>
    if (!lead) return null

    const STAGE_NEXT = { New: 'Contacted', Contacted: 'Demo', Demo: 'Proposal', Proposal: 'Won' }

    return (
        <div style={{ maxWidth: 1100 }}>
            {/* Breadcrumbs */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                <button style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer' }} onClick={() => navigate('/leads')}>Leads</button>
                <span>›</span>
                <span>{lead.name}</span>
            </div>

            {/* Lead Header */}
            <div className="card" style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                            <h2 style={{ fontSize: '1.5rem' }}>{lead.name}</h2>
                            <span className={`badge badge-${lead.status?.toLowerCase()}`}>{lead.status}</span>
                            <span className={`badge badge-${lead.priority}`}>{lead.priority}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '1.5rem', color: 'var(--color-text-muted)', fontSize: '0.875rem', flexWrap: 'wrap' }}>
                            {lead.company && <span>🏢 {lead.company}</span>}
                            <span>✉️ {lead.email}</span>
                            {lead.phone && <span>📞 {lead.phone}</span>}
                            {lead.assignedTo && <span>👤 {lead.assignedTo.name}</span>}
                            <span>📅 Added {formatDate(lead.createdAt)}</span>
                        </div>
                        {lead.expectedValue > 0 && (
                            <div style={{ marginTop: '0.75rem', color: 'var(--color-success)', fontWeight: 700, fontSize: '1.1rem' }}>
                                💰 Expected: {formatCurrency(lead.expectedValue)}
                            </div>
                        )}
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                        {STAGE_NEXT[lead.status] && (
                            <button className="btn btn-primary" onClick={() => handleStatusChange(STAGE_NEXT[lead.status])}>
                                ⬆️ Move to {STAGE_NEXT[lead.status]}
                            </button>
                        )}
                        {lead.status !== 'Lost' && (
                            <button className="btn btn-danger btn-sm" onClick={() => handleStatusChange('Lost')}>Mark Lost</button>
                        )}
                        <button className="btn btn-success btn-sm" onClick={() => setShowActivityForm(!showActivityForm)}>
                            + Log Activity
                        </button>
                    </div>
                </div>

                {/* Pipeline Progress */}
                <div style={{ marginTop: '1.5rem' }}>
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                        {STAGES.map((stage) => {
                            const idx = STAGES.indexOf(stage)
                            const currentIdx = STAGES.indexOf(lead.status)
                            const isActive = stage === lead.status
                            const isPast = idx < currentIdx && lead.status !== 'Lost'
                            const stageColors = { New: '#64748b', Contacted: '#3b82f6', Demo: '#8b5cf6', Proposal: '#f59e0b', Won: '#22c55e', Lost: '#ef4444' }
                            return (
                                <div key={stage} style={{ flex: 1, textAlign: 'center' }}>
                                    <div style={{
                                        height: 6, borderRadius: 3, marginBottom: '0.4rem',
                                        background: isActive || isPast ? (stageColors[stage] || 'var(--color-primary)') : 'var(--color-border)',
                                        opacity: isActive ? 1 : isPast ? 0.6 : 0.3,
                                        transition: 'background 0.3s',
                                    }} />
                                    <span style={{ fontSize: '0.7rem', color: isActive ? stageColors[stage] : 'var(--color-text-faint)', fontWeight: isActive ? 700 : 400 }}>
                                        {stage}
                                    </span>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>

            {/* Activity Form */}
            {showActivityForm && (
                <div className="card" style={{ marginBottom: '1.5rem', borderColor: 'var(--color-primary)' }}>
                    <h3 style={{ marginBottom: '1rem' }}>📝 Log Activity</h3>
                    <form onSubmit={handleAddActivity} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div className="grid-2">
                            <div className="form-group">
                                <label className="form-label">Activity Type</label>
                                <select className="form-select" value={activityForm.type}
                                    onChange={(e) => setActivityForm({ ...activityForm, type: e.target.value })}>
                                    {ACTIVITY_TYPES.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Outcome</label>
                                <select className="form-select" value={activityForm.outcome}
                                    onChange={(e) => setActivityForm({ ...activityForm, outcome: e.target.value })}>
                                    <option value="">None</option>
                                    <option value="positive">Positive</option>
                                    <option value="neutral">Neutral</option>
                                    <option value="negative">Negative</option>
                                </select>
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Note *</label>
                            <textarea className="form-textarea" placeholder="What happened? What's the next step?"
                                value={activityForm.note}
                                onChange={(e) => setActivityForm({ ...activityForm, note: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Next Follow-Up</label>
                            <input className="form-input" type="datetime-local" value={activityForm.nextFollowUp}
                                onChange={(e) => setActivityForm({ ...activityForm, nextFollowUp: e.target.value })} />
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                            <button type="button" className="btn btn-secondary" onClick={() => setShowActivityForm(false)}>Cancel</button>
                            <button type="submit" className="btn btn-primary" disabled={activityLoading}>
                                {activityLoading ? <><span className="spinner spinner-sm" /> Saving...</> : 'Log Activity'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                {/* Associated Deals */}
                <div className="card">
                    <h3 style={{ marginBottom: '1rem' }}>💼 Associated Deals</h3>
                    {deals.length === 0 ? (
                        <div className="empty-state" style={{ padding: '1.5rem' }}>
                            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>No deals yet for this lead</p>
                        </div>
                    ) : (
                        deals.map((deal) => (
                            <div key={deal._id} style={{
                                padding: '0.75rem', background: 'var(--color-surface-2)',
                                borderRadius: '8px', marginBottom: '0.75rem', border: '1px solid var(--color-border)'
                            }}>
                                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{deal.title}</div>
                                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.3rem' }}>
                                    <span style={{ color: 'var(--color-success)', fontWeight: 700 }}>{formatCurrency(deal.value)}</span>
                                    <span className={`badge badge-${deal.stage?.toLowerCase()}`}>{deal.stage}</span>
                                    <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>Close: {formatDate(deal.closeDate)}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Activity Timeline */}
                <div className="card">
                    <h3 style={{ marginBottom: '1rem' }}>📅 Activity Timeline</h3>
                    {activities.length === 0 ? (
                        <div className="empty-state" style={{ padding: '1.5rem' }}>
                            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>No activities logged yet</p>
                        </div>
                    ) : (
                        <div className="activity-feed" style={{ maxHeight: 400, overflowY: 'auto' }}>
                            {activities.map((a) => {
                                const typeIcons = { note: '📝', call: '📞', email: '✉️', meeting: '🤝', task: '✅', 'stage-change': '🔄' }
                                const outcomeColors = { positive: 'var(--color-success)', neutral: 'var(--color-text-muted)', negative: 'var(--color-danger)' }
                                return (
                                    <div key={a._id} className="activity-item">
                                        <div className="activity-dot" style={{ background: a.type === 'stage-change' ? 'var(--color-warning)' : undefined }} />
                                        <div className="activity-content">
                                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.25rem' }}>
                                                <span>{typeIcons[a.type]}</span>
                                                <span className="activity-note">{a.note}</span>
                                            </div>
                                            <div className="activity-meta">
                                                <span>👤 {a.userId?.name || 'System'}</span>
                                                <span>{formatDate(a.date)}</span>
                                                {a.outcome && <span style={{ color: outcomeColors[a.outcome] }}>● {a.outcome}</span>}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>

            {lead.description && (
                <div className="card" style={{ marginTop: '1.5rem' }}>
                    <h3 style={{ marginBottom: '0.75rem' }}>📌 Description</h3>
                    <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.7 }}>{lead.description}</p>
                </div>
            )}
        </div>
    )
}
