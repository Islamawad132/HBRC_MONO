# GitHub Actions Deployment Setup

## Required GitHub Secrets

You need to add these secrets to your GitHub repository:

### How to Add Secrets:
1. Go to your repository on GitHub
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret below

### Required Secrets:

#### `VPS_HOST`
- **Value**: `34.71.218.241`
- **Description**: Your VPS IP address

#### `VPS_USER`
- **Value**: `islam`
- **Description**: SSH username for VPS

#### `VPS_SSH_KEY`
- **Value**: Contents of your SSH private key (`~/.ssh/id_rsa`)
- **Description**: SSH private key for authentication
- **How to get**:
  ```bash
  cat ~/.ssh/id_rsa
  ```
  Copy the entire output (including `-----BEGIN OPENSSH PRIVATE KEY-----` and `-----END OPENSSH PRIVATE KEY-----`)

## Deployment Workflow

The workflow automatically triggers when you push to the `main` branch:

```bash
git add .
git commit -m "Your commit message"
git push origin main
```

### What Happens:

1. **Build Stage** (runs on GitHub Actions):
   - Builds Docker images for API and Web
   - Pushes images to GitHub Container Registry (GHCR)
   - Images are tagged with commit SHA and `latest`

2. **Deploy Stage** (runs on your VPS via SSH):
   - Pulls latest images from GHCR
   - Stops old containers
   - Starts new containers
   - Cleans up old images

## Manual Trigger

You can also manually trigger the deployment:
1. Go to **Actions** tab on GitHub
2. Click **Build and Deploy to VPS**
3. Click **Run workflow**

## First Time Setup on VPS

Make sure these exist on your VPS:

### 1. Create project directory:
```bash
ssh -i ~/.ssh/id_rsa islam@34.71.218.241
mkdir -p /home/islam/HBRC_MONO/apps/api
```

### 2. Create `.env.production` file:
```bash
cat > /home/islam/HBRC_MONO/.env.production << 'EOF'
# Database
DB_PASSWORD=your_secure_database_password

# JWT
JWT_SECRET=your_super_secret_jwt_key_at_least_32_characters_long
JWT_EXPIRES_IN=7d

# Node Environment
NODE_ENV=production
EOF
```

### 3. Copy Prisma files (first time only):
```bash
# From your local machine
scp -i ~/.ssh/id_rsa -r apps/api/prisma islam@34.71.218.241:/home/islam/HBRC_MONO/apps/api/
```

### 4. Install Docker on VPS (if not already installed):
```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker islam
# Logout and login again
```

## Monitoring Deployment

### View workflow logs:
- Go to **Actions** tab on GitHub
- Click on the latest workflow run
- Click on job name to see logs

### View container logs on VPS:
```bash
ssh -i ~/.ssh/id_rsa islam@34.71.218.241

# View all logs
docker compose -f /home/islam/HBRC_MONO/docker-compose.production.yml logs -f

# View API logs only
docker logs -f hbrc-api

# View Web logs only
docker logs -f hbrc-web

# View database logs only
docker logs -f hbrc-postgres
```

### Check container status:
```bash
ssh -i ~/.ssh/id_rsa islam@34.71.218.241
docker ps
```

## Troubleshooting

### Deployment fails at "Login to GHCR"
- Make sure the repository is public OR
- Add `GITHUB_TOKEN` with `read:packages` permission

### Deployment fails at SSH step
- Check that `VPS_SSH_KEY` secret is correct
- Make sure the SSH key has correct permissions on VPS

### Containers fail to start
- Check logs: `docker logs hbrc-api`
- Verify `.env.production` exists and has correct values
- Check if ports 3000, 5173, 5433 are available

### Database connection fails
- Verify `DB_PASSWORD` in `.env.production`
- Check if PostgreSQL container is running: `docker ps | grep postgres`
- Check database logs: `docker logs hbrc-postgres`

## Rollback to Previous Version

If something goes wrong, you can rollback:

```bash
ssh -i ~/.ssh/id_rsa islam@34.71.218.241
cd /home/islam/HBRC_MONO

# List available image tags
docker images | grep hbrc

# Use specific commit SHA
docker compose -f docker-compose.production.yml down
# Edit docker-compose.production.yml and change :latest to :COMMIT_SHA
docker compose -f docker-compose.production.yml --env-file .env.production up -d
```

## Testing the Deployment

After deployment completes:

1. **Check API**:
   ```bash
   curl http://34.71.218.241:3000
   # Should return: "Hello Islam!"
   ```

2. **Check Swagger Docs**:
   ```
   http://34.71.218.241:3000/api/docs
   ```

3. **Check Frontend**:
   ```
   http://34.71.218.241:5173
   ```

## Notes

- The workflow uses GitHub's built-in `GITHUB_TOKEN` for GHCR
- Images are private by default (only accessible to repository members)
- Docker build cache is stored in GitHub Actions for faster builds
- Old Docker images are automatically cleaned up after deployment
