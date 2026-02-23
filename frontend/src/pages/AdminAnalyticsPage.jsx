/**
 * Admin Analytics Page
 * Charts: activity breakdown, lead sources, win rate, daily revenue.
 */

import React, { useEffect, useState } from 'react'
import { Bar, Doughnut, Line } from 'react-chartjs-2'
import {
    Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement,
    PointElement, ArcElement, Title, Tooltip, Legend, Filler
} from 'chart.js'
import { adminAPI } from '../services/api'
import toast from 'react-hot-toast'
import { formatCurrency } from '../utils/helpers'

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler)

const tooltipStyles = {
    backgroundColor: '#1a1d27',
    borderColor: '#2d3154',
    borderWidth: 1,
    titleColor: '#e2e8f0',
    bodyColor: '#94a3b8',
}

export default function AdminAnalyticsPage() {
    const [analytics, setAnalytics] = useState(null)
    const [loading, setLoading] = useState(true)
    const [period, setPeriod] = useState('30')

    useEffect(() => {
        adminAPI.getAnalytics(period)
            .then(({ data }) => setAnalytics(data))
            .catch(() => toast.error('Failed to load analytics'))
            .finally(() => setLoading(false))
    }, [period])

    if (loading) return <div className="loading-center"><div className="spinner" /></div>
    if (!analytics) return null

    const { activityByType, leadsBySource, winRate, revenueTrend } = analytics

    const activityChartData = {
        labels: activityByType.map((a) => a._id?.charAt(0).toUpperCase() + a._id?.slice(1)),
        datasets: [{
            label: 'Activities',
            data: activityByType.map((a) => a.count),
            backgroundColor: ['#6366f1cc', '#8b5cf6cc', '#3b82f6cc', '#22c55ecc', '#f59e0bcc', '#ef4444cc'],
            borderRadius: 6,
        }],
    }

    const sourceChartData = {
        labels: leadsBySource.map((s) => s._id?.charAt(0).toUpperCase() + s._id?.slice(1)),
        datasets: [{
            data: leadsBySource.map((s) => s.count),
            backgroundColor: ['#6366f1cc', '#8b5cf6cc', '#3b82f6cc', '#22c55ecc', '#f59e0bcc', '#ef4444cc'],
            borderWidth: 2,
        }],
    }

    const revenueChartData = {
        labels: revenueTrend.map((r) => r._id),
        datasets: [{
            label: 'Daily Revenue ($)',
            data: revenueTrend.map((r) => r.revenue),
            borderColor: '#22c55e',
            backgroundColor: 'rgba(34,197,94,0.1)',
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#22c55e',
        }],
    }

    const commonScales = {
        x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(45,49,84,0.5)' } },
        y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(45,49,84,0.5)' } },
    }

    return (
        <div>
            <div className="page-header">
                <div className="page-header-left">
                    <h2>Analytics</h2>
                    <p>Performance insights for the last {period} days</p>
                </div>
                <select className="form-select" style={{ width: 'auto' }} value={period} onChange={(e) => { setPeriod(e.target.value); setLoading(true) }}>
                    <option value="7">Last 7 Days</option>
                    <option value="30">Last 30 Days</option>
                    <option value="90">Last 90 Days</option>
                    <option value="365">Last Year</option>
                </select>
            </div>

            {/* Win Rate KPI */}
            <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
                <div className="stat-card" style={{ gridColumn: 'span 1' }}>
                    <div className="stat-icon" style={{ background: 'rgba(34,197,94,0.15)' }}>🏆</div>
                    <div className="stat-value">{winRate}%</div>
                    <div className="stat-label">Overall Win Rate</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(99,102,241,0.15)' }}>📊</div>
                    <div className="stat-value">{activityByType.reduce((acc, a) => acc + a.count, 0)}</div>
                    <div className="stat-label">Total Activities ({period}d)</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.15)' }}>🏢</div>
                    <div className="stat-value">{leadsBySource.reduce((acc, s) => acc + s.count, 0)}</div>
                    <div className="stat-label">Total Leads by Source</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(34,197,94,0.15)' }}>💵</div>
                    <div className="stat-value">{formatCurrency(revenueTrend.reduce((acc, r) => acc + r.revenue, 0))}</div>
                    <div className="stat-label">Revenue This Period</div>
                </div>
            </div>

            <div className="charts-grid">
                {/* Activity Breakdown */}
                <div className="card">
                    <h3 style={{ marginBottom: '1.5rem' }}>📋 Activities by Type</h3>
                    <div style={{ height: 280 }}>
                        {activityByType.length > 0 ? (
                            <Bar data={activityChartData} options={{
                                responsive: true, maintainAspectRatio: false,
                                plugins: { legend: { display: false }, tooltip: { ...tooltipStyles } },
                                scales: commonScales,
                            }} />
                        ) : (
                            <div className="empty-state" style={{ padding: '2rem' }}>
                                <p style={{ color: 'var(--color-text-muted)' }}>No activities in this period</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Lead Sources */}
                <div className="card">
                    <h3 style={{ marginBottom: '1.5rem' }}>🌐 Lead Sources</h3>
                    <div style={{ height: 280 }}>
                        {leadsBySource.length > 0 ? (
                            <Doughnut data={sourceChartData} options={{
                                responsive: true, maintainAspectRatio: false, cutout: '60%',
                                plugins: {
                                    legend: { position: 'bottom', labels: { color: '#94a3b8', padding: 10 } },
                                    tooltip: { ...tooltipStyles },
                                },
                            }} />
                        ) : (
                            <div className="empty-state" style={{ padding: '2rem' }}>
                                <p style={{ color: 'var(--color-text-muted)' }}>No lead source data</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Revenue Trend */}
            <div className="card" style={{ marginTop: '1.5rem' }}>
                <h3 style={{ marginBottom: '1.5rem' }}>💰 Daily Won Revenue</h3>
                <div style={{ height: 300 }}>
                    {revenueTrend.length > 0 ? (
                        <Line data={revenueChartData} options={{
                            responsive: true, maintainAspectRatio: false,
                            plugins: { legend: { display: false }, tooltip: { ...tooltipStyles } },
                            scales: commonScales,
                        }} />
                    ) : (
                        <div className="empty-state" style={{ padding: '2rem' }}>
                            <p style={{ color: 'var(--color-text-muted)' }}>No won deals in this period</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
