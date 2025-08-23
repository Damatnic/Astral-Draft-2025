import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { oauthService } from '../../../services/oauthService';
import { useAuth } from '../../../contexts/AuthContext';
import { CheckIcon, LinkIcon, UnlinkIcon, AlertCircleIcon } from 'lucide-react';

interface OAuthButtonProps {
  provider: {
    id: string;
    name: string;
  };
  isLoading?: boolean;
  onClick: () => void;
  className?: string;
}

const OAuthButton: React.FC<OAuthButtonProps> = ({ 
  provider, 
  isLoading = false, 
  onClick, 
  className = '' 
}) => {
  const getProviderIcon = (providerId: string) => {
    switch (providerId) {
      case 'google':
        return (
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
        );
      case 'discord':
        return (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#5865F2">
            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
          </svg>
        );
      case 'github':
        return (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
          </svg>
        );
      default:
        return <LinkIcon className="w-5 h-5" />;
    }
  };

  return (
    <motion.button
      onClick={onClick}
      disabled={isLoading}
      className={`
        relative w-full flex items-center justify-center gap-3 
        px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600
        bg-white dark:bg-gray-800 
        text-gray-700 dark:text-gray-200
        hover:bg-gray-50 dark:hover:bg-gray-700
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-all duration-200
        ${className}
      `}
      whileHover={{ scale: isLoading ? 1 : 1.02 }}
      whileTap={{ scale: isLoading ? 1 : 0.98 }}
    >
      {isLoading ? (
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current" />
      ) : (
        getProviderIcon(provider.id)
      )}
      <span className="font-medium">
        Continue with {provider.name}
      </span>
    </motion.button>
  );
};

interface OAuthLoginComponentProps {
  onSuccess?: (user: any) => void;
  onError?: (error: string) => void;
  className?: string;
}

