# Task Management System (TMS)
**Module:** INTE 21323 | **Group Assignment**

A full-stack web application for creating, managing, and tracking tasks collaboratively in real time.

## Live Demo
- **Frontend:** https://your-app.vercel.app *(update after deployment)*
- **Backend API:** https://your-backend.onrender.com *(update after deployment)*
- **API Docs (Swagger):** https://your-backend.onrender.com/api-docs

## Tech Stack
| Layer | Technology |
|-------|-----------|
| Frontend | React (Vite), Tailwind CSS, React Router |
| Backend | Node.js, Express.js (MVC) |
| Database | MySQL + Prisma ORM |
| Auth | JWT + bcrypt |
| Real-time | Socket.io |
| Email | Nodemailer |
| API Docs | Swagger |
| Testing | Jest |
| Deployment | Vercel (frontend) + Render.com (backend) |

## Team Members
| Member | Name | Responsibilities |
|--------|------|-----------------|
| 1 | Sameera | GitHub setup, Auth API, JWT middleware, RBAC, User management API |
| 2 | Subanya | Task CRUD API, Socket.io emit, Swagger docs |
| 3 | Ravindu | Login page, Register flow, Protected routes, Admin Users UI |
| 4 | Binithi | Kanban board, Task pages, Dashboard, Notification panel |
| 5 | Aflam | Prisma schema, DB setup, Docker, Vercel + Render deployment, ER diagram |

## Setup
### Backend
```bash
cd backend
npm install
cp .env.example .env   # fill in your values
npx prisma migrate dev --name init
npm run dev
```
### Frontend
```bash
cd frontend
npm install
npm run dev
```
