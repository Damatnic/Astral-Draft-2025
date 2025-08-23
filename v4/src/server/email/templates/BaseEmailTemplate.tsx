import React from 'react';
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Img,
  Text,
  Link,
  Hr,
  Button,
  Font,
} from '@react-email/components';
// Note: @react-email/tailwind is optional - using inline styles for better compatibility

interface BaseEmailTemplateProps {
  children: React.ReactNode;
  previewText?: string;
  unsubscribeUrl?: string;
}

export function BaseEmailTemplate({ 
  children, 
  previewText,
  unsubscribeUrl 
}: BaseEmailTemplateProps) {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  
  return (
    <Html>
      <Head>
        <Font
          fontFamily="Inter"
          fallbackFontFamily="Helvetica"
          webFont={{
            url: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
            format: 'woff2',
          }}
          fontWeight={400}
          fontStyle="normal"
        />
        <Font
          fontFamily="JetBrains Mono"
          fallbackFontFamily="Consolas"
          webFont={{
            url: 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap',
            format: 'woff2',
          }}
          fontWeight={400}
          fontStyle="normal"
        />
      </Head>
        <Body style={{
          backgroundColor: '#0F172A',
          color: '#ffffff',
          fontFamily: 'Inter, Helvetica, Arial, sans-serif',
          margin: 0,
          padding: 0,
        }}>
          {previewText && (
            <Text style={{ display: 'none', overflow: 'hidden', color: 'transparent' }}>
              {previewText}
            </Text>
          )}
          
          <Container style={{ 
            margin: '0 auto', 
            padding: '32px 16px', 
            maxWidth: '672px' 
          }}>
            {/* Header */}
            <Section style={{ textAlign: 'center', marginBottom: '32px' }}>
              <div style={{
                background: 'linear-gradient(to right, #8B5CF6, #06B6D4)',
                padding: '24px',
                borderRadius: '8px',
                boxShadow: '0 0 20px rgba(139, 92, 246, 0.3)'
              }}>
                <Img
                  src={`${baseUrl}/logo-email.png`}
                  alt="Astral Draft"
                  style={{ margin: '0 auto', height: '48px', width: 'auto' }}
                />
                <Text style={{ 
                  fontSize: '24px', 
                  fontWeight: 'bold', 
                  color: '#ffffff', 
                  marginTop: '16px', 
                  marginBottom: '0' 
                }}>
                  ASTRAL DRAFT
                </Text>
                <Text style={{ 
                  color: '#E0E7FF', 
                  fontSize: '14px', 
                  fontFamily: 'JetBrains Mono, Consolas, Monaco, monospace',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  marginBottom: '0'
                }}>
                  Fantasy Football Redefined
                </Text>
              </div>
            </Section>

            {/* Main Content */}
            <Section style={{
              backgroundColor: '#1E293B',
              borderRadius: '8px',
              padding: '32px',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
            }}>
              {children}
            </Section>

            {/* Footer */}
            <Section style={{ 
              marginTop: '32px', 
              textAlign: 'center', 
              color: '#9CA3AF', 
              fontSize: '14px' 
            }}>
              <Hr style={{ border: '1px solid #334155', margin: '24px 0' }} />
              
              <Text style={{ marginBottom: '16px' }}>
                <strong style={{ color: '#06B6D4' }}>Astral Draft</strong> - 
                The Future of Fantasy Football
              </Text>
              
              <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                gap: '24px', 
                marginBottom: '16px',
                flexWrap: 'wrap'
              }}>
                <Link 
                  href={`${baseUrl}/dashboard`}
                  style={{ color: '#06B6D4', textDecoration: 'none' }}
                >
                  Dashboard
                </Link>
                <Link 
                  href={`${baseUrl}/leagues`}
                  style={{ color: '#06B6D4', textDecoration: 'none' }}
                >
                  My Leagues
                </Link>
                <Link 
                  href={`${baseUrl}/support`}
                  style={{ color: '#06B6D4', textDecoration: 'none' }}
                >
                  Support
                </Link>
              </div>

              {unsubscribeUrl && (
                <Text style={{ fontSize: '12px', color: '#6B7280', marginBottom: '16px' }}>
                  Don't want to receive these emails? {' '}
                  <Link 
                    href={unsubscribeUrl}
                    style={{ color: '#9CA3AF', textDecoration: 'underline' }}
                  >
                    Unsubscribe
                  </Link>
                </Text>
              )}

              <Text style={{ 
                fontSize: '12px', 
                color: '#6B7280', 
                lineHeight: '1.5' 
              }}>
                © {new Date().getFullYear()} Astral Draft. All rights reserved.<br />
                This email was sent from a notification-only address that cannot accept incoming email.<br />
                Please do not reply to this message.
              </Text>
            </Section>
          </Container>
        </Body>
    </Html>
  );
}

