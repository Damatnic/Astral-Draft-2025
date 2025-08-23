/**
 * Forgot password API route
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '../../../../server/db';
import { forgotPasswordSchema } from '../../../../lib/validation/auth';
import { generatePasswordResetToken, sendPasswordResetEmail } from '../../../../lib/auth/email';
import { rateLimit } from '../../../../lib/rate-limit';

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimit({
      key: `forgot_password_${req.ip}`,
      limit: 3, // 3 attempts per hour
      window: 3600,
    });

    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Too many password reset attempts. Please try again later.',
        },
        { status: 429 }
      );
    }

    const body = await req.json();
    
    // Validate input
    const validatedData = forgotPasswordSchema.parse(body);
    const { email } = validatedData;

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        email: true,
        status: true,
        passwordResetToken: true,
        passwordResetExpires: true,
      },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.',
      });
    }

    // Check if account is active
    if (user.status !== 'ACTIVE') {
      return NextResponse.json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.',
      });
    }

    // Check if we can send reset email (prevent spam)
    const now = new Date();
    const canResetAfter = new Date(now.getTime() - 5 * 60 * 1000); // 5 minutes ago
    
    if (user.passwordResetExpires && user.passwordResetExpires > canResetAfter) {
      return NextResponse.json(
        {
          success: false,
          message: 'Please wait a few minutes before requesting another password reset.',
        },
        { status: 429 }
      );
    }

    // Generate password reset token
    const resetToken = generatePasswordResetToken();

    // Update user with reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: resetToken,
        passwordResetExpires: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      },
    });

    // Send password reset email
    if (!user.email) {
      // This should never happen since we found user by email, but for type safety
      console.error('User found without email address:', user.id);
      return NextResponse.json(
        {
          success: false,
          message: 'An error occurred while processing your request.',
        },
        { status: 500 }
      );
    }
    
    try {
      await sendPasswordResetEmail(user.email, resetToken);
    } catch (emailError) {
      // Clear the reset token if email fails
      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordResetToken: null,
          passwordResetExpires: null,
        },
      });

      console.error('Failed to send password reset email:', emailError);
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to send password reset email. Please try again.',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.',
    });

  } catch (error) {
    console.error('Forgot password error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid email address.',
          errors: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: 'An error occurred while processing your request.',
      },
      { status: 500 }
    );
  }
}