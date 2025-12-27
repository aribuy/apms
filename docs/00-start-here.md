# 📘 APMS Documentation - Start Here

**APMS (Approval & Process Management System)** - Enterprise workflow platform for ATP/EATP approval processes.

---

## 🚀 Quick Start

### For Developers

```bash
# Clone repository
git clone git@github.com:aribuy/apms.git
cd apms

# Install dependencies
cd backend && npm install
cd ../frontend && npm install

# Start development
cd backend && node server.js  # Port 3011
cd frontend && npm start      # Port 3000
```

**Access**: http://localhost:3000
**Login**: admin@apms.com / Admin123!

### For System Administrators

See [Deployment Guide](deployment/README.md)

---

## 📚 Documentation Index

### Getting Started
- **[Architecture Overview](architecture/00-overview.md)** - System design & components
- **[Domain Models](domain/00-overview.md)** - Core business entities
- **[Workflows](workflows/00-overview.md)** - ATP & EATP processes

### Operational
- **[Deployment Guide](deployment/README.md)** - Production setup
- **[Testing Guide](testing/README.md)** - Test suites & CI
- **[Handover Guide](handover/README.md)** - Team onboarding

### Reference
- **[API Documentation](architecture/api.md)** - REST endpoints
- **[RBAC Matrix](domain/rbac.md)** - Roles & permissions
- **[Security](../SECURITY.md)** - Security policy & practices

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend (React)                     │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │ Dashboard  │  │ Site Mgmt  │  │ ATP Work   │            │
│  └────────────┘  └────────────┘  └────────────┘            │
└─────────────────────────────────────────────────────────────┘
                            │ ↓ HTTP
┌─────────────────────────────────────────────────────────────┐
│                      Backend (Node.js)                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ Auth API │  │ Site API │  │ ATP API  │  │ Task API │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
│  ┌─────────────────────┐  ┌─────────────────────┐         │
│  │   RBAC Middleware   │  │  Workflow Engine    │         │
│  └─────────────────────┘  └─────────────────────┘         │
└─────────────────────────────────────────────────────────────┘
                            │ ↓ SQL
┌─────────────────────────────────────────────────────────────┐
│                    PostgreSQL Database                       │
│  users | sites | tasks | atp_documents | review_stages    │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Core Features

### 1. ATP Management
- Document upload & validation
- Multi-stage approval workflow
- Checklist-based evaluation
- Punchlist tracking

### 2. Site Management
- Site registration & lifecycle
- Duplicate validation
- ATP type assignment (Software/Hardware/Combined)
- Region & team association

### 3. Task Management
- Automatic task generation
- Bulk operations
- Status tracking
- Document attachment

### 4. RBAC System
- Role-based permissions
- Module-level access control
- User type differentiation
- Audit trail

---

## 🔐 Security Considerations

**CRITICAL**: Read [SECURITY.md](../SECURITY.md) before making any changes.

### Key Security Points
- ❌ **NEVER** commit database backups
- ❌ **NEVER** commit credentials or secrets
- ✅ Always use environment variables
- ✅ RBAC enforcement on all endpoints
- ✅ Input validation & sanitization

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Run specific test suite
npm run test:unit
npm run test:integration
npm run test:e2e
npm run test:rbac
```

See [Testing Guide](testing/README.md) for details.

---

## 🚢 Deployment

### Development
- Frontend: http://localhost:3000
- Backend: http://localhost:3011

### Production
- URL: https://apms.datacodesolution.com
- Server: Ubuntu (PM2 + Nginx)
- Database: PostgreSQL

See [Deployment Guide](deployment/README.md) for production setup.

---

## 📋 Project Status

**Version**: 1.0.0
**Maturity**: Level 3.5 / 5 (Operational, needs hardening)
**Last Audit**: December 2025

### Completed ✅
- Core ATP/EATP workflow
- RBAC system
- Site management
- Task automation
- Production deployment

### In Progress 🚧
- Database migration discipline
- CI/CD pipeline
- Security hardening
- Test coverage expansion

### Planned 📋
- Advanced analytics
- Mobile optimization
- API versioning
- Microservices transition

---

## 🤝 Contributing

1. Read [SECURITY.md](../SECURITY.md)
2. Check existing issues
3. Create feature branch
4. Write tests
5. Submit PR for review

---

## 📞 Support

- **Documentation**: See specific guides in `/docs`
- **Issues**: GitHub Issues
- **Security**: security@datacodesolution.com
- **Emergency**: [CTO/Dev Lead Contact]

---

**Last Updated**: 2025-12-27
**Maintained By**: DataCode Solution Team
