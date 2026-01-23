import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";
import votexaLogo from "../assets/votexa.png";

function Login() {
  const [universityId, setUniversityId] = useState("");
  const [password, setPassword] = useState(""); // future use
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [theme, setTheme] = useState("dark");

  const navigate = useNavigate();

  // Apply theme to body
  useEffect(() => {
    document.body.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Load saved theme
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "dark";
    setTheme(savedTheme);
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("http://127.0.0.1:5000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          university_id: universityId.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }

      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("role", data.role);

      navigate(data.role === "admin" ? "/admin" : "/student");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
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
        <div className="login-header">
          <img
            src={votexaLogo}
            alt="VOTEXA Logo"
            className="login-logo"
          />
        </div>

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
              placeholder="Password (future use)"
              disabled={loading}
            />
          </div>

          {error && <p className="error-text">{error}</p>}

          <button className="login-button" type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
