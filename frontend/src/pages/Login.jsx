import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "./Login.css";
import votexaLogo from "../assets/votexa logo.png";
import { toast } from "react-hot-toast";

function Login() {
  const [universityId, setUniversityId] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState("dark");

  // New State for Password Change
  const [needsPasswordChange, setNeedsPasswordChange] = useState(false);

  const navigate = useNavigate();

  // Load saved theme
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "dark";
    setTheme(savedTheme);
    document.documentElement.setAttribute("data-theme", savedTheme);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.post("/auth/login", {
        university_id: universityId.trim(),
        password: password
      });

      const data = response.data;

      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("role", data.role);
      localStorage.setItem("user", JSON.stringify(data.user)); // Save full user details

      // Check Password Change Status
      if (data.is_password_changed === false) {
        setNeedsPasswordChange(true);
        setLoading(false);
        toast("Please set a new password.", { icon: "🔑" });
        return;
      }

      toast.success("Welcome back!");
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || "Login failed");
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post("/auth/change-password", {
        new_password: newPassword
      });
      toast.success("Password updated! Redirecting...");
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to update password");
    } finally {
      setLoading(false);
    }
  }


  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
  };

  return (
    <div className="login-page">
      <div className="login-container">
        {/* Theme toggle */}
        <button
          className="theme-toggle"
          type="button"
          onClick={toggleTheme}
          aria-label="Toggle theme"
        >
          {theme === "dark" ? "🌙" : "☀️"}
        </button>

        {/* LOGO HEADER */}
        <div className="login-header" style={{ flexDirection: 'column', alignItems: 'center' }}>
          <img
            src={votexaLogo}
            alt="VOTEXA Logo"
            className="login-logo"
          />
          <h1 style={{
            margin: '10px 0 0 0',
            fontSize: '2rem',
            letterSpacing: '4px',
            fontFamily: 'inherit',
            color: 'var(--primary-color)'
          }}>
            VOTEXA
          </h1>
        </div>

        {!needsPasswordChange ? (
          <form className="login-form" onSubmit={handleLogin}>
            <div className="form-group">
              <label>University ID</label>
              <input
                type="text"
                value={universityId}
                onChange={(e) => setUniversityId(e.target.value)}
                placeholder="Enter University ID"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter Password"
                disabled={loading}
              />
            </div>



            <button className="login-button" type="submit" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>
        ) : (
          <form className="login-form" onSubmit={handleChangePassword}>
            <h3 style={{ textAlign: 'center', margin: 0 }}>Set New Password</h3>
            <p style={{ textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              First time login requires a password change.
            </p>
            <div className="form-group">
              <label>New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min 6 characters"
                required
                disabled={loading}
              />
            </div>



            <button className="login-button" type="submit" disabled={loading}>
              {loading ? "Updating..." : "Set Password & Login"}
            </button>
          </form>
        )}

      </div>
    </div>
  );
}

export default Login;
