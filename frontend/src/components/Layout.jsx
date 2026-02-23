/**
 * Layout Component
 * Provides persistent sidebar + topbar shell for all authenticated pages.
 */

import React, { useState } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const NAV_ITEMS = [
    { path: '/dashboard', icon: '📊', label: 'Dashboard' },
    { path: '/pipeline', icon: '🔄', label: 'Pipeline' },
    { path: '/leads', icon: '👥', label: 'Leads' },
    { path: '/deals', icon: '💰', label: 'Deals' },
]

const ADMIN_NAV_ITEMS = [
    { path: '/admin/users', icon: '🛠️', label: 'User Management' },
    { path: '/admin/analytics', icon: '📈', label: 'Analytics' },
]

export default function Layout() {
    const { user, logout, isAdmin } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()
    const [sidebarOpen, setSidebarOpen] = useState(false)

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    const getPageTitle = () => {
        const path = location.pathname
        if (path.includes('dashboard')) return 'Dashboard'
        if (path.includes('pipeline')) return 'Sales Pipeline'
        if (path.includes('leads')) return 'Lead Management'
        if (path.includes('deals')) return 'Deals'
        if (path.includes('admin/users')) return 'User Management'
        if (path.includes('admin/analytics')) return 'Analytics'
        if (path.includes('profile')) return 'My Profile'
        return 'CRM Pro'
    }

    return (
        <div className="app-layout">
            {/* Mobile Overlay */}
            {sidebarOpen && (
                <div
                    style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 99 }}
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
                <div className="sidebar-logo">
                    <div className="sidebar-logo-icon">C</div>
                    <div className="sidebar-logo-text">CRM <span>Pro</span></div>
                </div>

                <nav className="sidebar-nav">
                    <div className="nav-section-title">Main</div>
                    {NAV_ITEMS.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                            onClick={() => setSidebarOpen(false)}
                        >
                            <span className="nav-icon">{item.icon}</span>
                            {item.label}
                        </NavLink>
                    ))}

                    {isAdmin && (
                        <>
                            <div className="nav-section-title" style={{ marginTop: '1rem' }}>Admin</div>
                            {ADMIN_NAV_ITEMS.map((item) => (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                                    onClick={() => setSidebarOpen(false)}
                                >
                                    <span className="nav-icon">{item.icon}</span>
                                    {item.label}
                                </NavLink>
                            ))}
                        </>
                    )}
                </nav>

                <div className="sidebar-footer">
                    <NavLink to="/profile" className="user-card" onClick={() => setSidebarOpen(false)}>
                        <div className="user-avatar">
                            {user?.name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="user-info">
                            <div className="user-name">{user?.name}</div>
                            <div className="user-role">{user?.role}</div>
                        </div>
                    </NavLink>
                    <button
                        className="btn btn-secondary w-full"
                        style={{ marginTop: '0.75rem', justifyContent: 'center' }}
                        onClick={handleLogout}
                    >
                        🚪 Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="main-content">
                {/* Topbar */}
                <header className="topbar">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <button
                            className="btn btn-secondary btn-icon"
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            style={{ display: 'none' }}
                            id="sidebar-toggle"
                        >
                            ☰
                        </button>
                        <h1 className="topbar-title">{getPageTitle()}</h1>
                    </div>
                    <div className="topbar-actions">
                        <span className={`badge badge-${user?.role}`}>{user?.role}</span>
                        <div className="user-avatar" style={{ cursor: 'pointer' }} onClick={() => navigate('/profile')}>
                            {user?.name?.charAt(0).toUpperCase()}
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="page-content">
                    <Outlet />
                </main>
            </div>
        </div>
    )
}
