# Astral Draft V4 - Database Seeding

## Overview
This directory contains the database schema and seed data for the Astral Draft V4 fantasy football platform.

## Database Schema
The schema is defined in `schema.prisma` and includes:
- User management and authentication
- Leagues and teams
- NFL players and stats
- Draft system
- Matchups and scoring
- Transactions and trades
- Messaging and notifications

## Seed Data
The `/seed` directory contains comprehensive NFL data:
- **nfl-teams.ts**: All 32 NFL teams with colors and divisions
- **players-qb-rb.ts**: Quarterbacks and Running Backs
- **players-wr.ts**: Wide Receivers
- **players-te.ts**: Tight Ends
- **players-k-dst.ts**: Kickers and Defense/Special Teams

## Running the Seeder

### Prerequisites
Ensure you have:
1. PostgreSQL database running
2. DATABASE_URL configured in your `.env` file
3. Prisma CLI installed

### Commands

```bash
# Generate Prisma Client
npm run db:generate

# Push schema to database (development)
npm run db:push

# Run migrations (production)
npm run db:migrate

# Seed the database
npm run db:seed

# Reset database and reseed (WARNING: Deletes all data)
npm run db:reset
```

## Seed Script Features

The main seed script (`seed.ts`) provides:

### 1. Database Cleanup
- Safely removes all existing data
- Respects foreign key constraints
- Optional via `cleanDatabase` flag

### 2. User Creation
Creates 10 default users including:
- **Admin** (admin@astraldraft.com / Admin123!@#)
- **Commissioner** (commish@astraldraft.com / Commish123!)
- **Regular Users** for testing

### 3. Player Population
Imports and creates:
- 40+ Quarterbacks
- 60+ Running Backs
- 80+ Wide Receivers
- 30+ Tight Ends
- 32 Kickers
- 32 Defense/Special Teams

### 4. Sample Leagues
Creates three different league types:
- **PPR Redraft League**: Standard competitive format
- **Dynasty League**: Long-term keeper league
- **Best Ball League**: Draft-only format

### 5. Sample Data
- Player stats for the first 5 weeks
- Team rosters and standings
- League configurations

## Customization

### Using the DatabaseSeeder Class

```typescript
import { DatabaseSeeder } from './prisma/seed';

const seeder = new DatabaseSeeder({ verbose: true });

await seeder.seed({
  cleanDatabase: true,      // Clean before seeding
  createSampleLeagues: true  // Create sample leagues
});
```

### Adding Custom Data

You can extend the seeder by:
1. Adding new player data files in `/seed`
2. Modifying the DEFAULT_USERS array
3. Customizing league configurations
4. Adding more sample stats

## Production Considerations

1. **Security**: Change all default passwords before deploying
2. **Performance**: The seeder creates thousands of records - may take 30-60 seconds
3. **Idempotency**: Running with `cleanDatabase: true` ensures consistent state
4. **Logging**: Verbose mode provides detailed progress updates

## Troubleshooting

### Common Issues

1. **Database connection failed**
   - Check DATABASE_URL in .env
   - Ensure PostgreSQL is running
   - Verify network connectivity

2. **Seed fails with constraint errors**
   - Run with `cleanDatabase: true`
   - Check for custom data modifications

3. **TypeScript errors**
   - Run `npm run db:generate` first
   - Ensure all dependencies are installed

## Data Sources

Player data is based on:
- 2024 NFL rosters
- Current ADP (Average Draft Position) rankings
- Projected fantasy points for the season
- Real player attributes (height, weight, college, etc.)

## Maintenance

To update player data:
1. Modify the appropriate file in `/seed`
2. Update rankings and projections as needed
3. Run `npm run db:reset` to apply changes

## Support

For issues or questions about the database schema or seeding process, please refer to the main project documentation or contact the development team.