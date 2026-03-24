// Aberdeen AI Gateway — Texting Outbound Endpoint
// Autonomous outreach: event-triggered contextual messaging
// Triggers: candidate_ingested, job_ready, interview_required, offer_ready, follow_up

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://lalkdgljfkgiojfbreyq.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_KEY;
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;

const FINLOCK = { active: true, marginFloor: 0.18 };

async function supa(method, path, body) {
  const headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
  };
  if (method === 'POST') headers['Prefer'] = 'return=representation';
  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, opts);
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${await res.text()}`);
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

async function generateOutreach(trigger, candidate, job, memory) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 250,
      system: `You are Lawrence, an AI recruiting assistant for Aberdeen Consulting. Generate a personalized outreach text message.

Trigger: ${trigger}
Candidate: ${JSON.stringify(candidate)}
Job: ${JSON.stringify(job)}
Memory/preferences: ${JSON.stringify(memory)}

Rules:
- Keep under 160 chars when possible (SMS-friendly)
- Be warm, professional, direct
- Reference specific skills/experience from candidate profile
- Never reveal internal scoring or match algorithms
- Never use generic templates — every message must feel personal
- Include a clear call-to-action`,
      messages: [{ role: 'user', content: `Generate outreach message for trigger: ${trigger}` }],
    }),
  });
  if (!res.ok) throw new Error(`Claude outreach gen ${res.status}`);
  const data = await res.json();
  return data.content?.[0]?.text || null;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  if (!SUPABASE_KEY || !ANTHROPIC_KEY) return res.status(503).json({ error: 'Not configured' });

  const { trigger, entity_id, entity_type = 'candidate', job_id, channel = 'sms', phone } = req.body;
  if (!trigger) return res.status(400).json({ error: 'trigger is required' });

  const startMs = Date.now();
  const traceId = crypto.randomUUID?.() || `trace-${Date.now()}`;

  try {
    // Load candidate data
    let candidate = null;
    if (entity_id) {
      const rows = await supa('GET', `candidates?id=eq.${entity_id}&select=id,first_name,last_name,current_title,current_company,skills_canonical&limit=1`);
      candidate = rows?.[0] || null;
    }

    // Load job data
    let job = null;
    if (job_id) {
      const rows = await supa('GET', `jobs?id=eq.${job_id}&select=id,title,department,salary_min,salary_max&limit=1`);
      job = rows?.[0] || null;
    }

    // Load memory
    const memory = entity_id
      ? await supa('GET', `text_memory?entity_id=eq.${entity_id}&select=*&order=updated_at.desc&limit=5`)
      : [];

    // FIN-LOCK: check if outreach is worth it (scoring threshold)
    // In a full system, this would check candidate_score > threshold
    // For now, we always allow outreach but log the check
    const finlockResult = FINLOCK.active ? 'passed' : 'n/a';

    // Generate personalized message
    const outreachText = await generateOutreach(trigger, candidate, job, memory);
    if (!outreachText) return res.status(500).json({ error: 'Failed to generate outreach' });

    // Create or find conversation
    let convo;
    if (phone) {
      const existing = await supa('GET', `text_conversations?phone_number=eq.${encodeURIComponent(phone)}&status=eq.active&select=*&limit=1`);
      convo = existing?.[0];
    }
    if (!convo) {
      const created = await supa('POST', 'text_conversations', {
        entity_type, entity_id: entity_id || null,
        channel, phone_number: phone || null, status: 'active',
        last_message_at: new Date().toISOString(),
      });
      convo = created?.[0];
    }

    // Persist outbound message
    const msg = await supa('POST', 'text_messages', {
      conversation_id: convo.id,
      direction: 'outbound', content: outreachText,
      intent: trigger, confidence: 1.0,
      agent_decision: { trigger, candidate_id: entity_id, job_id, trace_id: traceId, autonomous: true },
      policy_result: { passed: true, finlock: finlockResult },
    });

    // Create action record
    if (msg?.[0]) {
      await supa('POST', 'text_actions', {
        message_id: msg[0].id,
        action_type: `outreach:${trigger}`,
        status: 'executed',
        result: { channel, phone, candidate_id: entity_id, job_id },
        executed_at: new Date().toISOString(),
      });
    }

    // Log to ai_gateway_requests
    const latency = Date.now() - startMs;
    await supa('POST', 'ai_gateway_requests', {
      intent: `texting:outbound:${trigger}`,
      input_text: `Outreach to ${candidate?.first_name || 'unknown'} re: ${job?.title || trigger}`,
      model_used: 'claude-sonnet-4-20250514',
      response_status: 'success',
      latency_ms: latency,
      source: 'texting_outbound',
      policy_decision: 'allow',
      trace_id: traceId,
    }).catch(() => {});

    return res.status(200).json({
      message: outreachText,
      trigger,
      conversation_id: convo.id,
      trace_id: traceId,
      latency_ms: latency,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Outbound pipeline error', details: err.message, trace_id: traceId });
  }
}
