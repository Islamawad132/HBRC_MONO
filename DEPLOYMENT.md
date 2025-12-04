# 🚀 HBRC Deployment Guide

## دليل النشر على السيرفر

---

## ✨ الطريقة الموصى بها: GitHub Actions (CI/CD Automation) ⭐

### المميزات:
- ✅ Deploy تلقائي عند كل push على main branch
- ✅ بناء الصور على GitHub (مش محتاج resources محلية)
- ✅ سريع جداً (بدون نقل tar files كبيرة)
- ✅ Rollback سهل لأي commit سابق
- ✅ تتبع كامل للـ deployments في GitHub Actions

### الإعداد:

#### 1. أضف الـ Secrets في GitHub:

اذهب إلى: **Repository Settings → Secrets and variables → Actions → New repository secret**

أضف هذه الـ Secrets:

| Secret Name | Value |
|------------|-------|
| `VPS_HOST` | `34.71.218.241` |
| `VPS_USER` | `islam` |
| `VPS_SSH_KEY` | محتوى ملف `~/.ssh/id_rsa` |

للحصول على SSH Key:
```bash
cat ~/.ssh/id_rsa
# انسخ كل المحتوى (بما فيهم BEGIN و END)
```

#### 2. تأكد من وجود `.env.production` على السيرفر:

```bash
ssh -i ~/.ssh/id_rsa islam@34.71.218.241

# أنشئ الملف
cat > /home/islam/HBRC_MONO/.env.production << 'EOF'
DB_PASSWORD=your_secure_password_here
JWT_SECRET=your_super_secret_jwt_key_at_least_32_characters
JWT_EXPIRES_IN=7d
NODE_ENV=production
EOF
```

#### 3. Deploy:

```bash
# اعمل push على main branch
git add .
git commit -m "Deploy to production"
git push origin main

# الـ GitHub Actions هيشتغل تلقائياً!
```

#### 4. تابع الـ Deployment:

- اذهب إلى تبويب **Actions** في GitHub
- شوف الـ workflow وهو بيشتغل live
- لما يخلص، التطبيق هيكون شغال على السيرفر

### المراقبة:

```bash
# شوف اللوجز
ssh -i ~/.ssh/id_rsa islam@34.71.218.241
docker logs -f hbrc-api
docker logs -f hbrc-web

# شوف حالة الـ containers
docker ps
```

📖 **للتفاصيل الكاملة**: شوف [.github/DEPLOYMENT_SETUP.md](.github/DEPLOYMENT_SETUP.md)

---

## الطريقة التانية: Docker Compose يدوي

### 1. على السيرفر، ثبت Docker و Docker Compose:

```bash
# تثبيت Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# تثبيت Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# تأكد من التثبيت
docker --version
docker-compose --version
```

### 2. انسخ المشروع للسيرفر:

```bash
# من جهازك المحلي
scp -r /path/to/HBRC_MONO user@your-server-ip:/home/user/

# أو استخدم git
ssh user@your-server-ip
git clone https://github.com/your-repo/HBRC_MONO.git
cd HBRC_MONO
```

### 3. اعمل ملف البيئة:

```bash
# انسخ ملف المثال
cp .env.production.example .env.production

# عدل القيم المهمة
nano .env.production
```

**⚠️ غير القيم دي بالذات:**
- `DB_PASSWORD` - كلمة سر قوية للـ Database
- `JWT_SECRET` - مفتاح سري للـ JWT (32 حرف على الأقل)

### 4. شغل التطبيق:

```bash
# شغل كل حاجة مرة واحدة
docker-compose --env-file .env.production up -d

# شوف اللوجز
docker-compose logs -f

# شوف الـ containers الشغالة
docker ps
```

### 5. التطبيق جاهز! 🎉

- **API**: `http://your-server-ip:3000`
- **Swagger Docs**: `http://your-server-ip:3000/api/docs`
- **Database**: يشتغل تلقائياً على port 5433

---

## الطريقة التانية: Build صورة واحدة

### بناء الـ Image:

```bash
# من داخل المشروع
cd HBRC_MONO

# بناء الـ API image
docker build -t hbrc-api:latest -f apps/api/Dockerfile .

# شوف الـ images
docker images | grep hbrc
```

### رفع الصورة لـ Docker Hub:

```bash
# تسجيل الدخول
docker login

# عمل tag للصورة
docker tag hbrc-api:latest your-username/hbrc-api:latest

# رفع الصورة
docker push your-username/hbrc-api:latest
```

