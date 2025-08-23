import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '../../../../server/db';
import { forgotPasswordSchema } from '../../../../lib/validation/auth';
import { generateVerificationToken, sendVerificationEmail } from '../../../../lib/auth/email';
import { rateLimit } from '../../../../lib/rate-limit';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimit({
      key: `resend_verification_${request.ip}`,
      limit: 3, // 3 attempts per hour
      window: 3600,
    });

    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Too many verification email requests. Please try again later.',
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    
    // Validate input using the existing email schema
    const validatedData = forgotPasswordSchema.parse(body);
    const { email } = validatedData;

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        status: true,
        emailVerificationExpires: true,
      },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({
        success: true,
        message: 'If an account with that email exists and requires verification, a new verification email has been sent.',
      });
    }

    // Check if account is already active
    if (user.status === 'ACTIVE') {
      return NextResponse.json({
        success: true,
        message: 'Your account is already verified.',
      });
    }

    // Check if we can resend verification email (prevent spam)
    const now = new Date();
    const canResendAfter = new Date(now.getTime() - 5 * 60 * 1000); // 5 minutes ago
    
    if (user.emailVerificationExpires && user.emailVerificationExpires > canResendAfter) {
      return NextResponse.json(
        {
          success: false,
          message: 'Please wait a few minutes before requesting another verification email.',
        },
        { status: 429 }
      );
    }

    // Generate new verification token
    const verificationToken = generateVerificationToken();

    // Update user with new verification token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationToken: verificationToken,
        emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        updatedAt: new Date(),
      },
    });

    // Send verification email
    if (!user.email) {
      return NextResponse.json(
        {
          success: false,
          message: 'User does not have a valid email address.',
        },
        { status: 400 }
      );
    }
    
    try {
      await sendVerificationEmail(user.email, verificationToken);
    } catch (emailError) {
      // Clear the verification token if email fails
      await prisma.user.update({
        where: { id: user.id },
        data: {
          emailVerificationToken: null,
          emailVerificationExpires: null,
        },
      });

      console.error('Failed to send verification email:', emailError);
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to send verification email. Please try again.',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'If an account with that email exists and requires verification, a new verification email has been sent.',
    });

  } catch (error) {
    console.error('Resend verification error:', error);

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