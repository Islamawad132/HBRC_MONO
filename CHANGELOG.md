# Changelog

All notable changes to the HBRC CRM project will be documented in this file.

---

## [Unreleased]

### Added - 2024-12-05

#### 📧 Email System Implementation
- **Email Service**: Integrated NodeMailer with Gmail SMTP
- **Email Templates**: 5 professional bilingual (AR/EN) templates
  - Customer Welcome Email
  - Employee Welcome Email  
  - Password Reset Email
  - Email Verification Email
  - Generic Notification Email
- **Auto-send**: Welcome emails on customer registration
- **Configuration**: Complete email setup in Docker & docker-compose

#### 🔧 Configuration Files
- **`.env.example`**: Template for development environment
- **`.env.production.example`**: Template for production deployment
- **`EMAIL_SETUP.md`**: Complete email configuration guide
- **`DEPLOYMENT_CHECKLIST.md`**: Comprehensive deployment checklist

#### 📝 Documentation Updates
- Updated `README.md` with email configuration section
- Updated `docker-compose.yml` with email environment variables
- Added security best practices for email

#### 🎨 Email Features
- RTL support for Arabic content
- Responsive HTML templates
- Professional gradient designs
- HBRC branding
- Error handling (async, non-blocking)

---

## [0.2.0] - 2024-12-05

### Added

#### 🔐 Enhanced Authentication & User Management
- **User Types**: Separated Customer and Employee models
- **Account Status**: ACTIVE, INACTIVE, SUSPENDED, PENDING
- **User Preferences**: Language (ar/en), notification settings
- **Login Tracking**: lastLoginAt, loginCount fields
- **Customer Types**: INDIVIDUAL, CORPORATE, CONSULTANT, SPONSOR

#### 👥 Role-Based Access Control (RBAC)
- **Role Management**: Full CRUD with bilingual names
- **Permission System**: 95+ permissions across 13 modules
- **Admin Role**: Automatic all-permissions grant
- **29 Employee Roles**: Pre-seeded with Arabic names
- **Permission Guard**: Middleware for endpoint protection

#### 📊 Database Enums
- `UserType`: CUSTOMER, EMPLOYEE, ADMIN
- `CustomerType`: INDIVIDUAL, CORPORATE, CONSULTANT, SPONSOR  
- `AccountStatus`: ACTIVE, INACTIVE, SUSPENDED, PENDING

#### 🗃️ Database Schema
- Enhanced Customer model with metadata
- Enhanced Employee model with job details
- Role with bilingual support (name, nameAr)
- Permission with module:action format
- RolePermission junction table

#### 🔑 Initial Data Seeded
- Admin role with all permissions
- 29 employee roles with Arabic translations
- 95 permissions covering all modules
- Admin employee account (admin@hbrc.com)

---

## [0.1.0] - 2024-12-01

### Added

#### 🏗️ Project Foundation
- **Monorepo Setup**: Turborepo configuration
- **Backend**: NestJS 11 with TypeScript
- **Database**: PostgreSQL 16 with Prisma 5
- **Authentication**: JWT with Passport
- **Documentation**: Swagger/OpenAPI
- **Deployment**: Docker + Docker Compose

#### 📦 Core Modules
- Auth Module (JWT, Passport strategies)
- Users Module (legacy, to be migrated)
- Customers Module
- Employees Module
- Roles Module
- Permissions Module
- Prisma Module

#### 🐳 Docker Configuration
- Multi-stage Dockerfile for API & Web
- Docker Compose with PostgreSQL
- Health checks for all services
- Volume persistence

#### 📁 Project Structure
- Monorepo with apps/ directory
- Shared configuration (turbo.json)
- Environment variable management
- Git workflow configured

---

## Deployment History

| Date | Version | Environment | Deployed By | Notes |
|------|---------|-------------|-------------|-------|
| 2024-12-05 | 0.2.0 | Development | Team | Email system added |
| 2024-12-01 | 0.1.0 | Development | Team | Initial setup |

---

## Future Plans

### Phase 2: Service Implementation (Weeks 5-12)
- [ ] Laboratory Tests Module
- [ ] Station Accreditation Module
- [ ] Green Building Certification
- [ ] Consultancy & Other Services

### Phase 3: Frontend Development (Weeks 13-18)
- [ ] Customer Portal (React)
- [ ] Admin Dashboard
- [ ] Staff Portal

### Phase 4: Notifications (Weeks 19-20)
- [ ] SMS Integration (Twilio)
- [ ] WhatsApp Integration
- [ ] Real-time WebSocket notifications

### Phase 5: CRM & Marketing (Weeks 21-24)
- [ ] Lead Management
- [ ] Campaign Management
- [ ] Customer Analytics

### Phase 6: Events & Training (Weeks 25-28)
- [ ] Event Management
- [ ] Training Courses
- [ ] Certificate Generation

---

**For detailed implementation plan, see [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md)**
