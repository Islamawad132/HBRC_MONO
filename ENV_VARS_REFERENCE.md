# 🔐 Environment Variables Reference

Complete reference for all environment variables used in HBRC CRM system.

---

## 📋 Required Variables

### Database Configuration

| Variable | Required | Default | Description | Example |
|----------|----------|---------|-------------|---------|
| `DATABASE_URL` | ✅ Yes | - | PostgreSQL connection string | `postgresql://user:pass@host:5432/HBRC` |
| `DB_PASSWORD` | ✅ Yes | `password` | Database password (production) | `MyStr0ngP@ssw0rd!` |

### JWT Authentication

| Variable | Required | Default | Description | Example |
|----------|----------|---------|-------------|---------|
| `JWT_SECRET` | ✅ Yes | - | Secret key for JWT signing | `your-super-secret-jwt-key` |
| `JWT_EXPIRES_IN` | ❌ No | `7d` | Token expiration time | `7d`, `1h`, `30m` |

### Email Configuration

| Variable | Required | Default | Description | Example |
|----------|----------|---------|-------------|---------|
| `MAIL_HOST` | ✅ Yes | `smtp.gmail.com` | SMTP server hostname | `smtp.gmail.com` |
| `MAIL_PORT` | ✅ Yes | `587` | SMTP server port | `587`, `465` |
| `MAIL_USER` | ✅ Yes | - | Email account username | `your-email@gmail.com` |
| `MAIL_PASSWORD` | ✅ Yes | - | Email account app password | `abcd efgh ijkl mnop` |
| `MAIL_FROM` | ✅ Yes | `HBRC <noreply@hbrc.com>` | Default sender address | `HBRC <email@domain.com>` |

---

## 🌍 Environment-Specific Configuration

### Development (.env)

```bash
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5433/HBRC"

# JWT
JWT_SECRET="dev-secret-key-change-me"
JWT_EXPIRES_IN="7d"

# Email (Gmail)
MAIL_HOST="smtp.gmail.com"
MAIL_PORT=587
MAIL_USER="dev-email@gmail.com"
MAIL_PASSWORD="your-app-password"
MAIL_FROM="HBRC Dev <dev-email@gmail.com>"
```

### Production (.env.production)

```bash
# Database
DATABASE_URL="postgresql://postgres:STRONG_PASSWORD@postgres:5432/HBRC?schema=public"
DB_PASSWORD="STRONG_PASSWORD"

# JWT
JWT_SECRET="VERY_STRONG_RANDOM_SECRET_HERE"
JWT_EXPIRES_IN="7d"

# Email
MAIL_HOST="smtp.gmail.com"
MAIL_PORT=587
MAIL_USER="production@yourdomain.com"
MAIL_PASSWORD="production-app-password"
MAIL_FROM="HBRC <production@yourdomain.com>"
```

---

## 🔧 How to Generate Secrets

### Strong JWT Secret
```bash
# Generate 32-byte random string
openssl rand -base64 32

# Example output:
# xK8vY2mN9pQ4rT6wA1bC3dE5fG7hI9jL0mN2oP4qR6s=
```

### Strong Database Password
```bash
# Generate strong password
openssl rand -base64 24

# Example output:
# dK3mP9qR5sT7wY1zA3bC5dE7fG9h
```

---

## 📧 Email Provider Configuration

### Gmail
```bash
MAIL_HOST="smtp.gmail.com"
MAIL_PORT=587
MAIL_USER="your-email@gmail.com"
MAIL_PASSWORD="your-16-char-app-password"
```

**Setup:**
1. Enable 2FA: https://myaccount.google.com/security
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Use the 16-character password

### Outlook/Hotmail
```bash
MAIL_HOST="smtp-mail.outlook.com"
MAIL_PORT=587
MAIL_USER="your-email@outlook.com"
MAIL_PASSWORD="your-password"
```

### Yahoo
```bash
MAIL_HOST="smtp.mail.yahoo.com"
MAIL_PORT=465
MAIL_USER="your-email@yahoo.com"
MAIL_PASSWORD="your-app-password"
```

### Custom SMTP
```bash
MAIL_HOST="smtp.yourdomain.com"
MAIL_PORT=587
MAIL_USER="noreply@yourdomain.com"
MAIL_PASSWORD="your-smtp-password"
```

---

## 🐳 Docker Configuration

### docker-compose.yml

The `docker-compose.yml` reads from `.env.production`:

```yaml
environment:
  DATABASE_URL: postgresql://postgres:${DB_PASSWORD}@postgres:5432/HBRC
  JWT_SECRET: ${JWT_SECRET}
  JWT_EXPIRES_IN: ${JWT_EXPIRES_IN:-7d}
  MAIL_HOST: ${MAIL_HOST:-smtp.gmail.com}
  MAIL_PORT: ${MAIL_PORT:-587}
  MAIL_USER: ${MAIL_USER}
  MAIL_PASSWORD: ${MAIL_PASSWORD}
  MAIL_FROM: ${MAIL_FROM:-HBRC <noreply@hbrc.com>}
```

**Usage:**
```bash
# Use production env
docker-compose --env-file .env.production up -d

# Use custom env
docker-compose --env-file .env.staging up -d
```

---

## ⚠️ Security Best Practices

### ❌ Never Do This:
- Commit `.env` files to git
- Use weak passwords in production
- Share secrets in plain text
- Use same secrets across environments
- Store secrets in code

### ✅ Always Do This:
- Use `.env.example` as template
- Generate strong random secrets
- Use environment-specific secrets
- Rotate secrets regularly
- Keep `.env` files in `.gitignore`
- Use App Passwords for email
- Enable 2FA on email accounts

---

## 🔍 Verification

### Check Current Configuration

```bash
# Development (local)
cat apps/api/.env

# Production (Docker)
docker-compose exec api printenv | grep -E "DATABASE|JWT|MAIL"
```

### Test Email Configuration

```bash
# From inside container
docker-compose exec api node -e "
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: Number(process.env.MAIL_PORT),
  secure: false,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASSWORD
  }
});
transporter.verify().then(() => {
  console.log('✅ Email configuration is valid!');
}).catch((err) => {
  console.error('❌ Email configuration error:', err.message);
});
"
```

---

## 📝 Checklist

Before deploying to any environment:

- [ ] All required variables are set
- [ ] Secrets are strong and unique
- [ ] Email configuration is tested
- [ ] Database connection works
- [ ] JWT secret is different from dev
- [ ] `.env` is in `.gitignore`
- [ ] No plain passwords used
- [ ] App passwords used for Gmail
- [ ] 2FA enabled on email accounts

---

## 📚 Related Documentation

- [EMAIL_SETUP.md](./EMAIL_SETUP.md) - Detailed email configuration guide
- [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) - Pre-deployment checklist
- [README.md](./README.md) - Project overview and quick start

---

## 🆘 Troubleshooting

### "MAIL_USER is not defined"
- Ensure `.env` file exists
- Check variable name spelling
- Verify env file is loaded: `docker-compose --env-file .env.production`

### "Invalid login: 535-5.7.8 Username and Password not accepted"
- Wrong app password → Generate new one
- 2FA not enabled → Enable it first
- Using regular password → Use App Password
- Account locked → Check security settings

### "getaddrinfo ENOTFOUND smtp.gmail.com"
- No internet connection
- Wrong MAIL_HOST value
- DNS resolution issue
- Check firewall settings

---

**Last Updated:** 2024-12-05
**Maintained By:** HBRC Development Team
