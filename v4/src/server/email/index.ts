import { Resend } from 'resend';
import { render } from '@react-email/render';
import { env } from '../../env';
import { z } from 'zod';
import { emailLogger, EmailError, EmailErrorCategory, emailRetryManager } from './logger';
import { v4 as uuidv4 } from 'uuid';

// Email templates
import { WelcomeEmail } from './templates/WelcomeEmail';
import { TradeNotificationEmail } from './templates/TradeNotificationEmail';
import { DraftReminderEmail } from './templates/DraftReminderEmail';
import { DraftResultsEmail } from './templates/DraftResultsEmail';
import { WaiverResultsEmail } from './templates/WaiverResultsEmail';
import { MatchupReminderEmail } from './templates/MatchupReminderEmail';

// Initialize Resend
const resend = new Resend(env.RESEND_API_KEY);

// Email configuration
const EMAIL_CONFIG = {
  from: env.RESEND_FROM_EMAIL || 'Astral Draft <noreply@astraldraft.com>',
  replyTo: env.RESEND_REPLY_TO || 'support@astraldraft.com',
} as const;

// Email types and schemas
export const EmailType = {
  WELCOME: 'welcome',
  TRADE_PROPOSED: 'trade-proposed',
  TRADE_ACCEPTED: 'trade-accepted', 
  TRADE_REJECTED: 'trade-rejected',
  DRAFT_REMINDER: 'draft-reminder',
  DRAFT_RESULTS: 'draft-results',
  WAIVER_RESULTS: 'waiver-results',
  MATCHUP_REMINDER: 'matchup-reminder',
} as const;

export type EmailTypeValue = typeof EmailType[keyof typeof EmailType];

// Email data schemas
export const WelcomeEmailData = z.object({
  userFirstName: z.string(),
  userName: z.string(),
  verificationUrl: z.string().url(),
  unsubscribeUrl: z.string().url(),
});

export const TradeEmailData = z.object({
  recipientName: z.string(),
  proposerName: z.string(),
  leagueName: z.string(),
  tradeDetails: z.object({
    giving: z.array(z.string()),
    receiving: z.array(z.string()),
  }),
  tradeUrl: z.string().url(),
  unsubscribeUrl: z.string().url(),
});

export const DraftReminderEmailData = z.object({
  userFirstName: z.string(),
  leagueName: z.string(),
  draftDateTime: z.string(),
  draftUrl: z.string().url(),
  timeUntilDraft: z.string(),
  unsubscribeUrl: z.string().url(),
});

export const DraftResultsEmailData = z.object({
  userFirstName: z.string(),
  leagueName: z.string(),
  teamName: z.string(),
  draftedPlayers: z.array(z.object({
    name: z.string(),
    position: z.string(),
    team: z.string(),
    round: z.number(),
  })),
  teamGrade: z.string().optional(),
  leagueUrl: z.string().url(),
  unsubscribeUrl: z.string().url(),
});

export const WaiverResultsEmailData = z.object({
  userFirstName: z.string(),
  leagueName: z.string(),
  claims: z.array(z.object({
    playerName: z.string(),
    position: z.string(),
    team: z.string(),
    status: z.enum(['successful', 'failed']),
    reason: z.string().optional(),
  })),
  nextWaiverDate: z.string(),
  leagueUrl: z.string().url(),
  unsubscribeUrl: z.string().url(),
});

export const MatchupReminderEmailData = z.object({
  userFirstName: z.string(),
  teamName: z.string(),
  opponentName: z.string(),
  leagueName: z.string(),
  weekNumber: z.number(),
  matchupUrl: z.string().url(),
  projectedScore: z.object({
    user: z.number(),
    opponent: z.number(),
  }),
  keyPlayers: z.array(z.object({
    name: z.string(),
    position: z.string(),
    projection: z.number(),
  })),
  unsubscribeUrl: z.string().url(),
});

export type WelcomeEmailData = z.infer<typeof WelcomeEmailData>;
export type TradeEmailData = z.infer<typeof TradeEmailData>;
export type DraftReminderEmailData = z.infer<typeof DraftReminderEmailData>;
export type DraftResultsEmailData = z.infer<typeof DraftResultsEmailData>;
export type WaiverResultsEmailData = z.infer<typeof WaiverResultsEmailData>;
export type MatchupReminderEmailData = z.infer<typeof MatchupReminderEmailData>;

// Email service class
export class EmailService {
  private resend: Resend;

  constructor() {
    this.resend = resend;
  }

