# Astral Draft v4 - Rollback Plan Documentation

## Overview

This document provides comprehensive rollback procedures for Astral Draft v4, covering different scenarios, automated and manual rollback processes, and recovery strategies to ensure minimal downtime and data integrity.

## Table of Contents

1. [Rollback Strategy Overview](#rollback-strategy-overview)
2. [Rollback Types](#rollback-types)
3. [Decision Matrix](#decision-matrix)
4. [Automated Rollback](#automated-rollback)
5. [Manual Rollback Procedures](#manual-rollback-procedures)
6. [Database Rollback](#database-rollback)
7. [Emergency Rollback](#emergency-rollback)
8. [Post-Rollback Procedures](#post-rollback-procedures)
9. [Testing and Validation](#testing-and-validation)
10. [Communication Protocols](#communication-protocols)

## Rollback Strategy Overview

### Core Principles

1. **Minimize Downtime**: Rollback procedures should restore service as quickly as possible
2. **Data Integrity**: Ensure no data loss during rollback operations
3. **Automated First**: Prefer automated rollback with manual override capability
4. **Clear Communication**: Keep all stakeholders informed throughout the process
5. **Post-Mortem**: Conduct thorough analysis after each rollback

### Rollback Capability Timeline

- **0-5 minutes**: Automated blue-green application rollback
- **5-15 minutes**: Manual application rollback with verification
- **15-30 minutes**: Database rollback to previous backup
- **30+ minutes**: Full environment restoration from backups

## Rollback Types

### 1. Application Rollback
**Purpose**: Revert application code to previous version  
**Scope**: Application containers only  
**Duration**: 2-5 minutes  
**Risk**: Low (no data changes)

### 2. Database Rollback
**Purpose**: Revert database schema and data changes  
**Scope**: Database structure and data  
**Duration**: 10-30 minutes  
**Risk**: Medium (potential data loss)

### 3. Full System Rollback
**Purpose**: Complete environment restoration  
**Scope**: Application, database, and configuration  
**Duration**: 20-60 minutes  
**Risk**: High (temporary service interruption)

### 4. Configuration Rollback
**Purpose**: Revert environment variables and settings  
**Scope**: Configuration files and environment variables  
**Duration**: 1-2 minutes  
**Risk**: Low (configuration changes only)

## Decision Matrix

### When to Rollback

| Scenario | Application | Database | Full System | Priority |
|----------|-------------|----------|-------------|----------|
| Application errors (5xx) | ✅ | ❌ | ❌ | High |
| Performance degradation | ✅ | ❌ | ❌ | Medium |
| Database corruption | ❌ | ✅ | ❌ | Critical |
| Security vulnerability | ✅ | ❌ | ❌ | Critical |
| Migration failure | ❌ | ✅ | ❌ | High |
| Complete system failure | ❌ | ❌ | ✅ | Critical |
| Configuration issues | 🔧 | ❌ | ❌ | Medium |

**Legend:**
- ✅ Recommended rollback type
- ❌ Not applicable
- 🔧 Configuration rollback

### Rollback Triggers

#### Automated Triggers
- Error rate > 5% for 5 consecutive minutes
- Response time > 10 seconds for 5 consecutive minutes
- Health check failures for 3 consecutive checks
- Security alert with critical severity
- Database connection failures > 50%

#### Manual Triggers
- User-reported critical issues
- Business impact identified
- Data corruption detected
- Security incident confirmed
- Stakeholder decision

## Automated Rollback

### Blue-Green Deployment Rollback

The system automatically maintains two deployment slots (blue and green) and can instantly switch between them.

#### Automatic Rollback Process

1. **Monitoring Detection**
   - Continuous monitoring detects failure conditions
   - Automated health checks fail predefined thresholds
   - Alert system triggers rollback procedure

2. **Traffic Switch**
   - Load balancer immediately routes traffic to previous slot
   - Current slot marked as failed
   - Previous slot marked as active

3. **Verification**
   - Health checks run on reverted environment
   - Monitoring confirms service restoration
   - Failed deployment slot isolated for investigation

#### Configuration

```yaml
# .github/workflows/deploy.yml
rollback_triggers:
  error_rate_threshold: 5%
  response_time_threshold: 10s
  health_check_failures: 3
  monitoring_window: 5m
```

### Circuit Breaker Pattern

Implements automatic service degradation before full rollback:

1. **Service Degradation** (Error rate 2-5%)
   - Disable non-critical features
   - Reduce external API calls
   - Enable caching fallbacks

2. **Partial Rollback** (Error rate 5-10%)
   - Rollback specific microservices
   - Maintain core functionality
   - Isolate problematic components

3. **Full Rollback** (Error rate >10%)
   - Complete application rollback
   - Switch to previous stable version
   - Activate incident response

## Manual Rollback Procedures

### Application Rollback

#### Quick Application Rollback (Recommended)

```bash
# Emergency rollback to previous version
./scripts/rollback.sh \
  --environment production \
  --reason "application-error" \
  --force
```

#### Rollback to Specific Version

```bash
# Rollback to known good version
./scripts/rollback.sh \
  --environment production \
  --version v4.0.5 \
  --reason "specific-bug-fix" \
  --type application
```

#### Step-by-Step Manual Process

1. **Preparation**
   ```bash
   # Navigate to project directory
   cd /opt/astral-draft/v4
   
   # Verify current deployment status
   ./scripts/health-check.sh --environment production
   
   # Check deployment history
   ls -la logs/deployment_*.json
   ```

2. **Execute Rollback**
   ```bash
   # Set environment variables
   export ENVIRONMENT=production
   export ROLLBACK_REASON="manual-rollback-reason"
   
   # Execute rollback
   ./scripts/rollback.sh \
     --environment production \
     --type application \
     --reason "$ROLLBACK_REASON"
   ```

3. **Verification**
   ```bash
   # Wait for rollback completion
   sleep 30
   
   # Verify application health
   ./scripts/health-check.sh \
     --environment production \
     --check-type full
   
   # Check application logs
   docker logs astral-draft-v4-app-blue
   ```

### Infrastructure Rollback

#### Load Balancer Configuration

```bash
# Revert nginx configuration
cd /opt/astral-draft/v4/nginx
cp nginx.conf.backup nginx.conf

# Reload nginx
docker-compose -f docker-compose.prod.yml exec nginx nginx -s reload
```

#### Container Rollback

```bash
# Stop current containers
docker-compose -f docker-compose.prod.yml stop app-green

# Start previous version
docker-compose -f docker-compose.prod.yml up -d app-blue

# Verify container health
docker ps --filter "name=astral-draft-v4"
```

## Database Rollback

### Pre-Rollback Checklist

- [ ] Verify backup integrity
- [ ] Stop application traffic to database
- [ ] Estimate rollback duration
- [ ] Notify stakeholders
- [ ] Prepare rollback scripts

### Database Backup Verification

```bash
# Check available backups
ls -la /opt/astral-draft/backups/

# Verify backup integrity
pg_restore --list backup_20240120_120000.sql

# Test backup restore (dry run)
pg_restore --verbose --dry-run backup_20240120_120000.sql
```

### Point-in-Time Recovery

```bash
# Stop application
docker-compose -f docker-compose.prod.yml stop app-blue app-green

# Backup current state
pg_dump -U postgres -h postgres-master astral_draft_v4 > current_backup.sql

# Restore to specific point in time
pg_restore -U postgres -h postgres-master --clean --if-exists backup_target.sql

# Restart application
docker-compose -f docker-compose.prod.yml up -d app-blue
```

### Database Migration Rollback

```bash
# Check migration history
docker-compose -f docker-compose.prod.yml exec postgres \
  psql -U postgres -d astral_draft_v4 \
  -c "SELECT * FROM _prisma_migrations ORDER BY finished_at DESC LIMIT 10;"

# Rollback specific migration
npx prisma migrate resolve --rolled-back 20240120120000_migration_name

# Run database reset if needed
npx prisma db push --force-reset
```

### Data Recovery Procedures

#### Partial Data Recovery

```sql
-- Restore specific tables
TRUNCATE TABLE leagues, teams, players;
COPY leagues FROM '/backups/leagues_backup.csv' DELIMITER ',' CSV HEADER;
COPY teams FROM '/backups/teams_backup.csv' DELIMITER ',' CSV HEADER;
COPY players FROM '/backups/players_backup.csv' DELIMITER ',' CSV HEADER;
```

#### Full Database Restore

```bash
# Create new database instance
createdb -U postgres astral_draft_v4_restored

# Restore from backup
pg_restore -U postgres -d astral_draft_v4_restored backup_file.sql

# Switch database connections
# Update DATABASE_URL in environment variables
export DATABASE_URL="postgresql://postgres:password@localhost:5432/astral_draft_v4_restored"

# Restart application with new database
docker-compose -f docker-compose.prod.yml restart app-blue
```

## Emergency Rollback

### Critical System Failure

For complete system failures requiring immediate response:

#### Emergency Response Team Activation

1. **Alert Escalation**
   - Page on-call engineer
   - Notify emergency contacts
   - Activate incident bridge

2. **Immediate Actions**
   ```bash
   # Enable emergency mode
   export EMERGENCY_MODE=true
   
   # Emergency rollback (bypass normal checks)
   ./scripts/rollback.sh \
     --environment production \
     --emergency \
     --reason "critical-system-failure"
   ```

3. **Emergency Communication**
   - Update status page immediately
   - Send emergency notifications
   - Brief executive team

### Disaster Recovery

#### Complete Environment Rebuild

```bash
# 1. Stop all services
docker-compose -f docker-compose.prod.yml down

# 2. Restore from infrastructure backups
./scripts/restore-infrastructure.sh

# 3. Restore database from latest backup
./scripts/restore-database.sh --backup latest

# 4. Deploy last known good version
./scripts/deploy.sh \
  --environment production \
  --image last-known-good \
  --emergency

# 5. Verify system functionality
./scripts/health-check.sh --check-type full
```

#### Failover to Secondary Region

```bash
# Activate secondary region
aws route53 change-resource-record-sets \
  --hosted-zone-id Z123456789 \
  --change-batch file://failover-change-batch.json

# Update DNS to point to backup environment
# Monitor failover completion
# Notify stakeholders of regional failover
```

## Post-Rollback Procedures

### Immediate Verification

1. **Health Check Validation**
   ```bash
   # Comprehensive health check
   ./scripts/health-check.sh \
     --environment production \
     --check-type full \
     --verbose
   ```

2. **Performance Verification**
   ```bash
   # Monitor response times
   curl -w "@curl-format.txt" https://astraldraft.com/api/health
   
   # Check error rates
   # Monitor via Grafana dashboards
   ```

3. **User Experience Testing**
   - Login functionality
   - Core user journeys
   - Mobile responsiveness
   - Data accuracy

### Documentation and Communication

#### Rollback Report Template

```markdown
# Rollback Report - [Date/Time]

## Summary
- **Environment**: Production
- **Rollback Type**: Application
- **Duration**: 5 minutes
- **Reason**: High error rate after deployment

## Timeline
- 14:00 - Deployment completed
- 14:05 - Error rate spike detected
- 14:07 - Automated rollback triggered
- 14:10 - Service restored
- 14:15 - Verification completed

## Impact
- **Users Affected**: ~500 active users
- **Services Down**: None (rolling rollback)
- **Data Loss**: None
- **Financial Impact**: Minimal

## Root Cause
- Code regression in user authentication
- Insufficient integration testing

## Actions Taken
- Immediate rollback to v4.0.4
- Isolated problematic code changes
- Additional monitoring enabled

## Follow-up Actions
- [ ] Fix authentication bug
- [ ] Enhance integration tests
- [ ] Update deployment process
- [ ] Schedule post-mortem meeting
```

#### Stakeholder Notification

```bash
# Send rollback completion notification
curl -X POST \
  -H 'Content-type: application/json' \
  --data '{
    "text": "✅ **Rollback Completed Successfully**\n\nEnvironment: Production\nDuration: 5 minutes\nStatus: All systems operational\nNext: Post-mortem scheduled for tomorrow 10 AM"
  }' \
  "$SLACK_WEBHOOK_URL"
```

### Monitoring and Alerting

#### Enhanced Monitoring Post-Rollback

1. **Increased Alert Sensitivity**
   - Lower error rate thresholds
   - Reduced response time thresholds
   - More frequent health checks

2. **Extended Monitoring Period**
   - 24-hour enhanced monitoring
   - Hourly status reports
   - Daily stakeholder updates

3. **Performance Baselines**
   - Establish new performance baselines
   - Compare with pre-deployment metrics
   - Monitor for regression patterns

## Testing and Validation

### Rollback Testing Schedule

#### Monthly Rollback Drills

```bash
# Staging environment rollback test
./scripts/rollback.sh \
  --environment staging \
  --version previous \
  --reason "monthly-drill" \
  --dry-run

# Verify rollback procedures
./scripts/health-check.sh \
  --environment staging \
  --check-type full
```

#### Quarterly Disaster Recovery

- Full production rollback simulation
- Database restoration testing
- Cross-team coordination validation
- Documentation accuracy verification

### Rollback Validation Checklist

#### Pre-Rollback Validation
- [ ] Backup verification completed
- [ ] Rollback scripts tested in staging
- [ ] Stakeholder notification sent
- [ ] Emergency contacts available
- [ ] Rollback reason documented

#### During Rollback
- [ ] Monitoring dashboards active
- [ ] Communication channels open
- [ ] Progress updates provided
- [ ] Health checks running
- [ ] Error rates monitored

#### Post-Rollback Validation
- [ ] Service functionality verified
- [ ] Performance metrics normal
- [ ] User experience tested
- [ ] Data integrity confirmed
- [ ] Completion notifications sent

## Communication Protocols

### Rollback Communication Plan

#### Internal Communication

1. **DevOps Team** (Immediate)
   - Slack #devops-alerts
   - Email alerts
   - Phone escalation

2. **Development Team** (Within 5 minutes)
   - Slack #development
   - Email summary
   - Jira ticket creation

3. **Management Team** (Within 15 minutes)
   - Email executive summary
   - Slack #leadership
   - Calendar meeting if needed

#### External Communication

1. **Status Page Updates**
   - Immediate status update
   - Progress notifications
   - Resolution confirmation

2. **Customer Communication**
   - Email to affected users (if applicable)
   - In-app notifications
   - Social media updates (if needed)

### Communication Templates

#### Rollback Initiation
```
🔄 **ROLLBACK INITIATED**

Environment: Production
Reason: [Specific reason]
Expected Duration: [X] minutes
Impact: [Description]
Status: https://status.astraldraft.com

We are actively working to restore service.
```

#### Rollback Completion
```
✅ **ROLLBACK COMPLETED**

Environment: Production
Duration: [X] minutes
Status: All systems operational
Version: [Previous version]

Service has been restored. Monitoring continues.
```

### Escalation Procedures

#### Escalation Levels

1. **Level 1**: DevOps Engineer
   - Initial response and assessment
   - Execute standard rollback procedures

2. **Level 2**: Senior DevOps + Lead Developer
   - Complex rollback scenarios
   - Database-related rollbacks

3. **Level 3**: DevOps Manager + Engineering Manager
   - Emergency rollbacks
   - Customer-facing incidents

4. **Level 4**: CTO + Leadership Team
   - Major incidents
   - Business-critical impacts

---

## Quick Reference

### Emergency Contacts

- **Primary DevOps**: [Contact Information]
- **Secondary DevOps**: [Contact Information]
- **Database Administrator**: [Contact Information]
- **Engineering Manager**: [Contact Information]

### Command Quick Reference

```bash
# Quick rollback
./scripts/rollback.sh --environment production --force

# Emergency rollback
./scripts/rollback.sh --environment production --emergency

# Health check
./scripts/health-check.sh --environment production

# View logs
docker logs astral-draft-v4-app-blue

# Check deployment history
ls -la logs/deployment_*.json
```

### Important URLs

- **Production**: https://astraldraft.com
- **Staging**: https://staging.astraldraft.com
- **Status Page**: https://status.astraldraft.com
- **Monitoring**: https://monitoring.astraldraft.com

---

*Last Updated: [Current Date]*  
*Version: 1.0*  
*Owner: DevOps Team*  
*Review Cycle: Monthly*