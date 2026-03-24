// ─── Components ──────────────────────────────────────────────
// Aberdeen AI Gateway v3.0.0 — Vice Design System
// Depends on: utils.js, agents.js, policies.js (loaded before this)

const { useState, useReducer, useEffect, useRef, useCallback, useMemo } = React;

// ─── State ───────────────────────────────────────────────────
const initialState = { activeAgent:null, messages:[], events:[], dlq:[], policies:POLICIES, customAgents:[], panelTab:'config', showCmdPalette:false, showBuilder:false, showSidebar:false, showPanel:false, isLoading:false, totalRequests:0, routingAccuracy:95.2, disambiguateAgents:null, dashboardStats:null };
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
  case 'REMOVE_LAST_MESSAGE':return{...s,messages:s.messages.slice(0,-1)};
  case 'SET_DISAMBIGUATE':return{...s,disambiguateAgents:a.payload};
  case 'CLEAR_DISAMBIGUATE':return{...s,disambiguateAgents:null};
  case 'SET_DASHBOARD_STATS':return{...s,dashboardStats:a.payload};
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
const SunIcon=()=><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>;
const MoonIcon=()=><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>;
const BarChartIcon=()=><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>;

// ─── Theme hook ──────────────────────────────────────────────
function useTheme(){
  const [theme,setThemeState]=useState(()=>document.documentElement.getAttribute('data-theme')||'dark');
  const toggle=useCallback(()=>{
    const next=theme==='dark'?'light':'dark';
    document.documentElement.setAttribute('data-theme',next);
    document.querySelector('meta[name="theme-color"]').content=next==='light'?'#f5f6fa':'#000000';
    try{localStorage.setItem('aberdeen_theme',next)}catch{}
    setThemeState(next);
  },[theme]);
  return[theme,toggle];
}

// ─── Swipe hook for drawers/sheets ───────────────────────────
function useSwipeDismiss(ref,onDismiss,direction='left'){
  useEffect(()=>{
    const el=ref.current;if(!el)return;
    let startX=0,startY=0,dx=0,dy=0,swiping=false;
    const onStart=(e)=>{const t=e.touches[0];startX=t.clientX;startY=t.clientY;dx=0;dy=0;swiping=true;el.style.transition='none'};
    const onMove=(e)=>{if(!swiping)return;const t=e.touches[0];dx=t.clientX-startX;dy=t.clientY-startY;
      if(direction==='left'&&dx<0){el.style.transform=`translateX(${dx}px)`;el.style.opacity=Math.max(0,1+dx/200)}
      if(direction==='right'&&dx>0){el.style.transform=`translateX(${dx}px)`;el.style.opacity=Math.max(0,1-dx/200)}
      if(direction==='down'&&dy>0){el.style.transform=`translateY(${dy}px)`;el.style.opacity=Math.max(0,1-dy/200)}
    };
    const onEnd=()=>{if(!swiping)return;swiping=false;el.style.transition='transform 0.2s ease, opacity 0.2s ease';
      const threshold=80;
      if((direction==='left'&&dx<-threshold)||(direction==='right'&&dx>threshold)||(direction==='down'&&dy>threshold)){onDismiss()}
      else{el.style.transform='';el.style.opacity=''}
    };
    el.addEventListener('touchstart',onStart,{passive:true});el.addEventListener('touchmove',onMove,{passive:true});el.addEventListener('touchend',onEnd);
    return()=>{el.removeEventListener('touchstart',onStart);el.removeEventListener('touchmove',onMove);el.removeEventListener('touchend',onEnd)};
  },[ref,onDismiss,direction]);
}

