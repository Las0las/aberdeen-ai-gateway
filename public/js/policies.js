// ─── Policy Engine ───────────────────────────────────────────
// Aberdeen AI Gateway v2.3.0 — Policy & routing logic

const POLICIES = [
  { id:'pii-redaction', name:'PII Redaction', icon:'🔒', desc:'Redacts SSN, email, phone patterns', enabled:true,
    check: (msg) => { const p=[/\b\d{3}-\d{2}-\d{4}\b/g,/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g]; let r=msg,f=[]; p.forEach(x=>{const m=msg.match(x);if(m){f.push(...m);r=r.replace(x,'[REDACTED]')}}); return{clean:r,violations:f.length?[`PII: ${f.length} pattern(s) redacted`]:[]}; }},
  { id:'financial-block', name:'Financial Data Guard', icon:'💰', desc:'Blocks credit card numbers and bank data', enabled:true,
    check: (msg) => { const cc=/\b(?:\d{4}[-\s]?){3}\d{4}\b/g; const f=msg.match(cc); return{clean:msg,violations:f?['Credit card pattern detected']:[]}; }},
  { id:'phi-compliance', name:'PHI Compliance', icon:'🏥', desc:'Monitors protected health information', enabled:false,
    check: (msg) => { const p=/\b(patient|diagnosis|prescription|medical record)\b/gi; const f=msg.match(p); return{clean:msg,violations:f?[`PHI terms: ${f.join(', ')}`]:[]}; }},
  { id:'prompt-injection', name:'Prompt Injection Guard', icon:'🛡️', desc:'Blocks prompt injection attempts', enabled:true,
    check: (msg) => { const p=[/ignore (previous|all|above) instructions/i,/you are now/i,/system:\s/i,/do anything now/i]; return{clean:msg,violations:p.some(x=>x.test(msg))?['Prompt injection detected']:[]}; }}
];
const FINLOCK = { marginFloor:0.25, rateCeiling:250, costLimit:50000,
  check:(msg)=>{const w=[];const r=msg.match(/\$(\d+)\s*(?:\/hr|per hour)/i);if(r&&parseInt(r[1])>250)w.push(`Rate $${r[1]}/hr exceeds $250/hr ceiling`);return{active:w.length>0,warnings:w};}
};

function routeMessage(msg,agents){const l=msg.toLowerCase();const s=agents.map(a=>{let sc=0;(a.kw||[]).forEach(k=>{if(l.includes(k.toLowerCase()))sc+=k.includes(' ')?3:2});(a.tags||[]).forEach(t=>{if(l.includes(t.toLowerCase()))sc+=1});if(a.tier===1)sc*=1.1;return{agent:a,score:sc}});s.sort((a,b)=>b.score-a.score);return s[0]?.score>0?s[0].agent:null;}

// Returns top N candidates for disambiguation when scores are close
function routeMessageWithCandidates(msg,agents,topN=3){const l=msg.toLowerCase();const s=agents.map(a=>{let sc=0;(a.kw||[]).forEach(k=>{if(l.includes(k.toLowerCase()))sc+=k.includes(' ')?3:2});(a.tags||[]).forEach(t=>{if(l.includes(t.toLowerCase()))sc+=1});if(a.tier===1)sc*=1.1;return{agent:a,score:sc}}).filter(x=>x.score>0);s.sort((a,b)=>b.score-a.score);if(s.length===0)return{best:null,ambiguous:false,candidates:[]};const best=s[0];const close=s.filter(x=>x.score>=best.score*0.7).slice(0,topN);return{best:best.agent,ambiguous:close.length>1&&best.score<8,candidates:close.map(x=>x.agent)};}

async function querySupabase(msg){if(!CONFIG.SUPABASE_URL||!CONFIG.SUPABASE_KEY)return null;const l=msg.toLowerCase();let t=null;if(/candidate|applicant|resume|talent/.test(l))t='candidates';else if(/job|position|role|opening/.test(l))t='jobs';else if(/placement|hire|onboard/.test(l))t='placements';if(!t)return null;try{const r=await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/${t}?select=*&limit=10`,{headers:{'apikey':CONFIG.SUPABASE_KEY,'Authorization':`Bearer ${CONFIG.SUPABASE_KEY}`}});if(!r.ok)return null;return{table:t,data:await r.json()}}catch{return null}}