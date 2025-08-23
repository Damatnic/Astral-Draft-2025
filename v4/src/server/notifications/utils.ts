/**
 * Notification utility functions
 * Helper functions for creating specific types of notifications
 */

import { pushNotificationService } from './push';
import { prisma } from '../db';

export interface NotificationTarget {
  userId?: string;
  teamId?: string;
  leagueId?: string;
}

export class NotificationUtils {
  /**
   * Send trade notification
   */
  static async sendTradeNotification(
    type: 'TRADE_OFFER' | 'TRADE_ACCEPTED' | 'TRADE_REJECTED' | 'TRADE_VETOED' | 'TRADE_EXECUTED',
    target: NotificationTarget,
    data: {
      tradeId: string;
      fromTeam: string;
      toTeam: string;
      details?: string;
    }
  ) {
    const titles = {
      TRADE_OFFER: 'New Trade Offer',
      TRADE_ACCEPTED: 'Trade Accepted',
      TRADE_REJECTED: 'Trade Rejected',
      TRADE_VETOED: 'Trade Vetoed',
      TRADE_EXECUTED: 'Trade Executed',
    };

    const contents = {
      TRADE_OFFER: `You received a trade offer from ${data.fromTeam}`,
      TRADE_ACCEPTED: `${data.toTeam} accepted your trade offer`,
      TRADE_REJECTED: `${data.toTeam} rejected your trade offer`,
      TRADE_VETOED: `Trade between ${data.fromTeam} and ${data.toTeam} was vetoed`,
      TRADE_EXECUTED: `Trade between ${data.fromTeam} and ${data.toTeam} has been executed`,
    };

    if (target.userId) {
      return pushNotificationService.createNotification(
        target.userId,
        titles[type],
        contents[type],
        {
          type: 'TRADE',
          category: type === 'TRADE_OFFER' ? 'INFO' : 'SUCCESS',
          priority: type === 'TRADE_OFFER' ? 'HIGH' : 'NORMAL',
          iconType: 'trade',
          data: {
            ...data,
            type,
            url: `/trades/${data.tradeId}`,
          },
        }
      );
    }
  }

  /**
   * Send waiver notification
   */
  static async sendWaiverNotification(
    type: 'WAIVER_CLAIM_SUCCESS' | 'WAIVER_CLAIM_FAILED' | 'WAIVER_PROCESSED',
    target: NotificationTarget,
    data: {
      playerName: string;
      teamName: string;
      amount?: number;
      reason?: string;
    }
  ) {
    const titles = {
      WAIVER_CLAIM_SUCCESS: 'Waiver Claim Successful',
      WAIVER_CLAIM_FAILED: 'Waiver Claim Failed',
      WAIVER_PROCESSED: 'Waivers Processed',
    };

    const getContent = () => {
      switch (type) {
        case 'WAIVER_CLAIM_SUCCESS':
          return `You successfully claimed ${data.playerName}${data.amount ? ` for $${data.amount}` : ''}`;
        case 'WAIVER_CLAIM_FAILED':
          return `Failed to claim ${data.playerName}${data.reason ? `: ${data.reason}` : ''}`;
        case 'WAIVER_PROCESSED':
          return 'Weekly waivers have been processed. Check your results!';
        default:
          return '';
      }
    };

    if (target.userId) {
      return pushNotificationService.createNotification(
        target.userId,
        titles[type],
        getContent(),
        {
          type: 'WAIVER',
          category: type === 'WAIVER_CLAIM_SUCCESS' ? 'SUCCESS' : type === 'WAIVER_CLAIM_FAILED' ? 'WARNING' : 'INFO',
          priority: 'NORMAL',
          iconType: 'waiver',
          data: {
            ...data,
            type,
            url: '/waivers',
          },
        }
      );
    }
  }

