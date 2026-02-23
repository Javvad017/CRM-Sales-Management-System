/**
 * Dashboard Page
 * Admin view: stats, charts, top performers, recent activities.
 * Sales view: personal leads, deals, and activity summary.
 */

import React, { useEffect, useState } from 'react'
import {
    Chart as ChartJS,
    CategoryScale, LinearScale, BarElement, LineElement, PointElement,
    ArcElement, Title, Tooltip, Legend, Filler
} from 'chart.js'
import { Bar, Doughnut, Line } from 'react-chartjs-2'
import { adminAPI, leadAPI, dealAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { formatCurrency, formatDate } from '../utils/helpers'

ChartJS.register(
    CategoryScale, LinearScale, BarElement, LineElement, PointElement,
    ArcElement, Title, Tooltip, Legend, Filler
)

const chartDefaults = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: { labels: { color: '#94a3b8', font: { family: 'Inter', size: 12 } } },
        tooltip: {
            backgroundColor: '#1a1d27',
            borderColor: '#2d3154',
            borderWidth: 1,
            titleColor: '#e2e8f0',
            bodyColor: '#94a3b8',
        },
    },
    scales: {
        x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(45,49,84,0.5)' } },
        y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(45,49,84,0.5)' } },
    },
}

export default function DashboardPage() {
    const { isAdmin, user } = useAuth()
    const [stats, setStats] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            try {
                if (isAdmin) {
                    const { data } = await adminAPI.getStats()
                    setStats(data)
                } else {
                    const [leadsRes, dealsRes] = await Promise.all([
                        leadAPI.getAll({ page: 1, limit: 5 }),
                        dealAPI.getMetrics(),
                    ])
                    setStats({ leads: leadsRes.data, deals: dealsRes.data })
                }
            } catch (err) {
                console.error(err)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [isAdmin])

    if (loading) {
        return <div className="loading-center"><div className="spinner" /></div>
    }

    if (isAdmin && stats) {
        return <AdminDashboard stats={stats} />
    }

    return <SalesDashboard stats={stats} user={user} />
}

