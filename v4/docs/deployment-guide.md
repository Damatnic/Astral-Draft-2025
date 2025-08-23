# Astral Draft v4 - Production Deployment Guide

This comprehensive guide covers the complete production deployment process for Astral Draft v4, including infrastructure setup, CI/CD pipelines, monitoring, and operational procedures.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Infrastructure Setup](#infrastructure-setup)
- [Environment Configuration](#environment-configuration)
- [Database Setup](#database-setup)
- [Docker Deployment](#docker-deployment)
- [CI/CD Pipeline](#cicd-pipeline)
- [Monitoring and Alerting](#monitoring-and-alerting)
- [Security Considerations](#security-considerations)
- [Backup and Recovery](#backup-and-recovery)
- [Troubleshooting](#troubleshooting)
- [Maintenance Procedures](#maintenance-procedures)

## Overview

Astral Draft v4 uses a modern, cloud-native architecture designed for high availability, scalability, and security. The deployment strategy includes:

- **Blue-Green Deployments** for zero-downtime updates
- **Containerized Applications** using Docker
- **Automated CI/CD** with GitHub Actions
- **Comprehensive Monitoring** with Prometheus, Grafana, and Sentry
- **Database High Availability** with read replicas
- **Automated Backups** and disaster recovery procedures

## Prerequisites

### System Requirements

#### Production Environment
- **Compute**: Minimum 4 vCPUs, 8GB RAM per application instance
- **Storage**: 100GB SSD for application, 500GB for database
- **Network**: Load balancer with SSL termination
- **Operating System**: Ubuntu 20.04 LTS or Docker-compatible platform

#### Development Tools
- Docker Engine 20.10+
- Docker Compose 2.0+
- Node.js 18.17.0+
- PostgreSQL 15+
- Redis 7+

### Required Accounts and Services
- **GitHub** - For source code and CI/CD
- **Docker Registry** - For container images (GitHub Container Registry)
- **Cloud Provider** - AWS, Azure, or GCP
- **Monitoring Services** - Sentry for error tracking
- **Email Service** - Resend for transactional emails

## Infrastructure Setup

### Cloud Infrastructure

#### AWS Deployment
```bash
# Create VPC and networking
aws cloudformation create-stack \
  --stack-name astral-draft-network \
  --template-body file://cloudformation/network.yml

# Create RDS instance
aws cloudformation create-stack \
  --stack-name astral-draft-database \
  --template-body file://cloudformation/database.yml

# Create ElastiCache Redis cluster
aws cloudformation create-stack \
  --stack-name astral-draft-cache \
  --template-body file://cloudformation/cache.yml
```

#### Container Platform Setup
```bash
# Create application directory
sudo mkdir -p /opt/astral-draft
sudo chown $USER:$USER /opt/astral-draft
cd /opt/astral-draft

# Clone repository
git clone https://github.com/your-org/astral-draft.git .
cd v4

# Create data directories
sudo mkdir -p /opt/astral-draft/data/{postgres-master,postgres-slave,redis-master,prometheus,grafana,elasticsearch}
sudo chown -R 999:999 /opt/astral-draft/data/postgres-*
sudo chown -R 999:999 /opt/astral-draft/data/redis-*
```

### Load Balancer Configuration

#### Nginx Configuration
```nginx
upstream astral_draft_app {
    server app-blue:3000 weight=100;
    server app-green:3000 weight=0;
}

server {
    listen 443 ssl http2;
    server_name astraldraft.com;
    
    ssl_certificate /etc/nginx/ssl/astraldraft.com.crt;
    ssl_certificate_key /etc/nginx/ssl/astraldraft.com.key;
    
    location / {
        proxy_pass http://astral_draft_app;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location /api/health {
        proxy_pass http://astral_draft_app;
        access_log off;
    }
}
```

## Environment Configuration

### Production Environment Variables

1. **Copy the production environment template:**
   ```bash
   cp .env.production.example .env.production
   ```

2. **Configure required variables:**
   ```bash
   # Core application settings
   NODE_ENV=production
   NEXTAUTH_URL=https://astraldraft.com
   NEXTAUTH_SECRET=your-super-secure-nextauth-secret
   
   # Database configuration
   DATABASE_URL=postgresql://username:password@production-db:5432/astral_draft_v4
   
   # Redis configuration
   REDIS_URL=redis://production-redis:6379/0
   
   # External services
   SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
   RESEND_API_KEY=your-resend-api-key
   ```

3. **Validate environment configuration:**
   ```bash
   npm run env:validate
   ```

### Secrets Management

#### GitHub Secrets (for CI/CD)
```bash
# Set production database URL
gh secret set PRODUCTION_DATABASE_URL --body "postgresql://..."

# Set Redis URL
gh secret set PRODUCTION_REDIS_URL --body "redis://..."

# Set Sentry DSN
gh secret set SENTRY_DSN --body "https://..."

# Set authentication secrets
gh secret set NEXTAUTH_SECRET --body "$(openssl rand -base64 32)"
```

#### Container Secrets
```bash
# Create secrets directory
sudo mkdir -p /opt/astral-draft/secrets

# Create database password file
echo "your-secure-password" | sudo tee /opt/astral-draft/secrets/postgres_password

# Create Redis password file
echo "your-redis-password" | sudo tee /opt/astral-draft/secrets/redis_password

# Set proper permissions
sudo chmod 600 /opt/astral-draft/secrets/*
```

## Database Setup

### Primary Database Setup

1. **Initialize the database:**
   ```bash
   # Run initial migrations
   npm run db:migrate
   
   # Seed initial data
   npm run db:seed
   ```

2. **Create database users:**
   ```sql
   -- Create application user
   CREATE USER astral_draft_app WITH PASSWORD 'secure-password';
   GRANT ALL PRIVILEGES ON DATABASE astral_draft_v4 TO astral_draft_app;
   
   -- Create read-only user for monitoring
   CREATE USER grafana_readonly WITH PASSWORD 'readonly-password';
   GRANT CONNECT ON DATABASE astral_draft_v4 TO grafana_readonly;
   GRANT USAGE ON SCHEMA public TO grafana_readonly;
   GRANT SELECT ON ALL TABLES IN SCHEMA public TO grafana_readonly;
   ```

### Read Replica Setup (Optional)

1. **Configure master for replication:**
   ```bash
   # Edit postgresql.conf
   wal_level = replica
   max_wal_senders = 10
   max_replication_slots = 10
   ```

2. **Create replication user:**
   ```sql
   CREATE USER replicator REPLICATION LOGIN CONNECTION LIMIT 1 ENCRYPTED PASSWORD 'replication-password';
   ```

## Docker Deployment

### Production Deployment

1. **Pull the latest images:**
   ```bash
   docker pull ghcr.io/your-org/astral-draft-v4:latest
   ```

2. **Start the production stack:**
   ```bash
   # Start with production configuration
   docker-compose -f docker-compose.prod.yml up -d
   
   # Verify all services are running
   docker-compose -f docker-compose.prod.yml ps
   ```

3. **Run health checks:**
   ```bash
   ./scripts/health-check.sh --environment production --check-type full https://astraldraft.com
   ```

### Blue-Green Deployment

1. **Deploy to green slot:**
   ```bash
   ./scripts/deploy.sh \
     --environment production \
     --image ghcr.io/your-org/astral-draft-v4:v1.2.3 \
     --strategy blue-green
   ```

2. **Switch traffic after validation:**
   ```bash
   # Traffic switch is handled automatically by the deployment script
   # Manual switch if needed:
   docker-compose -f docker-compose.prod.yml up -d app-green
   ```

## CI/CD Pipeline

### GitHub Actions Setup

1. **Configure repository secrets:**
   ```bash
   # Production deployment secrets
   gh secret set PRODUCTION_DATABASE_URL
   gh secret set PRODUCTION_REDIS_URL
   gh secret set NEXTAUTH_SECRET
   gh secret set SENTRY_DSN
   
   # Cloud provider credentials
   gh secret set AZURE_CREDENTIALS
   gh secret set AWS_ACCESS_KEY_ID
   gh secret set AWS_SECRET_ACCESS_KEY
   
   # Notification webhooks
   gh secret set SLACK_WEBHOOK_URL
   gh secret set DISCORD_WEBHOOK_URL
   ```

2. **Deployment workflow triggers:**
   - **Staging**: Push to `develop` branch
   - **Production**: Push to `main` branch or create release tag
   - **Manual**: Workflow dispatch with environment selection

### Pipeline Stages

1. **Code Quality & Security**
   - ESLint and Prettier checks
   - TypeScript compilation
   - Security vulnerability scanning
   - Dependency auditing

2. **Testing**
   - Unit tests with coverage
   - Integration tests
   - End-to-end tests
   - Performance testing

3. **Build & Security Scan**
   - Docker image build
   - Container security scanning
   - Image signing with Cosign

4. **Deployment**
   - Blue-green deployment
   - Health checks
   - Smoke tests
   - Rollback on failure

5. **Post-Deployment**
   - Performance monitoring
   - Security scanning
   - Notification delivery

## Monitoring and Alerting

### Prometheus Setup

1. **Configure Prometheus:**
   ```bash
   # Copy production configuration
   cp monitoring/prometheus/prometheus.prod.yml /opt/prometheus/prometheus.yml
   
   # Start Prometheus
   docker-compose -f docker-compose.prod.yml up -d prometheus
   ```

2. **Verify metrics collection:**
   ```bash
   curl http://localhost:9090/api/v1/query?query=up
   ```

### Grafana Setup

1. **Access Grafana:**
   - URL: `http://your-server:3001`
   - Default credentials: `admin/admin_password`

2. **Import dashboards:**
   ```bash
   # Dashboard will be auto-imported from monitoring/grafana/dashboards/
   ```

3. **Configure alerting:**
   - Set up notification channels (Slack, email, PagerDuty)
   - Configure alert rules for critical metrics
   - Test alert delivery

### Sentry Integration

1. **Configure Sentry in application:**
   ```javascript
   import './monitoring/sentry.config.js';
   ```

2. **Set up alerts:**
   - Error rate threshold alerts
   - Performance degradation alerts
   - New release monitoring

## Security Considerations

### Network Security

1. **Firewall configuration:**
   ```bash
   # Allow only necessary ports
   ufw allow 22    # SSH
   ufw allow 80    # HTTP
   ufw allow 443   # HTTPS
   ufw enable
   ```

2. **Container network isolation:**
   - Database network is internal-only
   - Application network allows external access
   - Monitoring network for observability tools

### SSL/TLS Configuration

1. **Obtain SSL certificates:**
   ```bash
   # Using Let's Encrypt
   certbot certonly --nginx -d astraldraft.com
   ```

2. **Configure strong SSL settings:**
   ```nginx
   ssl_protocols TLSv1.2 TLSv1.3;
   ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
   ssl_prefer_server_ciphers off;
   add_header Strict-Transport-Security "max-age=63072000" always;
   ```

### Application Security

1. **Environment variables validation:**
   ```bash
   # All required secrets must be present
   npm run env:validate:production
   ```

2. **Security headers:**
   - CSP (Content Security Policy)
   - HSTS (HTTP Strict Transport Security)
   - X-Frame-Options
   - X-Content-Type-Options

## Backup and Recovery

### Automated Backups

1. **Configure backup schedule:**
   ```bash
   # Set up daily backups at 2 AM
   crontab -e
   0 2 * * * /opt/astral-draft/scripts/backup.sh --environment production
   ```

2. **Test backup restoration:**
   ```bash
   # Test restore procedure monthly
   ./scripts/backup.sh --environment staging --type database --test-restore
   ```

### Disaster Recovery

1. **Database failover:**
   ```bash
   # Promote read replica to primary
   ./scripts/promote-replica.sh --environment production
   ```

2. **Application recovery:**
   ```bash
   # Rollback to previous version
   ./scripts/rollback.sh --environment production --version v1.2.2
   ```

## Troubleshooting

### Common Issues

#### Application Not Starting
```bash
# Check container logs
docker-compose -f docker-compose.prod.yml logs app-blue

# Check system resources
docker stats
free -h
df -h

# Verify environment variables
docker-compose -f docker-compose.prod.yml exec app-blue env | grep NODE_ENV
```

#### Database Connection Issues
```bash
# Test database connectivity
docker-compose -f docker-compose.prod.yml exec app-blue npm run db:status

# Check database logs
docker-compose -f docker-compose.prod.yml logs postgres-master

# Verify database user permissions
psql -h localhost -U astral_draft_app -d astral_draft_v4 -c "\du"
```

#### Performance Issues
```bash
# Check application metrics
curl https://astraldraft.com/api/metrics

# Monitor database performance
docker-compose -f docker-compose.prod.yml exec postgres-master \
  psql -U postgres -c "SELECT * FROM pg_stat_activity;"

# Check Redis performance
docker-compose -f docker-compose.prod.yml exec redis-cluster redis-cli info stats
```

### Health Check Procedures

```bash
# Basic health check
./scripts/health-check.sh https://astraldraft.com

# Comprehensive health check
./scripts/health-check.sh --check-type full --environment production https://astraldraft.com

# Monitoring health check
./scripts/health-check.sh --check-type monitoring --format json https://astraldraft.com
```

## Maintenance Procedures

### Regular Maintenance Tasks

#### Weekly
- [ ] Review application logs for errors
- [ ] Check SSL certificate expiration
- [ ] Verify backup completion
- [ ] Review performance metrics

#### Monthly
- [ ] Update system packages
- [ ] Rotate application secrets
- [ ] Test disaster recovery procedures
- [ ] Review and update monitoring alerts

#### Quarterly
- [ ] Security audit and vulnerability assessment
- [ ] Performance optimization review
- [ ] Capacity planning review
- [ ] Documentation updates

### Update Procedures

#### Application Updates
```bash
# 1. Deploy to staging
git checkout main
git pull origin main
./scripts/deploy.sh --environment staging

# 2. Run tests
npm run test:e2e:staging

# 3. Deploy to production
./scripts/deploy.sh --environment production --image latest
```

#### Database Schema Updates
```bash
# 1. Backup database
./scripts/backup.sh --environment production --type database

# 2. Run migrations
./scripts/migrate.sh --environment production

# 3. Verify data integrity
./scripts/verify-data.sh --environment production
```

#### Infrastructure Updates
```bash
# 1. Update Docker images
docker-compose -f docker-compose.prod.yml pull

# 2. Rolling update
docker-compose -f docker-compose.prod.yml up -d --no-deps app-blue
./scripts/health-check.sh
docker-compose -f docker-compose.prod.yml up -d --no-deps app-green
```

### Emergency Procedures

#### Immediate Rollback
```bash
# Quick rollback to previous version
./scripts/rollback.sh --environment production --emergency
```

#### Database Emergency Recovery
```bash
# Restore from latest backup
./scripts/restore.sh --environment production --backup latest --force
```

#### Traffic Diversion
```bash
# Divert traffic to maintenance page
docker-compose -f docker-compose.prod.yml up -d maintenance-page
```

## Support and Contact Information

- **Operations Team**: ops@astraldraft.com
- **Development Team**: dev@astraldraft.com
- **Emergency Contact**: +1-XXX-XXX-XXXX
- **Status Page**: https://status.astraldraft.com
- **Documentation**: https://docs.astraldraft.com

## Appendices

### Appendix A: Environment Variables Reference
See [environment-variables.md](./environment-variables.md) for complete reference.

### Appendix B: API Documentation
See [API_DOCUMENTATION.md](../API_DOCUMENTATION.md) for API reference.

### Appendix C: Security Checklist
- [ ] All secrets are properly configured
- [ ] SSL certificates are valid and properly configured
- [ ] Firewall rules are restrictive
- [ ] Database access is limited to application users
- [ ] Container images are scanned for vulnerabilities
- [ ] Security headers are configured
- [ ] Rate limiting is enabled
- [ ] Audit logging is active

### Appendix D: Performance Baselines
- **Response Time P95**: < 500ms
- **Response Time P99**: < 1000ms
- **Uptime**: > 99.9%
- **Error Rate**: < 0.1%
- **Database Query Time P95**: < 100ms
- **Memory Usage**: < 80% of allocated
- **CPU Usage**: < 70% average