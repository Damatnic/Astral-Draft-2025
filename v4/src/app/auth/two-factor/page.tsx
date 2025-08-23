/**
 * Two-factor authentication page with 6-digit code input and QR code setup
 * Enhanced with cyberpunk design system
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import toast from 'react-hot-toast';
import './two-factor.css';

import { useAuth } from '../../../hooks/useAuth';
import { twoFactorSchema, type TwoFactorFormData } from '../../../lib/validation/auth';

type TwoFactorMode = 'verify' | 'setup';

export default function TwoFactorPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { verifyTwoFactor, isLoading } = useAuth();
  
  const [mode, setMode] = useState<TwoFactorMode>('verify');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [secret, setSecret] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [setupStep, setSetupStep] = useState(1);
  
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const isSetup = searchParams?.get('setup') === 'true';

  useEffect(() => {
    if (isSetup) {
      setMode('setup');
      generateTwoFactorSecret();
    }
  }, [isSetup]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<TwoFactorFormData>({
    resolver: zodResolver(twoFactorSchema),
    defaultValues: {
      code: '',
    },
  });

  const watchedCode = watch('code');

  const generateTwoFactorSecret = async () => {
    try {
      const response = await fetch('/api/auth/2fa/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const result = await response.json();

      if (response.ok) {
        setQrCodeUrl(result.qrCodeUrl);
        setSecret(result.secret);
        setBackupCodes(result.backupCodes);
      } else {
        toast.error(result.message || 'Failed to generate 2FA setup');
      }
    } catch (error) {
      toast.error('Error setting up two-factor authentication');
    }
  };

  const onSubmit = async (data: TwoFactorFormData) => {
    if (mode === 'setup') {
      // Enable 2FA
      try {
        const response = await fetch('/api/auth/2fa/enable', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: data.code, secret }),
        });

        const result = await response.json();

        if (response.ok) {
          toast.success('Two-factor authentication enabled successfully!');
          setSetupStep(3); // Show backup codes
        } else {
          toast.error(result.message || 'Failed to enable 2FA');
        }
      } catch (error) {
        toast.error('Error enabling two-factor authentication');
      }
    } else {
      // Verify 2FA code
      await verifyTwoFactor(data);
    }
  };

  const handleInputChange = (index: number, value: string) => {
    if (value.length > 1) return;
    
    const newCode = watchedCode.split('');
    newCode[index] = value;
    const updatedCode = newCode.join('');
    
    setValue('code', updatedCode);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !watchedCode[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    if (/^\d+$/.test(pastedData)) {
      setValue('code', pastedData.padEnd(6, ''));
      inputRefs.current[Math.min(pastedData.length, 5)]?.focus();
    }
  };

  if (mode === 'setup') {
    if (setupStep === 1) {
      return (
        <>
          <title>Set Up Two-Factor Authentication - Astral Draft</title>
          <meta name="description" content="Set up two-factor authentication to secure your Astral Draft account." />
          <meta name="robots" content="noindex" />
          
          <div className="cyberpunk-container">
            {/* Animated Background */}
            <div className="matrix-rain"></div>
            <div className="cyber-grid"></div>
            <div className="scanning-line"></div>
            
            {/* Floating particles */}
            <div className="particles">
              {[...Array(15)].map((_, i) => (
                <div key={i} className="particle" style={{
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 5}s`,
                  animationDuration: `${15 + Math.random() * 10}s`
                }}></div>
              ))}
            </div>

            <div className="twofa-content">
              <div className="twofa-card glass-morphism">
                <div className="card-glow"></div>
                <div className="card-inner">
                  <div className="holographic-strip"></div>
                  
                  <div className="twofa-header">
                    <div className="security-icon-container">
                      <div className="security-icon-glow"></div>
                      <svg className="security-icon" viewBox="0 0 24 24" fill="none">
                        <path d="M12 2L4 7V12C4 16.5 6.84 20.74 11 21.93C11.34 22.02 11.67 22.02 12 21.93C16.16 20.74 20 16.5 20 12V7L12 2Z" stroke="url(#securityGradient)" strokeWidth="2"/>
                        <path d="M12 7V12M12 16H12.01" stroke="url(#securityGradient)" strokeWidth="2" strokeLinecap="round"/>
                        <defs>
                          <linearGradient id="securityGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#00ffff" />
                            <stop offset="50%" stopColor="#ff00ff" />
                            <stop offset="100%" stopColor="#00ff88" />
                          </linearGradient>
                        </defs>
                      </svg>
                    </div>
                    <h1 className="cyber-title" data-text="SECURITY PROTOCOL">
                      SECURITY PROTOCOL
                    </h1>
                    <div className="cyber-subtitle">
                      <span className="neon-text">INITIALIZE TWO-FACTOR AUTH</span>
                      <div className="pulse-line"></div>
                    </div>
                  </div>

                  <div className="setup-content">
                    <div className="instruction-panel">
                      <div className="panel-header">
                        <span className="panel-icon">📱</span>
                        <span className="panel-title">SCAN MATRIX CODE</span>
                      </div>
                      <p className="panel-description">
                        Synchronize your authenticator app with the quantum matrix
                      </p>
                    </div>

                    {qrCodeUrl && (
                      <div className="qr-container">
                        <div className="qr-frame">
                          <div className="corner-accent top-left"></div>
                          <div className="corner-accent top-right"></div>
                          <div className="corner-accent bottom-left"></div>
                          <div className="corner-accent bottom-right"></div>
                          <div className="qr-scan-line"></div>
                          <img 
                            src={qrCodeUrl} 
                            alt="Two-factor authentication QR code"
                            className="qr-image"
                            width={200}
                            height={200}
                          />
                        </div>
                      </div>
                    )}

                    {secret && (
                      <div className="manual-code-panel">
                        <div className="code-header">
                          <span className="code-icon">🔑</span>
                          <span className="code-title">MANUAL OVERRIDE</span>
                        </div>
                        <div className="secret-code">
                          <code className="code-display">{secret}</code>
                          <button 
                            className="copy-button"
                            onClick={() => {
                              navigator.clipboard.writeText(secret);
                              toast.success('Secret copied to clipboard');
                            }}
                          >
                            <svg className="copy-icon" viewBox="0 0 24 24" fill="none">
                              <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="2"/>
                              <path d="M5 15H4C2.89543 15 2 14.1046 2 13V4C2 2.89543 2.89543 2 4 2H13C14.1046 2 15 2.89543 15 4V5" stroke="currentColor" strokeWidth="2"/>
                            </svg>
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="authenticator-list">
                      <div className="list-header">COMPATIBLE PROTOCOLS</div>
                      <div className="app-grid">
                        <div className="app-item">
                          <div className="app-icon google">G</div>
                          <span>Google Auth</span>
                        </div>
                        <div className="app-item">
                          <div className="app-icon microsoft">M</div>
                          <span>Microsoft</span>
                        </div>
                        <div className="app-item">
                          <div className="app-icon authy">A</div>
                          <span>Authy</span>
                        </div>
                        <div className="app-item">
                          <div className="app-icon onepass">1P</div>
                          <span>1Password</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => setSetupStep(2)}
                      className="cyber-button-primary"
                      disabled={!qrCodeUrl}
                    >
                      <span className="button-content">
                        CONFIRM SYNCHRONIZATION
                      </span>
                      <div className="button-glow"></div>
                      <div className="button-particles"></div>
                    </button>

                    <div className="skip-section">
                      <Link href="/dashboard" className="cyber-link-dim">
                        <span className="link-icon">⏭</span>
                        Skip initialization
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      );
    }

    if (setupStep === 3) {
      return (
        <>
          <title>Backup Codes - Astral Draft</title>
          <meta name="description" content="Save your backup codes for two-factor authentication." />
          <meta name="robots" content="noindex" />
          
          <div className="cyberpunk-container">
            {/* Animated Background */}
            <div className="matrix-rain"></div>
            <div className="cyber-grid"></div>
            <div className="scanning-line"></div>
            
            {/* Floating particles */}
            <div className="particles">
              {[...Array(15)].map((_, i) => (
                <div key={i} className="particle" style={{
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 5}s`,
                  animationDuration: `${15 + Math.random() * 10}s`
                }}></div>
              ))}
            </div>

            <div className="twofa-content">
              <div className="twofa-card glass-morphism">
                <div className="card-glow"></div>
                <div className="card-inner">
                  <div className="holographic-strip"></div>
                  
                  <div className="twofa-header">
                    <div className="backup-icon-container">
                      <div className="backup-icon-glow"></div>
                      <svg className="backup-icon" viewBox="0 0 24 24" fill="none">
                        <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" 
                              stroke="url(#backupGradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <defs>
                          <linearGradient id="backupGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#00ff88" />
                            <stop offset="100%" stopColor="#00ffff" />
                          </linearGradient>
                        </defs>
                      </svg>
                    </div>
                    <h1 className="cyber-title success" data-text="SECURITY ENABLED">
                      SECURITY ENABLED
                    </h1>
                    <div className="cyber-subtitle">
                      <span className="neon-text success">BACKUP ACCESS CODES</span>
                      <div className="pulse-line success"></div>
                    </div>
                  </div>

                  <div className="backup-content">
                    <div className="warning-panel">
                      <div className="warning-icon">⚠</div>
                      <div className="warning-content">
                        <div className="warning-title">CRITICAL SECURITY NOTICE</div>
                        <div className="warning-text">
                          Store these recovery codes in a secure vault. Each code can only be used once for emergency access.
                        </div>
                      </div>
                    </div>

                    <div className="codes-container">
                      <div className="codes-header">
                        <span className="codes-title">RECOVERY MATRIX</span>
                        <div className="codes-status">ACTIVE</div>
                      </div>
                      <div className="codes-grid">
                        {backupCodes.map((code, index) => (
                          <div key={index} className="code-item">
                            <span className="code-index">{String(index + 1).padStart(2, '0')}</span>
                            <code className="code-value">{code}</code>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="action-buttons">
                      <button
                        onClick={() => {
                          const text = backupCodes.join('\n');
                          navigator.clipboard.writeText(text);
                          toast.success('Backup codes copied to quantum clipboard');
                        }}
                        className="cyber-button-secondary"
                      >
                        <span className="button-content">
                          <svg className="button-icon" viewBox="0 0 24 24" fill="none">
                            <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="2"/>
                            <path d="M5 15H4C2.89543 15 2 14.1046 2 13V4C2 2.89543 2.89543 2 4 2H13C14.1046 2 15 2.89543 15 4V5" stroke="currentColor" strokeWidth="2"/>
                          </svg>
                          COPY TO CLIPBOARD
                        </span>
                        <div className="button-glow secondary"></div>
                      </button>

                      <button
                        onClick={() => router.push('/dashboard')}
                        className="cyber-button-primary"
                      >
                        <span className="button-content">
                          ACCESS MAINFRAME
                        </span>
                        <div className="button-glow"></div>
                        <div className="button-particles"></div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      );
    }
  }

  return (
    <>
      <title>Two-Factor Authentication - Astral Draft</title>
      <meta name="description" content="Enter your two-factor authentication code to complete sign in." />
      <meta name="robots" content="noindex" />
      
      <div className="cyberpunk-container">
        {/* Animated Background */}
        <div className="matrix-rain"></div>
        <div className="cyber-grid"></div>
        <div className="scanning-line"></div>
        
        {/* Floating particles */}
        <div className="particles">
          {[...Array(15)].map((_, i) => (
            <div key={i} className="particle" style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${15 + Math.random() * 10}s`
            }}></div>
          ))}
        </div>

        <div className="twofa-content">
          <div className="twofa-card glass-morphism">
            <div className="card-glow"></div>
            <div className="card-inner">
              <div className="holographic-strip"></div>
              
              <div className="twofa-header">
                <div className="verify-icon-container">
                  <div className="verify-icon-glow"></div>
                  <svg className="verify-icon" viewBox="0 0 24 24" fill="none">
                    <path d="M9 12.75L11.25 15L15 9.75M21 12C21 13.1819 20.7672 14.3522 20.3149 15.4442C19.8626 16.5361 19.1997 17.5282 18.364 18.364C17.5282 19.1997 16.5361 19.8626 15.4442 20.3149C14.3522 20.7672 13.1819 21 12 21C10.8181 21 9.64778 20.7672 8.55585 20.3149C7.46392 19.8626 6.47177 19.1997 5.63604 18.364C4.80031 17.5282 4.13738 16.5361 3.68508 15.4442C3.23279 14.3522 3 13.1819 3 12C3 9.61305 3.94821 7.32387 5.63604 5.63604C7.32387 3.94821 9.61305 3 12 3C14.3869 3 16.6761 3.94821 18.364 5.63604C20.0518 7.32387 21 9.61305 21 12Z" 
                          stroke="url(#verifyGradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <defs>
                      <linearGradient id="verifyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#00ffff" />
                        <stop offset="50%" stopColor="#ff00ff" />
                        <stop offset="100%" stopColor="#00ff88" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
                <h1 className="cyber-title" data-text={mode === 'setup' ? 'VERIFY SETUP' : 'AUTHENTICATION'}>
                  {mode === 'setup' ? 'VERIFY SETUP' : 'AUTHENTICATION'}
                </h1>
                <div className="cyber-subtitle">
                  <span className="neon-text">ENTER SECURITY CODE</span>
                  <div className="pulse-line"></div>
                </div>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="verify-form">
                {errors.root && (
                  <div className="error-alert cyber-alert">
                    <div className="alert-icon">⚠</div>
                    <span>{errors.root.message}</span>
                  </div>
                )}

                <div className="code-input-section">
                  <label className="cyber-label">
                    <span className="label-text">AUTHENTICATION MATRIX</span>
                    <span className="label-accent"></span>
                  </label>
                  
                  <div className="code-inputs" onPaste={handlePaste}>
                    {[0, 1, 2, 3, 4, 5].map((index) => (
                      <div key={index} className="code-input-wrapper">
                        <input
                          ref={(el) => {
                            inputRefs.current[index] = el;
                          }}
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={1}
                          className="code-input"
                          value={watchedCode[index] || ''}
                          onChange={(e) => handleInputChange(index, e.target.value)}
                          onKeyDown={(e) => handleKeyDown(index, e)}
                          autoComplete="off"
                        />
                        <div className="code-input-glow"></div>
                      </div>
                    ))}
                  </div>
                  
                  {errors.code && (
                    <p className="error-message">{errors.code.message}</p>
                  )}
                  
                  <p className="code-hint">
                    <span className="hint-icon">💡</span>
                    Enter the 6-digit code from your authenticator matrix
                  </p>
                </div>

                <button
                  type="submit"
                  className="cyber-button-primary"
                  disabled={isSubmitting || isLoading || watchedCode.length !== 6}
                >
                  <span className="button-content">
                    {isSubmitting || isLoading ? (
                      <>
                        <span className="loading-spinner"></span>
                        VERIFYING...
                      </>
                    ) : (
                      mode === 'setup' ? 'ENABLE SECURITY' : 'VERIFY ACCESS'
                    )}
                  </span>
                  <div className="button-glow"></div>
                  <div className="button-particles"></div>
                </button>
              </form>

              <div className="footer-links">
                <Link href="/login" className="cyber-link">
                  <span className="link-icon">←</span>
                  Return to Login
                </Link>
                <span className="footer-divider">|</span>
                <Link href="/auth/backup-codes" className="cyber-link-accent">
                  <span className="link-icon">🔑</span>
                  Use Backup Code
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}