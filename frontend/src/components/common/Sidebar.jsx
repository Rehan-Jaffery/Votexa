import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import votexaLogo from "../../assets/votexa logo.png";
import "./Sidebar.css";

const Sidebar = ({ role, mobileOpen, onClose }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [theme, setTheme] = useState(localStorage.getItem("theme") || "dark");

    useEffect(() => {
        document.documentElement.setAttribute("data-theme", theme);
        localStorage.setItem("theme", theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === "dark" ? "light" : "dark");
    }

    const handleLogout = () => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("user");
        localStorage.removeItem("role");
        navigate("/login");
    };

    const isActive = (path) => location.pathname === path;

    // Check if user is in Council
    const isCouncil = ["president", "vice_president", "secretary", "joint_secretary"].includes(role);

    // Get user name safely
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const userName = user.name || "My Profile";

    return (
        <>
            {/* Overlay for mobile */}
            {mobileOpen && (
                <div
                    style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999 }}
                    onClick={onClose}
                />
            )}

            <aside className={`sidebar ${mobileOpen ? 'open' : ''} animate-fade-in`}>
                <div className="sidebar-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <img
                            src={votexaLogo}
                            alt="VOTEXA"
                            style={{ height: '30px', width: 'auto' }}
                        />
                        <h2 style={{ fontSize: '1.2rem', margin: 0, letterSpacing: '1px' }}>VOTEXA</h2>
                    </div>
                    <button className="theme-btn" onClick={toggleTheme}>
                        {theme === "dark" ? "🌙" : "☀️"}
                    </button>
                </div>

                {/* USER PROFILE SNIPPET */}
                <div className="user-profile-summary" onClick={() => { navigate("/dashboard/profile"); onClose?.(); }}>
                    <div className="avatar-circle">
                        {role ? role.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div style={{ overflow: 'hidden' }}>
                        <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{userName}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{role?.replace('_', ' ')}</div>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    <button
                        className={`nav-item ${isActive("/dashboard") ? "active" : ""}`}
                        onClick={() => { navigate("/dashboard"); onClose?.(); }}
                    >
                        📊 Dashboard
                    </button>

                    {/* ADMIN & COUNCIL ANALYTICS */}
                    {(role === "admin" || isCouncil) && (
                        <button
                            className={`nav-item ${isActive("/dashboard/analytics") ? "active" : ""}`}
                            onClick={() => { navigate("/dashboard/analytics"); onClose?.(); }}
                        >
                            📈 Analytics
                        </button>
                    )}

                    {/* ADMIN ONLY */}
                    {role === "admin" && (
                        <>
                            <button
                                className={`nav-item ${isActive("/dashboard/elections") ? "active" : ""}`}
                                onClick={() => { navigate("/dashboard/elections"); onClose?.(); }}
                            >
                                🗳️ Manage Elections
                            </button>
                            <button
                                className={`nav-item ${isActive("/dashboard/users") ? "active" : ""}`}
                                onClick={() => { navigate("/dashboard/users"); onClose?.(); }}
                            >
                                👥 Manage Users
                            </button>
                            <button
                                className={`nav-item ${isActive("/dashboard/applications") ? "active" : ""}`}
                                onClick={() => { navigate("/dashboard/applications"); onClose?.(); }}
                            >
                                📋 Review Applications
                            </button>
                        </>
                    )}

                    {/* STUDENT & CR */}
                    {(role === "student" || role === "cr") && (
                        <>
                            <button
                                className={`nav-item ${isActive("/dashboard/vote") ? "active" : ""}`}
                                onClick={() => { navigate("/dashboard/vote"); onClose?.(); }}
                            >
                                🗳️ Vote
                            </button>
                            <button
                                className={`nav-item ${isActive("/dashboard/apply") ? "active" : ""}`}
                                onClick={() => { navigate("/dashboard/apply"); onClose?.(); }}
                            >
                                📝 Apply for Position
                            </button>
                        </>
                    )}

                    {/* CR & COUNCIL (Maybe Council wants class stats too?) */}
                    {(role === "cr" || isCouncil) && (
                        <button
                            className={`nav-item ${isActive("/dashboard/class-stats") ? "active" : ""}`}
                            onClick={() => { navigate("/dashboard/class-stats"); onClose?.(); }}
                        >
                            🏫 Class Stats
                        </button>
                    )}

                </nav>

                <div className="sidebar-footer">
                    <button className="logout-btn" onClick={handleLogout}>
                        <span>🚪</span> Logout
                    </button>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
