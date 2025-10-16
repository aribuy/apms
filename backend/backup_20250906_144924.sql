--
-- PostgreSQL database dump
--

-- Dumped from database version 16.9 (Ubuntu 16.9-0ubuntu0.24.04.1)
-- Dumped by pg_dump version 16.9 (Ubuntu 16.9-0ubuntu0.24.04.1)

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
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: apms_user
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: apms_user
--

COPY public.audit_logs (id, user_id, action, resource, resource_id, old_data, new_data, ip_address, user_agent, created_at) FROM stdin;
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
-- Data for Name: processes; Type: TABLE DATA; Schema: public; Owner: apms_user
--

COPY public.processes (id, name, description, code, category, "isActive", "createdAt", "updatedAt") FROM stdin;
cmf80ase0000cji4wl3ypkrlz	Asset Management	\N	ASSET	Core Operations	t	2025-09-06 08:32:57.912	2025-09-06 08:32:57.912
cmf80ase2000dji4wc4d4g8tz	Maintenance Scheduling	\N	MAINTENANCE	Operations	t	2025-09-06 08:32:57.914	2025-09-06 08:32:57.914
cmf80ase3000eji4whvdzpxc1	Report Generation	\N	REPORTING	Analytics	t	2025-09-06 08:32:57.915	2025-09-06 08:32:57.915
cmf80ase4000fji4w5vwprvkb	User Management	\N	USER_MGMT	Administration	t	2025-09-06 08:32:57.916	2025-09-06 08:32:57.916
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
cmf88efol0001jiz8mpe14z8r	test@gmail.com	test	\N	\N	\N	\N	2025-09-06 12:19:44.996	2025-09-06 12:19:44.996	$2b$10$/dyMtiMWYfHc1CP6We6oNOFxESb2oQPrQtKdmyvQxxffSMTkM1D1O	\N	0	\N	\N	\N	\N	0	t	\N	\N	\N	\N	ACTIVE	\N	\N	INTERNAL
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
-- Name: geographic_privileges geographic_privileges_pkey; Type: CONSTRAINT; Schema: public; Owner: apms_user
--

ALTER TABLE ONLY public.geographic_privileges
    ADD CONSTRAINT geographic_privileges_pkey PRIMARY KEY (id);


--
-- Name: processes processes_pkey; Type: CONSTRAINT; Schema: public; Owner: apms_user
--

ALTER TABLE ONLY public.processes
    ADD CONSTRAINT processes_pkey PRIMARY KEY (id);


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
-- Name: geographic_privileges_code_key; Type: INDEX; Schema: public; Owner: apms_user
--

CREATE UNIQUE INDEX geographic_privileges_code_key ON public.geographic_privileges USING btree (code);


--
-- Name: geographic_privileges_name_key; Type: INDEX; Schema: public; Owner: apms_user
--

CREATE UNIQUE INDEX geographic_privileges_name_key ON public.geographic_privileges USING btree (name);


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
-- Name: geographic_privileges geographic_privileges_parentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: apms_user
--

ALTER TABLE ONLY public.geographic_privileges
    ADD CONSTRAINT "geographic_privileges_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES public.geographic_privileges(id) ON UPDATE CASCADE ON DELETE SET NULL;


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
-- PostgreSQL database dump complete
--

