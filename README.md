# 🏢 APMS - Approval & Process Management System

[![License](https://img.shields.io/badge/license-Proprietary-red.svg)](LICENSE)
[![Node Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org)
[![Security](https://img.shields.io/badge/security-critical-orange.svg)](SECURITY.md)

**APMS** is an enterprise-grade workflow management platform designed for telecom infrastructure ATP (Acceptance Test Procedure) and EATP processes with multi-stage approval workflows, RBAC, and comprehensive audit trails.

---

## 🚀 Quick Start

```bash
# Clone repository
git clone git@github.com:aribuy/apms.git
cd apms

# Backend setup
cd backend && npm install
cp .env.example .env
node server.js  # Runs on port 3011

# Frontend setup (new terminal)
cd frontend && npm install
npm start       # Runs on port 3000
```

**Access**: http://localhost:3000
**Default Login**: admin@apms.com / Admin123!

---

## 📚 Documentation

**📘 [Complete Documentation](docs/00-start-here.md)**

### Quick Links
- **[Start Here](docs/00-start-here.md)** - Getting started guide
- **[Security](SECURITY.md)** - Security policy (READ FIRST!)
- **[Deployment](docs/deployment/README.md)** - Production setup
- **[Architecture](docs/architecture/00-overview.md)** - System design
- **[API Reference](docs/architecture/api.md)** - REST endpoints
- **[RBAC Matrix](docs/domain/rbac.md)** - Roles & permissions

---

## ✨ Features

- ✅ **ATP Management**: Multi-stage approval workflow (Software/Hardware/Combined)
- ✅ **Site Management**: Registration, validation, lifecycle management
- ✅ **Task Management**: Automatic task generation, bulk operations
- ✅ **RBAC System**: Role-based access control with permission matrix
- ✅ **Document Workflow**: Upload, review, approval with punchlist tracking

### Approval Workflows
- **Software ATP**: BO → SME → HEAD_NOC
- **Hardware ATP**: FOP_RTS → REGION_TEAM → RTH
- **Combined ATP**: 5-stage approval process

---

## 🏗️ Architecture

**Frontend**: React 19 + TypeScript + Tailwind CSS
**Backend**: Node.js + Express + Prisma ORM
**Database**: PostgreSQL 14+
**Infrastructure**: Nginx + PM2 + Let's Encrypt

```
React Frontend (Port 3000)
        ↓
Node.js Backend API (Port 3011)
        ↓
PostgreSQL Database
```

---

## 💻 Development

```bash
# Backend
cd backend && npm install && node server.js

# Frontend  
cd frontend && npm install && npm start
```

### Project Structure
```
apms/
├── backend/         # Node.js/Express API
├── frontend/        # React SPA
├── docs/           # Restructured documentation
├── SECURITY.md     # Security policy
└── README.md       # This file
```

---

## 🚢 Deployment

**Production**: https://apms.datacodesolution.com

```bash
git pull origin main
cd backend && npm install --production && pm2 restart apms-api
cd ../frontend && npm install && npm run build
sudo systemctl reload nginx
```

See [Deployment Guide](docs/deployment/README.md)

---

## 🔒 Security

**⚠️ CRITICAL**: Read [SECURITY.md](SECURITY.md) before contributing.

- ❌ **NEVER** commit database backups, credentials, or secrets
- ✅ All routes require authentication
- ✅ RBAC enforcement on all endpoints
- ✅ Environment-based configuration

**Report Vulnerabilities**: security@datacodesolution.com

---

## 🧪 Testing

```bash
npm test                    # All tests
npm run test:unit          # Unit tests
npm run test:integration   # Integration tests
npm run test:rbac          # RBAC scenarios
```

---

## 📊 Project Status

**Maturity**: 3.5 / 5 (Operational, needs hardening)

✅ Core workflow, RBAC, Site management, Production deployment
🚧 CI/CD, Security hardening, Test coverage

See [README_OLD.md](README_OLD.md) for legacy feature list.

---

## 🤝 Contributing

1. Read [SECURITY.md](SECURITY.md) first
2. Check [GitHub Issues](https://github.com/aribuy/apms/issues)
3. Fork, branch, test, then PR

---

## 📞 Support

- **Documentation**: [docs/00-start-here.md](docs/00-start-here.md)
- **Issues**: [GitHub Issues](https://github.com/aribuy/apms/issues)
- **Security**: security@datacodesolution.com

---

**License**: Proprietary - DataCode Solution © 2025

**Last Updated**: 2025-12-27
