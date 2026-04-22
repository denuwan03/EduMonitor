# EduMonitor - Student Monitoring System

Full-stack MERN application with role-based dashboards for `Student`, `Supervisor`, and `Admin`.

## Modules Included

- User identity and engagement management (register, login, JWT auth, profile, activity log, logout)
- Project and task management with smart task assignment
- Skill gap analysis (required skills vs student skills, score and missing skills)
- File submission workflow using Multer (`PDF`, `DOC`, `DOCX`, `ZIP`)
- Evaluation and feedback with marks and comments
- Reporting and analytics with charts (bar, pie, line)

## Tech Stack

- Backend: Node.js, Express.js, MongoDB, Mongoose, JWT, bcrypt, Multer
- Frontend: React.js, React Router, Axios, Tailwind CSS, Recharts

## Folder Structure

- `backend/` - API, models, controllers, routes, middleware
- `frontend/` - React app, pages, layouts, auth context, API service

## Setup

### 1) Backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

### 2) Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`, backend at `http://localhost:5000`.

## Core APIs

- Auth: `POST /api/auth/register`, `POST /api/auth/login`
- Users: `GET/PUT /api/users/profile`, `GET /api/users/dashboard-summary`
- Projects: `GET/POST /api/projects`
- Tasks: `GET/POST /api/tasks`, `PUT /api/tasks/:id`, `GET /api/tasks/skill-gap/analysis`
- Submissions: `POST /api/submissions`, `GET /api/submissions`
- Feedback: `POST /api/feedback`, `GET /api/feedback`
- Reports: `GET /api/reports`
- Topics: `POST /api/topics`, `GET /api/topics`, `PUT /api/topics/:id/review`
