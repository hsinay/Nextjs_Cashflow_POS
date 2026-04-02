# 🚀 Deployment & Production Preparation Guide

## Pre-Deployment Checklist

### ✅ Code Quality

- [ ] All TypeScript compiles without errors
  ```bash
  npm run tsc --noEmit
  ```

- [ ] All ESLint rules pass
  ```bash
  npm run lint
  ```

- [ ] No console errors or warnings
  ```bash
  npm run dev
  # Check browser console F12
  ```

- [ ] Production build succeeds
  ```bash
  npm run build
  ```

### ✅ Database Preparation

- [ ] All migrations created and tested
  ```bash
  npm run prisma:migrate dev
  npx prisma migrate status
  ```

- [ ] Database schema is current
  ```bash
  npm run db:push
  ```

- [ ] Indexes created for performance
  - ✅ POSSession (cashierId, status, openedAt)
  - ✅ DayBook (date, status)
  - ✅ Transaction (sessionId, createdAt)
  - ✅ User (username, email)

- [ ] Backup strategy in place
  ```bash
  # PostgreSQL backup
  pg_dump -U username dbname > backup.sql
  ```

### ✅ Environment Configuration

- [ ] `.env.production` configured with:
  ```env
  DATABASE_URL=postgresql://...
  NEXTAUTH_SECRET=generated-secret-key
  NEXTAUTH_URL=https://yourdomain.com
  NODE_ENV=production
  ```

- [ ] All environment variables validated
  ```bash
  npm run validate:env
  ```

- [ ] API rate limiting configured
- [ ] CORS settings appropriate
- [ ] SSL/TLS certificates valid

### ✅ Security Audit

- [ ] No hardcoded secrets in code
- [ ] All API endpoints require authentication
- [ ] Role-based access control verified
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention verified
- [ ] XSS prevention verified
- [ ] CSRF protection enabled
- [ ] Sensitive data not logged

```bash
# Security scan
npm audit
npm audit fix
```

### ✅ Performance Optimization

- [ ] Bundle size analyzed
  ```bash
  npm run build -- --analyze
  ```

- [ ] Image optimization
- [ ] Code splitting enabled
- [ ] Caching headers configured
- [ ] Compression enabled (gzip, brotli)
- [ ] CDN configured (if applicable)
- [ ] Database queries optimized
  - No N+1 queries
  - All queries indexed
  - Pagination implemented

### ✅ Testing Completed

- [ ] Unit tests pass (if any)
- [ ] Integration tests pass
- [ ] End-to-end tests pass
- [ ] Manual testing completed
- [ ] Performance tests pass
- [ ] Security tests pass
- [ ] Load testing completed

### ✅ Monitoring & Logging

- [ ] Error logging configured
  - [ ] Winston or similar setup
  - [ ] Log rotation enabled
  - [ ] Error alerts configured

- [ ] Application monitoring enabled
  - [ ] Sentry or similar
  - [ ] Performance monitoring
  - [ ] Transaction tracking

- [ ] Database monitoring
  - [ ] Query performance
  - [ ] Connection pooling
  - [ ] Replication status (if applicable)

### ✅ Backup & Disaster Recovery

- [ ] Automated backups configured
  - [ ] Database backups (daily)
  - [ ] File backups (if needed)
  - [ ] Backup testing in place

- [ ] Recovery procedures documented
- [ ] Rollback plan prepared
- [ ] Data retention policy set

### ✅ Documentation

- [ ] README updated for production
- [ ] API documentation current
- [ ] Deployment runbook created
- [ ] Incident response plan documented
- [ ] Troubleshooting guide prepared

---

## Deployment Steps

### Step 1: Pre-Deployment Tests

```bash
# Build application
npm run build

# Check for build errors
if [ $? -ne 0 ]; then
  echo "Build failed! Fix errors before deploying."
  exit 1
fi

# Run linting
npm run lint

# Type checking
npm run tsc --noEmit

# Database validation
npx prisma validate
```

### Step 2: Database Migration (if needed)

```bash
# Create migration if schema changed
npm run prisma:migrate dev --name "description"

# Deploy migration to production
# For production, use:
npm run prisma:migrate deploy

# Verify migration
npx prisma migrate status
```

### Step 3: Environment Setup

```bash
# Copy production environment
cp .env.example .env.production

# Set production variables
export DATABASE_URL="postgresql://..."
export NEXTAUTH_SECRET="$(openssl rand -base64 32)"
export NEXTAUTH_URL="https://yourdomain.com"
export NODE_ENV=production
```

### Step 4: Application Deployment

#### Option A: Self-Hosted (VPS/EC2)

```bash
# SSH into server
ssh user@your-server.com

# Clone repository
git clone https://github.com/your-org/pos-system.git
cd pos-system

# Install dependencies
npm ci  # Use ci for production (reproducible installs)

# Generate Prisma client
npm run prisma:generate

# Build application
npm run build

# Start with PM2
pm2 start npm --name "pos-system" -- start
pm2 save
pm2 startup

# Configure nginx reverse proxy
# (see nginx-config.conf below)
```

#### Option B: Cloud Deployment (Vercel/Railway/Render)

```bash
# Vercel deployment
vercel --prod

# Railway deployment
railway up

# Render deployment
git push heroku main
```

#### Option C: Docker Deployment

