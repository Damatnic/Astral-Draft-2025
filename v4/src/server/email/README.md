# Astral Draft Email System

A comprehensive email system for the Astral Draft fantasy football platform, featuring cyberpunk-themed templates, robust error handling, and real-time monitoring.

## Features

- 🎨 **Cyberpunk-themed email templates** with responsive design
- 📧 **Multiple email types**: Welcome, Trade notifications, Draft reminders, Waiver results, Matchup reminders
- 🔄 **Automatic retry mechanism** for failed email delivery
- 📊 **Comprehensive logging and metrics** for monitoring
- 🛡️ **Error handling and categorization** for better debugging
- 🔗 **Unsubscribe management** with user-friendly pages
- 📱 **Mobile-responsive templates** for all devices
- 🎯 **Webhook support** for real-time email event tracking

## Email Templates

### 1. Welcome Email (`WelcomeEmail.tsx`)
- Sent to new users upon registration
- Includes account verification link
- Cyberpunk-themed onboarding experience
- Feature highlights and getting started guide

### 2. Trade Notification Email (`TradeNotificationEmail.tsx`)
- Three variants: proposed, accepted, rejected
- Visual trade details with player cards
- Oracle insights and strategy tips
- Action buttons for trade management

### 3. Draft Reminder Email (`DraftReminderEmail.tsx`)
- Countdown timer to draft start
- Pre-draft checklist and preparation tips
- AI draft tools overview
- Mobile app promotion

### 4. Draft Results Email (`DraftResultsEmail.tsx`)
- Complete draft recap with team grade
- Key picks analysis and position breakdown
- Oracle draft analysis with strengths/weaknesses
- Season preparation guidance

### 5. Waiver Results Email (`WaiverResultsEmail.tsx`)
- Successful and failed claims breakdown
- Next waiver period information
- Oracle waiver insights and hot pickups
- Strategy tips for future claims

### 6. Matchup Reminder Email (`MatchupReminderEmail.tsx`)
- Weekly matchup preview with projections
- Win probability and key players
- Oracle strategy insights
- Pre-game checklist

## Configuration

### Environment Variables

Add these to your `.env` file:

```bash
# Resend Configuration (Recommended)
RESEND_API_KEY="your-resend-api-key"
RESEND_FROM_EMAIL="Astral Draft <noreply@astraldraft.com>"
RESEND_REPLY_TO="support@astraldraft.com"

# Webhook Security (Optional)
RESEND_WEBHOOK_SECRET="your-webhook-secret"

# Application URL
NEXTAUTH_URL="http://localhost:3000"
```

### Getting a Resend API Key

