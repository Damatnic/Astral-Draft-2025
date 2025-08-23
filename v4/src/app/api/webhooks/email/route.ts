import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { emailLogger } from '../../../../server/email/logger';

// Resend webhook event types
interface ResendWebhookEvent {
  type: 'email.sent' | 'email.delivered' | 'email.delivery_delayed' | 'email.complained' | 'email.bounced' | 'email.opened' | 'email.clicked';
  created_at: string;
  data: {
    created_at: string;
    email_id: string;
    from: string;
    subject: string;
    to: string[];
    tags?: Array<{ name: string; value: string }>;
    bounce?: {
      type: string;
      reason: string;
    };
    complaint?: {
      type: string;
      reason: string;
    };
  };
}

export async function POST(request: NextRequest) {
  try {
    // Verify webhook signature (recommended for production)
    const headersList = headers();
    const signature = headersList.get('resend-webhook-signature');
    const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;

    // TODO: Implement signature verification for production
    if (process.env.NODE_ENV === 'production' && webhookSecret) {
      // Verify signature using your preferred method
      // This is important for security to ensure webhooks are from Resend
    }

    const event: ResendWebhookEvent = await request.json();
    
    console.log(`📧 Webhook event received: ${event.type} for email ${event.data.email_id}`);

    // Process the webhook event
    await processEmailWebhookEvent(event);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing email webhook:', error);
    
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    );
  }
}

async function processEmailWebhookEvent(event: ResendWebhookEvent) {
  const { type, data } = event;
  const messageId = data.email_id;

  switch (type) {
    case 'email.sent':
      // Email was successfully sent to the email service
      console.log(`✅ Email sent: ${messageId} to ${data.to.join(', ')}`);
      break;

    case 'email.delivered':
      // Email was successfully delivered to recipient's inbox
      emailLogger.logEmailDelivered(messageId);
      console.log(`📬 Email delivered: ${messageId} to ${data.to.join(', ')}`);
      break;

    case 'email.delivery_delayed':
      // Email delivery was delayed (usually temporary)
      console.log(`⏳ Email delivery delayed: ${messageId} to ${data.to.join(', ')}`);
      break;

    case 'email.bounced':
      // Email bounced (permanent or temporary failure)
      const bounceReason = data.bounce 
        ? `${data.bounce.type}: ${data.bounce.reason}`
        : 'Unknown bounce reason';
      
      emailLogger.logEmailBounced(messageId, bounceReason);
      console.log(`🔄 Email bounced: ${messageId} to ${data.to.join(', ')} - ${bounceReason}`);
      
      // TODO: Handle bounced emails (mark email as invalid, update user preferences, etc.)
      await handleEmailBounce(data.to[0], bounceReason);
      break;

    case 'email.complained':
      // Recipient marked email as spam
      const complaintReason = data.complaint?.reason || 'Spam complaint';
      
      emailLogger.logEmailComplaint(messageId);
      console.log(`🚨 Spam complaint: ${messageId} to ${data.to.join(', ')} - ${complaintReason}`);
      
      // TODO: Handle spam complaints (automatically unsubscribe user, investigate content, etc.)
      await handleSpamComplaint(data.to[0], complaintReason);
      break;

    case 'email.opened':
      // Email was opened by recipient (if tracking is enabled)
      console.log(`👀 Email opened: ${messageId} to ${data.to.join(', ')}`);
      
      // TODO: Track email open rates for analytics
      await trackEmailOpen(messageId, data.to[0]);
      break;

    case 'email.clicked':
      // Link in email was clicked (if tracking is enabled)
      console.log(`🖱️ Email link clicked: ${messageId} to ${data.to.join(', ')}`);
      
      // TODO: Track email click rates for analytics
      await trackEmailClick(messageId, data.to[0]);
      break;

    default:
      console.log(`❓ Unknown webhook event type: ${type}`);
  }
}

async function handleEmailBounce(email: string, reason: string) {
  try {
    // TODO: Implement bounce handling logic
    // Examples:
    // 1. Mark email as invalid in database
    // 2. Automatically unsubscribe user if hard bounce
    // 3. Add to suppression list
    // 4. Send notification to admin for review
    
    console.log(`Handling bounce for ${email}: ${reason}`);
    
    // For hard bounces, you might want to mark the email as invalid
    if (reason.includes('invalid') || reason.includes('not exist')) {
      // Mark email as invalid in your database
      // await db.user.update({
      //   where: { email },
      //   data: { emailValid: false }
      // });
    }
  } catch (error) {
    console.error('Error handling email bounce:', error);
  }
}

async function handleSpamComplaint(email: string, reason: string) {
  try {
    // TODO: Implement spam complaint handling
    // Examples:
    // 1. Automatically unsubscribe user from all emails
    // 2. Add to suppression list
    // 3. Review email content for improvements
    // 4. Send notification to admin
    
    console.log(`Handling spam complaint for ${email}: ${reason}`);
    
    // Automatically unsubscribe user from all marketing emails
    // await db.userPreferences.update({
    //   where: { userEmail: email },
    //   data: {
    //     emailMarketing: false,
    //     emailPromotions: false,
    //     // Keep transactional emails enabled for account security
    //   }
    // });
  } catch (error) {
    console.error('Error handling spam complaint:', error);
  }
}

async function trackEmailOpen(messageId: string, email: string) {
  try {
    // TODO: Implement email open tracking
    // Examples:
    // 1. Store open event in analytics database
    // 2. Update email campaign metrics
    // 3. Track user engagement patterns
    
    console.log(`Tracking email open: ${messageId} by ${email}`);
    
    // Store in analytics database
    // await db.emailAnalytics.create({
    //   data: {
    //     messageId,
    //     email,
    //     event: 'open',
    //     timestamp: new Date(),
    //   }
    // });
  } catch (error) {
    console.error('Error tracking email open:', error);
  }
}

async function trackEmailClick(messageId: string, email: string) {
  try {
    // TODO: Implement email click tracking
    // Examples:
    // 1. Store click event in analytics database
    // 2. Track which links are most effective
    // 3. Measure email campaign ROI
    
    console.log(`Tracking email click: ${messageId} by ${email}`);
    
    // Store in analytics database
    // await db.emailAnalytics.create({
    //   data: {
    //     messageId,
    //     email,
    //     event: 'click',
    //     timestamp: new Date(),
    //   }
    // });
  } catch (error) {
    console.error('Error tracking email click:', error);
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'email-webhook'
  });
}