# Task Management System (TMS)
**Module:** INTE 21323 | **Group Assignment**

A full-stack web application for creating, managing, and tracking tasks collaboratively in real time. This project aligns with our Software Requirements Specification (SRS) to provide a robust, secure, and user-friendly task management solution.

## Features (Aligned with SRS)
- **User Authentication & Authorization**: JWT-based session management with secure storage and Role-Based Access Control (RBAC) supporting Admin, Project Manager, and Collaborator roles.
- **User Management**: Admins can securely create, update, deactivate users, and assign roles. Includes forced password reset on first login and strict password policies.
- **Task Management**: Create, assign, update, and track tasks via a Kanban board view. Tasks include due dates, priority levels (Low, Medium, High), and statuses (To Do, In Progress, Completed).
- **Real-Time Notifications**: Integrated WebSockets via Socket.io for live updates on task assignments, status changes, comments, and impending deadlines.
- **Security Best Practices**: Robust protection against SQL Injection and XSS. Secure password hashing (bcrypt), parameterized database queries via Prisma ORM, and HTTPS enforcement.
- **Validation & Error Handling**: Comprehensive front-end and back-end validation returning standardized HTTP status codes and user-friendly error messages.

## Live Demo
- **Frontend:** https://tms-frontend.kindpebble-85fc4cff.centralindia.azurecontainerapps.io
- **Backend API:** https://tms-backend.kindpebble-85fc4cff.centralindia.azurecontainerapps.io
- **API Docs (Swagger):** https://tms-backend.kindpebble-85fc4cff.centralindia.azurecontainerapps.io/api-docs

## Tech Stack
| Layer | Technology |
|-------|-----------|
| Frontend | React (Vite), Tailwind CSS, React Router |
| Backend | Node.js, Express.js (MVC) |
| Database | Azure Database for MySQL (Flexible Server) + Prisma ORM |
| Auth | JWT + bcrypt |
| Real-time | Socket.io |
| Email | Azure Communication Services (Email) |
| API Docs | Swagger / OpenAPI |
| Testing | Jest |
| Containerization | Docker (multi-stage) + nginx (frontend) |
| CI/CD | GitHub Actions → GHCR |
| Deployment | Azure Container Apps (frontend + backend) |

## Team Members
| Member | Name | Responsibilities |
|--------|------|-----------------|
| 1 | Sameera | GitHub setup, Auth API, JWT middleware, RBAC, User management API, Azure Container Apps deployment + CI/CD |
| 2 | Subanya | Task CRUD API, Socket.io emit, Swagger docs |
| 3 | Ravindu | Login page, Register flow, Protected routes, Admin Users UI |
| 4 | Binithi | Kanban board, Task pages, Dashboard, Notification panel |
| 5 | Aflam | Prisma schema, DB setup, Docker, Deployment Diagram, ER diagram, Documentation |

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

## Documentation & Diagrams
- **API docs:** Swagger UI at `/api-docs` on the backend (link above).
- **Class diagram:** [`docs/class diagram.png`](docs/class%20diagram.png)
- **ER diagram:** [`docs/er-diagram.png`](docs/er-diagram.png)
- **Deployment diagram:** [`docs/deployment-diagram.png`](docs/deployment-diagram.png)
- **Database design:** [`docs/database_design.md`](docs/database_design.md) (aligns with Prisma schema).
