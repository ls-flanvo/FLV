// In-memory rate limiter per environment serverless (per-invocation)
// Per rate limiting distribuito in produzione usare Redis/Upstash
const hits = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const record = hits.get(key);

  if (!record || now > record.resetAt) {
    hits.set(key, { count: 1, resetAt: now + windowMs });
    return true; // allowed
  }

  if (record.count >= maxRequests) return false; // blocked

  record.count++;
  return true; // allowed
}

export function getClientIp(request: Request): string {
  const forwarded = (request.headers as Headers).get('x-forwarded-for');
  return forwarded?.split(',')[0]?.trim() ?? 'unknown';
}
