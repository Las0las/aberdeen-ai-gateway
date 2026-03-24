// Aberdeen AI Gateway — Claude API Proxy (Secured)
// API key is SERVER-ONLY via ANTHROPIC_API_KEY env var
// Rate limited: 20 requests per minute per IP

const rateLimitMap = new Map(); // IP -> { count, resetAt }
const RATE_LIMIT = 20;
const RATE_WINDOW_MS = 60 * 1000;

function checkRateLimit(ip) {
  const now = Date.now();
  let entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + RATE_WINDOW_MS };
    rateLimitMap.set(ip, entry);
  }
  entry.count++;
  // Cleanup old entries periodically
  if (rateLimitMap.size > 10000) {
    for (const [k, v] of rateLimitMap) {
      if (now > v.resetAt) rateLimitMap.delete(k);
    }
  }
  return {
    allowed: entry.count <= RATE_LIMIT,
    remaining: Math.max(0, RATE_LIMIT - entry.count),
    resetAt: entry.resetAt
  };
}
export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-auth-token');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Rate limiting
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 'unknown';
  const rl = checkRateLimit(ip);
  res.setHeader('X-RateLimit-Remaining', rl.remaining);
  res.setHeader('X-RateLimit-Reset', Math.ceil(rl.resetAt / 1000));
  if (!rl.allowed) {
    return res.status(429).json({ error: 'Rate limited', message: `Too many requests. Try again in ${Math.ceil((rl.resetAt - Date.now()) / 1000)}s.`, remaining: 0 });
  }

  // API key: server-side ONLY — never from client
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: 'API not configured', message: 'Server API key not set. Ask the admin to configure ANTHROPIC_API_KEY in Vercel environment variables.' });
  }

  const { model, max_tokens, system, messages, stream } = req.body;

  try {
    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({ model: model || 'claude-sonnet-4-20250514', max_tokens: max_tokens || 2048, system, messages, stream: !!stream }),
    });

    if (!anthropicRes.ok) {
      const err = await anthropicRes.text();
      return res.status(anthropicRes.status).json({ error: `Anthropic API ${anthropicRes.status}`, details: err });
    }

    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      const reader = anthropicRes.body.getReader();
      const decoder = new TextDecoder();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          res.write(decoder.decode(value, { stream: true }));
        }
      } finally { res.end(); }
    } else {
      const data = await anthropicRes.json();
      return res.status(200).json(data);
    }
  } catch (err) {
    return res.status(500).json({ error: 'Proxy error', details: err.message });
  }
}