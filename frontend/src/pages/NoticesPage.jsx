import { useState, useEffect } from "react";
import { getAnnouncements, createAnnouncement, deleteAnnouncement } from "../services/noticeService";
import { toast } from "react-hot-toast";
import "./NoticesPage.css";

const NoticesPage = () => {
    const [notices, setNotices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    // Form State
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [scope, setScope] = useState("CLASS");
    const [priority, setPriority] = useState("NORMAL");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const role = localStorage.getItem("role") || "student";
    const canPost = ["admin", "president", "vice_president", "secretary", "joint_secretary", "cr"].includes(role);
    const isCouncilOrAdmin = ["admin", "president", "vice_president", "secretary", "joint_secretary"].includes(role);

    useEffect(() => {
        loadNotices();
    }, []);

    const loadNotices = async () => {
        try {
            setLoading(true);
            const data = await getAnnouncements();
            setNotices(data);
        } catch (err) {
            console.error("Failed to load notices", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        try {
            await createAnnouncement({
                title,
                content,
                audience_scope: scope,
                priority
            });
            setSuccess("Announcement posted successfully!");
            setShowModal(false);
            setTitle("");
            setContent("");
            loadNotices(); // Refresh list
        } catch (err) {
            setError(err.response?.data?.message || "Failed to post announcement");
        }
    };

    const [selectedNotice, setSelectedNotice] = useState(null);

    const handleCardClick = (notice) => {
        setSelectedNotice(notice);
    };

    const handleDelete = async () => {
        if (!selectedNotice) return;
        if (window.confirm("Are you sure you want to delete this notice?")) {
            try {
                await deleteAnnouncement(selectedNotice.id);
                toast.success("Notice deleted successfully");
                setSelectedNotice(null);
                loadNotices();
            } catch (err) {
                toast.error("Failed to delete notice");
            }
        }
    };

    const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
    const canDeleteNotice = selectedNotice && (role === "admin" || selectedNotice.sender_id === currentUser.id || selectedNotice.sender_id === currentUser.student_id || selectedNotice.sender_name === currentUser.name);

    return (
        <div className="notices-page fade-in">
            <header className="page-header">
                <div>
                    <h1>📢 Digital Notice Board</h1>
                    <p className="subtitle">Stay updated with latest announcements</p>
                </div>
                {canPost && (
                    <button className="primary-btn" onClick={() => setShowModal(true)}>
                        + New Announcement
                    </button>
                )}
            </header>

            {loading ? (
                <div className="loading-state">Loading notices...</div>
            ) : notices.length === 0 ? (
                <div className="empty-state">
                    <h3>No announcements yet</h3>
                    <p>Check back later for updates.</p>
                </div>
            ) : (
                <div className="notices-grid">
                    {notices.map((notice) => (
                        <div
                            key={notice.id}
                            className={`notice-card ${notice.priority.toLowerCase()}`}
                            onClick={() => handleCardClick(notice)}
                            role="button"
                            tabIndex={0}
                        >
                            <div className="notice-header">
                                <span className={`badge ${notice.priority.toLowerCase()}`}>{notice.priority}</span>
                                <span className="notice-date">{new Date(notice.created_at).toLocaleDateString()}</span>
                            </div>
                            <h3>{notice.title}</h3>
                            <p className="notice-preview">{notice.content}</p>
                            <div className="notice-footer">
                                <span className="author">By: {notice.sender_name} ({notice.sender_role.replace('_', ' ')})</span>
                                <span className="scope-tag">{notice.scope === "GOV_INTERNAL" ? "🔒 Council Internal" : "🏫 Class Notice"}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* CREATE MODAL */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h2>Post New Announcement</h2>
                        {error && <div className="error-msg">{error}</div>}

                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Title</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    placeholder="e.g., Exam Schedule Update"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Content</label>
                                <textarea
                                    value={content}
                                    onChange={e => setContent(e.target.value)}
                                    placeholder="Write your message here..."
                                    rows="4"
                                    required
                                />
                            </div>

                            <div className="row">
                                <div className="form-group">
                                    <label>Recipient Scope</label>
                                    <select value={scope} onChange={e => setScope(e.target.value)}>
                                        <option value="CLASS">My Class Only</option>
                                        {isCouncilOrAdmin && (
                                            <option value="GOV_INTERNAL">Council & CRs (Internal)</option>
                                        )}
                                        {/* <option value="ALL">Entire College (Admin)</option> */}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Priority</label>
                                    <select value={priority} onChange={e => setPriority(e.target.value)}>
                                        <option value="NORMAL">Normal</option>
                                        <option value="URGENT">Urgent 🔴</option>
                                    </select>
                                </div>
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="secondary-btn" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="primary-btn">Post Announcement</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* VIEW DETAILS MODAL */}
            {selectedNotice && (
                <div className="modal-overlay" onClick={() => setSelectedNotice(null)}>
                    <div className="modal-content view-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{selectedNotice.title}</h2>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                {canDeleteNotice && (
                                    <button onClick={handleDelete} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem' }}>
                                        Delete
                                    </button>
                                )}
                                <button className="close-btn" onClick={() => setSelectedNotice(null)}>×</button>
                            </div>
                        </div>

                        <div className="meta-info">
                            <span className={`badge ${selectedNotice.priority.toLowerCase()}`}>{selectedNotice.priority}</span>
                            <span className="date">{new Date(selectedNotice.created_at).toLocaleString()}</span>
                        </div>

                        <div className="notice-body">
                            {selectedNotice.content}
                        </div>

                        <div className="modal-footer">
                            <div className="sender-info">
                                <strong>Posted by:</strong> {selectedNotice.sender_name} <br />
                                <small>{selectedNotice.sender_role.replace('_', ' ').toUpperCase()}</small>
                            </div>
                            <div className="scope-info">
                                {selectedNotice.scope === "GOV_INTERNAL" ? "🔒 Visible only to Council & CRs" : "🏫 Visible to Class"}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NoticesPage;
