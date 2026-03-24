// Aberdeen AI Gateway — Scheduling Engine
// POST /api/scheduling?action=book|availability|cancel
// Manages interview slots, availability, confirmations

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://lalkdgljfkgiojfbreyq.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_KEY;

async function supa(method, path, body) {
  const headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
  };
  if (method === 'POST') headers['Prefer'] = 'return=representation';
  if (method === 'PATCH') headers['Prefer'] = 'return=representation';
  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, opts);
  if (!res.ok) throw new Error(`Supabase ${res.status}`);
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

// Generate available slots (next 5 business days, 9am-5pm EST)
function generateSlots(daysAhead = 5) {
  const slots = [];
  const now = new Date();
  let day = new Date(now);
  let count = 0;
  while (count < daysAhead) {
    day.setDate(day.getDate() + 1);
    const dow = day.getDay();
    if (dow === 0 || dow === 6) continue; // skip weekends
    for (let hour = 9; hour <= 16; hour++) {
      const slot = new Date(day);
      slot.setHours(hour, 0, 0, 0);
      slots.push({
        datetime: slot.toISOString(),
        display: `${slot.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} at ${hour > 12 ? hour - 12 : hour}:00 ${hour >= 12 ? 'PM' : 'AM'} EST`,
        available: true,
      });
    }
    count++;
  }
  return slots;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const action = req.query?.action || req.body?.action || 'availability';

  try {
    // GET availability
    if (action === 'availability' || req.method === 'GET') {
      const slots = generateSlots(5);
      // TODO: cross-reference with booked slots in DB
      return res.status(200).json({ slots, timezone: 'America/New_York' });
    }

    // POST book
    if (action === 'book' && req.method === 'POST') {
      const { entity_id, entity_type = 'candidate', datetime, interviewer, job_id, notes } = req.body;
      if (!datetime) return res.status(400).json({ error: 'datetime is required' });

      // Record the booking as a text_action linked to scheduling
      // In production this would integrate with Google Calendar / Outlook
      const booking = {
        entity_id, entity_type, datetime, interviewer: interviewer || 'TBD',
        job_id: job_id || null, notes: notes || '',
        status: 'confirmed', booked_at: new Date().toISOString(),
      };

      // Log to gateway
      if (SUPABASE_KEY) {
        await supa('POST', 'ai_gateway_requests', {
          intent: 'scheduling:book',
          input_text: `Interview booked: ${datetime}`,
          model_used: 'system',
          response_status: 'success',
          source: 'scheduling_engine',
          policy_decision: 'allow',
        }).catch(() => {});
      }

      return res.status(200).json({ booking, message: `Interview confirmed for ${new Date(datetime).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}` });
    }

    return res.status(400).json({ error: `Unknown action: ${action}. Use: availability, book` });
  } catch (err) {
    return res.status(500).json({ error: 'Scheduling error', details: err.message });
  }
}
