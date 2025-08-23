# Astral Draft v4 - Operations Runbook

This runbook provides step-by-step procedures for common operational tasks, incident response, and emergency procedures for Astral Draft v4.

## Quick Reference

### Emergency Contacts
- **Primary On-Call**: +1-XXX-XXX-XXXX
- **Secondary On-Call**: +1-XXX-XXX-XXXX
- **Escalation Manager**: +1-XXX-XXX-XXXX
- **Status Page**: https://status.astraldraft.com

### Critical System URLs
- **Production**: https://astraldraft.com
- **Staging**: https://staging.astraldraft.com
- **Monitoring**: https://monitoring.astraldraft.com
- **Grafana**: https://grafana.astraldraft.com
- **Sentry**: https://sentry.io/organizations/astral-draft/

### Quick Health Check
```bash
curl -f https://astraldraft.com/api/health || echo "SYSTEM DOWN"
```

## Incident Response Procedures

### Severity Levels

#### SEV-1 (Critical)
- **Definition**: Complete service outage or data loss
- **Response Time**: 15 minutes
- **Escalation**: Immediate to on-call engineer and management

#### SEV-2 (High)
- **Definition**: Significant feature degradation or performance issues
- **Response Time**: 1 hour
- **Escalation**: To on-call engineer within 30 minutes

#### SEV-3 (Medium)
- **Definition**: Minor feature issues or non-critical bugs
- **Response Time**: 4 hours
- **Escalation**: Normal business hours

#### SEV-4 (Low)
- **Definition**: Enhancement requests or minor improvements
- **Response Time**: Next sprint
- **Escalation**: Product team

### Incident Response Workflow

#### Initial Response (0-15 minutes)
1. **Acknowledge the alert**
   ```bash
   # Acknowledge in PagerDuty/monitoring system
   curl -X POST "https://api.pagerduty.com/incidents/[ID]/acknowledge"
   ```

2. **Assess the situation**
   ```bash
   # Quick health check
   ./scripts/health-check.sh --environment production --check-type full https://astraldraft.com
   
   # Check system status
   docker-compose -f docker-compose.prod.yml ps
   ```

3. **Create incident ticket**
   - Title: [SEV-X] Brief description
   - Include initial symptoms and timeline
   - Tag relevant team members

#### Investigation (15-60 minutes)
1. **Check application logs**
   ```bash
   # Application logs
   docker-compose -f docker-compose.prod.yml logs --tail=100 app-blue app-green
   
   # Database logs
   docker-compose -f docker-compose.prod.yml logs --tail=100 postgres-master
   
   # Redis logs
   docker-compose -f docker-compose.prod.yml logs --tail=100 redis-cluster
   ```

2. **Check monitoring dashboards**
   - Grafana: CPU, Memory, Response times, Error rates
   - Sentry: Error tracking and frequency
   - Custom metrics: Business-specific indicators

3. **Check external dependencies**
   ```bash
   # Sports data API
   curl -f https://api.sportsdata.io/v3/nfl/scores/json/CurrentSeason?key=YOUR_KEY
   
   # Database connectivity
   psql "$DATABASE_URL" -c "SELECT 1;"
   
   # Redis connectivity
   redis-cli -u "$REDIS_URL" ping
   ```

#### Resolution and Recovery
1. **Implement immediate fix if known**
2. **Rollback if necessary**
   ```bash
   ./scripts/rollback.sh --environment production --emergency
   ```
3. **Scale resources if needed**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d --scale app-blue=3
   ```

#### Post-Incident (Within 24 hours)
1. **Conduct post-mortem**
2. **Document lessons learned**
3. **Implement preventive measures**
4. **Update runbooks and procedures**

## Common Operational Procedures

### Application Management

#### Deployment Procedures

**Standard Deployment**
```bash
# 1. Verify staging deployment
curl -f https://staging.astraldraft.com/api/health

# 2. Deploy to production
./scripts/deploy.sh --environment production --image v1.2.3

# 3. Verify deployment
./scripts/health-check.sh --environment production https://astraldraft.com

# 4. Monitor for 30 minutes
watch -n 30 'curl -s https://astraldraft.com/api/health | jq .'
```

**Emergency Deployment**
```bash
# Skip non-critical tests for urgent fixes
./scripts/deploy.sh --environment production --image hotfix-v1.2.4 --force --skip-tests
```

**Rollback Procedures**
```bash
# Immediate rollback
./scripts/rollback.sh --environment production --emergency

