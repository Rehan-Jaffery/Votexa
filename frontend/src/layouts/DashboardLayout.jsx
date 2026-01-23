import { Outlet } from "react-router-dom";
import Sidebar from "../components/common/Sidebar";
import "./DashboardLayout.css";
import { useState } from "react";

const DashboardLayout = () => {
    const role = localStorage.getItem("role") || "student";
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <div className="dashboard-layout">
            {/* Hamburger Button */}
            <button
                className="hamburger-btn"
                onClick={() => setMobileOpen(true)}
                aria-label="Open Menu"
            >
                ☰
            </button>

            <Sidebar
                role={role}
                mobileOpen={mobileOpen}
                onClose={() => setMobileOpen(false)}
            />

            <main className="dashboard-content">
                <Outlet />
            </main>
        </div>
    );
};

export default DashboardLayout;
