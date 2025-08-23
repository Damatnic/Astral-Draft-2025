/**
 * Simple Authentication Service
 * Handles 10-player + admin login system with PIN authentication
 */

export interface SimpleUser {
    id: string;
    username: string;
    displayName: string;
    pin: string;
    email?: string;
    isAdmin: boolean;
    customization: {
        backgroundColor: string;
        textColor: string;
        emoji: string;
    };
    createdAt: string;
    lastLogin?: string;
}

export interface AuthSession {
    user: SimpleUser;
    sessionId: string;
    expiresAt: string;
}

class SimpleAuthService {
    private static readonly STORAGE_KEY = 'astral_draft_users';
    private static readonly SESSION_KEY = 'astral_draft_session';
    private static readonly SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

    // Default users: 10 players + 1 admin
    private static readonly DEFAULT_USERS: SimpleUser[] = [
        // Admin user
        {
            id: 'admin',
            username: 'admin',
            displayName: 'League Admin',
            pin: '7347',
            isAdmin: true,
            customization: {
                backgroundColor: '#1f2937',
                textColor: '#f59e0b',
                emoji: '👑'
            },
            createdAt: new Date().toISOString()
        },
        // Player users (1-10)
        ...Array.from({ length: 10 }, (_, i) => ({
            id: `player${i + 1}`,
            username: `player${i + 1}`,
            displayName: `Player ${i + 1}`,
            pin: '0000',
            isAdmin: false,
            customization: {
                backgroundColor: this.getRandomPlayerColor(),
                textColor: '#ffffff',
                emoji: this.getRandomPlayerEmoji()
            },
            createdAt: new Date().toISOString()
        }))
    ];

    private static getRandomPlayerColor(): string {
        const colors = [
            '#3b82f6', '#ef4444', '#10b981', '#f59e0b',
            '#8b5cf6', '#06b6d4', '#84cc16', '#f97316',
            '#ec4899', '#6366f1'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    private static getRandomPlayerEmoji(): string {
        const emojis = ['🏈', '⚡', '🔥', '💪', '🎯', '🚀', '⭐', '💎', '🏆', '🎮'];
        return emojis[Math.floor(Math.random() * emojis.length)];
    }

    /**
     * Initialize the authentication system
     */
    static initialize(): void {
        const existingUsers = this.getAllUsers();
        if (existingUsers.length === 0) {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.DEFAULT_USERS));
        }
    }

    /**
     * Get all users from storage
     */
    static getAllUsers(): SimpleUser[] {
        try {
            const usersJson = localStorage.getItem(this.STORAGE_KEY);
            return usersJson ? JSON.parse(usersJson) : [];
        } catch (error) {
            console.error('Failed to load users:', error);
            return [];
        }
    }

    /**
     * Get user by ID
     */
    static getUserById(id: string): SimpleUser | null {
        const users = this.getAllUsers();
        return users.find(user => user.id === id) || null;
    }

    /**
     * Authenticate user with PIN
     */
    static async authenticateUser(userId: string, pin: string): Promise<AuthSession | null> {
        const users = this.getAllUsers();
        const user = users.find(u => u.id === userId);

        if (!user || user.pin !== pin) {
            return null;
        }

        // Update last login
        user.lastLogin = new Date().toISOString();
        this.updateUser(user);

        // Create session
        const session: AuthSession = {
            user,
            sessionId: this.generateSessionId(),
            expiresAt: new Date(Date.now() + this.SESSION_DURATION).toISOString()
        };

        // Store session
        localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));

        return session;
    }

    /**
     * Get current session
     */
    static getCurrentSession(): AuthSession | null {
        try {
            const sessionJson = localStorage.getItem(this.SESSION_KEY);
            if (!sessionJson) return null;

            const session: AuthSession = JSON.parse(sessionJson);
            
            // Check if session is expired
            if (new Date() > new Date(session.expiresAt)) {
                this.logout();
                return null;
            }

            return session;
        } catch (error) {
            console.error('Failed to load session:', error);
            return null;
        }
    }

    /**
     * Update user PIN
     */
    static updateUserPin(userId: string, newPin: string): boolean {
        const users = this.getAllUsers();
        const userIndex = users.findIndex(u => u.id === userId);
        
        if (userIndex === -1) return false;

        users[userIndex].pin = newPin;
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(users));
        
        return true;
    }

    /**
     * Update user email
     */
    static updateUserEmail(userId: string, email: string): boolean {
        const users = this.getAllUsers();
        const userIndex = users.findIndex(u => u.id === userId);
        
        if (userIndex === -1) return false;

        users[userIndex].email = email;
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(users));
        
        return true;
    }

    /**
     * Update user customization
     */
    static updateUserCustomization(userId: string, customization: Partial<SimpleUser['customization']>): boolean {
        const users = this.getAllUsers();
        const userIndex = users.findIndex(u => u.id === userId);
        
        if (userIndex === -1) return false;

        users[userIndex].customization = {
            ...users[userIndex].customization,
            ...customization
        };
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(users));
        
        return true;
    }

    /**
     * Update user display name
     */
    static updateUserDisplayName(userId: string, displayName: string): boolean {
        const users = this.getAllUsers();
        const userIndex = users.findIndex(u => u.id === userId);
        
        if (userIndex === -1) return false;

        users[userIndex].displayName = displayName;
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(users));
        
        return true;
    }

    /**
     * Update user data
     */
    private static updateUser(updatedUser: SimpleUser): void {
        const users = this.getAllUsers();
        const userIndex = users.findIndex(u => u.id === updatedUser.id);
        
        if (userIndex !== -1) {
            users[userIndex] = updatedUser;
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(users));
        }
    }

    /**
     * Logout current user
     */
    static logout(): void {
        localStorage.removeItem(this.SESSION_KEY);
    }

    /**
     * Generate session ID
     */
    private static generateSessionId(): string {
        return `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    }

    /**
     * Reset all users to default (Admin only)
     */
    static resetAllUsers(): void {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.DEFAULT_USERS));
    }

    /**
     * Export user data for backup
     */
    static exportUserData(): string {
        return JSON.stringify(this.getAllUsers(), null, 2);
    }

    /**
     * Import user data from backup
     */
    static importUserData(data: string): boolean {
        try {
            const users = JSON.parse(data);
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(users));
            return true;
        } catch (error) {
            console.error('Failed to import user data:', error);
            return false;
        }
    }
}

export default SimpleAuthService;