# Rollback to specific version
./scripts/rollback.sh --environment production --version v1.2.2
```

#### Application Scaling

**Horizontal Scaling**
```bash
# Scale up application instances
docker-compose -f docker-compose.prod.yml up -d --scale app-blue=5

# Verify all instances are healthy
for i in {1..5}; do
  docker-compose -f docker-compose.prod.yml exec app-blue-$i curl -f http://localhost:3000/api/health
done

# Scale down
docker-compose -f docker-compose.prod.yml up -d --scale app-blue=2
```

**Vertical Scaling**
```bash
# Update resource limits in docker-compose.prod.yml
# Then recreate containers
docker-compose -f docker-compose.prod.yml up -d --no-deps app-blue
```

### Database Management

#### Database Health Checks
```bash
# Connection test
psql "$DATABASE_URL" -c "SELECT version();"

# Check active connections
psql "$DATABASE_URL" -c "SELECT count(*) FROM pg_stat_activity;"

# Check database size
psql "$DATABASE_URL" -c "SELECT pg_size_pretty(pg_database_size(current_database()));"

# Check for long-running queries
psql "$DATABASE_URL" -c "
SELECT pid, now() - pg_stat_activity.query_start AS duration, query 
FROM pg_stat_activity 
WHERE (now() - pg_stat_activity.query_start) > interval '5 minutes';"
```

#### Database Performance Optimization
```bash
# Analyze table statistics
psql "$DATABASE_URL" -c "ANALYZE;"

# Reindex tables if needed
psql "$DATABASE_URL" -c "REINDEX DATABASE astral_draft_v4;"

# Check index usage
psql "$DATABASE_URL" -c "
SELECT schemaname, tablename, indexname, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes 
ORDER BY idx_tup_read DESC;"
```

#### Database Backup and Recovery
```bash
# Manual backup
./scripts/backup.sh --environment production --type database

# Verify backup integrity
./scripts/backup.sh --environment production --verify-only

# List available backups
ls -la backups/database_production_*

# Emergency restore (USE WITH CAUTION)
./scripts/restore.sh --environment production --backup backup_production_20231215_020000.sql.gz --confirm
```

### Cache Management

#### Redis Health Checks
```bash
# Connection test
redis-cli -u "$REDIS_URL" ping

# Check memory usage
redis-cli -u "$REDIS_URL" info memory

# Check connected clients
redis-cli -u "$REDIS_URL" info clients

# Check keyspace statistics
redis-cli -u "$REDIS_URL" info keyspace
```

#### Cache Operations
```bash
# Clear all cache (USE WITH CAUTION)
redis-cli -u "$REDIS_URL" flushall

# Clear specific pattern
redis-cli -u "$REDIS_URL" --scan --pattern "session:*" | xargs redis-cli -u "$REDIS_URL" del

# Check cache hit ratio
redis-cli -u "$REDIS_URL" info stats | grep "keyspace_hits\|keyspace_misses"
```

### Monitoring and Alerting

#### Monitoring System Health
```bash
# Check Prometheus targets
curl -s http://prometheus:9090/api/v1/targets | jq '.data.activeTargets[] | select(.health != "up")'

# Check Grafana datasources
curl -s -H "Authorization: Bearer $GRAFANA_API_KEY" \
  http://grafana:3000/api/datasources | jq '.[] | select(.status != "OK")'

# Test Sentry connectivity
curl -X POST "$SENTRY_DSN" \
  -H "Content-Type: application/json" \
  -d '{"message": "Test connectivity from runbook"}'
```

#### Alert Management
```bash
# List active alerts
curl -s http://prometheus:9090/api/v1/alerts | jq '.data.alerts[] | select(.state == "firing")'

# Silence alert (replace MATCHER with appropriate label)
curl -X POST http://alertmanager:9093/api/v1/silences \
  -H "Content-Type: application/json" \
  -d '{
    "matchers": [{"name": "alertname", "value": "HighErrorRate"}],
    "startsAt": "'$(date -u +%Y-%m-%dT%H:%M:%S.000Z)'",
    "endsAt": "'$(date -u -d '+4 hours' +%Y-%m-%dT%H:%M:%S.000Z)'",
    "comment": "Investigating issue - planned maintenance"
  }'
```

### Security Operations

#### Security Monitoring
```bash
# Check for failed login attempts
docker-compose -f docker-compose.prod.yml logs app-blue app-green | grep "authentication failed"

