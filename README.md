# Sprint Board - SaaS Project Lifecycle Management Platform

A full-stack multi-tenant SaaS platform for managing web and SaaS projects end-to-end from requirements gathering through deployment, maintenance, and feature enhancements.

## Technology Stack

### Backend
- Node.js with Express.js
- MongoDB with Mongoose ODM
- JWT authentication with refresh tokens
- BullMQ with Redis for background jobs
- Server-Sent Events for real-time updates

### Frontend
- React 19 with Vite
- Tailwind CSS with custom design system
- Zustand for global state
- TanStack Query v5 for server state
- dnd-kit for drag-and-drop
- Recharts for dashboard charts

## Prerequisites

- Node.js 18+
- MongoDB running locally or cloud instance
- Redis (optional, for background jobs)

## Setup

### Backend

```bash
cd backend
cp .env.example .env
# Edit .env with your configuration

npm install
npm run dev
```

The backend will run on http://localhost:5000

### Frontend

```bash
cd frontend
cp .env.example .env
# Edit .env if needed (defaults to http://localhost:5000/api)

npm install
npm run dev
```

The frontend will run on http://localhost:5173

## Features

- Multi-tenant organization management
- Role-based access control (SUPER_ADMIN, USER)
- Project lifecycle management with 8 stages
- Sprint board with drag-and-drop task management
- Daily work logging requirement
- Stage approval workflow
- Real-time notifications via SSE
- Dashboard with project metrics

## API Endpoints

### Authentication
- POST /api/auth/signup - Create organization and user
- POST /api/auth/login - User login
- POST /api/auth/refresh - Refresh access token
- POST /api/auth/logout - User logout
- POST /api/auth/invite/send - Send team invitation
- POST /api/auth/invite/accept - Accept invitation

### Projects
- GET /api/projects - List projects
- POST /api/projects - Create project (admin only)
- GET /api/projects/:id - Get project details
- PATCH /api/projects/:id - Update project
- DELETE /api/projects/:id - Delete project

### Project Stages
- POST /api/projects/:projectId/stages/:stageType/approve
- POST /api/projects/:projectId/stages/:stageType/reject
- POST /api/projects/:projectId/stages/:stageType/request-changes

## Environment Variables

### Backend (.env)
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/sprint-board
JWT_ACCESS_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-secret-key
FRONTEND_URL=http://localhost:5173
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:5000/api
```

## License

MIT