  /**
   * Send welcome email to new user
   */
  async sendWelcomeEmail(
    to: string,
    data: WelcomeEmailData
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const operationId = uuidv4();
    
    // Validate email address format
    if (!z.string().email().safeParse(to).success) {
      const error = new EmailError(
        `Invalid email address: ${to}`,
        EmailErrorCategory.INVALID_RECIPIENT
      );
      emailLogger.logEmailFailed(operationId, error.message);
      return { success: false, error: error.message };
    }

    // Log email attempt
    emailLogger.logEmailSent(operationId, EmailType.WELCOME, to, undefined, {
      userFirstName: data.userFirstName,
    });

    try {
      const result = await emailRetryManager.executeWithRetry(async () => {
        // Validate input data
        const validatedData = WelcomeEmailData.parse(data);
        
        // Render email template
        const html = render(WelcomeEmail(validatedData));
        
        // Check for required configuration
        if (!env.RESEND_API_KEY) {
          throw new EmailError(
            'RESEND_API_KEY is not configured',
            EmailErrorCategory.CONFIGURATION
          );
        }

        // Send email
        const emailResult = await this.resend.emails.send({
          from: EMAIL_CONFIG.from,
          to,
          subject: 'Welcome to Astral Draft! 🚀',
          html,
          tags: [
            { name: 'type', value: EmailType.WELCOME },
            { name: 'category', value: 'onboarding' },
            { name: 'operationId', value: operationId },
          ],
        });

        if (emailResult.error) {
          throw EmailError.fromResendError(emailResult.error);
        }

        return emailResult;
      }, operationId);

      // Log success
      emailLogger.logEmailSent(operationId, EmailType.WELCOME, to, result.data?.id, {
        userFirstName: data.userFirstName,
      });

      return { success: true, messageId: result.data?.id };
    } catch (error) {
      const emailError = error instanceof EmailError 
        ? error 
        : EmailError.fromResendError(error);
      
      emailLogger.logEmailFailed(operationId, emailError.message);
      
      return { 
        success: false, 
        error: emailError.message 
      };
    }
  }

