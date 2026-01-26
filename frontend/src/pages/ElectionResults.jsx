import React, { useState, useEffect } from 'react';
import api from '../services/api';

const ElectionResults = () => {
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedElectionId, setExpandedElectionId] = useState(null);

    // Filters
    const [viewType, setViewType] = useState("CR"); // CR or COUNCIL
    const [course, setCourse] = useState("");
    const [semester, setSemester] = useState("");

    useEffect(() => {
        fetchResults();
    }, []);

    const fetchResults = async () => {
        try {
            const res = await api.get("/results/completed");
            setResults(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Filter Logic
    const filteredResults = results.filter(r => {
        if (viewType === "COUNCIL") {
            return r.type === "COUNCIL";
        } else {
            // CR Logic
            // If filters are empty, we might not show anything (as per request)
            if (!course) return false;

            // Match Course
            // Match Sem if provided (optional? User said "categorized by Mca 2nd Sem", so precise match needed)

            const matchCourse = r.course === course;
            const matchSem = semester ? String(r.semester) === String(semester) : true;

            return r.type === "CR" && matchCourse && matchSem;
        }
    });

    if (loading) return <div style={{ padding: 40 }}>Loading Results...</div>;

    const courses = ["MCA", "Msc Aiml", "Msc Bioinformatics", "Bsc CS", "PGDCA"];

    return (
        <div className="vote-page-container animate-fade-in">
            <h1>🏆 Past Election Results</h1>
            <p style={{ color: 'var(--text-secondary)' }}>View details, winners, and statistics of completed elections.</p>

            {/* LIVE ELECTIONS SECTION */}
            {results.some(e => e.status === 'ONGOING') && (
                <div className="animate-slide-up" style={{ marginBottom: '40px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                        <h2 style={{ margin: 0 }}>🔴 Live Elections</h2>
                        <span className="blinking-dot"></span>
                    </div>
                    <div style={{ display: 'grid', gap: '20px' }}>
                        {results.filter(e => e.status === 'ONGOING').map(election => {
                            const uniqueId = `${election.election_id}-${election.course}-${election.semester}`;
                            return (
                                <div
                                    key={uniqueId}
                                    className="glass-card-premium"
                                    style={{
                                        background: 'rgba(16, 185, 129, 0.1)',
                                        borderRadius: '16px',
                                        overflow: 'hidden',
                                        border: '1px solid #10b981',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s ease'
                                    }}
                                    onClick={() => setExpandedElectionId(prev => prev === uniqueId ? null : uniqueId)}
                                >
                                    {/* HEADER */}
                                    <div style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(16, 185, 129, 0.3)' }}>
                                        <div>
                                            <h2 style={{ margin: 0, color: '#10b981' }}>{election.title}</h2>
                                            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '5px' }}>
                                                Ends: {election.end_date}
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <span style={{ background: '#10b981', color: 'white', padding: '5px 15px', borderRadius: '20px', fontSize: '0.9rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                <span className="blinking-dot-white"></span> LIVE
                                            </span>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '5px' }}>
                                                {expandedElectionId === uniqueId ? "Click to Collapse ▲" : "Click to View Details ▼"}
                                            </div>
                                        </div>
                                    </div>

                                    {/* SUMMARY (Visible when collapsed) */}
                                    {expandedElectionId !== uniqueId && (
                                        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                            <p>Voting is currently in progress for this election.</p>
                                            <p style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--text-main)', marginTop: '10px' }}>
                                                Total Votes Cast: {election.candidates.reduce((sum, c) => sum + c.votes, 0)}
                                            </p>
                                        </div>
                                    )}

                                    {/* DETAILED VIEW (Visible when expanded) */}
                                    {expandedElectionId === uniqueId && (
                                        <div className="animate-fade-in" style={{ padding: '20px', borderTop: '1px solid rgba(16, 185, 129, 0.3)' }}>
                                            {/* FULL TABLE */}
                                            <div style={{ width: '100%' }}>
                                                <h3 style={{ color: 'var(--text-main)', borderBottom: '1px solid var(--glass-border)', paddingBottom: '10px' }}>📊 Vote Breakdown</h3>
                                                <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                                    <table style={{ width: '100%', fontSize: '0.9rem', borderCollapse: 'collapse' }}>
                                                        <thead>
                                                            <tr style={{ textAlign: 'left', color: 'var(--text-secondary)' }}>
                                                                <th style={{ padding: '8px' }}>Candidate</th>
                                                                <th style={{ padding: '8px', textAlign: 'center' }}>Votes</th>
                                                                <th style={{ padding: '8px', textAlign: 'center' }}>Rank</th>
                                                                <th style={{ padding: '8px' }}>Status</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {election.candidates.map((c, i) => {
                                                                const leaderVotes = election.candidates[0]?.votes || 0;
                                                                const nextVotes = election.candidates[1]?.votes || 0;

                                                                let statusText = "-";
                                                                let statusColor = "var(--text-secondary)";

                                                                if (election.status === 'ONGOING') {
                                                                    if (c.rank === 1) {
                                                                        const margin = leaderVotes - nextVotes;
                                                                        statusText = `Leading by ${margin}`;
                                                                        statusColor = "#10b981"; // Green
                                                                    } else {
                                                                        const trailing = leaderVotes - c.votes;
                                                                        statusText = `Trailing by ${trailing}`;
                                                                        statusColor = "#f59e0b"; // Orange
                                                                    }
                                                                } else {
                                                                    // COMPLETED
                                                                    if (c.rank === 1) {
                                                                        statusText = "🏆 Winner";
                                                                        statusColor = "#fbbf24"; // Gold
                                                                    } else if (c.rank === 2) {
                                                                        statusText = "🥈 Runner Up";
                                                                        statusColor = "var(--text-secondary)";
                                                                    } else {
                                                                        statusText = "Lost";
                                                                        statusColor = "#ef4444"; // Red
                                                                    }
                                                                }

                                                                return (
                                                                    <tr key={c.candidate_id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                                        <td style={{ padding: '8px', color: 'var(--text-main)', fontWeight: '500' }}>{c.name}</td>
                                                                        <td style={{ padding: '8px', textAlign: 'center', fontWeight: 'bold', color: 'var(--text-main)' }}>{c.votes}</td>
                                                                        <td style={{ padding: '8px', textAlign: 'center', color: 'var(--text-secondary)' }}>#{c.rank}</td>
                                                                        <td style={{ padding: '8px', color: statusColor, fontWeight: 'bold', fontSize: '0.85rem' }}>{statusText}</td>
                                                                    </tr>
                                                                );
                                                            })}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* CONTROLS */}
            <div className="glass-card-premium" style={{ padding: '20px', marginTop: '20px', display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>

                {/* View Type Toggle */}
                <div style={{ display: 'flex', background: 'var(--input-bg)', borderRadius: '8px', padding: '4px' }}>
                    <button
                        onClick={() => setViewType("CR")}
                        style={{
                            padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                            background: viewType === "CR" ? 'var(--primary-color)' : 'transparent',
                            color: viewType === "CR" ? 'white' : 'var(--text-secondary)',
                            fontWeight: 'bold'
                        }}
                    >
                        Class Representative
                    </button>
                    <button
                        onClick={() => setViewType("COUNCIL")}
                        style={{
                            padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                            background: viewType === "COUNCIL" ? 'var(--primary-color)' : 'transparent',
                            color: viewType === "COUNCIL" ? 'white' : 'var(--text-secondary)',
                            fontWeight: 'bold'
                        }}
                    >
                        Student Council
                    </button>
                </div>

                {/* CR Filters */}
                {viewType === "CR" && (
                    <>
                        <select
                            value={course}
                            onChange={e => setCourse(e.target.value)}
                            className="input-premium"
                            style={{ padding: '10px', borderRadius: '8px', background: 'var(--input-bg)', color: 'var(--text-main)', border: '1px solid var(--glass-border)' }}
                        >
                            <option value="">Select Course...</option>
                            {courses.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>

                        <input
                            placeholder="Semester (e.g. 1)"
                            value={semester}
                            onChange={e => setSemester(e.target.value)}
                            className="input-premium"
                            style={{ width: '100px', padding: '10px', borderRadius: '8px', background: 'var(--input-bg)', color: 'var(--text-main)', border: '1px solid var(--glass-border)' }}
                        />
                    </>
                )}
            </div>

            {/* RESULTS LIST */}
            <h2 style={{ marginTop: '40px' }}>Detailed Results</h2>
            <div style={{ marginTop: '20px', display: 'grid', gap: '20px' }}>

                {/* EMPTY STATE MESSAGE */}
                {viewType === "CR" && !course && (
                    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                        Please select a <strong>Course</strong> to view Class Representative election results.
                    </div>
                )}

                {filteredResults.length === 0 && (viewType === "COUNCIL" || course) && (
                    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        No completed or active elections found for this criteria.
                    </div>
                )}

                {filteredResults.map(election => {
                    const uniqueId = `${election.election_id}-${election.course}-${election.semester}`;
                    return (
                        <div key={uniqueId} className="glass-card-premium" style={{ background: 'var(--glass-bg)', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
                            {/* HEADER */}
                            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--glass-border)' }}>
                                <div>
                                    <h2 style={{ margin: 0, color: 'var(--primary-color)' }}>{election.title}</h2>
                                    <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '5px' }}>
                                        📅 {election.start_date} - {election.end_date}
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    {election.status === 'ONGOING' ? (
                                        <span style={{ background: '#10b981', color: 'white', padding: '5px 15px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px', justifyContent: 'flex-end' }}>
                                            <span className="blinking-dot-white"></span> LIVE
                                        </span>
                                    ) : (
                                        <span style={{ background: '#6b7280', color: 'white', padding: '5px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold' }}>COMPLETED</span>
                                    )}
                                </div>
                            </div>

                            {/* CONTENT */}
                            <div style={{ padding: '20px' }}>
                                {/* FULL TABLE */}
                                <div style={{ width: '100%' }}>
                                    <h3 style={{ color: 'var(--text-main)', borderBottom: '1px solid var(--glass-border)', paddingBottom: '10px' }}>📊 Vote Breakdown</h3>
                                    <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                        <table style={{ width: '100%', fontSize: '0.9rem', borderCollapse: 'collapse' }}>
                                            <thead>
                                                <tr style={{ textAlign: 'left', color: 'var(--text-secondary)' }}>
                                                    <th style={{ padding: '8px' }}>Candidate</th>
                                                    <th style={{ padding: '8px', textAlign: 'center' }}>Votes</th>
                                                    <th style={{ padding: '8px', textAlign: 'center' }}>Rank</th>
                                                    <th style={{ padding: '8px' }}>Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {election.candidates.map((c, i) => {
                                                    const leaderVotes = election.candidates[0]?.votes || 0;
                                                    const nextVotes = election.candidates[1]?.votes || 0;

                                                    let statusText = "-";
                                                    let statusColor = "var(--text-secondary)";

                                                    if (election.status === 'ONGOING') {
                                                        if (c.rank === 1) {
                                                            const margin = leaderVotes - nextVotes;
                                                            statusText = `Leading by ${margin}`;
                                                            statusColor = "#10b981";
                                                        } else {
                                                            const trailing = leaderVotes - c.votes;
                                                            statusText = `Trailing by ${trailing}`;
                                                            statusColor = "#f59e0b";
                                                        }
                                                    } else {
                                                        // COMPLETED
                                                        if (c.rank === 1) {
                                                            statusText = "🏆 Winner";
                                                            statusColor = "#fbbf24";
                                                        } else if (c.rank === 2) {
                                                            statusText = "🥈 Runner Up";
                                                            statusColor = "var(--text-secondary)";
                                                        } else {
                                                            statusText = "Lost";
                                                            statusColor = "#ef4444";
                                                        }
                                                    }

                                                    return (
                                                        <tr key={c.candidate_id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                            <td style={{ padding: '8px', color: 'var(--text-main)', fontWeight: '500' }}>{c.name}</td>
                                                            <td style={{ padding: '8px', textAlign: 'center', fontWeight: 'bold', color: 'var(--text-main)' }}>{c.votes}</td>
                                                            <td style={{ padding: '8px', textAlign: 'center', color: 'var(--text-secondary)' }}>#{c.rank}</td>
                                                            <td style={{ padding: '8px', color: statusColor, fontWeight: 'bold', fontSize: '0.85rem' }}>{statusText}</td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <style>{`
                @keyframes blink { 0% { opacity: 1; } 50% { opacity: 0; } 100% { opacity: 1; } }
                .blinking-dot {
                    width: 12px; height: 12px; background: #ef4444; border-radius: 50%;
                    animation: blink 1s infinite; display: inline-block;
                }
                .blinking-dot-white {
                    width: 8px; height: 8px; background: white; border-radius: 50%;
                    animation: blink 1s infinite; display: inline-block;
                }
            `}</style>
        </div>
    );
};

export default ElectionResults;
