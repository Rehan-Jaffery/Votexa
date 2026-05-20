import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';

const COLORS = ['#f59e0b', '#0ea5e9', '#8b5cf6', '#10b981', '#f43f5e', '#ec4899'];

const ClassStats = () => {
    const [myClassData, setMyClassData] = useState(null);
    const [allClassesData, setAllClassesData] = useState(null);
    const [loading, setLoading] = useState(true);

    const role = localStorage.getItem("role") || "student";
    const token = localStorage.getItem("access_token");
    const isCouncil = ["president", "vice_president", "secretary", "joint_secretary"].includes(role);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Everyone gets their own class stats
                const myRes = await axios.get("http://127.0.0.1:5000/api/class-stats/my-class", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setMyClassData(myRes.data);

                // Council members get the all-classes overview
                if (isCouncil) {
                    const allRes = await axios.get("http://127.0.0.1:5000/api/class-stats/all-classes", {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    setAllClassesData(allRes.data);
                }
            } catch (err) {
                console.error(err);
                toast.error("Failed to load class stats");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [token, isCouncil]);

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div style={{
                    background: 'var(--bg-secondary)',
                    padding: '12px 16px',
                    border: '1px solid var(--border-color)',
                    borderRadius: '12px',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                    color: 'var(--text-main)'
                }}>
                    {label && <p style={{ margin: '0 0 8px 0', fontWeight: 'bold', fontSize: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '4px' }}>{label}</p>}
                    {payload.map((entry, index) => (
                        <p key={index} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', background: entry.color || entry.payload?.fill }}></span>
                            <span style={{ fontSize: '0.9rem' }}>{entry.name}:</span>
                            <span style={{ fontWeight: 'bold', marginLeft: 'auto', color: 'var(--text-main)' }}>{entry.value}</span>
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column' }}>
                <div style={{ border: '4px solid var(--border-color)', borderTop: '4px solid var(--primary-color)', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite', marginBottom: '16px' }} />
                <p style={{ color: 'var(--text-secondary)', letterSpacing: '1px' }}>Loading Class Data...</p>
                <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    return (
        <div style={{ padding: '30px', maxWidth: '1400px', margin: '0 auto', animation: 'fadeIn 0.5s ease-out' }}>
            <style>{`
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                .stats-card {
                    background: var(--glass-bg);
                    backdrop-filter: blur(20px);
                    border: 1px solid var(--glass-border);
                    border-radius: 20px;
                    padding: 24px;
                    box-shadow: var(--glass-shadow);
                    transition: transform 0.3s ease, box-shadow 0.3s ease;
                }
                .stats-card:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.1);
                }
                .kpi-mini {
                    background: var(--glass-bg);
                    backdrop-filter: blur(10px);
                    border: 1px solid var(--glass-border);
                    border-radius: 16px;
                    padding: 20px;
                    text-align: center;
                    position: relative;
                    overflow: hidden;
                }
                .kpi-mini::before {
                    content: '';
                    position: absolute;
                    top: 0; left: 0; right: 0; height: 3px;
                    background: linear-gradient(90deg, var(--primary-color), var(--accent-color));
                }
                .student-table {
                    width: 100%;
                    border-collapse: separate;
                    border-spacing: 0;
                }
                .student-table th {
                    background: var(--glass-bg);
                    color: var(--text-secondary);
                    font-size: 0.85rem;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    padding: 12px 16px;
                    text-align: left;
                    border-bottom: 1px solid var(--border-color);
                }
                .student-table td {
                    padding: 12px 16px;
                    border-bottom: 1px solid var(--border-color);
                    color: var(--text-main);
                    font-size: 0.95rem;
                }
                .student-table tr:hover td {
                    background: var(--glass-bg);
                }
                .role-badge {
                    display: inline-block;
                    padding: 3px 10px;
                    border-radius: 20px;
                    font-size: 0.8rem;
                    font-weight: bold;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
            `}</style>

            {/* Page Header */}
            <div style={{ marginBottom: '32px' }}>
                <h1 style={{ margin: '0 0 8px 0', fontSize: '2.5rem', background: 'linear-gradient(90deg, var(--primary-color), var(--accent-color))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    🏫 Class Stats
                </h1>
                <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                    {isCouncil ? "Overview of all classes and election participation" : "Your class overview and election participation"}
                </p>
            </div>

            {/* ============================================ */}
            {/* COUNCIL VIEW: All Classes Overview */}
            {/* ============================================ */}
            {isCouncil && allClassesData && (
                <>
                    <h2 style={{ fontSize: '1.5rem', color: 'var(--text-main)', marginBottom: '20px' }}>📊 All Classes Overview</h2>

                    {/* Cross-Class Turnout Chart */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px', marginBottom: '40px' }}>
                        <div className="stats-card">
                            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.2rem', color: 'var(--text-main)', textAlign: 'center' }}>Voter Turnout by Class</h3>
                            <div style={{ height: '300px' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={allClassesData.classes.map(c => ({
                                        name: `${c.course} S${c.semester}`,
                                        "Avg Turnout %": c.avg_turnout,
                                        "Students": c.student_count
                                    }))} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                                        <XAxis dataKey="name" stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                                        <YAxis allowDecimals={false} stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} axisLine={false} tickLine={false} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Bar dataKey="Avg Turnout %" fill="var(--primary-color)" radius={[8, 8, 0, 0]} animationDuration={1500} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="stats-card">
                            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.2rem', color: 'var(--text-main)', textAlign: 'center' }}>Students per Class</h3>
                            <div style={{ height: '300px' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={allClassesData.classes.map(c => ({
                                                name: `${c.course} S${c.semester}`,
                                                value: c.student_count
                                            }))}
                                            cx="50%" cy="50%"
                                            innerRadius={70} outerRadius={110}
                                            paddingAngle={5} dataKey="value"
                                            cornerRadius={6}
                                            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                                            labelLine={false}
                                        >
                                            {allClassesData.classes.map((_, i) => (
                                                <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip content={<CustomTooltip />} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* CR Directory Table */}
                    <div className="stats-card" style={{ marginBottom: '40px' }}>
                        <h3 style={{ margin: '0 0 20px 0', fontSize: '1.2rem', color: 'var(--text-main)' }}>📋 CR Directory</h3>
                        <div style={{ overflowX: 'auto' }}>
                            <table className="student-table">
                                <thead>
                                    <tr>
                                        <th>Class</th>
                                        <th>Semester</th>
                                        <th>Students</th>
                                        <th>CR Assigned</th>
                                        <th>CR Email</th>
                                        <th>Elections Held</th>
                                        <th>Avg Turnout</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {allClassesData.classes.map((c, i) => (
                                        <tr key={i}>
                                            <td style={{ fontWeight: 'bold' }}>{c.course}</td>
                                            <td>Semester {c.semester}</td>
                                            <td>{c.student_count}</td>
                                            <td>
                                                <span style={{
                                                    color: c.cr_name === 'Not Assigned' ? 'var(--accent-color)' : 'var(--text-main)',
                                                    fontWeight: c.cr_name === 'Not Assigned' ? 'normal' : 'bold'
                                                }}>
                                                    {c.cr_name}
                                                </span>
                                            </td>
                                            <td style={{ color: 'var(--text-secondary)' }}>{c.cr_email}</td>
                                            <td>{c.elections_held}</td>
                                            <td>
                                                <span style={{
                                                    color: c.avg_turnout > 60 ? '#10b981' : c.avg_turnout > 30 ? '#f59e0b' : '#ef4444',
                                                    fontWeight: 'bold'
                                                }}>
                                                    {c.avg_turnout}%
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '40px 0' }} />
                </>
            )}

            {/* ============================================ */}
            {/* MY CLASS VIEW (CR + Council) */}
            {/* ============================================ */}
            {myClassData && (
                <>
                    <h2 style={{ fontSize: '1.5rem', color: 'var(--text-main)', marginBottom: '20px' }}>
                        {isCouncil ? "🏠 Your Class" : "📊 Class Overview"}
                    </h2>

                    {/* KPI Cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '30px' }}>
                        <div className="kpi-mini">
                            <p style={{ margin: '0 0 8px 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Course</p>
                            <p style={{ margin: 0, fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--text-main)' }}>{myClassData.class_info.course}</p>
                        </div>
                        <div className="kpi-mini">
                            <p style={{ margin: '0 0 8px 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Semester</p>
                            <p style={{ margin: 0, fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>{myClassData.class_info.semester}</p>
                        </div>
                        <div className="kpi-mini">
                            <p style={{ margin: '0 0 8px 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Total Students</p>
                            <p style={{ margin: 0, fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--text-main)' }}>{myClassData.class_info.total_students}</p>
                        </div>
                        <div className="kpi-mini">
                            <p style={{ margin: '0 0 8px 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Elections Held</p>
                            <p style={{ margin: 0, fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--accent-color)' }}>{myClassData.participation.length}</p>
                        </div>
                    </div>

                    {/* Participation Chart */}
                    {myClassData.participation.length > 0 && (
                        <div className="stats-card" style={{ marginBottom: '30px' }}>
                            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.2rem', color: 'var(--text-main)', textAlign: 'center' }}>Election Participation</h3>
                            <div style={{ height: '280px' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={myClassData.participation.map(p => ({
                                        name: p.title,
                                        Voted: p.voters,
                                        "Did Not Vote": p.total_eligible - p.voters
                                    }))} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                                        <XAxis dataKey="name" stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                                        <YAxis allowDecimals={false} stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} axisLine={false} tickLine={false} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Legend />
                                        <Bar dataKey="Voted" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
                                        <Bar dataKey="Did Not Vote" stackId="a" fill="var(--border-color)" radius={[8, 8, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}

                    {/* Class Members Table */}
                    <div className="stats-card">
                        <h3 style={{ margin: '0 0 20px 0', fontSize: '1.2rem', color: 'var(--text-main)' }}>👥 Class Members</h3>
                        <div style={{ overflowX: 'auto' }}>
                            <table className="student-table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>University ID</th>
                                        <th>Email</th>
                                        <th>Role</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {myClassData.students.map((s, i) => (
                                        <tr key={i}>
                                            <td style={{ fontWeight: 'bold' }}>{s.name}</td>
                                            <td style={{ color: 'var(--text-secondary)' }}>{s.university_id}</td>
                                            <td style={{ color: 'var(--text-secondary)' }}>{s.email}</td>
                                            <td>
                                                <span className="role-badge" style={{
                                                    background: s.role === 'cr' ? 'rgba(245, 158, 11, 0.15)' :
                                                        ['president', 'vice_president', 'secretary', 'joint_secretary'].includes(s.role) ? 'rgba(139, 92, 246, 0.15)' : 'rgba(100, 116, 139, 0.15)',
                                                    color: s.role === 'cr' ? '#f59e0b' :
                                                        ['president', 'vice_president', 'secretary', 'joint_secretary'].includes(s.role) ? '#8b5cf6' : 'var(--text-secondary)'
                                                }}>
                                                    {s.role.replace('_', ' ')}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

            {!myClassData && !allClassesData && (
                <div className="stats-card" style={{ padding: '80px', textAlign: 'center' }}>
                    <div style={{ fontSize: '4rem', marginBottom: '20px', opacity: 0.5 }}>📊</div>
                    <h2 style={{ fontSize: '2rem', marginBottom: '10px', color: 'var(--text-main)' }}>No Class Data Available</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Could not load class statistics.</p>
                </div>
            )}
        </div>
    );
};

export default ClassStats;
