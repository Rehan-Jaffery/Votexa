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

            // Get User Results (Completed)
            let userResults = [];
            const userStr = localStorage.getItem("user");
            if (userStr) {
                const u = JSON.parse(userStr);
                // Fetch ALL results (now accessible to students)
                const resResults = await api.get("/results/completed");

                // Filter relevant results:
                // 1. Council (Open to all)
                // 2. CR (Match Course & Semester)
                userResults = resResults.data.filter(r => {
                    if (r.status !== "COMPLETED") return false; // Only show Winners for Completed
                    if (r.type === "COUNCIL") return true;
                    if (r.type === "CR" && r.course === u.course && String(r.semester) === String(u.semester)) return true;
                    return false;
                });
                // Sort by ID/Date Descending
                userResults.sort((a, b) => b.election_id - a.election_id);

                // Keep only the LATEST one
                if (userResults.length > 0) {
                    userResults = [userResults[0]];
                }
            }

            setStats(prev => ({
                ...prev,
                activeElections: res.data.length,
                userResults: userResults
            }));
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

            {/* USER SPECIFIC NOTIFICATIONS & RESULTS */}
            {role !== 'admin' && (
                <div style={{ marginTop: '40px' }}>

                    {/* 1. ONGOING ELECTIONS: Winner Declared Soon */}
                    {stats.activeElections > 0 && (
                        <div className="animate-pulse" style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10b981', borderRadius: '12px', padding: '15px', color: '#10b981', fontWeight: 'bold', textAlign: 'center', marginBottom: '20px' }}>
                            🗳️ Voting is LIVE! Winners will be declared soon. Keep checking this space!
                        </div>
                    )}

                    {/* 2. COMPLETED ELECTION RESULTS (LATEST ONLY) */}
                    <div className="animate-fade-in" style={{ animationDelay: '0.4s' }}>
                        <h2 style={{ fontSize: '1.2rem', marginBottom: '15px', color: 'var(--text-main)' }}>🏆 Latest Selection Result</h2>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
                            {stats.userResults?.length > 0 ? (
                                stats.userResults.map(res => {
                                    // Parse Candidates for Winner & Runner Up
                                    const sortedCandidates = res.candidates?.sort((a, b) => b.votes - a.votes) || [];
                                    const winner = sortedCandidates[0];
                                    const runnerUp = sortedCandidates[1];

                                    return (
                                        <div key={res.election_id} className="glass-card-premium" style={{ padding: '25px', borderTop: '4px solid #fbbf24' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
                                                <div>
                                                    <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--primary-color)' }}>{res.title}</h3>
                                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '5px' }}>
                                                        ID: {res.election_id} • 📅 Declared on: {res.end_date}
                                                    </div>
                                                </div>
                                            </div>

                                            <div style={{ marginTop: '25px', display: 'flex', gap: '40px', flexWrap: 'wrap' }}>
                                                {/* WINNER */}
                                                {winner ? (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                                        <div style={{ fontSize: '2.5rem', background: 'rgba(251, 191, 36, 0.1)', width: '60px', height: '60px', display: 'flex', borderRadius: '50%', alignItems: 'center', justifyContent: 'center' }}>🏆</div>
                                                        <div>
                                                            <div style={{ fontSize: '0.8rem', color: '#fbbf24', fontWeight: 'bold', textTransform: 'uppercase' }}>Winner</div>
                                                            <div style={{ fontWeight: 'bold', fontSize: '1.3rem', color: 'var(--text-main)' }}>{winner.name}</div>
                                                            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{winner.votes} Votes</div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>Result Pending</div>
                                                )}

                                                {/* RUNNER UP */}
                                                {runnerUp && (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', paddingLeft: '40px', borderLeft: '1px solid var(--glass-border)' }}>
                                                        <div style={{ fontSize: '2rem', background: 'rgba(255,255,255,0.05)', width: '50px', height: '50px', display: 'flex', borderRadius: '50%', alignItems: 'center', justifyContent: 'center' }}>🥈</div>
                                                        <div>
                                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 'bold', textTransform: 'uppercase' }}>Runner Up</div>
                                                            <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--text-main)' }}>{runnerUp.name}</div>
                                                            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{runnerUp.votes} Votes</div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div style={{ color: 'var(--text-secondary)', gridColumn: '1/-1', textAlign: 'center', padding: '20px' }}>
                                    No completed elections for your batch yet.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DashboardHome;