### على السيرفر:

```bash
# سحب الصورة
docker pull your-username/hbrc-api:latest

# تشغيل الـ database
docker run -d \
  --name hbrc-postgres \
  -e POSTGRES_PASSWORD=your_password \
  -e POSTGRES_DB=HBRC \
  -v postgres_data:/var/lib/postgresql/data \
  -p 5433:5432 \
  postgres:16-alpine

# تشغيل الـ API
docker run -d \
  --name hbrc-api \
  --link hbrc-postgres:postgres \
  -e DATABASE_URL="postgresql://postgres:your_password@postgres:5432/HBRC" \
  -e JWT_SECRET="your-secret-key" \
  -p 3000:3000 \
  your-username/hbrc-api:latest
```

---

## 🔧 أوامر مفيدة

### إدارة الـ Containers:

```bash
# إيقاف التطبيق
docker-compose down

# إيقاف وحذف كل حاجة (مع الـ volumes)
docker-compose down -v

# إعادة البناء
docker-compose build --no-cache

# إعادة التشغيل
docker-compose restart

# شوف اللوجز
docker-compose logs -f api
docker-compose logs -f postgres
```

### إدارة الـ Database:

```bash
# دخول الـ database
docker-compose exec postgres psql -U postgres -d HBRC

# عمل backup
docker-compose exec postgres pg_dump -U postgres HBRC > backup.sql

# استرجاع backup
docker-compose exec -T postgres psql -U postgres -d HBRC < backup.sql

# تشغيل migrations يدوياً
docker-compose exec api npx prisma migrate deploy

# إعادة seed البيانات
docker-compose exec api npx prisma db seed
```

### مراقبة الأداء:

```bash
# استخدام الموارد
docker stats

# شوف الـ logs
docker-compose logs --tail=100 -f

# دخول الـ container
docker-compose exec api sh
```

---

## 🔒 Security Best Practices

### 1. استخدم HTTPS:

```bash
# ثبت Certbot
sudo apt install certbot

# احصل على SSL certificate
sudo certbot certonly --standalone -d yourdomain.com
```

### 2. Firewall:

```bash
# اسمح بس للـ ports المحتاجينها
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw enable
```

### 3. غير الـ credentials الافتراضية:

- كلمة سر الـ Database
- JWT Secret
- Admin password

---

## 📊 Monitoring (اختياري)

### إضافة Prometheus + Grafana:

أضف للـ `docker-compose.yml`:

```yaml
  prometheus:
    image: prom/prometheus
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    ports:
      - "9090:9090"

  grafana:
    image: grafana/grafana
    ports:
      - "3001:3000"
    depends_on:
      - prometheus
```

---

## 🆘 حل المشاكل الشائعة

### المشكلة: التطبيق مش شغال

```bash
# شوف اللوجز
docker-compose logs api

# شوف حالة الـ containers
docker-compose ps

# أعد تشغيل كل حاجة
docker-compose restart
```

### المشكلة: Database connection failed

```bash
# تأكد إن الـ database شغال
docker-compose ps postgres

# شوف لوجز الـ database
docker-compose logs postgres

# تأكد من الـ DATABASE_URL في .env
```

### المشكلة: Port already in use

```bash
# شوف مين مستخدم الـ port
sudo lsof -i :3000

# اقتل الـ process
sudo kill -9 <PID>

# أو غير الـ port في docker-compose.yml
```

---

## 🎯 الخلاصة

**للتشغيل السريع على السيرفر:**

```bash
# 1. ثبت Docker
curl -fsSL https://get.docker.com | sh

# 2. انسخ المشروع
git clone <your-repo>
cd HBRC_MONO

# 3. اعمل env file
cp .env.production.example .env.production
nano .env.production  # غير الـ passwords والـ secrets

# 4. شغل
docker-compose --env-file .env.production up -d

# 5. تابع اللوجز
docker-compose logs -f
```

**خلاص! التطبيق شغال على:** `http://your-server:3000` 🚀

---

## 📝 ملاحظات مهمة

1. **الـ Database بيتخزن في volume** - مش هتضيع لو عملت restart
2. **الـ migrations بتشتغل تلقائياً** عند كل تشغيل
3. **الـ seed بيشتغل تلقائياً** أول مرة
4. **Admin credentials:**
   - Email: `admin@hbrc.com`
   - Password: `admin123`
   - ⚠️ **غيرهم فوراً في Production!**
