/**
 * Premium Feature Access Control Service
 * Manages subscription-based feature access and usage limits
 */

// Mock functions until backend is properly set up
const getUserSubscription = async (userId: string) => {
    // TODO: Implement actual database call
    return null;
};

const getUserBilling = async (userId: string) => {
    // TODO: Implement actual database call
    return null;
};

const runQuery = async (query: string, params?: any[]) => {
    // TODO: Implement actual database call
    return { rows: [] };
};

const getRow = async (query: string, params?: any[]) => {
    // TODO: Implement actual database call
    return null;
};

// Premium feature access levels
export enum FeatureTier {
    FREE = 'free',
    ORACLE_PREMIUM = 'oracle_premium',
    ANALYTICS_PRO = 'analytics_pro', 
    ULTIMATE = 'ultimate'
}

// Feature definitions with tier requirements
export const FEATURES = {
    // Oracle features
    oracle_predictions: {
        tiers: [FeatureTier.ORACLE_PREMIUM, FeatureTier.ANALYTICS_PRO, FeatureTier.ULTIMATE],
        limits: {
            [FeatureTier.FREE]: 0,
            [FeatureTier.ORACLE_PREMIUM]: 50,
            [FeatureTier.ANALYTICS_PRO]: 100,
            [FeatureTier.ULTIMATE]: -1 // unlimited
        }
    },
    advanced_analytics: {
        tiers: [FeatureTier.ANALYTICS_PRO, FeatureTier.ULTIMATE],
        limits: {
            [FeatureTier.FREE]: 0,
            [FeatureTier.ORACLE_PREMIUM]: 0,
            [FeatureTier.ANALYTICS_PRO]: 25,
            [FeatureTier.ULTIMATE]: -1
        }
    },
    contest_entries: {
        tiers: [FeatureTier.FREE, FeatureTier.ORACLE_PREMIUM, FeatureTier.ANALYTICS_PRO, FeatureTier.ULTIMATE],
        limits: {
            [FeatureTier.FREE]: 1,
            [FeatureTier.ORACLE_PREMIUM]: 5,
            [FeatureTier.ANALYTICS_PRO]: 10,
            [FeatureTier.ULTIMATE]: -1
        }
    },
    api_calls: {
        tiers: [FeatureTier.FREE, FeatureTier.ORACLE_PREMIUM, FeatureTier.ANALYTICS_PRO, FeatureTier.ULTIMATE],
        limits: {
            [FeatureTier.FREE]: 100,
            [FeatureTier.ORACLE_PREMIUM]: 1000,
            [FeatureTier.ANALYTICS_PRO]: 5000,
            [FeatureTier.ULTIMATE]: -1
        }
    },
    realtime_data: {
        tiers: [FeatureTier.ANALYTICS_PRO, FeatureTier.ULTIMATE],
        limits: {
            [FeatureTier.FREE]: 0,
            [FeatureTier.ORACLE_PREMIUM]: 0,
            [FeatureTier.ANALYTICS_PRO]: 1,
            [FeatureTier.ULTIMATE]: 1
        }
    },
    historical_analysis: {
        tiers: [FeatureTier.ANALYTICS_PRO, FeatureTier.ULTIMATE],
        limits: {
            [FeatureTier.FREE]: 0,
            [FeatureTier.ORACLE_PREMIUM]: 0,
            [FeatureTier.ANALYTICS_PRO]: 1,
            [FeatureTier.ULTIMATE]: 1
        }
    },
    custom_strategies: {
        tiers: [FeatureTier.ULTIMATE],
        limits: {
            [FeatureTier.FREE]: 0,
            [FeatureTier.ORACLE_PREMIUM]: 0,
            [FeatureTier.ANALYTICS_PRO]: 0,
            [FeatureTier.ULTIMATE]: 1
        }
    },
    priority_support: {
        tiers: [FeatureTier.ULTIMATE],
        limits: {
            [FeatureTier.FREE]: 0,
            [FeatureTier.ORACLE_PREMIUM]: 0,
            [FeatureTier.ANALYTICS_PRO]: 0,
            [FeatureTier.ULTIMATE]: 1
        }
    }
};

export type FeatureName = keyof typeof FEATURES;

export interface FeatureAccess {
    hasAccess: boolean;
    tier: FeatureTier;
    limit: number;
    used: number;
    remaining: number;
    upgradeRequired?: FeatureTier;
}

export class PremiumFeatureService {
    /**
     * Get user's current subscription tier
     */
    static async getUserTier(userId: number): Promise<FeatureTier> {
        try {
            const subscription = await getUserSubscription(String(userId));
            
            if (!subscription || (subscription as any).status !== 'active') {
                return FeatureTier.FREE;
            }

            switch ((subscription as any).product_type) {
                case 'oracle_premium':
                    return FeatureTier.ORACLE_PREMIUM;
                case 'analytics_pro':
                    return FeatureTier.ANALYTICS_PRO;
                case 'ultimate':
                    return FeatureTier.ULTIMATE;
                default:
                    return FeatureTier.FREE;
            }
        } catch (error) {
            console.error('Error getting user tier:', error);
            return FeatureTier.FREE;
        }
    }

