'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { forgotPasswordSchema, type ForgotPasswordFormData } from '@/lib/validation/auth';
import './forgot-password.css';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [submitted, setSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [glitchActive, setGlitchActive] = useState(false);
  const [successAnimation, setSuccessAnimation] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    getValues,
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  useEffect(() => {
    // Trigger glitch effect periodically
    const interval = setInterval(() => {
      setGlitchActive(true);
      setTimeout(() => setGlitchActive(false), 200);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      // TODO: Replace with actual API call
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: data.email }),
      });

      if (response.ok) {
        setSubmittedEmail(data.email);
        setSuccessAnimation(true);
        setTimeout(() => {
          setSubmitted(true);
        }, 500);
        toast.success('Password reset email sent!');
      } else {
        const errorData = await response.json();
        if (errorData.code === 'USER_NOT_FOUND') {
          setError('email', {
            message: 'No account found with this email address.'
          });
        } else {
          setError('root', {
            message: errorData.message || 'Failed to send reset email. Please try again.'
          });
        }
        toast.error(errorData.message || 'Failed to send reset email. Please try again.');
      }
    } catch (err) {
      console.error('Forgot password error:', err);
      setError('root', {
        message: 'An unexpected error occurred. Please try again.'
      });
      toast.error('An unexpected error occurred. Please try again.');
    }
  };

  const handleTryAgain = () => {
    setSubmitted(false);
    setSubmittedEmail('');
    setSuccessAnimation(false);
  };

  if (submitted) {
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

        <div className="forgot-content">
          <div className="success-card glass-morphism">
            <div className="card-glow"></div>
            <div className="card-inner">
              <div className="holographic-strip"></div>
              
              {/* Success Animation */}
              <div className="success-animation">
                <div className="success-circle">
                  <div className="success-circle-inner">
                    <svg className="success-icon" viewBox="0 0 24 24">
                      <defs>
                        <linearGradient id="successGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#00ff88" />
                          <stop offset="100%" stopColor="#00ffff" />
                        </linearGradient>
                      </defs>
                      <path 
                        fill="none" 
                        stroke="url(#successGradient)" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                        d="M20 6L9 17l-5-5"
                      />
                    </svg>
                  </div>
                  <div className="success-pulse"></div>
                  <div className="success-particles">
                    {[...Array(8)].map((_, i) => (
                      <div key={i} className="success-particle" style={{
                        transform: `rotate(${i * 45}deg) translateY(-40px)`,
                        animationDelay: `${i * 0.1}s`
                      }}></div>
                    ))}
                  </div>
                </div>
              </div>

              <h2 className="cyber-title-small" data-text="TRANSMISSION SENT">
                TRANSMISSION SENT
              </h2>
              
              <div className="success-message">
                <p className="success-text">
                  Password reset link transmitted to
                </p>
                <div className="email-display">
                  <div className="email-glow"></div>
                  <span className="email-text">{submittedEmail}</span>
                </div>
              </div>

              <div className="info-panel">
                <div className="info-icon">
                  <svg viewBox="0 0 24 24" className="icon-svg">
                    <path fill="currentColor" d="M13 9h-2V7h2m0 10h-2v-6h2m-1-9A10 10 0 0 0 2 12a10 10 0 0 0 10 10 10 10 0 0 0 10-10A10 10 0 0 0 12 2Z"/>
                  </svg>
                </div>
                <p className="info-text">
                  Check your spam folder if the message doesn&apos;t arrive within 60 seconds
                </p>
              </div>

              <div className="action-buttons">
                <button
                  onClick={handleTryAgain}
                  className="cyber-button-secondary"
                >
                  <span className="button-content">
                    <span>RESEND TRANSMISSION</span>
                  </span>
                  <div className="button-glow"></div>
                </button>

                <Link
                  href="/login"
                  className="cyber-button-primary btn-neon"
                >
                  <span className="button-content">
                    <svg className="back-icon" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
                    </svg>
                    <span>RETURN TO LOGIN</span>
                  </span>
                  <div className="button-glow"></div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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

      <div className="forgot-content">
        {/* Logo and Title with Glitch Effect */}
        <div className="logo-section">
          <div className={`cyber-logo ${glitchActive ? 'glitch' : ''}`}>
            <div className="logo-container">
              <div className="hexagon-logo holographic">
                <svg className="logo-svg" viewBox="0 0 100 100">
                  <defs>
                    <linearGradient id="forgotLogoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#00ffff" />
                      <stop offset="50%" stopColor="#ff00ff" />
                      <stop offset="100%" stopColor="#00ff88" />
                    </linearGradient>
                  </defs>
                  <polygon points="50,5 90,25 90,75 50,95 10,75 10,25" 
                           fill="none" 
                           stroke="url(#forgotLogoGradient)" 
                           strokeWidth="2"
                           className="hexagon-outline" />
                  <text x="50" y="55" textAnchor="middle" 
                        className="logo-text" 
                        fill="url(#forgotLogoGradient)">AD</text>
                </svg>
                <div className="holographic-effect"></div>
              </div>
              <h1 className="cyber-title" data-text="PASSWORD RESET">
                PASSWORD RESET
              </h1>
            </div>
          </div>
          <div className="cyber-subtitle">
            <span className="neon-text">INITIALIZE RECOVERY PROTOCOL</span>
            <div className="pulse-line"></div>
          </div>
        </div>

        {/* Forgot Password Card with Glassmorphism */}
        <div className="forgot-card glass-morphism">
          <div className="card-glow"></div>
          <div className="card-inner">
            <div className="holographic-strip"></div>
            
            <div className="card-header">
              <div className="icon-container">
                <div className="icon-glow"></div>
                <svg className="lock-icon" viewBox="0 0 24 24">
                  <defs>
                    <linearGradient id="lockGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#00ffff" />
                      <stop offset="100%" stopColor="#ff00ff" />
                    </linearGradient>
                  </defs>
                  <path fill="url(#lockGradient)" d="M12 17a2 2 0 0 0 2-2 2 2 0 0 0-2-2 2 2 0 0 0-2 2 2 2 0 0 0 2 2m6-9a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2h1V6a5 5 0 0 1 5-5 5 5 0 0 1 5 5v2h1m-6-5a3 3 0 0 0-3 3v2h6V6a3 3 0 0 0-3-3Z"/>
                </svg>
              </div>
              <p className="header-text">
                Enter your registered email address to receive password reset instructions
              </p>
            </div>
            
            <form className="cyber-form" onSubmit={handleSubmit(onSubmit)}>
              {errors.root && (
                <div className="error-alert cyber-alert">
                  <div className="alert-icon">⚠</div>
                  <span>{errors.root.message}</span>
                  <div className="alert-glow"></div>
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
                  <div className="input-icon">
                    <svg viewBox="0 0 24 24" className="email-icon">
                      <path fill="currentColor" d="M20 8l-8 5-8-5V6l8 5 8-5m0-2H4c-1.11 0-2 .89-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Z"/>
                    </svg>
                  </div>
                  <input
                    {...register('email')}
                    type="email"
                    className={`cyber-input input-neon with-icon ${errors.email ? 'error' : ''}`}
                    placeholder="user@cyberspace.net"
                    autoComplete="email"
                  />
                  <div className="input-border-animation"></div>
                  <div className="input-scan-line"></div>
                </div>
                {errors.email && (
                  <div className="input-error">
                    <span className="error-icon">!</span>
                    <span className="error-text">{errors.email.message}</span>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="cyber-button-primary btn-neon"
              >
                <span className="button-content">
                  {isSubmitting ? (
                    <>
                      <div className="neon-spinner">
                        <div className="spinner-blade"></div>
                        <div className="spinner-blade"></div>
                        <div className="spinner-blade"></div>
                      </div>
                      <span className="loading-text">TRANSMITTING...</span>
                    </>
                  ) : (
                    <>
                      <svg className="send-icon" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M2 21l21-9L2 3v7l15 2-15 2v7z"/>
                      </svg>
                      <span>SEND RESET LINK</span>
                    </>
                  )}
                </span>
                <div className="button-glow"></div>
                <div className="button-particles">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="particle"></div>
                  ))}
                </div>
              </button>

              {/* Back to Login Link */}
              <div className="back-link-container">
                <Link href="/login" className="cyber-link-back">
                  <svg className="back-arrow" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6 1.41-1.41z"/>
                  </svg>
                  <span>Return to Login Terminal</span>
                  <div className="link-scan"></div>
                </Link>
              </div>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="cyber-footer">
          <div className="footer-links">
            <Link href="/help" className="footer-link">
              <span className="link-icon">💡</span>
              System Help
            </Link>
            <span className="footer-divider">|</span>
            <Link href="/register" className="footer-link">
              <span className="link-icon">🚀</span>
              Create Account
            </Link>
          </div>
          <div className="copyright">
            <span className="copyright-text">© 2024 ASTRAL DRAFT | RECOVERY SYSTEM v4.0</span>
          </div>
        </div>
      </div>
    </div>
  );
}