/**
 * Pipeline Page
 * Kanban-style board showing leads grouped by pipeline stage.
 */

import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { leadAPI } from '../services/api'
import { formatCurrency } from '../utils/helpers'
import toast from 'react-hot-toast'

const STAGES = [
    { key: 'New', icon: '🆕', color: '#64748b' },
    { key: 'Contacted', icon: '📞', color: '#3b82f6' },
    { key: 'Demo', icon: '🖥️', color: '#8b5cf6' },
    { key: 'Proposal', icon: '📄', color: '#f59e0b' },
    { key: 'Won', icon: '🏆', color: '#22c55e' },
    { key: 'Lost', icon: '❌', color: '#ef4444' },
]

export default function PipelinePage() {
    const navigate = useNavigate()
    const [leadsByStage, setLeadsByStage] = useState({})
    const [pipelineStats, setPipelineStats] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchPipeline = async () => {
            try {
                const [allLeads, pipelineRes] = await Promise.all([
                    leadAPI.getAll({ limit: 200 }),
                    leadAPI.getPipeline(),
                ])
                // Group by stage
                const grouped = {}
                STAGES.forEach((s) => { grouped[s.key] = [] })
                allLeads.data.leads.forEach((lead) => {
                    if (grouped[lead.status]) grouped[lead.status].push(lead)
                })
                setLeadsByStage(grouped)
                setPipelineStats(pipelineRes.data.pipeline)
            } catch {
                toast.error('Failed to load pipeline')
            } finally {
                setLoading(false)
            }
        }
        fetchPipeline()
    }, [])

    const handleMoveStage = async (leadId, newStage) => {
        try {
            await leadAPI.update(leadId, { status: newStage })
            toast.success(`Moved to ${newStage}`)
            // Refresh
            setLoading(true)
            const allLeads = await leadAPI.getAll({ limit: 200 })
            const grouped = {}
            STAGES.forEach((s) => { grouped[s.key] = [] })
            allLeads.data.leads.forEach((lead) => {
                if (grouped[lead.status]) grouped[lead.status].push(lead)
            })
            setLeadsByStage(grouped)
            setLoading(false)
        } catch {
            toast.error('Failed to move lead')
        }
    }

    if (loading) return <div className="loading-center"><div className="spinner" /></div>

    return (
        <div>
            <div className="page-header">
                <div className="page-header-left">
                    <h2>Sales Pipeline</h2>
                    <p>Visual Kanban board of your lead stages</p>
                </div>
            </div>

            {/* Pipeline Summary */}
            <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
                {STAGES.map((stage) => {
                    const stat = pipelineStats.find((p) => p._id === stage.key) || { count: 0, totalValue: 0 }
                    return (
                        <div key={stage.key} className="stat-card" style={{ borderTop: `3px solid ${stage.color}` }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span>{stage.icon}</span>
                                <span style={{ fontWeight: 800, fontSize: '1.5rem' }}>{stat.count}</span>
                            </div>
                            <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{stage.key}</div>
                            {stat.totalValue > 0 && (
                                <div style={{ color: 'var(--color-success)', fontSize: '0.8rem', fontWeight: 600 }}>
                                    {formatCurrency(stat.totalValue)}
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>

            {/* Kanban Board */}
            <div className="pipeline-board">
                {STAGES.map((stage) => {
                    const stageLeads = leadsByStage[stage.key] || []
                    return (
                        <div key={stage.key} className="pipeline-column">
                            <div className="pipeline-column-header">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span>{stage.icon}</span>
                                    <span className="pipeline-column-title" style={{ color: stage.color }}>{stage.key}</span>
                                </div>
                                <span className="pipeline-column-count">{stageLeads.length}</span>
                            </div>

                            {stageLeads.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '2rem 0.5rem', color: 'var(--color-text-faint)', fontSize: '0.8rem' }}>
                                    No leads
                                </div>
                            ) : (
                                stageLeads.map((lead) => (
                                    <div
                                        key={lead._id}
                                        className="pipeline-card"
                                        onClick={() => navigate(`/leads/${lead._id}`)}
                                    >
                                        <div className="pipeline-card-title">{lead.name}</div>
                                        {lead.company && <div className="pipeline-card-company">{lead.company}</div>}
                                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                                            <span className={`badge badge-${lead.priority}`}>{lead.priority}</span>
                                            {lead.assignedTo && (
                                                <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                                                    👤 {lead.assignedTo.name}
                                                </span>
                                            )}
                                        </div>
                                        {lead.expectedValue > 0 && (
                                            <div className="pipeline-card-value">{formatCurrency(lead.expectedValue)}</div>
                                        )}
                                        {/* Quick move buttons */}
                                        <div style={{ display: 'flex', gap: '0.3rem', marginTop: '0.5rem', flexWrap: 'wrap' }} onClick={(e) => e.stopPropagation()}>
                                            {STAGES.filter((s) => s.key !== stage.key).slice(0, 2).map((targetStage) => (
                                                <button
                                                    key={targetStage.key}
                                                    style={{
                                                        fontSize: '0.65rem', padding: '0.15rem 0.4rem',
                                                        background: targetStage.color + '22',
                                                        border: `1px solid ${targetStage.color}44`,
                                                        borderRadius: '4px', color: targetStage.color,
                                                        cursor: 'pointer', fontWeight: 600,
                                                    }}
                                                    onClick={() => handleMoveStage(lead._id, targetStage.key)}
                                                >
                                                    → {targetStage.key}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
