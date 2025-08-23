/**
 * Role-Based Access Control (RBAC) System
 * Provides comprehensive permission management for different user roles
 */

export enum UserRole {
  GUEST = 'guest',
  USER = 'user',
  LEAGUE_MANAGER = 'league_manager',
  ORACLE_SUBSCRIBER = 'oracle_subscriber',
  ORACLE_ADMIN = 'oracle_admin',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin'
}

export enum Permission {
  // User permissions
  VIEW_DASHBOARD = 'view_dashboard',
  VIEW_PROFILE = 'view_profile',
  EDIT_PROFILE = 'edit_profile',
  
  // League permissions
  VIEW_LEAGUES = 'view_leagues',
  JOIN_LEAGUE = 'join_league',
  CREATE_LEAGUE = 'create_league',
  MANAGE_LEAGUE = 'manage_league',
  DELETE_LEAGUE = 'delete_league',
  
  // Draft permissions
  PARTICIPATE_DRAFT = 'participate_draft',
  VIEW_DRAFT_HISTORY = 'view_draft_history',
  
  // Oracle permissions
  VIEW_ORACLE_PREDICTIONS = 'view_oracle_predictions',
  SUBMIT_ORACLE_PREDICTIONS = 'submit_oracle_predictions',
  VIEW_ORACLE_ANALYTICS = 'view_oracle_analytics',
  ACCESS_PREMIUM_ORACLE = 'access_premium_oracle',
  MANAGE_ORACLE_SYSTEM = 'manage_oracle_system',
  
  // Analytics permissions
  VIEW_BASIC_ANALYTICS = 'view_basic_analytics',
  VIEW_ADVANCED_ANALYTICS = 'view_advanced_analytics',
  EXPORT_ANALYTICS = 'export_analytics',
  
  // Social permissions
  CREATE_POSTS = 'create_posts',
  COMMENT_ON_POSTS = 'comment_on_posts',
  MODERATE_CONTENT = 'moderate_content',
  
  // Admin permissions
  MANAGE_USERS = 'manage_users',
  VIEW_SYSTEM_LOGS = 'view_system_logs',
  MANAGE_SYSTEM_SETTINGS = 'manage_system_settings',
  SUPER_ADMIN_ACCESS = 'super_admin_access'
}

// Role-Permission mapping
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.GUEST]: [
    Permission.VIEW_DASHBOARD,
    Permission.VIEW_LEAGUES
  ],
  
  [UserRole.USER]: [
    Permission.VIEW_DASHBOARD,
    Permission.VIEW_PROFILE,
    Permission.EDIT_PROFILE,
    Permission.VIEW_LEAGUES,
    Permission.JOIN_LEAGUE,
    Permission.PARTICIPATE_DRAFT,
    Permission.VIEW_DRAFT_HISTORY,
    Permission.VIEW_BASIC_ANALYTICS,
    Permission.CREATE_POSTS,
    Permission.COMMENT_ON_POSTS
  ],
  
  [UserRole.LEAGUE_MANAGER]: [],
  [UserRole.ORACLE_SUBSCRIBER]: [],
  [UserRole.ORACLE_ADMIN]: [],
  [UserRole.ADMIN]: [],
  [UserRole.SUPER_ADMIN]: []
};

// Fill in dependent roles after initial definition
ROLE_PERMISSIONS[UserRole.LEAGUE_MANAGER] = [
  ...ROLE_PERMISSIONS[UserRole.USER],
  Permission.CREATE_LEAGUE,
  Permission.MANAGE_LEAGUE,
  Permission.VIEW_ADVANCED_ANALYTICS,
  Permission.EXPORT_ANALYTICS,
  Permission.MODERATE_CONTENT
];

ROLE_PERMISSIONS[UserRole.ORACLE_SUBSCRIBER] = [
  ...ROLE_PERMISSIONS[UserRole.USER],
  Permission.VIEW_ORACLE_PREDICTIONS,
  Permission.SUBMIT_ORACLE_PREDICTIONS,
  Permission.VIEW_ORACLE_ANALYTICS,
  Permission.ACCESS_PREMIUM_ORACLE
];

