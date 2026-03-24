// ─── Utilities ───────────────────────────────────────────────
// Aberdeen AI Gateway v3.0.0 — Vice Design System + Supabase Live

// ─── Markdown Setup ─────────────────────────────────────────
marked.setOptions({breaks:true,gfm:true,headerIds:false,mangle:false});
function renderMd(text){try{return{__html:marked.parse(text)}}catch{return{__html:text}}}

// ─── Recent Agents (localStorage) ───────────────────────────
function getRecentAgents(){try{return JSON.parse(localStorage.getItem('aberdeen_recent_agents')||'[]')}catch{return[]}}
function addRecentAgent(agentId){try{let r=getRecentAgents().filter(id=>id!==agentId);r.unshift(agentId);r=r.slice(0,5);localStorage.setItem('aberdeen_recent_agents',JSON.stringify(r))}catch{}}

// ─── Conversation Persistence ───────────────────────────────
function getCustomPrompts(){try{return JSON.parse(localStorage.getItem('aberdeen_custom_prompts')||'{}')}catch{return{}}}
function setCustomPrompt(agentId,prompt){try{const p=getCustomPrompts();if(prompt)p[agentId]=prompt;else delete p[agentId];localStorage.setItem('aberdeen_custom_prompts',JSON.stringify(p))}catch{}}
function getAgentPrompt(agent){const custom=getCustomPrompts()[agent.id];return custom!==undefined?custom:agent.sys}
function saveConversation(agentId,messages){try{const convos=JSON.parse(localStorage.getItem('aberdeen_conversations')||'{}');convos[agentId]=messages.slice(-100);localStorage.setItem('aberdeen_conversations',JSON.stringify(convos))}catch{}}
function loadConversation(agentId){try{const convos=JSON.parse(localStorage.getItem('aberdeen_conversations')||'{}');return convos[agentId]||[]}catch{return[]}}

