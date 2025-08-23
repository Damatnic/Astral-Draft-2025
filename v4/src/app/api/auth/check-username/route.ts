import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '../../../../server/db';
import { usernameSchema } from '../../../../lib/validation/auth';
import { rateLimit } from '../../../../lib/rate-limit';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimit({
      key: `check_username_${request.ip}`,
      limit: 30, // 30 checks per hour
      window: 3600,
    });

    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Too many username checks. Please try again later.',
        },
        { status: 429 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const username = searchParams.get('username');

    if (!username) {
      return NextResponse.json({ 
        success: false, 
        available: false,
        message: 'Username is required' 
      }, { status: 400 });
    }

    // Validate username format
    try {
      usernameSchema.parse(username);
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        return NextResponse.json({
          success: false,
          available: false,
          message: validationError.errors[0]?.message || 'Invalid username format',
          username: username.toLowerCase(),
        }, { status: 400 });
      }
    }

    // Check if username is already taken
    const existingUser = await prisma.user.findUnique({
      where: { username: username.toLowerCase() },
      select: { id: true },
    });

    const isAvailable = !existingUser;

    return NextResponse.json({
      success: true,
      available: isAvailable,
      message: isAvailable 
        ? 'Username is available' 
        : 'Username is already taken',
      username: username.toLowerCase(),
    });

  } catch (error) {
    console.error('Username check error:', error);
    return NextResponse.json({ 
      success: false, 
      available: false,
      message: 'Internal server error' 
    }, { status: 500 });
  }
}