import type { VercelRequest, VercelResponse } from '@vercel/node';

export interface LogEntry {
  timestamp: string;
  method: string;
  path: string;
  statusCode: number;
  clientId: string;
  duration: number;
  errorMessage?: string;
}

/**
 * Log API request with sensitive data redacted
 */
export function logRequest(
  req: VercelRequest,
  statusCode: number,
  duration: number,
  errorMessage?: string
): void {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    method: req.method || 'UNKNOWN',
    path: req.url?.split('?')[0] || 'UNKNOWN',
    statusCode,
    clientId: getAnonymousClientId(req),
    duration,
    errorMessage: errorMessage ? redactSensitiveData(errorMessage) : undefined,
  };

  // Log based on severity
  if (statusCode >= 500) {
    console.error('[API ERROR]', JSON.stringify(entry));
  } else if (statusCode >= 400) {
    console.warn('[API WARNING]', JSON.stringify(entry));
  } else {
    console.log('[API INFO]', JSON.stringify(entry));
  }
}

/**
 * Get anonymized client ID for logging (hash-like)
 */
function getAnonymousClientId(req: VercelRequest): string {
  const forwarded = req.headers['x-forwarded-for'];
  const cfIp = req.headers['cf-connecting-ip'];
  const ip = req.socket?.remoteAddress || 'unknown';

  let clientIp = '';
  if (typeof forwarded === 'string') {
    clientIp = forwarded.split(',')[0].trim();
  } else if (typeof cfIp === 'string') {
    clientIp = cfIp;
  } else {
    clientIp = String(ip);
  }

  // Anonymize IP (hash first octet)
  const parts = clientIp.split('.');
  if (parts.length >= 2) {
    return `${hashString(parts[0])}-${parts[1]}-${parts[2]}-xxx`;
  }
  return `client-${hashString(clientIp)}`;
}

/**
 * Simple hash function for anonymization
 */
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16).substring(0, 4);
}

/**
 * Redact sensitive data from error messages
 */
function redactSensitiveData(message: string): string {
  return message
    .replace(/API[_-]?key[:\s]*[\w\-\.]+/gi, 'API_KEY:***')
    .replace(/token[:\s]*[\w\-\.]+/gi, 'TOKEN:***')
    .replace(/Bearer\s+[\w\-\.]+/gi, 'Bearer ***')
    .replace(/\b[\w\.-]+@[\w\.-]+\.\w+\b/g, 'EMAIL:***')
    .replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, 'CARD:***');
}

/**
 * Create request logging middleware wrapper
 */
export function createLoggedHandler(
  handler: (req: VercelRequest, res: VercelResponse) => Promise<VercelResponse | void>
) {
  return async (req: VercelRequest, res: VercelResponse) => {
    const startTime = Date.now();
    const originalJson = res.json.bind(res);

    // Wrap json method to capture response
    res.json = function (body: any) {
      const duration = Date.now() - startTime;
      const statusCode = res.statusCode || 200;
      const errorMessage =
        body?.error || body?.message ? JSON.stringify(body) : undefined;

      logRequest(req, statusCode, duration, errorMessage);
      return originalJson(body);
    };

    try {
      return await handler(req, res);
    } catch (error) {
      const duration = Date.now() - startTime;
      logRequest(req, 500, duration, error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  };
}