export const OAuthLoginComponent: React.FC<OAuthLoginComponentProps> = ({
  onSuccess,
  onError,
  className = ''
}) => {
  const { isAuthenticated } = useAuth();
  const [providers, setProviders] = useState<any[]>([]);
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const availableProviders = oauthService.getAvailableProviders();
    setProviders(availableProviders);
  }, []);

  useEffect(() => {
    // Handle OAuth callback if we're on a callback URL
    const handleCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const state = urlParams.get('state');
      const error = urlParams.get('error');
      
      if (error) {
        const errorMessage = urlParams.get('error_description') || 'OAuth authentication failed';
        setError(errorMessage);
        onError?.(errorMessage);
        return;
      }

      if (code && state) {
        // Extract provider from current path
        const pathParts = window.location.pathname.split('/');
        const callbackIndex = pathParts.indexOf('callback');
        const provider = callbackIndex !== -1 ? pathParts[callbackIndex + 1] : null;

        if (provider) {
          setLoadingProvider(provider);
          try {
            const result = await oauthService.handleCallback(provider, code, state);
            
            if (result.success) {
              onSuccess?.(result.user);
              
              // Redirect to the page user was on before auth
              const redirectPath = sessionStorage.getItem('oauth_redirect_after_auth') || '/dashboard';
              sessionStorage.removeItem('oauth_redirect_after_auth');
              window.history.replaceState({}, '', redirectPath);
            } else {
              setError(result.error || 'OAuth authentication failed');
              onError?.(result.error || 'OAuth authentication failed');
            }
          } catch (err) {
            const errorMessage = 'OAuth authentication failed';
            setError(errorMessage);
            onError?.(errorMessage);
          } finally {
            setLoadingProvider(null);
          }
        }
      }
    };

    handleCallback();
  }, [onSuccess, onError]);

  const handleOAuthLogin = async (providerId: string) => {
    if (isAuthenticated) return;
    
    setError(null);
    setLoadingProvider(providerId);
    
    try {
      await oauthService.initiateLogin(providerId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'OAuth login failed';
      setError(errorMessage);
      onError?.(errorMessage);
      setLoadingProvider(null);
    }
  };

  if (isAuthenticated) {
    return null; // Don't show OAuth options if already authenticated
  }

  return (
    <div className={`oauth-login ${className}`}>
      <div className="space-y-3">
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
            >
              <AlertCircleIcon className="w-4 h-4 text-red-500" />
              <span className="text-sm text-red-700 dark:text-red-300">{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {providers.length > 0 && (
          <>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-600" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400">
                  Or continue with
                </span>
              </div>
            </div>

            <div className="space-y-2">
              {providers.map((provider) => (
                <OAuthButton
                  key={provider.id}
                  provider={provider}
                  isLoading={loadingProvider === provider.id}
                  onClick={() => handleOAuthLogin(provider.id)}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

interface LinkedAccountsManagerProps {
  className?: string;
}

export const LinkedAccountsManager: React.FC<LinkedAccountsManagerProps> = ({
  className = ''
}) => {
  const { isAuthenticated } = useAuth();
  const [linkedAccounts, setLinkedAccounts] = useState<any[]>([]);
  const [availableProviders, setAvailableProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    const loadData = async () => {
      setLoading(true);
      try {
        const [accountsResult, providers] = await Promise.all([
          oauthService.getLinkedAccounts(),
          Promise.resolve(oauthService.getAvailableProviders())
        ]);

        if (accountsResult.success) {
          setLinkedAccounts(accountsResult.accounts || []);
        }
        setAvailableProviders(providers);
      } catch (error) {
        console.error('Failed to load linked accounts:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isAuthenticated]);

  const handleLinkAccount = async (providerId: string) => {
    setActionLoading(providerId);
    try {
      await oauthService.initiateLogin(providerId);
    } catch (error) {
      console.error('Failed to initiate account linking:', error);
      setActionLoading(null);
    }
  };

  const handleUnlinkAccount = async (providerId: string) => {
    setActionLoading(providerId);
    try {
      const result = await oauthService.unlinkAccount(providerId);
      if (result.success) {
        setLinkedAccounts(prev => prev.filter((account: any) => account.provider !== providerId));
      }
    } catch (error) {
      console.error('Failed to unlink account:', error);
    } finally {
      setActionLoading(null);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  if (loading) {
    return (
      <div className={`${className} animate-pulse`}>
        <div className="space-y-3">
          {[1, 2, 3].map((i: any) => (
            <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`linked-accounts-manager ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Connected Accounts
      </h3>
      
      <div className="space-y-3">
        {availableProviders.map((provider) => {
          const linkedAccount = linkedAccounts.find((account: any) => account.provider === provider.id);
          const isLinked = !!linkedAccount;
          const isLoading = actionLoading === provider.id;

          return (
            <motion.div
              key={provider.id}
              className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 flex items-center justify-center">
                  {/* Provider icon would go here */}
                  <span className="text-lg">
                    {provider.id === 'google' ? '🔍' : 
                     provider.id === 'discord' ? '💬' :
                     provider.id === 'github' ? '🐱' : '🔗'}
                  </span>
                </div>
                <div>
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    {provider.name}
                  </div>
                  {isLinked && linkedAccount && (
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Connected as {linkedAccount.email || linkedAccount.username}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isLinked && (
                  <CheckIcon className="w-4 h-4 text-green-500" />
                )}
                
                <motion.button
                  onClick={() => isLinked ? handleUnlinkAccount(provider.id) : handleLinkAccount(provider.id)}
                  disabled={isLoading}
                  className={`
                    px-3 py-1 rounded text-sm font-medium transition-colors
                    ${isLinked 
                      ? 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/40' 
                      : 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/40'
                    }
                    disabled:opacity-50 disabled:cursor-not-allowed
                  `}
                  whileHover={{ scale: isLoading ? 1 : 1.05 }}
                  whileTap={{ scale: isLoading ? 1 : 0.95 }}
                >
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                  ) : (
                    <>
                      {isLinked ? (
                        <>
                          <UnlinkIcon className="w-3 h-3 inline mr-1" />
                          Unlink
                        </>
                      ) : (
                        <>
                          <LinkIcon className="w-3 h-3 inline mr-1" />
                          Link
                        </>
                      )}
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default OAuthLoginComponent;