1. Sign up at [resend.com](https://resend.com)
2. Verify your domain or use the sandbox for testing
3. Generate an API key in the dashboard
4. Add the key to your environment variables

## Usage

### Sending Emails via tRPC

```typescript
import { api } from "~/utils/api";

// Send welcome email
const { mutate: sendWelcome } = api.email.sendWelcomeEmail.useMutation();

sendWelcome({
  userId: "user-123",
  email: "user@example.com",
  firstName: "John",
  username: "john_doe",
  verificationToken: "verification-token-123"
});

// Send trade notification
const { mutate: sendTrade } = api.email.sendTradeNotification.useMutation();

sendTrade({
  recipientId: "user-456",
  recipientEmail: "recipient@example.com",
  recipientName: "Jane Doe",
  proposerName: "John Doe",
  leagueName: "Championship League",
  tradeId: "trade-789",
  tradeDetails: {
    giving: ["Josh Allen - QB - BUF"],
    receiving: ["Patrick Mahomes - QB - KC"]
  },
  type: "proposed"
});
```

### Direct Email Service Usage

```typescript
import { emailService } from "~/server/email";

// Send welcome email directly
const result = await emailService.sendWelcomeEmail("user@example.com", {
  userFirstName: "John",
  userName: "john_doe",
  verificationUrl: "https://app.com/verify/token",
  unsubscribeUrl: "https://app.com/unsubscribe?userId=123&type=welcome"
});

if (result.success) {
  console.log("Email sent:", result.messageId);
} else {
  console.error("Email failed:", result.error);
}
```

## Testing

### Run Email System Tests

```bash
# Test all email functionality
npm run email:test

# Test template rendering only
npm run email:templates
```

### Manual Testing in Development

```typescript
// Use the test endpoint (development only)
const { mutate: sendTest } = api.email.sendTestEmail.useMutation();

sendTest({
  to: "your-email@example.com",
  type: "welcome"
});
```

## Monitoring and Analytics

### Email Metrics

```typescript
// Get email metrics via tRPC
const { data: metrics } = api.email.getEmailMetrics.useQuery({
  hours: 24 // Last 24 hours
});

console.log("Delivery rate:", metrics.deliveryRate);
console.log("Total sent:", metrics.totalSent);
```

### Email Logs

```typescript
// Get logs by email type
const { data: logs } = api.email.getEmailLogsByType.useQuery({
  type: "welcome",
  limit: 50
});

// Get logs by recipient
const { data: userLogs } = api.email.getEmailLogsByRecipient.useQuery({
  email: "user@example.com",
  limit: 20
});
```

## Webhook Integration

### Setting up Webhooks

1. In your Resend dashboard, configure webhooks to point to:
   ```
   https://yourdomain.com/api/webhooks/email
   ```

2. Add webhook secret to environment variables:
   ```bash
   RESEND_WEBHOOK_SECRET="your-webhook-secret"
   ```

### Webhook Events Handled

- `email.sent` - Email was sent successfully
- `email.delivered` - Email was delivered to inbox
- `email.bounced` - Email bounced (updates user preferences)
- `email.complained` - Spam complaint (auto-unsubscribe)
- `email.opened` - Email was opened (analytics)
- `email.clicked` - Link was clicked (analytics)

## Unsubscribe Management

### Automatic Unsubscribe Links

All emails include unsubscribe links that:
- Display a user-friendly confirmation page
- Update user preferences in the database
- Respect user choices while maintaining security emails

### API Unsubscribe

```bash
# GET request (from email link)
GET /api/unsubscribe?userId=123&type=welcome

# POST request (programmatic)
POST /api/unsubscribe
{
  "userId": "123",
  "type": "trade-notifications"
}
```

## Error Handling

### Error Categories

- `CONFIGURATION` - Missing API keys or config
- `NETWORK` - Temporary connectivity issues (retryable)
- `AUTHENTICATION` - Invalid API credentials
- `RATE_LIMIT` - Rate limiting (retryable with backoff)
- `INVALID_RECIPIENT` - Invalid email address
- `CONTENT` - Email content issues
- `UNKNOWN` - Unexpected errors

### Retry Mechanism

- Automatic retry for retryable errors
- Exponential backoff: 1s, 5s, 15s delays
- Maximum 3 retry attempts
- Detailed error logging for debugging

## Security Considerations

1. **Webhook Verification**: Always verify webhook signatures in production
2. **Rate Limiting**: Implement rate limiting for email endpoints
3. **Unsubscribe Tokens**: Use signed tokens for unsubscribe links
4. **Data Validation**: Validate all email data before sending
5. **Logging**: Log email activities but avoid sensitive data

## Performance Optimization

1. **Batch Processing**: Use `sendBulkEmails` for multiple recipients
2. **Template Caching**: React Email templates are cached automatically
3. **Async Processing**: Use job queues for high-volume sending
4. **Error Recovery**: Implement dead letter queues for failed emails

## Troubleshooting

### Common Issues

1. **"RESEND_API_KEY is not configured"**
   - Add your Resend API key to `.env` file
   - Restart your development server

2. **"Invalid email address"**
   - Verify email format is correct
   - Check for whitespace or special characters

3. **"Rate limit exceeded"**
   - Implement delays between bulk sends
   - Consider upgrading your Resend plan

4. **Templates not rendering**
   - Check React Email component syntax
   - Verify all imports are correct
   - Run template tests: `npm run email:templates`

### Debug Mode

Enable detailed logging by setting:
```bash
DEBUG=true
NODE_ENV=development
```

## Contributing

When adding new email templates:

1. Create the template component in `templates/`
2. Add the email type to `EmailType` enum
3. Create validation schema with Zod
4. Add service method to `EmailService` class
5. Add tRPC endpoint to `emailRouter`
6. Update tests and documentation
7. Test thoroughly with `npm run email:test`

## API Reference

### EmailService Methods

- `sendWelcomeEmail(to, data)` - Send welcome email
- `sendTradeNotificationEmail(to, type, data)` - Send trade notification
- `sendDraftReminderEmail(to, data)` - Send draft reminder
- `sendDraftResultsEmail(to, data)` - Send draft results
- `sendWaiverResultsEmail(to, data)` - Send waiver results
- `sendMatchupReminderEmail(to, data)` - Send matchup reminder
- `sendBulkEmails(emails, batchSize)` - Send multiple emails
- `verifyConfiguration()` - Test email configuration

### tRPC Endpoints

- `email.sendWelcomeEmail` - Send welcome email
- `email.sendTradeNotification` - Send trade notification
- `email.sendDraftReminder` - Send draft reminder
- `email.sendDraftResults` - Send draft results
- `email.sendWaiverResults` - Send waiver results
- `email.sendMatchupReminder` - Send matchup reminder
- `email.sendBulkEmails` - Send bulk emails (admin)
- `email.verifyConfiguration` - Verify configuration (admin)
- `email.getEmailMetrics` - Get email metrics (admin)
- `email.getEmailLogsByType` - Get logs by type (admin)
- `email.getEmailLogsByRecipient` - Get logs by recipient (admin)
- `email.sendTestEmail` - Send test email (development only)

---

For more information, check the source code in `src/server/email/` or run the test suite to see the system in action.