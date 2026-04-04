# 🚀 Taskboard: Modern Kanban Management System

A full-stack, lightweight, and highly responsive Kanban task management application built with **Python, FastAPI, SQLAlchemy (Async), MySQL, and Tailwind CSS**. This application is designed to streamline team workflows with deep features like Role-Based Access Control (RBAC), multi-stage review logic, Discord webhook integration, and Markdown-supported task details.

---

## ✨ Key Features

- **Modern Glassmorphism UI**: Beautiful, intuitive, and responsive interface built with Tailwind CSS. Layout automatically adapts from desktop grid columns to mobile horizontal-swipe (Trello-like) scrolling.
- **Kanban Workflow**: 4-column architecture (`Pending` → `In Progress` → `Pending Review` → `Completed`).
- **Role-Based Access Control (RBAC)**:
  - **Admin**: Has full power over the workspace. Can create custom roles, manage reviewers, override statuses, and approve task submissions.
  - **Member**: Can register using custom roles, move their assigned tasks, and submit evidence for review.
- **Markdown Descriptions**: Native support for Markdown (via `marked.js`) in task descriptions, allowing checklists, code blocks, and rich text formatting.
- **Audit Logs (Activity Timeline)**: Every action on a task (creation, status changes, review submissions, SOS triggers) is tracked and visualized in a dedicated timeline within the task modal.
- **Discord Notification Service**: Automatically broadcasts real-time updates to a specified Discord channel via Webhooks when:
  - A new task is created 🟩
  - A task is approved and completed ✅
  - A task is flagged as an SOS Emergency 🚨
- **Review Workflow**: A strict validation process requiring members to supply "Evidence of Work" when moving a task to `Pending Review`. Only designated reviewers or Admins can Approve (move to `Completed`) or Reject (revert to `In Progress`).
- **Deadline Visualizer**: Tasks close to their deadline are visually highlighted with warning colors (Yellow for <3 days, Red for <24h).

---

## 🛠 Tech Stack

- **Frontend**: HTML5, Vanilla JavaScript, Tailwind CSS (via CDN)
- **Backend**: Python 3, FastAPI, Uvicorn
- **Database**: MySQL (Async via `aiomysql`) + SQLAlchemy 2.0 ORM
- **Authentication**: JWT (JSON Web Tokens) & `bcrypt`
- **Integrations**: Discord API (Webhook Embeds) via `httpx`

---

## ⚙️ Installation & Setup

### 1. Prerequisites
- Python 3.10+
- MySQL Server (Local or Cloud)

### 2. Clone repository & Install dependencies
```bash
git clone <your-repository-url>
cd <repository-directory>/backend
python -m venv .venv
source .venv/bin/activate  # On Windows use: .venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Configure Environment Variables
Create a `.env` file in the **root directory** (outside `/backend`) and populate it with your configuration:
```env
# Database Credentials
DB_HOST=your_mysql_host
DB_USER=your_mysql_user
DB_PASSWORD=your_mysql_password
DB_NAME=your_mysql_database
DB_PORT=3306

# Authentication
JWT_SECRET=your_super_secret_jwt_key

# Discord Webhook Integration (Optional)
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/your_webhook_id/your_webhook_token
```

### 4. Initialize Database
Run the setup script inside the `backend/` directory to create the necessary tables and seed the default Admin account.
```bash
cd backend
python setup_db.py
```
> **Note**: The default admin login created is Username: `admin` / Password: `123456`.

### 5. Start the Application
```bash
uvicorn app.main:app --host 127.0.0.1 --port 3000
```
---

## 📖 Usage Guide

1. **First Steps as Admin**: Login using `admin` / `123456`. Open the **Workspace Settings** to create *Custom Roles* (e.g., Frontend, Backend, Design).
2. **Onboarding Members**: Team members can now register an account and choose one of the roles created by the Admin.
3. **Workflow Execution**: 
   - Members click "Start" to move a task to `In Progress`.
   - Once done, they click "Complete Task", fill out the Evidence note, and it goes to `Pending Review`.
   - The Admin (or an authorized Reviewer) reviews the task within the Detail Modal and decides to Approve or Reject it.

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).

## 📁 Project Structure
├── backend/               # Python FastAPI backend
│   ├── app/               # Application source code
│   │   ├── core/          # Exception handlers, security configurations
│   │   ├── dependencies/  # FastAPI dependencies (DB, auth)
│   │   ├── models/        # SQLAlchemy database models
│   │   ├── repositories/  # Database access layer (CRUD)
│   │   ├── routers/       # API route definitions
│   │   ├── schemas/       # Pydantic schemas for data validation
│   │   └── services/      # Business logic and use cases
│   ├── .venv/             # Python virtual environment
│   ├── requirements.txt   # Python dependencies
│   └── setup_db.py        # Database initialization script
├── frontend/              # Frontend UI layer
│   └── index.html         # Main dashboard HTML & logic
├── .env                   # Environment variables configuration
└── README.md              # Project documentation
\