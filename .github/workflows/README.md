# GitHub Actions Deployment Workflows

This directory contains automated deployment workflows that run migrations and deploy your application when you push to the repository.

## Workflows

### 1. `deploy.yml` - General Deployment
Deploys directly to your server via SSH. Handles:
- ✅ Running database migrations
- ✅ Regenerating Prisma Client
- ✅ Restarting application (pm2, docker-compose, or systemd)

### 2. `deploy-docker.yml` - Docker-Based Deployment
Builds a Docker image, pushes to registry, and deploys. Handles:
- ✅ Building Docker image
- ✅ Pushing to container registry (Docker Hub, GHCR, etc.)
- ✅ Running migrations before deployment
- ✅ Deploying new container version

## Setup Instructions

### Step 1: Configure GitHub Secrets

Go to your GitHub repository → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

Add these secrets:

#### Required Secrets:

1. **`DATABASE_URL`** - Your production database connection string
   ```
   mysql://user:password@host:port/database
   ```

2. **`DEPLOY_SSH_HOST`** - Your server IP or domain
   ```
   192.168.1.100
   # or
   example.com
   ```

3. **`DEPLOY_SSH_USER`** - SSH username
   ```
   deploy
   # or
   root
   ```

4. **`DEPLOY_SSH_KEY`** - Private SSH key (the entire content)
   ```bash
   # Generate if you don't have one:
   ssh-keygen -t ed25519 -C "github-actions"
   # Copy the private key content (id_ed25519)
   ```

#### Optional Secrets (for Docker deployment):

5. **`DOCKER_REGISTRY`** - Container registry URL (leave empty to use GitHub Container Registry)
   ```
   docker.io
   # or
   ghcr.io
   ```

6. **`DOCKER_IMAGE_NAME`** - Docker image name
   ```
   your-username/optyshop-backend
   ```

7. **`DOCKER_REGISTRY_USERNAME`** - Registry username
8. **`DOCKER_REGISTRY_PASSWORD`** - Registry password or token
9. **`DOCKER_CONTAINER_NAME`** - Container name on server
   ```
   optyshop-backend
   ```

#### Other Optional Secrets:

10. **`DEPLOY_PATH`** - Path on server where app is located (default: `/app`)
11. **`DEPLOY_SSH_PORT`** - SSH port (default: `22`)
12. **`HEALTH_CHECK_URL`** - URL for health check after deployment
    ```
    https://api.yourapp.com
    ```

### Step 2: Configure SSH Access

On your server, add the GitHub Actions public key to authorized_keys:

```bash
# On your server
mkdir -p ~/.ssh
chmod 700 ~/.ssh
echo "YOUR_PUBLIC_KEY_HERE" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

### Step 3: Choose Your Workflow

**For Direct SSH Deployment:**
- Use `deploy.yml` (recommended for simple deployments)
- Ensure secrets are configured
- Push to `main`, `master`, or `production` branch

**For Docker Deployment:**
- Use `deploy-docker.yml` 
- Ensure Docker registry secrets are configured
- Push to trigger deployment

### Step 4: Test Deployment

1. Push to your main branch:
   ```bash
   git push origin main
   ```

2. Check GitHub Actions tab to see deployment progress

3. Verify deployment:
   ```bash
   # SSH into your server
   ssh user@your-server
   
   # Check if migrations ran
   cd /app
   npx prisma migrate status
   
   # Check application logs
   pm2 logs
   # or
   docker logs optyshop-backend
   ```

## How It Works

### On Every Push:

1. **Checkout code** - Gets latest code from repository
2. **Setup Node.js** - Installs Node.js 18
3. **Install dependencies** - Runs `npm ci`
4. **Generate Prisma Client** - Ensures Prisma is ready
5. **Run migrations** - Executes `prisma migrate deploy`
6. **Deploy** - Either:
   - SSH: Pulls code, installs deps, runs migrations, restarts app
   - Docker: Builds image, pushes to registry, deploys container
7. **Health check** - Verifies deployment was successful

### Migration Safety

- Migrations run **before** the application starts
- If a migration fails, the workflow will report it
- The Dockerfile CMD also runs migrations on container start (as a backup)

## Troubleshooting

### Migration Fails

**Error:** "Migration failed"
- Check `DATABASE_URL` is correct
- Verify database user has permissions (ALTER, CREATE INDEX)
- Check migration files are in `prisma/migrations/`

### SSH Connection Fails

**Error:** "Connection refused" or "Permission denied"
- Verify `DEPLOY_SSH_HOST` and `DEPLOY_SSH_USER`
- Check SSH key is correctly added to secrets
- Test SSH connection manually: `ssh -i key user@host`

### Application Not Restarting

**Error:** Deployment succeeds but app doesn't restart
- Check process manager (pm2, docker, systemd)
- Manually restart after deployment
- Add custom restart command to workflow

### Docker Build Fails

**Error:** "Build failed"
- Check Dockerfile syntax
- Verify all required files are present
- Check build logs in Actions tab

## Manual Deployment

You can also trigger deployment manually:

1. Go to **Actions** tab in GitHub
2. Select workflow (deploy.yml or deploy-docker.yml)
3. Click **Run workflow**
4. Select branch and click **Run workflow**

## Security Notes

- ✅ Secrets are encrypted and never exposed in logs
- ✅ SSH keys are stored securely in GitHub Secrets
- ✅ Database credentials are never logged
- ⚠️ Never commit secrets to repository
- ⚠️ Rotate SSH keys regularly
- ⚠️ Use least-privilege database user

## Next Steps

1. Configure secrets in GitHub
2. Test deployment on a feature branch first
3. Set up monitoring/alerts for failed deployments
4. Consider adding staging environment workflow
5. Set up deployment notifications (Slack, Discord, etc.)
