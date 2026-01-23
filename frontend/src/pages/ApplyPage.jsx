import React, { useState, useEffect } from "react";
import api from "../services/api";
import "./VotePage.css"; // Reuse styles

const ApplyPage = () => {
    const [role, setRole] = useState(localStorage.getItem("role") || "student");
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState(null);

    const [formData, setFormData] = useState({
        post: role === "student" ? "Class Representative" : "",
        manifesto: "",
        reason: "",
        gpa: "",
        achievements: ""
    });

    // Options based on Role
    const options = role === "student"
        ? ["Class Representative"]
        : ["Vice President", "Secretary", "Joint Secretary"];

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMsg(null);

        // Validation
        if (!formData.post) {
            setMsg({ type: "error", text: "Please select a post" });
            setLoading(false);
            return;
        }

        try {
            await api.post("/applications/apply", formData);
            setMsg({ type: "success", text: "Application submitted successfully! Admin will review it shortly." });
            // Reset form
            setFormData({
                post: role === "student" ? "Class Representative" : "",
                manifesto: "",
                reason: "",
                gpa: "",
                achievements: ""
            });
        } catch (err) {
            setMsg({
                type: "error",
                text: err.response?.data?.error || "Failed to submit application"
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="vote-page-container">
            <h1>Apply for Position</h1>
            <p style={{ color: 'var(--text-secondary)' }}>
                Submit your candidacy for the upcoming elections.
            </p>

            <form onSubmit={handleSubmit} style={{ maxWidth: '600px', margin: '30px auto', background: 'rgba(255,255,255,0.05)', padding: '30px', borderRadius: '12px' }}>

                <div className="form-group" style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px' }}>Post Applying For</label>
                    <select
                        name="post"
                        value={formData.post}
                        onChange={handleChange}
                        style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid var(--border-color)' }}
                    >
                        <option value="" disabled>Select Position</option>
                        {options.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                        ))}
                    </select>
                </div>

                <div className="form-group" style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px' }}>Reason for Applying</label>
                    <textarea
                        name="reason"
                        rows="3"
                        value={formData.reason}
                        onChange={handleChange}
                        placeholder="Why do you want this role?"
                        required
                        style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid var(--border-color)' }}
                    />
                </div>

                <div className="form-group" style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px' }}>Manifesto / Aim</label>
                    <textarea
                        name="manifesto"
                        rows="4"
                        value={formData.manifesto}
                        onChange={handleChange}
                        placeholder="What will you do if elected?"
                        required
                        style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid var(--border-color)' }}
                    />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div className="form-group" style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '8px' }}>Last GPA</label>
                        <input
                            type="text"
                            name="gpa"
                            value={formData.gpa}
                            onChange={handleChange}
                            placeholder="e.g. 8.5 or NA"
                            required
                            style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid var(--border-color)' }}
                        />
                        <small style={{ color: 'var(--text-secondary)' }}>Enter "NA" if 1st Year</small>
                    </div>
                </div>

                <div className="form-group" style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px' }}>Achievements (Optional)</label>
                    <textarea
                        name="achievements"
                        rows="2"
                        value={formData.achievements}
                        onChange={handleChange}
                        placeholder="Any relevant past experience..."
                        style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid var(--border-color)' }}
                    />
                </div>

                <button
                    type="submit"
                    className="login-button"
                    style={{ marginTop: '10px' }}
                    disabled={loading}
                >
                    {loading ? "Submitting..." : "Submit Application"}
                </button>

                {msg && (
                    <div style={{
                        marginTop: '20px',
                        padding: '15px',
                        borderRadius: '8px',
                        background: msg.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                        color: msg.type === 'success' ? '#10b981' : '#ef4444',
                        textAlign: 'center'
                    }}>
                        {msg.text}
                    </div>
                )}

            </form>
        </div>
    );
};

export default ApplyPage;
