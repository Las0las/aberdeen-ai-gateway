// Aberdeen AI Gateway — Lightweight Analytics Endpoint
// Logs events to Vercel's serverless function logs (viewable in Vercel dashboard)
// Future: persist to D1, Supabase, or any store

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { event, data, ts, v } = req.body;

    // Structured log — visible in Vercel Logs dashboard
    console.log(JSON.stringify({
      type: 'analytics',
      event,
      data,
      ts,
      version: v,
      ip: req.headers['x-forwarded-for'] || 'unknown',
      ua: req.headers['user-agent'] || 'unknown',
      at: new Date().toISOString()
    }));

    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(400).json({ error: 'Invalid payload' });
  }
}