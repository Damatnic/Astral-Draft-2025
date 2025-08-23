/**
 * User Factory
 * Generates test data for user entities
 */

import { faker } from '@faker-js/faker'
import { BaseFactory, TestUtils } from './baseFactory'
import type { User } from '@prisma/client'

export type UserTestData = Omit<User, 'id' | 'createdAt' | 'updatedAt'> & {
  id?: string
  createdAt?: Date
  updatedAt?: Date
}

export class UserFactory extends BaseFactory<UserTestData> {
  protected generateDefaults(): Partial<UserTestData> {
    const firstName = faker.person.firstName()
    const lastName = faker.person.lastName()
    
    return {
      id: TestUtils.randomId(),
      email: faker.internet.email({ firstName, lastName }).toLowerCase(),
      emailVerified: TestUtils.randomBoolean() ? faker.date.past() : null,
      username: faker.internet.userName({ firstName, lastName }).toLowerCase(),
      firstName,
      lastName,
      avatar: faker.image.avatar(),
      bio: faker.lorem.sentence(),
      isAdmin: false,
      isActive: true,
      lastLoginAt: faker.date.recent(),
      timezone: faker.location.timeZone(),
      preferences: {
        theme: TestUtils.randomArrayElement(['light', 'dark', 'system']),
        notifications: {
          email: TestUtils.randomBoolean(),
          push: TestUtils.randomBoolean(),
          sms: TestUtils.randomBoolean(),
        },
        privacy: {
          showEmail: TestUtils.randomBoolean(),
          showStats: TestUtils.randomBoolean(),
        },
      },
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent(),
    }
  }

  protected generateSequenceAttributes(sequence: number): Partial<UserTestData> {
    return {
      email: `user${sequence}@test.com`,
      username: `user${sequence}`,
      firstName: `User${sequence}`,
      lastName: `Test${sequence}`,
    }
  }

  /**
   * Create an admin user
   */
  admin(overrides: Partial<UserTestData> = {}): UserTestData {
    return this.build({
      isAdmin: true,
      username: 'admin',
      email: 'admin@astraldraft.com',
      firstName: 'Admin',
      lastName: 'User',
      emailVerified: new Date(),
      ...overrides,
    })
  }

  /**
   * Create a verified user
   */
  verified(overrides: Partial<UserTestData> = {}): UserTestData {
    return this.build({
      emailVerified: faker.date.past(),
      ...overrides,
    })
  }

  /**
   * Create an unverified user
   */
  unverified(overrides: Partial<UserTestData> = {}): UserTestData {
    return this.build({
      emailVerified: null,
      ...overrides,
    })
  }

  /**
   * Create an inactive user
   */
  inactive(overrides: Partial<UserTestData> = {}): UserTestData {
    return this.build({
      isActive: false,
      lastLoginAt: faker.date.past({ years: 1 }),
      ...overrides,
    })
  }

  /**
   * Create a premium user
   */
  premium(overrides: Partial<UserTestData> = {}): UserTestData {
    return this.build({
      isPremium: true,
      premiumExpiresAt: faker.date.future(),
      emailVerified: faker.date.past(),
      ...overrides,
    })
  }

  /**
   * Create a user with specific preferences
   */
  withPreferences(preferences: Record<string, any>, overrides: Partial<UserTestData> = {}): UserTestData {
    return this.build({
      preferences: {
        ...this.generateDefaults().preferences,
        ...preferences,
      },
      ...overrides,
    })
  }

  /**
   * Create a league commissioner user
   */
  commissioner(overrides: Partial<UserTestData> = {}): UserTestData {
    return this.build({
      emailVerified: faker.date.past(),
      preferences: {
        ...this.generateDefaults().preferences,
        notifications: {
          email: true,
          push: true,
          sms: false,
        },
      },
      ...overrides,
    })
  }
}

// Export singleton instance
export const userFactory = new UserFactory()

/**
 * User-related test utilities
 */
export class UserTestUtils {
  /**
   * Generate a valid password hash for testing
   */
  static async generatePasswordHash(password: string = 'password123'): Promise<string> {
    const bcrypt = await import('bcryptjs')
    return bcrypt.hash(password, 10)
  }

  /**
   * Create a user session for testing
   */
  static createUserSession(user: UserTestData) {
    return {
      user: {
        id: user.id!,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
        isAdmin: user.isAdmin,
        isPremium: user.isPremium || false,
      },
      expires: faker.date.future().toISOString(),
    }
  }

  /**
   * Generate OAuth account data
   */
  static createOAuthAccount(userId: string, provider: string = 'google') {
    return {
      id: TestUtils.randomId(),
      userId,
      type: 'oauth',
      provider,
      providerAccountId: faker.string.alphanumeric(10),
      refresh_token: faker.string.alphanumeric(32),
      access_token: faker.string.alphanumeric(32),
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      token_type: 'Bearer',
      scope: 'email profile',
      id_token: faker.string.alphanumeric(64),
    }
  }

  /**
   * Generate user verification token
   */
  static createVerificationToken(email: string) {
    return {
      identifier: email,
      token: faker.string.alphanumeric(32),
      expires: faker.date.future(),
    }
  }

  /**
   * Generate password reset token
   */
  static createPasswordResetToken(userId: string) {
    return {
      id: TestUtils.randomId(),
      userId,
      token: faker.string.alphanumeric(32),
      expires: faker.date.future({ days: 1 }),
      used: false,
    }
  }
}