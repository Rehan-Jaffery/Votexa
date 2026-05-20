import React, { useEffect, useState } from 'react';
import { getActiveElections, getCandidates, castVote } from '../services/electionService';
import { toast } from 'react-hot-toast';
import './VotePage.css';

const VotePage = () => {
    const [elections, setElections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Modal state
    const [selectedElection, setSelectedElection] = useState(null);
    const [candidates, setCandidates] = useState([]);
    const [selectedCandidate, setSelectedCandidate] = useState(null);
    const [voting, setVoting] = useState(false);

    useEffect(() => {
        fetchElections();
    }, []);

    const fetchElections = async () => {
        try {
            const data = await getActiveElections();
            setElections(data);
        } catch (err) {
            console.error(err);
            setError("Failed to load elections.");
            toast.error("Failed to load elections");
        } finally {
            setLoading(false);
        }
    };

    const handleElectionClick = async (election) => {
        setSelectedElection(election);
        setSelectedCandidate(null);
        setCandidates([]);
        try {
            const data = await getCandidates(election.election_id);
            setCandidates(data);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load candidates");
        }
    };

    const handleVote = async () => {
        if (!selectedCandidate) return;
        setVoting(true);
        try {
            await castVote(selectedElection.election_id, selectedCandidate.candidate_id);
            toast.success("Vote Cast Successfully! 🎉");
            setSelectedElection(null); // Close modal
            // Optionally refresh results or disable voting for this election? 
            // For now, simple success.
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.error || "Failed to cast vote.");
        } finally {
            setVoting(false);
        }
    };


    if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading Elections...</div>;
    if (error) return <div className="error-text">{error}</div>;

    return (
        <div className="vote-page-container">
            <h1>Active Elections</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Select an election to view candidates and vote.</p>

            {elections.length === 0 ? (
                <div style={{ marginTop: '40px', textAlign: 'center', opacity: 0.7 }}>
                    <h3>No Active Elections Found</h3>
                    <p>There are no elections currently ongoing.</p>
                </div>
            ) : (
                <div className="elections-grid">
                    {elections.map(election => (
                        <div key={election.election_id} className="election-card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                <span style={{
                                    background: election.status === 'ONGOING' ? '#10b981' : '#f59e0b',
                                    color: 'white',
                                    padding: '4px 8px',
                                    borderRadius: '6px',
                                    fontSize: '0.8rem',
                                    fontWeight: 'bold'
                                }}>
                                    {election.status}
                                </span>
                                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                    Ends: {new Date(election.end_date).toLocaleDateString()}
                                </span>
                            </div>

                            <h3 style={{ margin: '16px 0 8px 0' }}>{election.title}</h3>
                            <p style={{ marginBottom: '4px', color: 'var(--text-secondary)' }}>Course: {election.course}</p>
                            <p style={{ color: 'var(--text-secondary)' }}>Batch: {election.batch}</p>

                            <button
                                className="login-button"
                                style={{ width: '100%', marginTop: '20px' }}
                                onClick={() => handleElectionClick(election)}
                            >
                                View Candidates
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* CANDIDATE SELECTION MODAL */}
            {selectedElection && (
                <div className="candidates-modal-overlay" onClick={() => setSelectedElection(null)}>
                    <div className="candidates-modal" onClick={e => e.stopPropagation()}>
                        <h2>{selectedElection.title}</h2>
                        <p>Select a candidate to cast your vote.</p>

                        <div className="candidates-list">
                            {candidates.length === 0 ? (
                                <p>No candidates found for this election.</p>
                            ) : (
                                candidates.map(candidate => (
                                    <div
                                        key={candidate.candidate_id}
                                        className={`candidate-item ${selectedCandidate?.candidate_id === candidate.candidate_id ? 'selected' : ''}`}
                                        onClick={() => setSelectedCandidate(candidate)}
                                    >
                                        <div>
                                            <h4 style={{ margin: 0, fontSize: '1.1rem' }}>{candidate.name}</h4>
                                            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                                {candidate.course} - {candidate.batch}
                                            </span>
                                            {selectedCandidate?.candidate_id === candidate.candidate_id && candidate.manifesto && (
                                                <div style={{ marginTop: '12px', padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', fontSize: '0.9rem', color: 'var(--text-main)', borderLeft: '3px solid var(--primary-color)' }}>
                                                    <strong style={{ display: 'block', marginBottom: '4px', color: 'var(--primary-color)' }}>Manifesto:</strong>
                                                    {candidate.manifesto}
                                                </div>
                                            )}
                                        </div>
                                        {selectedCandidate?.candidate_id === candidate.candidate_id && (
                                            <span style={{ color: 'var(--primary-color)', fontSize: '1.5rem' }}>✓</span>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="modal-actions">
                            <button
                                onClick={() => setSelectedElection(null)}
                                style={{
                                    background: 'transparent',
                                    border: '1px solid var(--border-color)',
                                    color: 'var(--text-main)',
                                    padding: '12px 24px',
                                    borderRadius: '12px'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                className="login-button"
                                style={{ marginTop: 0, opacity: !selectedCandidate ? 0.5 : 1 }}
                                disabled={!selectedCandidate || voting}
                                onClick={handleVote}
                            >
                                {voting ? "Casting Vote..." : "Confirm Vote"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VotePage;