// ─── Keyboard Shortcuts Overlay ──────────────────────────────
function ShortcutsOverlay({onClose}){
  useEffect(()=>{const h=(e)=>{if(e.key==='Escape')onClose()};window.addEventListener('keydown',h);return()=>window.removeEventListener('keydown',h)},[onClose]);
  const shortcuts=[['Search agents','⌘ K'],['Shortcuts','?'],['Close overlay','Esc'],['Send message','↵'],['New line','⇧ ↵'],['Toggle sidebar','Click/tap'],['Toggle settings','Click/tap']];
  return(<div className="shortcuts-overlay" onClick={onClose}><div className="shortcuts-modal" onClick={e=>e.stopPropagation()}>
    <h3>Keyboard Shortcuts</h3>
    {shortcuts.map(([label,keys])=>(<div key={label} className="shortcut-row"><span>{label}</span><div className="shortcut-keys">{keys.split(' ').map((k,i)=><span key={i} className="shortcut-key">{k}</span>)}</div></div>))}
    <div style={{marginTop:16,textAlign:'center',fontSize:11,color:'var(--text-muted)'}}>Press <strong>?</strong> anytime to show this</div>
  </div></div>);
}
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
  const [form,setForm]=useState({name:'',icon:'🤖',color:'#41B6E6',cat:'enterprise-platforms',tier:2,desc:'',sys:'',kw:'',tags:'',rate:'$50-100/hr',demand:'Medium'});
  const [touched,setTouched]=useState({});
  const steps=['Identity','Prompt','Routing','Review'];
  const set=(k,v)=>{setForm({...form,[k]:v});setTouched({...touched,[k]:true})};
  const errs={};
  if(!form.name.trim())errs.name='Agent name is required';
  if(!form.desc.trim())errs.desc='Description is required';
  if(!form.sys.trim())errs.sys='System prompt is required';
  const canNext=step===0?form.name.trim()&&form.desc.trim():step===1?form.sys.trim():true;
  const save=()=>{if(Object.keys(errs).length>0)return;const a={...form,id:'custom-'+Date.now(),kw:form.kw.split(',').map(s=>s.trim()).filter(Boolean),tags:form.tags.split(',').map(s=>s.trim()).filter(Boolean),metrics:{placements:0,avgTime:0,satisfaction:0},related:[]};onSave(a);onClose()};
  const builderRef=useRef(null);
  useSwipeDismiss(builderRef,onClose,'down');
  return(<div className="builder-overlay" onClick={onClose}><div className="builder" ref={builderRef} onClick={e=>e.stopPropagation()}>
    <div className="builder-header"><h3>✨ New Agent</h3><button className="btn-icon" onClick={onClose}><XIcon/></button></div>
    <div className="builder-steps">{steps.map((s,i)=><div key={s} className={`builder-step${i===step?' active':''}${i<step?' done':''}`}>{i+1}. {s}</div>)}</div>
    <div className="builder-body">
      {step===0&&<><label>Agent Name *</label><input value={form.name} onChange={e=>set('name',e.target.value)} placeholder="e.g. Kubernetes Specialist" style={touched.name&&errs.name?{borderColor:'var(--danger)'}:{}}/>{touched.name&&errs.name&&<div style={{fontSize:11,color:'var(--danger)',marginTop:2}}>{errs.name}</div>}<label>Icon</label><input value={form.icon} onChange={e=>set('icon',e.target.value)} maxLength={4}/><label>Color</label><input type="color" value={form.color} onChange={e=>set('color',e.target.value)} style={{height:40,padding:2}}/><label>Category</label><select value={form.cat} onChange={e=>set('cat',e.target.value)}>{CATEGORIES.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select><label>Description *</label><input value={form.desc} onChange={e=>set('desc',e.target.value)} placeholder="Brief description" style={touched.desc&&errs.desc?{borderColor:'var(--danger)'}:{}}/>{touched.desc&&errs.desc&&<div style={{fontSize:11,color:'var(--danger)',marginTop:2}}>{errs.desc}</div>}</>}
      {step===1&&<><label>System Prompt *</label><textarea value={form.sys} onChange={e=>set('sys',e.target.value)} placeholder="You are a specialist in..." rows={6} style={touched.sys&&errs.sys?{borderColor:'var(--danger)'}:{}}/>{touched.sys&&errs.sys&&<div style={{fontSize:11,color:'var(--danger)',marginTop:2}}>{errs.sys}</div>}<label>Rate Range</label><input value={form.rate} onChange={e=>set('rate',e.target.value)}/><label>Demand</label><select value={form.demand} onChange={e=>set('demand',e.target.value)}><option>Low</option><option>Medium</option><option>High</option><option>Very High</option></select></>}
      {step===2&&<><label>Keywords (comma-separated)</label><textarea value={form.kw} onChange={e=>set('kw',e.target.value)} placeholder="kubernetes, k8s, helm" rows={3}/><label>Tags (comma-separated)</label><textarea value={form.tags} onChange={e=>set('tags',e.target.value)} placeholder="K8s, Containers" rows={2}/></>}
      {step===3&&<div style={{fontSize:14,lineHeight:1.8}}><div style={{display:'flex',alignItems:'center',gap:10,padding:12,borderRadius:'var(--radius-sm)',background:'var(--bg-tertiary)',marginBottom:12}}><div style={{width:40,height:40,borderRadius:'var(--radius-sm)',background:form.color+'20',color:form.color,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20}}>{form.icon}</div><div><div style={{fontWeight:600}}>{form.name||'Unnamed'}</div><div style={{fontSize:12,color:'var(--text-muted)'}}>{form.desc}</div></div><span style={{marginLeft:'auto',fontSize:9,padding:'2px 6px',borderRadius:4,fontWeight:600,background:'rgba(65,182,230,0.15)',color:'#41B6E6'}}>T{form.tier}</span></div><p style={{marginTop:8}}>Category: {CATEGORIES.find(c=>c.id===form.cat)?.name} · {form.rate} · {form.demand} demand</p><p style={{marginTop:8,padding:12,borderRadius:'var(--radius-sm)',background:'var(--bg-tertiary)',fontFamily:'var(--font-mono)',fontSize:12,whiteSpace:'pre-wrap',maxHeight:120,overflowY:'auto'}}>{form.sys||'No prompt'}</p>{form.kw&&<p style={{marginTop:8,fontSize:12,color:'var(--text-muted)'}}>Keywords: {form.kw}</p>}{form.tags&&<p style={{fontSize:12,color:'var(--text-muted)'}}>Tags: {form.tags}</p>}</div>}
    </div>
    <div className="builder-footer"><button className="btn" onClick={()=>step>0?setStep(step-1):onClose()}>{step===0?'Cancel':'← Back'}</button>{step<3?<button className="btn btn-primary" disabled={!canNext} onClick={()=>canNext&&setStep(step+1)} style={!canNext?{opacity:0.4,cursor:'not-allowed'}:{}}>Next →</button>:<button className="btn btn-primary" onClick={save}>Deploy</button>}</div>
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
    <div className="welcome-footer"><span>{agents.length} specialized agents</span><span>·</span><span>Supabase live pipeline</span><span>·</span><span>Vice Design System</span></div>
  </div>);
}

