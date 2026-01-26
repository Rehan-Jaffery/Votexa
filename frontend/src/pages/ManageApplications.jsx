import React, { useState, useEffect } from "react";
import api from "../services/api";
import "./VotePage.css";

const ManageApplications = () => {
    const [apps, setApps] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const [selectedApp, setSelectedApp] = useState(null); // For Modal

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
            if (selectedApp && selectedApp.id === id) setSelectedApp(null); // Close modal if open
        } catch (err) {
            alert(err.response?.data?.error || "Action failed");
        } finally {
            setActionLoading(null);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to DELETE this application? This cannot be undone.")) return;

        setActionLoading(id);
        try {
            await api.delete(`/applications/${id}`);
            alert("Application deleted successfully.");
            setApps(prev => prev.filter(a => a.id !== id));
            if (selectedApp && selectedApp.id === id) setSelectedApp(null);
        } catch (err) {
            alert(err.response?.data?.error || "Delete failed");
        } finally {
            setActionLoading(null);
        }
    };

    if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading Applications...</div>;

    return (
        <div className="vote-page-container animate-fade-in">
            <h1>Review Applications</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Approve candidates for upcoming elections.</p>

            <div style={{ marginTop: '30px', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
                    <thead>
                        <tr style={{ background: 'var(--glass-bg)', textAlign: 'left', borderBottom: '1px solid var(--glass-border)' }}>
                            <th style={{ padding: '12px', color: 'var(--text-main)' }}>ID</th>
                            <th style={{ padding: '12px', color: 'var(--text-main)' }}>Name</th>
                            <th style={{ padding: '12px', color: 'var(--text-main)' }}>Current Role</th>
                            <th style={{ padding: '12px', color: 'var(--text-main)' }}>Applied For</th>
                            <th style={{ padding: '12px', color: 'var(--text-main)' }}>GPA</th>
                            <th style={{ padding: '12px', color: 'var(--text-main)' }}>Status</th>
                            <th style={{ padding: '12px', color: 'var(--text-main)' }}>Date</th>
                            <th style={{ padding: '12px', color: 'var(--text-main)' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {apps.map(app => (
                            <tr key={app.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>{app.student_id}</td>
                                <td style={{ padding: '12px', fontWeight: 'bold', cursor: 'pointer', color: 'var(--primary-color)' }} onClick={() => setSelectedApp(app)}>
                                    {app.name} ↗
                                </td>
                                <td style={{ padding: '12px', textTransform: 'capitalize', color: 'var(--text-main)' }}>{app.role}</td>
                                <td style={{ padding: '12px', color: 'var(--text-main)' }}>{app.post}</td>
                                <td style={{ padding: '12px', color: 'var(--text-main)' }}>{app.gpa}</td>
                                <td style={{ padding: '12px' }}>
                                    <span style={{
                                        padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem',
                                        background: app.status === 'APPROVED' ? '#10b981' : app.status === 'REJECTED' ? '#ef4444' : '#f59e0b',
                                        color: 'white', fontWeight: 'bold' // Force white text for status badge
                                    }}>
                                        {app.status}
                                    </span>
                                </td>
                                <td style={{ padding: '12px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{app.created_at}</td>
                                <td style={{ padding: '12px', display: 'flex', gap: '5px' }}>
                                    <button
                                        onClick={() => setSelectedApp(app)}
                                        style={{ padding: '6px 12px', background: 'var(--input-bg)', border: '1px solid var(--glass-border)', borderRadius: '4px', color: 'var(--text-main)', cursor: 'pointer' }}
                                    >
                                        View
                                    </button>

                                    {app.status === 'PENDING' ? (
                                        <>
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
                                        </>
                                    ) : (
                                        <button
                                            onClick={() => handleAction(app.id, app.status === 'APPROVED' ? "REJECTED" : "APPROVED")}
                                            disabled={actionLoading === app.id}
                                            style={{
                                                padding: '6px 12px',
                                                background: 'transparent',
                                                border: '1px solid var(--glass-border)',
                                                borderRadius: '4px',
                                                color: 'var(--text-secondary)',
                                                cursor: 'pointer',
                                                fontSize: '0.8rem'
                                            }}
                                        >
                                            {app.status === 'APPROVED' ? "Revoke (Reject)" : "Re-Approve"}
                                        </button>
                                    )}

                                    <button
                                        onClick={() => handleDelete(app.id)}
                                        style={{ padding: '6px 10px', background: '#dc2626', border: 'none', borderRadius: '4px', color: 'white', cursor: 'pointer', }}
                                        title="Delete Application"
                                    >
                                        🗑️
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {apps.length === 0 && (
                            <tr><td colSpan="8" style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>No applications found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* MODAL */}
            {selectedApp && (
                <div style={{
                    position: 'fixed', inset: 0,
                    background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', zIndex: 1000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }} onClick={() => setSelectedApp(null)}>
                    <div
                        className="animate-slide-up glass-card-premium"
                        style={{ width: '600px', maxHeight: '90vh', overflowY: 'auto', padding: '30px', position: 'relative', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', boxShadow: 'var(--glass-shadow)' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setSelectedApp(null)}
                            style={{ position: 'absolute', top: '15px', right: '15px', background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: '1.5rem', cursor: 'pointer' }}
                        >
                            &times;
                        </button>

                        <h2 style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '10px', color: 'var(--text-main)', marginTop: 0 }}>Application Details</h2>

                        <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <div>
                                <label style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Candidate</label>
                                <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--text-main)' }}>{selectedApp.name} ({selectedApp.student_id})</div>
                            </div>

                            <div>
                                <label style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Applied For</label>
                                <div style={{ fontSize: '1.1rem', color: 'var(--primary-color)' }}>{selectedApp.post}</div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                <div><label style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>GPA</label><div style={{ color: 'var(--text-main)' }}>{selectedApp.gpa}</div></div>
                                <div><label style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Status</label><div style={{ color: 'var(--text-main)' }}>{selectedApp.status}</div></div>
                            </div>

                            <hr style={{ border: '0', borderTop: '1px solid var(--glass-border)' }} />

                            <div>
                                <label style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Manifesto / Vision</label>
                                <div style={{ background: 'var(--input-bg)', padding: '15px', borderRadius: '8px', lineHeight: '1.6', color: 'var(--text-main)', border: '1px solid var(--glass-border)' }}>
                                    {selectedApp.manifesto}
                                </div>
                            </div>

                            <div>
                                <label style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Why Me / Reason</label>
                                <div style={{ background: 'var(--input-bg)', padding: '15px', borderRadius: '8px', lineHeight: '1.6', color: 'var(--text-main)', border: '1px solid var(--glass-border)' }}>
                                    {selectedApp.reason}
                                </div>
                            </div>

                            {selectedApp.additional_details && Object.keys(selectedApp.additional_details).length > 0 && (
                                <div>
                                    <label style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Additional Details</label>
                                    <div style={{ background: 'var(--input-bg)', padding: '15px', borderRadius: '8px', fontSize: '0.95rem', color: 'var(--text-main)', border: '1px solid var(--glass-border)' }}>
                                        {Object.entries(selectedApp.additional_details).map(([key, val]) => (
                                            <div key={key} style={{ marginBottom: '8px' }}>
                                                <strong style={{ textTransform: 'capitalize' }}>{key.replace(/_/g, " ")}: </strong>
                                                <span>{Array.isArray(val) ? val.join(", ") : val}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                        </div>

                        <div style={{ marginTop: '30px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => handleDelete(selectedApp.id)}
                                style={{ padding: '10px 20px', background: '#ef4444', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer' }}
                            >
                                DELETE
                            </button>

                            {selectedApp.status === 'PENDING' && (
                                <>
                                    <button
                                        onClick={() => handleAction(selectedApp.id, "APPROVED")}
                                        className="btn-premium"
                                        style={{ padding: '10px 20px', width: 'auto' }}
                                    >
                                        Approve
                                    </button>
                                    <button
                                        onClick={() => handleAction(selectedApp.id, "REJECTED")}
                                        style={{ padding: '10px 20px', background: '#ef4444', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer' }}
                                    >
                                        Reject
                                    </button>
                                </>
                            )}
                            <button
                                onClick={() => setSelectedApp(null)}
                                style={{ padding: '10px 20px', background: 'transparent', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--text-main)', cursor: 'pointer' }}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageApplications;
