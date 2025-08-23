/**
 * Email system test script
 * Run this script to test email functionality
 */

import { emailService, EmailType } from './index';
import { emailLogger } from './logger';

// Test configuration
const TEST_EMAIL = 'test@example.com'; // Change this to your test email
const BASE_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';

export async function testEmailSystem() {
  console.log('🧪 Starting email system tests...\n');

  // Test 1: Configuration verification
  console.log('1. Testing email configuration...');
  try {
    const configResult = await emailService.verifyConfiguration();
    if (configResult.success) {
      console.log('✅ Email configuration is valid');
    } else {
      console.log('❌ Email configuration error:', configResult.error);
      return;
    }
  } catch (error) {
    console.log('❌ Configuration test failed:', error);
    return;
  }

  console.log('');

  // Test 2: Welcome email
  console.log('2. Testing welcome email...');
  try {
    const welcomeResult = await emailService.sendWelcomeEmail(TEST_EMAIL, {
      userFirstName: 'Test User',
      userName: 'testuser123',
      verificationUrl: `${BASE_URL}/verify-email/test-token-123`,
      unsubscribeUrl: `${BASE_URL}/unsubscribe?userId=test&type=${EmailType.WELCOME}`,
    });

    if (welcomeResult.success) {
      console.log('✅ Welcome email sent successfully');
      console.log(`   Message ID: ${welcomeResult.messageId}`);
    } else {
      console.log('❌ Welcome email failed:', welcomeResult.error);
    }
  } catch (error) {
    console.log('❌ Welcome email test failed:', error);
  }

  console.log('');

  // Test 3: Trade notification email
  console.log('3. Testing trade notification email...');
  try {
    const tradeResult = await emailService.sendTradeNotificationEmail(
      TEST_EMAIL,
      'proposed',
      {
        recipientName: 'Test User',
        proposerName: 'Trade Partner',
        leagueName: 'Test League Championship',
        tradeDetails: {
          giving: ['Josh Allen - QB - BUF', 'Saquon Barkley - RB - NYG'],
          receiving: ['Patrick Mahomes - QB - KC', 'Christian McCaffrey - RB - SF'],
        },
        tradeUrl: `${BASE_URL}/trades/test-trade-123`,
        unsubscribeUrl: `${BASE_URL}/unsubscribe?userId=test&type=${EmailType.TRADE_PROPOSED}`,
      }
    );

    if (tradeResult.success) {
      console.log('✅ Trade notification email sent successfully');
      console.log(`   Message ID: ${tradeResult.messageId}`);
    } else {
      console.log('❌ Trade notification failed:', tradeResult.error);
    }
  } catch (error) {
    console.log('❌ Trade notification test failed:', error);
  }

  console.log('');

  // Test 4: Draft reminder email
  console.log('4. Testing draft reminder email...');
  try {
    const draftResult = await emailService.sendDraftReminderEmail(TEST_EMAIL, {
      userFirstName: 'Test User',
      leagueName: 'Test League Championship',
      draftDateTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleString(),
      draftUrl: `${BASE_URL}/draft/test-draft-123/room`,
      timeUntilDraft: '24h 0m',
      unsubscribeUrl: `${BASE_URL}/unsubscribe?userId=test&type=${EmailType.DRAFT_REMINDER}`,
    });

    if (draftResult.success) {
      console.log('✅ Draft reminder email sent successfully');
      console.log(`   Message ID: ${draftResult.messageId}`);
    } else {
      console.log('❌ Draft reminder failed:', draftResult.error);
    }
  } catch (error) {
    console.log('❌ Draft reminder test failed:', error);
  }

  console.log('');

  // Test 5: Email logging and metrics
  console.log('5. Testing email logging and metrics...');
  try {
    const metrics = emailLogger.getMetrics();
    const recentActivity = emailLogger.getRecentActivity(1);

    console.log('📊 Email Metrics:');
    console.log(`   Total sent: ${metrics.totalSent}`);
    console.log(`   Total delivered: ${metrics.totalDelivered}`);
    console.log(`   Total failed: ${metrics.totalFailed}`);
    console.log(`   Delivery rate: ${metrics.deliveryRate}%`);
    console.log(`   Failure rate: ${metrics.failureRate}%`);

    console.log('\n📈 Recent Activity (last hour):');
    console.log(`   Sent: ${recentActivity.sent}`);
    console.log(`   Delivered: ${recentActivity.delivered}`);
    console.log(`   Failed: ${recentActivity.failed}`);
    
    if (Object.keys(recentActivity.types).length > 0) {
      console.log('   By type:');
      Object.entries(recentActivity.types).forEach(([type, count]) => {
        console.log(`     ${type}: ${count}`);
      });
    }

    console.log('✅ Email logging system working correctly');
  } catch (error) {
    console.log('❌ Email logging test failed:', error);
  }

  console.log('');

  // Test 6: Error handling
  console.log('6. Testing error handling...');
  try {
    // Test with invalid email
    const errorResult = await emailService.sendWelcomeEmail('invalid-email', {
      userFirstName: 'Test User',
      userName: 'testuser123',
      verificationUrl: `${BASE_URL}/verify-email/test-token-123`,
      unsubscribeUrl: `${BASE_URL}/unsubscribe?userId=test&type=${EmailType.WELCOME}`,
    });

    if (!errorResult.success) {
      console.log('✅ Error handling working correctly');
      console.log(`   Expected error: ${errorResult.error}`);
    } else {
      console.log('⚠️ Error handling may not be working (email should have failed)');
    }
  } catch (error) {
    console.log('✅ Error handling working correctly (caught exception)');
  }

  console.log('\n🎉 Email system test completed!');
  console.log('\n📝 Next steps:');
  console.log('1. Configure your RESEND_API_KEY in the .env file');
  console.log('2. Update TEST_EMAIL in this script to your actual email address');
  console.log('3. Run the tests again to verify emails are actually sent');
  console.log('4. Check your email inbox for the test emails');
  console.log('5. Test the unsubscribe links and webhook endpoints');
}

