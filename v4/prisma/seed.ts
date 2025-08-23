/**
 * Astral Draft V4 - Database Seeder
 * Production-ready seeder with comprehensive data population
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
// import { NFL_TEAMS } from './seed/nfl-teams';
import { quarterbacks, runningBacks } from './seed/players-qb-rb';
import { wideReceivers } from './seed/players-wr';
import { tightEnds } from './seed/players-te';
import { kickers, defenseSpecialTeams } from './seed/players-k-dst';

// Interface for seed player data (different from Prisma Player model)
// Currently unused - can be re-enabled if needed for type safety
// interface SeedPlayer {
//   id?: string;
//   name?: string;
//   team?: string;
//   position?: string;
//   age?: number;
//   height?: string;
//   weight?: number;
//   experience?: number;
//   college?: string;
//   jerseyNumber?: number;
//   adp?: number;
//   rank?: number;
//   stats2023?: any;
//   projections2024?: any;
//   byeWeek?: number;
//   city?: string;
//   defensiveStats?: any;
// }

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

// Types for better type safety
interface SeedUser {
  username: string;
  email: string;
  password: string;
  name: string;
  role: string;
  status: string;
  experienceLevel: string;
  favoriteTeam: string;
  bio?: string;
}

interface SeedOptions {
  cleanDatabase?: boolean;
  createSampleLeagues?: boolean;
  verbose?: boolean;
}

// Default users for testing
const DEFAULT_USERS: SeedUser[] = [
  {
    username: 'admin',
    email: 'admin@astraldraft.com',
    password: 'Admin123!@#',
    name: 'Admin User',
    role: 'SUPER_ADMIN',
    status: 'ACTIVE',
    experienceLevel: 'expert',
    favoriteTeam: 'SF',
    bio: 'Platform administrator with full access'
  },
  {
    username: 'commissioner',
    email: 'commish@astraldraft.com',
    password: 'Commish123!',
    name: 'Commissioner Jones',
    role: 'COMMISSIONER',
    status: 'ACTIVE',
    experienceLevel: 'expert',
    favoriteTeam: 'GB',
    bio: 'Experienced league commissioner'
  },
  {
    username: 'johndoe',
    email: 'john@example.com',
    password: 'John123!',
    name: 'John Doe',
    role: 'USER',
    status: 'ACTIVE',
    experienceLevel: 'intermediate',
    favoriteTeam: 'DAL',
    bio: 'Fantasy football enthusiast since 2015'
  },
  {
    username: 'janedoe',
    email: 'jane@example.com',
    password: 'Jane123!',
    name: 'Jane Doe',
    role: 'USER',
    status: 'ACTIVE',
    experienceLevel: 'intermediate',
    favoriteTeam: 'SEA'
  },
  {
    username: 'mikejohnson',
    email: 'mike@example.com',
    password: 'Mike123!',
    name: 'Mike Johnson',
    role: 'USER',
    status: 'ACTIVE',
    experienceLevel: 'beginner',
    favoriteTeam: 'KC'
  },
  {
    username: 'sarahwilliams',
    email: 'sarah@example.com',
    password: 'Sarah123!',
    name: 'Sarah Williams',
    role: 'USER',
    status: 'ACTIVE',
    experienceLevel: 'expert',
    favoriteTeam: 'BUF'
  },
  {
    username: 'davidlee',
    email: 'david@example.com',
    password: 'David123!',
    name: 'David Lee',
    role: 'USER',
    status: 'ACTIVE',
    experienceLevel: 'intermediate',
    favoriteTeam: 'PHI'
  },
  {
    username: 'emilybrown',
    email: 'emily@example.com',
    password: 'Emily123!',
    name: 'Emily Brown',
    role: 'USER',
    status: 'ACTIVE',
    experienceLevel: 'beginner',
    favoriteTeam: 'MIN'
  },
  {
    username: 'chrismiller',
    email: 'chris@example.com',
    password: 'Chris123!',
    name: 'Chris Miller',
    role: 'USER',
    status: 'ACTIVE',
    experienceLevel: 'expert',
    favoriteTeam: 'BAL'
  },
  {
    username: 'ashleywilson',
    email: 'ashley@example.com',
    password: 'Ashley123!',
    name: 'Ashley Wilson',
    role: 'USER',
    status: 'ACTIVE',
    experienceLevel: 'intermediate',
    favoriteTeam: 'CIN'
  }
];

class DatabaseSeeder {
  private verbose: boolean;
  private createdUserIds: Map<string, string> = new Map();
  private createdPlayerIds: Map<string, string> = new Map();

  constructor(options: SeedOptions = {}) {
    this.verbose = options.verbose ?? true;
  }

  private log(message: string, level: 'info' | 'success' | 'error' | 'warn' = 'info') {
    if (!this.verbose) return;

    const colors = {
      info: '\x1b[36m',    // Cyan
      success: '\x1b[32m', // Green
      error: '\x1b[31m',   // Red
      warn: '\x1b[33m',    // Yellow
      reset: '\x1b[0m'
    };

    const timestamp = new Date().toISOString();
    console.log(`${colors[level]}[${timestamp}] ${message}${colors.reset}`);
  }

  /**
   * Clean all data from the database
   */
  async cleanDatabase(): Promise<void> {
    this.log('Cleaning database...', 'warn');
    
    try {
      // Delete in correct order to respect foreign key constraints
      await prisma.notification.deleteMany();
      await prisma.message.deleteMany();
      await prisma.trade.deleteMany();
      await prisma.transaction.deleteMany();
      await prisma.draftPick.deleteMany();
      await prisma.draft.deleteMany();
      await prisma.roster.deleteMany();
      await prisma.leaguePlayer.deleteMany();
      await prisma.playerProjection.deleteMany();
      await prisma.playerStats.deleteMany();
      await prisma.player.deleteMany();
      await prisma.team.deleteMany();
      await prisma.leagueMember.deleteMany();
      await prisma.league.deleteMany();
      await prisma.session.deleteMany();
      await prisma.account.deleteMany();
      await prisma.user.deleteMany();
      
      this.log('Database cleaned successfully', 'success');
    } catch (error) {
      this.log(`Error cleaning database: ${error}`, 'error');
      throw error;
    }
  }

  /**
   * Create users in the database
   */
  async createUsers(): Promise<void> {
    this.log('Creating users...', 'info');
    
    for (const userData of DEFAULT_USERS) {
      try {
        const hashedPassword = await bcrypt.hash(userData.password, 12);
        
        const user = await prisma.user.create({
          data: {
            username: userData.username,
            email: userData.email,
            password: hashedPassword,
            name: userData.name,
            role: userData.role,
            status: userData.status,
            experienceLevel: userData.experienceLevel,
            favoriteTeam: userData.favoriteTeam,
            bio: userData.bio,
            emailVerified: userData.status === 'ACTIVE' ? new Date() : null
          }
        });
        
        this.createdUserIds.set(userData.username, user.id);
        this.log(`Created user: ${userData.username} (${userData.email})`, 'success');
      } catch (error) {
        this.log(`Error creating user ${userData.username}: ${error}`, 'error');
      }
    }
  }

  /**
   * Create all NFL players in the database
   */
  async createPlayers(): Promise<void> {
    this.log('Creating NFL players...', 'info');
    
    // Create Quarterbacks
    this.log('Creating quarterbacks...', 'info');
    for (const qb of quarterbacks) {
      try {
        const displayName = qb.name || '';
        
        const player = await prisma.player.create({
          data: {
            name: displayName,
            position: 'QB',
            nflTeam: qb.team || '',
            jerseyNumber: qb.jerseyNumber || null,
            height: qb.height || null,
            weight: qb.weight || null,
            age: qb.age || null,
            experience: qb.experience || null,
            college: qb.college || null,
            status: 'ACTIVE',
            adp: qb.adp || null
          }
        });
        this.createdPlayerIds.set(displayName, player.id);
      } catch (error) {
        this.log(`Error creating QB ${qb.name}: ${error}`, 'error');
      }
    }
    
    // Create Running Backs
    this.log('Creating running backs...', 'info');
    for (const rb of runningBacks) {
      try {
        const displayName = rb.name || '';
        
        const player = await prisma.player.create({
          data: {
            name: displayName,
            position: 'RB',
            nflTeam: rb.team || '',
            jerseyNumber: rb.jerseyNumber || null,
            height: rb.height || null,
            weight: rb.weight || null,
            age: rb.age || null,
            experience: rb.experience || null,
            college: rb.college || null,
            status: 'ACTIVE',
            adp: rb.adp || null
          }
        });
        this.createdPlayerIds.set(displayName, player.id);
      } catch (error) {
        this.log(`Error creating RB ${rb.name}: ${error}`, 'error');
      }
    }
    
    // Create Wide Receivers
    this.log('Creating wide receivers...', 'info');
    for (const wr of wideReceivers) {
      try {
        const displayName = wr.name || '';
        
        const player = await prisma.player.create({
          data: {
            name: displayName,
            position: 'WR',
            nflTeam: wr.team || '',
            jerseyNumber: wr.jerseyNumber || null,
            height: wr.height || null,
            weight: wr.weight || null,
            age: wr.age || null,
            experience: wr.experience || null,
            college: wr.college || null,
            status: 'ACTIVE',
            adp: wr.adp || null
          }
        });
        this.createdPlayerIds.set(displayName, player.id);
      } catch (error) {
        this.log(`Error creating WR ${wr.name}: ${error}`, 'error');
      }
    }
    
    // Create Tight Ends
    this.log('Creating tight ends...', 'info');
    for (const te of tightEnds) {
      try {
        const displayName = te.name || '';
        
        const player = await prisma.player.create({
          data: {
            name: displayName,
            position: 'TE',
            nflTeam: te.team || '',
            jerseyNumber: te.jerseyNumber || null,
            height: te.height || null,
            weight: te.weight || null,
            age: te.age || null,
            experience: te.experience || null,
            college: te.college || null,
            status: 'ACTIVE',
            adp: te.adp || null
          }
        });
        this.createdPlayerIds.set(displayName, player.id);
      } catch (error) {
        this.log(`Error creating TE ${te.name}: ${error}`, 'error');
      }
    }
    
    // Create Kickers
    this.log('Creating kickers...', 'info');
    for (const k of kickers) {
      try {
        const kicker = k as any;
        const displayName = kicker.name || '';
        
        const player = await prisma.player.create({
          data: {
            name: displayName,
            position: 'K',
            nflTeam: kicker.team || '',
            jerseyNumber: kicker.jerseyNumber || null,
            height: kicker.height || null,
            weight: kicker.weight || null,
            age: kicker.age || null,
            experience: kicker.experience || null,
            college: kicker.college || null,
            status: 'ACTIVE',
            adp: kicker.adp || null
          }
        });
        this.createdPlayerIds.set(displayName, player.id);
      } catch (error) {
        this.log(`Error creating K ${(k as any).name}: ${error}`, 'error');
      }
    }
    
    // Create Defense/Special Teams
    this.log('Creating defense/special teams...', 'info');
    for (const dst of defenseSpecialTeams) {
      try {
        const displayName = dst.name || `${(dst as any).city} Defense` || '';
        
        const player = await prisma.player.create({
          data: {
            name: displayName,
            position: 'DEF',
            nflTeam: dst.team || '',
            status: 'ACTIVE',
            adp: dst.adp || null,
          }
        });
        this.createdPlayerIds.set(displayName, player.id);
      } catch (error) {
        this.log(`Error creating DST ${dst.name || (dst as any).city}: ${error}`, 'error');
      }
    }
    
    this.log(`Created ${this.createdPlayerIds.size} players successfully`, 'success');
  }

  /**
   * Create sample leagues with teams
   */
  async createSampleLeagues(): Promise<void> {
    this.log('Creating sample leagues...', 'info');
    
    const currentYear = new Date().getFullYear();
    
    // Create a competitive PPR league
    const pprLeague = await prisma.league.create({
      data: {
        name: 'Astral Champions League',
        description: 'Elite competitive PPR league for serious fantasy players',
        status: 'DRAFT',
        scoringType: 'PPR',
        teamCount: 10,
        season: currentYear,
        isPublic: true,
        settings: JSON.stringify({
          passing: {
            yards: 0.04,
            touchdowns: 4,
            interceptions: -2,
            twoPointConversions: 2
          },
          rushing: {
            yards: 0.1,
            touchdowns: 6,
            twoPointConversions: 2
          },
          receiving: {
            receptions: 1,
            yards: 0.1,
            touchdowns: 6,
            twoPointConversions: 2
          },
          kicking: {
            pat: 1,
            fg0_39: 3,
            fg40_49: 4,
            fg50_plus: 5,
            miss: -1
          },
          defense: {
            sacks: 1,
            interceptions: 2,
            fumbleRecovery: 2,
            touchdown: 6,
            safety: 2,
            shutout: 10,
            points_0: 10,
            points_1_6: 7,
            points_7_13: 4,
            points_14_20: 1,
            points_21_27: 0,
            points_28_34: -1,
            points_35_plus: -4
          }
        }),
        waiverType: 'FAAB',
        waiverBudget: 100,
        playoffTeams: 4,
        tradeDeadline: new Date(currentYear, 10, 15) // November 15th
      }
    });
    
    // Add all users as league members
    const usernames = Array.from(this.createdUserIds.keys());
    for (const username of usernames) {
      if (username === 'admin') continue; // Admin doesn't join leagues
      
      await prisma.leagueMember.create({
        data: {
          userId: this.createdUserIds.get(username)!,
          leagueId: pprLeague.id,
          role: username === 'commissioner' ? 'COMMISSIONER' : 'MEMBER'
        }
      });
      
      // Create teams for league members
      const teamNames = [
        'Thunder Bolts',
        'Grid Iron Giants',
        'End Zone Elite',
        'Touchdown Titans',
        'Field Goal Force',
        'Blitz Brigade',
        'Red Zone Raiders',
        'Gridiron Gladiators',
        'Victory Vipers'
      ];
      
      const index = usernames.indexOf(username);
      if (index > 0 && index <= teamNames.length) {
        const teamName = teamNames[index - 1];
        if (!teamName) continue;
        await prisma.team.create({
          data: {
            name: teamName,
            abbreviation: teamName.split(' ').map(w => w[0]).join(''),
            userId: this.createdUserIds.get(username)!,
            leagueId: pprLeague.id
          }
        });
      }
    }
    
    this.log('Created PPR league with teams', 'success');
    
    // Create a Dynasty league
    await prisma.league.create({
      data: {
        name: 'Dynasty Dominators',
        description: 'Long-term dynasty league with keeper players',
        status: 'DRAFT',
        scoringType: 'HALF_PPR',
        teamCount: 12,
        season: currentYear,
        isPublic: false,
        settings: JSON.stringify({
          passing: {
            yards: 0.04,
            touchdowns: 6,
            interceptions: -2,
            twoPointConversions: 2
          },
          rushing: {
            yards: 0.1,
            touchdowns: 6,
            twoPointConversions: 2
          },
          receiving: {
            receptions: 0.5,
            yards: 0.1,
            touchdowns: 6,
            twoPointConversions: 2
          }
        }),
        waiverType: 'FAAB',
        waiverBudget: 200,
        playoffTeams: 6
      }
    });
    
    this.log('Created Dynasty league', 'success');
    
    // Create a Best Ball league
    await prisma.league.create({
      data: {
        name: 'Best Ball Bonanza',
        description: 'Set it and forget it - best ball format',
        status: 'DRAFT',
        scoringType: 'PPR',
        teamCount: 12,
        season: currentYear,
        isPublic: true,
        settings: JSON.stringify({
          passing: {
            yards: 0.04,
            touchdowns: 4,
            interceptions: -1
          },
          rushing: {
            yards: 0.1,
            touchdowns: 6
          },
          receiving: {
            receptions: 1,
            yards: 0.1,
            touchdowns: 6
          }
        }),
        waiverType: 'FAAB',
        waiverBudget: 0,
        playoffTeams: 3
      }
    });
    
    this.log('Created Best Ball league', 'success');
  }

  /**
   * Create sample player stats for current season
   */
  async createSampleStats(): Promise<void> {
    this.log('Creating sample player stats...', 'info');
    
    const currentYear = new Date().getFullYear();
    const topPlayers = Array.from(this.createdPlayerIds.entries()).slice(0, 20);
    
    for (const [_playerName, playerId] of topPlayers) {
      // Create stats for first 5 weeks
      for (let week = 1; week <= 5; week++) {
        const randomMultiplier = 0.7 + Math.random() * 0.6; // 70% to 130% of projected
        
        await prisma.playerStats.create({
          data: {
            playerId,
            week,
            season: currentYear,
            stats: JSON.stringify({
              passYards: Math.floor(Math.random() * 350),
              passTds: Math.floor(Math.random() * 4),
              passInts: Math.floor(Math.random() * 2),
              rushYards: Math.floor(Math.random() * 100),
              rushTds: Math.floor(Math.random() * 2),
              recYards: Math.floor(Math.random() * 120),
              recTds: Math.floor(Math.random() * 2),
              receptions: Math.floor(Math.random() * 8)
            }),
            points: Math.floor(Math.random() * 30 * randomMultiplier)
          }
        });
      }
    }
    
    this.log('Created sample player stats', 'success');
  }

  /**
   * Main seed function
   */
  async seed(options: SeedOptions = {}): Promise<void> {
    this.log('Starting database seed...', 'info');
    const startTime = Date.now();
    
    try {
      // Clean database if requested
      if (options.cleanDatabase) {
        await this.cleanDatabase();
      }
      
      // Create users
      await this.createUsers();
      
      // Create players
      await this.createPlayers();
      
      // Create sample leagues and teams
      if (options.createSampleLeagues !== false) {
        await this.createSampleLeagues();
      }
      
      // Create sample stats
      await this.createSampleStats();
      
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      this.log(`Database seeded successfully in ${duration} seconds`, 'success');
      
    } catch (error) {
      this.log(`Seed failed: ${error}`, 'error');
      throw error;
    }
  }
}

// Main execution
async function main() {
  const seeder = new DatabaseSeeder({ verbose: true });
  
  try {
    await seeder.seed({
      cleanDatabase: true,
      createSampleLeagues: true
    });
    
    console.log('\n========================================');
    console.log('Database seeded successfully!');
    console.log('========================================');
    console.log('\nDefault users created:');
    console.log('------------------------');
    DEFAULT_USERS.forEach(user => {
      console.log(`Username: ${user.username}`);
      console.log(`Email: ${user.email}`);
      console.log(`Password: ${user.password}`);
      console.log(`Role: ${user.role}`);
      console.log('------------------------');
    });
    
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

export { DatabaseSeeder, DEFAULT_USERS };