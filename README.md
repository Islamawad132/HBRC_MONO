# 🏢 HBRC CRM System

> Customer Relationship Management System for Housing and Building National Research Center

A comprehensive CRM system for managing HBRC services including lab tests, consultancy, stations approval, fire safety, green building certifications, and more.

---

## 🛠️ Tech Stack

### Backend
- **Framework**: NestJS 11
- **Database**: PostgreSQL 16
- **ORM**: Prisma 5
- **Authentication**: JWT + Passport
- **Documentation**: Swagger/OpenAPI
- **Language**: TypeScript

### Infrastructure
- **Containerization**: Docker + Docker Compose
- **Monorepo**: Turborepo

---

## 🚀 Quick Start

### Prerequisites

- Node.js 22+
- PostgreSQL 16
- Docker & Docker Compose (optional)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd HBRC_MONO

# Install dependencies
npm install

# Setup environment
cp apps/api/.env.example apps/api/.env

# Run database migrations
npm run prisma:migrate --workspace=api
npm run prisma:seed --workspace=api

# Start development server
npm run dev
```

**API**: `http://localhost:3000`
**Swagger Docs**: `http://localhost:3000/api/docs`

---

## 🐳 Docker Setup (Recommended)

```bash
# Setup environment
cp .env.production.example .env.production
nano .env.production  # Edit values

# Start everything
docker-compose --env-file .env.production up -d

# View logs
docker-compose logs -f
```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment guide.

---

## 📁 Project Structure

```
HBRC_MONO/
├── apps/
│   ├── api/                 # NestJS Backend
│   │   ├── src/
│   │   │   ├── auth/        # Authentication
│   │   │   ├── customers/   # Customer management
│   │   │   ├── employees/   # Employee management
│   │   │   ├── roles/       # Roles management
│   │   │   ├── permissions/ # Permissions management
│   │   │   └── common/      # Shared modules
│   │   └── prisma/
│   │       ├── schema.prisma
│   │       ├── migrations/
│   │       └── seed.ts
│   └── web/                 # React Frontend (coming soon)
├── docker-compose.yml
└── turbo.json
```

---

## 🔐 Authentication

### User Types

- **Customers**: Self-registration via `POST /auth/customer/register`
- **Employees**: Created by admin via `POST /employees`, login via `POST /auth/employee/login`

### Default Admin Credentials

```
Email: admin@hbrc.com
Password: admin123
Endpoint: POST /auth/employee/login
```

⚠️ **Change password in production!**

---

## 🌐 Bilingual System

All API responses include both English and Arabic text:

```json
{
  "statusCode": 401,
  "message": "Invalid credentials",
  "messageAr": "بيانات الدخول غير صحيحة"
}
```

---

## 📖 API Documentation

Visit: `http://localhost:3000/api/docs`

### Main Endpoints

**Authentication**
- `POST /auth/customer/register` - Customer registration
- `POST /auth/customer/login` - Customer login
- `POST /auth/employee/login` - Employee login
- `GET /auth/customer/profile` - Get customer profile
- `GET /auth/employee/profile` - Get employee profile

**Customers**
- `GET /customers` - List customers
- `GET /customers/:id` - Get customer
- `PATCH /customers/:id` - Update customer
- `DELETE /customers/:id` - Delete customer

**Employees**
- `POST /employees` - Create employee
- `GET /employees` - List employees
- `GET /employees/:id` - Get employee
- `PATCH /employees/:id` - Update employee
- `DELETE /employees/:id` - Delete employee

**Roles**
- `POST /roles` - Create role
- `GET /roles` - List roles
- `GET /roles/:id` - Get role
- `PATCH /roles/:id` - Update role
- `DELETE /roles/:id` - Delete role

**Permissions**
- `POST /permissions` - Create permission
- `GET /permissions` - List permissions
- `GET /permissions/:id` - Get permission
- `PATCH /permissions/:id` - Update permission
- `DELETE /permissions/:id` - Delete permission

---

## 🔧 Useful Commands

### Development

```bash
npm run dev              # Run all apps
npm run dev:api          # Run API only
npm run dev:web          # Run frontend only
npm run build            # Build all apps
```

### Database

```bash
npm run prisma:generate --workspace=api      # Generate Prisma Client
npm run prisma:migrate --workspace=api       # Run migrations
npm run prisma:seed --workspace=api          # Seed database
npm run prisma:studio --workspace=api        # Open Prisma Studio
```

### Docker

```bash
docker-compose up -d          # Start
docker-compose down           # Stop
docker-compose logs -f api    # View logs
docker-compose exec api sh    # Enter container
```

---

## 📦 Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for full deployment guide.

Quick deploy:
```bash
docker-compose --env-file .env.production up -d
```

---

## 🔒 Security Features

- ✅ JWT authentication
- ✅ bcrypt password hashing
- ✅ RBAC (Role-Based Access Control)
- ✅ Environment variables for secrets
- ✅ CORS enabled
- ✅ Input validation
- ✅ SQL injection protection (Prisma)

---

## 📄 License

All rights reserved © 2024 HBRC

---

**Made with ❤️ for Housing and Building National Research Center**
