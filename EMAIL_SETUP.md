# 📧 Email Configuration Guide

## Overview
HBRC CRM uses NodeMailer with Gmail SMTP for sending emails. This guide will help you configure email settings for both development and production.

---

## 🔧 Development Setup

### 1. Enable Gmail SMTP Access

1. Go to your Google Account: https://myaccount.google.com/
2. Navigate to **Security** → **2-Step Verification** (Enable if not already)
3. Go to **App Passwords**: https://myaccount.google.com/apppasswords
4. Generate a new app password for "Mail"
5. Copy the 16-character password

### 2. Configure Environment Variables

Edit `apps/api/.env`:

```bash
# Email Configuration (Gmail SMTP)
MAIL_HOST="smtp.gmail.com"
MAIL_PORT=587
MAIL_USER="your-email@gmail.com"
MAIL_PASSWORD="your-16-char-app-password"
MAIL_FROM="HBRC <your-email@gmail.com>"
```

### 3. Test Email Sending

```bash
# Start the API
npm run dev:api

# Register a test customer (sends welcome email)
curl -X POST http://localhost:3000/auth/customer/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test@1234",
    "name": "Test User",
    "phone": "01012345678",
    "customerType": "INDIVIDUAL"
  }'
```

---

## 🚀 Production Deployment

### Docker Compose Setup

1. Create `.env.production` in the root directory:

```bash
cp .env.production.example .env.production
```

2. Edit `.env.production` with production values:

```bash
MAIL_HOST="smtp.gmail.com"
MAIL_PORT=587
MAIL_USER="production@yourdomain.com"
MAIL_PASSWORD="production-app-password"
MAIL_FROM="HBRC <production@yourdomain.com>"
```

3. Deploy with Docker:

```bash
docker-compose --env-file .env.production up -d
```

---

## 📧 Supported Email Providers

### Gmail
```bash
MAIL_HOST="smtp.gmail.com"
MAIL_PORT=587
```

### Outlook/Hotmail
```bash
MAIL_HOST="smtp-mail.outlook.com"
MAIL_PORT=587
```

### Yahoo
```bash
MAIL_HOST="smtp.mail.yahoo.com"
MAIL_PORT=465
```

### Custom SMTP
```bash
MAIL_HOST="smtp.yourdomain.com"
MAIL_PORT=587
```

---

## 📬 Available Email Templates

The system includes the following pre-built email templates:

1. **Customer Welcome Email** - Sent when a new customer registers
2. **Employee Welcome Email** - Sent when a new employee is created
3. **Password Reset Email** - Sent for password reset requests
4. **Email Verification** - Sent for email verification
5. **Generic Notification** - Flexible template for custom notifications

---

## 🔍 Troubleshooting

### Email Not Sending

1. **Check logs:**
   ```bash
   # Development
   Check terminal output for "Email service is ready"
   
   # Production
   docker logs hbrc-api
   ```

2. **Common Issues:**
   - ❌ Wrong app password → Generate new one
   - ❌ 2FA not enabled → Enable 2-Step Verification
   - ❌ Less secure apps blocked → Use App Passwords
   - ❌ Wrong MAIL_PORT → Use 587 for TLS

3. **Test connection:**
   ```bash
   # Check if email service initialized
   grep "Email service" docker logs
   
   # Should see: "Email service is ready to send messages"
   ```

---

## 🔐 Security Best Practices

1. **Never commit `.env` files** - They're in `.gitignore`
2. **Use App Passwords** - Never use your actual Gmail password
3. **Rotate secrets regularly** - Change passwords periodically
4. **Use environment-specific emails** - Different emails for dev/prod
5. **Enable 2FA** - Always enable two-factor authentication

---

## 📚 Usage in Code

```typescript
// Inject MailService
constructor(private mailService: MailService) {}

// Send welcome email
await this.mailService.sendCustomerWelcomeEmail(
  'customer@example.com',
  'John Doe'
);

// Send employee welcome
await this.mailService.sendEmployeeWelcomeEmail(
  'employee@hbrc.com',
  'Ahmed Mohamed',
  'EMP-001'
);

// Send password reset
await this.mailService.sendPasswordResetEmail(
  'user@example.com',
  'User Name',
  'reset-token-here'
);

// Send verification
await this.mailService.sendVerificationEmail(
  'user@example.com',
  'User Name',
  'verification-token'
);

// Send custom notification
await this.mailService.sendNotificationEmail(
  'user@example.com',
  'Subject Here',
  'Message content here'
);
```

---

## 🎨 Customizing Templates

Email templates are located in:
```
apps/api/src/mail/mail.service.ts
```

Each template method returns an HTML string with:
- RTL support (Arabic)
- Responsive design
- HBRC branding
- Professional styling

---

## 📝 Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `MAIL_HOST` | Yes | `smtp.gmail.com` | SMTP server hostname |
| `MAIL_PORT` | Yes | `587` | SMTP server port |
| `MAIL_USER` | Yes | - | Email account username |
| `MAIL_PASSWORD` | Yes | - | Email account password/app password |
| `MAIL_FROM` | Yes | `HBRC <noreply@hbrc.com>` | Default sender address |

---

## ✅ Checklist

- [ ] Gmail 2FA enabled
- [ ] App password generated
- [ ] Environment variables configured
- [ ] Email service initialized successfully
- [ ] Test email sent and received
- [ ] Production credentials secured
- [ ] `.env.production` never committed to git

---

## 📞 Support

For issues or questions:
- Check logs: `docker logs hbrc-api`
- Review this guide
- Contact: IT Department

---

**Last Updated:** 2024-12-05
**Version:** 1.0.0
