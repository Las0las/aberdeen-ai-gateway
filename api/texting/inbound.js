// Aberdeen AI Gateway — Texting Inbound Endpoint
// TEXTING-EXECUTION-01: Deterministic messaging execution layer
// Every message: policy check → audit → FIN-LOCK → execute

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://lalkdgljfkgiojfbreyq.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_KEY;
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;

const FINLOCK = { active: true, marginFloor: 0.18, maxDiscount: 0.10 };
const CONFIDENCE_THRESHOLD = 0.65;

// ─── Supabase REST helper ────────────────────────────────────
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
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${await res.text()}`);
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

// ─── Intent Classification via Claude ────────────────────────
async function classifyIntent(message, context) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 512,
      system: `You are an intent classifier for a recruiting agency texting system. Classify the candidate's message into exactly one intent. Return ONLY valid JSON.

Valid intents: apply, schedule, negotiate, withdraw, question, accept_offer, reject_offer, reschedule, availability, follow_up, status_check, escalate

Context: ${JSON.stringify(context)}

Return format: {"intent":"<intent>","confidence":<0-1>,"signals":{"sentiment":"positive|neutral|negative","urgency":"low|medium|high"},"memory_updates":[{"type":"<memory_type>","value":<json_value>,"confidence":<0-1>}],"suggested_action":"<action_type or null>"}`,
      messages: [{ role: 'user', content: message }],
    }),
  });
  if (!res.ok) throw new Error(`Claude ${res.status}`);
  const data = await res.json();
  const text = data.content?.[0]?.text || '{}';
  try { return JSON.parse(text); }
  catch { return { intent: 'question', confidence: 0.3, signals: { sentiment: 'neutral', urgency: 'low' }, memory_updates: [], suggested_action: null }; }
}

// ─── Response Generation via Claude ──────────────────────────
async function generateResponse(message, intent, context, policyResult) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      system: `You are Lawrence, an AI recruiting assistant for Aberdeen Consulting. You communicate via text message — be concise, professional, warm. Never reveal internal scoring or policy decisions. Never negotiate outside approved ranges.

Intent detected: ${intent.intent} (confidence: ${intent.confidence})
Policy result: ${JSON.stringify(policyResult)}
Context: ${JSON.stringify(context)}

If policy blocked an action, politely redirect. Keep responses under 160 chars when possible (SMS-friendly). Use the candidate's name if known.`,
      messages: [{ role: 'user', content: message }],
    }),
  });
  if (!res.ok) throw new Error(`Claude response gen ${res.status}`);
  const data = await res.json();
  return data.content?.[0]?.text || "Thanks for your message. Let me look into that and get back to you shortly.";
}

// ─── Policy + FIN-LOCK Evaluation ────────────────────────────
async function evaluatePolicy(intent, context) {
  const result = { passed: true, reason: null, finlock: 'n/a' };
  // Load intent rules
  const intents = await supa('GET', `text_intents?name=eq.${intent.intent}&select=*`);
  const rule = intents?.[0];
  if (!rule) return result;

  // Policy check
  if (rule.requires_policy_check) {
    // Check for high-risk intents with low confidence
    if (intent.confidence < CONFIDENCE_THRESHOLD) {
      result.passed = false;
      result.reason = `Low confidence (${intent.confidence.toFixed(2)}) on policy-required intent`;
      return result;
    }
  }

  // FIN-LOCK check for economic intents
  if (rule.requires_finlock && FINLOCK.active) {
    result.finlock = 'evaluated';
    if (intent.intent === 'negotiate') {
      // Block negotiation attempts that imply rate changes
      const signals = intent.signals || {};
      if (signals.urgency === 'high') {
        result.finlock = 'flagged';
        // Don't block, but flag for review
      }
    }
    if (intent.intent === 'accept_offer' || intent.intent === 'reject_offer') {
      result.finlock = 'checked';
    }
  }
  return result;
}

