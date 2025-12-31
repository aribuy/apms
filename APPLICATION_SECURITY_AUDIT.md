# Application Security Audit

This document summarizes key security and reliability risks identified during a quick source review of the APMS codebase. Each issue lists evidence and recommended remediation steps.

## Critical Findings

### 1. Missing idempotency middleware crashes server startup
- **Evidence:** The Express server requires `./src/middleware/idempotency` and registers `idempotencyCheck` on multiple routes, but no such file exists in `backend/src/middleware`.
- **Impact:** Server boot fails with `Cannot find module './src/middleware/idempotency'`, preventing any API from starting and hiding other defects.
- **Remediation:** Add the missing middleware (or remove the references) and cover with an integration test that boots the server.

### 2. Hard-coded credentials and plain-text authentication
- **Evidence:** `/api/v1/auth/login` validates a static list of email/password pairs and returns opaque tokens built with `Date.now()` rather than signed JWTs. No password hashing, rate limiting, or audit logging is present.
- **Impact:** Anyone with repository access (or log artifacts) can authenticate as any role; credentials cannot be rotated centrally; there is no brute-force protection; tokens offer no integrity and can be trivially forged.
- **Remediation:** Replace the stub with database-backed credential storage using hashed passwords, short-lived signed JWTs, refresh token rotation, and login throttling. Remove test credentials from production builds.

### 3. Weak JWT secret fallback
- **Evidence:** `auth.utils.js` signs and verifies JWTs using `process.env.JWT_SECRET || 'default-secret-key'`.
- **Impact:** In non-configured environments, every token shares the same public default secret, enabling trivial token forgery and privilege escalation.
- **Remediation:** Fail fast when `JWT_SECRET` is unset in non-test environments; rotate the secret and invalidate existing tokens after deploying a fix.

### 4. Unauthenticated access to operational metrics
- **Evidence:** `/api/dashboard/stats` and `/api/dashboard/activities` return counts and operational metadata without any authentication or authorization checks.
- **Impact:** Anonymous users can enumerate user/site/document totals and operational timestamps, leaking sensitive business intelligence. The stats endpoint also downgrades to mock data on database errors, masking outages instead of failing closed.
- **Remediation:** Require authentication and role-based authorization on these endpoints, ensure error paths do not downgrade to mock data for unauthenticated callers, and instrument failures.

### 5. Spoofable roles bypass access control
- **Evidence:** ATP permission middleware derives the user role from `req.headers['x-user-role']` (defaulting to `USER`) because no authentication middleware populates `req.user`. Any caller can set `x-user-role` to escalate privileges.
- **Impact:** Attackers can self-assign privileged roles (e.g., `VENDOR_ADMIN`, `RTH`, `HEAD_NOC`) to upload or approve ATP documents without valid credentials.
- **Remediation:** Introduce JWT authentication middleware that validates tokens and sets `req.user`; remove trust in caller-supplied headers for authorization decisions.

### 6. Open permission management endpoints enable privilege escalation
- **Evidence:** `/api/v1/permissions` GET/POST and `/api/v1/roles` are exposed without authentication, storing permission mappings in memory and accepting arbitrary writes from any caller.
- **Impact:** Unauthenticated users can read the entire permission model and overwrite it to grant themselves access across modules; changes do not persist or audit, making tampering invisible.
- **Remediation:** Restrict these endpoints to authenticated administrators, persist permissions in the database with audit logging, and validate input structure.

## Recommended Next Steps
- Add automated smoke tests that start the API to catch missing modules and boot-time failures.
- Implement centralized authentication and authorization middleware across all routes (including dashboard, permission management, and upload flows); remove reliance on caller-provided role headers.
- Enforce secure secret management (no defaults), credential hashing, and defensive login controls (throttling, logging, MFA where appropriate).
- Review other routes for similar unauthenticated or mock fallbacks and remove test artifacts before production deployment.
