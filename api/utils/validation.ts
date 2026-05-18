import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Validates and sanitizes request body
 */
export function validateRequest(
  req: VercelRequest,
  expectedFields: string[]
): { valid: boolean; data?: Record<string, any>; error?: string } {
  try {
    if (!req.body) {
      return { valid: false, error: 'Request body is required' };
    }

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

    // Check for required fields
    for (const field of expectedFields) {
      if (!(field in body)) {
        return { valid: false, error: `Missing required field: ${field}` };
      }
    }

    // Check request size (max 1MB)
    const size = JSON.stringify(body).length;
    if (size > 1024 * 1024) {
      return { valid: false, error: 'Request body too large' };
    }

    return { valid: true, data: body };
  } catch (error) {
    return { valid: false, error: 'Invalid JSON in request body' };
  }
}

/**
 * Set secure response headers
 */
export function setSecureHeaders(res: VercelResponse): void {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGINS || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

/**
 * Send error response without exposing sensitive details
 */
export function sendErrorResponse(
  res: VercelResponse,
  statusCode: number,
  message: string,
  isDevelopment: boolean = false
): VercelResponse {
  const response: Record<string, any> = { error: message };

  // Only include details in development
  if (isDevelopment && message.includes('Error:')) {
    response.details = message;
  }

  return res.status(statusCode).json(response);
}

/**
 * Validate array of messages (for chat APIs)
 */
export function validateMessages(
  messages: any
): { valid: boolean; error?: string; data?: Array<{ role: string; content: string }> } {
  if (!Array.isArray(messages)) {
    return { valid: false, error: 'Messages must be an array' };
  }

  if (messages.length === 0) {
    return { valid: false, error: 'Messages array cannot be empty' };
  }

  if (messages.length > 50) {
    return { valid: false, error: 'Too many messages (max 50)' };
  }

  for (const msg of messages) {
    if (!msg.role || !msg.content) {
      return { valid: false, error: 'Each message must have role and content' };
    }

    if (!['system', 'user', 'assistant'].includes(msg.role)) {
      return { valid: false, error: 'Invalid message role' };
    }

    if (typeof msg.content !== 'string' || msg.content.length > 10000) {
      return { valid: false, error: 'Message content must be a string (max 10000 chars)' };
    }
  }

  return {
    valid: true,
    data: messages.map((m) => ({
      role: m.role,
      content: m.content.trim(),
    })),
  };
}