# Check SSL certificate expiration
echo | openssl s_client -servername astraldraft.com -connect astraldraft.com:443 2>/dev/null | \
  openssl x509 -noout -dates

# Check for suspicious IP addresses
docker-compose -f docker-compose.prod.yml logs nginx | awk '{print $1}' | sort | uniq -c | sort -nr | head -20
```

#### Security Incident Response
```bash
# Block suspicious IP (replace with actual IP)
iptables -A INPUT -s 192.168.1.100 -j DROP

# Check active sessions
redis-cli -u "$REDIS_URL" keys "session:*" | wc -l

# Force logout all users (EMERGENCY ONLY)
redis-cli -u "$REDIS_URL" --scan --pattern "session:*" | xargs redis-cli -u "$REDIS_URL" del
```

## Troubleshooting Playbooks

### High Error Rate

#### Symptoms
- Error rate > 1% for more than 5 minutes
- Sentry alerts showing increased exceptions

#### Investigation Steps
1. **Check application logs**
   ```bash
   docker-compose -f docker-compose.prod.yml logs --tail=500 app-blue app-green | grep ERROR
   ```

2. **Check error distribution**
   ```bash
   # Check Sentry dashboard for error patterns
   # Look for specific endpoints or user agents
   ```

3. **Check dependencies**
   ```bash
   # Database connectivity
   ./scripts/health-check.sh --check-type full https://astraldraft.com
   
   # External API status
   curl -f https://api.sportsdata.io/v3/nfl/scores/json/CurrentSeason
   ```

#### Resolution Steps
1. **If database issues**: Scale database connections or restart
2. **If external API issues**: Implement circuit breaker or fallback
3. **If application bugs**: Deploy hotfix or rollback
4. **If load issues**: Scale application horizontally

### High Response Time

#### Symptoms
- P95 response time > 1000ms
- User complaints about slow performance

#### Investigation Steps
1. **Check application performance**
   ```bash
   # APM metrics in Grafana
   # Database query performance
   psql "$DATABASE_URL" -c "SELECT query, mean_time, calls FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;"
   ```

2. **Check system resources**
   ```bash
   # CPU and memory usage
   docker stats
   
   # Disk I/O
   iostat -x 1 5
   ```

#### Resolution Steps
1. **If database slow**: Optimize queries, add indexes, scale read replicas
2. **If high CPU**: Scale horizontally or optimize code
3. **If memory issues**: Increase container memory limits
4. **If network issues**: Check load balancer configuration

### Database Connection Issues

#### Symptoms
- "Connection refused" errors
- High connection count warnings

#### Investigation Steps
1. **Check connection count**
   ```bash
   psql "$DATABASE_URL" -c "SELECT count(*) FROM pg_stat_activity;"
   psql "$DATABASE_URL" -c "SHOW max_connections;"
   ```

2. **Check for connection leaks**
   ```bash
   psql "$DATABASE_URL" -c "
   SELECT client_addr, count(*) 
   FROM pg_stat_activity 
   GROUP BY client_addr 
   ORDER BY count DESC;"
   ```

#### Resolution Steps
1. **Kill idle connections**
   ```bash
   psql "$DATABASE_URL" -c "
   SELECT pg_terminate_backend(pid) 
   FROM pg_stat_activity 
   WHERE state = 'idle' AND state_change < now() - interval '1 hour';"
   ```

2. **Restart application instances** (to reset connection pools)
3. **Scale database resources** if consistently hitting limits

### Service Unavailable

#### Symptoms
- HTTP 503 responses
- Load balancer health checks failing

#### Investigation Steps
1. **Check container status**
   ```bash
   docker-compose -f docker-compose.prod.yml ps
   ```

2. **Check container resources**
   ```bash
   docker stats
   ```

3. **Check load balancer configuration**
   ```bash
   docker-compose -f docker-compose.prod.yml logs nginx
   ```

#### Resolution Steps
1. **Restart failed containers**
   ```bash
   docker-compose -f docker-compose.prod.yml restart app-blue
   ```

2. **Scale up healthy instances**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d --scale app-green=3
   ```

3. **Update load balancer weights** to route around failed instances

## Maintenance Procedures

### Planned Maintenance

#### Preparation (24 hours before)
1. **Announce maintenance window**
2. **Prepare maintenance page**
3. **Verify backup procedures**
4. **Test rollback procedures**

#### During Maintenance
1. **Enable maintenance mode**
   ```bash
   # Deploy maintenance page
   docker-compose -f docker-compose.prod.yml up -d maintenance-page
   ```

