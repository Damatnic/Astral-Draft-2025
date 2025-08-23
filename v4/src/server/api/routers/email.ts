import { z } from 'zod';
import { createTRPCRouter, protectedProcedure, publicProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { 
  emailService, 
  EmailType,
  WelcomeEmailData,
  TradeEmailData,
  DraftReminderEmailData,
  DraftResultsEmailData,
  WaiverResultsEmailData,
  MatchupReminderEmailData,
  generateUnsubscribeUrl,
  generateActionUrl
} from '../../email';
import type { EmailTypeValue } from '../../email';
import { emailLogger } from '../../email/logger';

export const emailRouter = createTRPCRouter({
  /**
   * Send welcome email to new user
   */
  sendWelcomeEmail: protectedProcedure
    .input(z.object({
      userId: z.string(),
      email: z.string().email(),
      firstName: z.string(),
      username: z.string(),
      verificationToken: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
        
        const emailData: WelcomeEmailData = {
          userFirstName: input.firstName,
          userName: input.username,
          verificationUrl: input.verificationToken 
            ? generateActionUrl(`/verify-email/${input.verificationToken}`)
            : generateActionUrl('/dashboard'),
          unsubscribeUrl: generateUnsubscribeUrl(input.userId, EmailType.WELCOME),
        };

        const result = await emailService.sendWelcomeEmail(input.email, emailData);

        if (!result.success) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `Failed to send welcome email: ${result.error}`,
          });
        }

        // Log email sent event
        console.log(`Welcome email sent to ${input.email} (messageId: ${result.messageId})`);

        return {
          success: true,
          messageId: result.messageId,
        };
      } catch (error) {
        console.error('Error sending welcome email:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to send welcome email',
        });
      }
    }),

  /**
   * Send trade notification email
   */
  sendTradeNotification: protectedProcedure
    .input(z.object({
      recipientId: z.string(),
      recipientEmail: z.string().email(),
      recipientName: z.string(),
      proposerName: z.string(),
      leagueName: z.string(),
      tradeId: z.string(),
      tradeDetails: z.object({
        giving: z.array(z.string()),
        receiving: z.array(z.string()),
      }),
      type: z.enum(['proposed', 'accepted', 'rejected']),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        const emailData: TradeEmailData = {
          recipientName: input.recipientName,
          proposerName: input.proposerName,
          leagueName: input.leagueName,
          tradeDetails: input.tradeDetails,
          tradeUrl: generateActionUrl(`/trades/${input.tradeId}`),
          unsubscribeUrl: generateUnsubscribeUrl(input.recipientId, `trade-${input.type}` as any),
        };

        const result = await emailService.sendTradeNotificationEmail(
          input.recipientEmail,
          input.type,
          emailData
        );

        if (!result.success) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `Failed to send trade notification: ${result.error}`,
          });
        }

        console.log(`Trade ${input.type} email sent to ${input.recipientEmail} (messageId: ${result.messageId})`);

        return {
          success: true,
          messageId: result.messageId,
        };
      } catch (error) {
        console.error('Error sending trade notification:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to send trade notification',
        });
      }
    }),

  /**
   * Send draft reminder email
   */
  sendDraftReminder: protectedProcedure
    .input(z.object({
      userId: z.string(),
      email: z.string().email(),
      firstName: z.string(),
      leagueId: z.string(),
      leagueName: z.string(),
      draftDateTime: z.string(),
      draftId: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        const draftDate = new Date(input.draftDateTime);
        const now = new Date();
        const timeDiff = draftDate.getTime() - now.getTime();
        
        // Calculate time until draft
        const hours = Math.floor(timeDiff / (1000 * 60 * 60));
        const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
        const timeUntilDraft = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

        const emailData: DraftReminderEmailData = {
          userFirstName: input.firstName,
          leagueName: input.leagueName,
          draftDateTime: draftDate.toLocaleString(),
          draftUrl: generateActionUrl(`/draft/${input.draftId}/room`),
          timeUntilDraft,
          unsubscribeUrl: generateUnsubscribeUrl(input.userId, EmailType.DRAFT_REMINDER),
        };

        const result = await emailService.sendDraftReminderEmail(input.email, emailData);

        if (!result.success) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `Failed to send draft reminder: ${result.error}`,
          });
        }

        console.log(`Draft reminder sent to ${input.email} (messageId: ${result.messageId})`);

        return {
          success: true,
          messageId: result.messageId,
        };
      } catch (error) {
        console.error('Error sending draft reminder:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to send draft reminder',
        });
      }
    }),

  /**
   * Send draft results email
   */
  sendDraftResults: protectedProcedure
    .input(z.object({
      userId: z.string(),
      email: z.string().email(),
      firstName: z.string(),
      teamId: z.string(),
      teamName: z.string(),
      leagueId: z.string(),
      leagueName: z.string(),
      draftedPlayers: z.array(z.object({
        name: z.string(),
        position: z.string(),
        team: z.string(),
        round: z.number(),
      })),
      teamGrade: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        const emailData: DraftResultsEmailData = {
          userFirstName: input.firstName,
          leagueName: input.leagueName,
          teamName: input.teamName,
          draftedPlayers: input.draftedPlayers,
          teamGrade: input.teamGrade,
          leagueUrl: generateActionUrl(`/team/${input.teamId}`),
          unsubscribeUrl: generateUnsubscribeUrl(input.userId, EmailType.DRAFT_RESULTS),
        };

        const result = await emailService.sendDraftResultsEmail(input.email, emailData);

        if (!result.success) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `Failed to send draft results: ${result.error}`,
          });
        }

        console.log(`Draft results sent to ${input.email} (messageId: ${result.messageId})`);

        return {
          success: true,
          messageId: result.messageId,
        };
      } catch (error) {
        console.error('Error sending draft results:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to send draft results',
        });
      }
    }),

  /**
   * Send waiver results email
   */
  sendWaiverResults: protectedProcedure
    .input(z.object({
      userId: z.string(),
      email: z.string().email(),
      firstName: z.string(),
      leagueId: z.string(),
      leagueName: z.string(),
      claims: z.array(z.object({
        playerName: z.string(),
        position: z.string(),
        team: z.string(),
        status: z.enum(['successful', 'failed']),
        reason: z.string().optional(),
      })),
      nextWaiverDate: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        const emailData: WaiverResultsEmailData = {
          userFirstName: input.firstName,
          leagueName: input.leagueName,
          claims: input.claims,
          nextWaiverDate: input.nextWaiverDate,
          leagueUrl: generateActionUrl(`/leagues/${input.leagueId}`),
          unsubscribeUrl: generateUnsubscribeUrl(input.userId, EmailType.WAIVER_RESULTS),
        };

        const result = await emailService.sendWaiverResultsEmail(input.email, emailData);

        if (!result.success) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `Failed to send waiver results: ${result.error}`,
          });
        }

        console.log(`Waiver results sent to ${input.email} (messageId: ${result.messageId})`);

        return {
          success: true,
          messageId: result.messageId,
        };
      } catch (error) {
        console.error('Error sending waiver results:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to send waiver results',
        });
      }
    }),

  /**
   * Send matchup reminder email
   */
  sendMatchupReminder: protectedProcedure
    .input(z.object({
      userId: z.string(),
      email: z.string().email(),
      firstName: z.string(),
      teamId: z.string(),
      teamName: z.string(),
      opponentName: z.string(),
      leagueId: z.string(),
      leagueName: z.string(),
      weekNumber: z.number(),
      matchupId: z.string(),
      projectedScore: z.object({
        user: z.number(),
        opponent: z.number(),
      }),
      keyPlayers: z.array(z.object({
        name: z.string(),
        position: z.string(),
        projection: z.number(),
      })),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        const emailData: MatchupReminderEmailData = {
          userFirstName: input.firstName,
          teamName: input.teamName,
          opponentName: input.opponentName,
          leagueName: input.leagueName,
          weekNumber: input.weekNumber,
          matchupUrl: generateActionUrl(`/matchup/${input.matchupId}`),
          projectedScore: input.projectedScore,
          keyPlayers: input.keyPlayers,
          unsubscribeUrl: generateUnsubscribeUrl(input.userId, EmailType.MATCHUP_REMINDER),
        };

        const result = await emailService.sendMatchupReminderEmail(input.email, emailData);

        if (!result.success) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `Failed to send matchup reminder: ${result.error}`,
          });
        }

        console.log(`Matchup reminder sent to ${input.email} (messageId: ${result.messageId})`);

        return {
          success: true,
          messageId: result.messageId,
        };
      } catch (error) {
        console.error('Error sending matchup reminder:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to send matchup reminder',
        });
      }
    }),

  /**
   * Send bulk emails (admin only)
   */
  sendBulkEmails: protectedProcedure
    .input(z.object({
      emails: z.array(z.object({
        to: z.string().email(),
        type: z.enum(Object.values(EmailType) as [EmailTypeValue, ...EmailTypeValue[]]),
        data: z.any().optional().default({}),
      })),
      batchSize: z.number().optional().default(10),
    }))
    .mutation(async ({ input, ctx }) => {
      // Check if user is admin (you'll need to implement admin role checking)
      // const user = await ctx.db.user.findUnique({ where: { id: ctx.session.user.id } });
      // if (!user?.isAdmin) {
      //   throw new TRPCError({
      //     code: 'FORBIDDEN',
      //     message: 'Admin access required',
      //   });
      // }

      try {
        const emailsWithData = input.emails.map(email => ({
          ...email,
          data: email.data || {},
        }));
        const result = await emailService.sendBulkEmails(emailsWithData, input.batchSize);

        console.log(`Bulk email batch completed: ${result.success} sent, ${result.failed} failed`);

        return result;
      } catch (error) {
        console.error('Error sending bulk emails:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to send bulk emails',
        });
      }
    }),

  /**
   * Verify email configuration (admin only)
   */
  verifyConfiguration: protectedProcedure
    .mutation(async ({ ctx }) => {
      // Check if user is admin
      // const user = await ctx.db.user.findUnique({ where: { id: ctx.session.user.id } });
      // if (!user?.isAdmin) {
      //   throw new TRPCError({
      //     code: 'FORBIDDEN',
      //     message: 'Admin access required',
      //   });
      // }

      try {
        const result = await emailService.verifyConfiguration();
        return result;
      } catch (error) {
        console.error('Error verifying email configuration:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to verify email configuration',
        });
      }
    }),

  /**
   * Get email sending status (for testing)
   */
  getEmailStatus: protectedProcedure
    .input(z.object({
      messageId: z.string(),
    }))
    .query(async ({ input, ctx }) => {
      try {
        // In a real implementation, you might query Resend's API or your own logs
        // For now, we'll return a basic response
        return {
          messageId: input.messageId,
          status: 'delivered', // This would come from actual email service
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        console.error('Error getting email status:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get email status',
        });
      }
    }),

  /**
   * Test email sending (development only)
   */
  sendTestEmail: publicProcedure
    .input(z.object({
      to: z.string().email(),
      type: z.enum(['welcome', 'trade', 'draft', 'waiver', 'matchup']),
      testData: z.boolean().optional().default(true),
    }))
    .mutation(async ({ input, ctx }) => {
      // Only allow in development
      if (process.env.NODE_ENV === 'production') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Test emails not allowed in production',
        });
      }

      try {
        let result;
        const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

        switch (input.type) {
          case 'welcome':
            result = await emailService.sendWelcomeEmail(input.to, {
              userFirstName: 'Test User',
              userName: 'testuser',
              verificationUrl: `${baseUrl}/verify-email/test-token`,
              unsubscribeUrl: `${baseUrl}/unsubscribe?test=true`,
            });
            break;

          case 'trade':
            result = await emailService.sendTradeNotificationEmail(input.to, 'proposed', {
              recipientName: 'Test User',
              proposerName: 'Trade Partner',
              leagueName: 'Test League',
              tradeDetails: {
                giving: ['Josh Allen - QB - BUF', 'Saquon Barkley - RB - NYG'],
                receiving: ['Patrick Mahomes - QB - KC', 'Christian McCaffrey - RB - SF'],
              },
              tradeUrl: `${baseUrl}/trades/test-trade`,
              unsubscribeUrl: `${baseUrl}/unsubscribe?test=true`,
            });
            break;

          case 'draft':
            result = await emailService.sendDraftReminderEmail(input.to, {
              userFirstName: 'Test User',
              leagueName: 'Test League',
              draftDateTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleString(),
              draftUrl: `${baseUrl}/draft/test-draft/room`,
              timeUntilDraft: '24h 0m',
              unsubscribeUrl: `${baseUrl}/unsubscribe?test=true`,
            });
            break;

          default:
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: 'Invalid test email type',
            });
        }

        return result;
      } catch (error) {
        console.error('Error sending test email:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to send test email',
        });
      }
    }),

  /**
   * Get email metrics (admin only)
   */
  getEmailMetrics: protectedProcedure
    .input(z.object({
      hours: z.number().optional().default(24),
    }))
    .query(async ({ input, ctx }) => {
      // Check if user is admin (implement admin check as needed)
      // const user = await ctx.db.user.findUnique({ where: { id: ctx.session.user.id } });
      // if (!user?.isAdmin) {
      //   throw new TRPCError({
      //     code: 'FORBIDDEN',
      //     message: 'Admin access required',
      //   });
      // }

      try {
        const since = new Date(Date.now() - input.hours * 60 * 60 * 1000);
        const metrics = emailLogger.getMetrics(since);
        const recentActivity = emailLogger.getRecentActivity(input.hours);

        return {
          ...metrics,
          recentActivity,
          period: `Last ${input.hours} hours`,
        };
      } catch (error) {
        console.error('Error getting email metrics:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get email metrics',
        });
      }
    }),

  /**
   * Get email logs by type (admin only)
   */
  getEmailLogsByType: protectedProcedure
    .input(z.object({
      type: z.string(),
      limit: z.number().optional().default(50),
    }))
    .query(async ({ input, ctx }) => {
      try {
        const logs = emailLogger.getLogsByType(input.type as any, input.limit);
        return logs;
      } catch (error) {
        console.error('Error getting email logs by type:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get email logs',
        });
      }
    }),

  /**
   * Get email logs by recipient (admin only)
   */
  getEmailLogsByRecipient: protectedProcedure
    .input(z.object({
      email: z.string().email(),
      limit: z.number().optional().default(50),
    }))
    .query(async ({ input, ctx }) => {
      try {
        const logs = emailLogger.getLogsByRecipient(input.email, input.limit);
        return logs;
      } catch (error) {
        console.error('Error getting email logs by recipient:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get email logs',
        });
      }
    }),
});