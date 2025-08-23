/**
 * Validate password reset token API route
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '../../../../server/db';
import { rateLimit } from '../../../../lib/rate-limit';

const validateTokenSchema = z.object({
  token: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimit({
      key: `validate_reset_token_${req.ip}`,
      limit: 10, // 10 attempts per hour
      window: 3600,
    });

    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Too many validation attempts. Please try again later.',
        },
        { status: 429 }
      );
    }

    const body = await req.json();
    
    // Validate input
    const validatedData = validateTokenSchema.parse(body);
    const { token } = validatedData;

    // Find user with reset token
    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: token,
      },
      select: {
        id: true,
        email: true,
        passwordResetExpires: true,
        status: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          valid: false,
          message: 'Invalid reset token.',
        },
        { status: 400 }
      );
    }

    // Check if token has expired
    if (!user.passwordResetExpires || user.passwordResetExpires < new Date()) {
      return NextResponse.json(
        {
          success: false,
          valid: false,
          message: 'Reset token has expired.',
        },
        { status: 400 }
      );
    }

    // Check if account is active
    if (user.status !== 'ACTIVE') {
      return NextResponse.json(
        {
          success: false,
          valid: false,
          message: 'Account is not active.',
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      valid: true,
      message: 'Reset token is valid.',
    });

  } catch (error) {
    console.error('Token validation error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          valid: false,
          message: 'Invalid token format.',
          errors: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        valid: false,
        message: 'An error occurred while validating the token.',
      },
      { status: 500 }
    );
  }
}