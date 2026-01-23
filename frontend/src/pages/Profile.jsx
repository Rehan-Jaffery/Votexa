import React, { useEffect, useState } from 'react';
import api from '../services/api';
import './VotePage.css'; // Reusing card styles

const Profile = () => {
    const [user, setUser] = useState(null);
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    // Password Change State
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [passLoading, setPassLoading] = useState(false);

    const [msg, setMsg] = useState(null);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const [res, historyRes] = await Promise.all([
                api.get("/auth/me"),
                api.get("/auth/me/votes")
            ]);
            setUser({ ...res.data, votes: historyRes.data });
            setEmail(res.data.email || "");
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateEmail = async () => {
        setUpdating(true);
        setMsg(null);
        try {
            await api.put("/auth/me", { email });
            setMsg({ type: 'success', text: "Email updated successfully!" });
        } catch (err) {
            setMsg({ type: 'error', text: err.response?.data?.error || "Failed to update email" });
        } finally {
            setUpdating(false);
        }
    };

    const handleChangePassword = async () => {
        if (newPassword !== confirmPassword) {
            setMsg({ type: 'error', text: "Passwords do not match" });
            return;
        }
        if (newPassword.length < 6) {
            setMsg({ type: 'error', text: "Password must be at least 6 characters" });
            return;
        }

        setPassLoading(true);
        setMsg(null);
        try {
            await api.post("/auth/change-password", { new_password: newPassword });
            setMsg({ type: 'success', text: "Password changed successfully!" });
            setNewPassword("");
            setConfirmPassword("");
        } catch (err) {
            setMsg({ type: 'error', text: err.response?.data?.error || "Failed to change password" });
        } finally {
            setPassLoading(false);
        }
    };

    if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading Profile...</div>;

    return (
        <div className="vote-page-container">
            <h1>My Profile</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Manage your account details and security settings.</p>

            <div className="profile-grid" style={{
                display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px', marginTop: '30px'
            }}>
                {/* USER INFO CARD */}
                <div className="election-card">
                    <h3>User Details</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
                        <div className="detail-row">
                            <span style={{ color: 'var(--text-secondary)' }}>Name</span>
                            <strong>{user?.name || "N/A"}</strong>
                        </div>
                        <div className="detail-row">
                            <span style={{ color: 'var(--text-secondary)' }}>University ID</span>
                            <strong>{user?.university_id}</strong>
                        </div>
                        <div className="detail-row">
                            <span style={{ color: 'var(--text-secondary)' }}>Role</span>
                            <span style={{ textTransform: 'capitalize', background: 'var(--primary-color)', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>{user?.role}</span>
                        </div>
                        <div className="detail-row">
                            <span style={{ color: 'var(--text-secondary)' }}>Course</span>
                            <strong>{user?.course || "N/A"}</strong>
                        </div>
                        <div className="detail-row">
                            <span style={{ color: 'var(--text-secondary)' }}>Batch</span>
                            <strong>{user?.batch || "N/A"}</strong>
                        </div>

                        <div style={{ marginTop: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>Email Address</label>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.05)', color: 'inherit' }}
                                />
                                <button className="login-button" style={{ width: 'auto', marginTop: 0, padding: '0 20px' }} onClick={handleUpdateEmail} disabled={updating}>
                                    {updating ? "..." : "Save"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* SECURITY CARD */}
                <div className="election-card">
                    <h3>Security</h3>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Change your password</p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>New Password</label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.05)', color: 'inherit' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>Confirm Password</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.05)', color: 'inherit' }}
                            />
                        </div>

                        <button className="login-button" style={{ marginTop: '10px' }} onClick={handleChangePassword} disabled={passLoading}>
                            {passLoading ? "Updating..." : "Change Password"}
                        </button>
                    </div>
                </div>

                {/* VOTING HISTORY CARD */}
                <div className="election-card">
                    <h3>Voting History</h3>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>elections you have participated in</p>

                    <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {user?.votes && user.votes.length > 0 ? (
                            user.votes.map((v, i) => (
                                <div key={i} style={{
                                    padding: '10px',
                                    background: 'rgba(255,255,255,0.05)',
                                    borderRadius: '8px',
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                }}>
                                    <div>
                                        <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{v.election}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{v.vote_time}</div>
                                    </div>
                                    <span style={{
                                        fontSize: '0.75rem',
                                        padding: '2px 8px', borderRadius: '4px',
                                        background: v.status === 'COMPLETED' ? '#10b981' : '#f59e0b',
                                        color: 'black'
                                    }}>
                                        {v.status}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>
                                No votes cast yet.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {msg && (
                <div style={{
                    position: 'fixed', bottom: '20px', right: '20px',
                    background: msg.type === 'success' ? '#10b981' : '#ef4444',
                    color: 'white', padding: '15px 25px', borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)', animation: 'slideIn 0.3s ease'
                }}>
                    {msg.text}
                </div>
            )}
        </div>
    );
};

export default Profile;