// ─── Sidebar (Drawer on mobile, column on desktop) ──────────
function Sidebar({agents,activeAgent,onSelect,onClose,searchQuery,onSearch}){
  const sidebarRef=useRef(null);
  useSwipeDismiss(sidebarRef,onClose,'left');
  const grouped=useMemo(()=>{const q=searchQuery.toLowerCase();const f=q?agents.filter(a=>a.name.toLowerCase().includes(q)||a.tags?.some(t=>t.toLowerCase().includes(q))):agents;const g={};CATEGORIES.forEach(c=>{g[c.id]=f.filter(a=>a.cat===c.id)});return g},[agents,searchQuery]);
  const [expanded,setExpanded]=useState(new Set(CATEGORIES.map(c=>c.id)));
  const toggle=(id)=>{const n=new Set(expanded);n.has(id)?n.delete(id):n.add(id);setExpanded(n)};
  const recentIds=getRecentAgents();
  const recentAgents=recentIds.map(id=>agents.find(a=>a.id===id)).filter(Boolean);
  return(<div className="sidebar" ref={sidebarRef}>
    <div className="sidebar-header"><h3>Agents</h3><button className="btn-icon" onClick={onClose}><XIcon/></button></div>
    <div className="sidebar-search"><input placeholder="Filter agents..." value={searchQuery} onChange={e=>onSearch(e.target.value)}/></div>
    {!searchQuery&&recentAgents.length>0&&<div className="recent-section"><div className="recent-label">Recent</div>{recentAgents.map(agent=>(<div key={agent.id} className={`agent-item${activeAgent?.id===agent.id?' active':''}`} onClick={()=>onSelect(agent)}>
      <div className="avatar" style={{background:agent.color+'20',color:agent.color}}>{agent.icon}</div>
      <div className="info"><div className="name">{agent.name}</div><div className="desc">{agent.desc}</div></div>
      <span className={`tier tier-${agent.tier}`}>T{agent.tier}</span>
    </div>))}</div>}
    {CATEGORIES.map(cat=>{const items=grouped[cat.id];if(!items||items.length===0)return null;return(<div key={cat.id} className="cat-group">
      <div className="cat-header" onClick={()=>toggle(cat.id)}><span>{cat.icon} {cat.name}</span><span className="cat-count">{items.length}</span><span style={{marginLeft:'auto',fontSize:10,opacity:0.5}}>{expanded.has(cat.id)?'▼':'▶'}</span></div>
      {expanded.has(cat.id)&&items.map(agent=>(<div key={agent.id} className={`agent-item${activeAgent?.id===agent.id?' active':''}`} onClick={()=>onSelect(agent)}>
        <div className="avatar" style={{background:agent.color+'20',color:agent.color}}>{agent.icon}</div>
        <div className="info"><div className="name">{agent.name}</div><div className="desc">{agent.desc}</div></div>
        <span className={`tier tier-${agent.tier}`}>T{agent.tier}</span>
      </div>))}
    </div>)})}
  </div>);
}

