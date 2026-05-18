import type { VercelRequest } from '@vercel/node';

interface RateLimitStore {
  [key: string]: { count: number; resetTime: number };
}

// In-memory store for rate limiting (use Redis for production)
const store: RateLimitStore = {};

const RATE_LIMITS = {
  GEMINI_API: { requests: 30, windowMs: 60000 }, // 30 requests per minute
  GENERAL_API: { requests: 100, windowMs: 60000 }, // 100 requests per minute
};

/**
 * Get client identifier from request
 * Priority: x-forwarded-for (proxy) > cf-connecting-ip (Cloudflare) > ip
 */
export function getClientId(req: VercelRequest): string {
  const forwarded = req.headers['x-forwarded-for'];
  const cfIp = req.headers['cf-connecting-ip'];
  const ip = req.socket?.remoteAddress || 'unknown';

  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  if (typeof cfIp === 'string') {
    return cfIp;
  }
  return String(ip);
}

/**
 * Check if request exceeds rate limit
 */
export function checkRateLimit(
  clientId: string,
  limitType: keyof typeof RATE_LIMITS = 'GENERAL_API'
): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const limit = RATE_LIMITS[limitType];
  const key = `${limitType}:${clientId}`;

  // Initialize or clean up expired entry
  if (!store[key] || store[key].resetTime < now) {
    store[key] = {
      count: 0,
      resetTime: now + limit.windowMs,
    };
  }

  const entry = store[key];

  // Check if limit exceeded
  if (entry.count >= limit.requests) {
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
    return { allowed: false, retryAfter };
  }

  // Increment counter
  entry.count++;

  return { allowed: true };
}

/**
 * Cleanup old entries (run periodically to prevent memory leak)
 */
export function cleanupStore(): void {
  const now = Date.now();
  Object.keys(store).forEach((key) => {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  });
}

// Cleanup every 5 minutes
setInterval(cleanupStore, 5 * 60 * 1000);
