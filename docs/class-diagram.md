# Class / Domain Model Diagram

Domain model of the Task Management System, derived from `backend/prisma/schema.prisma`.
(GitHub renders the Mermaid diagram below.)

```mermaid
classDiagram
    class User {
        +Int id
        +String name
        +String email  «unique»
        +String password  «bcrypt hash»
        +Role role
        +Boolean isActive
        +Boolean mustResetPassword
        +DateTime createdAt
        +DateTime updatedAt
    }

    class Project {
        +String id  «uuid»
        +String name
        +String? description
        +Int? managerId
        +DateTime createdAt
        +DateTime updatedAt
    }

    class Task {
        +Int id
        +String title
        +String? description
        +Priority priority
        +Status status
        +DateTime? dueDate
        +Int createdById
        +String? projectId
        +DateTime createdAt
        +DateTime updatedAt
    }

    class TaskAssignment {
        +Int id
        +Int taskId
        +Int userId
        +DateTime createdAt
    }

    class Comment {
        +Int id
        +String content
        +Int taskId
        +Int userId
        +DateTime createdAt
    }

    class Attachment {
        +Int id
        +String filename
        +String storedAs
        +String mimeType
        +Int size
        +Int taskId
        +Int userId
        +DateTime createdAt
    }

    class Notification {
        +Int id
        +String message
        +Boolean isRead
        +Int userId
        +Int? taskId
        +DateTime createdAt
    }

    class Role {
        <<enum>>
        ADMIN
        PROJECT_MANAGER
        COLLABORATOR
    }
    class Priority {
        <<enum>>
        LOW
        MEDIUM
        HIGH
    }
    class Status {
        <<enum>>
        TODO
        IN_PROGRESS
        COMPLETED
    }

    User "1" --> "*" Project : manages (ProjectManager)
    User "1" --> "*" Task : creates (CreatedBy)
    User "1" --> "*" TaskAssignment : assigned
    User "1" --> "*" Comment : authors
    User "1" --> "*" Attachment : uploads
    User "1" --> "*" Notification : receives
    Project "1" --> "*" Task : contains
    Task "1" --> "*" TaskAssignment : has
    Task "1" --> "*" Comment : has
    Task "1" --> "*" Attachment : has
    Task "1" --> "*" Notification : may reference
    User "1" --o "1" Role : has
    Task "1" --o "1" Priority : has
    Task "1" --o "1" Status : has
```

## Relationships & cascade rules

| Relationship | Cardinality | On delete |
|---|---|---|
| User → Project (manager) | 1 user manages many projects | `SetNull` (project keeps existing, manager cleared) |
| User → Task (creator) | 1 user creates many tasks | `Cascade` (deleting user deletes their created tasks) |
| Project → Task | 1 project has many tasks | `SetNull` (task survives, `projectId` cleared) |
| Task ↔ User (assignment) | many-to-many via `TaskAssignment` (unique `taskId+userId`) | `Cascade` both sides |
| Task → Comment / Attachment / Notification | 1 task has many | `Cascade` |
| User → Comment / Attachment / Notification | 1 user has many | `Cascade` |
| Notification → Task | optional (`taskId?`) — admin-update notifications have no task | `Cascade` |

## Notes
- `User.password` is always a bcrypt hash; it is never returned in API responses (`select` blocks exclude it).
- `Task` ↔ `User` assignment is a join entity (`TaskAssignment`) rather than an implicit relation, enabling the unique constraint and per-assignment `createdAt`.
- `Notification.taskId` is optional so administrative notifications (role change, project-manager assignment) can exist without a task.
