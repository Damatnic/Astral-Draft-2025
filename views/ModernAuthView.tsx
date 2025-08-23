/**
 * Modern Authentication View - Astral Draft
 * Beautiful login/register interface with animations
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MailIcon,
  LockIcon,
  UserIcon,
  EyeIcon,
  EyeOffIcon,
  StarIcon,
  TrophyIcon,
  ZapIcon,
  ShieldIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  AlertCircleIcon
} from 'lucide-react';
import { netlifyAuth } from '../services/netlifyAuthService';
import { useAppState } from '../contexts/AppContext';

interface FormData {
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
}

interface FormErrors {
  email?: string;
  username?: string;
  password?: string;
  confirmPassword?: string;
  general?: string;
}

const ModernAuthView: React.FC = () => {
  const { dispatch } = useAppState();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    email: '',
    username: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [successMessage, setSuccessMessage] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    // Register-specific validation
    if (!isLogin) {
      if (!formData.username) {
        newErrors.username = 'Username is required';
      } else if (formData.username.length < 3) {
        newErrors.username = 'Username must be at least 3 characters';
      }

      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});
    setSuccessMessage('');

    try {
      if (isLogin) {
        const result = await netlifyAuth.login(formData.email, formData.password);
        
        if (result.success) {
          setSuccessMessage('Login successful! Redirecting...');
          // Update app state with authenticated user
          setTimeout(() => {
            const authState = netlifyAuth.getState();
            if (authState.user) {
              dispatch({
                type: 'LOGIN',
                payload: {
                  id: authState.user.id.toString(),
                  name: authState.user.username,
                  email: authState.user.email,
                  avatar: authState.user.avatarUrl || '/default-avatar.png'
                }
              });
            }
          }, 1000);
        } else {
          setErrors({ general: result.error || 'Login failed' });
        }
      } else {
        const result = await netlifyAuth.register(
          formData.email,
          formData.username,
          formData.password
        );
        
        if (result.success) {
          setSuccessMessage('Registration successful! Redirecting...');
          // Update app state with authenticated user
          setTimeout(() => {
            const authState = netlifyAuth.getState();
            if (authState.user) {
              dispatch({
                type: 'LOGIN',
                payload: {
                  id: authState.user.id.toString(),
                  name: authState.user.username,
                  email: authState.user.email,
                  avatar: authState.user.avatarUrl || '/default-avatar.png'
                }
              });
            }
          }, 1000);
        } else {
          setErrors({ general: result.error || 'Registration failed' });
        }
      }
    } catch (error) {
      setErrors({ general: 'An unexpected error occurred. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    { icon: <TrophyIcon className="w-5 h-5" />, text: 'Win championships' },
    { icon: <ZapIcon className="w-5 h-5" />, text: 'AI-powered insights' },
    { icon: <ShieldIcon className="w-5 h-5" />, text: 'Secure & reliable' },
    { icon: <StarIcon className="w-5 h-5" />, text: 'Premium experience' }
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Auth Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-[var(--bg-primary)]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] flex items-center justify-center">
                <StarIcon className="w-7 h-7 text-white" />
              </div>
              <span className="text-2xl font-bold gradient-text">Astral Draft</span>
            </div>
            <p className="text-[var(--text-secondary)]">
              {isLogin ? 'Welcome back, champion!' : 'Join the elite fantasy league'}
            </p>
          </div>

          {/* Success Message */}
          <AnimatePresence>
            {successMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-4 p-4 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-2"
              >
                <CheckCircleIcon className="w-5 h-5 text-green-500" />
                <span className="text-green-500">{successMessage}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error Message */}
          <AnimatePresence>
            {errors.general && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2"
              >
                <AlertCircleIcon className="w-5 h-5 text-red-500" />
                <span className="text-red-500">{errors.general}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Auth Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <div className="relative">
                <MailIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[var(--text-tertiary)]" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full pl-10 pr-4 py-3 rounded-lg bg-[var(--surface-primary)] border ${
                    errors.email ? 'border-red-500' : 'border-[var(--border-primary)]'
                  } focus:border-[var(--primary)] focus:outline-none transition-colors`}
                  placeholder="Enter your email"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-500">{errors.email}</p>
              )}
            </div>

            {/* Username Field (Register only) */}
            <AnimatePresence>
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <label className="block text-sm font-medium mb-2">Username</label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[var(--text-tertiary)]" />
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      className={`w-full pl-10 pr-4 py-3 rounded-lg bg-[var(--surface-primary)] border ${
                        errors.username ? 'border-red-500' : 'border-[var(--border-primary)]'
                      } focus:border-[var(--primary)] focus:outline-none transition-colors`}
                      placeholder="Choose a username"
                    />
                  </div>
                  {errors.username && (
                    <p className="mt-1 text-sm text-red-500">{errors.username}</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <div className="relative">
                <LockIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[var(--text-tertiary)]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`w-full pl-10 pr-12 py-3 rounded-lg bg-[var(--surface-primary)] border ${
                    errors.password ? 'border-red-500' : 'border-[var(--border-primary)]'
                  } focus:border-[var(--primary)] focus:outline-none transition-colors`}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                >
                  {showPassword ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-500">{errors.password}</p>
              )}
            </div>

            {/* Confirm Password Field (Register only) */}
            <AnimatePresence>
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <label className="block text-sm font-medium mb-2">Confirm Password</label>
                  <div className="relative">
                    <LockIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[var(--text-tertiary)]" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className={`w-full pl-10 pr-4 py-3 rounded-lg bg-[var(--surface-primary)] border ${
                        errors.confirmPassword ? 'border-red-500' : 'border-[var(--border-primary)]'
                      } focus:border-[var(--primary)] focus:outline-none transition-colors`}
                      placeholder="Confirm your password"
                    />
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-500">{errors.confirmPassword}</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={isLoading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3 px-4 bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
                  <ArrowRightIcon className="w-5 h-5" />
                </>
              )}
            </motion.button>
          </form>

          {/* Toggle Auth Mode */}
          <div className="mt-6 text-center">
            <p className="text-sm text-[var(--text-secondary)]">
              {isLogin ? "Don't have an account?" : 'Already have an account?'}
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setErrors({});
                  setFormData({ email: '', username: '', password: '', confirmPassword: '' });
                }}
                className="ml-1 text-[var(--primary)] hover:underline font-medium"
              >
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>
        </motion.div>
      </div>

      {/* Right Panel - Features */}
      <div className="hidden lg:flex flex-1 items-center justify-center p-8 bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)]">
        <div className="max-w-md text-white">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-4xl font-bold mb-6"
          >
            Dominate Your League
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-lg mb-8 text-white/90"
          >
            Join thousands of fantasy football enthusiasts using AI-powered insights to build championship teams.
          </motion.p>

          <div className="space-y-4">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                className="flex items-center gap-3"
              >
                <div className="p-2 rounded-lg bg-white/20 backdrop-blur">
                  {feature.icon}
                </div>
                <span className="text-lg">{feature.text}</span>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-12 p-6 rounded-xl bg-white/10 backdrop-blur border border-white/20"
          >
            <div className="flex items-center gap-4 mb-3">
              <div className="flex -space-x-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="w-8 h-8 rounded-full bg-white/30 border-2 border-white" />
                ))}
              </div>
              <span className="text-sm">+2,847 managers</span>
            </div>
            <p className="text-sm text-white/80">
              Join the community of winning fantasy managers today!
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ModernAuthView;