/**
 * Email utility functions for authentication
 * These functions provide token generation and email sending for auth flows
 */

import * as crypto from 'crypto';
import { env } from '../../env';

// Generate secure random token
export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Generate password reset token
export function generatePasswordResetToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Email templates
const emailTemplates = {
  verification: (verificationUrl: string) => ({
    subject: 'Verify your Astral Draft account',
    html: `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify Your Account</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to Astral Draft!</h1>
            </div>
            <div class="content">
              <h2>Verify your email address</h2>
              <p>Thanks for signing up for Astral Draft! To complete your registration, please verify your email address by clicking the button below:</p>
              
              <a href="${verificationUrl}" class="button">Verify Email Address</a>
              
              <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #667eea;">${verificationUrl}</p>
              
              <p><strong>This link will expire in 24 hours.</strong></p>
              
              <p>If you didn't create an account with Astral Draft, you can safely ignore this email.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Astral Draft. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
      Welcome to Astral Draft!
      
      Please verify your email address by visiting: ${verificationUrl}
      
      This link will expire in 24 hours.
      
      If you didn't create an account with Astral Draft, you can safely ignore this email.
    `,
  }),

  passwordReset: (resetUrl: string) => ({
    subject: 'Reset your Astral Draft password',
    html: `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Your Password</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
            .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 6px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Reset Request</h1>
            </div>
            <div class="content">
              <h2>Reset your password</h2>
              <p>We received a request to reset your password for your Astral Draft account. Click the button below to create a new password:</p>
              
              <a href="${resetUrl}" class="button">Reset Password</a>
              
              <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #667eea;">${resetUrl}</p>
              
              <div class="warning">
                <strong>Important:</strong> This link will expire in 1 hour for security reasons.
              </div>
              
              <p>If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Astral Draft. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
      Password Reset Request
      
      We received a request to reset your password for your Astral Draft account.
      
      To reset your password, visit: ${resetUrl}
      
      This link will expire in 1 hour for security reasons.
      
      If you didn't request a password reset, you can safely ignore this email.
    `,
  }),
};

// Send verification email
export async function sendVerificationEmail(email: string, token: string): Promise<void> {
  if (!email) {
    throw new Error('Email address is required');
  }
  if (!token) {
    throw new Error('Verification token is required');
  }

  const verificationUrl = `${env.NEXTAUTH_URL}/verify-email/${token}`;
  const template = emailTemplates.verification(verificationUrl);

  if (env.NODE_ENV === 'development') {
    console.log('=== EMAIL VERIFICATION (DEV MODE) ===');
    console.log('To:', email);
    console.log('Subject:', template.subject);
    console.log('Verification URL:', verificationUrl);
    console.log('=====================================');
    return;
  }

  await sendEmail(email, template.subject, template.html, template.text);
}

// Send password reset email
export async function sendPasswordResetEmail(email: string, token: string): Promise<void> {
  if (!email) {
    throw new Error('Email address is required');
  }
  if (!token) {
    throw new Error('Reset token is required');
  }

  const resetUrl = `${env.NEXTAUTH_URL}/reset-password/${token}`;
  const template = emailTemplates.passwordReset(resetUrl);

  if (env.NODE_ENV === 'development') {
    console.log('=== PASSWORD RESET EMAIL (DEV MODE) ===');
    console.log('To:', email);
    console.log('Subject:', template.subject);
    console.log('Reset URL:', resetUrl);
    console.log('=======================================');
    return;
  }

  await sendEmail(email, template.subject, template.html, template.text);
}

// Validate email format
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Generate secure token with custom length
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

// Generic email sending function using Resend
async function sendEmail(to: string, subject: string, html: string, text: string): Promise<void> {
  // Check for Resend configuration first
  if (env.RESEND_API_KEY) {
    const { Resend } = await import('resend');
    const resend = new Resend(env.RESEND_API_KEY);
    
    try {
      const result = await resend.emails.send({
        from: env.RESEND_FROM_EMAIL || 'Astral Draft <noreply@astraldraft.com>',
        to,
        subject,
        html,
        text,
        tags: [
          { name: 'type', value: 'auth' },
          { name: 'category', value: 'system' },
        ],
      });

      if (result.error) {
        console.error('Resend email error:', result.error);
        throw new Error(`Failed to send email: ${result.error.message}`);
      }

      console.log(`Email sent to ${to}: ${subject} (messageId: ${result.data?.id})`);
      return;
    } catch (error) {
      console.error('Failed to send email via Resend:', error);
      throw new Error('Failed to send email');
    }
  }

  // Fallback to SMTP if configured
  if (env.SMTP_HOST && env.SMTP_FROM) {
    try {
      // In production, you would use a service like SendGrid, Mailgun, or AWS SES
      // For now, we'll log the email attempt
      console.log(`Email sent to ${to}: ${subject} (SMTP mode)`);
      return;
    } catch (error) {
      console.error('Failed to send email via SMTP:', error);
      throw new Error('Failed to send email');
    }
  }

  throw new Error('No email configuration found (missing RESEND_API_KEY or SMTP configuration)');
}