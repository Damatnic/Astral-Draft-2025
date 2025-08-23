/**
 * Reset password API route
 */

import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../../../../server/db';
import { resetPasswordSchema } from '../../../../lib/validation/auth';
import { rateLimit } from '../../../../lib/rate-limit';

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimit({
      key: `reset_password_${req.ip}`,
      limit: 5, // 5 attempts per hour
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
    const validatedData = resetPasswordSchema.parse(body);
    const { token, password } = validatedData;

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
        password: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid or expired reset token.',
        },
        { status: 400 }
      );
    }

    // Check if token has expired
    if (!user.passwordResetExpires || user.passwordResetExpires < new Date()) {
      return NextResponse.json(
        {
          success: false,
          message: 'Reset token has expired. Please request a new password reset.',
        },
        { status: 400 }
      );
    }

    // Check if account is active
    if (user.status !== 'ACTIVE') {
      return NextResponse.json(
        {
          success: false,
          message: 'Account is not active.',
        },
        { status: 400 }
      );
    }

    // Hash new password
    const hashedPassword = await hash(password, 12);

    // Check if new password is different from current password
    if (user.password) {
      const bcrypt = require('bcryptjs');
      const isSamePassword = await bcrypt.compare(password, user.password);
      
      if (isSamePassword) {
        return NextResponse.json(
          {
            success: false,
            message: 'New password must be different from your current password.',
          },
          { status: 400 }
        );
      }
    }

    // Update user password and clear reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
        // Update password changed timestamp
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully.',
    });

  } catch (error) {
    console.error('Reset password error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid input data.',
          errors: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: 'An error occurred while resetting your password.',
      },
      { status: 500 }
    );
  }
}