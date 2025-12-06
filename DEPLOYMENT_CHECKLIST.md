# 🚀 Deployment Checklist

Use this checklist before deploying to production to ensure everything is configured correctly.

---

## 📋 Pre-Deployment Checklist

### 1. Environment Variables ✅

- [ ] Copy `.env.production.example` to `.env.production`
- [ ] Update `DB_PASSWORD` with strong password
- [ ] Update `JWT_SECRET` with strong random value
- [ ] Configure `MAIL_USER` with production email
- [ ] Configure `MAIL_PASSWORD` with Gmail App Password
- [ ] Update `MAIL_FROM` with production sender
- [ ] Verify all env vars are set correctly

```bash
# Generate strong JWT secret
openssl rand -base64 32
```

### 2. Email Configuration ✅

- [ ] Gmail 2FA enabled
- [ ] App Password generated
- [ ] Test email sending in development
- [ ] Production email account ready
- [ ] Email templates reviewed
- [ ] Sender address configured

### 3. Database ✅

- [ ] PostgreSQL 16 installed/available
- [ ] Database user created
- [ ] Database `HBRC` created
- [ ] Connection string tested
- [ ] Backup strategy in place

### 4. Docker ✅

- [ ] Docker installed on server
- [ ] Docker Compose installed
- [ ] `.env.production` file created
- [ ] Ports 3000, 5173, 5432 available
- [ ] Volumes configured for persistence

### 5. Security ✅

- [ ] Change default admin password
- [ ] JWT_SECRET is strong and unique
- [ ] Database password is strong
- [ ] `.env` files in `.gitignore`
- [ ] No secrets in git history
- [ ] Firewall configured
- [ ] SSL/TLS certificate ready (if applicable)

### 6. Code & Build ✅

- [ ] All tests passing
- [ ] No console.log in production code
- [ ] Linter passing
- [ ] TypeScript compilation successful
- [ ] Prisma migrations applied
- [ ] Seed data prepared

---

## 🎯 Deployment Steps

### Step 1: Prepare Server

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt install docker-compose-plugin -y

# Verify installation
docker --version
docker compose version
```

### Step 2: Clone Repository

```bash
git clone <your-repo-url> HBRC_MONO
cd HBRC_MONO
```

### Step 3: Configure Environment

```bash
# Copy production env template
cp .env.production.example .env.production

# Edit with production values
nano .env.production
```

**Required Values:**
```bash
DB_PASSWORD=<strong-db-password>
JWT_SECRET=<strong-jwt-secret>
MAIL_USER=<production-email@gmail.com>
MAIL_PASSWORD=<gmail-app-password>
MAIL_FROM=HBRC <production-email@gmail.com>
```

### Step 4: Deploy with Docker

```bash
# Start all services
docker compose --env-file .env.production up -d

# Wait for services to start
sleep 10

# Check status
docker compose ps

# View logs
docker compose logs -f api
```

### Step 5: Run Database Migrations

```bash
# Enter API container
docker compose exec api sh

# Run migrations
npx prisma migrate deploy

# Seed database
npm run seed

# Exit container
exit
```

### Step 6: Verify Deployment

```bash
# Check API health
curl http://localhost:3000

# Check Swagger docs
curl http://localhost:3000/api/docs

# Test admin login
curl -X POST http://localhost:3000/auth/employee/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@hbrc.com","password":"admin123"}'

# Test email (register customer)
curl -X POST http://localhost:3000/auth/customer/register \
  -H "Content-Type: application/json" \
  -d '{
    "email":"test@example.com",
    "password":"Test@1234",
    "name":"Test User",
    "phone":"01012345678",
    "customerType":"INDIVIDUAL"
  }'

# Check email logs
docker compose logs api | grep "Email service"
docker compose logs api | grep "Welcome email"
```

---

## 🔍 Post-Deployment Checks

### Health Checks ✅

- [ ] API responding at port 3000
- [ ] Database connected successfully
- [ ] Swagger docs accessible
- [ ] Admin login working
- [ ] Customer registration working
- [ ] Email service initialized
- [ ] Welcome emails sending
- [ ] All endpoints responding

### Monitoring ✅

```bash
# View logs
docker compose logs -f

# Check resource usage
docker stats

# Check container health
docker compose ps

# Check disk space
df -h
```

### Performance ✅

- [ ] Response times acceptable (<500ms)
- [ ] Database queries optimized
- [ ] Memory usage normal
- [ ] CPU usage normal
- [ ] No memory leaks

---

## 🆘 Troubleshooting

### Email Not Sending

```bash
# Check email config
docker compose exec api printenv | grep MAIL

# Check logs
docker compose logs api | grep MailService

# Test connection
docker compose exec api node -e "
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASSWORD
  }
});
transporter.verify().then(console.log).catch(console.error);
"
```

### Database Connection Issues

```bash
# Check database
docker compose exec postgres psql -U postgres -d HBRC -c "SELECT 1;"

# Check connection string
docker compose exec api printenv DATABASE_URL

# Restart database
docker compose restart postgres
```

### API Not Starting

```bash
# Check logs
docker compose logs api

# Check health
docker compose exec api wget -O- http://localhost:3000 || echo "Failed"

# Rebuild
docker compose build api
docker compose up -d api
```

---

## 🔄 Updates & Maintenance

### Updating Code

```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker compose build
docker compose up -d

# Run new migrations
docker compose exec api npx prisma migrate deploy
```

### Database Backup

```bash
# Backup database
docker compose exec postgres pg_dump -U postgres HBRC > backup_$(date +%Y%m%d).sql

# Restore database
docker compose exec -T postgres psql -U postgres HBRC < backup_20241205.sql
```

### Log Rotation

```bash
# View log size
docker compose logs api | wc -l

# Clear logs
docker compose down
docker compose up -d
```

---

## 📞 Emergency Contacts

- **System Admin**: [Your contact]
- **DevOps Team**: [Team contact]
- **Database Admin**: [DBA contact]

---

## ✅ Final Checklist

Before going live:

- [ ] All environment variables configured
- [ ] Database migrations applied
- [ ] Seed data loaded
- [ ] Admin password changed
- [ ] Email sending tested
- [ ] All endpoints tested
- [ ] Health checks passing
- [ ] Monitoring configured
- [ ] Backup strategy in place
- [ ] Team trained on system
- [ ] Documentation complete
- [ ] Rollback plan ready

---

**Deployment Date:** _________________

**Deployed By:** _________________

**Production URL:** _________________

---

🎉 **Deployment Complete!**