// ─── Main Handler ────────────────────────────────────────────
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  if (!SUPABASE_KEY) return res.status(503).json({ error: 'Supabase not configured' });
  if (!ANTHROPIC_KEY) return res.status(503).json({ error: 'Anthropic API not configured' });

  const { phone, message, channel = 'sms', entity_type = 'candidate', entity_id } = req.body;
  if (!message) return res.status(400).json({ error: 'message is required' });

  const startMs = Date.now();
  const traceId = crypto.randomUUID?.() || `trace-${Date.now()}`;

  try {
    // 1. Resolve or create conversation
    let convos = [];
    if (phone) {
      convos = await supa('GET', `text_conversations?phone_number=eq.${encodeURIComponent(phone)}&status=eq.active&select=*&limit=1`);
    }
    let convo = convos?.[0];
    if (!convo) {
      const created = await supa('POST', 'text_conversations', {
        entity_type, entity_id: entity_id || null,
        channel, phone_number: phone || null, status: 'active',
        last_message_at: new Date().toISOString(),
      });
      convo = created?.[0];
    }

    // 2. Load context (memory + recent messages)
    const memory = entity_id
      ? await supa('GET', `text_memory?entity_id=eq.${entity_id}&select=*&order=updated_at.desc&limit=10`)
      : [];
    const recentMsgs = convo
      ? await supa('GET', `text_messages?conversation_id=eq.${convo.id}&select=*&order=created_at.desc&limit=5`)
      : [];
    const context = { memory, recentMessages: recentMsgs?.reverse(), entity_type, channel };

    // 3. Classify intent
    const intent = await classifyIntent(message, context);

    // 4. Policy + FIN-LOCK evaluation
    const policyResult = await evaluatePolicy(intent, context);

    // 5. Handle low confidence → escalate
    let escalated = false;
    if (!policyResult.passed) {
      escalated = true;
      if (convo) {
        await supa('PATCH', `text_conversations?id=eq.${convo.id}`, { status: 'escalated' });
      }
    }

    // 6. Generate response
    const responseText = escalated
      ? "Let me have one of our team members follow up with you directly. We'll be in touch shortly."
      : await generateResponse(message, intent, context, policyResult);

    // 7. Persist inbound message
    const inboundMsg = await supa('POST', 'text_messages', {
      conversation_id: convo.id,
      direction: 'inbound', content: message,
      intent: intent.intent, confidence: intent.confidence,
      agent_decision: { signals: intent.signals, suggested_action: intent.suggested_action, trace_id: traceId },
      policy_result: { ...policyResult, finlock: policyResult.finlock },
    });

    // 8. Persist outbound response
    await supa('POST', 'text_messages', {
      conversation_id: convo.id,
      direction: 'outbound', content: responseText,
      intent: 'response', confidence: 1.0,
      agent_decision: { generated: true, escalated, trace_id: traceId },
      policy_result: policyResult,
    });

    // 9. Create action if suggested
    if (intent.suggested_action && !escalated && inboundMsg?.[0]) {
      await supa('POST', 'text_actions', {
        message_id: inboundMsg[0].id,
        action_type: intent.suggested_action,
        status: policyResult.finlock === 'flagged' ? 'blocked' : 'pending',
        result: { intent: intent.intent, confidence: intent.confidence },
      });
    }

    // 10. Update memory
    if (intent.memory_updates?.length > 0 && entity_id) {
      for (const mem of intent.memory_updates) {
        await supa('POST', 'text_memory', {
          entity_id,
          memory_type: mem.type,
          value: typeof mem.value === 'object' ? mem.value : { raw: mem.value },
          confidence: mem.confidence || 0.5,
          updated_at: new Date().toISOString(),
        });
      }
    }

    // 11. Update conversation timestamp
    await supa('PATCH', `text_conversations?id=eq.${convo.id}`, {
      last_message_at: new Date().toISOString(),
    });

    // 12. Log to ai_gateway_requests
    const latency = Date.now() - startMs;
    await supa('POST', 'ai_gateway_requests', {
      intent: `texting:${intent.intent}`,
      input_text: message.slice(0, 500),
      model_used: 'claude-sonnet-4-20250514',
      response_status: escalated ? 'escalated' : 'success',
      latency_ms: latency,
      source: 'texting_inbound',
      policy_decision: policyResult.passed ? 'allow' : 'block',
      trace_id: traceId,
    }).catch(() => {}); // non-critical

    return res.status(200).json({
      response: responseText,
      intent: intent.intent,
      confidence: intent.confidence,
      escalated,
      conversation_id: convo.id,
      trace_id: traceId,
      latency_ms: latency,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Texting pipeline error', details: err.message, trace_id: traceId });
  }
}
