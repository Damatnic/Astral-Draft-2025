/**
 * Authentication hooks and utilities
 */

import { useState } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import type {
  LoginFormData,
  RegisterFormData,
  ForgotPasswordFormData,
  ResetPasswordFormData,
  VerifyEmailFormData,
  TwoFactorFormData,
} from '../lib/validation/auth';

interface UseAuthReturn {
  session: any;
  isAuthenticated: boolean;
  isLoading: boolean;
  user: any;
  login: (data: LoginFormData) => Promise<boolean>;
  logout: () => Promise<void>;
  register: (data: RegisterFormData) => Promise<boolean>;
  forgotPassword: (data: ForgotPasswordFormData) => Promise<boolean>;
  resetPassword: (data: ResetPasswordFormData) => Promise<boolean>;
  verifyEmail: (data: VerifyEmailFormData) => Promise<boolean>;
  resendVerificationEmail: (email: string) => Promise<boolean>;
  verifyTwoFactor: (data: TwoFactorFormData) => Promise<boolean>;
  checkUsernameAvailability: (username: string) => Promise<boolean>;
}

export function useAuth(): UseAuthReturn {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const login = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        toast.error('Invalid email or password');
        return false;
      }

      toast.success('Welcome back!');
      router.push('/dashboard');
      return true;
    } catch (error) {
      toast.error('An error occurred during login');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await signOut({ redirect: true, callbackUrl: '/' });
      toast.success('Logged out successfully');
    } catch (error) {
      toast.error('Error logging out');
    }
  };

  const register = async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.message || 'Registration failed');
        return false;
      }

      toast.success('Account created! Please check your email to verify your account.');
      router.push('/auth/verify-email');
      return true;
    } catch (error) {
      toast.error('An error occurred during registration');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const forgotPassword = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.message || 'Failed to send reset email');
        return false;
      }

      toast.success('Password reset email sent! Check your inbox.');
      return true;
    } catch (error) {
      toast.error('An error occurred while sending reset email');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (data: ResetPasswordFormData) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.message || 'Failed to reset password');
        return false;
      }

      toast.success('Password reset successfully! You can now log in.');
      router.push('/login');
      return true;
    } catch (error) {
      toast.error('An error occurred while resetting password');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyEmail = async (data: VerifyEmailFormData) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.message || 'Email verification failed');
        return false;
      }

      toast.success('Email verified successfully!');
      router.push('/login');
      return true;
    } catch (error) {
      toast.error('An error occurred during email verification');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const resendVerificationEmail = async (email: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.message || 'Failed to resend verification email');
        return false;
      }

      toast.success('Verification email sent!');
      return true;
    } catch (error) {
      toast.error('An error occurred while resending verification email');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyTwoFactor = async (data: TwoFactorFormData) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/verify-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.message || 'Two-factor verification failed');
        return false;
      }

      toast.success('Two-factor authentication verified!');
      router.push('/dashboard');
      return true;
    } catch (error) {
      toast.error('An error occurred during two-factor verification');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const checkUsernameAvailability = async (username: string) => {
    try {
      const response = await fetch(`/api/auth/check-username?username=${encodeURIComponent(username)}`);
      const result = await response.json();
      return result.available;
    } catch (error) {
      return false;
    }
  };

  return {
    session,
    isAuthenticated: !!session,
    isLoading: isLoading || status === 'loading',
    user: session?.user,
    login,
    logout,
    register,
    forgotPassword,
    resetPassword,
    verifyEmail,
    resendVerificationEmail,
    verifyTwoFactor,
    checkUsernameAvailability,
  };
}