ROLE_PERMISSIONS[UserRole.ORACLE_ADMIN] = [
  ...ROLE_PERMISSIONS[UserRole.ORACLE_SUBSCRIBER],
  Permission.MANAGE_ORACLE_SYSTEM,
  Permission.VIEW_ADVANCED_ANALYTICS,
  Permission.EXPORT_ANALYTICS
];

ROLE_PERMISSIONS[UserRole.ADMIN] = [
  ...Object.values(Permission).filter(p => p !== Permission.SUPER_ADMIN_ACCESS)
];

ROLE_PERMISSIONS[UserRole.SUPER_ADMIN] = [
  ...Object.values(Permission)
];

interface RoleConfig {
  name: string;
  description: string;
  color: string;
  icon: string;
  priority: number;
}

const ROLE_CONFIGS: Record<UserRole, RoleConfig> = {
  [UserRole.GUEST]: {
    name: 'Guest',
    description: 'Limited access to public features',
    color: '#6B7280',
    icon: '👤',
    priority: 0
  },
  [UserRole.USER]: {
    name: 'User',
    description: 'Standard user with basic features',
    color: '#3B82F6',
    icon: '🏈',
    priority: 1
  },
  [UserRole.LEAGUE_MANAGER]: {
    name: 'League Manager',
    description: 'Can create and manage leagues',
    color: '#10B981',
    icon: '⭐',
    priority: 2
  },
  [UserRole.ORACLE_SUBSCRIBER]: {
    name: 'Oracle Subscriber',
    description: 'Access to Oracle predictions and analytics',
    color: '#8B5CF6',
    icon: '🔮',
    priority: 3
  },
  [UserRole.ORACLE_ADMIN]: {
    name: 'Oracle Admin',
    description: 'Manages Oracle prediction system',
    color: '#7C3AED',
    icon: '🧙‍♂️',
    priority: 4
  },
  [UserRole.ADMIN]: {
    name: 'Administrator',
    description: 'Full system administration access',
    color: '#EF4444',
    icon: '👑',
    priority: 5
  },
  [UserRole.SUPER_ADMIN]: {
    name: 'Super Admin',
    description: 'Ultimate system control',
    color: '#DC2626',
    icon: '⚡',
    priority: 6
  }
};

export interface UserWithRoles {
  id: number;
  username: string;
  email: string;
  display_name: string;
  roles: UserRole[];
  permissions?: Permission[];
}

class RBACService {
  /**
   * Check if user has specific permission
   */
  hasPermission(user: UserWithRoles | null, permission: Permission): boolean {
    if (!user || !user.roles || user.roles.length === 0) {
      return ROLE_PERMISSIONS[UserRole.GUEST].includes(permission);
    }

    // Check if any of the user's roles has the permission
    return user.roles.some(role => 
      ROLE_PERMISSIONS[role]?.includes(permission)
    );
  }

  /**
   * Check if user has any of the specified permissions
   */
  hasAnyPermission(user: UserWithRoles | null, permissions: Permission[]): boolean {
    return permissions.some(permission => this.hasPermission(user, permission));
  }

  /**
   * Check if user has all specified permissions
   */
  hasAllPermissions(user: UserWithRoles | null, permissions: Permission[]): boolean {
    return permissions.every(permission => this.hasPermission(user, permission));
  }

  /**
   * Check if user has specific role
   */
  hasRole(user: UserWithRoles | null, role: UserRole): boolean {
    if (!user || !user.roles) {
      return role === UserRole.GUEST;
    }
    return user.roles.includes(role);
  }

  /**
   * Check if user has role with equal or higher priority
   */
  hasMinimumRole(user: UserWithRoles | null, minimumRole: UserRole): boolean {
    if (!user || !user.roles || user.roles.length === 0) {
      return ROLE_CONFIGS[minimumRole].priority <= ROLE_CONFIGS[UserRole.GUEST].priority;
    }

    const userMaxPriority = Math.max(
      ...user.roles.map(role => ROLE_CONFIGS[role]?.priority || 0)
    );
    
    return userMaxPriority >= ROLE_CONFIGS[minimumRole].priority;
  }