  /**
   * Send draft notification
   */
  static async sendDraftNotification(
    type: 'DRAFT_REMINDER' | 'DRAFT_STARTING' | 'YOUR_TURN' | 'DRAFT_COMPLETED',
    target: NotificationTarget,
    data: {
      draftId: string;
      leagueName: string;
      timeRemaining?: string;
      pickNumber?: number;
    }
  ) {
    const titles = {
      DRAFT_REMINDER: 'Draft Reminder',
      DRAFT_STARTING: 'Draft Starting',
      YOUR_TURN: 'Your Turn to Pick',
      DRAFT_COMPLETED: 'Draft Completed',
    };

    const getContent = () => {
      switch (type) {
        case 'DRAFT_REMINDER':
          return `${data.leagueName} draft starts ${data.timeRemaining ? `in ${data.timeRemaining}` : 'soon'}`;
        case 'DRAFT_STARTING':
          return `${data.leagueName} draft is starting now!`;
        case 'YOUR_TURN':
          return `It's your turn to pick in ${data.leagueName}${data.pickNumber ? ` (Pick #${data.pickNumber})` : ''}`;
        case 'DRAFT_COMPLETED':
          return `${data.leagueName} draft has been completed!`;
        default:
          return '';
      }
    };

    if (target.userId) {
      return pushNotificationService.createNotification(
        target.userId,
        titles[type],
        getContent(),
        {
          type: 'DRAFT',
          category: type === 'YOUR_TURN' ? 'URGENT' : 'INFO',
          priority: type === 'YOUR_TURN' ? 'URGENT' : 'HIGH',
          iconType: 'draft',
          data: {
            ...data,
            type,
            url: `/draft/${data.draftId}/room`,
          },
        }
      );
    }
  }

  /**
   * Send matchup notification
   */
  static async sendMatchupNotification(
    type: 'MATCHUP_REMINDER' | 'CLOSE_MATCHUP' | 'MATCHUP_RESULT',
    target: NotificationTarget,
    data: {
      week: number;
      opponent: string;
      score?: string;
      result?: 'WIN' | 'LOSS' | 'TIE';
    }
  ) {
    const titles = {
      MATCHUP_REMINDER: 'Matchup Reminder',
      CLOSE_MATCHUP: 'Close Matchup',
      MATCHUP_RESULT: 'Matchup Result',
    };

    const getContent = () => {
      switch (type) {
        case 'MATCHUP_REMINDER':
          return `Don't forget to set your lineup for Week ${data.week} vs ${data.opponent}`;
        case 'CLOSE_MATCHUP':
          return `You're in a close matchup with ${data.opponent}! Current score: ${data.score}`;
        case 'MATCHUP_RESULT':
          const resultText = data.result === 'WIN' ? 'won' : data.result === 'LOSS' ? 'lost' : 'tied';
          return `You ${resultText} your Week ${data.week} matchup vs ${data.opponent}${data.score ? ` (${data.score})` : ''}`;
        default:
          return '';
      }
    };

    if (target.userId) {
      return pushNotificationService.createNotification(
        target.userId,
        titles[type],
        getContent(),
        {
          type: 'MATCHUP',
          category: type === 'MATCHUP_RESULT' ? (data.result === 'WIN' ? 'SUCCESS' : data.result === 'LOSS' ? 'WARNING' : 'INFO') : 'INFO',
          priority: type === 'CLOSE_MATCHUP' ? 'HIGH' : 'NORMAL',
          iconType: 'matchup',
          data: {
            ...data,
            type,
            url: '/team',
          },
        }
      );
    }
  }

  /**
   * Send league notification
   */
  static async sendLeagueNotification(
    type: 'LEAGUE_INVITE' | 'LEAGUE_MESSAGE' | 'COMMISSIONER_ANNOUNCEMENT',
    target: NotificationTarget,
    data: {
      leagueName: string;
      message: string;
      from?: string;
    }
  ) {
    const titles = {
      LEAGUE_INVITE: 'League Invitation',
      LEAGUE_MESSAGE: 'New League Message',
      COMMISSIONER_ANNOUNCEMENT: 'Commissioner Announcement',
    };

    const getContent = () => {
      switch (type) {
        case 'LEAGUE_INVITE':
          return `You've been invited to join ${data.leagueName}`;
        case 'LEAGUE_MESSAGE':
          return `${data.from ? `${data.from}: ` : ''}${data.message}`;
        case 'COMMISSIONER_ANNOUNCEMENT':
          return `${data.leagueName}: ${data.message}`;
        default:
          return data.message;
      }
    };

    if (target.userId) {
      return pushNotificationService.createNotification(
        target.userId,
        titles[type],
        getContent(),
        {
          type: 'MESSAGE',
          category: type === 'COMMISSIONER_ANNOUNCEMENT' ? 'WARNING' : 'INFO',
          priority: type === 'COMMISSIONER_ANNOUNCEMENT' ? 'HIGH' : 'NORMAL',
          iconType: 'message',
          data: {
            ...data,
            type,
            url: target.leagueId ? `/leagues/${target.leagueId}` : '/leagues',
          },
        }
      );
    }
  }

  /**
   * Send system notification
   */
  static async sendSystemNotification(
    type: 'MAINTENANCE' | 'FEATURE_UPDATE' | 'SEASON_START' | 'SEASON_END',
    data: {
      title: string;
      message: string;
      url?: string;
      excludeUserIds?: string[];
    }
  ) {
    return pushNotificationService.sendSystemNotification(
      data.title,
      data.message,
      {
        type: 'SYSTEM',
        category: type === 'MAINTENANCE' ? 'WARNING' : 'INFO',
        priority: type === 'MAINTENANCE' ? 'HIGH' : 'NORMAL',
        excludeUserIds: data.excludeUserIds,
        data: {
          type,
          url: data.url || '/notifications',
        },
      }
    );
  }

  /**
   * Send notifications to league members
   */
  static async sendToLeagueMembers(
    leagueId: string,
    notification: {
      type: string;
      title: string;
      content: string;
      category?: string;
      priority?: string;
      data?: Record<string, any>;
    },
    excludeUserIds: string[] = []
  ) {
    try {
      // Get all league members
      const members = await prisma.leagueMember.findMany({
        where: {
          leagueId,
          userId: {
            notIn: excludeUserIds,
          },
        },
        include: {
          user: {
            select: { id: true },
          },
        },
      });

      const userIds = members.map(member => member.user.id);

      // Send notification to each member
      const results = await Promise.allSettled(
        userIds.map(userId =>
          pushNotificationService.createNotification(
            userId,
            notification.title,
            notification.content,
            {
              type: notification.type,
              category: notification.category as any || 'GENERAL',
              priority: notification.priority as any || 'NORMAL',
              data: notification.data,
            }
          )
        )
      );

      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.length - successful;

      return { sent: userIds.length, successful, failed };
    } catch (error) {
      console.error('Error sending notifications to league members:', error);
      throw new Error('Failed to send notifications to league members');
    }
  }

  /**
   * Send notifications to team owners
   */
  static async sendToTeamOwners(
    teamIds: string[],
    notification: {
      type: string;
      title: string;
      content: string;
      category?: string;
      priority?: string;
      data?: Record<string, any>;
    }
  ) {
    try {
      // Get team owners
      const teams = await prisma.team.findMany({
        where: { id: { in: teamIds } },
        select: { ownerId: true },
      });

      const userIds = teams.map(team => team.ownerId);

      // Send notification to each owner
      const results = await Promise.allSettled(
        userIds.map(userId =>
          pushNotificationService.createNotification(
            userId,
            notification.title,
            notification.content,
            {
              type: notification.type,
              category: notification.category as any || 'GENERAL',
              priority: notification.priority as any || 'NORMAL',
              data: notification.data,
            }
          )
        )
      );

      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.length - successful;

      return { sent: userIds.length, successful, failed };
    } catch (error) {
      console.error('Error sending notifications to team owners:', error);
      throw new Error('Failed to send notifications to team owners');
    }
  }
}

export { NotificationUtils as notificationUtils };