// ── Admin Dashboard ───────────────────────────────────────────────────────────
function AdminDashboard({ stats }) {
    const { stats: s, pipeline, dealStages, monthlyRevenue, recentActivities, topPerformers } = stats

    const STAGE_COLORS = {
        New: '#64748b', Contacted: '#3b82f6', Demo: '#8b5cf6',
        Proposal: '#f59e0b', Won: '#22c55e', Lost: '#ef4444'
    }

    const pipelineChartData = {
        labels: pipeline.map((p) => p._id),
        datasets: [{
            label: 'Leads',
            data: pipeline.map((p) => p.count),
            backgroundColor: pipeline.map((p) => STAGE_COLORS[p._id] + '99'),
            borderColor: pipeline.map((p) => STAGE_COLORS[p._id]),
            borderWidth: 2,
            borderRadius: 6,
        }],
    }

    const revenueChartData = {
        labels: monthlyRevenue.map((m) => `${m._id.year}/${String(m._id.month).padStart(2, '0')}`),
        datasets: [{
            label: 'Won Revenue ($)',
            data: monthlyRevenue.map((m) => m.revenue),
            borderColor: '#6366f1',
            backgroundColor: 'rgba(99,102,241,0.1)',
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#6366f1',
            pointRadius: 5,
        }],
    }

    const dealDoughnutData = {
        labels: dealStages.map((d) => d._id),
        datasets: [{
            data: dealStages.map((d) => d.revenue),
            backgroundColor: dealStages.map((d) => STAGE_COLORS[d._id] + 'cc'),
            borderColor: dealStages.map((d) => STAGE_COLORS[d._id]),
            borderWidth: 2,
        }],
    }

    const statItems = [
        { label: 'Total Leads', value: s.totalLeads, icon: '👥', color: '#3b82f6' },
        { label: 'New This Month', value: s.newLeadsThisMonth, icon: '🆕', color: '#8b5cf6' },
        { label: 'Total Deals', value: s.totalDeals, icon: '🤝', color: '#f59e0b' },
        { label: 'Won Revenue', value: formatCurrency(s.totalWonRevenue), icon: '💰', color: '#22c55e' },
        { label: 'Team Members', value: s.totalUsers, icon: '🧑‍💼', color: '#6366f1' },
    ]

    return (
        <div>
            {/* Stats */}
            <div className="stats-grid">
                {statItems.map((item) => (
                    <div key={item.label} className="stat-card">
                        <div className="stat-icon" style={{ background: item.color + '22' }}>
                            <span>{item.icon}</span>
                        </div>
                        <div className="stat-value">{item.value}</div>
                        <div className="stat-label">{item.label}</div>
                    </div>
                ))}
            </div>

            {/* Charts */}
            <div className="charts-grid">
                {/* Revenue Trend */}
                <div className="card">
                    <h3 style={{ marginBottom: '1.5rem' }}>📈 Monthly Won Revenue</h3>
                    <div style={{ height: 280 }}>
                        {monthlyRevenue.length > 0 ? (
                            <Line data={revenueChartData} options={{ ...chartDefaults }} />
                        ) : (
                            <div className="empty-state" style={{ padding: '2rem' }}>
                                <p style={{ color: 'var(--color-text-muted)' }}>No won deals yet</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Deal Stages Doughnut */}
                <div className="card">
                    <h3 style={{ marginBottom: '1.5rem' }}>💼 Revenue by Stage</h3>
                    <div style={{ height: 280 }}>
                        <Doughnut
                            data={dealDoughnutData}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                    legend: { position: 'bottom', labels: { color: '#94a3b8', padding: 12 } },
                                    tooltip: chartDefaults.plugins.tooltip,
                                },
                                cutout: '65%',
                            }}
                        />
                    </div>
                </div>
            </div>

            <div className="charts-grid">
                {/* Pipeline Bar Chart */}
                <div className="card">
                    <h3 style={{ marginBottom: '1.5rem' }}>🔄 Leads by Pipeline Stage</h3>
                    <div style={{ height: 250 }}>
                        <Bar data={pipelineChartData} options={{ ...chartDefaults }} />
                    </div>
                </div>

                {/* Top Performers */}
                <div className="card">
                    <h3 style={{ marginBottom: '1.5rem' }}>🏆 Top Performers</h3>
                    {topPerformers.length === 0 ? (
                        <div className="empty-state" style={{ padding: '1rem' }}>
                            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>No won deals yet</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {topPerformers.map((p, i) => (
                                <div key={p.userId} style={{
                                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                                    padding: '0.75rem', background: 'var(--color-surface-2)',
                                    borderRadius: '8px'
                                }}>
                                    <span style={{ fontWeight: 800, color: 'var(--color-primary)', width: 24 }}>#{i + 1}</span>
                                    <div className="user-avatar">{p.name?.charAt(0)}</div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{p.name}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{p.wonDeals} deals won</div>
                                    </div>
                                    <div style={{ fontWeight: 700, color: 'var(--color-success)', fontSize: '0.875rem' }}>
                                        {formatCurrency(p.totalRevenue)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Recent Activities */}
            <div className="card" style={{ marginTop: '1.5rem' }}>
                <h3 style={{ marginBottom: '1.5rem' }}>🕐 Recent Activities</h3>
                {recentActivities.length === 0 ? (
                    <div className="empty-state" style={{ padding: '1rem' }}>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>No activities yet</p>
                    </div>
                ) : (
                    <div className="activity-feed">
                        {recentActivities.map((a) => (
                            <div key={a._id} className="activity-item">
                                <div className="activity-dot" />
                                <div className="activity-content">
                                    <div className="activity-note">{a.note}</div>
                                    <div className="activity-meta">
                                        <span>👤 {a.userId?.name}</span>
                                        <span>🏢 {a.leadId?.name}</span>
                                        <span>{formatDate(a.date)}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

// ── Sales Dashboard ───────────────────────────────────────────────────────────
function SalesDashboard({ stats, user }) {
    const leads = stats?.leads
    const metrics = stats?.deals

    const t = metrics?.totals || {}
    const stageColors = {
        New: '#64748b', Contacted: '#3b82f6', Demo: '#8b5cf6',
        Proposal: '#f59e0b', Won: '#22c55e', Lost: '#ef4444'
    }

    const doughnutData = {
        labels: (metrics?.summary || []).map((s) => s._id),
        datasets: [{
            data: (metrics?.summary || []).map((s) => s.totalValue),
            backgroundColor: (metrics?.summary || []).map((s) => (stageColors[s._id] || '#6366f1') + 'cc'),
            borderWidth: 2,
        }],
    }

    return (
        <div>
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(59,130,246,0.15)' }}>👥</div>
                    <div className="stat-value">{leads?.total ?? '—'}</div>
                    <div className="stat-label">My Leads</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(34,197,94,0.15)' }}>💰</div>
                    <div className="stat-value">{formatCurrency(t.wonRevenue ?? 0)}</div>
                    <div className="stat-label">Won Revenue</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.15)' }}>🤝</div>
                    <div className="stat-value">{t.totalDeals ?? 0}</div>
                    <div className="stat-label">Active Deals</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(99,102,241,0.15)' }}>🏆</div>
                    <div className="stat-value">{t.wonDeals ?? 0}</div>
                    <div className="stat-label">Won Deals</div>
                </div>
            </div>

            <div className="charts-grid">
                <div className="card">
                    <h3 style={{ marginBottom: '1.5rem' }}>💼 My Deal Revenue by Stage</h3>
                    <div style={{ height: 280 }}>
                        {(metrics?.summary || []).length > 0 ? (
                            <Doughnut data={doughnutData} options={{
                                responsive: true, maintainAspectRatio: false, cutout: '60%',
                                plugins: {
                                    legend: { position: 'bottom', labels: { color: '#94a3b8', padding: 10 } },
                                    tooltip: chartDefaults.plugins.tooltip,
                                },
                            }} />
                        ) : (
                            <div className="empty-state" style={{ padding: '2rem' }}>
                                <p style={{ color: 'var(--color-text-muted)' }}>No deals yet</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="card">
                    <h3 style={{ marginBottom: '1.5rem' }}>📋 Welcome, {user?.name}!</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{
                            padding: '1rem', background: 'rgba(99,102,241,0.1)',
                            borderRadius: '8px', border: '1px solid rgba(99,102,241,0.2)'
                        }}>
                            <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>📌 Quick Tips</div>
                            <ul style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', paddingLeft: '1.2rem' }}>
                                <li>Update your leads regularly</li>
                                <li>Log activities after every contact</li>
                                <li>Set follow-up reminders</li>
                                <li>Move deals through pipeline stages</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
