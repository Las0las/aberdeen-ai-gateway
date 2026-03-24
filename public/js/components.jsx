// ─── Components ──────────────────────────────────────────────
// Aberdeen AI Gateway v2.3.0 — React components
// Depends on: utils.js, agents.js, policies.js (loaded before this)

const { useState, useReducer, useEffect, useRef, useCallback, useMemo } = React;

// ─── State ───────────────────────────────────────────────────
const initialState = { activeAgent:null, messages:[], events:[], dlq:[], policies:POLICIES, customAgents:[], panelTab:'config', showCmdPalette:false, showBuilder:false, showSidebar:false, showPanel:false, isLoading:false, totalRequests:0, routingAccuracy:95.2 };
function reducer(s,a){switch(a.type){
  case 'SET_AGENT':return{...s,activeAgent:a.payload,messages:loadConversation(a.payload.id),showSidebar:false};
  case 'ADD_MESSAGE':return{...s,messages:[...s.messages,a.payload]};
  case 'UPDATE_LAST_MESSAGE':return{...s,messages:s.messages.map((m,i)=>i===s.messages.length-1?{...m,content:a.payload}:m)};
  case 'LOAD_MESSAGES':return{...s,messages:a.payload};
  case 'SET_LOADING':return{...s,isLoading:a.payload};
  case 'ADD_EVENT':return{...s,events:[a.payload,...s.events].slice(0,50)};
  case 'ADD_DLQ':return{...s,dlq:[a.payload,...s.dlq]};
  case 'REMOVE_DLQ':return{...s,dlq:s.dlq.filter(d=>d.id!==a.payload)};
  case 'TOGGLE_POLICY':return{...s,policies:s.policies.map(p=>p.id===a.payload?{...p,enabled:!p.enabled}:p)};
  case 'ADD_CUSTOM_AGENT':return{...s,customAgents:[...s.customAgents,a.payload]};
  case 'SET_PANEL_TAB':return{...s,panelTab:a.payload};
  case 'TOGGLE_CMD':return{...s,showCmdPalette:!s.showCmdPalette};
  case 'TOGGLE_BUILDER':return{...s,showBuilder:!s.showBuilder};
  case 'TOGGLE_SIDEBAR':return{...s,showSidebar:!s.showSidebar};
  case 'TOGGLE_PANEL':return{...s,showPanel:!s.showPanel};
  case 'CLOSE_SIDEBAR':return{...s,showSidebar:false};
  case 'CLOSE_PANEL':return{...s,showPanel:false};
  case 'CLEAR_SESSION':if(s.activeAgent){saveConversation(s.activeAgent.id,[])}return{...s,messages:[],events:[]};
  case 'INCREMENT_REQUESTS':return{...s,totalRequests:s.totalRequests+1};
  default:return s;
}}
// ─── Responsive hook ─────────────────────────────────────────
function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);
  useEffect(() => {
    const handler = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return isDesktop;
}

// ─── SVG Icons ───────────────────────────────────────────────
const SendIcon=()=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>;
const MenuIcon=()=><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>;
const PanelIcon=()=><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="15" y1="3" x2="15" y2="21"/></svg>;
const PlusIcon=()=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const XIcon=()=><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const RefreshIcon=()=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>;
const TrashIcon=()=><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>;
const SearchIcon=()=><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const ChatIcon=()=><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
const SettingsIcon=()=><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>;
const AgentsIcon=()=><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
// ─── Command Palette ─────────────────────────────────────────
function CommandPalette({agents,onSelect,onClose}){
  const [query,setQuery]=useState(''); const inputRef=useRef(null); const [fi,setFi]=useState(0);
  useEffect(()=>{inputRef.current?.focus()},[]);
  const filtered=useMemo(()=>{if(!query)return agents.slice(0,8);const q=query.toLowerCase();return agents.filter(a=>a.name.toLowerCase().includes(q)||a.tags?.some(t=>t.toLowerCase().includes(q))||a.cat.includes(q)).slice(0,8)},[query,agents]);
  const handleKey=(e)=>{if(e.key==='Escape')onClose();if(e.key==='ArrowDown'){e.preventDefault();setFi(i=>Math.min(i+1,filtered.length-1))}if(e.key==='ArrowUp'){e.preventDefault();setFi(i=>Math.max(i-1,0))}if(e.key==='Enter'&&filtered[fi]){onSelect(filtered[fi]);onClose()}};
  return(<div className="cmd-overlay" onClick={onClose}><div className="cmd-palette" onClick={e=>e.stopPropagation()}>
    <input ref={inputRef} className="cmd-input" placeholder="Search agents..." value={query} onChange={e=>{setQuery(e.target.value);setFi(0)}} onKeyDown={handleKey}/>
    <div className="cmd-results">{filtered.map((a,i)=>(<div key={a.id} className={`cmd-result${i===fi?' focused':''}`} onClick={()=>{onSelect(a);onClose()}} onMouseEnter={()=>setFi(i)}>
      <div className="cmd-icon" style={{background:a.color+'20',color:a.color}}>{a.icon}</div>
      <div><div className="cmd-name">{a.name}</div><div className="cmd-cat">{CATEGORIES.find(c=>c.id===a.cat)?.name}</div></div>
    </div>))}{filtered.length===0&&<div style={{padding:20,textAlign:'center',color:'var(--text-muted)',fontSize:14}}>No agents found</div>}</div>
  </div></div>);
}

// ─── Agent Builder ───────────────────────────────────────────
function AgentBuilder({onSave,onClose}){
  const [step,setStep]=useState(0);
  const [form,setForm]=useState({name:'',icon:'🤖',color:'#00d4aa',cat:'enterprise-platforms',tier:2,desc:'',sys:'',kw:'',tags:'',rate:'$50-100/hr',demand:'Medium'});
  const steps=['Identity','Prompt','Routing','Review'];
  const set=(k,v)=>setForm({...form,[k]:v});
  const save=()=>{const a={...form,id:'custom-'+Date.now(),kw:form.kw.split(',').map(s=>s.trim()).filter(Boolean),tags:form.tags.split(',').map(s=>s.trim()).filter(Boolean),metrics:{placements:0,avgTime:0,satisfaction:0},related:[]};onSave(a);onClose()};
  return(<div className="builder-overlay" onClick={onClose}><div className="builder" onClick={e=>e.stopPropagation()}>
    <div className="builder-header"><h3>✨ New Agent</h3><button className="btn-icon" onClick={onClose}><XIcon/></button></div>
    <div className="builder-steps">{steps.map((s,i)=><div key={s} className={`builder-step${i===step?' active':''}${i<step?' done':''}`}>{i+1}. {s}</div>)}</div>
    <div className="builder-body">
      {step===0&&<><label>Agent Name</label><input value={form.name} onChange={e=>set('name',e.target.value)} placeholder="e.g. Kubernetes Specialist"/><label>Icon</label><input value={form.icon} onChange={e=>set('icon',e.target.value)} maxLength={4}/><label>Color</label><input type="color" value={form.color} onChange={e=>set('color',e.target.value)} style={{height:40,padding:2}}/><label>Category</label><select value={form.cat} onChange={e=>set('cat',e.target.value)}>{CATEGORIES.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select><label>Description</label><input value={form.desc} onChange={e=>set('desc',e.target.value)} placeholder="Brief description"/></>}
      {step===1&&<><label>System Prompt</label><textarea value={form.sys} onChange={e=>set('sys',e.target.value)} placeholder="You are a specialist in..." rows={6}/><label>Rate Range</label><input value={form.rate} onChange={e=>set('rate',e.target.value)}/><label>Demand</label><select value={form.demand} onChange={e=>set('demand',e.target.value)}><option>Low</option><option>Medium</option><option>High</option><option>Very High</option></select></>}
      {step===2&&<><label>Keywords (comma-separated)</label><textarea value={form.kw} onChange={e=>set('kw',e.target.value)} placeholder="kubernetes, k8s, helm" rows={3}/><label>Tags (comma-separated)</label><textarea value={form.tags} onChange={e=>set('tags',e.target.value)} placeholder="K8s, Containers" rows={2}/></>}
      {step===3&&<div style={{fontSize:14,lineHeight:1.8}}><p><strong>{form.icon} {form.name||'Unnamed'}</strong></p><p style={{color:'var(--text-muted)'}}>{form.desc}</p><p style={{marginTop:8}}>Cat: {CATEGORIES.find(c=>c.id===form.cat)?.name} · T{form.tier} · {form.rate}</p><p style={{marginTop:8,padding:12,borderRadius:'var(--radius-sm)',background:'var(--bg-tertiary)',fontFamily:'var(--font-mono)',fontSize:12,whiteSpace:'pre-wrap'}}>{form.sys||'No prompt'}</p></div>}
    </div>
    <div className="builder-footer"><button className="btn" onClick={()=>step>0?setStep(step-1):onClose()}>{step===0?'Cancel':'← Back'}</button>{step<3?<button className="btn btn-primary" onClick={()=>setStep(step+1)}>Next →</button>:<button className="btn btn-primary" onClick={save}>Deploy</button>}</div>
  </div></div>);
}
// ─── Welcome Screen ──────────────────────────────────────────
function WelcomeScreen({onSelectAgent,agents}){
  const top=agents.filter(a=>a.tier===1).slice(0,3);
  return(<div className="welcome">
    <h1>Welcome to <em>Aberdeen</em></h1>
    <p>Your AI-powered recruiting intelligence gateway. Select an agent or search to get started.</p>
    <div className="welcome-grid">{top.map(a=>(<div key={a.id} className="welcome-card" onClick={()=>onSelectAgent(a)}>
      <div className="wc-icon">{a.icon}</div>
      <div className="wc-text"><div className="wc-title">{a.name}</div><div className="wc-desc">{a.desc}</div></div>
    </div>))}</div>
    <div className="welcome-footer"><span>28 specialized agents</span><span>·</span><span>Supabase pipeline</span><span>·</span><span>Policy engine</span></div>
  </div>);
}

// ─── Sidebar (Drawer on mobile, column on desktop) ──────────
function Sidebar({agents,activeAgent,onSelect,onClose,searchQuery,onSearch}){
  const grouped=useMemo(()=>{const q=searchQuery.toLowerCase();const f=q?agents.filter(a=>a.name.toLowerCase().includes(q)||a.tags?.some(t=>t.toLowerCase().includes(q))):agents;const g={};CATEGORIES.forEach(c=>{g[c.id]=f.filter(a=>a.cat===c.id)});return g},[agents,searchQuery]);
  const [expanded,setExpanded]=useState(new Set(CATEGORIES.map(c=>c.id)));
  const toggle=(id)=>{const n=new Set(expanded);n.has(id)?n.delete(id):n.add(id);setExpanded(n)};
  const recentIds=getRecentAgents();
  const recentAgents=recentIds.map(id=>agents.find(a=>a.id===id)).filter(Boolean);
  return(<div className="sidebar">
    <div className="sidebar-header"><h3>Agents</h3><button className="btn-icon" onClick={onClose}><XIcon/></button></div>
    <div className="sidebar-search"><input placeholder="Filter agents..." value={searchQuery} onChange={e=>onSearch(e.target.value)}/></div>
    {!searchQuery&&recentAgents.length>0&&<div className="recent-section"><div className="recent-label">Recent</div>{recentAgents.map(agent=>(<div key={agent.id} className={`agent-item${activeAgent?.id===agent.id?' active':''}`} onClick={()=>onSelect(agent)}>
      <div className="avatar" style={{background:agent.color+'20',color:agent.color}}>{agent.icon}</div>
      <div className="info"><div className="name">{agent.name}</div><div className="desc">{agent.desc}</div></div>
      <span className={`tier tier-${agent.tier}`}>T{agent.tier}</span>
    </div>))}</div>}
    <div className="sidebar-categories">{CATEGORIES.map(cat=>{const items=grouped[cat.id]||[];if(!items.length)return null;const exp=expanded.has(cat.id);return(<div key={cat.id} className="sidebar-cat">
      <div className="sidebar-cat-header" onClick={()=>toggle(cat.id)}><span>{cat.icon}</span><span>{cat.name}</span><span className="count">{items.length}</span><span style={{fontSize:10,opacity:0.5}}>{exp?'▾':'▸'}</span></div>
      {exp&&items.map(agent=>(<div key={agent.id} className={`agent-item${activeAgent?.id===agent.id?' active':''}`} onClick={()=>onSelect(agent)}>
        <div className="avatar" style={{background:agent.color+'20',color:agent.color}}>{agent.icon}</div>
        <div className="info"><div className="name">{agent.name}</div><div className="desc">{agent.desc}</div></div>
        <span className={`tier tier-${agent.tier}`}>T{agent.tier}</span>
      </div>))}
    </div>)})}</div>
  </div>);
}
// ─── Right Panel (Bottom sheet on mobile, column on desktop) ─
function RightPanel({state,dispatch,onClose}){
  const {panelTab,policies,events,dlq,activeAgent}=state;
  const allAgents=[...AGENTS,...state.customAgents];
  return(<div className="panel">
    <div className="panel-handle"/>
    <div className="panel-tabs">{['config','prompt','policies','events','dlq','metrics'].map(tab=>(<button key={tab} className={`panel-tab${panelTab===tab?' active':''}`} onClick={()=>dispatch({type:'SET_PANEL_TAB',payload:tab})}>{tab==='dlq'?'DLQ':tab.charAt(0).toUpperCase()+tab.slice(1)}</button>))}</div>
    <div className="panel-content">
      {panelTab==='config'&&<div className="config-section"><h4 style={{fontSize:13,fontWeight:600,marginBottom:16,color:'var(--text-primary)'}}>API Configuration</h4><div className="config-field"><label className="config-label">Anthropic API Key</label><input type="password" className="config-input" placeholder="sk-ant-..." defaultValue={CONFIG.ANTHROPIC_KEY} onChange={e=>{CONFIG.ANTHROPIC_KEY=e.target.value;try{localStorage.setItem('aberdeen_anthropic_key',e.target.value)}catch(ex){}}}/><div className="config-hint">Required for AI responses. Get yours at <a href="https://console.anthropic.com" target="_blank" rel="noopener" style={{color:'var(--accent)'}}>console.anthropic.com</a></div></div><div className="config-field"><label className="config-label">Supabase URL</label><input type="text" className="config-input" placeholder="https://xxx.supabase.co" defaultValue={CONFIG.SUPABASE_URL} onChange={e=>{CONFIG.SUPABASE_URL=e.target.value;try{localStorage.setItem('aberdeen_supabase_url',e.target.value)}catch(ex){}}}/></div><div className="config-field"><label className="config-label">Supabase Key</label><input type="password" className="config-input" placeholder="eyJ..." defaultValue={CONFIG.SUPABASE_KEY} onChange={e=>{CONFIG.SUPABASE_KEY=e.target.value;try{localStorage.setItem('aberdeen_supabase_key',e.target.value)}catch(ex){}}}/><div className="config-hint">Optional. Enables NorthStar pipeline queries.</div></div><div className="config-field"><label className="config-label">Model</label><select className="config-input" defaultValue={CONFIG.ANTHROPIC_MODEL} onChange={e=>{CONFIG.ANTHROPIC_MODEL=e.target.value}}><option value="claude-sonnet-4-20250514">Claude Sonnet 4</option><option value="claude-opus-4-20250514">Claude Opus 4</option><option value="claude-haiku-4-20250506">Claude Haiku 4</option></select></div></div>}
      {panelTab==='prompt'&&(activeAgent?<div><div className="sysprompt-header"><div className="sysprompt-agent">{activeAgent.icon} {activeAgent.name}</div>{getCustomPrompts()[activeAgent.id]!==undefined&&<button className="sysprompt-reset" onClick={()=>{setCustomPrompt(activeAgent.id,null);document.querySelector('.sysprompt-editor').value=activeAgent.sys}}>Reset to default</button>}</div><textarea className="sysprompt-editor" defaultValue={getAgentPrompt(activeAgent)} onChange={e=>setCustomPrompt(activeAgent.id,e.target.value)} placeholder="Enter custom system prompt..." rows={8}/><div className="config-hint" style={{marginTop:8}}>Changes apply to the next message. Custom prompts persist in localStorage.</div></div>:<div style={{textAlign:'center',padding:40,color:'var(--text-muted)',fontSize:13}}>Select an agent to view its system prompt.</div>)}
      {panelTab==='policies'&&policies.map(p=>(<div key={p.id} className="policy-card"><div className="policy-header"><span className="policy-name">{p.icon} {p.name}</span><label className="toggle"><input type="checkbox" checked={p.enabled} onChange={()=>dispatch({type:'TOGGLE_POLICY',payload:p.id})}/><span className="slider"/></label></div><div className="policy-desc">{p.desc}</div></div>))}
      {panelTab==='events'&&(events.length===0?<div style={{textAlign:'center',padding:40,color:'var(--text-muted)',fontSize:13}}>No events yet.</div>:events.map((ev,i)=>(<div key={i} className="event-item"><div className="event-dot" style={{background:ev.type==='error'?'var(--danger)':ev.type==='warning'?'var(--warning)':ev.type==='success'?'var(--success)':'var(--info)'}}/><div><div className="event-text">{ev.text}</div><div className="event-time">{new Date(ev.ts).toLocaleTimeString()}</div></div></div>)))}
      {panelTab==='dlq'&&(dlq.length===0?<div style={{textAlign:'center',padding:40,color:'var(--text-muted)',fontSize:13}}>DLQ empty.</div>:dlq.map(d=>(<div key={d.id} className="dlq-item"><div className="dlq-reason">⚠ {d.reason}</div><div className="dlq-msg">"{d.message.slice(0,60)}..."</div><div className="dlq-actions"><button className="btn btn-sm" onClick={()=>dispatch({type:'REMOVE_DLQ',payload:d.id})}><RefreshIcon/> Replay</button><button className="btn btn-sm btn-danger" onClick={()=>dispatch({type:'REMOVE_DLQ',payload:d.id})}><TrashIcon/> Discard</button></div></div>)))}
      {panelTab==='metrics'&&<><div className="metric-grid">
        <div className="metric-card"><div className="metric-value" style={{color:'var(--accent)'}}>{state.totalRequests}</div><div className="metric-label">Requests</div></div>
        <div className="metric-card"><div className="metric-value" style={{color:'var(--info)'}}>{state.routingAccuracy}%</div><div className="metric-label">Accuracy</div></div>
        <div className="metric-card"><div className="metric-value" style={{color:'var(--warning)'}}>{allAgents.length}</div><div className="metric-label">Agents</div></div>
        <div className="metric-card"><div className="metric-value" style={{color:'var(--success)'}}>{state.dlq.length}</div><div className="metric-label">DLQ</div></div>
      </div>
      {activeAgent&&<><h4 style={{fontSize:13,fontWeight:600,marginBottom:12}}>Agent Performance</h4><div className="metric-grid">
        <div className="metric-card"><div className="metric-value">{activeAgent.metrics?.placements||0}</div><div className="metric-label">Placements</div></div>
        <div className="metric-card"><div className="metric-value">{activeAgent.metrics?.avgTime||0}d</div><div className="metric-label">Avg Fill</div></div>
        <div className="metric-card"><div className="metric-value" style={{color:'var(--success)'}}>{activeAgent.metrics?.satisfaction||0}%</div><div className="metric-label">Satisfaction</div></div>
        <div className="metric-card"><div className="metric-value">{activeAgent.rate}</div><div className="metric-label">Rate</div></div>
      </div></>}
      <div style={{marginTop:16}}><div className={`finlock-badge finlock-clear`}>🔐 FIN-LOCK CLEAR</div><div style={{fontSize:11,color:'var(--text-muted)',marginTop:6}}>Floor: {FINLOCK.marginFloor*100}% · Ceiling: ${FINLOCK.rateCeiling}/hr · Limit: ${FINLOCK.costLimit.toLocaleString()}</div></div></>}
    </div>
  </div>);
}
// ─── Main App ────────────────────────────────────────────────
function App(){
  const [state,dispatch]=useReducer(reducer,initialState);
  const [searchQuery,setSearchQuery]=useState('');
  const [input,setInput]=useState('');
  const messagesEndRef=useRef(null);
  const textareaRef=useRef(null);
  const isDesktop=useIsDesktop();
  const allAgents=useMemo(()=>[...AGENTS,...state.customAgents],[state.customAgents]);

  useEffect(()=>{messagesEndRef.current?.scrollIntoView({behavior:'smooth'})},[state.messages]);
  useEffect(()=>{if(state.activeAgent&&state.messages.length>0){saveConversation(state.activeAgent.id,state.messages)}},[state.messages,state.activeAgent]);
  useEffect(()=>{const h=(e)=>{if((e.metaKey||e.ctrlKey)&&e.key==='k'){e.preventDefault();dispatch({type:'TOGGLE_CMD'})}if(e.key==='Escape'){if(state.showCmdPalette)dispatch({type:'TOGGLE_CMD'});if(state.showSidebar)dispatch({type:'CLOSE_SIDEBAR'});if(state.showPanel)dispatch({type:'CLOSE_PANEL'})}};window.addEventListener('keydown',h);return()=>window.removeEventListener('keydown',h)},[state.showCmdPalette,state.showSidebar,state.showPanel]);
  useEffect(()=>{if(textareaRef.current){textareaRef.current.style.height='auto';textareaRef.current.style.height=Math.min(textareaRef.current.scrollHeight,120)+'px'}},[input]);

  // ─── Execution Spine ─────────────────────────────────────
  const handleSend=useCallback(async()=>{
    const msg=input.trim();if(!msg||state.isLoading)return;
    setInput('');dispatch({type:'SET_LOADING',payload:true});dispatch({type:'INCREMENT_REQUESTS'});
    dispatch({type:'ADD_MESSAGE',payload:{role:'user',content:msg,ts:Date.now()}});
    dispatch({type:'ADD_EVENT',payload:{type:'info',text:`Message (${msg.length} chars)`,ts:Date.now()}});
    trackEvent('message_sent', { agent: state.activeAgent?.id, len: msg.length });
    try{
      let agent=state.activeAgent;
      if(!agent){agent=routeMessage(msg,allAgents);if(agent){dispatch({type:'SET_AGENT',payload:agent});dispatch({type:'ADD_EVENT',payload:{type:'success',text:`Routed → ${agent.name}`,ts:Date.now()}});dispatch({type:'ADD_MESSAGE',payload:{role:'user',content:msg,ts:Date.now()}})}}
      if(!agent){dispatch({type:'ADD_MESSAGE',payload:{role:'system',content:'No matching agent. Open the sidebar to pick one.',ts:Date.now()}});dispatch({type:'SET_LOADING',payload:false});return}
      let cleanMsg=msg;
      for(const p of state.policies.filter(p=>p.enabled)){const r=p.check(cleanMsg);if(r.violations.length>0){r.violations.forEach(v=>dispatch({type:'ADD_EVENT',payload:{type:'warning',text:`[${p.name}] ${v}`,ts:Date.now()}}));if(p.id==='prompt-injection'||p.id==='financial-block'){dispatch({type:'ADD_DLQ',payload:{id:Date.now(),message:msg,reason:r.violations[0],agent:agent.id,ts:Date.now()}});dispatch({type:'ADD_MESSAGE',payload:{role:'system',content:`🛡️ Blocked: ${r.violations[0]}`,ts:Date.now()}});dispatch({type:'SET_LOADING',payload:false});return}cleanMsg=r.clean}}      const fin=FINLOCK.check(cleanMsg);if(fin.active){fin.warnings.forEach(w=>dispatch({type:'ADD_EVENT',payload:{type:'error',text:`[FIN-LOCK] ${w}`,ts:Date.now()}}));dispatch({type:'ADD_MESSAGE',payload:{role:'system',content:`🔐 ${fin.warnings.join('; ')}`,ts:Date.now()}})}
      let ctx='';const sb=await querySupabase(cleanMsg);if(sb){ctx=`\n\n[Pipeline: ${sb.table}]\n${JSON.stringify(sb.data.slice(0,5),null,2)}`;dispatch({type:'ADD_EVENT',payload:{type:'info',text:`Supabase: ${sb.data.length} ${sb.table}`,ts:Date.now()}})}
      const agentSys=getAgentPrompt(agent);
      const sysPr=`${agentSys}\n\nAberdeen AI Gateway. Agent: ${agent.name} (${agent.cat}). Rate: ${agent.rate}. Demand: ${agent.demand}.\nFIN-LOCK: floor ${FINLOCK.marginFloor*100}%, ceiling $${FINLOCK.rateCeiling}/hr, limit $${FINLOCK.costLimit.toLocaleString()}.${ctx}`;
      const chatMsgs=state.messages.filter(m=>m.role!=='system').map(m=>({role:m.role==='user'?'user':'assistant',content:m.content}));chatMsgs.push({role:'user',content:cleanMsg});
      dispatch({type:'ADD_EVENT',payload:{type:'info',text:`Calling Claude...`,ts:Date.now()}});
      dispatch({type:'ADD_MESSAGE',payload:{role:'assistant',content:'',ts:Date.now()}});
      const response=await callClaudeStream(chatMsgs,sysPr,(partial)=>{dispatch({type:'UPDATE_LAST_MESSAGE',payload:partial})});
      dispatch({type:'UPDATE_LAST_MESSAGE',payload:response});
      dispatch({type:'ADD_EVENT',payload:{type:'success',text:`Response (${response.length} chars)`,ts:Date.now()}});
      trackEvent('response_received', { agent: agent.id, len: response.length });
    }catch(err){dispatch({type:'ADD_MESSAGE',payload:{role:'system',content:`❌ ${err.message}`,ts:Date.now()}});dispatch({type:'ADD_EVENT',payload:{type:'error',text:err.message,ts:Date.now()}})}
    finally{dispatch({type:'SET_LOADING',payload:false})}
  },[input,state.activeAgent,state.isLoading,state.policies,state.messages,allAgents]);

  const handleKeyDown=(e)=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();handleSend()}};
  const selectAgent=(a)=>{dispatch({type:'SET_AGENT',payload:a});addRecentAgent(a.id);dispatch({type:'ADD_EVENT',payload:{type:'info',text:`→ ${a.name}`,ts:Date.now()}});trackEvent('agent_selected', { agent: a.id });textareaRef.current?.focus()};
  const showSidebar=isDesktop||state.showSidebar;
  const showPanel=isDesktop?state.showPanel:state.showPanel;
  return(
    <div className={`app${showPanel&&isDesktop?' panel-open':''}`}>
      {/* Header */}
      <header className="header">
        <div className="header-brand">
          {!isDesktop&&<button className="btn-icon" onClick={()=>dispatch({type:'TOGGLE_SIDEBAR'})} style={{border:'none'}}><MenuIcon/></button>}
          <div className="header-logo">AG</div>
          <div className="header-title">Aberdeen <em>Gateway</em></div>
        </div>
        <div className="header-status"><span className="dot" style={{width:6,height:6,borderRadius:'50%',background:'var(--success)',animation:'pulse 2s ease-in-out infinite'}}/><span>v{CONFIG.VERSION}</span><span style={{margin:'0 8px',color:'var(--border)'}}>|</span><span>{allAgents.length} agents</span></div>
        <div className="header-actions">
          <div className="header-kbd" onClick={()=>dispatch({type:'TOGGLE_CMD'})}>⌘K</div>
          <button className="btn btn-sm" onClick={()=>dispatch({type:'TOGGLE_BUILDER'})}><PlusIcon/> <span style={{display:isDesktop?'inline':'none'}}>New</span></button>
          {isDesktop&&<button className="btn-icon" onClick={()=>dispatch({type:'TOGGLE_PANEL'})}><PanelIcon/></button>}
        </div>
      </header>

      {/* Sidebar — drawer on mobile, persistent on desktop */}
      {showSidebar && <>
        {!isDesktop && <div className="sidebar-overlay" onClick={()=>dispatch({type:'CLOSE_SIDEBAR'})}/>}
        <Sidebar agents={allAgents} activeAgent={state.activeAgent} onSelect={selectAgent} onClose={()=>dispatch({type:'CLOSE_SIDEBAR'})} searchQuery={searchQuery} onSearch={setSearchQuery}/>
      </>}

      {/* Main Chat */}
      <main className="main">
        {!state.activeAgent ? <WelcomeScreen onSelectAgent={selectAgent} agents={allAgents}/> : <>
          <div className="chat-header">
            <div className="agent-icon" style={{background:state.activeAgent.color+'20',color:state.activeAgent.color}}>{state.activeAgent.icon}</div>
            <div className="agent-info"><h2>{state.activeAgent.name} <span className="badge">{state.activeAgent.demand}</span></h2><p>{state.activeAgent.desc}</p></div>
            <div className="chat-header-actions">
              {state.messages.length>0&&<>{(()=>{const t=estimateTokens(state.messages,state.activeAgent?.sys||'');const pct=Math.min((t/MAX_CONTEXT)*100,100);const color=pct>80?'var(--danger)':pct>50?'var(--warning)':'var(--accent)';return<div className="ctx-bar"><div className="ctx-track"><div className="ctx-fill" style={{width:`${pct}%`,background:color}}/></div><span>{(t/1000).toFixed(1)}k/{MAX_CONTEXT/1000}k</span></div>})()}              <button className="export-btn" onClick={()=>exportConversation(state.activeAgent.name,state.messages)}>Export</button></>}
              <button className="btn btn-sm" onClick={()=>dispatch({type:'CLEAR_SESSION'})}><RefreshIcon/></button>
            </div>
          </div>
          <div className="messages">
            {state.messages.length===0&&<div style={{textAlign:'center',padding:'40px 20px',color:'var(--text-muted)'}}>
              <div style={{fontSize:36,marginBottom:8}}>{state.activeAgent.icon}</div>
              <div style={{fontSize:14,fontWeight:500,color:'var(--text-secondary)'}}>Chat with {state.activeAgent.name}</div>
              <div style={{fontSize:13,maxWidth:300,margin:'8px auto 0',lineHeight:1.5}}>Ask about talent, comp benchmarks, or market trends for {state.activeAgent.tags?.slice(0,3).join(', ')} roles.</div>
            </div>}
            {state.messages.map((m,i)=>(<div key={i} className={`msg ${m.role}`}>
              <div className="avatar-sm">{m.role==='user'?'👤':m.role==='system'?'⚙️':state.activeAgent?.icon||'🤖'}</div>
              {m.role==='assistant'?<div className="bubble" dangerouslySetInnerHTML={renderMd(m.content)}/>:<div className="bubble">{m.content}</div>}
            </div>))}
            {state.isLoading&&<div className="typing"><span/><span/><span/></div>}
            <div ref={messagesEndRef}/>
          </div>
          <div className="input-area">
            <div className="input-row">
              <div className="input-field"><textarea ref={textareaRef} rows={1} value={input} onChange={e=>setInput(e.target.value)} onKeyDown={handleKeyDown} placeholder={`Message ${state.activeAgent.name}...`} disabled={state.isLoading}/></div>
              <button className="send-btn" onClick={handleSend} disabled={!input.trim()||state.isLoading}><SendIcon/></button>
            </div>
            <div className="input-hints"><span>↵ Send</span><span>⇧↵ New line</span></div>
          </div>
        </>}
      </main>

      {/* Right Panel — bottom sheet on mobile, column on desktop */}
      {showPanel && <>
        {!isDesktop && <div className="panel-overlay" onClick={()=>dispatch({type:'CLOSE_PANEL'})}/>}
        <RightPanel state={state} dispatch={dispatch} onClose={()=>dispatch({type:'CLOSE_PANEL'})}/>
      </>}

      {/* Bottom nav — mobile only */}
      {!isDesktop && <nav className="bottom-nav">
        <button className={state.showSidebar?'active':''} onClick={()=>dispatch({type:'TOGGLE_SIDEBAR'})}><AgentsIcon/><span>Agents</span></button>
        <button onClick={()=>dispatch({type:'TOGGLE_CMD'})}><SearchIcon/><span>Search</span></button>
        <button className={state.activeAgent&&!state.showPanel?'active':''} onClick={()=>{if(!state.activeAgent){dispatch({type:'TOGGLE_SIDEBAR'})}}}><ChatIcon/><span>Chat</span></button>
        <button className={state.showPanel?'active':''} onClick={()=>dispatch({type:'TOGGLE_PANEL'})}><SettingsIcon/><span>Settings</span></button>
      </nav>}

      {/* Overlays */}
      {state.showCmdPalette && <CommandPalette agents={allAgents} onSelect={selectAgent} onClose={()=>dispatch({type:'TOGGLE_CMD'})}/>}
      {state.showBuilder && <AgentBuilder onSave={(a)=>dispatch({type:'ADD_CUSTOM_AGENT',payload:a})} onClose={()=>dispatch({type:'TOGGLE_BUILDER'})}/>}
    </div>
  );
}

// ─── Mount ───────────────────────────────────────────────────
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App/>);