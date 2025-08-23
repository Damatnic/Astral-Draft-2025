/**
 * User router
 */

import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';

export const userRouter = createTRPCRouter({
  getProfile: protectedProcedure
    .input(z.object({ userId: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const userId = input.userId || ctx.session.user.id;
      
      const user = await ctx.prisma.user.findUnique({
        where: { id: userId },
        include: {
          teams: {
            include: {
              league: true,
              roster: {
                include: {
                  player: true,
                },
              },
            },
          },
          memberships: {
            include: {
              league: true,
            },
          },
        },
      });

      if (!user) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
      }

      // Calculate stats
      const stats = await ctx.prisma.$transaction(async (tx) => {
        const teams = await tx.team.findMany({
          where: { userId },
          include: {
            homeMatchups: true,
            awayMatchups: true,
          },
        });

        let totalWins = 0;
        let totalLosses = 0;
        let totalPoints = 0;
        let matchupCount = 0;

        teams.forEach(team => {
          totalWins += team.wins;
          totalLosses += team.losses;
          totalPoints += team.pointsFor;
          
          const matchups = [...team.homeMatchups, ...team.awayMatchups];
          matchupCount += matchups.length;
        });

        const championships = teams.filter(t => t.isChampion).length;
        const playoffAppearances = teams.filter(t => t.madePlayoffs).length;

        return {
          totalWins,
          totalLosses,
          championships,
          playoffAppearances,
          winPercentage: totalWins / (totalWins + totalLosses) || 0,
          totalPoints,
          averagePoints: matchupCount > 0 ? totalPoints / matchupCount : 0,
          bestFinish: teams.reduce((best, team) => 
            Math.min(best, team.finalRank || Infinity), Infinity),
          currentStreak: 0, // TODO: Calculate streak
          longestWinStreak: 0, // TODO: Calculate longest streak
          totalTrades: await tx.trade.count({
            where: { 
              OR: [
                { proposerId: userId },
                { trades: { some: { teamId: { in: teams.map(t => t.id) } } } }
              ]
            }
          }),
          successfulWaivers: await tx.transaction.count({
            where: {
              userId,
              type: 'WAIVER_CLAIM',
              status: 'EXECUTED',
            },
          }),
        };
      });

      // Get recent activity
      const recentActivity = await ctx.prisma.transaction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: {
          league: true,
        },
      });

      // Get achievements (mock data for now)
      const achievements = [
        {
          id: '1',
          name: 'First Win',
          description: 'Win your first matchup',
          icon: '🏆',
          rarity: 'common' as const,
          unlockedAt: totalWins > 0 ? new Date() : undefined,
        },
        {
          id: '2',
          name: 'Champion',
          description: 'Win a league championship',
          icon: '👑',
          rarity: 'epic' as const,
          unlockedAt: stats.championships > 0 ? new Date() : undefined,
        },
        {
          id: '3',
          name: 'Trade Master',
          description: 'Complete 10 trades',
          icon: '🤝',
          rarity: 'rare' as const,
          progress: Math.min(stats.totalTrades, 10),
          maxProgress: 10,
          unlockedAt: stats.totalTrades >= 10 ? new Date() : undefined,
        },
      ];

      return {
        ...user,
        stats,
        achievements,
        recentActivity: recentActivity.map(activity => ({
          id: activity.id,
          type: activity.type.toLowerCase(),
          title: `${activity.type} Transaction`,
          description: activity.details as string,
          timestamp: activity.createdAt,
          leagueId: activity.leagueId,
          leagueName: activity.league.name,
        })),
      };
    }),

  updateProfile: protectedProcedure
    .input(z.object({
      name: z.string().optional(),
      bio: z.string().optional(),
      avatar: z.string().optional(),
      experienceLevel: z.enum(['beginner', 'intermediate', 'expert']).optional(),
      favoriteTeam: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.user.update({
        where: { id: ctx.session.user.id },
        data: input,
      });
    }),

  getSettings: protectedProcedure
    .query(async ({ ctx }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
      });

      if (!user) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
      }

      // Parse settings from JSON or use defaults
      const settings = user.settings as any || {};
      const notifications = user.notificationSettings as any || {};

      return {
        account: {
          email: user.email,
          username: user.username,
          name: user.name,
          bio: user.bio,
          avatar: user.avatar,
          twoFactorEnabled: false, // TODO: Implement 2FA
          passwordLastChanged: user.updatedAt,
        },
        notifications: {
          email: {
            trades: notifications.email?.trades ?? true,
            waivers: notifications.email?.waivers ?? true,
            scoring: notifications.email?.scoring ?? false,
            leagueUpdates: notifications.email?.leagueUpdates ?? true,
            newsletter: notifications.email?.newsletter ?? false,
          },
          push: {
            trades: notifications.push?.trades ?? true,
            waivers: notifications.push?.waivers ?? true,
            scoring: notifications.push?.scoring ?? true,
            leagueUpdates: notifications.push?.leagueUpdates ?? true,
            injuries: notifications.push?.injuries ?? true,
          },
          inApp: {
            trades: notifications.inApp?.trades ?? true,
            waivers: notifications.inApp?.waivers ?? true,
            scoring: notifications.inApp?.scoring ?? true,
            messages: notifications.inApp?.messages ?? true,
            reminders: notifications.inApp?.reminders ?? true,
          },
          digest: {
            enabled: notifications.digest?.enabled ?? false,
            frequency: notifications.digest?.frequency ?? 'weekly',
            time: notifications.digest?.time ?? '09:00',
          },
        },
        display: {
          theme: settings.display?.theme ?? 'dark',
          timezone: settings.display?.timezone ?? 'America/New_York',
          language: settings.display?.language ?? 'en',
          dateFormat: settings.display?.dateFormat ?? 'MM/DD/YYYY',
          compactView: settings.display?.compactView ?? false,
          showPlayerPhotos: settings.display?.showPlayerPhotos ?? true,
          colorBlindMode: settings.display?.colorBlindMode ?? false,
          animations: settings.display?.animations ?? true,
        },
        fantasy: {
          defaultScoringType: settings.fantasy?.defaultScoringType ?? 'ppr',
          defaultRosterSize: settings.fantasy?.defaultRosterSize ?? 16,
          favoritePositions: settings.fantasy?.favoritePositions ?? ['QB', 'RB', 'WR'],
          autoSetLineup: settings.fantasy?.autoSetLineup ?? false,
          injuryAlerts: settings.fantasy?.injuryAlerts ?? true,
          tradeBlockVisible: settings.fantasy?.tradeBlockVisible ?? true,
          defaultLeagueSize: settings.fantasy?.defaultLeagueSize ?? 10,
        },
        privacy: {
          profileVisibility: settings.privacy?.profileVisibility ?? 'public',
          showEmail: settings.privacy?.showEmail ?? false,
          showStats: settings.privacy?.showStats ?? true,
          showTeams: settings.privacy?.showTeams ?? true,
          allowFriendRequests: settings.privacy?.allowFriendRequests ?? true,
          dataSharing: settings.privacy?.dataSharing ?? false,
          analytics: settings.privacy?.analytics ?? true,
        },
        connected: {
          google: { connected: false },
          facebook: { connected: false },
          twitter: { connected: false },
          espn: { connected: false },
          yahoo: { connected: false },
        },
        subscription: {
          plan: 'free',
          status: 'active',
          features: ['Basic leagues', 'Standard scoring', 'Mobile app'],
        },
      };
    }),

  updateSettings: protectedProcedure
    .input(z.object({
      category: z.enum(['account', 'notifications', 'display', 'fantasy', 'privacy']),
      settings: z.record(z.any()),
    }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
      });

      if (!user) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
      }

      const updateData: any = {};

      if (input.category === 'notifications') {
        const currentNotifications = (user.notificationSettings as any) || {};
        updateData.notificationSettings = {
          ...currentNotifications,
          ...input.settings,
        };
      } else {
        const currentSettings = (user.settings as any) || {};
        updateData.settings = {
          ...currentSettings,
          [input.category]: {
            ...currentSettings[input.category],
            ...input.settings,
          },
        };
      }

      return ctx.prisma.user.update({
        where: { id: ctx.session.user.id },
        data: updateData,
      });
    }),

  getHeadToHeadRecords: protectedProcedure
    .query(async ({ ctx }) => {
      const userId = ctx.session.user.id;
      
      // Get all teams for this user
      const userTeams = await ctx.prisma.team.findMany({
        where: { userId },
        include: {
          homeMatchups: {
            include: {
              awayTeam: {
                include: {
                  user: true,
                },
              },
            },
          },
          awayMatchups: {
            include: {
              homeTeam: {
                include: {
                  user: true,
                },
              },
            },
          },
        },
      });

      // Aggregate head-to-head records
      const h2hMap = new Map();

      userTeams.forEach(team => {
        team.homeMatchups.forEach(matchup => {
          if (!matchup.awayTeam.user) return;
          
          const opponentId = matchup.awayTeam.userId;
          const record = h2hMap.get(opponentId) || {
            opponentId,
            opponentName: matchup.awayTeam.user.username,
            opponentAvatar: matchup.awayTeam.user.avatar,
            wins: 0,
            losses: 0,
            ties: 0,
            totalPointsFor: 0,
            totalPointsAgainst: 0,
          };

          record.totalPointsFor += matchup.homeScore;
          record.totalPointsAgainst += matchup.awayScore;

          if (matchup.isComplete) {
            if (matchup.homeScore > matchup.awayScore) record.wins++;
            else if (matchup.homeScore < matchup.awayScore) record.losses++;
            else record.ties++;
          }

          h2hMap.set(opponentId, record);
        });

        team.awayMatchups.forEach(matchup => {
          if (!matchup.homeTeam.user) return;
          
          const opponentId = matchup.homeTeam.userId;
          const record = h2hMap.get(opponentId) || {
            opponentId,
            opponentName: matchup.homeTeam.user.username,
            opponentAvatar: matchup.homeTeam.user.avatar,
            wins: 0,
            losses: 0,
            ties: 0,
            totalPointsFor: 0,
            totalPointsAgainst: 0,
          };

          record.totalPointsFor += matchup.awayScore;
          record.totalPointsAgainst += matchup.homeScore;

          if (matchup.isComplete) {
            if (matchup.awayScore > matchup.homeScore) record.wins++;
            else if (matchup.awayScore < matchup.homeScore) record.losses++;
            else record.ties++;
          }

          h2hMap.set(opponentId, record);
        });
      });

      return Array.from(h2hMap.values());
    }),
});
