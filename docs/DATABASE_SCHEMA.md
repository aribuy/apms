# APMS Database Schema (Sprint 4)

**Database:** PostgreSQL
**Source of Truth:** `backend/prisma/schema.prisma` (+ operational tables noted below)

---

## Overview
The APMS database is multi-tenant and workspace-scoped. Core entities include users, workspaces, tasks, sites, ATP documents, and audit logs. Workspace-scoped master data uses versioned config tables.

---

## Core Tables

### users
- **Purpose:** User accounts and authentication data.
- **Key Columns:** `id` (PK), `email` (unique), `username`, `role`, `password_hash`, `status`, `userType`, `created_at`, `updated_at`
- **Relations:**
  - `audit_logs` (1:N)
  - `refresh_tokens` (1:N)
  - `tasks` (1:N via assigned_to/assigned_by)

### workspaces
- **Purpose:** Tenant/workspace container.
- **Key Columns:** `id` (UUID PK), `code` (unique), `name`, `customer_group_id`, `vendor_owner_id`, `is_active`, `created_at`, `updated_at`
- **Relations:**
  - `tasks` (1:N)
  - `sites` (1:N)
  - `config_versions` (1:N)

### workspace_members (operational)
- **Purpose:** User membership + role per workspace.
- **Key Columns:** `id` (PK), `workspace_id` (UUID), `user_id`, `role`, `is_default`, `created_at`, `updated_at`
- **Notes:** Table exists in production and is used by workspace context APIs. It is not currently modeled in Prisma schema.

### tasks
- **Purpose:** Task tracking and workflow.
- **Key Columns:** `id`, `task_code`, `task_type`, `title`, `status`, `priority`, `assigned_to`, `site_id`, `workspace_id`, `due_date`
- **Relations:**
  - `users` (assigned_to/assigned_by)
  - `sites` (N:1)

### sites
- **Purpose:** Site registry with workflow state.
- **Key Columns:** `id`, `site_id` (unique), `site_name`, `region`, `city`, `status`, `workspace_id`, `workflow_stage`

---

## ATP & Document Flow

### atp_documents
- **Purpose:** ATP document metadata and workflow state.
- **Key Columns:** `id`, `atp_code`, `site_id`, `document_type`, `current_status`, `current_stage`, `submission_date`

### atp_review_stages
- **Purpose:** Multi-stage ATP review workflow.
- **Key Columns:** `id`, `atp_id`, `stage_number`, `stage_name`, `review_status`, `reviewer_id`, `decision`

### atp_punchlist_items
- **Purpose:** Punchlist issues raised during review.
- **Key Columns:** `id`, `atp_id`, `review_stage_id`, `severity`, `issue_description`, `status`

---

## Audit & Security

### audit_logs
- **Purpose:** Immutable audit trail of sensitive operations.
- **Key Columns:** `id`, `user_id`, `workspace_id`, `action`, `resource`, `resource_id`, `old_values`, `new_values`, `created_at`

### refresh_tokens
- **Purpose:** DB-backed refresh token rotation.
- **Key Columns:** `id`, `token` (hashed), `user_id`, `expires_at`, `created_at`

---

## Workspace-Scoped Master Data (Versioned)

### config_versions
- **Purpose:** Versioned master data control per workspace.
- **Key Columns:** `id`, `workspace_id`, `version_number`, `status`, `source_type`, `created_at`

### atp_scope_master / vendor_master / approval_*_master
- **Purpose:** Workspace-scoped master data with version control.

---

## Indexing Highlights
- `users.email` unique index
- `workspaces.code` unique index
- `tasks.workspace_id` index
- `sites.workspace_id` index
- `audit_logs.user_id`, `audit_logs.workspace_id`, `audit_logs.created_at` indexes

---

## Notes & Gaps
- `workspace_members` currently managed via raw SQL and should be added to Prisma schema when possible.
- Some legacy/aux tables (ATP templates, workflows) are present but not covered here in full detail.

---

## ERD (ASCII Overview)

```
users ──< refresh_tokens
  │
  ├──< audit_logs
  ├──< tasks (assigned_to / assigned_by)
  └──< workspace_members >── workspaces ──< tasks
                              │
                              └──< sites
```

---

## Migration History (Summary)
- Sprint 4: Added `refresh_tokens` + `audit_logs` support, rate limiting, and validation.
- Sprint 1-3: Workspace + task/site filtering + operational tables updates.

