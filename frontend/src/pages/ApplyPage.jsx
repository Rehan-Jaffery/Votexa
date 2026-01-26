import React, { useState, useEffect } from 'react';
import api from '../services/api';
import './VotePage.css'; // Reuse card styles

const ApplyPage = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState(null);

    // Form inputs
    const [post, setPost] = useState("");
    const [manifesto, setManifesto] = useState("");
    const [reason, setReason] = useState("");
    const [gpa, setGpa] = useState("");
    const [achievements, setAchievements] = useState("");

    // Additional Details (Dynamic)
    const [agenda, setAgenda] = useState("");
    const [vision, setVision] = useState("");
    const [leadership, setLeadership] = useState("");
    const [publicSpeaking, setPublicSpeaking] = useState("");
    const [experienceDesc, setExperienceDesc] = useState("");

    const [existingApp, setExistingApp] = useState(null);

    const [canApply, setCanApply] = useState(false);
    const [eligibleElections, setEligibleElections] = useState([]);

    useEffect(() => {
        const init = async () => {
            // Load User
            try {
                const stored = localStorage.getItem("user");
                if (!stored || stored === "undefined") {
                    localStorage.clear();
                    window.location.href = "/login";
                    return;
                }
                const u = JSON.parse(stored);
                setUser(u);
                if (u.role === "student") setPost("Class Representative");
                else if (u.role === "cr") setPost("Vice President");
                else setPost("Vice President");

                // Check Existing App
                try {
                    const statusRes = await api.get("/applications/me");
                    if (statusRes.data) {
                        setExistingApp(statusRes.data);
                        return; // Stop here if exists
                    }
                } catch (e) { }

                // Check Eligibility
                try {
                    const eligRes = await api.get("/elections/check-eligibility");
                    if (eligRes.data.can_apply) {
                        setCanApply(true);
                        setEligibleElections(eligRes.data.elections);
                    } else {
                        setCanApply(false);
                    }
                } catch (e) { }

            } catch (e) {
                console.error("User Parse Error", e);
                localStorage.clear();
                window.location.href = "/login";
            }
        };
        init();
    }, []);

    const checkApplicationStatus = async () => {
        try {
            const res = await api.get("/applications/me");
            if (res.data) {
                setExistingApp(res.data);
            }
        } catch (err) {
            console.error("Failed to check app status", err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMsg(null);

        const payload = {
            post,
            manifesto,
            reason,
            gpa,
            achievements,
            additional_details: {}
        };

        if (user.role === "student") {
            payload.additional_details = {
                experience_desc: experienceDesc
            };
        } else if (user.role === "cr") {
            payload.manifesto = vision;
            payload.additional_details = {
                agenda_points: agenda.split('\n'),
                leadership_record: leadership,
                public_speaking_link: publicSpeaking
            };
        }

        try {
            const res = await api.post("/applications/apply", payload);
            setMsg({ type: 'success', text: "Application submitted successfully! Admin will review it shortly." });
            checkApplicationStatus(); // Refresh status
        } catch (err) {
            setMsg({ type: 'error', text: err.response?.data?.error || "Submission failed" });
        } finally {
            setLoading(false);
        }
    };

    if (!user) return <div className="animate-fade-in" style={{ padding: '40px' }}>Loading...</div>;

    // --- ALREADY APPLIED VIEW ---
    if (existingApp) {
        return (
            <div className="animate-fade-in" style={{ padding: '40px', maxWidth: '800px' }}>
                <h1 className="animate-slide-up">Application Status</h1>

                <div className="glass-card-premium animate-slide-up animate-delay-100" style={{ marginTop: '30px', padding: '40px', textAlign: 'center' }}>
                    <div style={{ fontSize: '4rem', marginBottom: '20px' }}>
                        {existingApp.status === 'APPROVED' ? '🎉' : existingApp.status === 'REJECTED' ? '❌' : '⏳'}
                    </div>

                    <h2 style={{ marginBottom: '10px', color: existingApp.status === 'APPROVED' ? '#10b981' : existingApp.status === 'REJECTED' ? '#ef4444' : '#f59e0b' }}>
                        {existingApp.status === 'APPROVED' ? 'Application Approved!' : existingApp.status === 'REJECTED' ? 'Application Rejected' : 'Under Review'}
                    </h2>

                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginBottom: '30px' }}>
                        You have applied for the position of <strong style={{ color: 'var(--primary-color)' }}>{existingApp.post}</strong>.
                    </p>

                    <div style={{ background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '12px', textAlign: 'left', display: 'inline-block', minWidth: '300px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Application ID:</span>
                            <span style={{ fontWeight: 'bold' }}>#{existingApp.id}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Submitted On:</span>
                            <span>{existingApp.created_at}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Status:</span>
                            <span style={{
                                fontWeight: 'bold',
                                color: existingApp.status === 'APPROVED' ? '#10b981' : existingApp.status === 'REJECTED' ? '#ef4444' : '#f59e0b'
                            }}>{existingApp.status}</span>
                        </div>
                    </div>

                    {existingApp.status === 'APPROVED' && (
                        <div style={{ marginTop: '30px' }}>
                            <p>Good luck with the election! Make sure to campaign responsibly.</p>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // --- NO UPCOMING ELECTIONS VIEW ---
    if (!canApply) {
        return (
            <div className="animate-fade-in" style={{ padding: '40px', maxWidth: '800px', textAlign: 'center' }}>
                <div className="glass-card-premium" style={{ padding: '60px' }}>
                    <div style={{ fontSize: '4rem', marginBottom: '20px' }}>📭</div>
                    <h2>No Upcoming Elections</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginTop: '10px' }}>
                        There are no active application windows open for you at this moment.
                    </p>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        Please wait for the Admin to Announce an Election.
                    </p>
                </div>
            </div>
        );
    }

    const isCR = user.role === "cr" || ["president", "vice_president"].includes(user.role);

    return (
        <div className="animate-fade-in" style={{ paddingBottom: '50px' }}>
            <h1 className="animate-slide-up">Candidate Application</h1>
            <p className="animate-slide-up animate-delay-100" style={{ color: 'var(--text-secondary)', marginBottom: '30px' }}>
                {isCR ? "Apply for University Council Positions" : "Apply to become Class Representative"}
            </p>

            <div className="glass-card-premium animate-slide-up animate-delay-200" style={{ maxWidth: '800px', padding: '40px' }}>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                    {/* POST SELECTION */}
                    <div className="form-group">
                        <label>Applying For</label>
                        {user.role === "student" ? (
                            <div>
                                <input type="text" value={eligibleElections.length > 0 ? eligibleElections[0].title : "Class Representative"} disabled className="input-premium disabled" style={{ width: '100%' }} />
                                {eligibleElections.length > 0 && <small style={{ color: 'var(--primary-color)' }}>Matched Election: {eligibleElections[0].title} (ID: {eligibleElections[0].id})</small>}
                            </div>
                        ) : (
                            <select
                                value={post}
                                onChange={(e) => setPost(e.target.value)}
                                className="input-premium"
                                style={{ background: 'var(--input-bg)', color: 'var(--text-main)' }}
                            >
                                <option value="Vice President" style={{ background: '#222', color: 'white' }}>Vice President</option>
                                <option value="Secretary" style={{ background: '#222', color: 'white' }}>Secretary</option>
                                <option value="Joint Secretary" style={{ background: '#222', color: 'white' }}>Joint Secretary</option>
                            </select>
                        )}
                    </div>

                    {/* ACADEMICS (Everyone) */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div className="form-group">
                            <label>Current GPA / %</label>
                            <input
                                type="text"
                                value={gpa}
                                onChange={(e) => setGpa(e.target.value)}
                                placeholder="e.g. 8.5"
                                className="input-premium"
                                required
                            />
                        </div>
                    </div>

                    <hr style={{ border: '0', borderTop: '1px solid var(--glass-border)', margin: '10px 0' }} />

                    {/* ROLE SPECIFIC FIELDS */}

                    {user.role === "student" ? (
                        /* STUDENT FORM */
                        <>
                            <div className="form-group">
                                <label>Manifesto (Your Vision)</label>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                                    What will you do for your class? (Max 100 words)
                                </p>
                                <textarea
                                    value={manifesto}
                                    onChange={(e) => setManifesto(e.target.value)}
                                    rows="4"
                                    className="input-premium"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Why should we choose you?</label>
                                <textarea
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    rows="3"
                                    className="input-premium"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Previous Experience (Optional)</label>
                                <textarea
                                    value={experienceDesc}
                                    onChange={(e) => setExperienceDesc(e.target.value)}
                                    placeholder="e.g. School Captain, Event monitor..."
                                    rows="2"
                                    className="input-premium"
                                />
                            </div>
                        </>
                    ) : (
                        /* CR / COUNCIL FORM */
                        <>
                            <div className="form-group">
                                <label>University Current Vision</label>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                                    Detailed plan for the university student body.
                                </p>
                                <textarea
                                    value={vision}
                                    onChange={(e) => setVision(e.target.value)}
                                    rows="5"
                                    className="input-premium"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Key Agenda Points (Promises)</label>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                                    List 3-5 specific goals, one per line.
                                </p>
                                <textarea
                                    value={agenda}
                                    onChange={(e) => setAgenda(e.target.value)}
                                    placeholder="- Improve Canteen Hygiene&#10;- Annual Tech Fest&#10;- Better Sports Equipment"
                                    rows="5"
                                    className="input-premium"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Leadership Record</label>
                                <textarea
                                    value={leadership}
                                    onChange={(e) => setLeadership(e.target.value)}
                                    placeholder="Describe your past tenure as CR..."
                                    rows="3"
                                    className="input-premium"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Public Speaking / Intro Video (Optional)</label>
                                <input
                                    type="text"
                                    value={publicSpeaking}
                                    onChange={(e) => setPublicSpeaking(e.target.value)}
                                    placeholder="Google Drive / YouTube Link"
                                    className="input-premium"
                                />
                            </div>
                        </>
                    )}

                    {/* SUBMIT */}
                    <button
                        type="submit"
                        className="btn-premium"
                        disabled={loading}
                        style={{ marginTop: '20px', padding: '15px', fontSize: '1.1rem', fontWeight: 'bold', color: 'white' }}
                    >
                        {loading ? "Submitting..." : "Submit Application"}
                    </button>

                    {msg && (
                        <div style={{
                            padding: '15px',
                            borderRadius: '12px',
                            background: msg.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                            color: msg.type === 'success' ? '#10b981' : '#ef4444',
                            border: `1px solid ${msg.type === 'success' ? '#10b981' : '#ef4444'}`
                        }}>
                            {msg.text}
                        </div>
                    )}

                </form>
            </div>
            <style>{`
                .form-group { display: flex; flexDirection: column; gap: 8px; }
                .form-group label { font-weight: 600; font-size: 0.95rem; color: var(--text-secondary); }
                .input-premium {
                    background: rgba(0,0,0,0.2);
                    border: 1px solid var(--glass-border);
                    padding: 12px;
                    border-radius: 12px;
                    color: var(--text-main);
                    font-family: inherit;
                    transition: all 0.2s;
                    resize: vertical;
                }
                .input-premium:focus {
                    outline: none;
                    border-color: var(--primary-color);
                    background: rgba(0,0,0,0.4);
                }
                .input-premium.disabled {
                    opacity: 0.7;
                    cursor: not-allowed;
                }
                [data-theme="light"] .input-premium {
                    background: rgba(255,255,255,0.8);
                    border: 1px solid #ddd;
                    color: #333;
                }
            `}</style>
        </div>
    );
};

export default ApplyPage;