// ─── Right Panel (Config / Events / Dashboard) ──────────────
function RightPanel({state,dispatch,onClose}){
  const panelRef=useRef(null);
  useSwipeDismiss(panelRef,onClose,'right');
  const {panelTab,policies,events,dlq,dashboardStats}=state;
  const tabs=[{id:'config',label:'Policies',icon:'⚙️'},{id:'events',label:'Events',icon:'📡'},{id:'dashboard',label:'Dashboard',icon:'📊'}];
  return(<div className="right-panel" ref={panelRef}>
    <div className="panel-header">
      <div className="panel-tabs">{tabs.map(t=>(<button key={t.id} className={`panel-tab${panelTab===t.id?' active':''}`} onClick={()=>dispatch({type:'SET_PANEL_TAB',payload:t.id})}>{t.icon} {t.label}</button>))}</div>
      <button className="btn-icon" onClick={onClose}><XIcon/></button>
    </div>
    <div className="panel-body">
      {panelTab==='config'&&<div className="policy-list">
        <div style={{fontSize:12,color:'var(--text-muted)',marginBottom:12}}>FIN-LOCK: {FINLOCK.active?'🟢 Active':'⚪ Inactive'} · {policies.filter(p=>p.enabled).length}/{policies.length} policies enabled</div>
        {policies.map(p=>(<div key={p.id} className="policy-item">
          <div className="policy-info"><div className="policy-name">{p.name}</div><div className="policy-desc">{p.desc}</div></div>
          <label className="toggle"><input type="checkbox" checked={p.enabled} onChange={()=>dispatch({type:'TOGGLE_POLICY',payload:p.id})}/><span className="toggle-slider"></span></label>
        </div>))}
      </div>}
      {panelTab==='events'&&<div className="events-list">
        {dlq.length>0&&<div style={{marginBottom:16}}><div style={{fontSize:12,fontWeight:600,color:'var(--vice-fuchsia)',marginBottom:8}}>🔴 Dead Letter Queue ({dlq.length})</div>
          {dlq.map(d=>(<div key={d.id} className="event-item dlq-item"><div className="event-text">{d.input}</div><div className="event-meta">Reason: {d.reason}</div>
            <div style={{display:'flex',gap:6,marginTop:4}}><button className="btn" style={{fontSize:11,padding:'2px 8px'}} onClick={()=>{dispatch({type:'REMOVE_DLQ',payload:d.id})}}>Dismiss</button></div>
          </div>))}
        </div>}
        {events.length===0&&dlq.length===0&&<div style={{textAlign:'center',color:'var(--text-muted)',padding:40,fontSize:14}}>No events yet. Start chatting to see routing events.</div>}
        {events.map((ev,i)=>(<div key={i} className="event-item"><div className="event-text">{ev.text}</div><div className="event-meta">{ev.time}</div></div>))}
      </div>}
      {panelTab==='dashboard'&&<div className="dashboard-panel">
        {!dashboardStats&&<div style={{textAlign:'center',color:'var(--text-muted)',padding:40}}>Loading dashboard data...</div>}
        {dashboardStats&&<>
          <div style={{fontSize:12,color:'var(--text-muted)',marginBottom:12}}>Live Supabase Pipeline Data</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:16}}>
            <div className="stat-card"><div className="stat-value" style={{color:'var(--vice-blue)'}}>{dashboardStats.candidates?.toLocaleString()??'—'}</div><div className="stat-label">Candidates</div></div>
            <div className="stat-card"><div className="stat-value" style={{color:'var(--vice-fuchsia)'}}>{dashboardStats.jobs?.toLocaleString()??'—'}</div><div className="stat-label">Active Jobs</div></div>
            <div className="stat-card"><div className="stat-value" style={{color:'var(--vice-blue)'}}>{dashboardStats.placements?.toLocaleString()??'—'}</div><div className="stat-label">Placements</div></div>
            <div className="stat-card"><div className="stat-value" style={{color:'var(--vice-fuchsia)'}}>{dashboardStats.gatewayRequests?.toLocaleString()??'—'}</div><div className="stat-label">AI Requests</div></div>
          </div>
          <div style={{fontSize:11,fontWeight:600,color:'var(--text-secondary)',marginBottom:8,textTransform:'uppercase',letterSpacing:'0.5px'}}>Recent AI Gateway Requests</div>
          {dashboardStats.recentRequests&&dashboardStats.recentRequests.length>0?
            dashboardStats.recentRequests.map((r,i)=>(<div key={i} className="event-item" style={{borderLeft:`2px solid ${r.response_status==='success'?'var(--vice-blue)':'var(--vice-fuchsia)'}`}}>
              <div className="event-text" style={{fontSize:12}}>{r.intent||'chat'} — {r.model_used||'claude'}</div>
              <div className="event-meta">{r.latency_ms?r.latency_ms+'ms':''} · {r.response_status} · {new Date(r.created_at).toLocaleTimeString()}</div>
            </div>))
            :<div style={{fontSize:12,color:'var(--text-muted)',padding:12}}>No AI requests logged yet. Start chatting to generate data.</div>}
          <div style={{marginTop:12,fontSize:10,color:'var(--text-muted)',textAlign:'center'}}>Data refreshes on panel open · Supabase REST API</div>
        </>}
      </div>}
    </div>
  </div>);
}

