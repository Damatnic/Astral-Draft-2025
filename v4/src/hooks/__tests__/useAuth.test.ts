/**
 * useAuth Hook Tests
 * Comprehensive unit tests for the authentication hook
 */

import { renderHook, act, waitFor } from '@testing-library/react'
import { useSession, signIn, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { useAuth } from '../useAuth'

// Mock dependencies
jest.mock('next-auth/react')
jest.mock('next/navigation')
jest.mock('react-hot-toast')

const mockUseSession = useSession as jest.MockedFunction<typeof useSession>
const mockSignIn = signIn as jest.MockedFunction<typeof signIn>
const mockSignOut = signOut as jest.MockedFunction<typeof signOut>
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>
const mockToast = toast as jest.Mocked<typeof toast>

// Mock fetch
const mockFetch = jest.fn()
global.fetch = mockFetch

describe('useAuth Hook', () => {
  const mockPush = jest.fn()
  const mockRouter = { push: mockPush }

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseRouter.mockReturnValue(mockRouter as any)
    mockToast.success = jest.fn()
    mockToast.error = jest.fn()
  })

  describe('Initial State', () => {
    it('returns correct initial state when not authenticated', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
        update: jest.fn(),
      })

      const { result } = renderHook(() => useAuth())

      expect(result.current.session).toBe(null)
      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.isLoading).toBe(false)
      expect(result.current.user).toBe(undefined)
    })

    it('returns correct state when authenticated', () => {
      const mockSession = {
        user: {
          id: '1',
          email: 'test@example.com',
          name: 'Test User',
        },
        expires: '2024-12-31',
      }

      mockUseSession.mockReturnValue({
        data: mockSession,
        status: 'authenticated',
        update: jest.fn(),
      })

      const { result } = renderHook(() => useAuth())

      expect(result.current.session).toBe(mockSession)
      expect(result.current.isAuthenticated).toBe(true)
      expect(result.current.isLoading).toBe(false)
      expect(result.current.user).toBe(mockSession.user)
    })

    it('returns loading state when session is loading', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'loading',
        update: jest.fn(),
      })

      const { result } = renderHook(() => useAuth())

      expect(result.current.isLoading).toBe(true)
    })
  })

  describe('login', () => {
    it('successfully logs in user', async () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
        update: jest.fn(),
      })

      mockSignIn.mockResolvedValue({
        ok: true,
        error: null,
        status: 200,
        url: null,
      })

      const { result } = renderHook(() => useAuth())

      let loginResult: boolean | undefined
      await act(async () => {
        loginResult = await result.current.login({
          email: 'test@example.com',
          password: 'password123',
        })
      })

      expect(mockSignIn).toHaveBeenCalledWith('credentials', {
        email: 'test@example.com',
        password: 'password123',
        redirect: false,
      })
      expect(mockToast.success).toHaveBeenCalledWith('Welcome back!')
      expect(mockPush).toHaveBeenCalledWith('/dashboard')
      expect(loginResult).toBe(true)
    })

    it('handles login error', async () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
        update: jest.fn(),
      })

      mockSignIn.mockResolvedValue({
        ok: false,
        error: 'CredentialsSignin',
        status: 401,
        url: null,
      })

      const { result } = renderHook(() => useAuth())

      let loginResult: boolean | undefined
      await act(async () => {
        loginResult = await result.current.login({
          email: 'test@example.com',
          password: 'wrongpassword',
        })
      })

      expect(mockToast.error).toHaveBeenCalledWith('Invalid email or password')
      expect(mockPush).not.toHaveBeenCalled()
      expect(loginResult).toBe(false)
    })

    it('handles login exception', async () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
        update: jest.fn(),
      })

      mockSignIn.mockRejectedValue(new Error('Network error'))

      const { result } = renderHook(() => useAuth())

      let loginResult: boolean | undefined
      await act(async () => {
        loginResult = await result.current.login({
          email: 'test@example.com',
          password: 'password123',
        })
      })

      expect(mockToast.error).toHaveBeenCalledWith('An error occurred during login')
      expect(loginResult).toBe(false)
    })

    it('sets loading state during login', async () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
        update: jest.fn(),
      })

      let resolveSignIn: (value: any) => void
      const signInPromise = new Promise(resolve => {
        resolveSignIn = resolve
      })
      mockSignIn.mockReturnValue(signInPromise)

      const { result } = renderHook(() => useAuth())

      // Start login
      act(() => {
        result.current.login({
          email: 'test@example.com',
          password: 'password123',
        })
      })

      // Should be loading
      expect(result.current.isLoading).toBe(true)

      // Complete login
      await act(async () => {
        resolveSignIn!({ ok: true, error: null })
        await signInPromise
      })

      // Should not be loading anymore
      expect(result.current.isLoading).toBe(false)
    })
  })

  describe('logout', () => {
    it('successfully logs out user', async () => {
      mockSignOut.mockResolvedValue({ url: '/' })

      const { result } = renderHook(() => useAuth())

      await act(async () => {
        await result.current.logout()
      })

      expect(mockSignOut).toHaveBeenCalledWith({ redirect: true, callbackUrl: '/' })
      expect(mockToast.success).toHaveBeenCalledWith('Logged out successfully')
    })

    it('handles logout error', async () => {
      mockSignOut.mockRejectedValue(new Error('Logout failed'))

      const { result } = renderHook(() => useAuth())

      await act(async () => {
        await result.current.logout()
      })

      expect(mockToast.error).toHaveBeenCalledWith('Error logging out')
    })
  })

  describe('register', () => {
    it('successfully registers user', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ message: 'User created successfully' }),
      })

      const { result } = renderHook(() => useAuth())

      let registerResult: boolean | undefined
      await act(async () => {
        registerResult = await result.current.register({
          email: 'test@example.com',
          password: 'password123',
          firstName: 'Test',
          lastName: 'User',
          username: 'testuser',
        })
      })

      expect(mockFetch).toHaveBeenCalledWith('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123',
          firstName: 'Test',
          lastName: 'User',
          username: 'testuser',
        }),
      })
      expect(mockToast.success).toHaveBeenCalledWith(
        'Account created! Please check your email to verify your account.'
      )
      expect(mockPush).toHaveBeenCalledWith('/auth/verify-email')
      expect(registerResult).toBe(true)
    })

    it('handles registration error', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ message: 'Email already exists' }),
      })

      const { result } = renderHook(() => useAuth())

      let registerResult: boolean | undefined
      await act(async () => {
        registerResult = await result.current.register({
          email: 'test@example.com',
          password: 'password123',
          firstName: 'Test',
          lastName: 'User',
          username: 'testuser',
        })
      })

      expect(mockToast.error).toHaveBeenCalledWith('Email already exists')
      expect(mockPush).not.toHaveBeenCalled()
      expect(registerResult).toBe(false)
    })
  })

  describe('forgotPassword', () => {
    it('successfully sends password reset email', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ message: 'Reset email sent' }),
      })

      const { result } = renderHook(() => useAuth())

      let result_: boolean | undefined
      await act(async () => {
        result_ = await result.current.forgotPassword({
          email: 'test@example.com',
        })
      })

      expect(mockFetch).toHaveBeenCalledWith('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com' }),
      })
      expect(mockToast.success).toHaveBeenCalledWith(
        'Password reset email sent! Check your inbox.'
      )
      expect(result_).toBe(true)
    })

    it('handles forgot password error', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ message: 'User not found' }),
      })

      const { result } = renderHook(() => useAuth())

      let result_: boolean | undefined
      await act(async () => {
        result_ = await result.current.forgotPassword({
          email: 'notfound@example.com',
        })
      })

      expect(mockToast.error).toHaveBeenCalledWith('User not found')
      expect(result_).toBe(false)
    })
  })

  describe('resetPassword', () => {
    it('successfully resets password', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ message: 'Password reset successfully' }),
      })

      const { result } = renderHook(() => useAuth())

      let result_: boolean | undefined
      await act(async () => {
        result_ = await result.current.resetPassword({
          token: 'reset-token',
          password: 'newpassword123',
        })
      })

      expect(mockFetch).toHaveBeenCalledWith('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: 'reset-token',
          password: 'newpassword123',
        }),
      })
      expect(mockToast.success).toHaveBeenCalledWith(
        'Password reset successfully! You can now log in.'
      )
      expect(mockPush).toHaveBeenCalledWith('/login')
      expect(result_).toBe(true)
    })

    it('handles reset password error', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ message: 'Invalid or expired token' }),
      })

      const { result } = renderHook(() => useAuth())

      let result_: boolean | undefined
      await act(async () => {
        result_ = await result.current.resetPassword({
          token: 'invalid-token',
          password: 'newpassword123',
        })
      })

      expect(mockToast.error).toHaveBeenCalledWith('Invalid or expired token')
      expect(mockPush).not.toHaveBeenCalled()
      expect(result_).toBe(false)
    })
  })

  describe('verifyEmail', () => {
    it('successfully verifies email', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ message: 'Email verified' }),
      })

      const { result } = renderHook(() => useAuth())

      let result_: boolean | undefined
      await act(async () => {
        result_ = await result.current.verifyEmail({
          token: 'verify-token',
        })
      })

      expect(mockFetch).toHaveBeenCalledWith('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: 'verify-token' }),
      })
      expect(mockToast.success).toHaveBeenCalledWith('Email verified successfully!')
      expect(mockPush).toHaveBeenCalledWith('/login')
      expect(result_).toBe(true)
    })
  })

  describe('resendVerificationEmail', () => {
    it('successfully resends verification email', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ message: 'Verification email sent' }),
      })

      const { result } = renderHook(() => useAuth())

      let result_: boolean | undefined
      await act(async () => {
        result_ = await result.current.resendVerificationEmail('test@example.com')
      })

      expect(mockFetch).toHaveBeenCalledWith('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com' }),
      })
      expect(mockToast.success).toHaveBeenCalledWith('Verification email sent!')
      expect(result_).toBe(true)
    })
  })

  describe('verifyTwoFactor', () => {
    it('successfully verifies two-factor code', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ message: 'Two-factor verified' }),
      })

      const { result } = renderHook(() => useAuth())

      let result_: boolean | undefined
      await act(async () => {
        result_ = await result.current.verifyTwoFactor({
          code: '123456',
          userId: 'user-id',
        })
      })

      expect(mockFetch).toHaveBeenCalledWith('/api/auth/verify-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: '123456', userId: 'user-id' }),
      })
      expect(mockToast.success).toHaveBeenCalledWith('Two-factor authentication verified!')
      expect(mockPush).toHaveBeenCalledWith('/dashboard')
      expect(result_).toBe(true)
    })
  })

  describe('checkUsernameAvailability', () => {
    it('returns true for available username', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ available: true }),
      })

      const { result } = renderHook(() => useAuth())

      let isAvailable: boolean | undefined
      await act(async () => {
        isAvailable = await result.current.checkUsernameAvailability('newuser')
      })

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/auth/check-username?username=newuser'
      )
      expect(isAvailable).toBe(true)
    })

    it('returns false for unavailable username', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ available: false }),
      })

      const { result } = renderHook(() => useAuth())

      let isAvailable: boolean | undefined
      await act(async () => {
        isAvailable = await result.current.checkUsernameAvailability('existinguser')
      })

      expect(isAvailable).toBe(false)
    })

    it('returns false on error', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))

      const { result } = renderHook(() => useAuth())

      let isAvailable: boolean | undefined
      await act(async () => {
        isAvailable = await result.current.checkUsernameAvailability('testuser')
      })

      expect(isAvailable).toBe(false)
    })

    it('properly encodes username in URL', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ available: true }),
      })

      const { result } = renderHook(() => useAuth())

      await act(async () => {
        await result.current.checkUsernameAvailability('user@name')
      })

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/auth/check-username?username=user%40name'
      )
    })
  })

  describe('Error Handling', () => {
    it('handles network errors gracefully', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))

      const { result } = renderHook(() => useAuth())

      let registerResult: boolean | undefined
      await act(async () => {
        registerResult = await result.current.register({
          email: 'test@example.com',
          password: 'password123',
          firstName: 'Test',
          lastName: 'User',
          username: 'testuser',
        })
      })

      expect(mockToast.error).toHaveBeenCalledWith('An error occurred during registration')
      expect(registerResult).toBe(false)
    })

    it('handles malformed JSON responses', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.reject(new Error('Invalid JSON')),
      })

      const { result } = renderHook(() => useAuth())

      let registerResult: boolean | undefined
      await act(async () => {
        registerResult = await result.current.register({
          email: 'test@example.com',
          password: 'password123',
          firstName: 'Test',
          lastName: 'User',
          username: 'testuser',
        })
      })

      expect(mockToast.error).toHaveBeenCalledWith('An error occurred during registration')
      expect(registerResult).toBe(false)
    })
  })
})