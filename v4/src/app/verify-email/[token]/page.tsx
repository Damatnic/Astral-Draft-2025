/**
 * Email verification page with verification status and resend functionality
 */

'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';

import { AuthCard } from '../../../components/auth/AuthCard';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { useAuth } from '../../../hooks/useAuth';

interface VerifyEmailPageProps {
  params: {
    token: string;
  };
}

type VerificationState = 'verifying' | 'success' | 'error' | 'expired';

export default function VerifyEmailPage({ params }: VerifyEmailPageProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const { verifyEmail, resendVerificationEmail, isLoading } = useAuth();
  const [verificationState, setVerificationState] = useState<VerificationState>('verifying');
  const [errorMessage, setErrorMessage] = useState('');
  const [email, setEmail] = useState('');
  const [countdown, setCountdown] = useState(0);

  // Auto-redirect countdown after successful verification
  useEffect(() => {
    if (verificationState === 'success' && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (verificationState === 'success' && countdown === 0) {
      router.push('/login');
    }
    return undefined;
  }, [verificationState, countdown, router]);

  // Verify email on component mount
  useEffect(() => {
    const verifyEmailToken = async () => {
      try {
        const response = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: params.token }),
        });

        const result = await response.json();

        if (response.ok) {
          setVerificationState('success');
          setCountdown(5); // Start 5-second countdown
          toast.success('Email verified successfully!');
        } else {
          if (result.code === 'TOKEN_EXPIRED') {
            setVerificationState('expired');
            setEmail(result.email || '');
          } else {
            setVerificationState('error');
          }
          setErrorMessage(result.message || 'Email verification failed');
        }
      } catch (error) {
        setVerificationState('error');
        setErrorMessage('An error occurred during email verification');
      }
    };

    if (params.token) {
      verifyEmailToken();
    }
  }, [params.token]);

  // Redirect if already authenticated
  useEffect(() => {
    if (session) {
      router.push('/dashboard');
    }
  }, [session, router]);

  const handleResendVerification = async () => {
    if (email) {
      const success = await resendVerificationEmail(email);
      if (success) {
        toast.success('Verification email sent! Check your inbox.');
      }
    }
  };

  if (session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  if (verificationState === 'verifying') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verifying your email...</p>
        </div>
      </div>
    );
  }

  if (verificationState === 'success') {
    return (
      <>
        <title>Email Verified - Astral Draft</title>
        <meta name="description" content="Your email has been successfully verified. You can now sign in to Astral Draft." />
        <meta name="robots" content="noindex" />
        
        <AuthCard
          title="Email verified!"
          subtitle="Your email has been successfully verified"
          footer={
            <div className="text-center">
              <p className="text-xs text-gray-500">
                Redirecting to sign in in {countdown} seconds...
              </p>
            </div>
          }
        >
          <div className="text-center space-y-6">
            <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            
            <div className="space-y-2">
              <p className="text-gray-600">
                Great! Your email address has been verified.
              </p>
              <p className="text-sm text-gray-500">
                You can now sign in to your Astral Draft account and start enjoying all features.
              </p>
            </div>

            <Link href="/login">
              <Button className="w-full">
                Continue to sign in
              </Button>
            </Link>
          </div>
        </AuthCard>
      </>
    );
  }

  if (verificationState === 'expired') {
    return (
      <>
        <title>Verification Link Expired - Astral Draft</title>
        <meta name="description" content="Your email verification link has expired. Request a new one to verify your account." />
        <meta name="robots" content="noindex" />
        
        <AuthCard
          title="Verification link expired"
          subtitle="This email verification link has expired"
          footer={
            <div className="space-y-2">
              <p>
                Already verified?{' '}
                <Link 
                  href="/login" 
                  className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
                >
                  Sign in here
                </Link>
              </p>
            </div>
          }
        >
          <div className="text-center space-y-6">
            <div className="w-16 h-16 mx-auto bg-yellow-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            
            <div className="space-y-2">
              <p className="text-gray-600">
                The verification link you clicked has expired.
              </p>
              <p className="text-sm text-gray-500">
                Verification links are only valid for 24 hours after being sent.
              </p>
            </div>

            {email && (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Send a new verification email to: <strong>{email}</strong>
                </p>
                <Button
                  onClick={handleResendVerification}
                  className="w-full"
                  loading={isLoading}
                  disabled={isLoading}
                >
                  Send new verification email
                </Button>
              </div>
            )}

            <Link href="/login">
              <Button variant="outline" className="w-full">
                Back to sign in
              </Button>
            </Link>
          </div>
        </AuthCard>
      </>
    );
  }

  // Error state
  return (
    <>
      <title>Verification Failed - Astral Draft</title>
      <meta name="description" content="Email verification failed. Please try again or contact support." />
      <meta name="robots" content="noindex" />
      
      <AuthCard
        title="Verification failed"
        subtitle="We couldn't verify your email address"
        footer={
          <div className="space-y-2">
            <p>
              Need help?{' '}
              <Link 
                href="/contact" 
                className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
              >
                Contact support
              </Link>
            </p>
          </div>
        }
      >
        <div className="text-center space-y-6">
          <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          
          <div className="space-y-2">
            <p className="text-gray-600">
              {errorMessage || 'There was an error verifying your email address.'}
            </p>
            <p className="text-sm text-gray-500">
              Please try requesting a new verification email or contact support if the problem persists.
            </p>
          </div>

          <div className="space-y-3">
            <Link href="/register">
              <Button className="w-full">
                Try creating account again
              </Button>
            </Link>
            
            <Link href="/login">
              <Button variant="outline" className="w-full">
                Back to sign in
              </Button>
            </Link>
          </div>
        </div>
      </AuthCard>
    </>
  );
}