  /**
   * Get all permissions for user
   */
  getUserPermissions(user: UserWithRoles | null): Permission[] {
    if (!user || !user.roles || user.roles.length === 0) {
      return ROLE_PERMISSIONS[UserRole.GUEST];
    }

    const permissions = new Set<Permission>();
    
    user.roles.forEach(role => {
      ROLE_PERMISSIONS[role]?.forEach(permission => {
        permissions.add(permission);
      });
    });

    return Array.from(permissions);
  }

  /**
   * Get user's highest priority role
   */
  getHighestRole(user: UserWithRoles | null): UserRole {
    if (!user || !user.roles || user.roles.length === 0) {
      return UserRole.GUEST;
    }

    return user.roles.reduce((highest, current) => 
      ROLE_CONFIGS[current].priority > ROLE_CONFIGS[highest].priority ? current : highest
    );
  }

  /**
   * Get role configuration
   */
  getRoleConfig(role: UserRole): RoleConfig {
    return ROLE_CONFIGS[role];
  }

  /**
   * Get all available roles
   */
  getAllRoles(): UserRole[] {
    return Object.values(UserRole);
  }

  /**
   * Get assignable roles (excluding guest)
   */
  getAssignableRoles(): UserRole[] {
    return Object.values(UserRole).filter(role => role !== UserRole.GUEST);
  }

  /**
   * Check if user can assign specific role (must have higher priority)
   */
  canAssignRole(assigner: UserWithRoles | null, targetRole: UserRole): boolean {
    const assignerRole = this.getHighestRole(assigner);
    return ROLE_CONFIGS[assignerRole].priority > ROLE_CONFIGS[targetRole].priority;
  }

  /**
   * Get permissions required for specific feature
   */
  getFeaturePermissions(): Record<string, Permission[]> {
    return {
      dashboard: [Permission.VIEW_DASHBOARD],
      profile: [Permission.VIEW_PROFILE],
      leagues: [Permission.VIEW_LEAGUES],
      createLeague: [Permission.CREATE_LEAGUE],
      manageLeague: [Permission.MANAGE_LEAGUE],
      draft: [Permission.PARTICIPATE_DRAFT],
      oracle: [Permission.VIEW_ORACLE_PREDICTIONS],
      oracleSubmit: [Permission.SUBMIT_ORACLE_PREDICTIONS],
      oraclePremium: [Permission.ACCESS_PREMIUM_ORACLE],
      analytics: [Permission.VIEW_BASIC_ANALYTICS],
      advancedAnalytics: [Permission.VIEW_ADVANCED_ANALYTICS],
      admin: [Permission.MANAGE_USERS]
    };
  }

  /**
   * Filter resources based on user permissions
   */
  filterAllowed<T>(
    user: UserWithRoles | null, 
    resources: Array<T & { requiredPermission?: Permission }>,
    defaultPermission?: Permission
  ): T[] {
    return resources.filter(resource => {
      const permission = resource.requiredPermission || defaultPermission;
      return !permission || this.hasPermission(user, permission);
    });
  }

  /**
   * Create role guard for components
   */
  createRoleGuard(requiredRole: UserRole) {
    return (user: UserWithRoles | null): boolean => {
      return this.hasMinimumRole(user, requiredRole);
    };
  }

  /**
   * Create permission guard for components
   */
  createPermissionGuard(requiredPermissions: Permission | Permission[]) {
    return (user: UserWithRoles | null): boolean => {
      const permissions = Array.isArray(requiredPermissions) 
        ? requiredPermissions 
        : [requiredPermissions];
      return this.hasAllPermissions(user, permissions);
    };
  }
}

export const rbacService = new RBACService();
export default rbacService;

// Utility types for components
export type PermissionGuard = (user: UserWithRoles | null) => boolean;
export type RoleGuard = (user: UserWithRoles | null) => boolean;