```bash
# Build Docker image
docker build -t pos-system:latest .

# Run container
docker run -d \
  -e DATABASE_URL="postgresql://..." \
  -e NEXTAUTH_SECRET="..." \
  -e NEXTAUTH_URL="https://yourdomain.com" \
  -p 3000:3000 \
  --name pos-system \
  pos-system:latest

# Stop container
docker stop pos-system
```

### Step 5: Verification

```bash
# Check application is running
curl https://yourdomain.com/api/health

# Expected response:
# { "status": "healthy" }

# Check logs
tail -f /var/log/pos-system/app.log

# Test critical endpoints
curl -H "Authorization: Bearer TOKEN" \
  https://yourdomain.com/api/pos-sessions

# Verify database connection
psql -h your-db-host -U username -d dbname \
  -c "SELECT COUNT(*) FROM \"POSSession\";"
```

### Step 6: Post-Deployment

```bash
# Clear cache if applicable
redis-cli FLUSHALL

# Run health checks
npm run health-check

# Verify backups working
# Test database restoration from backup

# Send deployment notification
# Slack/Teams notification to team
```

---

## Nginx Configuration

```nginx
upstream pos-app {
  server localhost:3000;
  server localhost:3001;
  server localhost:3002;
  keepalive 64;
}

server {
  listen 80;
  server_name yourdomain.com www.yourdomain.com;
  
  # Redirect HTTP to HTTPS
  return 301 https://$server_name$request_uri;
}

server {
  listen 443 ssl http2;
  server_name yourdomain.com www.yourdomain.com;

  # SSL certificates
  ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

  # Security headers
  add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
  add_header X-Content-Type-Options "nosniff" always;
  add_header X-Frame-Options "SAMEORIGIN" always;
  add_header X-XSS-Protection "1; mode=block" always;

  # Compression
  gzip on;
  gzip_vary on;
  gzip_types text/plain text/css text/xml text/javascript 
             application/x-javascript application/xml+rss;

  # Rate limiting
  limit_req_zone $binary_remote_addr zone=api:10m rate=100r/s;
  limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;

  location /api/auth/signin {
    limit_req zone=login burst=10 nodelay;
    proxy_pass http://pos-app;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
  }

  location /api {
    limit_req zone=api burst=100 nodelay;
    proxy_pass http://pos-app;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
  }

  location / {
    proxy_pass http://pos-app;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
  }

  # Static files caching
  location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
  }
}
```

---

## PM2 Configuration

```javascript
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'pos-system',
      script: 'npm start',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: '/var/log/pos-system/error.log',
      out_file: '/var/log/pos-system/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      restart_delay: 4000,
      max_memory_restart: '1G',
      watch: false,
      ignore_watch: ['node_modules', '.next'],
      listen_timeout: 3000,
      kill_timeout: 5000,
    },
  ],
};
```

```bash
# Deploy with PM2
pm2 start ecosystem.config.js

# Monitor
pm2 monit

# View logs
pm2 logs pos-system

# Restart
pm2 restart pos-system

# Save state for boot
pm2 save
```

---

## Docker Configuration

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy application
COPY . .

# Generate Prisma client
RUN npm run prisma:generate

# Build application
RUN npm run build

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start application
CMD ["npm", "start"]
```

```bash
# Build and tag
docker build -t your-registry/pos-system:latest .

# Push to registry
docker push your-registry/pos-system:latest

# Run in production
docker run -d \
  --name pos-system \
  --restart unless-stopped \
  -e DATABASE_URL="postgresql://..." \
  -e NEXTAUTH_SECRET="..." \
  -e NEXTAUTH_URL="https://yourdomain.com" \
  -p 3000:3000 \
  --log-driver json-file \
  --log-opt max-size=10m \
  --log-opt max-file=3 \
  your-registry/pos-system:latest
```

---

## Rollback Plan

If deployment fails:

```bash
# Stop current version
pm2 stop pos-system

# Revert code
git revert HEAD
git push origin main

# Rebuild
npm run build

# Restart
pm2 start pos-system

# Monitor
pm2 logs pos-system
```

---

## Post-Deployment Validation

- [ ] Application loads without errors
- [ ] Login works with all roles
- [ ] POS dashboard functional
- [ ] Payment processing works
- [ ] Reports generate correctly
- [ ] Terminal dashboard shows correct data
- [ ] Database connections stable
- [ ] Logging working properly
- [ ] Backups executing
- [ ] Monitoring alerts configured
- [ ] Team notified of deployment

---

## Monitoring & Maintenance

### Daily Tasks
- [ ] Check application logs for errors
- [ ] Verify database is healthy
- [ ] Monitor disk space usage
- [ ] Confirm backups completed

### Weekly Tasks
- [ ] Review performance metrics
- [ ] Check security audit logs
- [ ] Verify all endpoints responding
- [ ] Test disaster recovery procedures

### Monthly Tasks
- [ ] Security updates applied
- [ ] Dependency updates reviewed
- [ ] Database maintenance (VACUUM, ANALYZE)
- [ ] Capacity planning review

---

## Support & Emergency Contacts

- **DevOps Lead**: [contact]
- **Database Admin**: [contact]
- **Security Officer**: [contact]
- **Emergency Hotline**: [number]

---

## Success Criteria

✅ Application accessible at production URL  
✅ All endpoints returning correct status codes  
✅ Database queries completing in <500ms  
✅ No errors in application logs  
✅ Monitoring and alerting active  
✅ Backups executing on schedule  
✅ Team trained on incident response  
✅ Documentation complete and accessible  

