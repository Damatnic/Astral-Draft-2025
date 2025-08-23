# Astral Draft V4 - Cron Job System Documentation

## Overview

The Astral Draft V4 platform includes a comprehensive cron job system that automates all Phase 4 tasks for fantasy football league management. This system handles everything from weekly matchup generation to real-time player stats synchronization and automated league advancement.

## Architecture

### Core Components

1. **Cron Orchestrator** (`src/server/cron/index.ts`)
   - Central coordinator for all cron jobs
   - Handles scheduling, monitoring, and management
   - Provides graceful shutdown and error handling
   - Integrates with Redis for job status tracking

2. **SportsIO API Integration** (`src/server/api/external/sportsio.ts`)
   - Handles all external API interactions
   - Provides caching layer for API responses
   - Rate limiting and error handling
   - Real-time NFL data synchronization

3. **Individual Job Modules** (`src/server/cron/jobs/`)
   - Modular job implementations
   - Each handles specific automation tasks
   - Shared utilities and error handling

4. **tRPC Admin Interface** (`src/server/api/routers/cron.ts`)
   - Admin dashboard for job management
   - Manual job triggering
   - System health monitoring
   - Real-time status updates

## Cron Jobs

### 1. Weekly Matchup Generation (4.1)
**File**: `src/server/cron/jobs/matchups.ts`
**Schedule**: Every Tuesday at 2 AM (after Monday Night Football)
**Cron Expression**: `0 2 * * 2`

**Features**:
- Auto-generates weekly matchups using round-robin algorithm
- Handles custom league schedules
- Manages bye weeks automatically
- Generates playoff brackets based on standings
- Supports various playoff formats (4, 6, 8 teams)
- Sends matchup notifications to team owners

**Functions**:
- `matchupGenerationJob()` - Main entry point
- `generateMatchupsForLeague()` - League-specific generation
- `generateRoundRobinMatchups()` - Standard matchup algorithm
- `handlePlayoffTransition()` - Playoff setup
- `sendMatchupNotifications()` - User notifications

### 2. Player Stats Sync (4.2)
**File**: `src/server/cron/jobs/stats.ts`
**Schedule**: Every 15 minutes during NFL season
**Cron Expression**: `*/15 * * * *`

**Features**:
- Real-time player statistics synchronization
- Fantasy points calculation with league-specific scoring
- Support for PPR, Half-PPR, and Standard scoring
- Live scoring updates during games
- Batch processing for performance
- Error handling for API failures

**Functions**:
- `playerStatsSyncJob()` - Main sync process
- `syncWeeklyStats()` - Week-specific sync
- `calculateFantasyPoints()` - Scoring calculation
- `updateLiveScoring()` - Real-time updates
- `bulkUpdatePlayerStats()` - Database updates

### 3. Injury Report Updates (4.3)
**File**: `src/server/cron/jobs/injuries.ts`
**Schedule**: Every 6 hours
**Cron Expression**: `0 */6 * * *`

**Features**:
- Fetches latest NFL injury reports
- Updates player status (Active, Questionable, Doubtful, Out, IR)
- Severity assessment (Low, Medium, High)
- Automatic notifications to affected team owners
- Historical injury tracking
- Cleanup of resolved injuries

**Functions**:
- `injuryReportJob()` - Main update process
- `processInjuryReports()` - Report processing
- `notifyTeamOwnersOfInjury()` - User notifications
- `determineInjurySeverity()` - Severity assessment
- `getInjuryReportSummary()` - Admin dashboard data

### 4. Weekly Scoring Calculations (4.4)
**File**: `src/server/cron/jobs/scoring.ts`
**Schedule**: Every Tuesday at 3 AM (after stats finalization)
**Cron Expression**: `0 3 * * 2`

**Features**:
- Calculates final weekly fantasy scores
- Updates team records (wins, losses, ties)
- Recalculates league standings
- Generates weekly reports
- Handles tiebreakers
- Live scoring during games

**Functions**:
- `weeklyScoringJob()` - Main scoring process
- `calculateLeagueScoring()` - League-specific scoring
- `finalizeMatchup()` - Matchup completion
- `updateTeamStandings()` - Standings calculation
- `generateWeeklyReport()` - Report generation

### 5. Automated League Advancement (4.5)
**File**: `src/server/cron/jobs/league.ts`
**Schedule**: Every Tuesday at 4 AM (after scoring completion)
**Cron Expression**: `0 4 * * 2`

**Features**:
- Automatically advances league weeks
- Manages playoff transitions
- Handles season completion
- Crowns league champions
- Archives completed seasons
- Sends advancement notifications

**Functions**:
- `leagueAdvancementJob()` - Main advancement process
- `evaluateLeagueAdvancement()` - Determines needed actions
- `startPlayoffs()` - Playoff initialization
- `completeSeason()` - Season finalization
- `crownChampion()` - Championship handling
- `manualAdvanceLeague()` - Admin override

## Configuration

### Environment Variables

```bash
# Required
SPORTSIO_API_KEY=bab44477ed904140b43630a7520517e7
REDIS_URL=redis://localhost:6379
DATABASE_URL="file:./prisma/dev.db"

# Optional
ENABLE_CRON=true
CRON_TIMEZONE=America/New_York
LOG_LEVEL=info
```

