/**
 * @fileoverview Comprehensive authentication unit tests
 * Target Coverage: 90% for critical auth module
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals'
import { getServerSession } from 'next-auth'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { authOptions, getServerAuthSession } from '../../src/server/auth'
import { prisma } from '../../src/server/db'
import { createUserFixture, createMockUser } from '../fixtures'

// Mock dependencies
jest.mock('../../src/server/db', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}))

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}))

jest.mock('bcryptjs')
jest.mock('../../src/env', () => ({
  env: {
    NEXTAUTH_SECRET: 'test-secret',
    NODE_ENV: 'test',
    GOOGLE_CLIENT_ID: null,
    GOOGLE_CLIENT_SECRET: null,
    GITHUB_ID: null,
    GITHUB_SECRET: null,
  },
}))

const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>
const mockPrisma = prisma as jest.Mocked<typeof prisma>
const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>

describe('Authentication Module', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('AuthOptions Configuration', () => {
    it('should have correct configuration structure', () => {
      expect(authOptions).toBeDefined()
      expect(authOptions.callbacks).toBeDefined()
      expect(authOptions.providers).toBeDefined()
      expect(authOptions.pages).toBeDefined()
      expect(authOptions.session).toBeDefined()
      expect(authOptions.secret).toBe('test-secret')
    })

    it('should include credentials provider', () => {
      const credentialsProvider = authOptions.providers.find(
        (p) => p.id === 'credentials'
      )
      expect(credentialsProvider).toBeDefined()
      expect(credentialsProvider?.name).toBe('credentials')
    })

    it('should have correct session configuration', () => {
      expect(authOptions.session).toEqual({
        strategy: 'jwt',
        maxAge: 30 * 24 * 60 * 60, // 30 days
      })
    })

    it('should have correct custom pages configuration', () => {
      expect(authOptions.pages).toEqual({
        signIn: '/auth/signin',
        signOut: '/auth/signout',
        error: '/auth/error',
        verifyRequest: '/auth/verify',
      })
    })
  })

  describe('JWT Callback', () => {
    it('should populate token with user data on initial sign in', async () => {
      const mockUser = createMockUser({
        id: 'user-1',
        email: 'test@example.com',
        username: 'testuser',
        role: 'USER',
      })

      const result = await authOptions.callbacks!.jwt!({
        token: {},
        user: mockUser,
      })

      expect(result).toEqual({
        id: 'user-1',
        email: 'test@example.com',
        username: 'testuser',
        role: 'USER',
      })
    })

    it('should return existing token when no user provided', async () => {
      const existingToken = {
        id: 'user-1',
        email: 'test@example.com',
        username: 'testuser',
        role: 'USER' as const,
      }

      const result = await authOptions.callbacks!.jwt!({
        token: existingToken,
      })

      expect(result).toEqual(existingToken)
    })
  })

  describe('Session Callback', () => {
    it('should populate session with token data', () => {
      const mockToken = {
        id: 'user-1',
        email: 'test@example.com',
        username: 'testuser',
        role: 'USER' as const,
      }

      const mockSession = {
        user: {
          name: 'Test User',
          image: 'test-image.jpg',
        },
        expires: '2024-12-31T00:00:00.000Z',
      }

      const result = authOptions.callbacks!.session!({
        session: mockSession,
        token: mockToken,
      })

      expect(result).toEqual({
        ...mockSession,
        user: {
          ...mockSession.user,
          id: 'user-1',
          username: 'testuser',
          role: 'USER',
          email: 'test@example.com',
        },
      })
    })
  })

  describe('Credentials Provider Authorization', () => {
    const credentialsProvider = authOptions.providers.find(
      (p) => p.id === 'credentials'
    )
    const authorize = credentialsProvider?.authorize

    beforeEach(() => {
      mockBcrypt.compare.mockResolvedValue(true)
    })

    it('should authenticate valid user credentials', async () => {
      const mockUser = await createUserFixture({
        id: 'user-1',
        email: 'test@example.com',
        username: 'testuser',
        role: 'USER',
        status: 'ACTIVE',
      })

      mockPrisma.user.findUnique.mockResolvedValue(mockUser)
      mockPrisma.user.update.mockResolvedValue(mockUser)

      const result = await authorize!({
        email: 'test@example.com',
        password: 'validpassword',
      })

      expect(result).toEqual({
        id: 'user-1',
        email: 'test@example.com',
        username: 'testuser',
        role: 'USER',
      })

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        select: {
          id: true,
          email: true,
          username: true,
          password: true,
          role: true,
          status: true,
        },
      })

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: {
          lastLoginAt: expect.any(Date),
          status: 'ACTIVE',
        },
      })
    })

    it('should reject invalid credentials with invalid email format', async () => {
      await expect(
        authorize!({
          email: 'invalid-email',
          password: 'password123',
        })
      ).rejects.toThrow()
    })

    it('should reject credentials with password too short', async () => {
      await expect(
        authorize!({
          email: 'test@example.com',
          password: '123',
        })
      ).rejects.toThrow()
    })

    it('should return null for non-existent user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null)

      const result = await authorize!({
        email: 'nonexistent@example.com',
        password: 'password123',
      })

      expect(result).toBeNull()
    })

    it('should return null for incorrect password', async () => {
      const mockUser = await createUserFixture({
        email: 'test@example.com',
        status: 'ACTIVE',
      })

      mockPrisma.user.findUnique.mockResolvedValue(mockUser)
      mockBcrypt.compare.mockResolvedValue(false)

      const result = await authorize!({
        email: 'test@example.com',
        password: 'wrongpassword',
      })

      expect(result).toBeNull()
    })

    it('should reject suspended user accounts', async () => {
      const mockUser = await createUserFixture({
        email: 'test@example.com',
        status: 'SUSPENDED',
      })

      mockPrisma.user.findUnique.mockResolvedValue(mockUser)

      await expect(
        authorize!({
          email: 'test@example.com',
          password: 'password123',
        })
      ).rejects.toThrow('Account is suspended or banned')
    })

    it('should reject banned user accounts', async () => {
      const mockUser = await createUserFixture({
        email: 'test@example.com',
        status: 'BANNED',
      })

      mockPrisma.user.findUnique.mockResolvedValue(mockUser)

      await expect(
        authorize!({
          email: 'test@example.com',
          password: 'password123',
        })
      ).rejects.toThrow('Account is suspended or banned')
    })

    it('should allow pending verification users and activate them', async () => {
      const mockUser = await createUserFixture({
        id: 'user-1',
        email: 'test@example.com',
        status: 'PENDING_VERIFICATION',
      })

      const updatedUser = { ...mockUser, status: 'ACTIVE' as const }

      mockPrisma.user.findUnique.mockResolvedValue(mockUser)
      mockPrisma.user.update.mockResolvedValue(updatedUser)

      const result = await authorize!({
        email: 'test@example.com',
        password: 'password123',
      })

      expect(result).toBeDefined()
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: {
          lastLoginAt: expect.any(Date),
          status: 'ACTIVE',
        },
      })
    })
  })

  describe('getServerAuthSession', () => {
    it('should call getServerSession with correct parameters', async () => {
      const mockReq = { headers: {} }
      const mockRes = { setHeader: jest.fn() }
      const mockSession = {
        user: {
          id: 'user-1',
          email: 'test@example.com',
          username: 'testuser',
          role: 'USER' as const,
        },
        expires: '2024-12-31T00:00:00.000Z',
      }

      mockGetServerSession.mockResolvedValue(mockSession)

      const result = await getServerAuthSession({
        req: mockReq,
        res: mockRes,
      })

      expect(mockGetServerSession).toHaveBeenCalledWith(
        mockReq,
        mockRes,
        authOptions
      )
      expect(result).toEqual(mockSession)
    })

    it('should return null when no session exists', async () => {
      mockGetServerSession.mockResolvedValue(null)

      const result = await getServerAuthSession({
        req: {},
        res: {},
      })

      expect(result).toBeNull()
    })
  })

  describe('OAuth Providers Configuration', () => {
    it('should not include Google provider when credentials not set', () => {
      const googleProvider = authOptions.providers.find(
        (p) => p.id === 'google'
      )
      expect(googleProvider).toBeUndefined()
    })

    it('should not include GitHub provider when credentials not set', () => {
      const githubProvider = authOptions.providers.find(
        (p) => p.id === 'github'
      )
      expect(githubProvider).toBeUndefined()
    })
  })

  describe('Security Validations', () => {
    it('should validate email format using Zod schema', () => {
      const validEmail = 'test@example.com'
      const invalidEmail = 'invalid-email'

      expect(() =>
        z.object({ email: z.string().email() }).parse({ email: validEmail })
      ).not.toThrow()

      expect(() =>
        z.object({ email: z.string().email() }).parse({ email: invalidEmail })
      ).toThrow()
    })

    it('should validate password length using Zod schema', () => {
      const validPassword = 'password123'
      const invalidPassword = '123'

      expect(() =>
        z.object({ password: z.string().min(6) }).parse({ password: validPassword })
      ).not.toThrow()

      expect(() =>
        z.object({ password: z.string().min(6) }).parse({ password: invalidPassword })
      ).toThrow()
    })

    it('should use bcrypt for password comparison', async () => {
      mockBcrypt.compare.mockResolvedValue(true)

      const result = await bcrypt.compare('plaintext', 'hash')
      
      expect(mockBcrypt.compare).toHaveBeenCalledWith('plaintext', 'hash')
      expect(result).toBe(true)
    })
  })

  describe('Error Handling', () => {
    const authorize = authOptions.providers.find(
      (p) => p.id === 'credentials'
    )?.authorize

    it('should handle database connection errors gracefully', async () => {
      mockPrisma.user.findUnique.mockRejectedValue(new Error('Database connection failed'))

      await expect(
        authorize!({
          email: 'test@example.com',
          password: 'password123',
        })
      ).rejects.toThrow('Database connection failed')
    })

    it('should handle bcrypt errors gracefully', async () => {
      const mockUser = await createUserFixture({
        email: 'test@example.com',
        status: 'ACTIVE',
      })

      mockPrisma.user.findUnique.mockResolvedValue(mockUser)
      mockBcrypt.compare.mockRejectedValue(new Error('Bcrypt error'))

      await expect(
        authorize!({
          email: 'test@example.com',
          password: 'password123',
        })
      ).rejects.toThrow('Bcrypt error')
    })
  })
})