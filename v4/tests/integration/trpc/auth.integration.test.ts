/**
 * Auth Router Integration Tests
 * Tests for authentication-related tRPC procedures
 */

import { createTRPCMsw } from 'msw-trpc'
import { setupServer } from 'msw/node'
import { prisma } from '../../../src/server/db'
import { appRouter } from '../../../src/server/api/root'
import { createTRPCClient, httpBatchLink } from '@trpc/client'
import type { AppRouter } from '../../../src/server/api/root'
import { userFactory, leagueFactory } from '../../../src/test/factories'
import superjson from 'superjson'

// Test client setup
const createTestContext = (userId?: string) => ({
  session: userId ? {
    user: { id: userId },
    expires: new Date(Date.now() + 86400000).toISOString(),
  } : null,
  prisma,
})

const createTestClient = (userId?: string) => {
  const ctx = createTestContext(userId)
  return appRouter.createCaller(ctx)
}

describe('Auth Router Integration Tests', () => {
  beforeEach(async () => {
    // Clear database before each test
    await prisma.user.deleteMany()
    await prisma.league.deleteMany()
    await prisma.team.deleteMany()
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  describe('User Management', () => {
    describe('getProfile', () => {
      it('should return user profile for authenticated user', async () => {
        // Create test user
        const testUser = userFactory.build()
        const createdUser = await prisma.user.create({
          data: testUser,
        })

        const client = createTestClient(createdUser.id)
        const result = await client.user.getProfile()

        expect(result).toMatchObject({
          id: createdUser.id,
          email: testUser.email,
          username: testUser.username,
          firstName: testUser.firstName,
          lastName: testUser.lastName,
        })
        expect(result.password).toBeUndefined() // Password should not be returned
      })

      it('should throw error for unauthenticated user', async () => {
        const client = createTestClient() // No user ID

        await expect(client.user.getProfile()).rejects.toThrow('UNAUTHORIZED')
      })
    })

    describe('updateProfile', () => {
      it('should update user profile successfully', async () => {
        const testUser = userFactory.build()
        const createdUser = await prisma.user.create({
          data: testUser,
        })

        const client = createTestClient(createdUser.id)
        const updateData = {
          firstName: 'Updated',
          lastName: 'Name',
          bio: 'Updated bio',
        }

        const result = await client.user.updateProfile(updateData)

        expect(result).toMatchObject({
          id: createdUser.id,
          firstName: 'Updated',
          lastName: 'Name',
          bio: 'Updated bio',
        })

        // Verify in database
        const updatedUser = await prisma.user.findUnique({
          where: { id: createdUser.id },
        })
        expect(updatedUser?.firstName).toBe('Updated')
        expect(updatedUser?.lastName).toBe('Name')
      })

      it('should validate input data', async () => {
        const testUser = userFactory.build()
        const createdUser = await prisma.user.create({
          data: testUser,
        })

        const client = createTestClient(createdUser.id)

        // Test empty firstName
        await expect(
          client.user.updateProfile({ firstName: '' })
        ).rejects.toThrow()

        // Test invalid email
        await expect(
          client.user.updateProfile({ email: 'invalid-email' })
        ).rejects.toThrow()
      })
    })

    describe('checkUsername', () => {
      it('should return availability for non-existing username', async () => {
        const client = createTestClient()
        const result = await client.user.checkUsername({ username: 'newuser' })

        expect(result).toEqual({ available: true })
      })

      it('should return unavailable for existing username', async () => {
        const testUser = userFactory.build({ username: 'existinguser' })
        await prisma.user.create({ data: testUser })

        const client = createTestClient()
        const result = await client.user.checkUsername({ username: 'existinguser' })

        expect(result).toEqual({ available: false })
      })

      it('should be case insensitive', async () => {
        const testUser = userFactory.build({ username: 'testuser' })
        await prisma.user.create({ data: testUser })

        const client = createTestClient()
        const result = await client.user.checkUsername({ username: 'TestUser' })

        expect(result).toEqual({ available: false })
      })
    })
  })

  describe('User Statistics', () => {
    describe('getStats', () => {
      it('should return user statistics', async () => {
        const testUser = userFactory.build()
        const createdUser = await prisma.user.create({
          data: testUser,
        })

        // Create test leagues and teams
        const league1 = leagueFactory.build({ season: 2024 })
        const league2 = leagueFactory.build({ season: 2023 })
        
        const createdLeague1 = await prisma.league.create({ data: league1 })
        const createdLeague2 = await prisma.league.create({ data: league2 })

        // Create teams for the user
        await prisma.team.createMany({
          data: [
            {
              id: 'team1',
              leagueId: createdLeague1.id,
              ownerId: createdUser.id,
              name: 'Team 1',
              wins: 10,
              losses: 3,
              ties: 1,
              pointsFor: 1500.5,
              pointsAgainst: 1200.3,
            },
            {
              id: 'team2',
              leagueId: createdLeague2.id,
              ownerId: createdUser.id,
              name: 'Team 2',
              wins: 8,
              losses: 6,
              ties: 0,
              pointsFor: 1350.2,
              pointsAgainst: 1380.7,
            },
          ],
        })

        const client = createTestClient(createdUser.id)
        const result = await client.user.getStats()

        expect(result).toMatchObject({
          totalLeagues: 2,
          totalWins: 18,
          totalLosses: 9,
          totalTies: 1,
          winPercentage: expect.any(Number),
          totalPointsFor: expect.any(Number),
          totalPointsAgainst: expect.any(Number),
        })

        expect(result.winPercentage).toBeCloseTo(64.29, 1) // (18 + 0.5) / 28
      })

      it('should return zero stats for user with no teams', async () => {
        const testUser = userFactory.build()
        const createdUser = await prisma.user.create({
          data: testUser,
        })

        const client = createTestClient(createdUser.id)
        const result = await client.user.getStats()

        expect(result).toMatchObject({
          totalLeagues: 0,
          totalWins: 0,
          totalLosses: 0,
          totalTies: 0,
          winPercentage: 0,
          totalPointsFor: 0,
          totalPointsAgainst: 0,
        })
      })
    })
  })

  describe('User Preferences', () => {
    describe('updatePreferences', () => {
      it('should update user preferences', async () => {
        const testUser = userFactory.build()
        const createdUser = await prisma.user.create({
          data: testUser,
        })

        const client = createTestClient(createdUser.id)
        const preferences = {
          theme: 'dark' as const,
          notifications: {
            email: true,
            push: false,
            sms: true,
          },
          privacy: {
            showEmail: false,
            showStats: true,
          },
        }

        const result = await client.user.updatePreferences({ preferences })

        expect(result.preferences).toMatchObject(preferences)

        // Verify in database
        const updatedUser = await prisma.user.findUnique({
          where: { id: createdUser.id },
        })
        expect(updatedUser?.preferences).toMatchObject(preferences)
      })
    })
  })

  describe('Password Management', () => {
    describe('changePassword', () => {
      it('should change password with valid current password', async () => {
        const bcrypt = await import('bcryptjs')
        const hashedPassword = await bcrypt.hash('currentpassword', 10)
        
        const testUser = userFactory.build({ 
          password: hashedPassword,
        })
        const createdUser = await prisma.user.create({
          data: testUser,
        })

        const client = createTestClient(createdUser.id)
        
        const result = await client.user.changePassword({
          currentPassword: 'currentpassword',
          newPassword: 'newpassword123',
        })

        expect(result.success).toBe(true)

        // Verify new password works
        const updatedUser = await prisma.user.findUnique({
          where: { id: createdUser.id },
        })
        const isValid = await bcrypt.compare('newpassword123', updatedUser!.password!)
        expect(isValid).toBe(true)
      })

      it('should reject invalid current password', async () => {
        const bcrypt = await import('bcryptjs')
        const hashedPassword = await bcrypt.hash('currentpassword', 10)
        
        const testUser = userFactory.build({ 
          password: hashedPassword,
        })
        const createdUser = await prisma.user.create({
          data: testUser,
        })

        const client = createTestClient(createdUser.id)
        
        await expect(
          client.user.changePassword({
            currentPassword: 'wrongpassword',
            newPassword: 'newpassword123',
          })
        ).rejects.toThrow('UNAUTHORIZED')
      })
    })
  })

  describe('Account Deletion', () => {
    describe('deleteAccount', () => {
      it('should soft delete user account', async () => {
        const testUser = userFactory.build()
        const createdUser = await prisma.user.create({
          data: testUser,
        })

        const client = createTestClient(createdUser.id)
        
        const result = await client.user.deleteAccount({
          confirmPassword: 'password123',
        })

        expect(result.success).toBe(true)

        // Verify user is soft deleted
        const deletedUser = await prisma.user.findUnique({
          where: { id: createdUser.id },
        })
        expect(deletedUser?.isActive).toBe(false)
        expect(deletedUser?.deletedAt).toBeDefined()
      })

      it('should anonymize user data on deletion', async () => {
        const testUser = userFactory.build()
        const createdUser = await prisma.user.create({
          data: testUser,
        })

        const client = createTestClient(createdUser.id)
        
        await client.user.deleteAccount({
          confirmPassword: 'password123',
          anonymize: true,
        })

        // Verify user data is anonymized
        const deletedUser = await prisma.user.findUnique({
          where: { id: createdUser.id },
        })
        expect(deletedUser?.email).toContain('deleted')
        expect(deletedUser?.firstName).toBe('Deleted')
        expect(deletedUser?.lastName).toBe('User')
      })
    })
  })

  describe('Admin Functions', () => {
    describe('ban and unban users', () => {
      it('should allow admin to ban user', async () => {
        // Create admin user
        const adminUser = userFactory.admin()
        const createdAdmin = await prisma.user.create({
          data: adminUser,
        })

        // Create target user
        const targetUser = userFactory.build()
        const createdTarget = await prisma.user.create({
          data: targetUser,
        })

        const adminClient = createTestClient(createdAdmin.id)
        
        const result = await adminClient.user.banUser({
          userId: createdTarget.id,
          reason: 'Test ban',
          duration: 7, // 7 days
        })

        expect(result.success).toBe(true)

        // Verify user is banned
        const bannedUser = await prisma.user.findUnique({
          where: { id: createdTarget.id },
        })
        expect(bannedUser?.isBanned).toBe(true)
        expect(bannedUser?.banExpires).toBeDefined()
      })

      it('should reject non-admin ban attempts', async () => {
        const normalUser = userFactory.build()
        const createdUser = await prisma.user.create({
          data: normalUser,
        })

        const targetUser = userFactory.build()
        const createdTarget = await prisma.user.create({
          data: targetUser,
        })

        const userClient = createTestClient(createdUser.id)
        
        await expect(
          userClient.user.banUser({
            userId: createdTarget.id,
            reason: 'Test ban',
            duration: 7,
          })
        ).rejects.toThrow('FORBIDDEN')
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle database connection errors', async () => {
      const testUser = userFactory.build()
      const createdUser = await prisma.user.create({
        data: testUser,
      })

      // Mock database error
      jest.spyOn(prisma.user, 'findUnique').mockRejectedValueOnce(
        new Error('Database connection error')
      )

      const client = createTestClient(createdUser.id)
      
      await expect(client.user.getProfile()).rejects.toThrow('INTERNAL_SERVER_ERROR')
    })

    it('should handle invalid user IDs', async () => {
      const client = createTestClient('invalid-user-id')
      
      await expect(client.user.getProfile()).rejects.toThrow('NOT_FOUND')
    })
  })

  describe('Rate Limiting', () => {
    it('should respect rate limits for sensitive operations', async () => {
      const testUser = userFactory.build()
      const createdUser = await prisma.user.create({
        data: testUser,
      })

      const client = createTestClient(createdUser.id)
      
      // Make multiple password change attempts
      const promises = Array.from({ length: 5 }, () =>
        client.user.changePassword({
          currentPassword: 'wrongpassword',
          newPassword: 'newpassword123',
        }).catch(err => err)
      )

      const results = await Promise.all(promises)
      
      // Should have rate limiting after too many attempts
      const rateLimitedErrors = results.filter(
        result => result.code === 'TOO_MANY_REQUESTS'
      )
      expect(rateLimitedErrors.length).toBeGreaterThan(0)
    })
  })
})