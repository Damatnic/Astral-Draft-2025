import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '../../../../server/db';
import { verifyEmailSchema } from '../../../../lib/validation/auth';
import { rateLimit } from '../../../../lib/rate-limit';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimit({
      key: `verify_email_${request.ip}`,
      limit: 10, // 10 attempts per hour
      window: 3600,
    });

    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Too many verification attempts. Please try again later.',
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    
    // Validate input
    const validatedData = verifyEmailSchema.parse(body);
    const { token } = validatedData;

    // Find user with verification token
    const user = await prisma.user.findFirst({
      where: {
        emailVerificationToken: token,
      },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        status: true,
        emailVerificationExpires: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid verification token.',
        },
        { status: 400 }
      );
    }

    // Check if token has expired
    if (!user.emailVerificationExpires || user.emailVerificationExpires < new Date()) {
      return NextResponse.json(
        {
          success: false,
          message: 'Verification token has expired. Please request a new verification email.',
        },
        { status: 400 }
      );
    }

    // Check if account is already verified
    if (user.status === 'ACTIVE') {
      return NextResponse.json(
        {
          success: true,
          message: 'Email is already verified.',
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
            name: user.name,
            status: user.status,
          },
        }
      );
    }

    // Update user to verified status and clear verification token
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        status: 'ACTIVE',
        emailVerified: new Date(),
        emailVerificationToken: null,
        emailVerificationExpires: null,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        status: true,
        emailVerified: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully! Your account is now active.',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        username: updatedUser.username,
        name: updatedUser.name,
        status: updatedUser.status,
        emailVerified: updatedUser.emailVerified,
      },
    });

  } catch (error) {
    console.error('Email verification error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid verification token format.',
          errors: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: 'An error occurred during email verification.',
      },
      { status: 500 }
    );
  }
}