  /**
   * Send trade notification email
   */
  async sendTradeNotificationEmail(
    to: string,
    type: 'proposed' | 'accepted' | 'rejected',
    data: TradeEmailData
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const validatedData = TradeEmailData.parse(data);
      
      const html = render(TradeNotificationEmail({ ...validatedData, type }));
      
      const subjectMap = {
        proposed: `New Trade Proposal in ${data.leagueName} 📈`,
        accepted: `Trade Accepted in ${data.leagueName} ✅`,
        rejected: `Trade Rejected in ${data.leagueName} ❌`,
      };

      const result = await this.resend.emails.send({
        from: EMAIL_CONFIG.from,
        to,
        subject: subjectMap[type],
        html,
        tags: [
          { name: 'type', value: `trade-${type}` },
          { name: 'category', value: 'trade' },
        ],
      });

      if (result.error) {
        console.error(`Failed to send trade ${type} email:`, result.error);
        return { success: false, error: result.error.message };
      }

      return { success: true, messageId: result.data?.id };
    } catch (error) {
      console.error(`Error sending trade ${type} email:`, error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Send draft reminder email
   */
  async sendDraftReminderEmail(
    to: string,
    data: DraftReminderEmailData
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const validatedData = DraftReminderEmailData.parse(data);
      
      const html = render(DraftReminderEmail(validatedData));
      
      const result = await this.resend.emails.send({
        from: EMAIL_CONFIG.from,
        to,
        subject: `Draft Starting Soon - ${data.leagueName} ⏰`,
        html,
        tags: [
          { name: 'type', value: EmailType.DRAFT_REMINDER },
          { name: 'category', value: 'draft' },
        ],
      });

      if (result.error) {
        console.error('Failed to send draft reminder email:', result.error);
        return { success: false, error: result.error.message };
      }

      return { success: true, messageId: result.data?.id };
    } catch (error) {
      console.error('Error sending draft reminder email:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Send draft results email
   */
  async sendDraftResultsEmail(
    to: string,
    data: DraftResultsEmailData
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const validatedData = DraftResultsEmailData.parse(data);
      
      const html = render(DraftResultsEmail(validatedData));
      
      const result = await this.resend.emails.send({
        from: EMAIL_CONFIG.from,
        to,
        subject: `Draft Complete - ${data.teamName} Results 📊`,
        html,
        tags: [
          { name: 'type', value: EmailType.DRAFT_RESULTS },
          { name: 'category', value: 'draft' },
        ],
      });

      if (result.error) {
        console.error('Failed to send draft results email:', result.error);
        return { success: false, error: result.error.message };
      }

      return { success: true, messageId: result.data?.id };
    } catch (error) {
      console.error('Error sending draft results email:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Send waiver results email
   */
  async sendWaiverResultsEmail(
    to: string,
    data: WaiverResultsEmailData
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const validatedData = WaiverResultsEmailData.parse(data);
      
      const html = render(WaiverResultsEmail(validatedData));
      
      const result = await this.resend.emails.send({
        from: EMAIL_CONFIG.from,
        to,
        subject: `Waiver Results - ${data.leagueName} 📝`,
        html,
        tags: [
          { name: 'type', value: EmailType.WAIVER_RESULTS },
          { name: 'category', value: 'waiver' },
        ],
      });

      if (result.error) {
        console.error('Failed to send waiver results email:', result.error);
        return { success: false, error: result.error.message };
      }

      return { success: true, messageId: result.data?.id };
    } catch (error) {
      console.error('Error sending waiver results email:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Send weekly matchup reminder email
   */
  async sendMatchupReminderEmail(
    to: string,
    data: MatchupReminderEmailData
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const validatedData = MatchupReminderEmailData.parse(data);
      
      const html = render(MatchupReminderEmail(validatedData));
      
      const result = await this.resend.emails.send({
        from: EMAIL_CONFIG.from,
        to,
        subject: `Week ${data.weekNumber} Matchup - ${data.leagueName} 🏈`,
        html,
        tags: [
          { name: 'type', value: EmailType.MATCHUP_REMINDER },
          { name: 'category', value: 'matchup' },
        ],
      });

      if (result.error) {
        console.error('Failed to send matchup reminder email:', result.error);
        return { success: false, error: result.error.message };
      }

      return { success: true, messageId: result.data?.id };
    } catch (error) {
      console.error('Error sending matchup reminder email:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Send bulk emails with batching for better performance
   */
  async sendBulkEmails(
    emails: Array<{
      to: string;
      type: EmailTypeValue;
      data: any;
    }>,
    batchSize = 10
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    // Process emails in batches
    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize);
      
      const promises = batch.map(async (email) => {
        try {
          let result;
          
          switch (email.type) {
            case EmailType.WELCOME:
              result = await this.sendWelcomeEmail(email.to, email.data);
              break;
            case EmailType.TRADE_PROPOSED:
              result = await this.sendTradeNotificationEmail(email.to, 'proposed', email.data);
              break;
            case EmailType.TRADE_ACCEPTED:
              result = await this.sendTradeNotificationEmail(email.to, 'accepted', email.data);
              break;
            case EmailType.TRADE_REJECTED:
              result = await this.sendTradeNotificationEmail(email.to, 'rejected', email.data);
              break;
            case EmailType.DRAFT_REMINDER:
              result = await this.sendDraftReminderEmail(email.to, email.data);
              break;
            case EmailType.DRAFT_RESULTS:
              result = await this.sendDraftResultsEmail(email.to, email.data);
              break;
            case EmailType.WAIVER_RESULTS:
              result = await this.sendWaiverResultsEmail(email.to, email.data);
              break;
            case EmailType.MATCHUP_REMINDER:
              result = await this.sendMatchupReminderEmail(email.to, email.data);
              break;
            default:
              throw new Error(`Unknown email type: ${email.type}`);
          }

          if (result.success) {
            success++;
          } else {
            failed++;
            errors.push(`Failed to send ${email.type} to ${email.to}: ${result.error}`);
          }
        } catch (error) {
          failed++;
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          errors.push(`Error sending ${email.type} to ${email.to}: ${errorMessage}`);
        }
      });

      await Promise.all(promises);
      
      // Add small delay between batches to avoid rate limiting
      if (i + batchSize < emails.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return { success, failed, errors };
  }

  /**
   * Verify email configuration and connectivity
   */
  async verifyConfiguration(): Promise<{ success: boolean; error?: string }> {
    try {
      // Test with a simple email send (this won't actually send)
      const testResult = await this.resend.emails.send({
        from: EMAIL_CONFIG.from,
        to: 'test@example.com',
        subject: 'Configuration Test',
        html: '<p>This is a test email</p>',
        tags: [{ name: 'type', value: 'test' }],
      });

      if (testResult.error) {
        return { success: false, error: testResult.error.message };
      }

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
}

// Export singleton instance
export const emailService = new EmailService();

// Helper function to generate unsubscribe URLs
export function generateUnsubscribeUrl(
  userId: string, 
  emailType: EmailTypeValue,
  baseUrl: string = process.env.NEXTAUTH_URL || 'http://localhost:3000'
): string {
  return `${baseUrl}/api/unsubscribe?userId=${userId}&type=${emailType}`;
}

// Helper function to generate action URLs
export function generateActionUrl(
  path: string,
  params: Record<string, string> = {},
  baseUrl: string = process.env.NEXTAUTH_URL || 'http://localhost:3000'
): string {
  const url = new URL(path, baseUrl);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });
  return url.toString();
}