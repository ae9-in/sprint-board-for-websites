# Sprint Board - SaaS Project Lifecycle Management Platform

## Project Overview
- **Project Name**: Sprint Board
- **Type**: Full-stack multi-tenant SaaS platform
- **Core Functionality**: End-to-end project lifecycle management from requirements through deployment, maintenance, and feature enhancements
- **Target Users**: Web development teams, agencies, software companies managing multiple client projects

## Technology Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT with refresh tokens (access: 15min, refresh: 7 days)
- **File Storage**: AWS S3 or Cloudflare R2 (presigned URLs)
- **Background Jobs**: BullMQ with Redis
- **Real-time**: Server-Sent Events (SSE)
- **Email**: Nodemailer or Resend
- **Validation**: Zod

### Frontend
- **Framework**: React 19 with Vite
- **Styling**: Tailwind CSS with shadcn/ui
- **State Management**: Zustand (global) + TanStack Query v5 (server state)
- **Animations**: Framer Motion
- **Drag & Drop**: dnd-kit
- **Charts**: Recharts

## Database Architecture

### Multi-Tenancy
- Every document contains `organizationId` (ObjectId)
- All queries filtered by `organizationId` from auth token
- Soft delete via `isDeleted` boolean

### Collections
1. **Organization** - Tenant root entity
2. **User** - Members within organizations
3. **Project** - Client projects with embedded metrics
4. **ProjectStage** - 8 sequential stages per project
5. **Sprint** - Time-boxed task iterations
6. **Task** - Work items with hierarchy support
7. **TaskComment** - Task discussions
8. **DailyLog** - Daily work submissions
9. **TestingReport** - Bug tracking
10. **DeploymentDetail** - Deployment documentation
11. **MaintenanceLog** - Post-deployment issues
12. **FeatureRequest** - Enhancement tracking
13. **ProjectFile** - Document management
14. **Notification** - User notifications
15. **ActivityLog** - Audit trail
16. **InviteToken** - User invitations (TTL index)
17. **RefreshToken** - Auth tokens (TTL index)

### Indexes
- Compound indexes on frequently queried fields
- TTL indexes for auto-expiring tokens
- Text indexes for search functionality

## API Response Format

### Success Response
```json
{
  "success": true,
  "data": {},
  "message": "Operation successful",
  "meta": {
    "total": 100,
    "page": 1,
    "totalPages": 10,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "fields": []
  }
}
```

## Feature Requirements

### Authentication
- JWT access/refresh token flow
- Password hashing with bcrypt (12 rounds)
- Organization creation on signup
- User invitation system (72hr expiry)
- Password reset flow

### Projects
- CRUD operations with RBAC
- Stage-based workflow (8 stages)
- Priority levels and status tracking
- User assignment
- Daily log requirement (DEVELOPMENT stage)

### Stage Gates
- Sequential stage completion enforcement
- Deployment completion validation (21 required fields)
- Approval/rejection workflow
- Notification triggers

### Sprint Board
- Kanban with 5 status columns
- Drag-and-drop with optimistic updates
- Task hierarchy (subtasks)
- Priority badges and assignee display

### File Management
- Presigned URL generation (1hr expiry)
- MIME type validation
- Size limits (50MB general, 500MB video)
- Download tracking

### Notifications
- Real-time SSE delivery
- Type-based notifications
- Read/unread status
- Organization-scoped broadcasting

### Dashboard
- Admin: project metrics, approvals, compliance
- User: assigned tasks, pending logs, assignments

### Email Templates
- Invite acceptance
- Daily log reminders
- Stage approval requests
- Stage status changes
- Password reset

## Security Requirements
- Organization-scoped data isolation
- Role-based access (SUPER_ADMIN, USER)
- JWT token rotation on refresh
- Input validation with Zod
- Rate limiting on auth routes

## Acceptance Criteria
1. Users can sign up and create organizations
2. Admins can invite users with role assignment
3. Projects progress through 8 sequential stages
4. Sprint board supports drag-and-drop task management
5. Daily logs are mandatory during DEVELOPMENT stage
6. Deployment requires all 21 fields for completion
7. Real-time notifications via SSE
8. Dashboard shows organization and user metrics
9. All endpoints enforce organization scoping
10. File uploads generate presigned URLs