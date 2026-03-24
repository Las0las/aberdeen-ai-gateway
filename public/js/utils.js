// ─── Utilities ───────────────────────────────────────────────
// Aberdeen AI Gateway v2.3.0 — Shared utilities

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
const CONFIG = {
  ANTHROPIC_MODEL: (()=>{try{return localStorage.getItem('aberdeen_model')||'claude-sonnet-4-20250514'}catch{return 'claude-sonnet-4-20250514'}})(),
  SUPABASE_URL: (()=>{try{return localStorage.getItem('aberdeen_supabase_url')||''}catch{return ''}})(),
  SUPABASE_KEY: (()=>{try{return localStorage.getItem('aberdeen_supabase_key')||''}catch{return ''}})(),
  MAX_RETRIES: 3, RATE_LIMIT_MS: 1000, SESSION_KEY: 'gw-state', VERSION: '2.6.0'
};

// ─── Claude API (Streaming) ─────────────────────────────────
async function callClaudeStream(messages,systemPrompt,onChunk){
  const body=JSON.stringify({model:CONFIG.ANTHROPIC_MODEL,max_tokens:2048,stream:true,system:systemPrompt,messages});
  let r;
  try{r=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body})}catch(proxyErr){throw new Error('Network error — unable to reach the server.')}
  if(r.status===429){const data=await r.json().catch(()=>({}));throw new Error(data.message||'Rate limited. Please wait a moment and try again.')}
  if(r.status===503){throw new Error('API not configured on the server. Ask the admin to set ANTHROPIC_API_KEY in Vercel.')}
  if(!r.ok){const data=await r.json().catch(()=>({}));throw new Error(data.message||data.error||`API error ${r.status}`)}
  const remaining=r.headers.get('X-RateLimit-Remaining');if(remaining!==null)CONFIG._rateLimitRemaining=parseInt(remaining);
  const reader=r.body.getReader();const decoder=new TextDecoder();let full='';let buf='';
  while(true){const{done,value}=await reader.read();if(done)break;
    buf+=decoder.decode(value,{stream:true});const lines=buf.split('\n');buf=lines.pop()||'';
    for(const line of lines){if(!line.startsWith('data: '))continue;const json=line.slice(6);if(json==='[DONE]')continue;
      try{const ev=JSON.parse(json);if(ev.type==='content_block_delta'&&ev.delta?.text){full+=ev.delta.text;onChunk(full)}}catch{}}}
  return full||'No response.';
}

// ─── Analytics (lightweight) ────────────────────────────────
async function trackEvent(event, data) {
  try {
    await fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, data, ts: Date.now(), v: CONFIG.VERSION })
    });
  } catch { /* silent fail */ }
}