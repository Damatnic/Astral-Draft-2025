import React from 'react';
import { Text, Section, Hr } from '@react-email/components';
import { BaseEmailTemplate, CyberButton, CyberStatsCard } from './BaseEmailTemplate';

interface WelcomeEmailProps {
  userFirstName: string;
  userName: string;
  verificationUrl: string;
  unsubscribeUrl: string;
}

export function WelcomeEmail({
  userFirstName,
  userName,
  verificationUrl,
  unsubscribeUrl,
}: WelcomeEmailProps) {
  const previewText = `Welcome to Astral Draft, ${userFirstName}! Verify your email to get started.`;

  return (
    <BaseEmailTemplate previewText={previewText} unsubscribeUrl={unsubscribeUrl}>
      {/* Welcome Header */}
      <Section style={{ textAlign: 'center', marginBottom: '32px' }}>
        <Text style={{ 
          fontSize: '30px', 
          fontWeight: 'bold', 
          color: '#ffffff', 
          marginBottom: '16px' 
        }}>
          Welcome to the Future, {userFirstName}! 🚀
        </Text>
        <Text style={{ 
          fontSize: '18px', 
          color: '#CBD5E1', 
          marginBottom: '0' 
        }}>
          You've just joined the most advanced fantasy football platform in the galaxy.
        </Text>
      </Section>

      {/* Main Content */}
      <Section style={{ marginBottom: '32px' }}>
        <Text style={{ 
          color: '#CBD5E1', 
          lineHeight: '1.6', 
          marginBottom: '24px' 
        }}>
          Hey <strong style={{ color: '#06B6D4' }}>{userFirstName}</strong>,
        </Text>
        
        <Text style={{ 
          color: '#CBD5E1', 
          lineHeight: '1.6', 
          marginBottom: '24px' 
        }}>
          Welcome to <strong style={{ color: '#8B5CF6' }}>Astral Draft</strong>! 
          You're about to experience fantasy football like never before. Our AI-powered 
          Oracle, advanced analytics, and cyberpunk-themed interface will give you 
          the edge you need to dominate your leagues.
        </Text>

        <Text style={{ 
          color: '#CBD5E1', 
          lineHeight: '1.6', 
          marginBottom: '24px' 
        }}>
          Your username is: <strong style={{ 
            color: '#06B6D4', 
            fontFamily: 'JetBrains Mono, Consolas, Monaco, monospace' 
          }}>{userName}</strong>
        </Text>
      </Section>

      {/* Feature Cards */}
      <Section style={{ marginBottom: '32px' }}>
        <Text style={{ 
          fontSize: '20px', 
          fontWeight: 'bold', 
          color: '#ffffff', 
          marginBottom: '16px', 
          textAlign: 'center' 
        }}>
          What Makes Us Different
        </Text>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '16px', 
          marginBottom: '24px' 
        }}>
          <CyberStatsCard
            icon="🤖"
            title="AI Oracle"
            value="95%"
            subtitle="Prediction Accuracy"
          />
          <CyberStatsCard
            icon="📊"
            title="Real-Time"
            value="Live"
            subtitle="Data Updates"
          />
          <CyberStatsCard
            icon="⚡"
            title="Lightning"
            value="Fast"
            subtitle="Draft Experience"
          />
        </div>
      </Section>

      {/* Getting Started */}
      <Section style={{ marginBottom: '32px' }}>
        <Text style={{ 
          fontSize: '20px', 
          fontWeight: 'bold', 
          color: '#ffffff', 
          marginBottom: '16px' 
        }}>
          Ready to Get Started?
        </Text>
        
        <div style={{
          backgroundColor: '#0F172A',
          border: '1px solid rgba(139, 92, 246, 0.3)',
          borderRadius: '8px',
          padding: '24px',
          marginBottom: '24px'
        }}>
          <Text style={{ 
            color: '#06B6D4', 
            fontWeight: '600', 
            marginBottom: '12px' 
          }}>
            Step 1: Verify Your Email
          </Text>
          <Text style={{ 
            color: '#CBD5E1', 
            marginBottom: '16px' 
          }}>
            Click the button below to verify your email address and unlock all features.
          </Text>
          
          <div style={{ textAlign: 'center' }}>
            <CyberButton href={verificationUrl} variant="primary">
              🚀 Activate My Account
            </CyberButton>
          </div>
        </div>

        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '16px', 
          color: '#CBD5E1' 
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <span style={{ color: '#06B6D4', fontWeight: 'bold' }}>2.</span>
            <div>
              <Text style={{ 
                fontWeight: '600', 
                color: '#ffffff', 
                marginBottom: '4px' 
              }}>Complete Your Profile</Text>
              <Text style={{ 
                fontSize: '14px', 
                marginBottom: '0' 
              }}>
                Add your avatar, set your preferences, and customize your experience.
              </Text>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <span style={{ color: '#06B6D4', fontWeight: 'bold' }}>3.</span>
            <div>
              <Text style={{ 
                fontWeight: '600', 
                color: '#ffffff', 
                marginBottom: '4px' 
              }}>Join or Create a League</Text>
              <Text style={{ 
                fontSize: '14px', 
                marginBottom: '0' 
              }}>
                Connect with friends or join public leagues to start competing.
              </Text>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <span style={{ color: '#06B6D4', fontWeight: 'bold' }}>4.</span>
            <div>
              <Text style={{ 
                fontWeight: '600', 
                color: '#ffffff', 
                marginBottom: '4px' 
              }}>Experience the Oracle</Text>
              <Text style={{ 
                fontSize: '14px', 
                marginBottom: '0' 
              }}>
                Get AI-powered insights, trade analysis, and winning strategies.
              </Text>
            </div>
          </div>
        </div>
      </Section>

      <Hr style={{ border: '1px solid #374151', margin: '24px 0' }} />

      {/* Support Section */}
      <Section style={{ textAlign: 'center' }}>
        <Text style={{ 
          fontSize: '18px', 
          fontWeight: '600', 
          color: '#ffffff', 
          marginBottom: '12px' 
        }}>
          Need Help? We've Got You Covered
        </Text>
        
        <Text style={{ 
          color: '#CBD5E1', 
          marginBottom: '16px' 
        }}>
          Our support team is standing by to help you get the most out of Astral Draft.
        </Text>
        
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '12px', 
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <CyberButton 
            href={`${process.env.NEXTAUTH_URL}/docs/getting-started`}
            variant="secondary"
          >
            📚 Getting Started Guide
          </CyberButton>
          <CyberButton 
            href={`${process.env.NEXTAUTH_URL}/support`}
            variant="accent"
          >
            💬 Contact Support
          </CyberButton>
        </div>
      </Section>

      <Hr style={{ border: '1px solid #374151', margin: '24px 0' }} />

      {/* Final Message */}
      <Section style={{ textAlign: 'center' }}>
        <Text style={{ 
          color: '#CBD5E1', 
          marginBottom: '16px' 
        }}>
          Welcome to the future of fantasy football. Let's make this season legendary!
        </Text>
        
        <Text style={{ 
          fontSize: '14px', 
          color: '#9CA3AF', 
          fontStyle: 'italic' 
        }}>
          The Astral Draft Team
        </Text>
      </Section>
    </BaseEmailTemplate>
  );
}