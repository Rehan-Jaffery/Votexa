import React, { useState, useEffect } from "react";
import api from "../services/api";
import "./VotePage.css";

const ManageApplications = () => {
    const [apps, setApps] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);

    useEffect(() => {
        fetchApps();
    }, []);

    const fetchApps = async () => {
        try {
            const res = await api.get("/applications/");
            setApps(res.data);
        } catch (err) {
            console.error("Failed to fetch applications", err);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (id, status) => {
        if (!window.confirm(`Are you sure you want to ${status} this application?`)) return;

        setActionLoading(id);
        try {
            await api.put(`/applications/${id}`, { status });
            alert(`Application ${status} successfully.`);
            fetchApps();
        } catch (err) {
            alert(err.response?.data?.error || "Action failed");
        } finally {
            setActionLoading(null);
        }
    };

    if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading Applications...</div>;

    return (
        <div className="vote-page-container">
            <h1>Review Applications</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Approve candidates for upcoming elections.</p>

            <div style={{ marginTop: '30px', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
                    <thead>
                        <tr style={{ background: 'rgba(255,255,255,0.1)', textAlign: 'left' }}>
                            <th style={{ padding: '12px' }}>ID</th>
                            <th style={{ padding: '12px' }}>Name</th>
                            <th style={{ padding: '12px' }}>Current Role</th>
                            <th style={{ padding: '12px' }}>Applied For</th>
                            <th style={{ padding: '12px' }}>GPA</th>
                            <th style={{ padding: '12px' }}>Status</th>
                            <th style={{ padding: '12px' }}>Date</th>
                            <th style={{ padding: '12px' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {apps.map(app => (
                            <tr key={app.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <td style={{ padding: '12px' }}>{app.student_id}</td>
                                <td style={{ padding: '12px', fontWeight: 'bold' }}>{app.name}</td>
                                <td style={{ padding: '12px', textTransform: 'capitalize' }}>{app.role}</td>
                                <td style={{ padding: '12px' }}>{app.post}</td>
                                <td style={{ padding: '12px' }}>{app.gpa}</td>
                                <td style={{ padding: '12px' }}>
                                    <span style={{
                                        padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem',
                                        background: app.status === 'APPROVED' ? '#10b981' : app.status === 'REJECTED' ? '#ef4444' : '#f59e0b',
                                        color: 'black'
                                    }}>
                                        {app.status}
                                    </span>
                                </td>
                                <td style={{ padding: '12px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{app.created_at}</td>
                                <td style={{ padding: '12px' }}>
                                    {app.status === 'PENDING' && (
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button
                                                onClick={() => handleAction(app.id, "APPROVED")}
                                                disabled={actionLoading === app.id}
                                                style={{ padding: '6px 12px', background: '#10b981', border: 'none', borderRadius: '4px', color: 'white', cursor: 'pointer' }}
                                            >
                                                Accept
                                            </button>
                                            <button
                                                onClick={() => handleAction(app.id, "REJECTED")}
                                                disabled={actionLoading === app.id}
                                                style={{ padding: '6px 12px', background: '#ef4444', border: 'none', borderRadius: '4px', color: 'white', cursor: 'pointer' }}
                                            >
                                                Reject
                                            </button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {apps.length === 0 && (
                            <tr><td colSpan="8" style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>No applications found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ManageApplications;
