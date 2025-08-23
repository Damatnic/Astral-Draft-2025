/**
 * @fileoverview Comprehensive Zod validation schemas for input security
 * Provides centralized, type-safe validation for all user inputs
 */

import { z } from 'zod'

// Base validation schemas
export const idSchema = z.string().uuid('Invalid ID format')
export const emailSchema = z.string().email('Invalid email format').max(254)
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must not exceed 128 characters')
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
    'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')

export const usernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters')
  .max(30, 'Username must not exceed 30 characters')
  .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens')
  .refine(val => !val.includes('admin') && !val.includes('root'), {
    message: 'Username cannot contain reserved words'
  })

export const teamNameSchema = z
  .string()
  .min(1, 'Team name is required')
  .max(50, 'Team name must not exceed 50 characters')
  .regex(/^[a-zA-Z0-9\s\-_']+$/, 'Team name contains invalid characters')

export const leagueNameSchema = z
  .string()
  .min(2, 'League name must be at least 2 characters')
  .max(100, 'League name must not exceed 100 characters')
  .regex(/^[a-zA-Z0-9\s\-_'&]+$/, 'League name contains invalid characters')

export const inviteCodeSchema = z
  .string()
  .length(8, 'Invite code must be exactly 8 characters')
  .regex(/^[A-Z0-9]+$/, 'Invite code can only contain uppercase letters and numbers')

// Authentication schemas
export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
})

export const signUpSchema = z.object({
  email: emailSchema,
  username: usernameSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
  termsAccepted: z.boolean().refine(val => val === true, {
    message: 'You must accept the terms and conditions'
  }),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword']
})

export const resetPasswordSchema = z.object({
  email: emailSchema,
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: 'New passwords do not match',
  path: ['confirmPassword']
}).refine(data => data.currentPassword !== data.newPassword, {
  message: 'New password must be different from current password',
  path: ['newPassword']
})

// User profile schemas
export const updateProfileSchema = z.object({
  username: usernameSchema,
  email: emailSchema,
  name: z.string().min(1, 'Name is required').max(100, 'Name too long').optional(),
  bio: z.string().max(500, 'Bio must not exceed 500 characters').optional(),
  avatar: z.string().url('Invalid avatar URL').optional(),
  timezone: z.string().optional(),
  notifications: z.object({
    email: z.boolean(),
    push: z.boolean(),
    sms: z.boolean(),
  }).optional(),
})

// League management schemas
export const createLeagueSchema = z.object({
  name: leagueNameSchema,
  description: z.string().max(500, 'Description must not exceed 500 characters').optional(),
  maxTeams: z.number().int().min(4).max(20, 'League can have at most 20 teams'),
  isPublic: z.boolean(),
  password: z.string().max(50, 'League password too long').optional(),
  settings: z.object({
    rosterPositions: z.object({
      QB: z.number().int().min(0).max(3),
      RB: z.number().int().min(0).max(6),
      WR: z.number().int().min(0).max(6),
      TE: z.number().int().min(0).max(3),
      FLEX: z.number().int().min(0).max(3),
      K: z.number().int().min(0).max(2),
      DST: z.number().int().min(0).max(2),
      BENCH: z.number().int().min(1).max(10),
    }),
    waiverPeriod: z.number().int().min(0).max(7, 'Waiver period cannot exceed 7 days'),
    tradeDeadline: z.string().datetime('Invalid trade deadline format').optional(),
    playoffTeams: z.number().int().min(2).max(8, 'Too many playoff teams'),
  }),
  draftSettings: z.object({
    type: z.enum(['SNAKE', 'LINEAR', 'AUCTION']),
    scheduledAt: z.string().datetime('Invalid draft date'),
    rounds: z.number().int().min(10).max(20, 'Invalid number of rounds'),
    pickTimeLimit: z.number().int().min(30).max(600, 'Pick time limit must be between 30 seconds and 10 minutes'),
    order: z.enum(['RANDOMIZED', 'MANUAL']),
    allowTrades: z.boolean(),
    autopickEnabled: z.boolean(),
  }),
  scoringSettings: z.object({
    passing: z.object({
      passingYards: z.number().min(0).max(0.1),
      passingTouchdowns: z.number().min(0).max(10),
      interceptions: z.number().min(-5).max(0),
      passingTwoPointConversions: z.number().min(0).max(5),
    }),
    rushing: z.object({
      rushingYards: z.number().min(0).max(0.5),
      rushingTouchdowns: z.number().min(0).max(10),
      rushingTwoPointConversions: z.number().min(0).max(5),
    }),
    receiving: z.object({
      receivingYards: z.number().min(0).max(0.5),
      receivingTouchdowns: z.number().min(0).max(10),
      receptions: z.number().min(0).max(2), // PPR settings
      receivingTwoPointConversions: z.number().min(0).max(5),
    }),
  }),
})

export const updateLeagueSchema = createLeagueSchema.partial().extend({
  id: idSchema,
})

export const joinLeagueSchema = z.object({
  inviteCode: inviteCodeSchema,
  password: z.string().max(50).optional(),
  teamName: teamNameSchema,
})

// Team management schemas
export const updateTeamSchema = z.object({
  id: idSchema,
  name: teamNameSchema,
  logoUrl: z.string().url('Invalid logo URL').optional(),
  primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format'),
  secondaryColor: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format'),
  motto: z.string().max(100, 'Motto too long').optional(),
})

export const setLineupSchema = z.object({
  teamId: idSchema,
  week: z.number().int().min(1).max(18),
  lineup: z.object({
    QB: idSchema.optional(),
    RB1: idSchema.optional(),
    RB2: idSchema.optional(),
    WR1: idSchema.optional(),
    WR2: idSchema.optional(),
    TE: idSchema.optional(),
    FLEX: idSchema.optional(),
    K: idSchema.optional(),
    DST: idSchema.optional(),
  }),
})

// Draft schemas
export const makeDraftPickSchema = z.object({
  draftId: idSchema,
  playerId: idSchema,
  teamId: idSchema,
})

export const createDraftQueueSchema = z.object({
  teamId: idSchema,
  playerIds: z.array(idSchema).max(50, 'Too many players in queue'),
})

// Trade schemas
export const proposeTradeSchema = z.object({
  initiatorTeamId: idSchema,
  recipientTeamId: idSchema,
  initiatorPlayerIds: z.array(idSchema).min(1).max(10),
  recipientPlayerIds: z.array(idSchema).min(1).max(10),
  message: z.string().max(500, 'Trade message too long').optional(),
  expiresAt: z.string().datetime().optional(),
})

export const respondToTradeSchema = z.object({
  tradeId: idSchema,
  response: z.enum(['ACCEPT', 'REJECT', 'COUNTER']),
  counterOffer: proposeTradeSchema.omit({ initiatorTeamId: true, recipientTeamId: true }).optional(),
})

// Waiver wire schemas
export const addWaiverClaimSchema = z.object({
  teamId: idSchema,
  playerId: idSchema,
  dropPlayerId: idSchema.optional(),
  priority: z.number().int().min(1),
  bidAmount: z.number().min(0).max(1000).optional(), // FAAB
})

// Chat and social schemas
export const sendMessageSchema = z.object({
  leagueId: idSchema,
  content: z.string()
    .min(1, 'Message cannot be empty')
    .max(280, 'Message too long')
    .regex(/^[^<>]*$/, 'Message contains invalid characters'), // Basic XSS prevention
  replyTo: idSchema.optional(),
})

// Oracle and prediction schemas
export const requestPredictionSchema = z.object({
  playerIds: z.array(idSchema).min(1).max(50),
  week: z.number().int().min(1).max(18).optional(),
  type: z.enum(['WEEKLY', 'SEASON', 'DRAFT_VALUE']),
})

export const submitFeedbackSchema = z.object({
  predictionId: idSchema,
  accuracy: z.number().min(1).max(5),
  helpful: z.boolean(),
  comment: z.string().max(500).optional(),
})

// Admin schemas
export const adminActionSchema = z.object({
  action: z.enum(['SUSPEND_USER', 'DELETE_LEAGUE', 'RESET_PASSWORD', 'VERIFY_USER']),
  targetId: idSchema,
  reason: z.string().min(10, 'Reason must be at least 10 characters').max(500),
  duration: z.number().int().min(1).max(365).optional(), // Days for suspension
})

// File upload schemas
export const fileUploadSchema = z.object({
  fileName: z.string().min(1).max(255),
  fileSize: z.number().int().min(1).max(5 * 1024 * 1024), // 5MB max
  fileType: z.enum(['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']),
  purpose: z.enum(['AVATAR', 'TEAM_LOGO', 'LEAGUE_LOGO']),
})

// Search schemas
export const searchSchema = z.object({
  query: z.string()
    .min(1, 'Search query cannot be empty')
    .max(100, 'Search query too long')
    .regex(/^[a-zA-Z0-9\s\-_']+$/, 'Search query contains invalid characters'),
  type: z.enum(['PLAYERS', 'LEAGUES', 'USERS']).optional(),
  filters: z.object({
    position: z.enum(['QB', 'RB', 'WR', 'TE', 'K', 'DST']).optional(),
    team: z.string().max(10).optional(),
    available: z.boolean().optional(),
  }).optional(),
  limit: z.number().int().min(1).max(100).default(25),
  offset: z.number().int().min(0).default(0),
})

// Analytics and reporting schemas
export const analyticsEventSchema = z.object({
  eventName: z.string().min(1).max(50),
  properties: z.record(z.union([z.string(), z.number(), z.boolean()])).optional(),
  userId: idSchema.optional(),
  sessionId: z.string().optional(),
  timestamp: z.string().datetime().optional(),
})

// Validation helper functions
export const sanitizeString = (input: string): string => {
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .trim()
    .substring(0, 1000) // Prevent extremely long strings
}

export const validateAndSanitize = <T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  sanitize = true
): T => {
  // Pre-sanitize string fields if requested
  if (sanitize && typeof data === 'object' && data !== null) {
    const sanitized = { ...data } as any
    Object.keys(sanitized).forEach(key => {
      if (typeof sanitized[key] === 'string') {
        sanitized[key] = sanitizeString(sanitized[key])
      }
    })
    data = sanitized
  }

  return schema.parse(data)
}

// Common validation middleware helpers
export const createValidationMiddleware = <T>(schema: z.ZodSchema<T>) => {
  return (data: unknown) => {
    try {
      return {
        success: true as const,
        data: validateAndSanitize(schema, data),
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false as const,
          error: {
            issues: error.issues,
            message: error.issues[0]?.message || 'Validation failed',
          },
        }
      }
      throw error
    }
  }
}

// Rate limiting validation
export const rateLimitSchema = z.object({
  windowMs: z.number().int().min(1000).max(3600000), // 1 second to 1 hour
  maxRequests: z.number().int().min(1).max(10000),
  skipSuccessfulRequests: z.boolean().default(false),
  skipFailedRequests: z.boolean().default(false),
})

// Content Security Policy validation
export const cspDirectiveSchema = z.object({
  'default-src': z.array(z.string()).optional(),
  'script-src': z.array(z.string()).optional(),
  'style-src': z.array(z.string()).optional(),
  'img-src': z.array(z.string()).optional(),
  'connect-src': z.array(z.string()).optional(),
  'font-src': z.array(z.string()).optional(),
  'object-src': z.array(z.string()).optional(),
  'media-src': z.array(z.string()).optional(),
  'frame-src': z.array(z.string()).optional(),
})