import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { checkRateLimit, getClientId } from './utils/rateLimiter';
import { setSecureHeaders, sendErrorResponse, validateMessages } from './utils/validation';
import { logRequest } from './utils/logger';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const startTime = Date.now();

  // Set secure headers
  setSecureHeaders(res);

  // Only allow POST and OPTIONS
  if (req.method === 'OPTIONS') {
    logRequest(req, 200, Date.now() - startTime);
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    logRequest(req, 405, Date.now() - startTime, 'Method not allowed');
    return sendErrorResponse(res, 405, 'Method not allowed');
  }

  // Check rate limit
  const clientId = getClientId(req);
  const rateLimitCheck = checkRateLimit(clientId, 'GEMINI_API');

  if (!rateLimitCheck.allowed) {
    res.setHeader('Retry-After', rateLimitCheck.retryAfter || 60);
    logRequest(req, 429, Date.now() - startTime, 'Rate limit exceeded');
    return sendErrorResponse(res, 429, 'Too many requests. Please try again later.');
  }

  if (!GEMINI_API_KEY) {
    console.error('GEMINI_API_KEY is not configured');
    logRequest(req, 503, Date.now() - startTime, 'API key not configured');
    return sendErrorResponse(res, 503, 'Service unavailable. Please try again later.');
  }

  try {
    // Validate request body
    const { messages } = req.body;

    const validation = validateMessages(messages);
    if (!validation.valid) {
      logRequest(req, 400, Date.now() - startTime, validation.error);
      return sendErrorResponse(res, 400, validation.error || 'Invalid request');
    }

    const validMessages = validation.data!;

    // Convert messages format from OpenAI/Vercel standard to Gemini's native API spec
    const systemMessage = validMessages.find((m) => m.role === 'system');
    const systemInstruction = systemMessage ? systemMessage.content : '';

    const chatHistory = validMessages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const geminiModel = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction: systemInstruction,
    });

    const result = await geminiModel.generateContent({
      contents: chatHistory,
    });

    const responseText = result.response.text();

    logRequest(req, 200, Date.now() - startTime);
    return res.status(200).json({
      content: responseText,
      model: 'gemini-1.5-flash',
    });
  } catch (error) {
    console.error('Gemini chat handler error:', error);

    let statusCode = 500;
    let message = 'An error occurred while processing your request.';

    // Check error type and return appropriate response
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        statusCode = 503;
        message = 'Service unavailable. Please try again later.';
      } else if (error.message.includes('quota')) {
        statusCode = 429;
        message = 'API quota exceeded. Please try again later.';
      }
    }

    logRequest(req, statusCode, Date.now() - startTime, error instanceof Error ? error.message : 'Unknown error');
    return sendErrorResponse(res, statusCode, message, IS_DEVELOPMENT);
  }
}