// ─── Export ─────────────────────────────────────────────────
function exportConversation(agentName,messages){const lines=[`# ${agentName} — Aberdeen AI Gateway`,`Exported: ${new Date().toLocaleString()}`,'---',''];messages.forEach(m=>{const role=m.role==='user'?'**You**':m.role==='assistant'?`**${agentName}**`:'_System_';lines.push(`${role}:`,m.content,'')});const blob=new Blob([lines.join('\n')],{type:'text/markdown'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`${agentName.replace(/\s+/g,'-').toLowerCase()}-chat-${Date.now()}.md`;a.click();URL.revokeObjectURL(url)}

// ─── Token Estimation ───────────────────────────────────────
function estimateTokens(messages,sysPrompt){let chars=(sysPrompt||'').length;messages.forEach(m=>chars+=m.content.length);return Math.ceil(chars/3.5)}
const MAX_CONTEXT=200000;

// ─── Configuration ───────────────────────────────────────────
const SUPABASE_URL = 'https://lalkdgljfkgiojfbreyq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhbGtkZ2xqZmtnaW9qZmJyZXlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1NTIwNTEsImV4cCI6MjA4NzEyODA1MX0.6Cf1fnYL2jaJORCfaf_uGrJ3f2Xkf_k6pC8j34fWfXY';

const CONFIG = {
  ANTHROPIC_MODEL: (()=>{try{return localStorage.getItem('aberdeen_model')||'claude-sonnet-4-20250514'}catch{return 'claude-sonnet-4-20250514'}})(),
  SUPABASE_URL,
  SUPABASE_KEY: SUPABASE_ANON_KEY,
  MAX_RETRIES: 3, RATE_LIMIT_MS: 1000, SESSION_KEY: 'gw-state', VERSION: '3.0.0'
};

// ─── Supabase Client (lightweight, no SDK) ──────────────────
const supaRest = {
  headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json', 'Prefer': 'return=representation' },
  async query(table, params='') {
    try {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${params}`, { headers: this.headers });
      if (!r.ok) return null;
      return await r.json();
    } catch { return null; }
  },
  async insert(table, data) {
    try {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, { method: 'POST', headers: this.headers, body: JSON.stringify(data) });
      if (!r.ok) { console.warn('Supabase insert failed:', r.status); return null; }
      return await r.json();
    } catch { return null; }
  },
  async rpc(fn, args={}) {
    try {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, { method: 'POST', headers: this.headers, body: JSON.stringify(args) });
      if (!r.ok) return null;
      return await r.json();
    } catch { return null; }
  }
};

// ─── Execution Logging (persists to ai_gateway_requests) ────
async function logExecution({ agentId, intent, inputText, model, status, latencyMs, tokensIn, tokensOut, error }) {
  return supaRest.insert('ai_gateway_requests', {
    intent: intent || agentId,
    input_text: (inputText || '').slice(0, 500),
    model_used: model || CONFIG.ANTHROPIC_MODEL,
    response_status: status || 'success',
    latency_ms: latencyMs || 0,
    token_count_input: tokensIn || 0,
    token_count_output: tokensOut || 0,
    error_message: error || null,
    source: 'aberdeen-gateway',
    policy_decision: 'allow',
    created_at: new Date().toISOString()
  });
}

// ─── Live Pipeline Queries (real Supabase data) ─────────────
async function querySupabase(msg) {
  const l = msg.toLowerCase();
  let table = null, params = '';
  if (/candidate|applicant|resume|talent|sourcing/.test(l)) {
    table = 'candidates';
    params = 'select=id,first_name,last_name,current_title,current_company,status,skills_canonical&limit=8&order=created_at.desc';
  } else if (/job|position|role|opening|requisition/.test(l)) {
    table = 'jobs';
    params = 'select=id,title,status,department,location,salary_min,salary_max&limit=10&order=created_at.desc';
  } else if (/placement|hire|onboard|fill/.test(l)) {
    table = 'placements';
    params = 'select=id,status,start_date,bill_rate,pay_rate,weekly_hours&limit=10&order=created_at.desc';
  }
  if (!table) return null;
  const data = await supaRest.query(table, params);
  if (!data || !data.length) return null;
  return { table, data };
}

// ─── Analytics Dashboard Data (real counts from Supabase) ───
async function fetchDashboardStats() {
  const [candidates, jobs, placements, recentRequests] = await Promise.all([
    supaRest.query('candidates', 'select=id&limit=1&head=true').then(() =>
      fetch(`${SUPABASE_URL}/rest/v1/candidates?select=count`, { headers: { ...supaRest.headers, 'Prefer': 'count=exact' } })
        .then(r => parseInt(r.headers.get('content-range')?.split('/')[1] || '0')).catch(() => 0)
    ),
    supaRest.query('jobs', 'select=id').then(d => d?.length || 0),
    supaRest.query('placements', 'select=id').then(d => d?.length || 0),
    supaRest.query('ai_gateway_requests', 'select=id,intent,response_status,latency_ms,created_at&order=created_at.desc&limit=20')
  ]);
  return { candidates, jobs, placements, recentRequests: recentRequests || [] };
}

// ─── Claude API (Streaming) with execution logging ──────────
async function callClaudeStream(messages, systemPrompt, onChunk, agentId) {
  const body = JSON.stringify({ model: CONFIG.ANTHROPIC_MODEL, max_tokens: 2048, stream: true, system: systemPrompt, messages });
  const startTime = Date.now();
  let r;
  try {
    r = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
  } catch (proxyErr) {
    logExecution({ agentId, intent: 'chat', inputText: messages[messages.length-1]?.content, status: 'error', error: 'Network error', latencyMs: Date.now()-startTime });
    throw new Error('Network error — unable to reach the server.');
  }
  if (r.status === 429) { const data = await r.json().catch(() => ({})); throw new Error(data.message || 'Rate limited. Please wait a moment and try again.'); }
  if (r.status === 503) { throw new Error('API not configured on the server. Ask the admin to set ANTHROPIC_API_KEY in Vercel.'); }
  if (!r.ok) { const data = await r.json().catch(() => ({})); throw new Error(data.message || data.error || `API error ${r.status}`); }
  const remaining = r.headers.get('X-RateLimit-Remaining'); if (remaining !== null) CONFIG._rateLimitRemaining = parseInt(remaining);
  const reader = r.body.getReader(); const decoder = new TextDecoder(); let full = ''; let buf = '';
  while (true) {
    const { done, value } = await reader.read(); if (done) break;
    buf += decoder.decode(value, { stream: true }); const lines = buf.split('\n'); buf = lines.pop() || '';
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue; const json = line.slice(6); if (json === '[DONE]') continue;
      try { const ev = JSON.parse(json); if (ev.type === 'content_block_delta' && ev.delta?.text) { full += ev.delta.text; onChunk(full); } } catch {}
    }
  }
  // Log successful execution to Supabase
  const latencyMs = Date.now() - startTime;
  const tokensIn = Math.ceil(messages.reduce((s,m) => s + m.content.length, 0) / 3.5);
  const tokensOut = Math.ceil((full || '').length / 3.5);
  logExecution({ agentId, intent: 'chat', inputText: messages[messages.length-1]?.content, model: CONFIG.ANTHROPIC_MODEL, status: 'success', latencyMs, tokensIn, tokensOut });
  return full || 'No response.';
}

// ─── Analytics (lightweight — kept for backward compat) ─────
async function trackEvent(event, data) {
  try {
    await fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, data, ts: Date.now(), v: CONFIG.VERSION })
    });
  } catch { /* silent fail */ }
}
