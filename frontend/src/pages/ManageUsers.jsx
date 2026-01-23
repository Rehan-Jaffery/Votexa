import React, { useState } from 'react';
import api from '../services/api';
import './VotePage.css'; // Reusing card styles

const ManageUsers = () => {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [log, setLog] = useState(null);

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
        setLog(null);
    };

    const handleUpload = async () => {
        if (!file) return;

        const formData = new FormData();
        formData.append("file", file);

        setUploading(true);
        try {
            const response = await api.post("/users/upload", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });
            setLog({ type: 'success', message: response.data.message, errors: response.data.errors });
        } catch (err) {
            console.error("Upload Error:", err);
            setLog({ type: 'error', message: err.response?.data?.error || err.message || "Upload failed" });
        } finally {
            setUploading(false);
        }
    };

    const downloadTemplate = () => {
        // Create a dummy CSV for template
        const csvContent = "data:text/csv;charset=utf-8,university_id,name,course,batch,semester,email,password,role\nSTUDENT001,John Doe,CS,2024,1,john@votexa.com,,student\nCR001,Jane Smith,CS,2024,1,jane@votexa.com,Secret123,cr";
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "student_import_template.csv");
        document.body.appendChild(link);
        link.click();
    }

    return (
        <div className="vote-page-container">
            <h1>Manage Users</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Upload Excel sheet to register students in bulk.</p>

            <div className="election-card" style={{ marginTop: '30px', maxWidth: '600px' }}>
                <h3>Bulk Import</h3>
                <p>Upload .xlsx or .csv file with columns: <b>university_id, name, course, batch, semester, email, password (optional)</b></p>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    If <b>password</b> is empty, a random one will be generated and emailed.<br />
                    <b>Semester</b> defaults to "1" if left blank.
                </p>

                <div style={{ margin: '20px 0', border: '2px dashed var(--border-color)', padding: '20px', borderRadius: '12px', textAlign: 'center' }}>
                    <input type="file" onChange={handleFileChange} accept=".xlsx, .xls, .csv" />
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                        className="login-button"
                        disabled={!file || uploading}
                        onClick={handleUpload}
                    >
                        {uploading ? "Uploading..." : "Upload Students"}
                    </button>
                    <button
                        onClick={downloadTemplate}
                        style={{
                            background: 'transparent',
                            color: 'var(--primary-color)',
                            border: '1px solid var(--primary-color)',
                            borderRadius: '12px',
                            padding: '12px',
                            cursor: 'pointer'
                        }}
                    >
                        Download Template
                    </button>
                </div>

                {log && (
                    <div style={{ marginTop: '20px', padding: '15px', borderRadius: '8px', background: log.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 77, 77, 0.1)', color: log.type === 'success' ? '#10b981' : '#ff4d4d' }}>
                        <strong>{log.message}</strong>
                        {log.errors && log.errors.length > 0 && (
                            <ul style={{ marginTop: '10px', fontSize: '0.9rem' }}>
                                {log.errors.map((err, i) => <li key={i}>{err}</li>)}
                            </ul>
                        )}
                    </div>
                )}
            </div>

            {/* OFFICE BEARERS IMPORT CARD */}
            <div className="election-card" style={{ marginTop: '30px', maxWidth: '600px' }}>
                <h3>Import Office Bearers</h3>
                <p>Upload list for President, Vice President, Secretary, etc.</p>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    Ensure the <b>role</b> column contains: <i>president</i>, <i>vice_president</i>, <i>secretary</i>, <i>joint_secretary</i>, or <i>cr</i>.
                </p>

                <div style={{ margin: '20px 0', border: '2px dashed var(--primary-color)', padding: '20px', borderRadius: '12px', textAlign: 'center', background: 'rgba(99, 102, 241, 0.05)' }}>
                    <input type="file" onChange={handleFileChange} accept=".xlsx, .xls, .csv" />
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                        className="login-button"
                        disabled={!file || uploading}
                        onClick={handleUpload}
                    >
                        {uploading ? "Uploading..." : "Upload Bearers"}
                    </button>
                    <button
                        onClick={downloadTemplate}
                        style={{
                            background: 'transparent',
                            color: 'var(--primary-color)',
                            border: '1px solid var(--primary-color)',
                            borderRadius: '12px',
                            padding: '12px',
                            cursor: 'pointer'
                        }}
                    >
                        Download Template
                    </button>
                </div>
                {log && (
                    <div style={{ marginTop: '20px', padding: '15px', borderRadius: '8px', background: log.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 77, 77, 0.1)', color: log.type === 'success' ? '#10b981' : '#ff4d4d' }}>
                        <strong>{log.message}</strong>
                        {log.errors && log.errors.length > 0 && (
                            <ul style={{ marginTop: '10px', fontSize: '0.9rem' }}>
                                {log.errors.map((err, i) => <li key={i}>{err}</li>)}
                            </ul>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ManageUsers;
