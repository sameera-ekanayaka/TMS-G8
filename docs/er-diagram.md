# Entity-Relationship (ER) Diagram

Derived from `backend/prisma/schema.prisma`. GitHub renders the Mermaid diagram below.

```mermaid
erDiagram

    User {
        Int     id                PK
        String  name
        String  email             UK
        String  password
        Role    role
        Boolean isActive
        Boolean mustResetPassword
        DateTime createdAt
        DateTime updatedAt
    }

    Project {
        String   id          PK  "UUID"
        String   name
        String   description     "nullable"
        Int      managerId   FK  "nullable → User"
        DateTime createdAt
        DateTime updatedAt
    }

    Task {
        Int      id          PK
        String   title
        String   description     "nullable, TEXT"
        Priority priority
        Status   status
        DateTime dueDate         "nullable"
        Int      createdById FK  "→ User"
        String   projectId   FK  "nullable → Project"
        DateTime createdAt
        DateTime updatedAt
    }

    TaskAssignment {
        Int      id        PK
        Int      taskId    FK  "→ Task"
        Int      userId    FK  "→ User"
        DateTime createdAt
    }

    Comment {
        Int      id        PK
        String   content       "TEXT"
        Int      taskId    FK  "→ Task"
        Int      userId    FK  "→ User"
        DateTime createdAt
        DateTime updatedAt
    }

    Attachment {
        Int      id        PK
        String   filename      "original filename shown to user"
        String   storedAs      "UUID-based filename on disk"
        String   mimeType      "e.g. image/png"
        Int      size          "bytes"
        Int      taskId    FK  "→ Task"
        Int      userId    FK  "→ User"
        DateTime createdAt
    }

    Notification {
        Int      id        PK
        String   message
        Boolean  isRead
        Int      userId    FK  "→ User"
        Int      taskId    FK  "nullable → Task"
        DateTime createdAt
    }

    %% Relationships
    User         ||--o{ Project        : "manages (ProjectManager)"
    User         ||--o{ Task           : "creates (CreatedBy)"
    User         ||--o{ TaskAssignment : "assigned via"
    User         ||--o{ Comment        : "authors"
    User         ||--o{ Attachment     : "uploads"
    User         ||--o{ Notification   : "receives"

    Project      ||--o{ Task           : "contains"

    Task         ||--o{ TaskAssignment : "has"
    Task         ||--o{ Comment        : "has"
    Task         ||--o{ Attachment     : "has"
    Task         ||--o{ Notification   : "may trigger"
```

## Enums

| Enum | Values |
|---|---|
| `Role` | `ADMIN`, `PROJECT_MANAGER`, `COLLABORATOR` |
| `Priority` | `LOW`, `MEDIUM`, `HIGH` |
| `Status` | `TODO`, `IN_PROGRESS`, `COMPLETED` |

## Cascade & Delete Rules

| Relationship | On Delete |
|---|---|
| `User` → `Project` (manager) | `SetNull` — project kept, `managerId` cleared |
| `User` → `Task` (creator) | `Cascade` — deletes all tasks they created |
| `User` → `TaskAssignment` | `Cascade` |
| `User` → `Comment` | `Cascade` |
| `User` → `Attachment` | `Cascade` |
| `User` → `Notification` | `Cascade` |
| `Project` → `Task` | `SetNull` — task survives, `projectId` cleared |
| `Task` → `TaskAssignment` | `Cascade` |
| `Task` → `Comment` | `Cascade` |
| `Task` → `Attachment` | `Cascade` |
| `Task` → `Notification` | `Cascade` |

## Unique Constraints

- `User.email` — unique across the system
- `TaskAssignment(taskId, userId)` — a user can only be assigned to a task once

## Notes

- `User.password` is always stored as a **bcrypt hash**. It is excluded from all API responses via Prisma `select`.
- `Attachment.storedAs` is a UUID-based filename used internally on disk; `filename` is the original name shown to users.
- `Notification.taskId` is optional — administrative notifications (e.g. role change, project manager assignment) have no associated task.
- The `Task ↔ User` assignment is a **join entity** (`TaskAssignment`) rather than a direct relation, enabling the unique constraint and a per-assignment `createdAt` timestamp.