// Cyberpunk-themed button component
export function CyberButton({ 
  href, 
  children, 
  variant = 'primary'
}: {
  href: string;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'accent';
}) {
  const variantStyles = {
    primary: {
      backgroundColor: '#8B5CF6',
      borderColor: '#8B5CF6',
    },
    secondary: {
      backgroundColor: '#374151',
      borderColor: '#4B5563',
    },
    accent: {
      backgroundColor: '#06B6D4',
      borderColor: '#06B6D4',
    },
  };

  return (
    <Button
      href={href}
      style={{
        display: 'inline-block',
        padding: '12px 32px',
        borderRadius: '8px',
        fontWeight: '600',
        color: '#ffffff',
        border: '2px solid',
        textDecoration: 'none',
        fontFamily: 'JetBrains Mono, Consolas, Monaco, monospace',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        fontSize: '14px',
        ...variantStyles[variant]
      }}
    >
      {children}
    </Button>
  );
}

// Cyberpunk-themed stats card
export function CyberStatsCard({ 
  title, 
  value, 
  subtitle,
  icon 
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: string;
}) {
  return (
    <div style={{
      backgroundColor: '#0F172A',
      border: '1px solid rgba(139, 92, 246, 0.5)',
      borderRadius: '8px',
      padding: '16px',
      textAlign: 'center'
    }}>
      {icon && (
        <Text style={{ fontSize: '24px', marginBottom: '8px' }}>{icon}</Text>
      )}
      <Text style={{ 
        fontSize: '24px', 
        fontWeight: 'bold', 
        color: '#06B6D4', 
        marginBottom: '4px' 
      }}>
        {value}
      </Text>
      <Text style={{ 
        fontSize: '14px', 
        fontWeight: '600', 
        color: '#ffffff', 
        marginBottom: '4px' 
      }}>
        {title}
      </Text>
      {subtitle && (
        <Text style={{ fontSize: '12px', color: '#9CA3AF' }}>
          {subtitle}
        </Text>
      )}
    </div>
  );
}

// Cyberpunk-themed player card
export function CyberPlayerCard({
  name,
  position,
  team,
  projection,
  status = 'active'
}: {
  name: string;
  position: string;
  team: string;
  projection?: number;
  status?: 'active' | 'injured' | 'bye';
}) {
  const statusColors = {
    active: { color: '#00FF00', borderColor: '#00FF00' },
    injured: { color: '#F87171', borderColor: '#F87171' },
    bye: { color: '#FBBF24', borderColor: '#FBBF24' },
  };

  return (
    <div style={{
      backgroundColor: '#1E293B',
      border: '1px solid #374151',
      borderRadius: '8px',
      padding: '12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          border: '1px solid',
          ...statusColors[status]
        }} />
        <div>
          <Text style={{ 
            fontWeight: '600', 
            color: '#ffffff', 
            fontSize: '14px', 
            marginBottom: '0' 
          }}>
            {name}
          </Text>
          <Text style={{ 
            fontSize: '12px', 
            color: '#9CA3AF', 
            marginBottom: '0' 
          }}>
            {position} - {team}
          </Text>
        </div>
      </div>
      {projection && (
        <div style={{ textAlign: 'right' }}>
          <Text style={{ 
            fontSize: '14px', 
            fontWeight: 'bold', 
            color: '#06B6D4', 
            marginBottom: '0' 
          }}>
            {projection.toFixed(1)}
          </Text>
          <Text style={{ 
            fontSize: '12px', 
            color: '#9CA3AF', 
            marginBottom: '0' 
          }}>
            pts
          </Text>
        </div>
      )}
    </div>
  );
}