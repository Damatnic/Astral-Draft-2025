/**
 * Enhanced OAuth Authentication Service
 * Supports Google, Discord, and GitHub OAuth providers with secure token management
 */

import { authService } from './authService';

export interface OAuthProvider {
  id: 'google' | 'discord' | 'github';
  name: string;
  clientId: string;
  redirectUri: string;
  scope: string;
  authUrl: string;
}

export interface OAuthUser {
  provider: string;
  providerId: string;
  email: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
}

export interface OAuthResponse {
  success: boolean;
  user?: OAuthUser;
  sessionToken?: string;
  error?: string;
}

class OAuthService {
  private readonly providers: Record<string, OAuthProvider>;
  private readonly baseUrl: string;

  constructor() {
    this.baseUrl = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:3001';
    
    this.providers = {
      google: {
        id: 'google',
        name: 'Google',
        clientId: (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID || '',
        redirectUri: `${window.location.origin}/auth/callback/google`,
        scope: 'openid email profile',
        authUrl: 'https://accounts.google.com/o/oauth2/v2/auth'
      },
      discord: {
        id: 'discord',
        name: 'Discord',
        clientId: (import.meta as any).env?.VITE_DISCORD_CLIENT_ID || '',
        redirectUri: `${window.location.origin}/auth/callback/discord`,
        scope: 'identify email',
        authUrl: 'https://discord.com/api/oauth2/authorize'
      },
      github: {
        id: 'github',
        name: 'GitHub',
        clientId: (import.meta as any).env?.VITE_GITHUB_CLIENT_ID || '',
        redirectUri: `${window.location.origin}/auth/callback/github`,
        scope: 'user:email',
        authUrl: 'https://github.com/login/oauth/authorize'
      }
    };
  }

  /**
   * Get OAuth provider configuration
   */
  getProvider(providerId: string): OAuthProvider | null {
    return this.providers[providerId] || null;
  }

  /**
   * Get all available OAuth providers
   */
  getAvailableProviders(): OAuthProvider[] {
    return Object.values(this.providers).filter(provider => provider.clientId);
  }

  /**
   * Generate OAuth authorization URL with PKCE support
   */
  async generateAuthUrl(providerId: string, state?: string): Promise<string | null> {
    const provider = this.getProvider(providerId);
    if (!provider) {
      console.error(`OAuth provider '${providerId}' not found`);
      return null;
    }

    // Generate PKCE challenge for enhanced security
    const codeVerifier = this.generateCodeVerifier();
    const codeChallenge = await this.generateCodeChallenge(codeVerifier);
    
    // Store code verifier for later verification
    sessionStorage.setItem(`oauth_verifier_${providerId}`, codeVerifier);
    
    const params = new URLSearchParams({
      client_id: provider.clientId,
      redirect_uri: provider.redirectUri,
      scope: provider.scope,
      response_type: 'code',
      state: state || this.generateState(),
      code_challenge: codeChallenge,
      code_challenge_method: 'S256'
    });

    // Provider-specific parameters
    if (providerId === 'google') {
      params.append('access_type', 'offline');
      params.append('prompt', 'consent');
    }

    return `${provider.authUrl}?${params.toString()}`;
  }

  /**
   * Handle OAuth callback and exchange code for tokens
   */
  async handleCallback(providerId: string, code: string, state: string): Promise<OAuthResponse> {
    try {
      const codeVerifier = sessionStorage.getItem(`oauth_verifier_${providerId}`);
      if (!codeVerifier) {
        throw new Error('OAuth code verifier not found');
      }

      const response = await fetch(`${this.baseUrl}/api/auth/oauth/callback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          provider: providerId,
          code,
          codeVerifier,
          state
        })
      });

      const data = await response.json();

      if (data.success && data.user && data.sessionToken) {
        // Clean up stored verifier
        sessionStorage.removeItem(`oauth_verifier_${providerId}`);
        
        // Store auth data using existing auth service
        await authService.setSession(data.user, data.sessionToken);
        
        return {
          success: true,
          user: data.user,
          sessionToken: data.sessionToken
        };
      }

      return {
        success: false,
        error: data.error || 'OAuth authentication failed'
      };
    } catch (error) {
      console.error('OAuth callback error:', error);
      return {
        success: false,
        error: 'OAuth authentication failed'
      };
    }
  }

  /**
   * Link OAuth account to existing user
   */
  async linkAccount(providerId: string, code: string): Promise<OAuthResponse> {
    try {
      const codeVerifier = sessionStorage.getItem(`oauth_verifier_${providerId}`);
      const sessionToken = authService.getSessionToken();

      if (!codeVerifier || !sessionToken) {
        throw new Error('Missing required authentication data');
      }

      const response = await fetch(`${this.baseUrl}/api/auth/oauth/link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`
        },
        body: JSON.stringify({
          provider: providerId,
          code,
          codeVerifier
        })
      });

      const data = await response.json();
      
      // Clean up stored verifier
      sessionStorage.removeItem(`oauth_verifier_${providerId}`);
      
      return data;
    } catch (error) {
      console.error('OAuth account linking error:', error);
      return {
        success: false,
        error: 'Failed to link OAuth account'
      };
    }
  }

  /**
   * Unlink OAuth account
   */
  async unlinkAccount(providerId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const sessionToken = authService.getSessionToken();
      if (!sessionToken) {
        throw new Error('No active session');
      }

      const response = await fetch(`${this.baseUrl}/api/auth/oauth/unlink`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`
        },
        body: JSON.stringify({ provider: providerId })
      });

      return await response.json();
    } catch (error) {
      console.error('OAuth account unlinking error:', error);
      return {
        success: false,
        error: 'Failed to unlink OAuth account'
      };
    }
  }

  /**
   * Get user's linked OAuth accounts
   */
  async getLinkedAccounts(): Promise<{ success: boolean; accounts?: any[]; error?: string }> {
    try {
      const sessionToken = authService.getSessionToken();
      if (!sessionToken) {
        throw new Error('No active session');
      }

      const response = await fetch(`${this.baseUrl}/api/auth/oauth/accounts`, {
        headers: {
          'Authorization': `Bearer ${sessionToken}`
        }
      });

      return await response.json();
    } catch (error) {
      console.error('Error fetching linked accounts:', error);
      return {
        success: false,
        error: 'Failed to fetch linked accounts'
      };
    }
  }

  /**
   * Initiate OAuth login flow
   */
  async initiateLogin(providerId: string): Promise<void> {
    const authUrl = await this.generateAuthUrl(providerId);
    if (authUrl) {
      // Store the current page for redirect after auth
      sessionStorage.setItem('oauth_redirect_after_auth', window.location.pathname);
      window.location.href = authUrl;
    } else {
      throw new Error(`Failed to generate OAuth URL for ${providerId}`);
    }
  }

  /**
   * Generate cryptographically secure random string for PKCE
   */
  private generateCodeVerifier(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return this.base64URLEncode(array);
  }

  /**
   * Generate code challenge from verifier using SHA256
   */
  private async generateCodeChallenge(verifier: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return this.base64URLEncode(new Uint8Array(digest));
  }

  /**
   * Generate state parameter for CSRF protection
   */
  private generateState(): string {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return this.base64URLEncode(array);
  }

  /**
   * Base64 URL encode (RFC 7636)
   */
  private base64URLEncode(array: Uint8Array): string {
    return btoa(String.fromCharCode(...array))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }
}

export const oauthService = new OAuthService();
export default oauthService;
