import type { User, UserRole, UserStatus } from '@prisma/client'
import { faker } from '@faker-js/faker'
import bcrypt from 'bcryptjs'

export interface CreateUserFixtureOptions {
  id?: string
  email?: string
  username?: string
  password?: string
  role?: UserRole
  status?: UserStatus
  emailVerified?: Date | null
  createdAt?: Date
  updatedAt?: Date
  lastLoginAt?: Date | null
}

export const createUserFixture = async (
  options: CreateUserFixtureOptions = {}
): Promise<User> => {
  const password = options.password || 'TestPassword123!'
  const hashedPassword = await bcrypt.hash(password, 10)

  return {
    id: options.id || faker.string.uuid(),
    email: options.email || faker.internet.email(),
    username: options.username || faker.internet.username(),
    password: hashedPassword,
    role: options.role || 'USER',
    status: options.status || 'ACTIVE',
    emailVerified: options.emailVerified || faker.date.past(),
    createdAt: options.createdAt || faker.date.past(),
    updatedAt: options.updatedAt || faker.date.recent(),
    lastLoginAt: options.lastLoginAt || faker.date.recent(),
    image: faker.image.avatar(),
    name: faker.person.fullName(),
    settings: {
      theme: 'dark',
      notifications: true,
      emailUpdates: true,
    },
    preferences: {
      favoriteTeams: [faker.helpers.arrayElement(['NE', 'KC', 'TB', 'GB'])],
      draftNotifications: true,
      tradeNotifications: true,
    },
  }
}

export const createUsersFixture = async (
  count: number = 5,
  options: CreateUserFixtureOptions = {}
): Promise<User[]> => {
  const users: User[] = []
  
  for (let i = 0; i < count; i++) {
    const user = await createUserFixture({
      ...options,
      id: undefined, // Force unique ID for each user
      email: undefined, // Force unique email for each user
      username: undefined, // Force unique username for each user
    })
    users.push(user)
  }
  
  return users
}

export const createAdminUserFixture = async (
  options: CreateUserFixtureOptions = {}
): Promise<User> => {
  return createUserFixture({
    ...options,
    role: 'ADMIN',
    status: 'ACTIVE',
    emailVerified: new Date(),
  })
}

export const createPendingUserFixture = async (
  options: CreateUserFixtureOptions = {}
): Promise<User> => {
  return createUserFixture({
    ...options,
    status: 'PENDING_VERIFICATION',
    emailVerified: null,
  })
}

// Mock user for testing without password hashing
export const createMockUser = (
  options: Partial<User> = {}
): User => {
  return {
    id: faker.string.uuid(),
    email: faker.internet.email(),
    username: faker.internet.username(),
    password: 'mock-password-hash',
    role: 'USER',
    status: 'ACTIVE',
    emailVerified: faker.date.past(),
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent(),
    lastLoginAt: faker.date.recent(),
    image: faker.image.avatar(),
    name: faker.person.fullName(),
    settings: {
      theme: 'dark',
      notifications: true,
      emailUpdates: true,
    },
    preferences: {
      favoriteTeams: ['NE'],
      draftNotifications: true,
      tradeNotifications: true,
    },
    ...options,
  }
}