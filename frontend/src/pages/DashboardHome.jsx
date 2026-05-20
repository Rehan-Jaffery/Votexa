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

    // CR Stats State
    const [crStats, setCrStats] = useState(null);

    useEffect(() => {
        // Fetch real stats if possible, or mock for demo
        fetchStats();

        const u = localStorage.getItem("user");
        if (u) {
            const parsedUser = JSON.parse(u);
            setUser(parsedUser);
            if (parsedUser.role === 'cr') {
                fetchCrStats();
            }
        }
    }, []);

    const fetchCrStats = async () => {
        try {
            const res = await api.get("/analytics/cr-stats");
            setCrStats(res.data);
        } catch (e) {
            console.error("Failed to fetch CR stats", e);
        }
    };


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
                // 1. Council Results (For Global Display)
                const councilResults = resResults.data.filter(r => r.type === "COUNCIL" && r.status === "COMPLETED");

                // 2. User Specific Results (CR)
                userResults = resResults.data.filter(r => {
                    if (r.status !== "COMPLETED") return false;
                    if (r.type === "CR" && r.course === u.course && String(r.semester) === String(u.semester)) return true;
                    return false;
                });

                // Sort by ID/Date Descending
                userResults.sort((a, b) => b.election_id - a.election_id);

                // Keep only the LATEST CR result
                if (userResults.length > 0) {
                    userResults = [userResults[0]];
                }

                setStats(prev => ({
                    ...prev,
                    activeElections: res.data.length,
                    userResults: userResults,
                    councilResults: councilResults
                }));
            }

            // 3. FETCH PUBLIC COUNCIL DATA (For All Users)
            try {
                const councilRes = await api.get("/users/public-council");
                setStats(prev => ({
                    ...prev,
                    publicCouncil: councilRes.data // { council: [], crs: [] }
                }));
            } catch (e) {
                console.error("Public council fetch error", e);
            }

            // ADMIN DASHBOARD DATA
            const currentUser = userStr ? JSON.parse(userStr) : null;
            if (currentUser && currentUser.role === 'admin') {
                // 1. Fetch Users (Council & CRs)
                try {
                    const userRes = await api.get("/users/");
                    const allUsers = userRes.data;
                    const council = allUsers.filter(u => ["president", "vice_president", "secretary", "joint_secretary"].includes(u.role));
                    const crs = allUsers.filter(u => ["cr", "president", "vice_president", "secretary", "joint_secretary"].includes(u.role));

                    setStats(prev => ({
                        ...prev,
                        councilList: council,
                        crList: crs
                    }));
                } catch (e) {
                    console.error("Admin users fetch error", e);
                }

                // 2. Fetch System Health
                try {
                    const healthRes = await api.get("/analytics/system-health");
                    setStats(prev => ({
                        ...prev,
                        systemHealth: healthRes.data
                    }));
                } catch (e) {
                    console.error("System health fetch error", e);
                    setStats(prev => ({
                        ...prev,
                        systemHealth: { status: "Error", message: "Connection Failed", db_status: "Unknown" }
                    }));
                }
            } else if (currentUser && ["president", "vice_president", "secretary", "joint_secretary", "cr"].includes(currentUser.role)) {
                // COUNCIL / CR: UPDATES
                try {
                    const upcomingRes = await api.get("/elections/upcoming-events");
                    setStats(prev => ({
                        ...prev,
                        upcomingEvents: upcomingRes.data
                    }));
                } catch (e) {
                    console.error("Upcoming fetch error", e);
                }
            }
        } catch (e) {
            console.error(e);
        }
    };


    const role = user?.role || "student";
    const isCouncil = ["president", "vice_president", "secretary", "joint_secretary"].includes(role);
    const isCR = role === 'cr';

    // Logic to determine which "Council" view to show
    // 1. Official Appointed Council (Admin manually updated roles)
    const officialCouncil = stats.publicCouncil?.council || [];
    const showOfficialCouncil = officialCouncil.length > 0;

    // 2. Election Winners (Election completed but roles not yet updated)
    // We only show this if Official Council is NOT yet set
    const showElectionWinners = !showOfficialCouncil && stats.councilResults?.length > 0;

    return (
        <div className="animate-fade-in">
            <h1 className="animate-slide-up" style={{
                background: 'linear-gradient(135deg, var(--primary-color), #818cf8)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                marginBottom: '10px',
                textTransform: 'capitalize'
            }}>
                Hello, {role === 'admin' ? 'Admin' : isCR ? 'Class Rep' : isCouncil ? role.replace('_', ' ') : user?.name?.split(' ')[0]}! 👋
            </h1>
            <p className="animate-slide-up animate-delay-100" style={{ color: 'var(--text-secondary)', marginBottom: '30px' }}>
                {role === 'admin' ? "System Overview & Controls" : isCR ? "Manage your class turnout." : isCouncil ? `Welcome back, Mr. ${role.replace('_', ' ')}` : "Here's your activity overview."}
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

                {/* CR DASHBOARD STATS */}
                {isCR && crStats && crStats.has_active_election && (
                    <div className="glass-card-premium animate-slide-up animate-delay-300"
                        style={{ padding: '24px', borderLeft: '4px solid #8b5cf6' }}>
                        <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '8px' }}>Class Turnout</h3>
                        <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{crStats.turnout_percentage}%</div>
                        <div style={{ marginTop: '5px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            {crStats.votes_cast} / {crStats.total_students} Voted
                        </div>
                        <div style={{ marginTop: '5px', fontSize: '0.85rem', color: '#ef4444', fontWeight: 'bold' }}>
                            {crStats.pending_votes} Pending
                        </div>
                    </div>
                )}

                {/* CR NO ACTIVE ELECTION */}
                {isCR && crStats && !crStats.has_active_election && (
                    <div className="glass-card-premium animate-slide-up animate-delay-300" style={{ padding: '24px', opacity: 0.7 }}>
                        <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '8px' }}>Class Turnout</h3>
                        <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>No Active Vote</div>
                        <div style={{ marginTop: '10px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Relax, nothing to track.</div>
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

                {/* STUDENT: Participation */}
                {(!isCouncil && role !== 'admin') && (
                    <div className="glass-card-premium animate-slide-up animate-delay-300" style={{ padding: '24px' }}>
                        <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '8px' }}>Your Participation</h3>
                        <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>-</div>
                        <div style={{ marginTop: '10px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Votes Cast</div>
                    </div>
                )}

                {/* SYSTEM / UPCOMING CARD */}
                <div className="glass-card-premium animate-slide-up animate-delay-300" style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '100px', height: '100px', background: 'var(--primary-color)', filter: 'blur(50px)', opacity: '0.2' }}></div>

                    {role === 'admin' ? (
                        <>
                            <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '8px' }}>System Status</h3>
                            <div style={{ fontSize: '1.2rem', fontWeight: '600', marginTop: '8px', color: stats.systemHealth?.status === "Operational" ? '#10b981' : '#f59e0b' }}>
                                {stats.systemHealth?.message || "Checking..."}
                            </div>
                            {stats.systemHealth && (
                                <div style={{ fontSize: '0.8rem', marginTop: '5px', color: 'var(--text-secondary)' }}>
                                    DB: {stats.systemHealth.db_status} | Users: {stats.systemHealth.active_users}
                                </div>
                            )}
                        </>
                    ) : (
                        <>
                            <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '8px' }}>
                                Upcoming Event
                            </h3>
                            <div style={{ marginTop: '8px' }}>
                                {stats.upcomingEvents && stats.upcomingEvents.length > 0 ? (
                                    <>
                                        <div style={{ fontSize: '1rem', fontWeight: 'bold' }}>{stats.upcomingEvents[0].title}</div>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--primary-color)' }}>{stats.upcomingEvents[0].start_date}</div>
                                    </>
                                ) : (
                                    <div style={{ fontSize: '1.2rem', fontWeight: '600', color: 'var(--text-secondary)' }}>
                                        {stats.activeElections > 0 ? "Check Vote Page" : "No active events"}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>



            {/* DYNAMIC COUNCIL SECTION (For Non-Admins mainly, but data available) */}
            {role !== 'admin' && (
                <div className="animate-fade-in" style={{ marginTop: '40px' }}>

                    {/* SCENARIO 1: OFFICIAL COUNCIL APPOINTED (Admin promoted users) */}
                    {showOfficialCouncil && (
                        <>
                            <h2 style={{ fontSize: '1.5rem', marginBottom: '20px', color: 'var(--text-main)', textAlign: 'center' }}>🏛️ Your Student Council</h2>

                            {/* Council Grid */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '40px' }}>
                                {officialCouncil.map(member => (
                                    <div key={member.email} className="glass-card-premium" style={{ padding: '25px', textAlign: 'center', borderTop: '4px solid #f59e0b' }}>
                                        <div style={{
                                            width: '70px', height: '70px', borderRadius: '50%', background: 'var(--input-bg)', margin: '0 auto 15px auto',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', border: '2px solid var(--glass-border)'
                                        }}>
                                            👤
                                        </div>
                                        <h3 style={{ margin: '0 0 5px 0', fontSize: '1.1rem', color: 'var(--text-main)' }}>{member.name}</h3>
                                        <p style={{ margin: 0, color: '#f59e0b', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '0.8rem' }}>{member.role.replace('_', ' ')}</p>
                                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '10px' }}>{member.email}</p>
                                    </div>
                                ))}
                            </div>

                            {/* CR List */}
                            <h3 style={{ fontSize: '1.2rem', marginBottom: '15px', color: 'var(--text-main)' }}>🎓 Class Representatives</h3>
                            <div className="glass-card-premium" style={{ overflow: 'hidden', padding: 0 }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <tbody>
                                        {(() => {
                                            // LOGIC:
                                            // - Admin/Council/CR: Can see ALL CRs
                                            // - Student: Can only see CR of their own class (Course + Sem)
                                            let displayedCRs = stats.publicCouncil?.crs || [];

                                            // If simple student (not admin, council, or cr), filter list
                                            if (role === 'student' && user) {
                                                displayedCRs = displayedCRs.filter(cr =>
                                                    cr.course === user.course &&
                                                    String(cr.semester) === String(user.semester)
                                                );
                                            }

                                            if (displayedCRs.length === 0) {
                                                if (role === 'student') return <tr><td colSpan="4" style={{ padding: '15px', color: 'var(--text-secondary)' }}>No Class Rep appointed for your class yet.</td></tr>;
                                                return <tr><td colSpan="4" style={{ padding: '15px', color: 'var(--text-secondary)' }}>No Representatives found.</td></tr>;
                                            }

                                            return displayedCRs.map(cr => (
                                                <tr key={cr.email} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                    <td style={{ padding: '15px', fontWeight: 'bold' }}>{cr.name}</td>
                                                    <td style={{ padding: '15px' }}>{cr.course}</td>
                                                    <td style={{ padding: '15px', color: 'var(--text-secondary)' }}>Sem {cr.semester}</td>
                                                    <td style={{ padding: '15px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{cr.email}</td>
                                                </tr>
                                            ));
                                        })()}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}

                    {/* SCENARIO 2: ELECTION WINNERS (Election Done, No manual promotion yet) */}
                    {showElectionWinners && (
                        <>
                            <h2 style={{ fontSize: '1.5rem', marginBottom: '20px', color: 'var(--text-main)', textAlign: 'center' }}>🏆 Election Winners</h2>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                                {["Vice President", "Secretary", "Joint Secretary"].map(post => {
                                    const election = stats.councilResults?.find(r => r.title.includes(post) || r.post === post);
                                    let winnerName = "NA";
                                    let winnerEmail = "";

                                    if (election && election.status === "COMPLETED") {
                                        const sorted = election.candidates.sort((a, b) => b.votes - a.votes);
                                        if (sorted.length > 0) {
                                            if (sorted.length > 1 && sorted[0].votes === sorted[1].votes && sorted[0].votes > 0) {
                                                winnerName = "NA (Draw)";
                                            } else if (sorted[0].votes > 0) {
                                                winnerName = sorted[0].name;
                                                winnerEmail = sorted[0].email;
                                            }
                                        }
                                    }

                                    return (
                                        <div key={post} className="glass-card-premium" style={{ padding: '20px', textAlign: 'center', borderTop: `4px solid ${post === 'Vice President' ? '#8b5cf6' : post === 'Secretary' ? '#ec4899' : '#f59e0b'}` }}>
                                            <h3 style={{ margin: '0 0 10px 0', color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>{post}</h3>
                                            <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'var(--input-bg)', margin: '0 auto 10px auto', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', border: '2px solid var(--glass-border)' }}>
                                                {winnerName !== "NA" && !winnerName.includes("Draw") ? "🏆" : "❓"}
                                            </div>
                                            <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--text-main)' }}>{winnerName}</div>
                                            {winnerEmail && <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>{winnerEmail}</div>}
                                        </div>
                                    )
                                })}
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* USER SPECIFIC NOTIFICATIONS & RESULTS */}
            {
                role !== 'admin' && (
                    <div style={{ marginTop: '40px' }}>

                        {/* 1. ONGOING ELECTIONS: Winner Declared Soon */}
                        {stats.activeElections > 0 && (
                            <div className="animate-pulse" style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10b981', borderRadius: '12px', padding: '15px', color: '#10b981', fontWeight: 'bold', textAlign: 'center', marginBottom: '20px' }}>
                                🗳️ Voting is LIVE! Winners will be declared soon. Keep checking this space!
                            </div>
                        )}

                        {/* 2. LATEST CLASS RESULT (CR) */}
                        <div className="animate-fade-in" style={{ animationDelay: '0.4s' }}>
                            <h2 style={{ fontSize: '1.2rem', marginBottom: '15px', color: 'var(--text-main)' }}>🏆 Latest Class Representative Result</h2>
                            {/* Filter for CR only here */}
                            {stats.userResults?.filter(r => r.type === "CR").length > 0 ? (
                                stats.userResults.filter(r => r.type === "CR").map(res => {
                                    return (
                                        <div key={res.election_id} className="glass-card-premium" style={{ padding: '25px', borderTop: '4px solid #3b82f6' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div>
                                                    <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--primary-color)' }}>{res.title}</h3>
                                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Declared: {res.end_date}</div>
                                                </div>
                                                {res.winner ? (
                                                    <div style={{ textAlign: 'right' }}>
                                                        <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{res.winner.name}</div>
                                                        <div style={{ fontSize: '0.9rem', color: '#10b981' }}>{res.winner.votes} Votes</div>
                                                    </div>
                                                ) : <div style={{ fontStyle: 'italic', color: 'var(--text-secondary)' }}>Pending</div>}
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>No class elections finalized yet.</div>
                            )}
                        </div>
                    </div>
                )
            }


            {/* ADMIN DASHBOARD SECTIONS */}
            {
                role === 'admin' && (
                    <div className="animate-fade-in" style={{ marginTop: '50px' }}>

                        {/* 1. STUDENT COUNCIL */}
                        <h2 style={{ fontSize: '1.5rem', marginBottom: '25px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            🏛️ Current Student Council
                        </h2>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '50px' }}>
                            {stats.councilList?.length > 0 ? (
                                stats.councilList.map(member => (
                                    <div key={member.student_id} className="glass-card-premium" style={{ padding: '25px', textAlign: 'center', borderTop: '4px solid #f59e0b' }}>
                                        <div style={{
                                            width: '70px', height: '70px', borderRadius: '50%', background: 'var(--input-bg)', margin: '0 auto 15px auto',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', border: '2px solid var(--glass-border)'
                                        }}>
                                            👤
                                        </div>
                                        <h3 style={{ margin: '0 0 5px 0', fontSize: '1.1rem', color: 'var(--text-main)' }}>{member.name}</h3>
                                        <p style={{ margin: 0, color: '#f59e0b', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '0.8rem' }}>{member.role.replace('_', ' ')}</p>
                                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '10px' }}>{member.email}</p>
                                    </div>
                                ))
                            ) : (
                                <div style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>No council members appointed.</div>
                            )}
                        </div>


                        {/* 2. CLASS REPRESENTATIVES */}
                        <h2 style={{ fontSize: '1.5rem', marginBottom: '25px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            🎓 Class Representatives
                        </h2>

                        <div className="glass-card-premium" style={{ overflow: 'hidden', padding: 0 }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ background: 'rgba(255,255,255,0.05)', textAlign: 'left', color: 'var(--text-secondary)', borderBottom: '1px solid var(--glass-border)' }}>
                                        <th style={{ padding: '20px' }}>Name</th>
                                        <th style={{ padding: '20px' }}>Course</th>
                                        <th style={{ padding: '20px' }}>Semester</th>
                                        <th style={{ padding: '20px' }}>Batch</th>
                                        <th style={{ padding: '20px' }}>Email</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stats.crList?.length > 0 ? (
                                        stats.crList.map(cr => (
                                            <tr key={cr.student_id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                <td style={{ padding: '20px', fontWeight: 'bold' }}>{cr.name}</td>
                                                <td style={{ padding: '20px' }}>{cr.course}</td>
                                                <td style={{ padding: '20px' }}>
                                                    <span style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', padding: '4px 10px', borderRadius: '4px', fontSize: '0.85rem' }}>
                                                        Sem {cr.semester}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '20px' }}>{cr.batch}</td>
                                                <td style={{ padding: '20px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{cr.email}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr><td colSpan="5" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-secondary)' }}>No CRs assigned.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                    </div>
                )
            }
        </div >
    );
};

export default DashboardHome;
