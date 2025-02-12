import { rateLimit } from '../utils/rateLimit';
import { sanitizeInput } from '../utils/validation';

// Rate limiting for API routes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

export function withSecurity(handler) {
  return async function(req, ...args) {
    // Apply rate limiting
    await apiLimiter(req);

    // Security headers
    const res = args[0];
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'same-origin');
    res.setHeader('Content-Security-Policy', "default-src 'self'");

    // Sanitize input
    if (req.body) {
      req.body = sanitizeRequestBody(req.body);
    }

    return handler(req, ...args);
  };
}

function sanitizeRequestBody(body) {
  if (typeof body !== 'object') return body;

  const sanitized = {};
  for (const [key, value] of Object.entries(body)) {
    if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeRequestBody(value);
    } else if (typeof value === 'string') {
      sanitized[key] = sanitizeInput(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
} 