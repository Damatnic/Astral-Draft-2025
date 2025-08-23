/**
 * Production Login Interface
 * Comprehensive authentication UI with email/password login,
 * registration, password reset, and email verification
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MailIcon, 
  LockIcon, 
  UserIcon, 
  EyeIcon, 
  EyeOffIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  LoaderIcon,
  ArrowLeftIcon
} from 'lucide-react';
import { useProductionAuth, LoginCredentials, RegisterData } from '../../contexts/ProductionAuthContext';

type ViewType = 'login' | 'register' | 'forgot-password' | 'verify-email';

interface FormErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
  username?: string;
  displayName?: string;
  general?: string;
}

const ProductionLoginInterface: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewType>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [successMessage, setSuccessMessage] = useState('');
  
  // Form data states
  const [loginData, setLoginData] = useState<LoginCredentials>({
    email: '',
    password: '',
    rememberMe: false
  });
  
  const [registerData, setRegisterData] = useState<RegisterData>({
    email: '',
    username: '',
    displayName: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false
  });
  
  const [forgotEmail, setForgotEmail] = useState('');
  const [verificationToken, setVerificationToken] = useState('');

  const { login, register, resetPassword, verifyEmail, resendVerification } = useProductionAuth();

  // Clear messages when view changes
  useEffect(() => {
    setErrors({});
    setSuccessMessage('');
  }, [currentView]);

  // Validation functions
  const validateEmail = (email: string): string | undefined => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) return 'Email is required';
    if (!emailRegex.test(email)) return 'Please enter a valid email address';
    return undefined;
  };

  const validatePassword = (password: string): string | undefined => {
    if (!password) return 'Password is required';
    if (password.length < 8) return 'Password must be at least 8 characters';
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(password)) {
      return 'Password must contain uppercase, lowercase, number, and special character';
    }
    return undefined;
  };

  const validateUsername = (username: string): string | undefined => {
    if (!username) return 'Username is required';
    if (username.length < 3 || username.length > 20) return 'Username must be 3-20 characters';
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) return 'Username can only contain letters, numbers, underscore, or dash';
    return undefined;
  };

  const validateDisplayName = (displayName: string): string | undefined => {
    if (!displayName) return 'Display name is required';
    if (displayName.trim().length < 2 || displayName.trim().length > 30) return 'Display name must be 2-30 characters';
    return undefined;
  };

  // Handle login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    // Validate form
    const emailError = validateEmail(loginData.email);
    if (emailError) {
      setErrors({ email: emailError });
      setIsLoading(false);
      return;
    }

    if (!loginData.password) {
      setErrors({ password: 'Password is required' });
      setIsLoading(false);
      return;
    }

    try {
      const result = await login(loginData);
      if (!result.success) {
        setErrors({ general: result.error || 'Login failed' });
      }
    } catch (error) {
      setErrors({ general: 'An unexpected error occurred' });
    }

    setIsLoading(false);
  };

  // Handle registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    // Validate form
    const validationErrors: FormErrors = {};
    
    const emailError = validateEmail(registerData.email);
    if (emailError) validationErrors.email = emailError;
    
    const usernameError = validateUsername(registerData.username);
    if (usernameError) validationErrors.username = usernameError;
    
    const displayNameError = validateDisplayName(registerData.displayName);
    if (displayNameError) validationErrors.displayName = displayNameError;
    
    const passwordError = validatePassword(registerData.password);
    if (passwordError) validationErrors.password = passwordError;
    
    if (registerData.password !== registerData.confirmPassword) {
      validationErrors.confirmPassword = 'Passwords do not match';
    }
    
    if (!registerData.acceptTerms) {
      validationErrors.general = 'You must accept the terms and conditions';
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setIsLoading(false);
      return;
    }

    try {
      const result = await register(registerData);
      if (result.success) {
        setSuccessMessage('Registration successful! Please check your email to verify your account.');
        setCurrentView('verify-email');
      } else {
        setErrors({ general: result.error || 'Registration failed' });
      }
    } catch (error) {
      setErrors({ general: 'An unexpected error occurred' });
    }

    setIsLoading(false);
  };

  // Handle forgot password
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    const emailError = validateEmail(forgotEmail);
    if (emailError) {
      setErrors({ email: emailError });
      setIsLoading(false);
      return;
    }

    try {
      const result = await resetPassword({ email: forgotEmail });
      if (result.success) {
        setSuccessMessage('Password reset link sent to your email');
      } else {
        setErrors({ general: result.error || 'Failed to send reset email' });
      }
    } catch (error) {
      setErrors({ general: 'An unexpected error occurred' });
    }

    setIsLoading(false);
  };

  // Handle email verification
  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    if (!verificationToken) {
      setErrors({ general: 'Verification token is required' });
      setIsLoading(false);
      return;
    }

    try {
      const result = await verifyEmail(verificationToken);
      if (result.success) {
        setSuccessMessage('Email verified successfully! You can now log in.');
        setCurrentView('login');
      } else {
        setErrors({ general: result.error || 'Verification failed' });
      }
    } catch (error) {
      setErrors({ general: 'An unexpected error occurred' });
    }

    setIsLoading(false);
  };

  // Handle resend verification
  const handleResendVerification = async () => {
    setIsLoading(true);
    setErrors({});

    try {
      const result = await resendVerification();
      if (result.success) {
        setSuccessMessage('Verification email sent! Please check your inbox.');
      } else {
        setErrors({ general: result.error || 'Failed to resend verification' });
      }
    } catch (error) {
      setErrors({ general: 'An unexpected error occurred' });
    }

    setIsLoading(false);
  };

  // Input component with error handling
  const InputField: React.FC<{
    type: string;
    placeholder: string;
    value: string;
    onChange: (value: string) => void;
    error?: string;
    icon: React.ReactNode;
    showPasswordToggle?: boolean;
    onTogglePassword?: () => void;
    showPassword?: boolean;
  }> = ({ type, placeholder, value, onChange, error, icon, showPasswordToggle, onTogglePassword, showPassword }) => (
    <div className="space-y-1">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <div className="text-gray-400">{icon}</div>
        </div>
        <input
          type={showPasswordToggle ? (showPassword ? 'text' : 'password') : type}
          placeholder={placeholder}
          value={value}
          onChange={(e: any) => onChange(e.target.value)}
          className={`
            w-full pl-10 pr-4 py-3 bg-gray-800 border rounded-lg text-white placeholder-gray-400
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            ${error ? 'border-red-500' : 'border-gray-600'}
            ${showPasswordToggle ? 'pr-12' : 'pr-4'}
          `}
        />
        {showPasswordToggle && (
          <button
            type="button"
            onClick={onTogglePassword}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            {showPassword ? (
              <EyeOffIcon className="w-5 h-5 text-gray-400 hover:text-white" />
            ) : (
              <EyeIcon className="w-5 h-5 text-gray-400 hover:text-white" />
            )}
          </button>
        )}
      </div>
      {error && (
        <div className="flex items-center space-x-1 text-red-400 text-sm">
          <AlertCircleIcon className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );

  // Login view
  const LoginView = () => (
    <form onSubmit={handleLogin} className="space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
        <p className="text-gray-400">Sign in to your Astral Draft account</p>
      </div>

      <InputField
        type="email"
        placeholder="Email address"
        value={loginData.email}
        onChange={(value) => setLoginData({ ...loginData, email: value })}
        error={errors.email}
        icon={<MailIcon className="w-5 h-5" />}
      />

      <InputField
        type="password"
        placeholder="Password"
        value={loginData.password}
        onChange={(value) => setLoginData({ ...loginData, password: value })}
        error={errors.password}
        icon={<LockIcon className="w-5 h-5" />}
        showPasswordToggle
        onTogglePassword={() => setShowPassword(!showPassword)}
        showPassword={showPassword}
      />

      <div className="flex items-center justify-between">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={loginData.rememberMe}
            onChange={(e: any) => setLoginData({ ...loginData, rememberMe: e.target.checked })}
            className="rounded border-gray-600 text-blue-500 focus:ring-blue-500 bg-gray-800"
          />
          <span className="ml-2 text-sm text-gray-400">Remember me</span>
        </label>
        <button
          type="button"
          onClick={() => setCurrentView('forgot-password')}
          className="text-sm text-blue-400 hover:text-blue-300"
        >
          Forgot password?
        </button>
      </div>

      {errors.general && (
        <div className="flex items-center space-x-2 text-red-400 text-sm bg-red-900/20 p-3 rounded-lg">
          <AlertCircleIcon className="w-4 h-4" />
          <span>{errors.general}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center space-x-2"
      >
        {isLoading ? (
          <>
            <LoaderIcon className="w-5 h-5 animate-spin" />
            <span>Signing in...</span>
          </>
        ) : (
          <span>Sign In</span>
        )}
      </button>

      <div className="text-center">
        <span className="text-gray-400">Don't have an account? </span>
        <button
          type="button"
          onClick={() => setCurrentView('register')}
          className="text-blue-400 hover:text-blue-300 font-medium"
        >
          Sign up
        </button>
      </div>
    </form>
  );

  // Register view
  const RegisterView = () => (
    <form onSubmit={handleRegister} className="space-y-6">
      <div className="text-center mb-8">
        <button
          type="button"
          onClick={() => setCurrentView('login')}
          className="flex items-center space-x-1 text-gray-400 hover:text-white mx-auto mb-4"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          <span>Back to login</span>
        </button>
        <h1 className="text-3xl font-bold text-white mb-2">Create Account</h1>
        <p className="text-gray-400">Join Astral Draft and start predicting</p>
      </div>

      <InputField
        type="email"
        placeholder="Email address"
        value={registerData.email}
        onChange={(value) => setRegisterData({ ...registerData, email: value })}
        error={errors.email}
        icon={<MailIcon className="w-5 h-5" />}
      />

      <InputField
        type="text"
        placeholder="Username"
        value={registerData.username}
        onChange={(value) => setRegisterData({ ...registerData, username: value })}
        error={errors.username}
        icon={<UserIcon className="w-5 h-5" />}
      />

      <InputField
        type="text"
        placeholder="Display name"
        value={registerData.displayName}
        onChange={(value) => setRegisterData({ ...registerData, displayName: value })}
        error={errors.displayName}
        icon={<UserIcon className="w-5 h-5" />}
      />

      <InputField
        type="password"
        placeholder="Password"
        value={registerData.password}
        onChange={(value) => setRegisterData({ ...registerData, password: value })}
        error={errors.password}
        icon={<LockIcon className="w-5 h-5" />}
        showPasswordToggle
        onTogglePassword={() => setShowPassword(!showPassword)}
        showPassword={showPassword}
      />

      <InputField
        type="password"
        placeholder="Confirm password"
        value={registerData.confirmPassword}
        onChange={(value) => setRegisterData({ ...registerData, confirmPassword: value })}
        error={errors.confirmPassword}
        icon={<LockIcon className="w-5 h-5" />}
        showPasswordToggle
        onTogglePassword={() => setShowConfirmPassword(!showConfirmPassword)}
        showPassword={showConfirmPassword}
      />

      <label className="flex items-start space-x-3">
        <input
          type="checkbox"
          checked={registerData.acceptTerms}
          onChange={(e: any) => setRegisterData({ ...registerData, acceptTerms: e.target.checked })}
          className="rounded border-gray-600 text-blue-500 focus:ring-blue-500 bg-gray-800 mt-1"
        />
        <span className="text-sm text-gray-400">
          I accept the{' '}
          <a href="/terms" className="text-blue-400 hover:text-blue-300">Terms of Service</a>
          {' '}and{' '}
          <a href="/privacy" className="text-blue-400 hover:text-blue-300">Privacy Policy</a>
        </span>
      </label>

      {errors.general && (
        <div className="flex items-center space-x-2 text-red-400 text-sm bg-red-900/20 p-3 rounded-lg">
          <AlertCircleIcon className="w-4 h-4" />
          <span>{errors.general}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center space-x-2"
      >
        {isLoading ? (
          <>
            <LoaderIcon className="w-5 h-5 animate-spin" />
            <span>Creating account...</span>
          </>
        ) : (
          <span>Create Account</span>
        )}
      </button>
    </form>
  );

  // Forgot password view
  const ForgotPasswordView = () => (
    <form onSubmit={handleForgotPassword} className="space-y-6">
      <div className="text-center mb-8">
        <button
          type="button"
          onClick={() => setCurrentView('login')}
          className="flex items-center space-x-1 text-gray-400 hover:text-white mx-auto mb-4"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          <span>Back to login</span>
        </button>
        <h1 className="text-3xl font-bold text-white mb-2">Reset Password</h1>
        <p className="text-gray-400">Enter your email to receive a reset link</p>
      </div>

      <InputField
        type="email"
        placeholder="Email address"
        value={forgotEmail}
        onChange={setForgotEmail}
        error={errors.email}
        icon={<MailIcon className="w-5 h-5" />}
      />

      {errors.general && (
        <div className="flex items-center space-x-2 text-red-400 text-sm bg-red-900/20 p-3 rounded-lg">
          <AlertCircleIcon className="w-4 h-4" />
          <span>{errors.general}</span>
        </div>
      )}

      {successMessage && (
        <div className="flex items-center space-x-2 text-green-400 text-sm bg-green-900/20 p-3 rounded-lg">
          <CheckCircleIcon className="w-4 h-4" />
          <span>{successMessage}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center space-x-2"
      >
        {isLoading ? (
          <>
            <LoaderIcon className="w-5 h-5 animate-spin" />
            <span>Sending reset link...</span>
          </>
        ) : (
          <span>Send Reset Link</span>
        )}
      </button>
    </form>
  );

  // Email verification view
  const VerifyEmailView = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Verify Email</h1>
        <p className="text-gray-400">Enter the verification token from your email</p>
      </div>

      <form onSubmit={handleVerifyEmail} className="space-y-6">
        <InputField
          type="text"
          placeholder="Verification token"
          value={verificationToken}
          onChange={setVerificationToken}
          error={errors.general}
          icon={<MailIcon className="w-5 h-5" />}
        />

        {successMessage && (
          <div className="flex items-center space-x-2 text-green-400 text-sm bg-green-900/20 p-3 rounded-lg">
            <CheckCircleIcon className="w-4 h-4" />
            <span>{successMessage}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center space-x-2"
        >
          {isLoading ? (
            <>
              <LoaderIcon className="w-5 h-5 animate-spin" />
              <span>Verifying...</span>
            </>
          ) : (
            <span>Verify Email</span>
          )}
        </button>
      </form>

      <div className="text-center">
        <span className="text-gray-400">Didn't receive the email? </span>
        <button
          type="button"
          onClick={handleResendVerification}
          disabled={isLoading}
          className="text-blue-400 hover:text-blue-300 font-medium disabled:opacity-50"
        >
          Resend verification
        </button>
      </div>

      <div className="text-center">
        <button
          type="button"
          onClick={() => setCurrentView('login')}
          className="text-gray-400 hover:text-white"
        >
          Back to login
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800 rounded-xl shadow-2xl p-8"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {currentView === 'login' && <LoginView />}
              {currentView === 'register' && <RegisterView />}
              {currentView === 'forgot-password' && <ForgotPasswordView />}
              {currentView === 'verify-email' && <VerifyEmailView />}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};

export default ProductionLoginInterface;
