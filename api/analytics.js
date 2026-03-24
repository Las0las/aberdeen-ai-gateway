// Aberdeen AI Gateway — Analytics Endpoint
// Logs structured events to Vercel Logs + tracks in-memory usage stats
// GET /api/analytics returns current session stats

const usageStats = {
  totalRequests: 0,
  agentUsage: {},    // agentId -> count
  events: [],        // last 100 events
  startedAt: Date.now()
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // GET: return current usage stats
  if (req.method === 'GET') {
    return res.status(200).json({
      ...usageStats,
      uptime: Math.floor((Date.now() - usageStats.startedAt) / 1000),
      topAgents: Object.entries(usageStats.agentUsage)
        .sort(([,a],[,b]) => b - a)
        .slice(0, 10)
        .map(([id, count]) => ({ id, count }))
    });
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { event, data, ts, v } = req.body;

    // Update in-memory stats
    usageStats.totalRequests++;
    if (data?.agent) {
      usageStats.agentUsage[data.agent] = (usageStats.agentUsage[data.agent] || 0) + 1;
    }
    usageStats.events.push({ event, data, ts, at: new Date().toISOString() });
    if (usageStats.events.length > 100) usageStats.events = usageStats.events.slice(-100);

    // Structured log for Vercel Logs dashboard
    console.log(JSON.stringify({
      type: 'analytics', event, data, ts, version: v,
      ip: req.headers['x-forwarded-for'] || 'unknown',
      at: new Date().toISOString()
    }));

    return res.status(200).json({ ok: true, totalRequests: usageStats.totalRequests });
  } catch (err) {
    return res.status(400).json({ error: 'Invalid payload' });
  }
}