// ─── Main App ────────────────────────────────────────────────
function App(){
  const [state,dispatch]=useReducer(reducer,initialState);
  const [input,setInput]=useState('');
  const [searchQuery,setSearchQuery]=useState('');
  const [showShortcuts,setShowShortcuts]=useState(false);
  const messagesEndRef=useRef(null);
  const inputRef=useRef(null);
  const isDesktop=useIsDesktop();
  useTheme();
  const allAgents=useMemo(()=>[...AGENTS,...state.customAgents],[state.customAgents]);

  // Load dashboard stats when panel opens to dashboard tab
  useEffect(()=>{
    if(state.panelTab==='dashboard'&&!state.dashboardStats){
      fetchDashboardStats().then(stats=>{dispatch({type:'SET_DASHBOARD_STATS',payload:stats})}).catch(()=>{});
    }
  },[state.panelTab,state.dashboardStats]);

  // Keyboard shortcuts
  useEffect(()=>{
    const h=(e)=>{
      if(e.key==='k'&&(e.metaKey||e.ctrlKey)){e.preventDefault();dispatch({type:'TOGGLE_CMD'})}
      if(e.key==='?'&&!e.target.closest('input,textarea')){e.preventDefault();setShowShortcuts(s=>!s)}
      if(e.key==='Escape'){setShowShortcuts(false);dispatch({type:'CLOSE_SIDEBAR'});dispatch({type:'CLOSE_PANEL'})}
    };
    window.addEventListener('keydown',h);return()=>window.removeEventListener('keydown',h);
  },[]);

  // Scroll to bottom on new messages
  useEffect(()=>{messagesEndRef.current?.scrollIntoView({behavior:'smooth'})},[state.messages]);

  const selectAgent=(agent)=>{
    dispatch({type:'SET_AGENT',payload:agent});
    addRecentAgent(agent.id);
    if(!isDesktop)dispatch({type:'CLOSE_SIDEBAR'});
    setTimeout(()=>inputRef.current?.focus(),100);
  };

  const handleSend=async()=>{
    const text=input.trim();if(!text||state.isLoading)return;
    setInput('');
    // Route message
    const route=routeMessage(text,state.policies);
    dispatch({type:'ADD_EVENT',payload:{text:`Routed: "${text.slice(0,40)}…" → ${route.agentId||state.activeAgent?.id||'general'}`,time:new Date().toLocaleTimeString()}});
    if(route.blocked){dispatch({type:'ADD_MESSAGE',payload:{role:'assistant',content:`🚫 **Policy blocked**: ${route.reason}`}});return}
    if(route.agentId&&route.agentId!==state.activeAgent?.id){
      const target=allAgents.find(a=>a.id===route.agentId);
      if(target){dispatch({type:'ADD_EVENT',payload:{text:`Auto-routing to ${target.name}`,time:new Date().toLocaleTimeString()}});selectAgent(target)}
    }
    // Disambiguate if multiple candidates
    if(route.candidates&&route.candidates.length>1){dispatch({type:'SET_DISAMBIGUATE',payload:{candidates:route.candidates,originalText:text}});return}
    // Query Supabase for context
    let pipelineContext='';
    try{const data=await querySupabase(text);if(data){pipelineContext=`\n\nRelevant pipeline data:\n${JSON.stringify(data,null,2).slice(0,2000)}`}}catch(e){}

    const agent=state.activeAgent;
    const userMsg={role:'user',content:text};
    dispatch({type:'ADD_MESSAGE',payload:userMsg});
    dispatch({type:'ADD_MESSAGE',payload:{role:'assistant',content:''}});
    dispatch({type:'SET_LOADING',payload:true});
    dispatch({type:'INCREMENT_REQUESTS'});

    const systemPrompt=(agent?.sys||'You are Aberdeen, an AI recruiting assistant.')+pipelineContext;
    const msgHistory=[...state.messages,userMsg].slice(-10).map(m=>({role:m.role,content:m.content}));

    try{
      await callClaudeStream(systemPrompt,msgHistory,(chunk)=>{
        dispatch({type:'UPDATE_LAST_MESSAGE',payload:chunk});
      },agent?.id);
      // Save conversation
      const updated=[...state.messages,userMsg,{role:'assistant',content:'__PLACEHOLDER__'}];
      // The actual content is in the last message via UPDATE_LAST_MESSAGE
    }catch(err){
      dispatch({type:'UPDATE_LAST_MESSAGE',payload:`❌ Error: ${err.message}`});
      dispatch({type:'ADD_EVENT',payload:{text:`Error: ${err.message}`,time:new Date().toLocaleTimeString()}});
    }finally{
      dispatch({type:'SET_LOADING',payload:false});
    }
  };

  const handleDisambiguate=(agent)=>{
    const text=state.disambiguateAgents.originalText;
    dispatch({type:'SET_DISAMBIGUATE',payload:null});
    selectAgent(agent);
    setTimeout(()=>{setInput(text);handleSend()},100);
  };

  const handleKeyDown=(e)=>{
    if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();handleSend()}
  };

  // ─── Render ────────────────────────────────────────────────
  return(<div className={`app${state.showSidebar?' sidebar-open':''}${state.showPanel?' panel-open':''}`}>
    {/* Sidebar */}
    {(state.showSidebar||isDesktop)&&<Sidebar agents={allAgents} activeAgent={state.activeAgent} onSelect={selectAgent} onClose={()=>dispatch({type:'CLOSE_SIDEBAR'})} searchQuery={searchQuery} onSearch={setSearchQuery}/>}

    {/* Main Chat Area */}
    <div className="main">
      <div className="topbar">
        <button className="btn-icon" onClick={()=>dispatch({type:'TOGGLE_SIDEBAR'})}><MenuIcon/></button>
        <div className="topbar-center">
          {state.activeAgent?<><span className="topbar-icon" style={{color:state.activeAgent.color}}>{state.activeAgent.icon}</span><span className="topbar-title">{state.activeAgent.name}</span><span className={`tier tier-${state.activeAgent.tier}`}>T{state.activeAgent.tier}</span></>
          :<span className="topbar-title">Aberdeen Gateway</span>}
        </div>
        <div className="topbar-actions">
          <button className="btn-icon" onClick={()=>dispatch({type:'TOGGLE_CMD'})} title="Search agents (⌘K)"><SearchIcon/></button>
          <button className="btn-icon" onClick={()=>dispatch({type:'TOGGLE_BUILDER'})} title="Create agent"><PlusIcon/></button>
          <button className="btn-icon" onClick={()=>dispatch({type:'TOGGLE_PANEL'})} title="Settings panel"><SettingsIcon/></button>
        </div>
      </div>

      <div className="chat-area">
        {!state.activeAgent&&state.messages.length===0?<WelcomeScreen onSelectAgent={selectAgent} agents={allAgents}/>:(
          <div className="messages">
            {state.messages.map((msg,i)=>(<div key={i} className={`message ${msg.role}`}>
              {msg.role==='assistant'&&state.activeAgent&&<div className="msg-avatar" style={{background:state.activeAgent.color+'20',color:state.activeAgent.color}}>{state.activeAgent.icon}</div>}
              <div className="msg-bubble"><div className="msg-content" dangerouslySetInnerHTML={{__html:formatMessage(msg.content)}}/></div>
            </div>))}
            {state.isLoading&&<div className="typing-indicator"><span/><span/><span/></div>}
            <div ref={messagesEndRef}/>
          </div>
        )}
      </div>

      {/* Disambiguate overlay */}
      {state.disambiguateAgents&&<div className="disambiguate-overlay" onClick={()=>dispatch({type:'SET_DISAMBIGUATE',payload:null})}><div className="disambiguate-modal" onClick={e=>e.stopPropagation()}>
        <h3>Which agent?</h3>
        <p style={{fontSize:13,color:'var(--text-muted)',margin:'8px 0 16px'}}>Multiple agents matched your query:</p>
        {state.disambiguateAgents.candidates.map(a=>(<div key={a.id} className="agent-item" onClick={()=>handleDisambiguate(a)} style={{cursor:'pointer'}}>
          <div className="avatar" style={{background:a.color+'20',color:a.color}}>{a.icon}</div>
          <div className="info"><div className="name">{a.name}</div><div className="desc">{a.desc}</div></div>
        </div>))}
      </div></div>}

      {/* Input bar */}
      <div className="input-bar">
        <div className="input-row">
          <textarea ref={inputRef} className="chat-input" placeholder={state.activeAgent?`Message ${state.activeAgent.name}...`:'Select an agent to start...'} value={input} onChange={e=>setInput(e.target.value)} onKeyDown={handleKeyDown} rows={1} disabled={state.isLoading}/>
          <button className="btn btn-primary send-btn" onClick={handleSend} disabled={!input.trim()||state.isLoading}><SendIcon/></button>
        </div>
        <div className="input-meta">
          <span>{state.activeAgent?`${state.activeAgent.name} · T${state.activeAgent.tier}`:'No agent selected'}</span>
          <span>{state.totalRequests} requests · {state.routingAccuracy}% routing</span>
        </div>
      </div>
    </div>

    {/* Right Panel */}
    {(state.showPanel||isDesktop)&&<RightPanel state={state} dispatch={dispatch} onClose={()=>dispatch({type:'CLOSE_PANEL'})}/>}

    {/* Overlays */}
    {state.showCmdPalette&&<CommandPalette agents={allAgents} onSelect={selectAgent} onClose={()=>dispatch({type:'TOGGLE_CMD'})}/>}
    {state.showBuilder&&<AgentBuilder onSave={a=>dispatch({type:'ADD_CUSTOM_AGENT',payload:a})} onClose={()=>dispatch({type:'TOGGLE_BUILDER'})}/>}
    {showShortcuts&&<ShortcutsOverlay onClose={()=>setShowShortcuts(false)}/>}
  </div>);
}

// ─── Mount ───────────────────────────────────────────────────
const root=ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(App));
