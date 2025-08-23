/**
 * Authentication error page with error handling and retry functionality
 */

'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

import { AuthCard } from '../../../components/auth/AuthCard';
import { Button } from '../../../components/ui/Button';

interface ErrorInfo {
  title: string;
  description: string;
  action: string;
  actionHref: string;
  supportMessage?: string;
}

const errorMessages: Record<string, ErrorInfo> = {
  Configuration: {
    title: 'Server Configuration Error',
    description: 'There is a problem with the server configuration. Please try again later.',
    action: 'Try again',
    actionHref: '/login',
    supportMessage: 'If this error persists, please contact our support team.',
  },
  AccessDenied: {
    title: 'Access Denied',
    description: 'You do not have permission to sign in with this account.',
    action: 'Back to sign in',
    actionHref: '/login',
    supportMessage: 'Contact support if you believe this is an error.',
  },
  Verification: {
    title: 'Verification Required',
    description: 'Please check your email and click the verification link before signing in.',
    action: 'Back to sign in',
    actionHref: '/login',
  },
  OAuthSignin: {
    title: 'OAuth Sign In Error',
    description: 'There was an error signing in with your social media account.',
    action: 'Try again',
    actionHref: '/login',
    supportMessage: 'Try using a different sign in method or contact support.',
  },
  OAuthCallback: {
    title: 'OAuth Callback Error',
    description: 'There was an error processing the response from your social media provider.',
    action: 'Try again',
    actionHref: '/login',
    supportMessage: 'This may be a temporary issue. Please try again.',
  },
  OAuthCreateAccount: {
    title: 'Account Creation Error',
    description: 'Could not create an account with your social media provider.',
    action: 'Try again',
    actionHref: '/register',
    supportMessage: 'Try creating an account with email instead.',
  },
  EmailCreateAccount: {
    title: 'Email Account Error',
    description: 'Could not create an account with the provided email address.',
    action: 'Try again',
    actionHref: '/register',
    supportMessage: 'Make sure your email address is correct and try again.',
  },
  Callback: {
    title: 'Callback Error',
    description: 'There was an error in the authentication callback.',
    action: 'Try again',
    actionHref: '/login',
    supportMessage: 'This may be a temporary issue. Please try again.',
  },
  OAuthAccountNotLinked: {
    title: 'Account Already Exists',
    description: 'An account with this email already exists but is not linked to this social provider.',
    action: 'Sign in with email',
    actionHref: '/login',
    supportMessage: 'Try signing in with your email and password instead.',
  },
  EmailSignin: {
    title: 'Email Sign In Error',
    description: 'Could not send the sign in email. Please try again.',
    action: 'Try again',
    actionHref: '/login',
    supportMessage: 'Check your email settings or try a different email address.',
  },
  CredentialsSignin: {
    title: 'Invalid Credentials',
    description: 'The email or password you entered is incorrect.',
    action: 'Try again',
    actionHref: '/login',
    supportMessage: 'Make sure your email and password are correct.',
  },
  SessionRequired: {
    title: 'Session Required',
    description: 'You must be signed in to access this page.',
    action: 'Sign in',
    actionHref: '/login',
  },
  Default: {
    title: 'Authentication Error',
    description: 'An unexpected error occurred during authentication.',
    action: 'Try again',
    actionHref: '/login',
    supportMessage: 'If this error continues, please contact our support team.',
  },
};

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const [errorInfo, setErrorInfo] = useState<ErrorInfo>(errorMessages.Default);

  useEffect(() => {
    const error = searchParams?.get('error');
    if (error && errorMessages[error]) {
      setErrorInfo(errorMessages[error]);
    }
  }, [searchParams]);

  const handleRetry = () => {
    // Clear any cached error state
    if (typeof window !== 'undefined') {
      window.history.replaceState({}, '', window.location.pathname);
    }
  };

  return (
    <>
      <title>Authentication Error - Astral Draft</title>
      <meta name="description" content="An authentication error occurred. Please try signing in again." />
      <meta name="robots" content="noindex" />
      
      <AuthCard
        title={errorInfo.title}
        subtitle="We encountered an issue with your authentication"
        footer={
          <div className="space-y-2 text-center">
            <p>
              Need help?{' '}
              <Link 
                href="/contact" 
                className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
              >
                Contact support
              </Link>
            </p>
            <p className="text-xs text-gray-500">
              Error ID: {searchParams?.get('error') || 'UNKNOWN'}
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
              {errorInfo.description}
            </p>
            {errorInfo.supportMessage && (
              <p className="text-sm text-gray-500">
                {errorInfo.supportMessage}
              </p>
            )}
          </div>

          <div className="space-y-3">
            <Link href={errorInfo.actionHref}>
              <Button 
                className="w-full"
                onClick={handleRetry}
              >
                {errorInfo.action}
              </Button>
            </Link>
            
            <div className="grid grid-cols-2 gap-3">
              <Link href="/login">
                <Button variant="outline" className="w-full">
                  Sign in
                </Button>
              </Link>
              
              <Link href="/register">
                <Button variant="outline" className="w-full">
                  Sign up
                </Button>
              </Link>
            </div>

            <Link href="/">
              <Button variant="ghost" className="w-full">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Back to home
              </Button>
            </Link>
          </div>
        </div>
      </AuthCard>
    </>
  );
}