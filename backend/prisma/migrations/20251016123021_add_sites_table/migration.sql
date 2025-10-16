-- CreateEnum
CREATE TYPE "AccessLevel" AS ENUM ('NATIONAL', 'REGION', 'AREA', 'CITY');

-- CreateEnum
CREATE TYPE "GroupStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "GroupType" AS ENUM ('INTERNAL_DEPARTMENT', 'CUSTOMER', 'VENDOR', 'TOWER_PROVIDER');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING');

-- CreateEnum
CREATE TYPE "UserType" AS ENUM ('INTERNAL', 'CUSTOMER', 'VENDOR', 'TOWER_PROVIDER');

-- CreateTable
CREATE TABLE "atp_checklist_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "atp_id" UUID,
    "review_stage_id" UUID,
    "item_number" VARCHAR(20),
    "section_name" VARCHAR(200),
    "description" TEXT,
    "result" VARCHAR(20),
    "severity" VARCHAR(20),
    "has_issue" BOOLEAN DEFAULT false,
    "issue_description" TEXT,
    "evidence_attached" BOOLEAN DEFAULT false,
    "reviewer_notes" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "atp_checklist_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "atp_documents" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "atp_code" VARCHAR(50) NOT NULL,
    "site_id" VARCHAR(100) NOT NULL,
    "project_code" VARCHAR(100),
    "document_type" VARCHAR(50),
    "detected_category" VARCHAR(50),
    "category_confidence" INTEGER,
    "manual_override" BOOLEAN DEFAULT false,
    "override_reason" TEXT,
    "final_category" VARCHAR(50),
    "workflow_path" VARCHAR(50),
    "current_stage" VARCHAR(100),
    "current_status" VARCHAR(50) DEFAULT 'pending_review',
    "file_path" VARCHAR(500),
    "file_name" VARCHAR(255),
    "file_size" INTEGER,
    "mime_type" VARCHAR(100),
    "vendor_id" VARCHAR(100) DEFAULT 'aviat',
    "submitted_by" VARCHAR(100),
    "submission_date" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "submission_notes" TEXT,
    "completion_percentage" INTEGER DEFAULT 0,
    "approval_date" TIMESTAMP(6),
    "final_approver" VARCHAR(100),
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "document_version" VARCHAR(20) DEFAULT '1.0',
    "is_digital" BOOLEAN DEFAULT true,
    "template_id" VARCHAR(100),
    "form_data" JSONB,
    "attachments" JSONB DEFAULT '[]',
    "digital_signatures" JSONB DEFAULT '[]',
    "revision_history" JSONB DEFAULT '[]',

    CONSTRAINT "atp_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "atp_punchlist_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "atp_id" UUID,
    "review_stage_id" UUID,
    "punchlist_number" VARCHAR(20),
    "test_item_reference" VARCHAR(100),
    "issue_category" VARCHAR(100),
    "issue_description" TEXT,
    "severity" VARCHAR(20),
    "status" VARCHAR(50) DEFAULT 'identified',
    "assigned_team" VARCHAR(200),
    "target_completion_date" DATE,
    "evidence_before" JSONB,
    "evidence_after" JSONB,
    "rectification_notes" TEXT,
    "verification_notes" TEXT,
    "identified_by" VARCHAR(100),
    "identified_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "completed_by" VARCHAR(100),
    "completed_at" TIMESTAMP(6),
    "verified_by" VARCHAR(100),
    "verified_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "atp_punchlist_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "atp_review_stages" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "atp_id" UUID,
    "stage_number" INTEGER NOT NULL,
    "stage_code" VARCHAR(50),
    "stage_name" VARCHAR(100),
    "assigned_role" VARCHAR(50),
    "reviewer_id" VARCHAR(100),
    "review_status" VARCHAR(50) DEFAULT 'pending',
    "decision" VARCHAR(50),
    "review_started_at" TIMESTAMP(6),
    "review_completed_at" TIMESTAMP(6),
    "sla_deadline" TIMESTAMP(6),
    "comments" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "atp_review_stages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "resource_id" TEXT,
    "old_data" JSONB,
    "new_data" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_assignments" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "documentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "status" TEXT DEFAULT 'pending',

    CONSTRAINT "document_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "documentNumber" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT,
    "taskCode" TEXT,
    "version" INTEGER DEFAULT 1,
    "majorVersion" INTEGER DEFAULT 1,
    "minorVersion" INTEGER DEFAULT 0,
    "isDraft" BOOLEAN DEFAULT true,
    "formData" JSONB,
    "status" TEXT DEFAULT 'draft',
    "submittedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "dependencies" TEXT[],
    "isBlocked" BOOLEAN DEFAULT false,
    "blockReason" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "geographic_hierarchy" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "level" INTEGER NOT NULL,
    "code" VARCHAR(50),
    "name" VARCHAR(200) NOT NULL,
    "parent_id" UUID,
    "is_active" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "geographic_hierarchy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "geographic_privileges" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "level" "AccessLevel" NOT NULL,
    "parentId" TEXT,
    "code" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "geographic_privileges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "channels" TEXT[],
    "priority" TEXT DEFAULT 'normal',
    "isRead" BOOLEAN DEFAULT false,
    "readAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organizations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(200) NOT NULL,
    "code" VARCHAR(50),
    "type" VARCHAR(20) NOT NULL,
    "status" VARCHAR(20) DEFAULT 'active',
    "parent_org_id" UUID,
    "contact_email" VARCHAR(255),
    "contact_phone" VARCHAR(50),
    "address" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "processes" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "code" TEXT NOT NULL,
    "category" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "processes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_assignments" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "assignedBy" TEXT,
    "status" TEXT DEFAULT 'active',

    CONSTRAINT "project_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "projectNumber" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "executionType" TEXT NOT NULL,
    "organizationId" UUID NOT NULL,
    "workgroupId" UUID,
    "customerRef" TEXT,
    "poNumber" TEXT,
    "budget" DECIMAL(15,2),
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "status" TEXT DEFAULT 'draft',
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_processes" (
    "roleId" TEXT NOT NULL,
    "processId" TEXT NOT NULL,
    "canView" BOOLEAN NOT NULL DEFAULT true,
    "canCreate" BOOLEAN NOT NULL DEFAULT false,
    "canUpdate" BOOLEAN NOT NULL DEFAULT false,
    "canDelete" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "role_processes_pkey" PRIMARY KEY ("roleId","processId")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "group" "UserType" NOT NULL,
    "level" "AccessLevel" NOT NULL,
    "isSingle" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_types" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "workflow_config" JSONB,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "task_code" VARCHAR(50) NOT NULL,
    "task_type" VARCHAR(50) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "assigned_to" TEXT,
    "assigned_by" TEXT,
    "assigned_role" VARCHAR(50),
    "status" VARCHAR(20) DEFAULT 'pending',
    "priority" VARCHAR(20) DEFAULT 'normal',
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "started_at" TIMESTAMP(6),
    "completed_at" TIMESTAMP(6),
    "due_date" TIMESTAMP(6),
    "site_id" TEXT,
    "document_id" TEXT,
    "parent_task_id" TEXT,
    "task_data" JSONB,
    "result_data" JSONB,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "templates" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "version" TEXT DEFAULT '1.0',
    "isActive" BOOLEAN DEFAULT true,
    "config" JSONB,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_groups" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "GroupType" NOT NULL,
    "code" TEXT,
    "address" TEXT,
    "logo" TEXT,
    "contactPerson" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "manager" TEXT,
    "budget" DECIMAL(65,30),
    "location" TEXT,
    "status" "GroupStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "user_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_privileges" (
    "userId" TEXT NOT NULL,
    "privilegeId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_privileges_pkey" PRIMARY KEY ("userId","privilegeId")
);

