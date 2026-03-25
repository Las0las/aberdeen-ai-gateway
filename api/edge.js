// Aberdeen AI Gateway — Edge Function Proxy
// Routes: GET/POST /api/edge?fn=<slug>&path=<optional-subpath>
// Proxies requests to Supabase Edge Functions with auth
// Supports all 46 deployed edge functions

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://lalkdgljfkgiojfbreyq.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';

// Edge functions that require JWT (verify_jwt: true)
const JWT_REQUIRED = new Set([
  'market-api', 'audit-api', 'dashboard-api', 'agent-orchestrator',
  'flow-engine', 'screening-engine', 'skills-library', 'zero-waste-engine',
  'control-tower', 'allocator-engine', 'intelligence-search',
  'zk-proof-generator',
]);

// All valid edge function slugs (whitelist)
const VALID_SLUGS = new Set([
  'execution-spine', 'enqueue-job', 'candidate-360', 'scoring-engine',
  'spine-test', 'spine-dispatcher', 'parsea-handler', 'matchmaker-handler',
  'northstar-api', 'cron-health-monitor', 'command-bus', 'market-api',
  'audit-api', 'anchor-writer', 'dashboard-api', 'spine-v18', 'keygen',
  'dashboard-app', 'resume-parser', 'eth-anchor-mainnet', 'northstar-sdk',
  'zk-proof-generator', 'ats-gateway', 'custom-access-token', 'exa-ingest',
  'claude-extract', 'feedback-engine', 'reranker', 'outreach-engine',
  'explorer-api', 'validator-engine', 'gate-controller', 'economic-engine',
  'learning-engine', 'autonomous-executor', 'ai-gateway', 'deal-desk',
  'agent-orchestrator', 'flow-engine', 'screening-engine', 'skills-library',
  'zero-waste-engine', 'control-tower', 'allocator-engine',
  'intelligence-search', 'pipeline-orchestrator', 'nba-generator',
  'loop-infra-api',
]);

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-auth-token');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const slug = req.query?.fn;
  const subpath = req.query?.path || '';

  if (!slug) {
    return res.status(400).json({
      error: 'Missing fn parameter',
      usage: '/api/edge?fn=<function-slug>&path=<optional-subpath>',
      available: [...VALID_SLUGS].sort(),
    });
  }

  if (!VALID_SLUGS.has(slug)) {
    return res.status(404).json({ error: `Unknown edge function: ${slug}`, available: [...VALID_SLUGS].sort() });
  }

  // Build target URL
  const targetUrl = `${SUPABASE_URL}/functions/v1/${slug}${subpath ? `/${subpath}` : ''}`;

  // Build headers — use service key for JWT-required functions, anon for others
  const useServiceKey = JWT_REQUIRED.has(slug) && SUPABASE_SERVICE_KEY;
  const authKey = useServiceKey ? SUPABASE_SERVICE_KEY : SUPABASE_ANON_KEY;

  const headers = {
    'Content-Type': req.headers['content-type'] || 'application/json',
  };
  if (authKey) {
    headers['Authorization'] = `Bearer ${authKey}`;
    headers['apikey'] = SUPABASE_ANON_KEY || authKey;
  }
  // Forward client auth if present
  if (req.headers['x-auth-token']) {
    headers['Authorization'] = `Bearer ${req.headers['x-auth-token']}`;
  }

  try {
    const fetchOpts = { method: req.method, headers };
    if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
      fetchOpts.body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    }

    const upstream = await fetch(targetUrl, fetchOpts);
    const contentType = upstream.headers.get('content-type') || '';

    // Stream response back
    res.status(upstream.status);
    if (contentType.includes('json')) {
      const data = await upstream.json();
      return res.json(data);
    } else {
      const text = await upstream.text();
      res.setHeader('Content-Type', contentType || 'text/plain');
      return res.send(text);
    }
  } catch (err) {
    return res.status(502).json({ error: 'Edge function proxy error', slug, details: err.message });
  }
}
