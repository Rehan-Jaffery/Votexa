import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const DashboardHome = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        activeElections: 0,
        votedCount: 0,
        role: "Student"
    });
    const [user, setUser] = useState({ name: "User" });

    useEffect(() => {
        // Fetch real stats if possible, or mock for demo
        fetchStats();

        const u = localStorage.getItem("user");
        if (u) setUser(JSON.parse(u));
    }, []);

    const fetchStats = async () => {
        try {
            // Check active elections
            const res = await api.get("/elections/active");
            setStats(prev => ({ ...prev, activeElections: res.data.length }));
        } catch (e) {
            console.error(e);
        }
    };

    const role = user?.role || "student";
    const isCouncil = ["president", "vice_president", "secretary", "joint_secretary"].includes(role);

    return (
        <div className="animate-fade-in">
            <h1 className="animate-slide-up" style={{
                background: 'linear-gradient(135deg, var(--primary-color), #818cf8)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                marginBottom: '10px',
                textTransform: 'capitalize'
            }}>
                Hello, {role === 'admin' ? 'Admin' : isCouncil ? `Council Member` : user?.name?.split(' ')[0]}! 👋
            </h1>
            <p className="animate-slide-up animate-delay-100" style={{ color: 'var(--text-secondary)', marginBottom: '30px' }}>
                {role === 'admin' ? "System Overview & Controls" : "Here's your activity overview."}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>

                {/* GLOBAL STATS */}
                <div className="glass-card-premium animate-slide-up animate-delay-200" style={{ padding: '24px' }}>
                    <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '8px' }}>Active Elections</h3>
                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{stats.activeElections}</div>
                    <div style={{ marginTop: '10px', fontSize: '0.85rem', color: '#10b981' }}>● Live Now</div>
                </div>

                {/* ADMIN: Application Reviews */}
                {role === 'admin' && (
                    <div className="glass-card-premium animate-slide-up animate-delay-300"
                        style={{ padding: '24px', cursor: 'pointer', borderLeft: '4px solid #ef4444' }}
                        onClick={() => navigate('/dashboard/applications')}>
                        <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '8px' }}>Action Required</h3>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Review Apps</div>
                        <div style={{ marginTop: '10px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Approve Candidates →</div>
                    </div>
                )}

                {/* COUNCIL: Analytics Access */}
                {isCouncil && (
                    <div className="glass-card-premium animate-slide-up animate-delay-300"
                        style={{ padding: '24px', cursor: 'pointer', borderLeft: '4px solid #f59e0b' }}
                        onClick={() => navigate('/dashboard/analytics')}>
                        <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '8px' }}>Council Privileges</h3>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>View Analytics</div>
                        <div style={{ marginTop: '10px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Check Turnout Trends →</div>
                    </div>
                )}

                {/* STUDENT/CR: Participation */}
                {(!isCouncil && role !== 'admin') && (
                    <div className="glass-card-premium animate-slide-up animate-delay-300" style={{ padding: '24px' }}>
                        <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '8px' }}>Your Participation</h3>
                        <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>-</div>
                        <div style={{ marginTop: '10px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Votes Cast</div>
                    </div>
                )}

                <div className="glass-card-premium animate-slide-up animate-delay-300" style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '100px', height: '100px', background: 'var(--primary-color)', filter: 'blur(50px)', opacity: '0.2' }}></div>
                    <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '8px' }}>
                        {role === 'admin' ? "System Status" : "Upcoming"}
                    </h3>
                    <div style={{ fontSize: '1.2rem', fontWeight: '600', marginTop: '8px' }}>
                        {role === 'admin' ? "All Systems Operational" : (stats.activeElections > 0 ? "Check Vote Page" : "No active events")}
                    </div>
                </div>
            </div>

            <div className="glass-card-premium animate-slide-up animate-delay-300" style={{ marginTop: '30px', padding: '30px', textAlign: 'center' }}>
                <h2>{role === 'admin' ? "System Administration" : "Ready to Vote?"}</h2>
                <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', margin: '10px auto 25px auto' }}>
                    {role === 'admin'
                        ? "Manage the entire election lifecycle from here."
                        : "Participate in the democratic process. Cast your vote securely."}
                </p>
                <button
                    onClick={() => navigate(role === 'admin' ? '/dashboard/users' : '/dashboard/vote')}
                    className="btn-premium"
                    style={{ padding: '12px 32px', borderRadius: '50px', fontSize: '1rem', fontWeight: '600', color: 'white', cursor: 'pointer' }}
                >
                    {role === 'admin' ? "Manage Users" : "Go to Voting Center →"}
                </button>
            </div>
        </div>
    );
};

export default DashboardHome;