2. **Perform maintenance tasks**
3. **Test thoroughly before going live**

#### Post-Maintenance
1. **Disable maintenance mode**
2. **Monitor for 2 hours**
3. **Send completion notification**

### Certificate Renewal

#### Manual Renewal
```bash
# Stop nginx temporarily
docker-compose -f docker-compose.prod.yml stop nginx

# Renew certificate
certbot renew --standalone

# Start nginx
docker-compose -f docker-compose.prod.yml start nginx

# Verify SSL
curl -I https://astraldraft.com
```

### Database Maintenance

#### Weekly Maintenance
```bash
# Update table statistics
psql "$DATABASE_URL" -c "ANALYZE;"

# Vacuum tables
psql "$DATABASE_URL" -c "VACUUM (ANALYZE);"

# Check for unused indexes
psql "$DATABASE_URL" -f scripts/check-unused-indexes.sql
```

## Escalation Procedures

### When to Escalate

#### To Senior Engineer
- SEV-2 incident lasting > 2 hours
- Unable to determine root cause within 1 hour
- Need additional expertise or access

#### To Management
- SEV-1 incident lasting > 1 hour
- Data loss or security breach
- Multiple cascading failures
- Media or customer escalation

#### To External Vendors
- External service outage confirmed
- Infrastructure provider issues
- Third-party integration failures

### Escalation Contacts

```
Primary On-Call Engineer
├── Senior Engineer (30 min)
│   ├── Team Lead (1 hour)
│   │   ├── Engineering Manager (2 hours)
│   │   └── CTO (4 hours - SEV-1 only)
│   └── Platform Engineer (concurrent)
└── Database Administrator (for DB issues)
```

## Recovery Procedures

### Application Recovery

#### From Configuration Error
```bash
# Rollback to previous version
./scripts/rollback.sh --environment production --reason "config-error"

# Or fix configuration and redeploy
vim .env.production
./scripts/deploy.sh --environment production --force
```

#### From Data Corruption
```bash
# Stop application
docker-compose -f docker-compose.prod.yml stop app-blue app-green

# Restore from backup
./scripts/restore.sh --environment production --backup latest

# Restart application
docker-compose -f docker-compose.prod.yml start app-blue app-green
```

### Infrastructure Recovery

#### From Complete System Failure
1. **Provision new infrastructure**
2. **Restore from latest backup**
3. **Update DNS records**
4. **Verify all services**

#### From Partial Failure
1. **Isolate failed components**
2. **Route traffic to healthy instances**
3. **Restore or replace failed components**
4. **Gradually restore full capacity**

## Communication Templates

### Incident Communication

#### Initial Notification
```
🚨 INCIDENT ALERT - SEV-[X]

Service: Astral Draft v4
Status: Investigating
Impact: [Brief description]
Started: [Timestamp]
ETA: [Initial estimate]

We are investigating reports of [issue description]. 
Updates will be provided every 30 minutes.

Status Page: https://status.astraldraft.com
```

#### Update Notification
```
📊 INCIDENT UPDATE - SEV-[X]

Status: [In Progress/Monitoring/Resolved]
Root Cause: [If known]
Actions Taken: [Brief list]
Next Update: [Timestamp]

[Detailed update with progress and next steps]
```

#### Resolution Notification
```
✅ INCIDENT RESOLVED - SEV-[X]

Service: Fully Operational
Duration: [Total time]
Root Cause: [Brief explanation]
Resolution: [What was done]

Post-mortem will be available within 24 hours.
Thank you for your patience.
```

### Maintenance Communication

#### Advance Notice (72 hours)
```
🔧 SCHEDULED MAINTENANCE

Service: Astral Draft v4
Window: [Date/Time with timezone]
Duration: [Estimated time]
Impact: [Service availability]

We will be performing [brief description of maintenance].
During this time, [impact description].

Questions? Contact support@astraldraft.com
```

#### Maintenance Start
```
🔧 MAINTENANCE IN PROGRESS

Maintenance has begun as scheduled.
Expected completion: [Time]
Current status: [Brief update]

We'll notify you when maintenance is complete.
```

#### Maintenance Complete
```
✅ MAINTENANCE COMPLETE

All systems are now fully operational.
Actual duration: [Time]

Thank you for your patience during this maintenance window.
```

---

**Document Version**: 1.0  
**Last Updated**: $(date +%Y-%m-%d)  
**Next Review**: $(date -d "+3 months" +%Y-%m-%d)  
**Owner**: Platform Engineering Team