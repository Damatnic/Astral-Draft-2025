
import React from 'react';
import { motion } from 'framer-motion';
import { useAppState } from '../contexts/AppContext';
import { generateTeamBranding } from '../services/geminiService';
import { LazyImage } from '../components/ui/LazyImage';
import { authService } from '../services/authService';
import type { AuthResponse } from '../services/authService';
import { SparklesIcon } from '../components/icons/SparklesIcon';
import ErrorBoundary from '../components/ui/ErrorBoundary';

type AuthMode = 'login' | 'register';

interface AuthViewProps {
  // No props currently needed, but interface ready for future expansion
}

const AuthView: React.FC<AuthViewProps> = () => {
    const { dispatch } = useAppState();
    const [mode, setMode] = React.useState<AuthMode>('login');
    const [formData, setFormData] = React.useState({
        username: '',
        email: '',
        password: '',
        displayName: '',
        confirmPassword: ''
    });
    const [avatar, setAvatar] = React.useState('🏈');
    const [isGenerating, setIsGenerating] = React.useState(false);
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (error) setError(null); // Clear error when user starts typing
    };

    const validateForm = (): string | null => {
        if (mode === 'register') {
            if (!formData.username.trim()) return 'Username is required';
            if (!formData.email.trim()) return 'Email is required';
            if (!formData.password) return 'Password is required';
            if (formData.password !== formData.confirmPassword) return 'Passwords do not match';
            if (formData.password.length < 6) return 'Password must be at least 6 characters';
            if (!/\S+@\S+\.\S+/.test(formData.email)) return 'Please enter a valid email';
        } else {
            if (!formData.username.trim()) return 'Username is required';
            if (!formData.password) return 'Password is required';
        }
        return null;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const validationError = validateForm();
        if (validationError) {
            setError(validationError);
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            let response: AuthResponse;
            
            if (mode === 'register') {
                response = await authService.register(
                    formData.username,
                    formData.email,
                    formData.password,
                    formData.displayName || formData.username
                );
                
                if (response.success) {
                    // Auto-login after successful registration
                    response = await authService.login(formData.username, formData.password);
                }
            } else {
                response = await authService.login(formData.username, formData.password);
            }

            if (response.success && response.data) {
                // Update app state with authenticated user
                dispatch({
                    type: 'LOGIN',
                    payload: {
                        id: response.data.user.id.toString(),
                        name: response.data.user.display_name || response.data.user.username,
                        avatar,
                        isCommissioner: true, // You might want to get this from the user data
                        memberSince: new Date(response.data.user.created_at).getTime(),
                    }
                });

                dispatch({
                    type: 'ADD_NOTIFICATION',
                    payload: {
                        message: `Welcome ${response.data.user.display_name || response.data.user.username}!`,
                        type: 'SYSTEM'
                    }
                });
            } else {
                setError(response.error || 'Authentication failed');
            }
        } catch (error) {
            console.error('Auth error:', error);
            setError('Something went wrong. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleGenerate = async () => {
        const nameToUse = formData.displayName || formData.username;
        if (!nameToUse.trim()) {
            setError("Please enter a name first.");
            return;
        }
        
        setIsGenerating(true);
        try {
            const branding = await generateTeamBranding(nameToUse);
            if (branding) {
                setAvatar(branding.avatar);
            }
        } catch (error) {
            console.error('Avatar generation failed:', error);
        } finally {
            setIsGenerating(false);
        }
    };

    const switchMode = () => {
        setMode(mode === 'login' ? 'register' : 'login');
        setError(null);
        setFormData({
            username: '',
            email: '',
            password: '',
            displayName: '',
            confirmPassword: ''
        });
    };

    return (
        <div className="w-full h-full flex flex-col items-center justify-center p-4">
             <motion.div
                className="text-center mb-8"
                {...{
                  initial: { opacity: 0, y: -20 },
                  animate: { opacity: 1, y: 0 },
                  transition: { duration: 0.5 },
                }}
             >
                <img src="/favicon.svg" alt="Astral Draft Logo" className="h-16 w-16 mx-auto mb-4" />
                <h1 className="font-display text-4xl font-bold tracking-wider text-white">ASTRAL DRAFT</h1>
                <p className="text-lg text-cyan-200/80">Your AI-Powered Fantasy Commissioner</p>
            </motion.div>

            <motion.form
                onSubmit={handleSubmit}
                className="w-full max-w-md glass-pane p-8 rounded-2xl"
                {...{
                  initial: { opacity: 0, y: 20 },
                  animate: { opacity: 1, y: 0, transition: { delay: 0.2, duration: 0.5 } },
                }}
            >
                <div className="flex justify-center mb-6">
                    <div className="flex bg-gray-800 rounded-lg p-1">
                        <button
                            type="button"
                            onClick={() => setMode('login')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                mode === 'login' ? 'bg-blue-500 text-white' : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            Login
                        </button>
                        <button
                            type="button"
                            onClick={() => setMode('register')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                mode === 'register' ? 'bg-blue-500 text-white' : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            Register
                        </button>
                    </div>
                </div>

                <h2 className="text-xl font-bold text-center mb-4">
                    {mode === 'login' ? 'Welcome Back' : 'Create Your Manager Profile'}
                </h2>

                {error && (
                    <div className="mb-4 p-3 bg-red-900/50 border border-red-500/50 rounded-md text-red-200 text-sm">
                        {error}
                    </div>
                )}

                <div className="space-y-4">
                    <div>
                        <label htmlFor="username" className="block text-sm font-medium text-gray-400 mb-1">
                            Username
                        </label>
                        <input
                            id="username"
                            name="username"
                            type="text"
                            value={formData.username}
                            onChange={handleInputChange}
                            className="w-full bg-black/20 p-3 rounded-md border border-white/10 focus:border-blue-500/50 focus:outline-none"
                            placeholder="Enter your username"
                            required
                        />
                    </div>

                    {mode === 'register' && (
                        <>
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-400 mb-1">
                                    Email
                                </label>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    className="w-full bg-black/20 p-3 rounded-md border border-white/10 focus:border-blue-500/50 focus:outline-none"
                                    placeholder="Enter your email"
                                    required
                                />
                            </div>

                            <div>
                                <label htmlFor="displayName" className="block text-sm font-medium text-gray-400 mb-1">
                                    Display Name (Optional)
                                </label>
                                <input
                                    id="displayName"
                                    name="displayName"
                                    type="text"
                                    value={formData.displayName}
                                    onChange={handleInputChange}
                                    className="w-full bg-black/20 p-3 rounded-md border border-white/10 focus:border-blue-500/50 focus:outline-none"
                                    placeholder="e.g., Alex Johnson"
                                />
                            </div>
                        </>
                    )}

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-400 mb-1">
                            Password
                        </label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            value={formData.password}
                            onChange={handleInputChange}
                            className="w-full bg-black/20 p-3 rounded-md border border-white/10 focus:border-blue-500/50 focus:outline-none"
                            placeholder="Enter your password"
                            required
                        />
                    </div>

                    {mode === 'register' && (
                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-400 mb-1">
                                Confirm Password
                            </label>
                            <input
                                id="confirmPassword"
                                name="confirmPassword"
                                type="password"
                                value={formData.confirmPassword}
                                onChange={handleInputChange}
                                className="w-full bg-black/20 p-3 rounded-md border border-white/10 focus:border-blue-500/50 focus:outline-none"
                                placeholder="Confirm your password"
                                required
                            />
                        </div>
                    )}

                    {mode === 'register' && (
                        <div>
                            <label htmlFor="avatar" className="block text-sm font-medium text-gray-400 mb-1">
                                Avatar (Emoji)
                            </label>
                            <div className="flex items-center gap-2">
                                <input
                                    id="avatar"
                                    type="text"
                                    value={avatar}
                                    onChange={(e) => setAvatar(e.target.value)}
                                    className="w-full bg-black/20 p-3 rounded-md border border-white/10 focus:border-blue-500/50 focus:outline-none"
                                    maxLength={2}
                                    placeholder="🏈"
                                />
                                <button 
                                    type="button" 
                                    onClick={handleGenerate} 
                                    disabled={isGenerating}
                                    className="p-3 bg-purple-500/20 text-purple-300 rounded-md hover:bg-purple-500/30 disabled:opacity-50"
                                >
                                    {isGenerating ? (
                                        <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                                    ) : (
                                        <SparklesIcon />
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full mt-6 py-3 bg-gradient-to-r from-green-500 to-cyan-500 text-white font-bold rounded-lg shadow-lg btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSubmitting ? (
                        <div className="flex items-center justify-center">
                            <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin mr-2"></div>
                            {mode === 'login' ? 'Signing In...' : 'Creating Account...'}
                        </div>
                    ) : (
                        mode === 'login' ? 'Sign In' : 'Start My Dynasty'
                    )}
                </button>

                <div className="mt-4 text-center text-sm text-gray-400">
                    {mode === 'login' ? (
                        <span>
                            Don't have an account?{' '}
                            <button
                                type="button"
                                onClick={switchMode}
                                className="text-blue-400 hover:text-blue-300 underline"
                            >
                                Sign up
                            </button>
                        </span>
                    ) : (
                        <span>
                            Already have an account?{' '}
                            <button
                                type="button"
                                onClick={switchMode}
                                className="text-blue-400 hover:text-blue-300 underline"
                            >
                                Sign in
                            </button>
                        </span>
                    )}
                </div>
            </motion.form>
        </div>
    );
};

const AuthViewWithErrorBoundary: React.FC<AuthViewProps> = (props) => (
    <ErrorBoundary>
        <AuthView {...props} />
    </ErrorBoundary>
);

export default AuthViewWithErrorBoundary;
