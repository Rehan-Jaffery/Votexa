import React, { useState, useEffect } from 'react';
import api from '../services/api';

const ManageElections = () => {
    const [elections, setElections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [createModal, setCreateModal] = useState(false);
    const [candidatesModal, setCandidatesModal] = useState(null); // ID of election
    const [candidates, setCandidates] = useState([]);
    const [selectedElection, setSelectedElection] = useState(null);

    // Create Form State
    const [type, setType] = useState("CR");
    const [course, setCourse] = useState("");
    const [semester, setSemester] = useState("");
    const [post, setPost] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    useEffect(() => {
        fetchElections();
    }, []);

    const fetchElections = async () => {
        try {
            const res = await api.get("/elections/");
            setElections(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await api.post("/elections/", {
                election_type: type,
                course: type === "CR" ? course : null,
                semester: type === "CR" ? semester : null,
                post: type === "COUNCIL" ? post : null,
                start_date: startDate,
                end_date: endDate
            });
            setCreateModal(false);
            fetchElections();
            alert("Election Created!");
        } catch (err) {
            alert(err.response?.data?.error || "Failed");
        }
    };

    const updateStatus = async (id, status) => {
        if (!window.confirm(`Change status to ${status}?`)) return;
        try {
            await api.put(`/elections/${id}/status`, { status });
            fetchElections();
        } catch (err) {
            alert("Failed to update status");
        }
    };

    const deleteElection = async (id) => {
        if (!window.confirm("Are you sure? This will delete the election AND all associated votes and candidates. This cannot be undone.")) return;
        try {
            await api.delete(`/elections/${id}`);
            fetchElections();
        } catch (err) {
            alert("Failed to delete election");
        }
    };

    const openCandidates = async (election) => {
        setCandidatesModal(election.id);
        setSelectedElection(election);
        try {
            const res = await api.get(`/elections/${election.id}/candidates`);
            setCandidates(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const removeCandidate = async (candId) => {
        if (!window.confirm("Remove this candidate? Application will be rejected.")) return;
        try {
            await api.delete(`/elections/${candidatesModal}/candidates/${candId}`);
            setCandidates(prev => prev.filter(c => c.candidate_id !== candId));
        } catch (err) {
            alert("Failed to remove");
        }
    };

    if (loading) return <div style={{ padding: 40 }}>Loading...</div>;

    return (
        <div className="vote-page-container animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1>Manage Elections</h1>
                <button
                    className="btn-premium"
                    onClick={() => setCreateModal(true)}
                    style={{ padding: '10px 20px' }}
                >
                    + Create Election
                </button>
            </div>

            <div style={{ marginTop: '30px', display: 'grid', gap: '20px' }}>
                {elections.map(e => (
                    <div key={e.id} className="glass-card-premium" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px' }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <h3 style={{ margin: 0, color: 'var(--primary-color)' }}>{e.title}</h3>
                                <small style={{ color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px' }}>ID: {e.id}</small>
                            </div>
                            <div style={{ display: 'flex', gap: '15px', marginTop: '5px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                <span>Type: {e.type}</span>
                                <span>Starts: {e.start_date.replace('T', ' ')}</span>
                            </div>
                            <div style={{ marginTop: '10px' }}>
                                <span style={{
                                    padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold',
                                    background: e.status === 'UPCOMING' ? '#3b82f6' : e.status === 'ONGOING' ? '#10b981' : '#6b7280',
                                    color: 'white'
                                }}>
                                    {e.status}
                                </span>
                            </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <button onClick={() => deleteElection(e.id)} style={{ padding: '8px', background: 'transparent', border: '1px solid #ef4444', color: '#ef4444', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}>
                                🗑️ Delete
                            </button>
                            <button onClick={() => openCandidates(e)} style={{ padding: '8px', background: 'var(--input-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: '6px', cursor: 'pointer' }}>
                                Manage Candidates
                            </button>

                            {e.status === 'UPCOMING' && (
                                <button onClick={() => updateStatus(e.id, "ONGOING")} style={{ padding: '8px', background: '#10b981', border: 'none', color: 'white', borderRadius: '6px', cursor: 'pointer' }}>
                                    Start Voting
                                </button>
                            )}
                            {e.status === 'ONGOING' && (
                                <button onClick={() => updateStatus(e.id, "COMPLETED")} style={{ padding: '8px', background: '#ef4444', border: 'none', color: 'white', borderRadius: '6px', cursor: 'pointer' }}>
                                    End Election
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* CREATE MODAL */}
            {createModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }} onClick={() => setCreateModal(false)}>
                    <div className="glass-card-premium" style={{ background: 'var(--glass-bg)', padding: '30px', borderRadius: '16px', width: '500px', maxWidth: '90%', border: '1px solid var(--glass-border)', boxShadow: 'var(--glass-shadow)' }} onClick={e => e.stopPropagation()}>
                        <h2 style={{ color: 'var(--text-main)', marginTop: 0 }}>Create New Election</h2>
                        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '20px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Election Type</label>
                                <select value={type} onChange={e => setType(e.target.value)} style={{ padding: '12px', borderRadius: '8px', background: 'var(--input-bg)', color: 'var(--text-main)', border: '1px solid var(--glass-border)', outline: 'none' }}>
                                    <option value="CR" style={{ background: 'var(--bg-gradient)', color: 'var(--text-main)' }}>Class Representative</option>
                                    <option value="COUNCIL" style={{ background: 'var(--bg-gradient)', color: 'var(--text-main)' }}>Student Council</option>
                                </select>
                            </div>

                            {type === "CR" && (
                                <div style={{ background: 'var(--input-bg)', padding: '15px', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                                        <input type="checkbox" id="limit" checked={!!course} onChange={(e) => {
                                            if (!e.target.checked) { setCourse(""); setSemester(""); }
                                            else { setCourse("MCA"); }
                                        }} style={{ accentColor: 'var(--primary-color)', width: '18px', height: '18px' }} />
                                        <label htmlFor="limit" style={{ color: 'var(--text-main)', fontWeight: '500', cursor: 'pointer' }}>Limit to Specific Course/Sem?</label>
                                    </div>

                                    {course !== "" && (
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Course</label>
                                                <select value={course} onChange={e => setCourse(e.target.value)} style={{ padding: '10px', borderRadius: '8px', background: 'var(--input-bg)', color: 'var(--text-main)', border: '1px solid var(--glass-border)' }}>
                                                    <option value="MCA" style={{ color: 'black' }}>MCA</option>
                                                    <option value="Msc Aiml" style={{ color: 'black' }}>Msc Aiml</option>
                                                    <option value="Msc Bioinformatics" style={{ color: 'black' }}>Msc Bioinformatics</option>
                                                    <option value="PGDCA" style={{ color: 'black' }}>PGDCA</option>
                                                    <option value="BSc" style={{ color: 'black' }}>BSc</option>
                                                </select>
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Semester</label>
                                                <input placeholder="e.g. 1" value={semester} onChange={e => setSemester(e.target.value)} style={{ padding: '10px', borderRadius: '8px', background: 'var(--input-bg)', color: 'var(--text-main)', border: '1px solid var(--glass-border)' }} required />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {type === "COUNCIL" && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Post</label>
                                    <select value={post} onChange={e => setPost(e.target.value)} style={{ padding: '12px', borderRadius: '8px', background: 'var(--input-bg)', color: 'var(--text-main)', border: '1px solid var(--glass-border)' }}>
                                        <option value="">Select Post</option>
                                        <option value="Vice President" style={{ color: 'black' }}>Vice President</option>
                                        <option value="Secretary" style={{ color: 'black' }}>Secretary</option>
                                        <option value="Joint Secretary" style={{ color: 'black' }}>Joint Secretary</option>
                                    </select>
                                </div>
                            )}

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                    <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Start Date</label>
                                    <input type="datetime-local" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ padding: '10px', borderRadius: '8px', background: 'var(--input-bg)', color: 'var(--text-main)', border: '1px solid var(--glass-border)' }} required />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                    <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>End Date</label>
                                    <input type="datetime-local" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ padding: '10px', borderRadius: '8px', background: 'var(--input-bg)', color: 'var(--text-main)', border: '1px solid var(--glass-border)' }} required />
                                </div>
                            </div>

                            <button type="submit" className="btn-premium" style={{ padding: '14px', marginTop: '10px', fontSize: '1rem' }}>Create & Open Applications</button>
                        </form>
                    </div>
                </div>
            )}

            {/* CANDIDATES MODAL */}
            {candidatesModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }} onClick={() => setCandidatesModal(null)}>
                    <div className="glass-card-premium" style={{ background: 'var(--glass-bg)', padding: '30px', borderRadius: '16px', width: '500px', maxWidth: '90%', maxHeight: '80vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <div>
                                <h2 style={{ color: 'var(--text-main)', margin: 0 }}>Manage Candidates</h2>
                                <p style={{ color: 'var(--primary-color)', margin: '5px 0 0 0', fontWeight: 'bold' }}>{selectedElection?.title} (#{selectedElection?.id})</p>
                            </div>
                            <button onClick={() => setCandidatesModal(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', fontSize: '1.5rem', height: 'fit-content' }}>&times;</button>
                        </div>

                        <div style={{ marginTop: '20px' }}>
                            {candidates.length === 0 ? <p style={{ color: 'var(--text-secondary)' }}>No candidates approved yet.</p> : (
                                <div>
                                    {Object.entries(candidates.reduce((acc, c) => {
                                        const key = c.course && c.semester ? `${c.course} - Sem ${c.semester}` : "Other Candidates";
                                        if (!acc[key]) acc[key] = [];
                                        acc[key].push(c);
                                        return acc;
                                    }, {})).map(([batch, groupCandidates]) => (
                                        <div key={batch} style={{ marginBottom: '20px' }}>
                                            <h3 style={{
                                                fontSize: '1rem',
                                                color: 'var(--primary-color)',
                                                margin: '0 0 10px 0',
                                                paddingBottom: '5px',
                                                borderBottom: '2px solid rgba(16, 185, 129, 0.2)'
                                            }}>
                                                {batch}
                                            </h3>
                                            <ul style={{ listStyle: 'none', padding: 0 }}>
                                                {groupCandidates.map(c => (
                                                    <li key={c.candidate_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', borderBottom: '1px solid var(--glass-border)' }}>
                                                        <span style={{ color: 'var(--text-main)' }}>{c.name} ({c.student_id})</span>
                                                        <button onClick={() => removeCandidate(c.candidate_id)} style={{ color: '#ef4444', background: 'transparent', border: 'none', cursor: 'pointer' }}>Remove</button>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageElections;