    /**
     * Check if user has access to a specific feature
     */
    static async checkFeatureAccess(
        userId: number, 
        featureName: FeatureName, 
        requestedUsage: number = 1
    ): Promise<FeatureAccess> {
        const userTier = await this.getUserTier(userId);
        const feature = FEATURES[featureName];
        
        const hasAccess = feature.tiers.includes(userTier);
        const limit = feature.limits[userTier];
        
        // For features with no limits (unlimited access)
        if (limit === -1) {
            return {
                hasAccess: true,
                tier: userTier,
                limit: -1,
                used: 0,
                remaining: -1
            };
        }

        // Get current usage (you would implement this based on your usage tracking)
        const used = await this.getFeatureUsage(userId, featureName);
        const remaining = Math.max(0, limit - used);

        const result: FeatureAccess = {
            hasAccess: hasAccess && remaining >= requestedUsage,
            tier: userTier,
            limit,
            used,
            remaining
        };

        // If no access, suggest upgrade tier
        if (!result.hasAccess) {
            result.upgradeRequired = this.getMinimumTierForFeature(featureName);
        }

        return result;
    }

    /**
     * Get minimum tier required for a feature
     */
    static getMinimumTierForFeature(featureName: FeatureName): FeatureTier {
        const feature = FEATURES[featureName];
        const tierOrder = [FeatureTier.FREE, FeatureTier.ORACLE_PREMIUM, FeatureTier.ANALYTICS_PRO, FeatureTier.ULTIMATE];
        
        for (const tier of tierOrder) {
            if (feature.tiers.includes(tier)) {
                return tier;
            }
        }
        
        return FeatureTier.ULTIMATE;
    }

    /**
     * Get current usage for a feature from database
     */
    static async getFeatureUsage(userId: number, featureName: FeatureName): Promise<number> {
        try {
            // Query actual usage from database
            const result = await getRow(`
                SELECT COALESCE(SUM(usage_amount), 0) as total_usage
                FROM feature_usage 
                WHERE user_id = ? 
                AND feature_name = ? 
                AND created_at >= date('now', 'start of month')
            `, [userId, featureName]);
            
            const usage = result ? Number((result as any).total_usage) : 0;
            console.log(`Getting usage for user ${userId}, feature ${featureName}: ${usage}`);
            return usage;
        } catch (error) {
            console.error('Error getting feature usage:', error);
            return 0;
        }
    }

    /**
     * Record feature usage
     */
    static async recordFeatureUsage(
        userId: number, 
        featureName: FeatureName, 
        amount: number = 1
    ): Promise<boolean> {
        try {
            // Check if user has access first
            const access = await this.checkFeatureAccess(userId, featureName, amount);
            
            if (!access.hasAccess) {
                throw new Error(`Feature ${featureName} not available for user tier ${access.tier}`);
            }

            // Record the usage in database
            await runQuery(`
                INSERT INTO feature_usage (user_id, feature_name, usage_amount, created_at)
                VALUES (?, ?, ?, datetime('now'))
            `, [userId, featureName, amount]);
            
            console.log(`Recording usage: User ${userId} used ${amount} of ${featureName}`);
            
            return true;
        } catch (error) {
            console.error('Error recording feature usage:', error);
            return false;
        }
    }

    /**
     * Get user's feature limits overview
     */
    static async getUserFeatureLimits(userId: number): Promise<Record<FeatureName, FeatureAccess>> {
        const userTier = await this.getUserTier(userId);
        const limits: Record<string, FeatureAccess> = {};

        for (const [featureName, feature] of Object.entries(FEATURES)) {
            const hasAccess = feature.tiers.includes(userTier);
            const limit = feature.limits[userTier];
            const used = await this.getFeatureUsage(userId, featureName as FeatureName);
            const remaining = limit === -1 ? -1 : Math.max(0, limit - used);

            limits[featureName] = {
                hasAccess,
                tier: userTier,
                limit,
                used,
                remaining,
                upgradeRequired: hasAccess ? undefined : this.getMinimumTierForFeature(featureName as FeatureName)
            };
        }

        return limits as Record<FeatureName, FeatureAccess>;
    }

    /**
     * Check if user is on trial
     */
    static async isUserOnTrial(userId: number): Promise<boolean> {
        try {
            const subscription = await getUserSubscription(String(userId));
            return (subscription as any)?.status === 'trialing' || false;
        } catch (error) {
            console.error('Error checking trial status:', error);
            return false;
        }
    }

    /**
     * Get subscription details for user
     */
    static async getUserSubscriptionDetails(userId: number) {
        try {
            const [subscription, billing] = await Promise.all([
                getUserSubscription(String(userId)),
                getUserBilling(String(userId))
            ]);

            return {
                subscription,
                billing,
                tier: await this.getUserTier(userId),
                isOnTrial: await this.isUserOnTrial(userId)
            };
        } catch (error) {
            console.error('Error getting subscription details:', error);
            return null;
        }
    }
}

/**
 * Hook interface for checking feature access
 * Implement this in your React components as needed
 */
export interface FeatureAccessHook {
    checkAccess: typeof PremiumFeatureService.checkFeatureAccess;
    getUserTier: typeof PremiumFeatureService.getUserTier;
    recordUsage: typeof PremiumFeatureService.recordFeatureUsage;
    getFeatureLimits: typeof PremiumFeatureService.getUserFeatureLimits;
}

export default PremiumFeatureService;
