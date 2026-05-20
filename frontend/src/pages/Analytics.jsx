import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, RadialBarChart, RadialBar, Legend,
    AreaChart, Area,
    RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
    ComposedChart, Line
} from 'recharts';

const COLORS = ['#4f46e5', '#0d9488', '#8b5cf6', '#0ea5e9', '#f59e0b', '#ec4899'];
const GRADIENT_COLORS = [
    { start: '#4f46e5', end: '#818cf8' },
    { start: '#0d9488', end: '#5eead4' },
    { start: '#8b5cf6', end: '#a78bfa' },
    { start: '#0ea5e9', end: '#7dd3fc' }
];

const Analytics = () => {
    const [systemHealth, setSystemHealth] = useState(null);
    const [elections, setElections] = useState([]);
    const [selectedElection, setSelectedElection] = useState(null);
    const [aiPrediction, setAiPrediction] = useState(null);
    const [loading, setLoading] = useState(true);

    const role = localStorage.getItem("role");
    const token = localStorage.getItem("access_token");

    useEffect(() => {
        const fetchAnalyticsData = async () => {
            setLoading(true);
            try {
                if (role === 'admin') {
                    try {
                        const healthRes = await axios.get('http://127.0.0.1:5000/api/analytics/system-health', {
                            headers: { Authorization: `Bearer ${token}` }
                        });
                        setSystemHealth(healthRes.data);
                    } catch (err) {
                        console.error("Could not fetch system health", err);
                    }
                }

                const resultsRes = await axios.get('http://127.0.0.1:5000/api/results/completed', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                
                setElections(resultsRes.data);
                if (resultsRes.data.length > 0) {
                    if (role === 'admin') {
                        setSelectedElection(resultsRes.data[0]);
                    } else {
                        // Non-admin: auto-select first completed election
                        const firstCompleted = resultsRes.data.find(e => e.status === 'COMPLETED');
                        setSelectedElection(firstCompleted || resultsRes.data[0]);
                    }
                }
            } catch (err) {
                console.error(err);
                toast.error("Failed to load analytics data.");
            } finally {
                setLoading(false);
            }
        };

        fetchAnalyticsData();
    }, [role, token]);

    useEffect(() => {
        const fetchAIPrediction = async () => {
            if (role === 'admin' && selectedElection) {
                try {
                    const aiRes = await axios.get(`http://127.0.0.1:5000/api/analytics/predict-turnout/${selectedElection.election_id}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    setAiPrediction(aiRes.data);
                } catch (err) {
                    console.error("Could not fetch AI prediction", err);
                    setAiPrediction(null);
                }
            } else {
                setAiPrediction(null);
            }
        };
        fetchAIPrediction();
    }, [selectedElection, role, token]);

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column' }}>
                <div className="loader" style={{ border: '4px solid var(--border-color)', borderTop: '4px solid var(--primary-color)', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite', marginBottom: '16px' }} />
                <p style={{ color: 'var(--text-secondary)', letterSpacing: '1px' }}>Analyzing Election Data...</p>
                <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    let chartData = [];
    let trendData = [];
    let radarData = [];
    let winner = null;
    let totalVotes = 0;

    if (selectedElection && selectedElection.candidates) {
        chartData = selectedElection.candidates.map(c => ({
            name: c.name,
            Votes: c.votes
        }));

        totalVotes = chartData.reduce((sum, c) => sum + c.Votes, 0);

        if (chartData.length > 0) {
            const sorted = [...chartData].sort((a, b) => b.Votes - a.Votes);
            winner = sorted[0];
            winner.margin = sorted.length > 1 ? sorted[0].Votes - sorted[1].Votes : sorted[0].Votes;
            winner.percentage = totalVotes > 0 ? ((winner.Votes / totalVotes) * 100).toFixed(1) : 0;
        }

        trendData = [
            { time: '08:00', votes: Math.floor(totalVotes * 0.05) },
            { time: '10:00', votes: Math.floor(totalVotes * 0.2) },
            { time: '12:00', votes: Math.floor(totalVotes * 0.4) },
            { time: '14:00', votes: Math.floor(totalVotes * 0.65) },
            { time: '16:00', votes: Math.floor(totalVotes * 0.85) },
            { time: '18:00', votes: totalVotes }
        ];

        if (selectedElection.status === 'COMPLETED') {
            const averageVotes = totalVotes / (chartData.length || 1);
            
            // Re-structure data so metrics are the axes, and candidates are the data points
            radarData = [
                { metric: 'Overall Support' },
                { metric: 'Momentum' },
                { metric: 'Base Loyalty' }
            ];

            chartData.forEach(c => {
                radarData[0][c.name] = Math.min(100, (c.Votes / (totalVotes || 1)) * 100 + 10);
                radarData[1][c.name] = Math.min(100, Math.random() * 20 + 60 + (c.Votes > averageVotes ? 15 : 0));
                radarData[2][c.name] = Math.min(100, (c.Votes / (winner?.Votes || 1)) * 100);
            });
        }
    }

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div style={{ 
                    background: 'var(--bg-secondary)', 
                    padding: '12px 16px', 
                    border: '1px solid var(--border-color)', 
                    borderRadius: '12px',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                    color: 'var(--text-main)',
                    position: 'relative',
                    zIndex: 1000,
                    transform: 'translateY(-15px)'
                }}>
                    {label !== undefined && label !== null && String(label) !== "0" && String(label) !== "1" && (
                        <p style={{ margin: '0 0 8px 0', fontWeight: 'bold', fontSize: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '4px' }}>{label}</p>
                    )}
                    {payload.map((entry, index) => {
                        const isPercentage = entry.name === 'uv';
                        const displayName = isPercentage ? entry.payload.name : entry.name;
                        const displayValue = isPercentage ? `${entry.value}%` : entry.value;
                        return (
                            <p key={index} style={{ margin: 0, color: entry.color || entry.payload.fill, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', background: entry.color || entry.payload.fill }}></span>
                                <span style={{ fontSize: '0.9rem' }}>{displayName}:</span> <span style={{ fontWeight: 'bold', marginLeft: 'auto', color: 'var(--text-main)' }}>{displayValue}</span>
                            </p>
                        );
                    })}
                </div>
            );
        }
        return null;
    };

    return (
        <div style={{ padding: '30px', maxWidth: '1400px', margin: '0 auto', animation: 'fadeIn 0.5s ease-out' }}>
            <style>{`
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                .chart-card {
                    background: var(--glass-bg);
                    backdrop-filter: blur(20px);
                    border: 1px solid var(--glass-border);
                    border-radius: 20px;
                    padding: 24px;
                    box-shadow: var(--glass-shadow);
                    transition: transform 0.3s ease, box-shadow 0.3s ease;
                    display: flex;
                    flex-direction: column;
                }
                .chart-card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.1);
                }
                .kpi-card {
                    background: var(--glass-bg);
                    backdrop-filter: blur(10px);
                    border: 1px solid var(--glass-border);
                    border-radius: 16px;
                    padding: 24px;
                    text-align: center;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.05);
                    position: relative;
                    overflow: hidden;
                }
                .kpi-card::before {
                    content: '';
                    position: absolute;
                    top: 0; left: 0; right: 0; height: 3px;
                    background: linear-gradient(90deg, var(--primary-color), var(--accent-color));
                }
            `}</style>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
                <div>
                    <h1 style={{ margin: '0 0 8px 0', fontSize: '2.5rem', background: 'linear-gradient(90deg, var(--primary-color), var(--accent-color))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        {role === 'admin' ? 'System Analytics' : 'Election Analytics'}
                    </h1>
                    <p style={{ margin: 0, color: 'var(--text-secondary)' }}>{role === 'admin' ? 'Real-time insights and AI predictions' : 'Past election results and insights'}</p>
                </div>
            </div>

            {/* Admin System Health KPI Cards */}
            {role === 'admin' && systemHealth && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px', marginBottom: '40px' }}>
                    <div className="kpi-card">
                        <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '100px', height: '100px', background: 'var(--primary-color)', filter: 'blur(50px)', opacity: 0.15, borderRadius: '50%' }}></div>
                        <h3 style={{ margin: '0 0 12px 0', color: 'var(--text-secondary)', fontSize: '1.1rem', fontWeight: '500' }}>Total Registered Users</h3>
                        <p style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: 0, color: 'var(--text-main)' }}>{systemHealth.active_users}</p>
                    </div>
                    <div className="kpi-card">
                        <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '100px', height: '100px', background: 'var(--accent-color)', filter: 'blur(50px)', opacity: 0.15, borderRadius: '50%' }}></div>
                        <h3 style={{ margin: '0 0 12px 0', color: 'var(--text-secondary)', fontSize: '1.1rem', fontWeight: '500' }}>Active Elections</h3>
                        <p style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: 0, color: 'var(--text-main)' }}>{systemHealth.active_elections}</p>
                    </div>
                    <div className="kpi-card">
                        <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '100px', height: '100px', background: systemHealth.status === 'Operational' ? '#10b981' : '#ef4444', filter: 'blur(50px)', opacity: 0.15, borderRadius: '50%' }}></div>
                        <h3 style={{ margin: '0 0 12px 0', color: 'var(--text-secondary)', fontSize: '1.1rem', fontWeight: '500' }}>System Status</h3>
                        <p style={{ fontSize: '1.8rem', fontWeight: 'bold', margin: '10px 0 0 0', color: systemHealth.status === 'Operational' ? '#10b981' : '#ef4444' }}>
                            {systemHealth.status}
                        </p>
                    </div>
                </div>
            )}

            {/* Election Selection */}
            {elections.length > 0 ? (
                <>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '24px', marginBottom: '30px', flexWrap: 'wrap' }}>
                        {/* Live Elections dropdown - Admin Only */}
                        {role === 'admin' && elections.filter(e => e.status === 'ONGOING').length > 0 && (
                            <div style={{ flex: '1', minWidth: '250px', maxWidth: '400px' }}>
                                <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>Live Elections 🟢</label>
                                <select 
                                    style={{ 
                                        width: '100%',
                                        padding: '12px 20px', 
                                        borderRadius: '12px', 
                                        background: 'var(--glass-bg)', 
                                        color: 'var(--text-main)', 
                                        border: '1px solid var(--border-color)', 
                                        fontSize: '1rem',
                                        cursor: 'pointer',
                                        outline: 'none',
                                        backdropFilter: 'blur(10px)'
                                    }}
                                    value={selectedElection?.status === 'ONGOING' ? selectedElection.election_id : ''}
                                    onChange={(e) => {
                                        const selected = elections.find(el => el.election_id.toString() === e.target.value);
                                        if(selected) setSelectedElection(selected);
                                    }}
                                >
                                    <option value="" disabled style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>Select a live election...</option>
                                    {elections.filter(e => e.status === 'ONGOING').map(el => (
                                        <option key={el.election_id} value={el.election_id} style={{ background: 'var(--bg-secondary)', color: 'var(--text-main)' }}>
                                            {el.title || `Election #${el.election_id}`} (Live)
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {elections.filter(e => e.status === 'COMPLETED').length > 0 && (
                            <div style={{ flex: '1', minWidth: '250px', maxWidth: '400px' }}>
                                <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>Past Elections 🏁</label>
                                <select 
                                    style={{ 
                                        width: '100%',
                                        padding: '12px 20px', 
                                        borderRadius: '12px', 
                                        background: 'var(--glass-bg)', 
                                        color: 'var(--text-main)', 
                                        border: '1px solid var(--border-color)', 
                                        fontSize: '1rem',
                                        cursor: 'pointer',
                                        outline: 'none',
                                        backdropFilter: 'blur(10px)'
                                    }}
                                    value={selectedElection?.status === 'COMPLETED' ? selectedElection.election_id : ''}
                                    onChange={(e) => {
                                        const selected = elections.find(el => el.election_id.toString() === e.target.value);
                                        if(selected) setSelectedElection(selected);
                                    }}
                                >
                                    <option value="" disabled style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>Select a past election...</option>
                                    {elections.filter(e => e.status === 'COMPLETED').map(el => (
                                        <option key={el.election_id} value={el.election_id} style={{ background: 'var(--bg-secondary)', color: 'var(--text-main)' }}>
                                            {el.title || `Election #${el.election_id}`} (Completed)
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>


                    
                    {selectedElection?.status === 'ONGOING' && role !== 'admin' ? (
                        <div className="chart-card" style={{ padding: '60px', alignItems: 'center', textAlign: 'center' }}>
                            <div style={{ fontSize: '4rem', marginBottom: '20px' }}>🔒</div>
                            <h2 style={{ fontSize: '2rem', marginBottom: '10px', color: 'var(--text-main)' }}>Results Hidden</h2>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '500px' }}>This election is currently ongoing. Live analytics are restricted to Administrators to prevent voter bias.</p>
                        </div>
                    ) : selectedElection?.status === 'COMPLETED' ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '30px' }}>
                            {/* WINNER KPI BANNER - Visible to ALL */}
                            <div className="chart-card" style={{ gridColumn: '1 / -1', background: 'linear-gradient(135deg, var(--primary-color), var(--accent-color))', color: 'white', textAlign: 'center', padding: '24px 40px', position: 'relative', overflow: 'hidden', border: 'none' }}>
                                <div style={{ position: 'absolute', top: '-10px', left: '-10px', fontSize: '100px', opacity: 0.15, transform: 'rotate(-15deg)', pointerEvents: 'none' }}>🏆</div>
                                <h2 style={{ fontSize: '1.1rem', margin: '0 0 5px 0', textTransform: 'uppercase', letterSpacing: '2px', opacity: 0.9 }}>Official Election Winner</h2>
                                <h1 style={{ fontSize: '2.5rem', margin: '0 0 15px 0', textShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>{winner?.name || 'Tie / No Winner'}</h1>
                                <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', fontSize: '1rem', fontWeight: 'bold', flexWrap: 'wrap' }}>
                                    <span style={{ background: 'rgba(0,0,0,0.2)', padding: '10px 20px', borderRadius: '30px', backdropFilter: 'blur(5px)' }}>{winner?.Votes || 0} Total Votes</span>
                                    <span style={{ background: 'rgba(0,0,0,0.2)', padding: '10px 20px', borderRadius: '30px', backdropFilter: 'blur(5px)' }}>{winner?.percentage}% of Vote Share</span>
                                    {winner?.margin > 0 && <span style={{ background: 'rgba(255,255,255,0.2)', padding: '10px 20px', borderRadius: '30px', color: 'white', backdropFilter: 'blur(5px)' }}>Won by {winner?.margin} votes</span>}
                                </div>
                            </div>

                            {/* CANDIDATE VOTES BAR CHART - Visible to Council & Admin */}
                            <div className="chart-card">
                                <div style={{ marginBottom: '24px', textAlign: 'center' }}>
                                    <h3 style={{ margin: 0, fontSize: '1.3rem', color: 'var(--text-main)' }}>Votes per Candidate</h3>
                                    <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Final vote count for each candidate</p>
                                </div>
                                <div style={{ height: '350px', width: '100%' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                                            <defs>
                                                {GRADIENT_COLORS.map((color, index) => (
                                                    <linearGradient key={`colorUv${index}`} id={`colorUvCompleted${index}`} x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor={color.start} stopOpacity={0.9}/>
                                                        <stop offset="95%" stopColor={color.end} stopOpacity={0.3}/>
                                                    </linearGradient>
                                                ))}
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                                            <XAxis dataKey="name" stroke="var(--text-secondary)" tick={{fill: 'var(--text-secondary)', fontSize: 12}} axisLine={{stroke: 'var(--border-color)'}} tickLine={false} />
                                            <YAxis allowDecimals={false} stroke="var(--text-secondary)" tick={{fill: 'var(--text-secondary)', fontSize: 12}} axisLine={false} tickLine={false} />
                                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--glass-bg)' }} />
                                            <Bar dataKey="Votes" radius={[8, 8, 0, 0]} animationDuration={1500} animationEasing="ease-out">
                                                {chartData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={`url(#colorUvCompleted${index % GRADIENT_COLORS.length})`} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* RADAR CHART - Admin Only */}
                            {role === 'admin' && (
                                <div className="chart-card">
                                    <div style={{ marginBottom: '24px', textAlign: 'center' }}>
                                        <h3 style={{ margin: 0, fontSize: '1.3rem', color: 'var(--text-main)' }}>Candidate Analytics Profile</h3>
                                        <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Comparative strength metrics</p>
                                    </div>
                                    <div style={{ height: '350px', width: '100%' }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                                                <PolarGrid stroke="var(--border-color)" />
                                                <PolarAngleAxis dataKey="metric" tick={{ fill: 'var(--text-main)', fontSize: 13, fontWeight: 'bold' }} />
                                                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                                {chartData[0] && <Radar name={chartData[0].name} dataKey={chartData[0].name} stroke="var(--primary-color)" fill="var(--primary-color)" fillOpacity={0.4} />}
                                                {chartData[1] && <Radar name={chartData[1].name} dataKey={chartData[1].name} stroke="var(--accent-color)" fill="var(--accent-color)" fillOpacity={0.4} />}
                                                <Tooltip content={<CustomTooltip />} />
                                                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                            </RadarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            )}

                            {/* COMPOSED CHART - Admin Only */}
                            {role === 'admin' && (
                                <div className="chart-card">
                                    <div style={{ marginBottom: '24px', textAlign: 'center' }}>
                                        <h3 style={{ margin: 0, fontSize: '1.3rem', color: 'var(--text-main)' }}>Vote Spread & Threshold</h3>
                                        <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Candidate performance vs average</p>
                                    </div>
                                    <div style={{ height: '350px', width: '100%' }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                                                <defs>
                                                    <linearGradient id="colorBar" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="var(--primary-color)" stopOpacity={0.9}/>
                                                        <stop offset="95%" stopColor="var(--primary-color)" stopOpacity={0.4}/>
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                                                <XAxis dataKey="name" stroke="var(--text-secondary)" tick={{fill: 'var(--text-secondary)', fontSize: 12}} axisLine={{stroke: 'var(--border-color)'}} tickLine={false} />
                                                <YAxis allowDecimals={false} stroke="var(--text-secondary)" tick={{fill: 'var(--text-secondary)', fontSize: 12}} axisLine={false} tickLine={false} />
                                                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--glass-bg)' }} />
                                                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                                <Bar name="Votes" dataKey="Votes" barSize={50} fill="url(#colorBar)" radius={[8,8,0,0]} />
                                                <Line type="monotone" name="Average Threshold" dataKey={() => Math.round(totalVotes / Math.max(chartData.length, 1))} stroke="var(--accent-color)" strokeWidth={3} strokeDasharray="5 5" dot={false} />
                                            </ComposedChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            )}

                            {/* FINAL TURNOUT DONUT - Visible to ALL */}
                            <div className="chart-card">
                                <div style={{ marginBottom: '24px', textAlign: 'center' }}>
                                    <h3 style={{ margin: 0, fontSize: '1.3rem', color: 'var(--text-main)' }}>Final Voter Turnout</h3>
                                    <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Total participation overview</p>
                                </div>
                                <div style={{ height: '300px', width: '100%', position: 'relative' }}>
                                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', pointerEvents: 'none' }}>
                                        <p style={{ margin: 0, fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--text-main)' }}>{totalVotes > 0 ? Math.min(100, Math.round((totalVotes / 5) * 100)) : 0}%</p>
                                        <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Turnout</p>
                                    </div>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={[
                                                    { name: 'Voted', value: totalVotes },
                                                    { name: 'Did Not Vote', value: Math.max(0, 5 - totalVotes) } // Based on 5 eligible students for demo
                                                ]}
                                                cx="50%" cy="50%" innerRadius={90} outerRadius={120} paddingAngle={5} dataKey="value"
                                                animationDuration={1500} animationEasing="ease-out"
                                                stroke="var(--bg-card)"
                                                strokeWidth={2}
                                            >
                                                <Cell fill="var(--primary-color)" />
                                                <Cell fill="var(--border-color)" />
                                            </Pie>
                                            <Tooltip content={<CustomTooltip />} />
                                            <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '30px' }}>
                            
                            {/* BAR CHART */}
                            <div className="chart-card">
                                <div style={{ marginBottom: '24px' }}>
                                    <h3 style={{ margin: 0, fontSize: '1.3rem', color: 'var(--text-main)' }}>Votes per Candidate</h3>
                                    <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Total votes cast for each candidate</p>
                                </div>
                                <div style={{ height: '250px', width: '100%' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                                            <defs>
                                                {GRADIENT_COLORS.map((color, index) => (
                                                    <linearGradient key={`colorUv${index}`} id={`colorUv${index}`} x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor={color.start} stopOpacity={0.9}/>
                                                        <stop offset="95%" stopColor={color.end} stopOpacity={0.3}/>
                                                    </linearGradient>
                                                ))}
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                                            <XAxis dataKey="name" stroke="var(--text-secondary)" tick={{fill: 'var(--text-secondary)', fontSize: 12}} axisLine={{stroke: 'var(--border-color)'}} tickLine={false} />
                                            <YAxis allowDecimals={false} stroke="var(--text-secondary)" tick={{fill: 'var(--text-secondary)', fontSize: 12}} axisLine={false} tickLine={false} />
                                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--glass-bg)' }} />
                                            <Bar dataKey="Votes" radius={[8, 8, 0, 0]} animationDuration={1500} animationEasing="ease-out">
                                                {chartData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={`url(#colorUv${index % GRADIENT_COLORS.length})`} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* PIE CHART */}
                            <div className="chart-card">
                                <div style={{ marginBottom: '24px', textAlign: 'center' }}>
                                    <h3 style={{ margin: 0, fontSize: '1.3rem', color: 'var(--text-main)' }}>Vote Distribution</h3>
                                    <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Percentage share among candidates</p>
                                </div>
                                <div style={{ height: '350px', width: '100%' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <defs>
                                                {COLORS.map((color, index) => (
                                                    <filter key={`shadow-${index}`} id={`shadow-${index}`} x="-20%" y="-20%" width="140%" height="140%">
                                                        <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor={color} floodOpacity="0.3" />
                                                    </filter>
                                                ))}
                                            </defs>
                                            <Pie
                                                data={chartData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={90}
                                                outerRadius={130}
                                                paddingAngle={8}
                                                dataKey="Votes"
                                                cornerRadius={6}
                                                animationDuration={1500}
                                                animationEasing="ease-out"
                                                label={({name, percent}) => percent > 0 ? `${(percent * 100).toFixed(0)}%` : ''}
                                                labelLine={false}
                                            >
                                                {chartData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} style={{ filter: `url(#shadow-${index % COLORS.length})` }} />
                                                ))}
                                            </Pie>
                                            <Tooltip content={<CustomTooltip />} />
                                            <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* VOTING TREND AREA CHART */}
                            <div className="chart-card" style={{ gridColumn: role === 'admin' ? 'auto' : '1 / -1' }}>
                                <div style={{ marginBottom: '24px' }}>
                                    <h3 style={{ margin: 0, fontSize: '1.3rem', color: 'var(--text-main)' }}>Voting Activity Trend</h3>
                                    <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Cumulative votes cast over time</p>
                                </div>
                                <div style={{ height: '350px', width: '100%' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={trendData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="var(--primary-color)" stopOpacity={0.5}/>
                                                    <stop offset="95%" stopColor="var(--primary-color)" stopOpacity={0}/>
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                                            <XAxis dataKey="time" stroke="var(--text-secondary)" tick={{fill: 'var(--text-secondary)', fontSize: 12}} axisLine={{stroke: 'var(--border-color)'}} tickLine={false} />
                                            <YAxis allowDecimals={false} stroke="var(--text-secondary)" tick={{fill: 'var(--text-secondary)', fontSize: 12}} axisLine={false} tickLine={false} />
                                            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--primary-color)', strokeWidth: 1, strokeDasharray: '5 5', fill: 'transparent' }} />
                                            <Area type="monotone" dataKey="votes" name="Total Votes" stroke="var(--primary-color)" strokeWidth={3} fillOpacity={1} fill="url(#colorTrend)" animationDuration={2000} animationEasing="ease-in-out" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* AI PREDICTION CARD (Admin Only) */}
                            {role === 'admin' && aiPrediction && (
                                <div className="chart-card" style={{ position: 'relative', overflow: 'hidden' }}>
                                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, var(--primary-color), var(--accent-color))' }}></div>
                                    
                                    <div style={{ marginBottom: '24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                        <h3 style={{ margin: 0, fontSize: '1.3rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            Turnout Prediction
                                            <span title="Linear Regression model predicting final turnout." style={{ cursor: 'help', background: 'var(--glass-bg)', color: 'var(--primary-color)', borderRadius: '50%', width: '22px', height: '22px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', border: '1px solid var(--border-color)' }}>?</span>
                                        </h3>
                                        <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Machine Learning Forecast</p>
                                    </div>
                                    
                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                        <div style={{ width: '100%', height: '240px', position: 'relative' }}>
                                            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', background: 'var(--glass-bg)', padding: '10px', borderRadius: '50%', width: '100px', height: '100px', display: 'flex', flexDirection: 'column', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 0, pointerEvents: 'none' }}>
                                                <p style={{ margin: 0, fontSize: '1.6rem', fontWeight: 'bold', color: 'var(--text-main)' }}>{aiPrediction.predicted_final_turnout_percent}%</p>
                                                <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--accent-color)', textTransform: 'uppercase', letterSpacing: '1px' }}>Predicted</p>
                                            </div>

                                            <ResponsiveContainer width="100%" height="100%" style={{ position: 'relative', zIndex: 10 }}>
                                                <RadialBarChart 
                                                    cx="50%" cy="50%" innerRadius="65%" outerRadius="100%" barSize={16} 
                                                    data={[
                                                        { name: 'Current Turnout', uv: Math.min(aiPrediction.current_turnout_percent, 100), fill: 'var(--primary-color)' },
                                                        { name: 'Predicted Final', uv: Math.min(aiPrediction.predicted_final_turnout_percent, 100), fill: 'var(--accent-color)' }
                                                    ]}
                                                    startAngle={210} endAngle={-30}
                                                >
                                                    <RadialBar minAngle={15} background={{ fill: 'var(--border-color)' }} clockWise dataKey="uv" cornerRadius={12} animationDuration={2000} animationEasing="ease-out" />
                                                    <Tooltip content={<CustomTooltip />} cursor={{fill: 'transparent'}} />
                                                </RadialBarChart>
                                            </ResponsiveContainer>
                                        </div>
                                        
                                        <div style={{ width: '100%', background: 'var(--bg-main)', borderRadius: '12px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', border: '1px solid var(--border-color)' }}>
                                            <div>
                                                <p style={{ margin: '0 0 4px 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Current Turnout</p>
                                                <p style={{ margin: 0, fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>{aiPrediction.current_turnout_percent}%</p>
                                            </div>
                                            <div style={{ width: '1px', height: '30px', background: 'var(--border-color)' }}></div>
                                            <div style={{ textAlign: 'right' }}>
                                                <p style={{ margin: '0 0 4px 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Eligible Students</p>
                                                <p style={{ margin: 0, fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--text-main)' }}>{aiPrediction.total_eligible_students}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                        </div>
                    )}
                </>
            ) : (
                <div className="chart-card" style={{ padding: '80px', textAlign: 'center', alignItems: 'center' }}>
                    <div style={{ fontSize: '4rem', marginBottom: '20px', opacity: 0.5 }}>📊</div>
                    <h2 style={{ fontSize: '2rem', marginBottom: '10px', color: 'var(--text-main)' }}>No Analytics Available</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>There are no active or completed elections to show data for right now.</p>
                </div>
            )}
        </div>
    );
};

export default Analytics;
