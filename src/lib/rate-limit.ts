/**
 * Client-side Rate Limiter
 * Prevents brute force attacks on login/registration
 */

interface RateLimitConfig {
  windowMs: number;      // Time window in milliseconds
  maxAttempts: number;   // Maximum attempts per window
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
  lockedUntil?: number;  // For exponential backoff
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  lockedUntil?: number;
  message?: string;
}

// In-memory store (persists until page reload)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup interval
let cleanupInterval: ReturnType<typeof setInterval> | null = null;

function startCleanup() {
  if (cleanupInterval) return;

  cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
      if (entry.resetTime <= now && (!entry.lockedUntil || entry.lockedUntil <= now)) {
        rateLimitStore.delete(key);
      }
    }
  }, 60000); // Clean up every minute
}

/**
 * Creates a rate limiter with specified configuration
 */
export function createRateLimiter(config: RateLimitConfig) {
  startCleanup();

  return {
    /**
     * Check if action is allowed
     */
    check(identifier: string): RateLimitResult {
      const now = Date.now();
      const entry = rateLimitStore.get(identifier);

      // Check if locked (exponential backoff)
      if (entry?.lockedUntil && entry.lockedUntil > now) {
        const waitSeconds = Math.ceil((entry.lockedUntil - now) / 1000);
        return {
          allowed: false,
          remaining: 0,
          resetTime: entry.lockedUntil,
          lockedUntil: entry.lockedUntil,
          message: `Too many attempts. Please wait ${waitSeconds} seconds.`,
        };
      }

      // First request or window expired
      if (!entry || entry.resetTime <= now) {
        rateLimitStore.set(identifier, {
          count: 1,
          resetTime: now + config.windowMs,
        });
        return {
          allowed: true,
          remaining: config.maxAttempts - 1,
          resetTime: now + config.windowMs,
        };
      }

      // Check if limit exceeded
      if (entry.count >= config.maxAttempts) {
        // Apply exponential backoff: 30s, 60s, 120s, 240s, 480s (max)
        const lockDuration = Math.min(30000 * Math.pow(2, entry.count - config.maxAttempts), 480000);
        entry.lockedUntil = now + lockDuration;

        const waitSeconds = Math.ceil(lockDuration / 1000);
        return {
          allowed: false,
          remaining: 0,
          resetTime: entry.resetTime,
          lockedUntil: entry.lockedUntil,
          message: `Too many attempts. Please wait ${waitSeconds} seconds.`,
        };
      }

      // Increment counter
      entry.count++;
      return {
        allowed: true,
        remaining: config.maxAttempts - entry.count,
        resetTime: entry.resetTime,
      };
    },

    /**
     * Record a failed attempt (increases counter)
     */
    recordFailure(identifier: string): void {
      const entry = rateLimitStore.get(identifier);
      if (entry) {
        entry.count++;
      }
    },

    /**
     * Reset rate limit for identifier (on successful login)
     */
    reset(identifier: string): void {
      rateLimitStore.delete(identifier);
    },

    /**
     * Get current status without incrementing
     */
    getStatus(identifier: string): RateLimitResult {
      const now = Date.now();
      const entry = rateLimitStore.get(identifier);

      if (!entry || entry.resetTime <= now) {
        return {
          allowed: true,
          remaining: config.maxAttempts,
          resetTime: now + config.windowMs,
        };
      }

      if (entry.lockedUntil && entry.lockedUntil > now) {
        const waitSeconds = Math.ceil((entry.lockedUntil - now) / 1000);
        return {
          allowed: false,
          remaining: 0,
          resetTime: entry.lockedUntil,
          lockedUntil: entry.lockedUntil,
          message: `Account locked. Please wait ${waitSeconds} seconds.`,
        };
      }

      return {
        allowed: entry.count < config.maxAttempts,
        remaining: Math.max(0, config.maxAttempts - entry.count),
        resetTime: entry.resetTime,
      };
    },
  };
}

// ============================================================================
// Pre-configured Rate Limiters
// ============================================================================

/**
 * Auth rate limiter: 5 attempts per 15 minutes
 * With exponential backoff on lockout
 */
export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxAttempts: 5,
});

/**
 * Waitlist rate limiter: 3 attempts per 5 minutes
 */
export const waitlistRateLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000, // 5 minutes
  maxAttempts: 3,
});