-- CreateTable
CREATE TABLE "user_processes" (
    "userId" TEXT NOT NULL,
    "processId" TEXT NOT NULL,
    "canView" BOOLEAN NOT NULL DEFAULT true,
    "canCreate" BOOLEAN NOT NULL DEFAULT false,
    "canUpdate" BOOLEAN NOT NULL DEFAULT false,
    "canDelete" BOOLEAN NOT NULL DEFAULT false,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_processes_pkey" PRIMARY KEY ("userId","processId")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedBy" TEXT,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("userId","roleId")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT,
    "password" TEXT,
    "first_name" TEXT,
    "last_name" TEXT,
    "role" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "password_hash" TEXT,
    "last_login" TIMESTAMP(3),
    "failed_login_attempts" INTEGER DEFAULT 0,
    "account_locked_until" TIMESTAMP(3),
    "contact_number" TEXT,
    "createdBy" TEXT,
    "designation" TEXT,
    "failedAttempts" INTEGER DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lockedUntil" TIMESTAMP(3),
    "loginId" TEXT,
    "name" TEXT,
    "signature" TEXT,
    "status" "UserStatus" DEFAULT 'ACTIVE',
    "updatedBy" TEXT,
    "userGroupId" TEXT,
    "userType" "UserType",

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workgroup_members" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "workgroup_id" UUID,
    "user_id" TEXT,
    "member_role" VARCHAR(20) DEFAULT 'member',
    "joined_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "added_by" TEXT,
    "status" VARCHAR(20) DEFAULT 'active',

    CONSTRAINT "workgroup_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workgroups" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(200) NOT NULL,
    "organization_id" UUID NOT NULL,
    "workgroup_type" VARCHAR(20) NOT NULL,
    "classification" VARCHAR(20) NOT NULL,
    "category" VARCHAR(20) NOT NULL,
    "parent_workgroup_id" UUID,
    "email" VARCHAR(255),
    "max_members" INTEGER DEFAULT 100,
    "status" VARCHAR(20) DEFAULT 'active',
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workgroups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "atp_document_templates" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "template_code" VARCHAR(50) NOT NULL,
    "template_name" VARCHAR(200) NOT NULL,
    "category" VARCHAR(50) NOT NULL,
    "version" VARCHAR(20) DEFAULT '1.0',
    "is_active" BOOLEAN DEFAULT true,
    "form_schema" JSONB NOT NULL,
    "checklist_items" JSONB DEFAULT '[]',
    "workflow_config" JSONB DEFAULT '{}',
    "created_by" VARCHAR(100),
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "atp_document_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "atp_document_attachments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "atp_id" UUID,
    "file_name" VARCHAR(255) NOT NULL,
    "original_name" VARCHAR(255) NOT NULL,
    "file_path" VARCHAR(500) NOT NULL,
    "file_size" INTEGER,
    "mime_type" VARCHAR(100),
    "file_type" VARCHAR(50),
    "uploaded_by" VARCHAR(100),
    "uploaded_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "is_active" BOOLEAN DEFAULT true,

    CONSTRAINT "atp_document_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sites" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "site_id" VARCHAR(100) NOT NULL,
    "site_name" VARCHAR(255) NOT NULL,
    "site_type" VARCHAR(50) DEFAULT 'MW',
    "region" VARCHAR(100) NOT NULL,
    "city" VARCHAR(100) NOT NULL,
    "ne_latitude" DECIMAL(10,8),
    "ne_longitude" DECIMAL(11,8),
    "fe_latitude" DECIMAL(10,8),
    "fe_longitude" DECIMAL(11,8),
    "status" VARCHAR(50) DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sites_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_checklist_atp" ON "atp_checklist_items"("atp_id");

-- CreateIndex
CREATE UNIQUE INDEX "atp_documents_atp_code_key" ON "atp_documents"("atp_code");

-- CreateIndex
CREATE INDEX "idx_atp_site_id" ON "atp_documents"("site_id");

-- CreateIndex
CREATE INDEX "idx_atp_status" ON "atp_documents"("current_status");

-- CreateIndex
CREATE INDEX "idx_atp_workflow" ON "atp_documents"("workflow_path");

-- CreateIndex
CREATE UNIQUE INDEX "atp_punchlist_items_punchlist_number_key" ON "atp_punchlist_items"("punchlist_number");

-- CreateIndex
CREATE INDEX "idx_punchlist_atp" ON "atp_punchlist_items"("atp_id");

-- CreateIndex
CREATE INDEX "idx_punchlist_status" ON "atp_punchlist_items"("status");

-- CreateIndex
CREATE INDEX "idx_review_stages_atp" ON "atp_review_stages"("atp_id");

-- CreateIndex
CREATE UNIQUE INDEX "document_assignments_documentId_userId_role_key" ON "document_assignments"("documentId", "userId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "documents_documentNumber_key" ON "documents"("documentNumber");

-- CreateIndex
CREATE UNIQUE INDEX "geographic_hierarchy_code_key" ON "geographic_hierarchy"("code");

-- CreateIndex
CREATE INDEX "idx_geo_level" ON "geographic_hierarchy"("level");

-- CreateIndex
CREATE INDEX "idx_geo_parent" ON "geographic_hierarchy"("parent_id");

-- CreateIndex
CREATE UNIQUE INDEX "geographic_privileges_name_key" ON "geographic_privileges"("name");

-- CreateIndex
CREATE UNIQUE INDEX "geographic_privileges_code_key" ON "geographic_privileges"("code");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_code_key" ON "organizations"("code");

-- CreateIndex
CREATE INDEX "idx_org_type" ON "organizations"("type");

-- CreateIndex
CREATE UNIQUE INDEX "processes_name_key" ON "processes"("name");

-- CreateIndex
CREATE UNIQUE INDEX "processes_code_key" ON "processes"("code");

-- CreateIndex
CREATE UNIQUE INDEX "project_assignments_projectId_userId_role_key" ON "project_assignments"("projectId", "userId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "projects_projectNumber_key" ON "projects"("projectNumber");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "task_types_code_key" ON "task_types"("code");

-- CreateIndex
CREATE UNIQUE INDEX "tasks_task_code_key" ON "tasks"("task_code");

-- CreateIndex
CREATE INDEX "idx_tasks_assigned_status" ON "tasks"("assigned_to", "status");

-- CreateIndex
CREATE INDEX "idx_tasks_created" ON "tasks"("created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_tasks_role_status" ON "tasks"("assigned_role", "status");

-- CreateIndex
CREATE UNIQUE INDEX "templates_code_key" ON "templates"("code");

-- CreateIndex
CREATE UNIQUE INDEX "user_groups_name_key" ON "user_groups"("name");

-- CreateIndex
CREATE UNIQUE INDEX "user_groups_code_key" ON "user_groups"("code");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_loginId_key" ON "users"("loginId");

-- CreateIndex
CREATE INDEX "idx_workgroup_members_user" ON "workgroup_members"("user_id");

-- CreateIndex
CREATE INDEX "idx_workgroup_members_wg" ON "workgroup_members"("workgroup_id");

-- CreateIndex
CREATE UNIQUE INDEX "workgroup_members_workgroup_id_user_id_key" ON "workgroup_members"("workgroup_id", "user_id");

-- CreateIndex
CREATE INDEX "idx_workgroup_org" ON "workgroups"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "atp_document_templates_template_code_key" ON "atp_document_templates"("template_code");

-- CreateIndex
CREATE INDEX "idx_atp_templates_category" ON "atp_document_templates"("category");

-- CreateIndex
CREATE INDEX "idx_atp_templates_active" ON "atp_document_templates"("is_active");

-- CreateIndex
CREATE INDEX "idx_atp_attachments_atp" ON "atp_document_attachments"("atp_id");

-- CreateIndex
CREATE INDEX "idx_atp_attachments_type" ON "atp_document_attachments"("file_type");

-- CreateIndex
CREATE UNIQUE INDEX "sites_site_id_key" ON "sites"("site_id");

-- CreateIndex
CREATE INDEX "sites_region_idx" ON "sites"("region");

-- CreateIndex
CREATE INDEX "sites_status_idx" ON "sites"("status");

-- AddForeignKey
ALTER TABLE "atp_checklist_items" ADD CONSTRAINT "atp_checklist_items_atp_id_fkey" FOREIGN KEY ("atp_id") REFERENCES "atp_documents"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "atp_checklist_items" ADD CONSTRAINT "atp_checklist_items_review_stage_id_fkey" FOREIGN KEY ("review_stage_id") REFERENCES "atp_review_stages"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "atp_punchlist_items" ADD CONSTRAINT "atp_punchlist_items_atp_id_fkey" FOREIGN KEY ("atp_id") REFERENCES "atp_documents"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "atp_punchlist_items" ADD CONSTRAINT "atp_punchlist_items_review_stage_id_fkey" FOREIGN KEY ("review_stage_id") REFERENCES "atp_review_stages"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "atp_review_stages" ADD CONSTRAINT "atp_review_stages_atp_id_fkey" FOREIGN KEY ("atp_id") REFERENCES "atp_documents"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_assignments" ADD CONSTRAINT "document_assignments_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "document_assignments" ADD CONSTRAINT "document_assignments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "geographic_hierarchy" ADD CONSTRAINT "geographic_hierarchy_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "geographic_hierarchy"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "geographic_privileges" ADD CONSTRAINT "geographic_privileges_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "geographic_privileges"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_parent_org_id_fkey" FOREIGN KEY ("parent_org_id") REFERENCES "organizations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "project_assignments" ADD CONSTRAINT "project_assignments_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "project_assignments" ADD CONSTRAINT "project_assignments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_workgroupId_fkey" FOREIGN KEY ("workgroupId") REFERENCES "workgroups"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_processes" ADD CONSTRAINT "role_processes_processId_fkey" FOREIGN KEY ("processId") REFERENCES "processes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_processes" ADD CONSTRAINT "role_processes_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_parent_task_id_fkey" FOREIGN KEY ("parent_task_id") REFERENCES "tasks"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_privileges" ADD CONSTRAINT "user_privileges_privilegeId_fkey" FOREIGN KEY ("privilegeId") REFERENCES "geographic_privileges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_privileges" ADD CONSTRAINT "user_privileges_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_processes" ADD CONSTRAINT "user_processes_processId_fkey" FOREIGN KEY ("processId") REFERENCES "processes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_processes" ADD CONSTRAINT "user_processes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_userGroupId_fkey" FOREIGN KEY ("userGroupId") REFERENCES "user_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workgroup_members" ADD CONSTRAINT "workgroup_members_added_by_fkey" FOREIGN KEY ("added_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "workgroup_members" ADD CONSTRAINT "workgroup_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "workgroup_members" ADD CONSTRAINT "workgroup_members_workgroup_id_fkey" FOREIGN KEY ("workgroup_id") REFERENCES "workgroups"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "workgroups" ADD CONSTRAINT "workgroups_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "workgroups" ADD CONSTRAINT "workgroups_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "workgroups" ADD CONSTRAINT "workgroups_parent_workgroup_id_fkey" FOREIGN KEY ("parent_workgroup_id") REFERENCES "workgroups"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "atp_document_attachments" ADD CONSTRAINT "atp_document_attachments_atp_id_fkey" FOREIGN KEY ("atp_id") REFERENCES "atp_documents"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
