/**
 * Registration API route
 */

import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../../../../server/db';
import { registerSchema } from '../../../../lib/validation/auth';
import { generateVerificationToken, sendVerificationEmail } from '../../../../lib/auth/email';
import { rateLimit } from '../../../../lib/rate-limit';

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimit({
      key: `register_${req.ip}`,
      limit: 3, // 3 attempts per hour
      window: 3600, // 1 hour
    });

    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Too many registration attempts. Please try again later.',
        },
        { status: 429 }
      );
    }

    const body = await req.json();
    
    // Validate input
    const validatedData = registerSchema.parse(body);
    const { email, username, password } = validatedData;

    // Check if user already exists (email or username)
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email.toLowerCase() },
          { username: username.toLowerCase() }
        ]
      },
    });

    if (existingUser) {
      if (existingUser.email === email.toLowerCase()) {
        return NextResponse.json(
          {
            success: false,
            message: 'An account with this email already exists.',
          },
          { status: 400 }
        );
      }
      if (existingUser.username === username.toLowerCase()) {
        return NextResponse.json(
          {
            success: false,
            message: 'This username is already taken.',
          },
          { status: 400 }
        );
      }
    }

    // Hash password
    const hashedPassword = await hash(password, 12);

    // Generate verification token
    const verificationToken = generateVerificationToken();

    // Create user with verification token
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        username: username.toLowerCase(),
        name: username,
        password: hashedPassword,
        status: 'PENDING',
        role: 'USER',
        emailVerificationToken: verificationToken,
        emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        status: true,
      },
    });

    // Send verification email
    if (!user.email) {
      return NextResponse.json(
        { error: 'User does not have an email address' },
        { status: 400 }
      );
    }
    
    try {
      await sendVerificationEmail(user.email, verificationToken);
    } catch (emailError) {
      // If email fails, delete the user to allow retry
      await prisma.user.delete({ where: { id: user.id } });
      
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
      message: 'Account created successfully. Please check your email to verify your account.',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
        status: user.status,
      },
    });

  } catch (error) {
    console.error('Registration error:', error);

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
        message: 'An error occurred during registration. Please try again.',
      },
      { status: 500 }
    );
  }
}