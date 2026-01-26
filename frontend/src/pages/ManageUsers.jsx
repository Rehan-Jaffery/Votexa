import React, { useState } from 'react';
import api from '../services/api';
import './VotePage.css'; // Reusing card styles

const ManageUsers = () => {
    const [activeTab, setActiveTab] = useState("list"); // 'list' or 'upload'

    // --- UPLOAD STATE ---
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [log, setLog] = useState(null);

    // --- LIST STATE ---
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [loadingList, setLoadingList] = useState(false);
    const [semesterFilter, setSemesterFilter] = useState("All");
    const [searchQuery, setSearchQuery] = useState("");

    // Fetch Users on Mount
    React.useEffect(() => {
        if (activeTab === "list") fetchUsers();
    }, [activeTab]);

    React.useEffect(() => {
        filterUsers();
    }, [semesterFilter, searchQuery, users]);

    const fetchUsers = async () => {
        setLoadingList(true);
        try {
            const res = await api.get("/users/");
            setUsers(res.data);
            setFilteredUsers(res.data);
        } catch (err) {
            console.error("Failed to fetch users", err);
        } finally {
            setLoadingList(false);
        }
    };

    const filterUsers = () => {
        let result = users;

        // Semester Filter
        if (semesterFilter !== "All") {
            result = result.filter(u => u.semester?.toString() === semesterFilter);
        }

        // Search Filter
        if (searchQuery) {
            const lowerQ = searchQuery.toLowerCase();
            result = result.filter(u =>
                u.university_id.toLowerCase().includes(lowerQ) ||
                u.name.toLowerCase().includes(lowerQ)
            );
        }

        setFilteredUsers(result);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this user? This cannot be undone.")) return;

        try {
            await api.delete(`/users/${id}`);
            // Remove from local state immediately
            setUsers(prev => prev.filter(u => u.student_id !== id));
            alert("User deleted successfully.");
        } catch (err) {
            alert(err.response?.data?.error || "Failed to delete user.");
        }
    };

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
            if (activeTab === 'list') fetchUsers(); // Refresh list if needed
        } catch (err) {
            console.error("Upload Error:", err);
            setLog({ type: 'error', message: err.response?.data?.error || err.message || "Upload failed" });
        } finally {
            setUploading(false);
        }
    };

    const downloadTemplate = () => {
        const csvContent = "data:text/csv;charset=utf-8,university_id,name,course,batch,semester,email,password,role\nSTUDENT001,John Doe,CS,2024,1,john@votexa.com,,student\nCR001,Jane Smith,CS,2024,1,jane@votexa.com,Secret123,cr";
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "student_import_template.csv");
        document.body.appendChild(link);
        link.click();
    }

    return (
        <div className="vote-page-container animate-fade-in">
            <h1 className="animate-slide-up">Manage Users</h1>

            {/* TABS */}
            <div style={{ display: 'flex', gap: '20px', margin: '20px 0', borderBottom: '1px solid var(--glass-border)' }}>
                <button
                    onClick={() => setActiveTab("list")}
                    style={{
                        padding: '10px 20px',
                        background: 'transparent',
                        border: 'none',
                        borderBottom: activeTab === "list" ? '2px solid var(--primary-color)' : 'none',
                        color: activeTab === "list" ? 'var(--primary-color)' : 'var(--text-secondary)',
                        fontWeight: 'bold',
                        fontSize: '1rem'
                    }}
                >
                    View Student List
                </button>
                <button
                    onClick={() => setActiveTab("upload")}
                    style={{
                        padding: '10px 20px',
                        background: 'transparent',
                        border: 'none',
                        borderBottom: activeTab === "upload" ? '2px solid var(--primary-color)' : 'none',
                        color: activeTab === "upload" ? 'var(--primary-color)' : 'var(--text-secondary)',
                        fontWeight: 'bold',
                        fontSize: '1rem'
                    }}
                >
                    Add / Import Users
                </button>
            </div>

            {/* TAB CONTENT: LIST */}
            {activeTab === "list" && (
                <div className="animate-slide-up">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '20px' }}>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                            <h3 style={{ margin: 0 }}>Registered Students ({filteredUsers.length})</h3>

                            <div style={{ display: 'flex', gap: '10px' }}>
                                {/* SEARCH INPUT */}
                                <input
                                    type="text"
                                    placeholder="Search by ID or Name..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="input-premium"
                                    style={{ width: '250px' }}
                                />

                                {/* SEMESTER FILTER */}
                                <select
                                    value={semesterFilter}
                                    onChange={(e) => setSemesterFilter(e.target.value)}
                                    className="input-premium"
                                    style={{ width: '150px', background: 'var(--input-bg)', color: 'var(--text-main)' }}
                                >
                                    <option value="All" style={{ background: '#222', color: 'white' }}>All Semesters</option>
                                    {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                                        <option key={s} value={s.toString()} style={{ background: '#222', color: 'white' }}>
                                            Semester {s}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
                            <thead>
                                <tr style={{ background: 'rgba(255,255,255,0.05)', textAlign: 'left' }}>
                                    <th style={{ padding: '15px' }}>ID</th>
                                    <th style={{ padding: '15px' }}>Name</th>
                                    <th style={{ padding: '15px' }}>Role</th>
                                    <th style={{ padding: '15px' }}>Course</th>
                                    <th style={{ padding: '15px' }}>Batch</th>
                                    <th style={{ padding: '15px' }}>Sem</th>
                                    <th style={{ padding: '15px' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loadingList ? (
                                    <tr><td colSpan="7" style={{ padding: '20px', textAlign: 'center' }}>Loading...</td></tr>
                                ) : filteredUsers.length === 0 ? (
                                    <tr><td colSpan="7" style={{ padding: '20px', textAlign: 'center' }}>No students found.</td></tr>
                                ) : (
                                    filteredUsers.map(user => (
                                        <tr key={user.student_id} style={{ borderTop: '1px solid var(--glass-border)' }}>
                                            <td style={{ padding: '15px', fontWeight: 'bold' }}>{user.university_id}</td>
                                            <td style={{ padding: '15px' }}>{user.name}</td>
                                            <td style={{ padding: '15px' }}>
                                                <span style={{
                                                    padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem',
                                                    background: user.role === 'admin' ? '#ef4444' : user.role === 'student' ? '#3b82f6' : '#f59e0b',
                                                    color: 'white', textTransform: 'uppercase'
                                                }}>
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td style={{ padding: '15px' }}>{user.course}</td>
                                            <td style={{ padding: '15px' }}>{user.batch}</td>
                                            <td style={{ padding: '15px' }}>{user.semester}</td>
                                            <td style={{ padding: '15px' }}>
                                                <button
                                                    className="delete-btn"
                                                    onClick={() => handleDelete(user.student_id)}
                                                    style={{
                                                        background: 'rgba(239, 68, 68, 0.1)',
                                                        color: '#ef4444',
                                                        border: '1px solid #ef4444',
                                                        padding: '6px 12px',
                                                        borderRadius: '6px',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* TAB CONTENT: UPLOAD */}
            {activeTab === "upload" && (
                <div className="animate-slide-up">
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
                </div>
            )}
        </div>
    );
};

export default ManageUsers;


