'use client';

import { useState, useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { loginSchema, type LoginFormData } from '@/lib/validation/auth';
import './login.css';

export default function LoginPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [showPassword, setShowPassword] = useState(false);
  const [glitchActive, setGlitchActive] = useState(false);
  
  // Mutations for registration if needed
  const registerMutation = api.auth.register.useMutation();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  useEffect(() => {
    // Redirect if already logged in
    if (status === 'authenticated' && session) {
      router.push('/leagues');
    }
  }, [status, session, router]);
  
  useEffect(() => {
    // Trigger glitch effect periodically
    const interval = setInterval(() => {
      setGlitchActive(true);
      setTimeout(() => setGlitchActive(false), 200);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const onSubmit = async (data: LoginFormData) => {
    try {
      // Use NextAuth signIn with credentials provider
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
        callbackUrl: '/leagues',
      });

      if (result?.error) {
        // Handle specific error types
        if (result.error === 'CredentialsSignin') {
          setError('root', {
            message: 'Invalid email or password. Please try again.'
          });
          toast.error('Invalid email or password. Please try again.');
        } else if (result.error === 'AccessDenied') {
          setError('root', {
            message: 'Your account has been suspended. Please contact support.'
          });
          toast.error('Your account has been suspended. Please contact support.');
        } else {
          setError('root', {
            message: result.error || 'An error occurred during login.'
          });
          toast.error(result.error || 'An error occurred during login.');
        }
      } else if (result?.ok) {
        // Success - redirect to leagues or callback URL
        toast.success('Login successful!');
        router.push(result.url || '/leagues');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('root', {
        message: 'An unexpected error occurred. Please try again.'
      });
      toast.error('An unexpected error occurred. Please try again.');
    }
  };

  const handleSocialLogin = async (provider: string) => {
    try {
      // Use NextAuth for OAuth providers
      const result = await signIn(provider, { 
        callbackUrl: '/leagues',
        redirect: true 
      });
      
      if (!result?.ok) {
        toast.error(`Failed to login with ${provider}. Please try again.`);
        setError('root', {
          message: `Failed to login with ${provider}. Please try again.`
        });
      }
    } catch (err) {
      console.error(`${provider} login error:`, err);
      toast.error(`Failed to login with ${provider}. Please try again.`);
      setError('root', {
        message: `Failed to login with ${provider}. Please try again.`
      });
    }
  };

  return (
    <div className="cyberpunk-container">
      {/* Animated Background */}
      <div className="matrix-rain"></div>
      <div className="cyber-grid"></div>
      <div className="scanning-line"></div>
      
      {/* Floating particles */}
      <div className="particles">
        {[...Array(20)].map((_, i) => (
          <div key={i} className="particle" style={{
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 5}s`,
            animationDuration: `${15 + Math.random() * 10}s`
          }}></div>
        ))}
      </div>

      <div className="login-content">
        {/* Logo and Title with Glitch Effect */}
        <div className="logo-section">
          <div className={`cyber-logo ${glitchActive ? 'glitch' : ''}`}>
            <div className="logo-container">
              <div className="hexagon-logo">
                <svg className="logo-svg" viewBox="0 0 100 100">
                  <defs>
                    <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#00ffff" />
                      <stop offset="50%" stopColor="#ff00ff" />
                      <stop offset="100%" stopColor="#00ff88" />
                    </linearGradient>
                  </defs>
                  <polygon points="50,5 90,25 90,75 50,95 10,75 10,25" 
                           fill="none" 
                           stroke="url(#logoGradient)" 
                           strokeWidth="2"
                           className="hexagon-outline" />
                  <text x="50" y="55" textAnchor="middle" 
                        className="logo-text" 
                        fill="url(#logoGradient)">AD</text>
                </svg>
              </div>
              <h1 className="cyber-title" data-text="ASTRAL DRAFT">
                ASTRAL DRAFT
              </h1>
            </div>
          </div>
          <div className="cyber-subtitle">
            <span className="neon-text">ENTER THE GRID</span>
            <div className="pulse-line"></div>
          </div>
        </div>

        {/* Login Card with Glassmorphism */}
        <div className="login-card glass-morphism">
          <div className="card-glow"></div>
          <div className="card-inner">
            <div className="holographic-strip"></div>
            
            <form className="cyber-form" onSubmit={handleSubmit(onSubmit)}>
              {errors.root && (
                <div className="error-alert cyber-alert">
                  <div className="alert-icon">⚠</div>
                  <span>{errors.root.message}</span>
                </div>
              )}

              {/* Email Input */}
              <div className="input-group">
                <label className="cyber-label">
                  <span className="label-text">EMAIL ADDRESS</span>
                  <span className="label-accent"></span>
                </label>
                <div className="cyber-input-wrapper">
                  <div className="input-glow"></div>
                  <input
                    {...register('email')}
                    type="email"
                    className={`cyber-input ${errors.email ? 'error' : ''}`}
                    placeholder="user@cyberspace.net"
                    autoComplete="email"
                  />
                  <div className="input-border-animation"></div>
                </div>
                {errors.email && (
                  <div className="input-error">
                    <span className="error-icon">!</span>
                    <span className="error-text">{errors.email.message}</span>
                  </div>
                )}
              </div>

              {/* Password Input */}
              <div className="input-group">
                <label className="cyber-label">
                  <span className="label-text">PASSWORD</span>
                  <span className="label-accent"></span>
                </label>
                <div className="cyber-input-wrapper">
                  <div className="input-glow"></div>
                  <input
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    className={`cyber-input ${errors.password ? 'error' : ''}`}
                    placeholder="••••••••"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <svg className="eye-icon" viewBox="0 0 24 24">
                      {showPassword ? (
                        <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                      ) : (
                        <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/>
                      )}
                    </svg>
                  </button>
                  <div className="input-border-animation"></div>
                </div>
                {errors.password && (
                  <div className="input-error">
                    <span className="error-icon">!</span>
                    <span className="error-text">{errors.password.message}</span>
                  </div>
                )}
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="form-options">
                <label className="cyber-checkbox">
                  <input
                    {...register('rememberMe')}
                    type="checkbox"
                  />
                  <span className="checkbox-custom"></span>
                  <span className="checkbox-label">Remember me</span>
                </label>
                <Link href="/forgot-password" className="cyber-link">
                  Forgot password?
                </Link>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="cyber-button-primary"
              >
                <span className="button-content">
                  {isSubmitting ? (
                    <>
                      <span className="loading-spinner"></span>
                      AUTHENTICATING...
                    </>
                  ) : (
                    'ACCESS MAINFRAME'
                  )}
                </span>
                <div className="button-glow"></div>
                <div className="button-particles"></div>
              </button>
            </form>

            {/* Social Login Divider */}
            <div className="divider-section">
              <div className="cyber-divider">
                <span className="divider-text">OR CONNECT WITH</span>
              </div>
            </div>

            {/* Social Login Buttons */}
            <div className="social-login-grid">
              <button
                onClick={() => handleSocialLogin('google')}
                disabled={isSubmitting}
                className="social-button google"
              >
                <div className="social-icon">
                  <svg viewBox="0 0 24 24">
                    <path fill="#fff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#fff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#fff" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#fff" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                </div>
                <span>Google</span>
              </button>

              <button
                onClick={() => handleSocialLogin('github')}
                disabled={isSubmitting}
                className="social-button github"
              >
                <div className="social-icon">
                  <svg viewBox="0 0 24 24">
                    <path fill="#fff" d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                </div>
                <span>GitHub</span>
              </button>

              <button
                onClick={() => handleSocialLogin('discord')}
                disabled={isSubmitting}
                className="social-button discord"
              >
                <div className="social-icon">
                  <svg viewBox="0 0 24 24">
                    <path fill="#fff" d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"/>
                  </svg>
                </div>
                <span>Discord</span>
              </button>
            </div>

            {/* Sign Up Link */}
            <div className="signup-section">
              <p className="signup-text">
                New to the grid? 
                <Link href="/register" className="cyber-link-accent">
                  Initialize new user
                </Link>
              </p>
            </div>

            {/* Dev Mode */}
            {process.env.NODE_ENV === 'development' && (
              <div className="dev-mode-panel">
                <div className="dev-mode-header">
                  <span className="dev-icon">⚡</span>
                  <span>DEV MODE ACTIVE</span>
                </div>
                <button
                  onClick={() => {
                    // Quick demo access - manually set form values
                    setValue('email', 'demo@astraldraft.com');
                    setValue('password', 'demo123456');
                  }}
                  className="dev-quick-login"
                >
                  <span>Quick Demo Access</span>
                  <div className="button-scan"></div>
                </button>
                <button
                  onClick={async () => {
                    // Quick register for development
                    try {
                      const testEmail = `test${Date.now()}@astraldraft.com`;
                      const result = await registerMutation.mutateAsync({
                        email: testEmail,
                        password: 'test123456',
                        username: `testuser${Date.now()}`,
                      });
                      if (result) {
                        setValue('email', testEmail);
                        setValue('password', 'test123456');
                        toast.success('Test account created! Click login to continue.');
                      }
                    } catch (err) {
                      console.error('Test registration failed:', err);
                      toast.error('Failed to create test account. Please try again.');
                    }
                  }}
                  disabled={registerMutation.isPending}
                  className="dev-quick-login mt-2"
                >
                  <span>
                    {registerMutation.isPending ? 'Creating Account...' : 'Create Test Account'}
                  </span>
                  <div className="button-scan"></div>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="cyber-footer">
          <div className="footer-links">
            <Link href="/auth/two-factor" className="footer-link">
              <span className="link-icon">🔐</span>
              Two-Factor Auth
            </Link>
            <span className="footer-divider">|</span>
            <Link href="/help" className="footer-link">
              <span className="link-icon">💡</span>
              System Help
            </Link>
          </div>
          <div className="copyright">
            <span className="copyright-text">© 2024 ASTRAL DRAFT | SYSTEM v4.0</span>
          </div>
        </div>
      </div>
    </div>
  );
}