// Test specific email template rendering
export async function testEmailTemplateRendering() {
  console.log('🎨 Testing email template rendering...\n');

  try {
    const { render } = await import('@react-email/render');
    const { WelcomeEmail } = await import('./templates/WelcomeEmail');
    const { TradeNotificationEmail } = await import('./templates/TradeNotificationEmail');

    // Test welcome email rendering
    console.log('1. Testing Welcome email template...');
    const welcomeHtml = render(WelcomeEmail({
      userFirstName: 'Test User',
      userName: 'testuser123',
      verificationUrl: `${BASE_URL}/verify-email/test-token`,
      unsubscribeUrl: `${BASE_URL}/unsubscribe?test=true`,
    }));

    if (welcomeHtml && welcomeHtml.length > 0) {
      console.log('✅ Welcome email template renders correctly');
      console.log(`   HTML length: ${welcomeHtml.length} characters`);
    } else {
      console.log('❌ Welcome email template failed to render');
    }

    // Test trade notification email rendering
    console.log('\n2. Testing Trade notification email template...');
    const tradeHtml = render(TradeNotificationEmail({
      recipientName: 'Test User',
      proposerName: 'Trade Partner',
      leagueName: 'Test League',
      tradeDetails: {
        giving: ['Josh Allen - QB - BUF'],
        receiving: ['Patrick Mahomes - QB - KC'],
      },
      tradeUrl: `${BASE_URL}/trades/test-trade`,
      unsubscribeUrl: `${BASE_URL}/unsubscribe?test=true`,
      type: 'proposed',
    }));

    if (tradeHtml && tradeHtml.length > 0) {
      console.log('✅ Trade notification email template renders correctly');
      console.log(`   HTML length: ${tradeHtml.length} characters`);
    } else {
      console.log('❌ Trade notification email template failed to render');
    }

    console.log('\n✅ Template rendering tests completed successfully!');
  } catch (error) {
    console.log('❌ Template rendering test failed:', error);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  console.log('🚀 Running email system tests...\n');
  
  testEmailTemplateRendering()
    .then(() => testEmailSystem())
    .then(() => {
      console.log('\n✨ All tests completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Test suite failed:', error);
      process.exit(1);
    });
}

const EmailTestSystem = {
  testEmailSystem,
  testEmailTemplateRendering,
};

export default EmailTestSystem;