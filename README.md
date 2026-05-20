# VOTEXA - University Voting System

VOTEXA is a comprehensive Voting and Election Management System designed for universities. It handles Student Council Elections and Class Representative (CR) selections with a robust Role-Based Access Control (RBAC) system.

## 🚀 Features

-   **Role-Based Access**: Student, CR, Council (VP, Secretary, etc.), Admin.
-   **Election Management**: Create and manage CR and Council elections.
-   **Secure Voting**: Unique vote per election, secure database transactions.
-   **Real-time Analytics**: Live vote counts, turnout stats, and result visualization.
-   **Digital Notice Board**: Targeted announcements for classes or the entire college.
-   **Modern UI**: Glassmorphism design, Dark Mode, and Responsive Layout.

## 🛠️ Tech Stack

-   **Backend**: Python (Flask), SQLAlchemy, SQLite.
-   **Frontend**: React (Vite), CSS Modules (`.css`), Recharts.

## 📦 Installation & Setup

### 1. Backend Setup

```bash
cd backend
# Create virtual environment
python -m venv venv
# Activate venv
.\venv\Scripts\activate  # Windows
# Install dependencies
pip install -r requirements.txt
# Run Server
python run.py
```

The backend runs on `http://127.0.0.1:5000`.

### 2. Frontend Setup

```bash
cd frontend
# Install dependencies
npm install
# Run Dev Server
npm run dev
```

The frontend runs on `http://localhost:5173`.

## 🔑 Default Credentials

**Admin:**
-   **University ID**: `ADMIN001`
-   **Password**: `admin123`

**Test Users:**
-   **Vice President**: `24msc12` / `password`
-   **Student**: `24msc13` / `password`

## 📝 Usage Guide

1.  **Admin**: Log in to manage users, create elections, and view system health.
2.  **Student**: Log in to vote for CR elections or view public notices.
3.  **Class Representative (CR)**: Log in to vote for Council Elections and manage class stats.
