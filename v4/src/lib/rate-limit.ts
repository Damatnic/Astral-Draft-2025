/**
 * Rate limiting utility using memory store for development
 * In production, you should use Redis or another persistent store
 */

interface RateLimitOptions {
  key: string;
  limit: number;
  window: number; // seconds
}

interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetTime: number;
}

// In-memory store for development
const store = new Map<string, { count: number; resetTime: number }>();

export async function rateLimit({ key, limit, window }: RateLimitOptions): Promise<RateLimitResult> {
  const now = Date.now();
  const windowMs = window * 1000;
  
  const current = store.get(key);
  
  // If no entry exists or the window has expired, create a new entry
  if (!current || now > current.resetTime) {
    store.set(key, { count: 1, resetTime: now + windowMs });
    return {
      success: true,
      remaining: limit - 1,
      resetTime: now + windowMs,
    };
  }
  
  // If we're within the limit, increment the count
  if (current.count < limit) {
    current.count++;
    store.set(key, current);
    return {
      success: true,
      remaining: limit - current.count,
      resetTime: current.resetTime,
    };
  }
  
  // Rate limit exceeded
  return {
    success: false,
    remaining: 0,
    resetTime: current.resetTime,
  };
}

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of store.entries()) {
    if (now > value.resetTime) {
      store.delete(key);
    }
  }
}, 60000); // Clean up every minute