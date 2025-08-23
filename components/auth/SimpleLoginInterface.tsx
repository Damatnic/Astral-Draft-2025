/**
 * Simple Login Interface
 * 10 player buttons + admin login with PIN authentication
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import SimpleAuthService, { SimpleUser } from '../../services/simpleAuthService';

interface Props {
    onLogin: (user: SimpleUser) => void;
    className?: string;
}

interface PinInputProps {
    user: SimpleUser;
    onSuccess: (user: SimpleUser) => void;
    onBack: () => void;
}

const PinInput: React.FC<PinInputProps> = ({ user, onSuccess, onBack }) => {
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handlePinSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (pin.length !== 4) {
            setError('PIN must be 4 digits');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const session = await SimpleAuthService.authenticateUser(user.id, pin);
            if (session) {
                onSuccess(session.user);
            } else {
                setError('Invalid PIN. Please try again.');
                setPin('');
            }
        } catch (err) {
            console.error('Login error:', err);
            setError('Login failed. Please try again.');
            setPin('');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePinChange = (value: string) => {
        // Only allow numbers and limit to 4 digits
        const numericValue = value.replace(/\D/g, '').slice(0, 4);
        setPin(numericValue);
        setError('');
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-gray-800 rounded-2xl p-8 w-full max-w-md mx-auto"
        >
            <div className="text-center mb-6">
                <div 
                    className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl"
                    style={{ backgroundColor: user.customization.backgroundColor }}
                >
                    {user.customization.emoji}
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">
                    Welcome, {user.displayName}!
                </h2>
                <p className="text-gray-400">Enter your 4-digit PIN</p>
            </div>

            <form onSubmit={handlePinSubmit} className="space-y-4">
                <div className="relative">
                    <input
                        type="password"
                        value={pin}
                        onChange={(e: any) => handlePinChange(e.target.value)}
                        placeholder="••••"
                        className="w-full bg-gray-700 text-white text-center text-2xl tracking-[0.5em] rounded-lg px-4 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        maxLength={4}
                        autoFocus
                    />
                    {pin.length > 0 && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            <div className="flex space-x-1">
                                {Array.from({ length: 4 }, (_, i) => (
                                    <div
                                        key={`pin-indicator-${i + 1}`}
                                        className={`w-2 h-2 rounded-full ${
                                            i < pin.length ? 'bg-blue-500' : 'bg-gray-600'
                                        }`}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-2 rounded-lg text-sm text-center"
                    >
                        {error}
                    </motion.div>
                )}

                <div className="flex space-x-3">
                    <button
                        type="button"
                        onClick={onBack}
                        className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 rounded-lg transition-colors"
                    >
                        Back
                    </button>
                    <button
                        type="submit"
                        disabled={pin.length !== 4 || isLoading}
                        className="flex-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-3 px-6 rounded-lg transition-colors font-medium"
                    >
                        {isLoading ? (
                            <div className="flex items-center justify-center">
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                Signing In...
                            </div>
                        ) : (
                            'Sign In'
                        )}
                    </button>
                </div>
            </form>

            {user.id !== 'admin' && (
                <div className="mt-6 pt-6 border-t border-gray-700">
                    <p className="text-xs text-gray-500 text-center">
                        Default PIN is 0000. You can change it after logging in.
                    </p>
                </div>
            )}
        </motion.div>
    );
};

const SimpleLoginInterface: React.FC<Props> = ({ onLogin, className = '' }) => {
    const [users, setUsers] = useState<SimpleUser[]>([]);
    const [selectedUser, setSelectedUser] = useState<SimpleUser | null>(null);

    useEffect(() => {
        // Initialize auth service and load users
        SimpleAuthService.initialize();
        const allUsers = SimpleAuthService.getAllUsers();
        setUsers(allUsers);
    }, []);

    const handleUserSelect = (user: SimpleUser) => {
        setSelectedUser(user);
    };

    const handleLoginSuccess = (user: SimpleUser) => {
        onLogin(user);
        setSelectedUser(null);
    };

    const handleBack = () => {
        setSelectedUser(null);
    };

    if (selectedUser) {
        return (
            <div className={`min-h-screen bg-gray-900 flex items-center justify-center p-4 ${className}`}>
                <PinInput
                    user={selectedUser}
                    onSuccess={handleLoginSuccess}
                    onBack={handleBack}
                />
            </div>
        );
    }

    return (
        <div className={`min-h-screen bg-gray-900 flex items-center justify-center p-4 ${className}`}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-4xl"
            >
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-white mb-2">
                        🔮 Astral Draft Oracle
                    </h1>
                    <p className="text-xl text-gray-400">
                        Choose your player to sign in
                    </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
                    {users.filter((user: any) => !user.isAdmin).map((user, index) => (
                        <motion.button
                            key={user.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleUserSelect(user)}
                            className="btn-primary p-6 rounded-xl text-white font-medium transition-all duration-200 hover:shadow-lg"
                            style={{ backgroundColor: user.customization.backgroundColor }}
                        >
                            <div className="text-3xl mb-2">{user.customization.emoji}</div>
                            <div className="text-lg font-semibold">{user.displayName}</div>
                            <div className="text-sm opacity-75">Click to sign in</div>
                        </motion.button>
                    ))}
                </div>

                {/* Admin Section */}
                <div className="border-t border-gray-700 pt-8">
                    <div className="text-center mb-4">
                        <p className="text-gray-500 text-sm">League Administration</p>
                    </div>
                    
                    {users.filter((user: any) => user.isAdmin).map((admin) => (
                        <motion.button
                            key={admin.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 1.0 }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleUserSelect(admin)}
                            className="w-full max-w-md mx-auto block p-4 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-lg text-white transition-all duration-200"
                        >
                            <div className="flex items-center justify-center space-x-3">
                                <div 
                                    className="w-12 h-12 rounded-full flex items-center justify-center text-xl"
                                    style={{ 
                                        backgroundColor: admin.customization.backgroundColor,
                                        color: admin.customization.textColor 
                                    }}
                                >
                                    {admin.customization.emoji}
                                </div>
                                <div>
                                    <div className="font-semibold text-lg">{admin.displayName}</div>
                                    <div className="text-sm text-gray-400">Administrator Access</div>
                                </div>
                            </div>
                        </motion.button>
                    ))}
                </div>

                <div className="text-center mt-8">
                    <p className="text-xs text-gray-600">
                        Astral Draft Oracle • League Prediction System
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default SimpleLoginInterface;
