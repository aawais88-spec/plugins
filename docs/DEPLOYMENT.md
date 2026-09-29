# Deployment Guide

Guide for deploying the plugin framework to production.

## Pre-Deployment Checklist

- [ ] All tests passing (`npm test`)
- [ ] Code linted (`npm run lint`)
- [ ] Test coverage > 80% (`npm run test:coverage`)
- [ ] Documentation updated
- [ ] Version bumped in `package.json`
- [ ] Git commits clean
- [ ] No uncommitted changes

## Build Process

```bash
# Install dependencies
npm ci

# Run full test suite
npm test

# Build/prepare (if applicable)
npm run build

# Generate documentation
npm run docs
```

## Environment Setup

### Production Environment Variables
```bash
NODE_ENV=production
LOG_LEVEL=warn
CACHE_TTL=3600
```

### Development Environment Variables
```bash
NODE_ENV=development
LOG_LEVEL=debug
CACHE_TTL=300
```

## Deployment Steps

### 1. Prepare
```bash
# Ensure all changes are committed
git status

# Create release branch
git checkout -b release/v1.0.0

# Update version
npm version patch  # or minor/major
```

### 2. Build
```bash
# Install fresh dependencies
npm ci

# Run tests
npm test

# Build artifacts (if applicable)
npm run build
```

### 3. Deploy
```bash
# Push to production
git push origin release/v1.0.0

# Tag release
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0
```

### 4. Post-Deployment
```bash
# Monitor logs
npm start -- --log-level=debug

# Verify health
curl http://localhost:3000/health

# Check metrics
npm run metrics
```

## Monitoring

### Health Checks
- Plugin initialization success
- Cache hit rates
- Logger output levels
- Error rates

### Performance Metrics
- Plugin execution time
- Cache memory usage
- Log throughput
- System resources

## Rollback

If deployment fails:

```bash
# Revert to previous version
git revert <commit-hash>

# Or checkout previous tag
git checkout v0.9.0

# Redeploy
npm install
npm start
```

## Security Considerations

### Before Deployment
- [ ] No hardcoded secrets
- [ ] Dependencies audited (`npm audit`)
- [ ] Code reviewed
- [ ] Logs don't contain sensitive data

### Production Settings
```javascript
// Disable debug logging
logger.level = 'warn';

// Enable authentication
cache.requireAuth = true;

// Set security headers
app.use(helmet());
```

### Secrets Management
```bash
# Use environment variables
NODE_ENV=production
API_KEY=$(aws secretsmanager get-secret-value --secret-id api-key)
DATABASE_URL=$(aws secretsmanager get-secret-value --secret-id db-url)
```

## Scaling Considerations

### Single Server
- Current setup suitable for single instance
- Monitor memory and CPU

### Multiple Servers
- Use distributed cache (Redis)
- Use centralized logging (ELK stack)
- Use load balancer

### Cloud Deployment

#### AWS
```bash
# Create Elastic Beanstalk environment
eb create production-env

# Deploy
eb deploy

# Monitor
eb logs
```

#### Docker
```dockerfile
FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
CMD ["npm", "start"]
```

```bash
# Build image
docker build -t plugins:1.0.0 .

# Run container
docker run -e NODE_ENV=production plugins:1.0.0
```

## Maintenance

### Regular Tasks
- [ ] Weekly: Review error logs
- [ ] Monthly: Update dependencies
- [ ] Monthly: Review cache hit rates
- [ ] Quarterly: Security audit

### Updates
```bash
# Check outdated packages
npm outdated

# Update packages
npm update

# Major version update (careful!)
npm install package@latest
```

## Disaster Recovery

### Backup Strategy
```bash
# Backup configuration
git commit -am "Backup production config"

# Backup data
cp -r ./data ./data.backup.$(date +%s)
```

### Recovery Process
1. Identify the issue
2. Create rollback branch
3. Revert bad changes
4. Test thoroughly
5. Redeploy
6. Monitor closely

## Support & Documentation

- Logs: `/var/log/plugins/`
- Metrics: `http://localhost:3000/metrics`
- Health: `http://localhost:3000/health`
- Docs: `./docs/`
