# 🚀 Taskboard: Modern Kanban Management System

A full-stack, lightweight, and highly responsive Kanban task management application built with **Vue 3, TypeScript, Python, FastAPI, SQLAlchemy (Async), MySQL, and Tailwind CSS**. This application is designed to streamline team workflows with deep features like Role-Based Access Control (RBAC), multi-stage review logic, Discord webhook integration, and Markdown-supported task details.

---

## ✨ Key Features

- **Modern Glassmorphism UI**: Beautiful, intuitive, and responsive interface built with Tailwind CSS and Vite. Layout automatically adapts from desktop grid columns to mobile horizontal-swipe (Trello-like) scrolling.
- **GSAP Native Animations**: Fluid Drag and Drop interactions with GSAP FLIP.
- **Kanban Workflow**: 4-column architecture (`Pending` → `In Progress` → `Pending Review` → `Completed`).
- **Role-Based Access Control (RBAC)**:
  - **Admin**: Has full power over the workspace. Can create custom roles, manage reviewers, override statuses, and approve task submissions.
  - **Member**: Can register using custom roles, move their assigned tasks, and submit evidence for review.
- **Markdown Descriptions**: Native support for Markdown in task descriptions, allowing checklists, code blocks, and rich text formatting.
- **Audit Logs (Activity Timeline)**: Every action on a task (creation, status changes, review submissions, SOS triggers) is tracked and visualized in a dedicated timeline within the task modal.
- **Discord Notification Service**: Automatically broadcasts real-time updates to a specified Discord channel via Webhooks when:
  - A new task is created 🟩
  - A task is approved and completed ✅
  - A task is flagged as an SOS Emergency 🚨
- **Review Workflow**: A strict validation process requiring members to supply "Evidence of Work" when moving a task to `Pending Review`. Only designated reviewers or Admins can Approve (move to `Completed`) or Reject (revert to `In Progress`).
- **Deadline Visualizer**: Tasks close to their deadline are visually highlighted with warning colors (Yellow for <3 days, Red for <24h).

---

## 🛠 Tech Stack

- **Frontend**: Vue 3 (Composition API), Vite, TypeScript, Tailwind CSS, GSAP, Vue Router, VueUse / Auto-Animate
- **Backend**: Python 3.11, FastAPI, Uvicorn
- **Database**: MySQL (Async via `aiomysql`) + SQLAlchemy 2.0 ORM
- **Authentication**: JWT (JSON Web Tokens) & `bcrypt`
- **Integrations**: Discord API (Webhook Embeds) via `httpx`

---

## ⚙️ Installation & Setup

### 1. Prerequisites
- Node.js (v20+)
- Python 3.11+
- MySQL Server (Local or Cloud)

### 2. Configure Environment Variables
Create a `.env` file in the **root directory** (outside `/backend` and `/frontend`) and populate it:
```env
# Database Credentials
DB_HOST=127.0.0.1
DB_USER=your_mysql_user
DB_PASSWORD=your_mysql_password
DB_NAME=your_mysql_database
DB_PORT=3306

# Authentication
JWT_SECRET=your_super_secret_jwt_key

# Discord Webhook Integration (Optional)
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/your_webhook_id/your_webhook_token
```

### 3. Setup Backend
Run the setup script inside the `backend/` directory to create the virtual environment, install dependencies, and seed the default Admin account.
```bash
cd backend
python -m venv .venv

# On MacOS/Linux:
source .venv/bin/activate
# On Windows:
.venv\Scripts\activate

pip install -r requirements.txt
python setup_db.py
```
> **Note**: The default admin login created is Username: `admin` / Password: `123456`.

### 4. Setup Frontend
Install Node dependencies and compile the Vue TypeScript environment:
```bash
cd frontend
npm install
npm run build
```

### 5. Start the Application for Development
You'll need two separate terminals for the Backend API and the Frontend.

**Terminal 1 (Backend - FastAPI)**
```bash
cd backend
# Make sure your .venv is activated
uvicorn app.main:app --reload
# Runs on default http://127.0.0.1:8000
```

**Terminal 2 (Frontend - Vue/Vite)**
```bash
cd frontend
npm run dev
# The UI will be hosted at http://localhost:5173
```
Open `http://localhost:5173` in your browser.

---

## 📖 Usage Guide

1. **First Steps as Admin**: Login using `admin` / `123456`. Open the **Workspace Settings** to create *Custom Roles* (e.g., Frontend, Backend, Design).
2. **Onboarding Members**: Team members can now register an account and choose one of the roles created by the Admin.
3. **Workflow Execution**: 
   - Members click "Start" to move a task to `In Progress`.
   - Once done, they click "Submit Review", fill out the Evidence note, and it goes to `Pending Review`.
   - The Admin (or an authorized Reviewer) reviews the task within the Detail Modal and decides to Approve or Reject it.

## 🚀 CI/CD Pipeline & Deployment

This repository includes a fully configured **GitHub Actions** CI/CD pipeline (`.github/workflows/deploy.yml`). 

### How it works:
1. Every time you push or merge a Pull Request to the `main` branch, GitHub Actions will:
   - Build the Frontend (`npm install`, `npm run typecheck`, and `npm run build`).
   - Run a backend Python syntax check (`compileall`).
2. If the build passes, it automatically triggers your **Render Deploy Hook**.

### Setup Deployment
1. Go to your **GitHub Repository Settings** > **Secrets and variables** > **Actions**.
2. Create a new repository secret named: `RENDER_DEPLOY_HOOK`.
3. Paste your Render target Webhook URL.
4. On Render, set the start command to execute FastAPI. The deployed Vue Frontend (`frontend/dist`) is statically bound and served via FastAPI at `/`.

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).

## 📁 Project Structure
```text
.
├── backend/                # FastAPI backend
│   ├── app/                # Application source code
│   │   ├── ...             
│   ├── .venv/              # Python virtual environment
│   ├── requirements.txt    # Python dependencies
│   └── setup_db.py         # Database initialization script
├── frontend/               # UI workspace
│   ├── src/                # Vue 3 SFC Components, Views, TS Composables
│   ├── package.json        
│   ├── tsconfig.json       
│   ├── vite.config.ts      
│   └── tailwind.config.js  
├── .github/                # GitHub Actions Workflows
├── .env                    # Environment variables configuration
└── README.md               # Project documentation
```