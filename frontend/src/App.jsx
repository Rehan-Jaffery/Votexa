import { Routes, Route, Navigate } from "react-router-dom";
import "./animations.css"; // Global Animations
import Login from "./pages/Login";
import DashboardLayout from "./layouts/DashboardLayout";
import DashboardHome from "./pages/DashboardHome"; // New
// We will create these placeholders next
import Analytics from "./pages/Analytics";
import VotePage from "./pages/VotePage";
import ManageUsers from "./pages/ManageUsers";
import Profile from "./pages/Profile";
import ApplyPage from "./pages/ApplyPage";
import ManageElections from "./pages/ManageElections";
import ManageApplications from "./pages/ManageApplications";
import ElectionResults from "./pages/ElectionResults";
import NoticesPage from "./pages/NoticesPage";
import ClassStats from "./pages/ClassStats";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" />} />
      <Route path="/login" element={<Login />} />

      {/* Nested Routes for Dashboard */}
      <Route path="/dashboard" element={<DashboardLayout />}>
        <Route index element={<DashboardHome />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="users" element={<ManageUsers />} />
        <Route path="profile" element={<Profile />} />
        <Route path="vote" element={<VotePage />} />
        <Route path="elections" element={<ManageElections />} />
        <Route path="class-stats" element={<ClassStats />} />
        <Route path="apply" element={<ApplyPage />} />
        <Route path="notices" element={<NoticesPage />} />
        <Route path="applications" element={<ManageApplications />} />

        <Route path="results" element={<ElectionResults />} />
      </Route>
    </Routes>
  );
}

export default App;
