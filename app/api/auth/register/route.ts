import { logger } from '@/lib/logger';
// app/api/auth/register/route.ts

import { prisma } from '@/lib/prisma';
import { registerSchema } from '@/lib/validations/auth.schema';
import bcrypt from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/auth/register
 * Register a new user account
 * 
 * Required body:
 * - username: string (3-20 chars, alphanumeric + underscore)
 * - email: string (valid email format)
 * - password: string (8+ chars, uppercase, lowercase, number, special char)
 * - contactNumber?: string (optional)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const result = registerSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          errors: result.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { username, email, password, contactNumber } = result.data;

    // Check if username already exists
    const existingUsername = await prisma.user.findFirst({
      where: { username: username.toLowerCase() },
    });

    if (existingUsername) {
      return NextResponse.json(
        { success: false, error: 'Username already taken' },
        { status: 409 }
      );
    }

    // Check if email already exists
    const existingEmail = await prisma.user.findFirst({
      where: { email: email.toLowerCase() },
    });

    if (existingEmail) {
      return NextResponse.json(
        { success: false, error: 'Email already registered' },
        { status: 409 }
      );
    }

    // Hash password with bcrypt (10 salt rounds)
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        username: username.toLowerCase(),
        email: email.toLowerCase(),
        password: hashedPassword, // Store hashed password
        contactNumber: contactNumber || null,
        isActive: true,
      },
      select: {
        id: true,
        username: true,
        email: true,
        contactNumber: true,
        isActive: true,
        createdAt: true,
      },
    });

    // Assign default CUSTOMER role to new user
    const customerRole = await prisma.role.findFirst({
      where: { name: 'CUSTOMER' },
    });

    if (customerRole) {
      await prisma.userRole.create({
        data: {
          userId: user.id,
          roleId: customerRole.id,
        },
      });
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Account created successfully. Please log in.',
        data: user,
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error('Registration error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
