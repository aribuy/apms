--
-- PostgreSQL database dump
--

\restrict Z3dYm5KtmoGKqhsrlP4SR402eMhS2NK8NbfxLhrl02qdO95rcuTHxJ0LtfbLKZp

-- Dumped from database version 16.10 (Ubuntu 16.10-0ubuntu0.24.04.1)
-- Dumped by pg_dump version 16.10 (Ubuntu 16.10-0ubuntu0.24.04.1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: AccessLevel; Type: TYPE; Schema: public; Owner: apms_user
--

CREATE TYPE public."AccessLevel" AS ENUM (
    'NATIONAL',
    'REGION',
    'AREA',
    'CITY'
);


ALTER TYPE public."AccessLevel" OWNER TO apms_user;

--
-- Name: GroupStatus; Type: TYPE; Schema: public; Owner: apms_user
--

CREATE TYPE public."GroupStatus" AS ENUM (
    'ACTIVE',
    'INACTIVE',
    'SUSPENDED'
);


ALTER TYPE public."GroupStatus" OWNER TO apms_user;

--
-- Name: GroupType; Type: TYPE; Schema: public; Owner: apms_user
--

CREATE TYPE public."GroupType" AS ENUM (
    'INTERNAL_DEPARTMENT',
    'CUSTOMER',
    'VENDOR',
    'TOWER_PROVIDER'
);


ALTER TYPE public."GroupType" OWNER TO apms_user;

--
-- Name: UserStatus; Type: TYPE; Schema: public; Owner: apms_user
--

CREATE TYPE public."UserStatus" AS ENUM (
    'ACTIVE',
    'INACTIVE',
    'SUSPENDED',
    'PENDING'
);


ALTER TYPE public."UserStatus" OWNER TO apms_user;

--
-- Name: UserType; Type: TYPE; Schema: public; Owner: apms_user
--

CREATE TYPE public."UserType" AS ENUM (
    'INTERNAL',
    'CUSTOMER',
    'VENDOR',
    'TOWER_PROVIDER'
);


ALTER TYPE public."UserType" OWNER TO apms_user;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: apms_user
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO apms_user;

--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: apms_user
--

CREATE TABLE public.audit_logs (
    id text NOT NULL,
    user_id text NOT NULL,
    action text NOT NULL,
    resource text NOT NULL,
    resource_id text,
    old_data jsonb,
    new_data jsonb,
    ip_address text,
    user_agent text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.audit_logs OWNER TO apms_user;

--
-- Name: document_assignments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.document_assignments (
    id text DEFAULT (gen_random_uuid())::text NOT NULL,
    "documentId" text NOT NULL,
    "userId" text NOT NULL,
    role text NOT NULL,
    "assignedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP,
    "dueDate" timestamp(3) without time zone,
    "completedAt" timestamp(3) without time zone,
    status text DEFAULT 'pending'::text
);


ALTER TABLE public.document_assignments OWNER TO postgres;

--
-- Name: documents; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.documents (
    id text DEFAULT (gen_random_uuid())::text NOT NULL,
    "documentNumber" text NOT NULL,
    "projectId" text NOT NULL,
    title text NOT NULL,
    type text NOT NULL,
    category text,
    "taskCode" text,
    version integer DEFAULT 1,
    "majorVersion" integer DEFAULT 1,
    "minorVersion" integer DEFAULT 0,
    "isDraft" boolean DEFAULT true,
    "formData" jsonb,
    status text DEFAULT 'draft'::text,
    "submittedAt" timestamp(3) without time zone,
    "completedAt" timestamp(3) without time zone,
    dependencies text[],
    "isBlocked" boolean DEFAULT false,
    "blockReason" text,
    "createdById" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.documents OWNER TO postgres;

--
-- Name: geographic_hierarchy; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.geographic_hierarchy (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    level integer NOT NULL,
    code character varying(50),
    name character varying(200) NOT NULL,
    parent_id uuid,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT geographic_hierarchy_level_check CHECK ((level = ANY (ARRAY[1, 2, 3, 4])))
);


ALTER TABLE public.geographic_hierarchy OWNER TO postgres;

--
-- Name: geographic_privileges; Type: TABLE; Schema: public; Owner: apms_user
--

CREATE TABLE public.geographic_privileges (
    id text NOT NULL,
    name text NOT NULL,
    level public."AccessLevel" NOT NULL,
    "parentId" text,
    code text NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL
);


ALTER TABLE public.geographic_privileges OWNER TO apms_user;

--
-- Name: notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notifications (
    id text DEFAULT (gen_random_uuid())::text NOT NULL,
    "userId" text NOT NULL,
    type text NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    "entityType" text,
    "entityId" text,
    channels text[],
    priority text DEFAULT 'normal'::text,
    "isRead" boolean DEFAULT false,
    "readAt" timestamp(3) without time zone,
    "sentAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" timestamp(3) without time zone
);


ALTER TABLE public.notifications OWNER TO postgres;

--
-- Name: organizations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.organizations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(200) NOT NULL,
    code character varying(50),
    type character varying(20) NOT NULL,
    status character varying(20) DEFAULT 'active'::character varying,
    parent_org_id uuid,
    contact_email character varying(255),
    contact_phone character varying(50),
    address text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT organizations_type_check CHECK (((type)::text = ANY ((ARRAY['internal'::character varying, 'customer'::character varying, 'vendor'::character varying, 'tower_provider'::character varying, 'subcon'::character varying])::text[])))
);


ALTER TABLE public.organizations OWNER TO postgres;

--
-- Name: processes; Type: TABLE; Schema: public; Owner: apms_user
--

CREATE TABLE public.processes (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    code text NOT NULL,
    category text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.processes OWNER TO apms_user;

--
-- Name: project_assignments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.project_assignments (
    id text DEFAULT (gen_random_uuid())::text NOT NULL,
    "projectId" text NOT NULL,
    "userId" text NOT NULL,
    role text NOT NULL,
    "assignedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP,
    "assignedBy" text,
    status text DEFAULT 'active'::text
);


ALTER TABLE public.project_assignments OWNER TO postgres;

--
-- Name: projects; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.projects (
    id text DEFAULT (gen_random_uuid())::text NOT NULL,
    "projectNumber" text NOT NULL,
    name text NOT NULL,
    description text,
    "executionType" text NOT NULL,
    "organizationId" uuid NOT NULL,
    "workgroupId" uuid,
    "customerRef" text,
    "poNumber" text,
    budget numeric(15,2),
    "startDate" timestamp(3) without time zone,
    "endDate" timestamp(3) without time zone,
    status text DEFAULT 'draft'::text,
    "createdById" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.projects OWNER TO postgres;

--
-- Name: refresh_tokens; Type: TABLE; Schema: public; Owner: apms_user
--

CREATE TABLE public.refresh_tokens (
    id text NOT NULL,
    token text NOT NULL,
    user_id text NOT NULL,
    expires_at timestamp(3) without time zone NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.refresh_tokens OWNER TO apms_user;

--
-- Name: role_processes; Type: TABLE; Schema: public; Owner: apms_user
--

CREATE TABLE public.role_processes (
    "roleId" text NOT NULL,
    "processId" text NOT NULL,
    "canView" boolean DEFAULT true NOT NULL,
    "canCreate" boolean DEFAULT false NOT NULL,
    "canUpdate" boolean DEFAULT false NOT NULL,
    "canDelete" boolean DEFAULT false NOT NULL
);


ALTER TABLE public.role_processes OWNER TO apms_user;

--
-- Name: roles; Type: TABLE; Schema: public; Owner: apms_user
--

CREATE TABLE public.roles (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    "group" public."UserType" NOT NULL,
    level public."AccessLevel" NOT NULL,
    "isSingle" boolean DEFAULT false NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.roles OWNER TO apms_user;

--
-- Name: templates; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.templates (
    id text DEFAULT (gen_random_uuid())::text NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    category text NOT NULL,
    version text DEFAULT '1.0'::text,
    "isActive" boolean DEFAULT true,
    config jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.templates OWNER TO postgres;

--
-- Name: user_groups; Type: TABLE; Schema: public; Owner: apms_user
--

CREATE TABLE public.user_groups (
    id text NOT NULL,
    name text NOT NULL,
    type public."GroupType" NOT NULL,
    code text,
    address text,
    logo text,
    "contactPerson" text,
    phone text,
    email text,
    manager text,
    budget numeric(65,30),
    location text,
    status public."GroupStatus" DEFAULT 'ACTIVE'::public."GroupStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "createdBy" text,
    "updatedBy" text
);


ALTER TABLE public.user_groups OWNER TO apms_user;

--
-- Name: user_privileges; Type: TABLE; Schema: public; Owner: apms_user
--

CREATE TABLE public.user_privileges (
    "userId" text NOT NULL,
    "privilegeId" text NOT NULL,
    "assignedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.user_privileges OWNER TO apms_user;

--
-- Name: user_processes; Type: TABLE; Schema: public; Owner: apms_user
--

CREATE TABLE public.user_processes (
    "userId" text NOT NULL,
    "processId" text NOT NULL,
    "canView" boolean DEFAULT true NOT NULL,
    "canCreate" boolean DEFAULT false NOT NULL,
    "canUpdate" boolean DEFAULT false NOT NULL,
    "canDelete" boolean DEFAULT false NOT NULL,
    "assignedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.user_processes OWNER TO apms_user;

--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: apms_user
--

CREATE TABLE public.user_roles (
    "userId" text NOT NULL,
    "roleId" text NOT NULL,
    "assignedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "assignedBy" text
);


ALTER TABLE public.user_roles OWNER TO apms_user;

--
-- Name: users; Type: TABLE; Schema: public; Owner: apms_user
--

CREATE TABLE public.users (
    id text NOT NULL,
    email text NOT NULL,
    username text,
    password text,
    first_name text,
    last_name text,
    role text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    password_hash text,
    last_login timestamp(3) without time zone,
    failed_login_attempts integer DEFAULT 0,
    account_locked_until timestamp(3) without time zone,
    contact_number text,
    "createdBy" text,
    designation text,
    "failedAttempts" integer DEFAULT 0,
    "isActive" boolean DEFAULT true NOT NULL,
    "lockedUntil" timestamp(3) without time zone,
    "loginId" text,
    name text,
    signature text,
    status public."UserStatus" DEFAULT 'ACTIVE'::public."UserStatus",
    "updatedBy" text,
    "userGroupId" text,
    "userType" public."UserType"
);


ALTER TABLE public.users OWNER TO apms_user;

--
-- Name: workgroup_members; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.workgroup_members (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    workgroup_id uuid,
    user_id text,
    member_role character varying(20) DEFAULT 'member'::character varying,
    joined_at timestamp without time zone DEFAULT now(),
    added_by text,
    status character varying(20) DEFAULT 'active'::character varying
);


ALTER TABLE public.workgroup_members OWNER TO postgres;

--
-- Name: workgroups; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.workgroups (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(200) NOT NULL,
    organization_id uuid NOT NULL,
    workgroup_type character varying(20) NOT NULL,
    classification character varying(20) NOT NULL,
    category character varying(20) NOT NULL,
    parent_workgroup_id uuid,
    email character varying(255),
    max_members integer DEFAULT 100,
    status character varying(20) DEFAULT 'active'::character varying,
    created_at timestamp without time zone DEFAULT now(),
    created_by text,
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT workgroups_category_check CHECK (((category)::text = ANY ((ARRAY['Internal'::character varying, 'Customer'::character varying, 'Subcon'::character varying, 'Vendor'::character varying, 'Tower Provider'::character varying])::text[]))),
    CONSTRAINT workgroups_classification_check CHECK (((classification)::text = ANY ((ARRAY['team'::character varying, 'functional_group'::character varying])::text[]))),
    CONSTRAINT workgroups_workgroup_type_check CHECK (((workgroup_type)::text = ANY ((ARRAY['internal'::character varying, 'external'::character varying, 'all'::character varying])::text[])))
);


ALTER TABLE public.workgroups OWNER TO postgres;

--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: apms_user
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
ff7d4f8d-ab38-4b21-bec7-a8851009dd4e	ab1873d00eee3212fd8be719b7e217e7e13c1b212ab15145ae836e78cc1455b4	2025-09-08 07:42:32.715367+00	20240101000000_baseline		\N	2025-09-08 07:42:32.715367+00	0
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: apms_user
--

COPY public.audit_logs (id, user_id, action, resource, resource_id, old_data, new_data, ip_address, user_agent, created_at) FROM stdin;
\.


--
-- Data for Name: document_assignments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.document_assignments (id, "documentId", "userId", role, "assignedAt", "dueDate", "completedAt", status) FROM stdin;
\.


--
-- Data for Name: documents; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.documents (id, "documentNumber", "projectId", title, type, category, "taskCode", version, "majorVersion", "minorVersion", "isDraft", "formData", status, "submittedAt", "completedAt", dependencies, "isBlocked", "blockReason", "createdById", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: geographic_hierarchy; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.geographic_hierarchy (id, level, code, name, parent_id, is_active, created_at, updated_at) FROM stdin;
28db4e0a-c79f-478d-bd76-61f69511011b	1	NSU	NORTH SUMATERA	\N	t	2025-09-06 14:53:21.501133	2025-09-06 14:53:21.501133
c5072f81-87b9-49b9-975b-10332f289031	1	JBT	JABODETABEK	\N	t	2025-09-06 14:53:21.501133	2025-09-06 14:53:21.501133
8b2ca0b1-50d8-42a5-9ddd-58af4670af0b	1	WJV	WEST JAVA	\N	t	2025-09-06 14:53:21.501133	2025-09-06 14:53:21.501133
c693ae56-324f-48b7-b3bb-6a0ee1958f6a	1	CJV	CENTRAL JAVA	\N	t	2025-09-06 14:53:21.501133	2025-09-06 14:53:21.501133
1d668f55-d786-469d-a818-d746602bf73f	1	EJV	EAST JAVA	\N	t	2025-09-06 14:53:21.501133	2025-09-06 14:53:21.501133
05797e58-c8af-47ad-ad8e-a53004374f2d	1	SSU	SOUTH SUMATERA	\N	t	2025-09-06 14:53:21.501133	2025-09-06 14:53:21.501133
20ee5c71-999a-4543-8f51-1bb37c9dc7f0	1	SKL	SULAWESI KALIMANTAN	\N	t	2025-09-06 14:53:21.501133	2025-09-06 14:53:21.501133
b80f0ebe-2092-4b8f-9b49-515b4a3763ab	2	MDN	MEDAN	28db4e0a-c79f-478d-bd76-61f69511011b	t	2025-09-06 14:53:21.506168	2025-09-06 14:53:21.506168
a54a5e0b-1c27-44b7-b105-d8e873200a19	2	JKT	JAKARTA	c5072f81-87b9-49b9-975b-10332f289031	t	2025-09-06 14:53:21.506168	2025-09-06 14:53:21.506168
91598f88-cb44-43f2-9a91-c8a205565c84	2	BDG	BANDUNG	8b2ca0b1-50d8-42a5-9ddd-58af4670af0b	t	2025-09-06 14:53:21.506168	2025-09-06 14:53:21.506168
90529532-ceec-43cd-9909-e8dd302c8b49	2	SMG	SEMARANG	c693ae56-324f-48b7-b3bb-6a0ee1958f6a	t	2025-09-06 14:53:21.506168	2025-09-06 14:53:21.506168
0c898a79-fd6d-4c71-b127-1d4138b7fc30	2	SBY	SURABAYA	1d668f55-d786-469d-a818-d746602bf73f	t	2025-09-06 14:53:21.506168	2025-09-06 14:53:21.506168
a691ed16-067c-425b-87b0-285d8304fac8	2	PLB	PALEMBANG	05797e58-c8af-47ad-ad8e-a53004374f2d	t	2025-09-06 14:53:21.506168	2025-09-06 14:53:21.506168
a66c08a7-e3de-47b0-9dc4-1e8e2d8921bb	2	BPN	BALIKPAPAN	20ee5c71-999a-4543-8f51-1bb37c9dc7f0	t	2025-09-06 14:53:21.506168	2025-09-06 14:53:21.506168
\.


--
-- Data for Name: geographic_privileges; Type: TABLE DATA; Schema: public; Owner: apms_user
--

COPY public.geographic_privileges (id, name, level, "parentId", code, "isActive") FROM stdin;
cmf80asdu0007ji4wsostqrxk	National	NATIONAL	\N	NAT-ID	t
cmf80asdx0009ji4wgwuwv6vu	West Java Region	REGION	cmf80asdu0007ji4wsostqrxk	REG-JABAR	t
cmf80asdz000bji4wks8u5tw1	Bandung Area	AREA	cmf80asdx0009ji4wgwuwv6vu	AREA-BDG	t
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notifications (id, "userId", type, title, message, "entityType", "entityId", channels, priority, "isRead", "readAt", "sentAt", "createdAt", "expiresAt") FROM stdin;
\.


--
-- Data for Name: organizations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.organizations (id, name, code, type, status, parent_org_id, contact_email, contact_phone, address, created_at, updated_at) FROM stdin;
b42ebd70-14aa-402c-a38b-6d0640f22f88	INTERNAL TELECORE	TELECORE	internal	active	\N	\N	\N	\N	2025-09-06 14:53:39.575278	2025-09-06 14:53:39.575278
f9170d5c-1f0e-400b-9076-71ab9eea5eab	PT XLSMART Telecom Sejahtera Tbk	XLSMART	customer	active	\N	\N	\N	\N	2025-09-06 14:53:39.575278	2025-09-06 14:53:39.575278
65fc4193-6f79-43c5-80c9-1a5bcb214ce2	PT MILANO TEKNOLOGI INDONESIA	MILANO	subcon	active	\N	\N	\N	\N	2025-09-06 14:53:39.575278	2025-09-06 14:53:39.575278
14b00315-4615-4c8f-960d-f7f03f6ea9c7	PT TOWER BERSAMA	TBS	tower_provider	active	\N	\N	\N	\N	2025-09-06 14:53:39.575278	2025-09-06 14:53:39.575278
68731ae8-ab58-425d-aca3-bfa6343668b4	PT PROFESIONAL TELEKOMUNIKASI	PROTELINDO	tower_provider	active	\N	\N	\N	\N	2025-09-06 14:53:39.575278	2025-09-06 14:53:39.575278
157583b4-4ee9-4823-95b1-51ae28eab3dd	ZTE CORPORATION	ZTE	vendor	active	\N	\N	\N	\N	2025-09-06 14:53:39.575278	2025-09-06 14:53:39.575278
2c24f534-fdf3-4be4-b661-bb4bc067f0cb	PT HUAWEI TECH INVESTMENT	HUAWEI	vendor	active	\N	\N	\N	\N	2025-09-06 14:53:39.575278	2025-09-06 14:53:39.575278
443b093e-3666-4811-9184-03da0f94a5df	PT DAYAMITRA TELEKOMUNIKASI	DAYAMITRA	vendor	active	\N	\N	\N	\N	2025-09-06 14:53:39.575278	2025-09-06 14:53:39.575278
e7e02e80-2792-49e6-b3a5-bdadf4cfcaa1	PT KENCANA MANDIRI SEJAHTERA	KMS	subcon	active	\N	\N	\N	\N	2025-09-06 14:53:39.575278	2025-09-06 14:53:39.575278
\.


--
-- Data for Name: processes; Type: TABLE DATA; Schema: public; Owner: apms_user
--

COPY public.processes (id, name, description, code, category, "isActive", "createdAt", "updatedAt") FROM stdin;
cmf80ase0000cji4wl3ypkrlz	Asset Management	\N	ASSET	Core Operations	t	2025-09-06 08:32:57.912	2025-09-06 08:32:57.912
cmf80ase2000dji4wc4d4g8tz	Maintenance Scheduling	\N	MAINTENANCE	Operations	t	2025-09-06 08:32:57.914	2025-09-06 08:32:57.914
cmf80ase3000eji4whvdzpxc1	Report Generation	\N	REPORTING	Analytics	t	2025-09-06 08:32:57.915	2025-09-06 08:32:57.915
cmf80ase4000fji4w5vwprvkb	User Management	\N	USER_MGMT	Administration	t	2025-09-06 08:32:57.916	2025-09-06 08:32:57.916
\.


--
-- Data for Name: project_assignments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.project_assignments (id, "projectId", "userId", role, "assignedAt", "assignedBy", status) FROM stdin;
\.


--
-- Data for Name: projects; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.projects (id, "projectNumber", name, description, "executionType", "organizationId", "workgroupId", "customerRef", "poNumber", budget, "startDate", "endDate", status, "createdById", "createdAt", "updatedAt") FROM stdin;
acc0a854-ad0f-4c19-805f-ecba13aab7bf	PRJ-2025-003	Updated Test Project	This project has been updated	internal	b42ebd70-14aa-402c-a38b-6d0640f22f88	\N	\N	\N	\N	\N	\N	in_progress	superadmin_1756656810.841223	2025-09-08 10:10:37.59	2025-09-08 10:14:26.179
\.


--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: public; Owner: apms_user
--

COPY public.refresh_tokens (id, token, user_id, expires_at, created_at) FROM stdin;
\.


--
-- Data for Name: role_processes; Type: TABLE DATA; Schema: public; Owner: apms_user
--

COPY public.role_processes ("roleId", "processId", "canView", "canCreate", "canUpdate", "canDelete") FROM stdin;
cmf80ase5000gji4wmp334zs7	cmf80ase0000cji4wl3ypkrlz	t	t	t	t
cmf80ase5000gji4wmp334zs7	cmf80ase2000dji4wc4d4g8tz	t	t	t	t
cmf80ase5000gji4wmp334zs7	cmf80ase3000eji4whvdzpxc1	t	t	t	t
cmf80ase5000gji4wmp334zs7	cmf80ase4000fji4w5vwprvkb	t	t	t	t
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: apms_user
--

COPY public.roles (id, name, description, "group", level, "isSingle", "isActive", "createdAt", "updatedAt") FROM stdin;
cmf80ase5000gji4wmp334zs7	Super Administrator	Full system access	INTERNAL	NATIONAL	t	t	2025-09-06 08:32:57.917	2025-09-06 08:32:57.917
cmf80ase8000hji4wh9ykc3fg	System Administrator	System administration	INTERNAL	NATIONAL	f	t	2025-09-06 08:32:57.921	2025-09-06 08:32:57.921
\.


--
-- Data for Name: templates; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.templates (id, code, name, category, version, "isActive", config, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: user_groups; Type: TABLE DATA; Schema: public; Owner: apms_user
--

COPY public.user_groups (id, name, type, code, address, logo, "contactPerson", phone, email, manager, budget, location, status, "createdAt", "updatedAt", "createdBy", "updatedBy") FROM stdin;
cmf80asdh0000ji4wv4ln66de	Information Technology	INTERNAL_DEPARTMENT	IT	Jl. Sudirman No. 123, Jakarta	\N	\N	+62-21-1234567	it@telecore.com	CTO TeleCore	500000000.000000000000000000000000000000	Jakarta HQ - Floor 12	ACTIVE	2025-09-06 08:32:57.893	2025-09-06 08:32:57.893	\N	\N
cmf80asdm0001ji4wvrhnf7xi	Network Engineering	INTERNAL_DEPARTMENT	ENG	Jl. Sudirman No. 123, Jakarta	\N	\N	+62-21-1234568	engineering@telecore.com	VP Engineering	750000000.000000000000000000000000000000	Jakarta HQ - Floor 10	ACTIVE	2025-09-06 08:32:57.899	2025-09-06 08:32:57.899	\N	\N
cmf80asdo0002ji4wpxbcvpjk	Field Operations	INTERNAL_DEPARTMENT	OPS	Various Locations	\N	\N	+62-21-1234569	operations@telecore.com	Operations Director	1000000000.000000000000000000000000000000	Multiple Field Offices	ACTIVE	2025-09-06 08:32:57.9	2025-09-06 08:32:57.9	\N	\N
cmf80asdp0003ji4wuogst3se	Finance & Administration	INTERNAL_DEPARTMENT	FIN	Jl. Sudirman No. 123, Jakarta	\N	\N	+62-21-1234570	finance@telecore.com	CFO TeleCore	250000000.000000000000000000000000000000	Jakarta HQ - Floor 8	ACTIVE	2025-09-06 08:32:57.901	2025-09-06 08:32:57.901	\N	\N
cmf80asdq0004ji4wp4twlnkz	TeleCore Vendor Partners	VENDOR	\N	Jakarta, Indonesia	\N	John Doe	+62-21-1234567	vendor@telecore.com	\N	\N	\N	ACTIVE	2025-09-06 08:32:57.903	2025-09-06 08:32:57.903	\N	\N
cmf80asds0005ji4wlk35f29c	National Tower Provider	TOWER_PROVIDER	\N	Bandung, Indonesia	\N	Jane Smith	+62-22-7654321	tp@telecore.com	\N	\N	\N	ACTIVE	2025-09-06 08:32:57.904	2025-09-06 08:32:57.904	\N	\N
cmf80asdt0006ji4wc6zmo001	Enterprise Customer Group	CUSTOMER	\N	Surabaya, Indonesia	\N	Mike Johnson	+62-31-9876543	customer@telecore.com	\N	\N	\N	ACTIVE	2025-09-06 08:32:57.905	2025-09-06 08:32:57.905	\N	\N
\.


--
-- Data for Name: user_privileges; Type: TABLE DATA; Schema: public; Owner: apms_user
--

COPY public.user_privileges ("userId", "privilegeId", "assignedAt") FROM stdin;
\.


--
-- Data for Name: user_processes; Type: TABLE DATA; Schema: public; Owner: apms_user
--

COPY public.user_processes ("userId", "processId", "canView", "canCreate", "canUpdate", "canDelete", "assignedAt") FROM stdin;
\.


--
-- Data for Name: user_roles; Type: TABLE DATA; Schema: public; Owner: apms_user
--

COPY public.user_roles ("userId", "roleId", "assignedAt", "assignedBy") FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: apms_user
--

COPY public.users (id, email, username, password, first_name, last_name, role, created_at, updated_at, password_hash, last_login, failed_login_attempts, account_locked_until, contact_number, "createdBy", designation, "failedAttempts", "isActive", "lockedUntil", "loginId", name, signature, status, "updatedBy", "userGroupId", "userType") FROM stdin;
superadmin_1756656810.841223	superadmin@apms.com	superadmin	DEPRECATED_FIELD	\N	\N	admin	2025-08-31 16:13:30.841	2025-08-31 16:13:30.841	$2b$12$LQv3c1yqBwEHxk03FSaQOOkHnOpyy8R8bLcSbYrEKTmSInOsHKGkK	\N	0	\N	\N	\N	\N	0	t	\N	\N	\N	\N	ACTIVE	\N	\N	\N
cmezu3img0000jiaj1w1jfcj1	admin@telecore.com	admin	temp_password	System	Administrator	admin	2025-08-31 15:17:11.56	2025-09-06 09:05:02.818	$2b$12$7Mep4L3uQ/HmeUjYt5kItew1KRLfS/pdEGbC6Z7YRoJHMhYdf4CNS	2025-09-06 09:05:02.817	0	\N	\N	\N	\N	0	t	\N	\N	\N	\N	ACTIVE	\N	\N	\N
cmf82iovz0000ji8rkzpbf753	manager@telecore.com	manager	\N	\N	\N	\N	2025-09-06 09:35:05.855	2025-09-06 09:35:05.855	$2b$10$9BLwcyVNQv0jn2rUE0Y4X.qxjiWPU2Qf4Q1btsKBoq1Oh1xLIFMo.	\N	0	\N	\N	\N	\N	0	t	\N	\N	\N	\N	ACTIVE	\N	\N	INTERNAL
cmf82iow60001ji8ry2ssrwsf	vendor1@example.com	vendor1	\N	\N	\N	\N	2025-09-06 09:35:05.863	2025-09-06 09:35:05.863	$2b$10$9BLwcyVNQv0jn2rUE0Y4X.qxjiWPU2Qf4Q1btsKBoq1Oh1xLIFMo.	\N	0	\N	\N	\N	\N	0	t	\N	\N	\N	\N	ACTIVE	\N	\N	VENDOR
cmf82iow90002ji8rjchstbin	tower1@example.com	tower1	\N	\N	\N	\N	2025-09-06 09:35:05.866	2025-09-06 09:35:05.866	$2b$10$9BLwcyVNQv0jn2rUE0Y4X.qxjiWPU2Qf4Q1btsKBoq1Oh1xLIFMo.	\N	0	\N	\N	\N	\N	0	t	\N	\N	\N	\N	ACTIVE	\N	\N	TOWER_PROVIDER
cmf82kcj50001ji9hgwmyba9h	test@telecore.com	updateduser	\N	\N	\N	\N	2025-09-06 09:36:23.153	2025-09-06 09:37:26.05	$2b$10$dDD16ZSd5G5/DGNVejf2pedla.i7JubG5g6Dqd6tnzCaXRKkW6qh2	\N	0	\N	\N	\N	\N	0	t	\N	\N	\N	\N	INACTIVE	\N	\N	INTERNAL
cf372b42-8d13-4668-99b3-5f35e53f404d	newuser@telecore.com	newuser	\N	\N	\N	\N	2025-09-08 02:52:12.329	2025-09-08 02:52:12.329	\N	\N	0	\N	+62812345678	\N	\N	0	t	\N	\N	New User	\N	ACTIVE	\N	\N	INTERNAL
cmf88efol0001jiz8mpe14z8r	test@gmail.com	test	\N	\N	\N	\N	2025-09-06 12:19:44.996	2025-09-08 02:52:12.373	$2b$10$/dyMtiMWYfHc1CP6We6oNOFxESb2oQPrQtKdmyvQxxffSMTkM1D1O	\N	0	\N	+62899999999	\N	\N	0	t	\N	\N	Updated Name	\N	ACTIVE	\N	\N	INTERNAL
\.


--
-- Data for Name: workgroup_members; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.workgroup_members (id, workgroup_id, user_id, member_role, joined_at, added_by, status) FROM stdin;
\.


--
-- Data for Name: workgroups; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.workgroups (id, name, organization_id, workgroup_type, classification, category, parent_workgroup_id, email, max_members, status, created_at, created_by, updated_at) FROM stdin;
e539df87-62b9-41b9-bd2e-98e1888bbb0e	HQ Operations Team	b42ebd70-14aa-402c-a38b-6d0640f22f88	internal	team	Internal	\N	\N	100	active	2025-09-06 14:53:50.110255	cmezu3img0000jiaj1w1jfcj1	2025-09-06 14:53:50.110255
6930773b-b5c0-4a98-b60c-a7ba9ec47572	Field Operations Surabaya	65fc4193-6f79-43c5-80c9-1a5bcb214ce2	external	team	Subcon	\N	\N	100	active	2025-09-06 14:53:50.110255	cmezu3img0000jiaj1w1jfcj1	2025-09-06 14:53:50.110255
4f103ff2-834d-4a59-b51b-b46f2cb11289	Network Planning Division	f9170d5c-1f0e-400b-9076-71ab9eea5eab	internal	functional_group	Customer	\N	\N	100	active	2025-09-06 14:53:50.110255	cmezu3img0000jiaj1w1jfcj1	2025-09-06 14:53:50.110255
efd13380-8ed6-4970-a140-b2d30680d8ed	Tower Installation Team	14b00315-4615-4c8f-960d-f7f03f6ea9c7	external	team	Tower Provider	\N	\N	100	active	2025-09-06 14:53:50.110255	cmezu3img0000jiaj1w1jfcj1	2025-09-06 14:53:50.110255
\.


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: apms_user
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: apms_user
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: document_assignments document_assignments_documentId_userId_role_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_assignments
    ADD CONSTRAINT "document_assignments_documentId_userId_role_key" UNIQUE ("documentId", "userId", role);


--
-- Name: document_assignments document_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_assignments
    ADD CONSTRAINT document_assignments_pkey PRIMARY KEY (id);


--
-- Name: documents documents_documentNumber_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT "documents_documentNumber_key" UNIQUE ("documentNumber");


--
-- Name: documents documents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_pkey PRIMARY KEY (id);


--
-- Name: geographic_hierarchy geographic_hierarchy_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.geographic_hierarchy
    ADD CONSTRAINT geographic_hierarchy_code_key UNIQUE (code);


--
-- Name: geographic_hierarchy geographic_hierarchy_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.geographic_hierarchy
    ADD CONSTRAINT geographic_hierarchy_pkey PRIMARY KEY (id);


--
-- Name: geographic_privileges geographic_privileges_pkey; Type: CONSTRAINT; Schema: public; Owner: apms_user
--

ALTER TABLE ONLY public.geographic_privileges
    ADD CONSTRAINT geographic_privileges_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: organizations organizations_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_code_key UNIQUE (code);


--
-- Name: organizations organizations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_pkey PRIMARY KEY (id);


--
-- Name: processes processes_pkey; Type: CONSTRAINT; Schema: public; Owner: apms_user
--

ALTER TABLE ONLY public.processes
    ADD CONSTRAINT processes_pkey PRIMARY KEY (id);


--
-- Name: project_assignments project_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_assignments
    ADD CONSTRAINT project_assignments_pkey PRIMARY KEY (id);


--
-- Name: project_assignments project_assignments_projectId_userId_role_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_assignments
    ADD CONSTRAINT "project_assignments_projectId_userId_role_key" UNIQUE ("projectId", "userId", role);


--
-- Name: projects projects_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_pkey PRIMARY KEY (id);


--
-- Name: projects projects_projectNumber_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT "projects_projectNumber_key" UNIQUE ("projectNumber");


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: apms_user
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: role_processes role_processes_pkey; Type: CONSTRAINT; Schema: public; Owner: apms_user
--

ALTER TABLE ONLY public.role_processes
    ADD CONSTRAINT role_processes_pkey PRIMARY KEY ("roleId", "processId");


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: apms_user
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: templates templates_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.templates
    ADD CONSTRAINT templates_code_key UNIQUE (code);


--
-- Name: templates templates_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.templates
    ADD CONSTRAINT templates_pkey PRIMARY KEY (id);


--
-- Name: user_groups user_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: apms_user
--

ALTER TABLE ONLY public.user_groups
    ADD CONSTRAINT user_groups_pkey PRIMARY KEY (id);


--
-- Name: user_privileges user_privileges_pkey; Type: CONSTRAINT; Schema: public; Owner: apms_user
--

ALTER TABLE ONLY public.user_privileges
    ADD CONSTRAINT user_privileges_pkey PRIMARY KEY ("userId", "privilegeId");


--
-- Name: user_processes user_processes_pkey; Type: CONSTRAINT; Schema: public; Owner: apms_user
--

ALTER TABLE ONLY public.user_processes
    ADD CONSTRAINT user_processes_pkey PRIMARY KEY ("userId", "processId");


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: apms_user
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY ("userId", "roleId");


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: apms_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: workgroup_members workgroup_members_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.workgroup_members
    ADD CONSTRAINT workgroup_members_pkey PRIMARY KEY (id);


--
-- Name: workgroup_members workgroup_members_workgroup_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.workgroup_members
    ADD CONSTRAINT workgroup_members_workgroup_id_user_id_key UNIQUE (workgroup_id, user_id);


--
-- Name: workgroups workgroups_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.workgroups
    ADD CONSTRAINT workgroups_pkey PRIMARY KEY (id);


--
-- Name: geographic_privileges_code_key; Type: INDEX; Schema: public; Owner: apms_user
--

CREATE UNIQUE INDEX geographic_privileges_code_key ON public.geographic_privileges USING btree (code);


--
-- Name: geographic_privileges_name_key; Type: INDEX; Schema: public; Owner: apms_user
--

CREATE UNIQUE INDEX geographic_privileges_name_key ON public.geographic_privileges USING btree (name);


--
-- Name: idx_geo_level; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_geo_level ON public.geographic_hierarchy USING btree (level);


--
-- Name: idx_geo_parent; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_geo_parent ON public.geographic_hierarchy USING btree (parent_id);


--
-- Name: idx_org_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_org_type ON public.organizations USING btree (type);


--
-- Name: idx_workgroup_members_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_workgroup_members_user ON public.workgroup_members USING btree (user_id);


--
-- Name: idx_workgroup_members_wg; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_workgroup_members_wg ON public.workgroup_members USING btree (workgroup_id);


--
-- Name: idx_workgroup_org; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_workgroup_org ON public.workgroups USING btree (organization_id);


--
-- Name: processes_code_key; Type: INDEX; Schema: public; Owner: apms_user
--

CREATE UNIQUE INDEX processes_code_key ON public.processes USING btree (code);


--
-- Name: processes_name_key; Type: INDEX; Schema: public; Owner: apms_user
--

CREATE UNIQUE INDEX processes_name_key ON public.processes USING btree (name);


--
-- Name: refresh_tokens_token_key; Type: INDEX; Schema: public; Owner: apms_user
--

CREATE UNIQUE INDEX refresh_tokens_token_key ON public.refresh_tokens USING btree (token);


--
-- Name: roles_name_key; Type: INDEX; Schema: public; Owner: apms_user
--

CREATE UNIQUE INDEX roles_name_key ON public.roles USING btree (name);


--
-- Name: user_groups_code_key; Type: INDEX; Schema: public; Owner: apms_user
--

CREATE UNIQUE INDEX user_groups_code_key ON public.user_groups USING btree (code);


--
-- Name: user_groups_name_key; Type: INDEX; Schema: public; Owner: apms_user
--

CREATE UNIQUE INDEX user_groups_name_key ON public.user_groups USING btree (name);


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: apms_user
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: users_loginId_key; Type: INDEX; Schema: public; Owner: apms_user
--

CREATE UNIQUE INDEX "users_loginId_key" ON public.users USING btree ("loginId");


--
-- Name: users_username_key; Type: INDEX; Schema: public; Owner: apms_user
--

CREATE UNIQUE INDEX users_username_key ON public.users USING btree (username);


--
-- Name: audit_logs audit_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: apms_user
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: document_assignments document_assignments_documentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_assignments
    ADD CONSTRAINT "document_assignments_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES public.documents(id);


--
-- Name: document_assignments document_assignments_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_assignments
    ADD CONSTRAINT "document_assignments_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id);


--
-- Name: documents documents_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT "documents_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public.users(id);


--
-- Name: documents documents_projectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT "documents_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES public.projects(id);


--
-- Name: geographic_hierarchy geographic_hierarchy_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.geographic_hierarchy
    ADD CONSTRAINT geographic_hierarchy_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.geographic_hierarchy(id);


--
-- Name: geographic_privileges geographic_privileges_parentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: apms_user
--

ALTER TABLE ONLY public.geographic_privileges
    ADD CONSTRAINT "geographic_privileges_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES public.geographic_privileges(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: notifications notifications_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id);


--
-- Name: organizations organizations_parent_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_parent_org_id_fkey FOREIGN KEY (parent_org_id) REFERENCES public.organizations(id);


--
-- Name: project_assignments project_assignments_projectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_assignments
    ADD CONSTRAINT "project_assignments_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES public.projects(id);


--
-- Name: project_assignments project_assignments_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_assignments
    ADD CONSTRAINT "project_assignments_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id);


--
-- Name: projects projects_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT "projects_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public.users(id);


--
-- Name: projects projects_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT "projects_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id);


--
-- Name: projects projects_workgroupId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT "projects_workgroupId_fkey" FOREIGN KEY ("workgroupId") REFERENCES public.workgroups(id);


--
-- Name: refresh_tokens refresh_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: apms_user
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: role_processes role_processes_processId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: apms_user
--

ALTER TABLE ONLY public.role_processes
    ADD CONSTRAINT "role_processes_processId_fkey" FOREIGN KEY ("processId") REFERENCES public.processes(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: role_processes role_processes_roleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: apms_user
--

ALTER TABLE ONLY public.role_processes
    ADD CONSTRAINT "role_processes_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES public.roles(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_privileges user_privileges_privilegeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: apms_user
--

ALTER TABLE ONLY public.user_privileges
    ADD CONSTRAINT "user_privileges_privilegeId_fkey" FOREIGN KEY ("privilegeId") REFERENCES public.geographic_privileges(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_privileges user_privileges_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: apms_user
--

ALTER TABLE ONLY public.user_privileges
    ADD CONSTRAINT "user_privileges_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_processes user_processes_processId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: apms_user
--

ALTER TABLE ONLY public.user_processes
    ADD CONSTRAINT "user_processes_processId_fkey" FOREIGN KEY ("processId") REFERENCES public.processes(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_processes user_processes_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: apms_user
--

ALTER TABLE ONLY public.user_processes
    ADD CONSTRAINT "user_processes_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_roles user_roles_roleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: apms_user
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT "user_roles_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES public.roles(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_roles user_roles_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: apms_user
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT "user_roles_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: users users_userGroupId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: apms_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "users_userGroupId_fkey" FOREIGN KEY ("userGroupId") REFERENCES public.user_groups(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: workgroup_members workgroup_members_added_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.workgroup_members
    ADD CONSTRAINT workgroup_members_added_by_fkey FOREIGN KEY (added_by) REFERENCES public.users(id);


--
-- Name: workgroup_members workgroup_members_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.workgroup_members
    ADD CONSTRAINT workgroup_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: workgroup_members workgroup_members_workgroup_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.workgroup_members
    ADD CONSTRAINT workgroup_members_workgroup_id_fkey FOREIGN KEY (workgroup_id) REFERENCES public.workgroups(id) ON DELETE CASCADE;


--
-- Name: workgroups workgroups_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.workgroups
    ADD CONSTRAINT workgroups_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: workgroups workgroups_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.workgroups
    ADD CONSTRAINT workgroups_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id);


--
-- Name: workgroups workgroups_parent_workgroup_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.workgroups
    ADD CONSTRAINT workgroups_parent_workgroup_id_fkey FOREIGN KEY (parent_workgroup_id) REFERENCES public.workgroups(id);


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: pg_database_owner
--

GRANT ALL ON SCHEMA public TO apms_user;


--
-- Name: TABLE document_assignments; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.document_assignments TO apms_user;


--
-- Name: TABLE documents; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.documents TO apms_user;


--
-- Name: TABLE geographic_hierarchy; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.geographic_hierarchy TO apms_user;


--
-- Name: TABLE notifications; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.notifications TO apms_user;


--
-- Name: TABLE organizations; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.organizations TO apms_user;


--
-- Name: TABLE project_assignments; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.project_assignments TO apms_user;


--
-- Name: TABLE projects; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.projects TO apms_user;


--
-- Name: TABLE templates; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.templates TO apms_user;


--
-- Name: TABLE workgroup_members; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.workgroup_members TO apms_user;


--
-- Name: TABLE workgroups; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.workgroups TO apms_user;


--
-- PostgreSQL database dump complete
--

\unrestrict Z3dYm5KtmoGKqhsrlP4SR402eMhS2NK8NbfxLhrl02qdO95rcuTHxJ0LtfbLKZp