### Cron Schedules

| Job | Schedule | Description | Timezone |
|-----|----------|-------------|----------|
| Matchup Generation | `0 2 * * 2` | Tuesday 2 AM | America/New_York |
| Player Stats Sync | `*/15 * * * *` | Every 15 minutes | UTC |
| Injury Reports | `0 */6 * * *` | Every 6 hours | UTC |
| Weekly Scoring | `0 3 * * 2` | Tuesday 3 AM | America/New_York |
| League Advancement | `0 4 * * 2` | Tuesday 4 AM | America/New_York |

## API Management

### tRPC Endpoints

All cron management is available through the `cron` router:

#### Admin Endpoints
- `cron.getJobStatuses` - Get all job statuses
- `cron.getJobStatus(jobName)` - Get specific job status
- `cron.triggerJob(jobName)` - Manually trigger job
- `cron.controlJob(jobName, action)` - Start/stop jobs
- `cron.getSystemHealth` - Overall system health
- `cron.clearCache(pattern)` - Clear API cache
- `cron.manualAdvanceLeague(leagueId)` - Override league progression

#### User Endpoints
- `cron.getInjurySummary` - Injury report summary
- `cron.generateWeeklyReport(leagueId, week)` - Weekly reports

### Usage Examples

```typescript
// Manual job trigger
const result = await api.cron.triggerJob.mutate({ 
  jobName: 'playerStatsSync' 
});

// Get system health
const health = await api.cron.getSystemHealth.query();

// Generate weekly report
const report = await api.cron.generateWeeklyReport.query({
  leagueId: 'league_123',
  week: 5,
  season: 2024
});
```

## Monitoring & Observability

### Job Status Tracking
- Real-time status updates
- Run count and error tracking
- Last run timestamps
- Performance metrics

### Error Handling
- Comprehensive error logging
- Admin notifications for failures
- Automatic retry mechanisms
- Graceful degradation

### Caching Strategy
- Redis-based API response caching
- Configurable TTL values
- Cache invalidation patterns
- Performance optimization

## Development & Testing

### Local Development

```bash
# Start development server with cron enabled
ENABLE_CRON=true npm run dev

# Disable cron for development
ENABLE_CRON=false npm run dev

# Manual job testing
npm run test:cron
```

### Testing

```bash
# Run cron job tests
npm test src/server/cron

# Type checking
npm run type-check

# Integration tests
npm run test:integration
```

### Mock Data

For development and testing, the system includes:
- Mock SportsIO API responses
- Test league data
- Fake player statistics
- Simulated game scenarios

## Deployment

### Production Setup

1. **Environment Configuration**
   ```bash
   ENABLE_CRON=true
   NODE_ENV=production
   SPORTSIO_API_KEY=your-production-key
   REDIS_URL=your-production-redis-url
   ```

2. **Process Management**
   - Use PM2 or similar for process management
   - Ensure Redis is running
   - Monitor system resources

3. **Monitoring**
   - Set up logging aggregation
   - Configure alerting for job failures
   - Monitor API rate limits

### Health Checks

- `/api/health` - Basic health endpoint
- Admin dashboard for detailed monitoring
- Automated failure notifications

## Security

### API Key Management
- Secure storage of SportsIO API key
- Rate limiting protection
- Error handling without key exposure

### Access Control
- Admin-only endpoints for job management
- User role validation
- Audit logging for admin actions

### Data Protection
- Secure Redis connection
- Database connection encryption
- Sensitive data sanitization

## Performance Optimization

### Caching Strategy
- Multi-layer caching (Redis, application)
- Smart cache invalidation
- Efficient batch processing

### Database Optimization
- Optimized queries with proper indexing
- Batch updates for performance
- Connection pooling

### API Efficiency
- Request batching
- Rate limit compliance
- Retry mechanisms with exponential backoff

## Troubleshooting

### Common Issues

1. **Job Not Running**
   - Check `ENABLE_CRON` environment variable
   - Verify cron expressions
   - Check system logs

2. **API Failures**
   - Verify SportsIO API key
   - Check rate limits
   - Monitor network connectivity

3. **Database Issues**
   - Check database connectivity
   - Verify schema is up to date
   - Monitor query performance

### Debug Commands

```bash
# Check job statuses
curl -X POST /api/trpc/cron.getJobStatuses

# Manually trigger job
curl -X POST /api/trpc/cron.triggerJob \
  -d '{"jobName": "playerStatsSync"}'

# Clear cache
curl -X POST /api/trpc/cron.clearCache \
  -d '{"pattern": "stats"}'
```

## Future Enhancements

### Planned Features
- Enhanced analytics and reporting
- Machine learning player projections
- Advanced playoff formats
- Social features integration
- Mobile push notifications

### Scalability Improvements
- Distributed job processing
- Enhanced caching strategies
- Database sharding
- API optimization

## Support

For issues and questions:
- Check system logs first
- Use admin dashboard for monitoring
- Review API documentation
- Contact system administrators

This cron system provides a robust foundation for automating all aspects of fantasy football league management in the Astral Draft V4 platform.