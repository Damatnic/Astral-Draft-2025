/**
 * JWT utilities for Astral Draft v4
 */

import jwt from 'jsonwebtoken';
import type { Secret, SignOptions } from 'jsonwebtoken';

const JWT_SECRET: Secret = process.env.NEXTAUTH_SECRET || 'development-secret-change-in-production';

export interface JWTPayload {
  id: string;
  email: string;
  username: string;
  role: string;
  iat?: number;
  exp?: number;
}

/**
 * Sign a JWT token
 */
export function signJWT(payload: JWTPayload, expiresIn = '30d'): string {
  return jwt.sign(payload as object, JWT_SECRET, { expiresIn } as SignOptions);
}

/**
 * Verify a JWT token
 */
export async function verifyJWT(token: string): Promise<JWTPayload | null> {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    console.error('JWT verification error:', error);
    return null;
  }
}

/**
 * Decode JWT without verification (for client-side)
 */
export function decodeJWT(token: string): JWTPayload | null {
  try {
    return jwt.decode(token) as JWTPayload;
  } catch (error) {
    return null;
  }
}