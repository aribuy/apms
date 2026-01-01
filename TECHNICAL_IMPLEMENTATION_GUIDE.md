# 🛠️ Technical Implementation Guide - UI Enhancements

**Date:** 2025-12-29
**Purpose:** Technical specs for React components + API routes

---

## 📦 Prerequisites & Setup

### Backend Dependencies

```json
{
  "dependencies": {
    "prisma": "^6.17.0",
    "@prisma/client": "^6.17.0",
    "jsonwebtoken": "^9.0.0",
    "bcryptjs": "^2.4.3"
  }
}
```

### Frontend Dependencies

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "@tanstack/react-query": "^5.0.0",
    "axios": "^1.6.0",
    "@mui/material": "^5.15.0",
    "@mui/x-data-grid": "^6.18.0",
    "recharts": "^2.10.0"
  }
}
```

---

## 🗄️ Database Migrations Needed

### 1. Workspace Members Table

```sql
-- File: backend/prisma/migrations/YYYYMMDDHHMMSS_add_workspace_members/migration.sql

-- Workspace members table for RBAC
CREATE TABLE workspace_members (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  role VARCHAR(50) NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fk_workspace_members_workspace FOREIGN KEY (workspace_id)
    REFERENCES workspaces(id) ON DELETE CASCADE,
  CONSTRAINT fk_workspace_members_user FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT uq_workspace_user UNIQUE(workspace_id, user_id)
);

CREATE INDEX idx_workspace_members_workspace ON workspace_members(workspace_id);
CREATE INDEX idx_workspace_members_user ON workspace_members(user_id);

COMMENT ON TABLE workspace_members IS 'Workspace membership and role assignments';
COMMENT ON COLUMN workspace_members.role IS 'Role: ADMIN, MANAGER, APPROVER, VENDOR, USER';
COMMENT ON COLUMN workspace_members.is_default IS 'User''s default workspace for login';
```

### 2. Update Prisma Schema

```prisma
// backend/prisma/schema.prisma

model WorkspaceMember {
  id            String   @id @default(dbgenerated("gen_random_uuid()"))
  workspaceId   String   @map("workspace_id")
  userId        String   @map("user_id")
  role          String   @db.VarChar(50)
  isDefault     Boolean? @default(false) @map("is_default")
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  workspace     Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  user          User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([workspaceId, userId])
  @@map("workspace_members")
}

model AuditLog {
  id          BigInt    @id @default(autoincrement())
  workspaceId String?  @map("workspace_id")
  userId      String?  @map("user_id")
  entityType  String   @map("entity_type")
  entityId    String?  @map("entity_id")
  action      String   @db.VarChar(50)
  details     Json?    @db.JsonB
  ipAddress   String?  @map("ip_address") @db.Inet
  createdAt   DateTime @default(now()) @map("created_at")

  workspace   Workspace? @relation(fields: [workspaceId], references: [id], onDelete: SetNull)
  user        User?      @relation(fields: [userId], references: [id], onDelete: SetNull)

  @@index([workspaceId, createdAt(sort: Desc)], map: "idx_audit_logs_workspace_created")
  @@index([userId, createdAt(sort: Desc)], map: "idx_audit_logs_user_created")
  @@index([entityType, entityId], map: "idx_audit_logs_entity")
  @@map("audit_logs")
}
```

---

## 🔌 API Routes Implementation

### 1. Workspace Context API

```typescript
// backend/src/routes/workspaceContextRoutes.ts

import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/v1/user/context
router.get('/context', async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get user's workspace memberships
    const memberships = await prisma.workspaceMember.findMany({
      where: { userId },
      include: {
        workspace: {
          select: {
            id: true,
            code: true,
            name: true,
            isActive: true
          }
        }
      },
      orderBy: { isDefault: 'desc' }
    });

    if (memberships.length === 0) {
      return res.status(404).json({
        error: 'No workspace membership found'
      });
    }

    const defaultMembership = memberships.find(m => m.isDefault) || memberships[0];
    const currentWorkspace = defaultMembership.workspace;

    // Get active configs
    const activeConfigs = await prisma.configVersion.findMany({
      where: {
        workspaceId: currentWorkspace.id,
        status: 'ACTIVE'
      }
    });

    res.json({
      currentWorkspace,
      userWorkspaces: memberships.map(m => ({
        id: m.workspace.id,
        code: m.workspace.code,
        name: m.workspace.name,
        role: m.role,
        isDefault: m.isDefault
      })),
      activeConfigs,
      userRole: defaultMembership.role
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
```

---

## ⚛️ React Components

### 1. Workspace Context Provider

```typescript
// frontend/src/contexts/WorkspaceContext.tsx

import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [context, setContext] = useState({
    currentWorkspace: null,
    userWorkspaces: [],
    activeConfigs: [],
    userRole: '',
    isLoading: true
  });

  const refreshContext = async () => {
    const response = await api.get('/user/context');
    setContext({
      ...response.data,
      isLoading: false
    });
  };

  useEffect(() => {
    refreshContext();
  }, []);

  return (
    <WorkspaceContext.Provider value={context}>
      {children}
    </WorkspaceContext.Provider>
  );
}
```

---

*Guide Created: 2025-12-29*
*Tech Stack: React + TypeScript + Prisma + PostgreSQL*
*Timeline: 6-8 weeks for full implementation*
