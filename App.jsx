import { useEffect, useMemo, useState } from "react";
import { Activity, CalendarDays, CloudSun, Droplets, FileText, History, Leaf, LogOut, Menu, MessageCircle, Search, Settings, ShieldCheck, Sprout, UploadCloud, UserRound, X, ChevronRight, Sun, Thermometer, Wind, Send, Trash2 } from "lucide-react";
import Auth from "./components/Auth";
import { supabase, supabaseConfigured } from "./lib/supabase";

const navItems = [
  { id: "overview", label: "Overview", icon: Activity },
  { id: "doctor", label: "Crop Doctor", icon: Leaf },
  { id: "irrigation", label: "Irrigation", icon: Droplets },
  { id: "weather", label: "Weather", icon: CloudSun },
  { id: "assistant", label: "AI Assistant", icon: MessageCircle },
  { id: "history", label: "Farm History", icon: History },
  { id: "calendar", label: "Farm Calendar", icon: CalendarDays },
  { id: "resources", label: "Resources", icon: FileText },
];
const tips = [
  ["Check soil moisture", "Check the root zone before watering. Avoid watering only by a fixed schedule.", "water"],
  ["Inspect leaves weekly", "Look at both sides of leaves for spots, insects, curling, or unusual colour.", "leaf"],
  ["Keep farm records", "Record sowing dates, watering, weather, and visible crop changes.", "record"]
];

export default function App() {
  const [session, setSession] = useState(undefined);
  const [active, setActive] = useState("overview");
  const [mobileNav, setMobileNav] = useState(false);
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [report, setReport] = useState("");
  const [apiError, setApiError] = useState("");
  const [history, setHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem("agrivision-history") || "[]"); } catch { return []; }
  });
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState([{ role: "assistant", text: "Hello! I can share general crop-care guidance. Tell me about your crop, symptoms, or farming question." }]);
  const [farmName, setFarmName] = useState("My Farm");
  const [crop, setCrop] = useState("Tomato");
  const [soil, setSoil] = useState("Loamy");
  const [moisture, setMoisture] = useState(38);
  const [city, setCity] = useState("Pune");
  const [calendarTasks, setCalendarTasks] = useState([{ id: 1, task: "Inspect crop leaves", date: new Date().toISOString().slice(0,10), done: false }, { id: 2, task: "Check soil moisture", date: new Date().toISOString().slice(0,10), done: false }]);
  const [newTask, setNewTask] = useState("");

  useEffect(() => {
    if (!supabase) { setSession(null); return; }
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => { localStorage.setItem("agrivision-history", JSON.stringify(history)); }, [history]);

  const today = useMemo(() => new Date().toLocaleDateString("en-IN", { weekday:"long", day:"numeric", month:"long", year:"numeric" }), []);
  const firstName = session?.user?.email?.split("@")[0] || "Farmer";

  function chooseImage(file) {
    if (!file) return;
    setApiError(""); setReport("");
    if (!["image/jpeg","image/png","image/webp"].includes(file.type)) { setApiError("Please select a JPG, PNG, or WebP image."); return; }
    if (file.size > 5*1024*1024) { setApiError("Image must be 5 MB or smaller."); return; }
    setImage(file); setPreview(URL.createObjectURL(file));
  }

  async function analyzeCrop(e) {
    e?.preventDefault();
    if (!image) { setApiError("Please upload a crop image first."); return; }
    setAnalyzing(true); setApiError(""); setReport("");
    try {
      const reader = new FileReader();
      const base64 = await new Promise((resolve,reject) => {
        reader.onload = () => resolve(String(reader.result).split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(image);
      });
      const response = await fetch("/api/crop-doctor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64, mimeType: image.type })
      });
      const data = await response.json().catch(()=>({}));
      if (!response.ok) throw new Error(data.error || `Request failed (${response.status}).`);
      setReport(data.report || "No report returned.");
      setHistory(prev => [{ id: Date.now(), date: new Date().toISOString(), crop, report: data.report || "No report returned." }, ...prev].slice(0,50));
    } catch (e) {
      setApiError((e.message || "Unable to connect to the Crop Doctor API.") + (location.hostname==="localhost" ? " If running locally, use the included local API instructions in README.md." : ""));
    } finally { setAnalyzing(false); }
  }

  async function signOut() { if (supabase) await supabase.auth.signOut(); }

  function sendChat(e) {
    e.preventDefault();
    const q = chatInput.trim(); if (!q) return;
    const answer = "I can offer general guidance, but I cannot diagnose a crop or give location-specific treatment from this demo chat. Please share the crop, growth stage, symptoms, recent weather, and watering pattern. For chemical treatment, confirm with your local Krishi Vigyan Kendra or agricultural officer.";
    setMessages(prev=>[...prev,{role:"user",text:q},{role:"assistant",text:answer}]); setChatInput("");
  }

  function addTask(e) { e.preventDefault(); if (!newTask.trim()) return; setCalendarTasks(prev=>[...prev,{id:Date.now(),task:newTask.trim(),date:new Date().toISOString().slice(0,10),done:false}]); setNewTask(""); }

  if (session === undefined) return <div className="loading-screen"><Sprout size={28}/> Loading AgriVision AI…</div>;
  if (!session) return <Auth/>;

  const title = navItems.find(n=>n.id===active)?.label || "Overview";
  return <div className="app-shell">
    <aside className={`sidebar ${mobileNav?"open":""}`}>
      <div className="brand sidebar-brand"><span className="brand-icon"><Sprout size={23}/></span><span>AgriVision <b>AI</b></span><button className="mobile-close icon-button" onClick={()=>setMobileNav(false)}><X/></button></div>
      <div className="farm-switch"><div className="farm-avatar"><Sprout size={20}/></div><div><strong>{farmName}</strong><small>Farm workspace</small></div><ChevronRight size={16}/></div>
      <div className="nav-caption">WORKSPACE</div>
      <nav>{navItems.map(item=>{const Icon=item.icon;return <button key={item.id} className={`nav-link ${active===item.id?"selected":""}`} onClick={()=>{setActive(item.id);setMobileNav(false);}}><Icon size={18}/><span>{item.label}</span>{item.id==="doctor"&&<span className="nav-dot"/>}</button>})}</nav>
      <div className="sidebar-bottom"><div className="help-card"><span className="help-icon"><ShieldCheck size={18}/></span><strong>Farm with confidence</strong><p>Use AI as a guide, and verify important decisions locally.</p></div><button className="nav-link" onClick={signOut}><LogOut size={18}/><span>Sign out</span></button><div className="user-row"><div className="user-avatar"><UserRound size={18}/></div><div><strong>{firstName}</strong><small>{session.user.email}</small></div></div></div>
    </aside>
    {mobileNav&&<button className="mobile-overlay" aria-label="Close menu" onClick={()=>setMobileNav(false)}/>}
    <main className="main-area">
      <header className="topbar"><button className="mobile-menu icon-button" onClick={()=>setMobileNav(true)}><Menu/></button><div className="breadcrumbs">Workspace <span>/</span> <strong>{title}</strong></div><div className="top-actions"><span className="date-chip"><CalendarDays size={15}/>{today}</span><span className="online-chip"><i/> All systems ready</span><button className="avatar-button" title={session.user.email}>{firstName.slice(0,1).toUpperCase()}</button></div></header>
      <div className="page-content">
        {active==="overview"&&<><section className="welcome-row"><div><span className="eyebrow green">YOUR FARM AT A GLANCE</span><h1>Good day, {firstName} <span>🌿</span></h1><p>Here’s what’s happening on your farm today.</p></div><button className="primary" onClick={()=>setActive("doctor")}><Leaf size={17}/> Check crop health</button></section>
          <section className="hero-banner"><div className="hero-overlay"><span className="eyebrow light">AGRI INTELLIGENCE</span><h2>Healthy crops.<br/>Smarter decisions.</h2><p>Use AI-powered insights to support your everyday farming decisions.</p><button className="banner-button" onClick={()=>setActive("doctor")}>Open Crop Doctor <ChevronRight size={17}/></button></div><div className="hero-plant">🌱</div><div className="banner-orb orb-one"/><div className="banner-orb orb-two"/></section>
          <section className="stats-grid"><Stat icon={Leaf} label="Selected crop" value={crop} note="Change in irrigation panel" tone="green"/><Stat icon={Droplets} label="Soil moisture" value={`${moisture}%`} note={moisture<30?"May need attention":moisture>70?"Monitor for excess water":"Demo reading"} tone="blue"/><Stat icon={CloudSun} label="Weather location" value={city} note="Demo location" tone="orange"/><Stat icon={History} label="Saved analyses" value={String(history.length)} note="Stored in this browser" tone="purple"/></section>
          <section className="content-grid"><div className="panel"><PanelHeader title="Quick actions" subtitle="Get to the tools you use most"/><div className="quick-grid"><Quick icon={Leaf} title="Crop Doctor" desc="Review crop symptoms" onClick={()=>setActive("doctor")} tone="green"/><Quick icon={Droplets} title="Irrigation planner" desc="Check watering guidance" onClick={()=>setActive("irrigation")} tone="blue"/><Quick icon={CloudSun} title="Weather overview" desc="View demo conditions" onClick={()=>setActive("weather")} tone="orange"/><Quick icon={CalendarDays} title="Farm calendar" desc="Track farm tasks" onClick={()=>setActive("calendar")} tone="purple"/></div></div><div className="panel"><PanelHeader title="Today’s checklist" subtitle="Small checks can make a difference"/>{tips.map(([t,d],i)=><div className="tip-row" key={t}><span className="tip-check"><ShieldCheck size={16}/></span><div><strong>{t}</strong><p>{d}</p></div></div>)}</div></section>
        </>}
        {active==="doctor"&&<><PageHeading eyebrow="AI-POWERED CROP SUPPORT" title="Crop Doctor" desc="Upload a clear plant photo for an AI-generated preliminary report."/><div className="doctor-layout"><form className="panel upload-panel" onSubmit={analyzeCrop}><PanelHeader title="Crop image" subtitle="Use a well-lit photo showing the affected leaves or plant."/><label className="field-label">Crop type</label><select value={crop} onChange={e=>setCrop(e.target.value)}><option>Tomato</option><option>Wheat</option><option>Rice</option><option>Cotton</option><option>Soybean</option><option>Sugarcane</option><option>Chilli</option><option>Other / not sure</option></select><label className="upload-zone" htmlFor="crop-file">{preview?<img src={preview} alt="Selected crop preview"/>:<><span className="upload-icon"><UploadCloud size={27}/></span><strong>Click to upload crop image</strong><span>JPG, PNG or WebP · Max 5 MB</span></>}<input id="crop-file" type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>chooseImage(e.target.files?.[0])}/></label>{apiError&&<div className="alert error">{apiError}</div>}<button className="primary wide" disabled={analyzing}>{analyzing?"Analyzing image…":"Analyze crop image"} <ChevronRight size={17}/></button><p className="small-note"><ShieldCheck size={14}/> AI output is guidance, not a confirmed diagnosis.</p></form><div className="panel report-panel"><PanelHeader title="Analysis report" subtitle="Your results will appear here."/><div className={`report-content ${report?"has-report":""}`}>{analyzing?<div className="empty-state"><div className="spinner"/><strong>Reviewing your image…</strong><p>This may take a few moments.</p></div>:report?<><div className="report-badge"><Sprout size={16}/> AI crop report</div><div className="report-text">{report}</div><button className="secondary" onClick={()=>{const blob=new Blob([report],{type:"text/plain"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="agrivision-crop-report.txt";a.click();URL.revokeObjectURL(url);}}><FileText size={16}/> Download report</button></>:<div className="empty-state"><span className="empty-illustration">🌿</span><strong>No report yet</strong><p>Upload a crop photo and run an analysis to see observations and suggested next steps.</p></div>}</div></div></div></>}
        {active==="irrigation"&&<><PageHeading eyebrow="WATER MANAGEMENT" title="Irrigation planner" desc="Adjust the demo values to explore basic watering guidance."/><div className="two-col"><div className="panel"><PanelHeader title="Farm settings" subtitle="These values are illustrative, not sensor readings."/><label className="field-label">Farm name</label><input value={farmName} onChange={e=>setFarmName(e.target.value)} /><label className="field-label">Crop</label><select value={crop} onChange={e=>setCrop(e.target.value)}>{["Tomato","Wheat","Rice","Cotton","Soybean","Sugarcane","Chilli","Other / not sure"].map(x=><option key={x}>{x}</option>)}</select><label className="field-label">Soil type</label><select value={soil} onChange={e=>setSoil(e.target.value)}>{["Sandy","Loamy","Clay","Silty"].map(x=><option key={x}>{x}</option>)}</select><label className="field-label">Soil moisture: {moisture}%</label><input type="range" min="0" max="100" value={moisture} onChange={e=>setMoisture(Number(e.target.value))}/><div className="range-labels"><span>Dry</span><span>Moist</span><span>Wet</span></div></div><div className="panel guidance-panel"><div className="big-water"><Droplets size={30}/></div><span className="eyebrow green">GENERAL GUIDANCE</span><h2>{moisture<25?"Soil may be dry":moisture<40?"Check soil before watering":moisture<70?"Moisture looks moderate":"Avoid overwatering"}</h2><p>{moisture<25?"Check moisture around the root zone. If the reading is accurate and the crop needs water, irrigate gradually.":moisture<40?"Check the soil several centimetres below the surface and consider crop stage and recent rain before irrigating.":moisture<70?"Continue monitoring. Crop water needs vary by species, growth stage, temperature, and soil.":"Pause and check drainage and root-zone conditions before adding more water."}</p><div className="notice"><ShieldCheck size={17}/> This is a demo planner. Use calibrated sensor data and local agronomic guidance for real decisions.</div></div></div></>}
        {active==="weather"&&<><PageHeading eyebrow="WEATHER AWARENESS" title="Weather overview" desc="A simple demo panel. Live weather data is not connected in this starter project."/><div className="panel weather-panel"><div className="weather-search"><div><span className="eyebrow green">LOCATION</span><h2>Farm weather</h2></div><form onSubmit={e=>e.preventDefault()}><Search size={17}/><input value={city} onChange={e=>setCity(e.target.value)} aria-label="Weather location"/><button className="secondary">Set location</button></form></div><div className="weather-hero"><div><span className="eyebrow light">DEMO WEATHER</span><h2>Plan with the forecast</h2><p>Connect a trusted weather API to show live local conditions.</p></div><CloudSun size={76}/></div><div className="weather-cards"><WeatherCard icon={Thermometer} label="Temperature" value="—" note="Live data not connected"/><WeatherCard icon={Droplets} label="Rain chance" value="—" note="Live data not connected"/><WeatherCard icon={Wind} label="Wind" value="—" note="Live data not connected"/><WeatherCard icon={Sun} label="UV index" value="—" note="Live data not connected"/></div><div className="notice"><ShieldCheck size={17}/> Check the official local forecast before spraying, irrigating, or scheduling field work.</div></div></>}
        {active==="assistant"&&<><PageHeading eyebrow="FARMING KNOWLEDGE" title="AI Assistant" desc="Ask a general farming question. This starter chat uses a safe demo response."/><div className="panel chat-panel"><div className="chat-messages">{messages.map((m,i)=><div key={i} className={`chat-message ${m.role}`}><span className="chat-avatar">{m.role==="assistant"?<Sprout size={17}/>:<UserRound size={17}/>}</span><p>{m.text}</p></div>)}</div><form className="chat-form" onSubmit={sendChat}><input value={chatInput} onChange={e=>setChatInput(e.target.value)} placeholder="Ask about your crop…" aria-label="Message"/><button className="primary" aria-label="Send message"><Send size={17}/> Send</button></form><p className="small-note">For real diagnosis or chemical treatment, consult an agricultural expert.</p></div></>}
        {active==="history"&&<><PageHeading eyebrow="YOUR RECORDS" title="Farm history" desc="Crop Doctor reports saved in this browser on this device."/><div className="panel"><PanelHeader title="Saved crop reports" subtitle={`${history.length} report${history.length===1?"":"s"} saved locally`}/>{history.length===0?<div className="empty-state"><span className="empty-illustration">📋</span><strong>No saved reports</strong><p>Your completed Crop Doctor analyses will appear here.</p></div>:<div className="history-list">{history.map(item=><article className="history-item" key={item.id}><div className="history-icon"><Leaf size={19}/></div><div className="history-body"><strong>{item.crop} analysis</strong><small>{new Date(item.date).toLocaleString()}</small><p>{item.report.slice(0,240)}{item.report.length>240?"…":""}</p><button className="text-button" onClick={()=>{setReport(item.report);setActive("doctor");}}>View report <ChevronRight size={15}/></button></div><button className="icon-button" title="Delete report" onClick={()=>setHistory(prev=>prev.filter(x=>x.id!==item.id))}><Trash2 size={17}/></button></article>)}</div>}</div></>}
        {active==="calendar"&&<><PageHeading eyebrow="FIELD PLANNING" title="Farm calendar" desc="Add simple reminders for your farm. Tasks are kept in this browser."/><div className="panel"><PanelHeader title="Farm tasks" subtitle="Plan inspections, irrigation checks, and other activities."/><form className="task-form" onSubmit={addTask}><input value={newTask} onChange={e=>setNewTask(e.target.value)} placeholder="e.g. Inspect leaves in north field"/><button className="primary"><CalendarDays size={17}/> Add task</button></form><div className="task-list">{calendarTasks.length===0?<p className="muted">No tasks yet. Add your first reminder above.</p>:calendarTasks.map(t=><label className={`task-row ${t.done?"completed":""}`} key={t.id}><input type="checkbox" checked={t.done} onChange={()=>setCalendarTasks(prev=>prev.map(x=>x.id===t.id?{...x,done:!x.done}:x))}/><span className="task-date">{t.date}</span><span className="task-title">{t.task}</span><button type="button" className="icon-button" onClick={e=>{e.preventDefault();setCalendarTasks(prev=>prev.filter(x=>x.id!==t.id));}}><Trash2 size={16}/></button></label>)}</div></div></>}
        {active==="resources"&&<><PageHeading eyebrow="LEARN AND PREPARE" title="Farm resources" desc="A few practical reminders for using crop information responsibly."/><div className="resource-grid"><Resource icon={Leaf} title="Crop observation" desc="Photograph affected leaves in daylight. Include the whole plant and close-ups of symptoms."/><Resource icon={Droplets} title="Water management" desc="Consider soil type, crop stage, root depth, recent rain, and local conditions before watering."/><Resource icon={ShieldCheck} title="Safe crop protection" desc="Identify the likely cause before treatment. Follow product labels and local expert guidance."/><Resource icon={FileText} title="Keep records" desc="Log dates, weather, symptoms, interventions, and results to spot patterns over time."/></div><div className="notice"><ShieldCheck size={17}/> Helpful starting points: your local Krishi Vigyan Kendra (KVK), state agriculture department, and qualified agricultural officers.</div></>}
        <footer className="page-footer">AgriVision AI <span>•</span> AI supports decisions; it does not replace local agricultural expertise.</footer>
      </div>
    </main>
  </div>;
}

function Stat({icon:Icon,label,value,note,tone}) { return <div className="stat-card"><span className={`stat-icon ${tone}`}><Icon size={20}/></span><div className="stat-label">{label}</div><div className="stat-value">{value}</div><div className="stat-note">{note}</div></div>; }
function PanelHeader({title,subtitle}) { return <div className="panel-header"><div><h3>{title}</h3><p>{subtitle}</p></div></div>; }
function PageHeading({eyebrow,title,desc}) { return <section className="page-heading"><span className="eyebrow green">{eyebrow}</span><h1>{title}</h1><p>{desc}</p></section>; }
function Quick({icon:Icon,title,desc,onClick,tone}) { return <button className="quick-action" onClick={onClick}><span className={`quick-icon ${tone}`}><Icon size={20}/></span><span><strong>{title}</strong><small>{desc}</small></span><ChevronRight size={17}/></button>; }
function WeatherCard({icon:Icon,label,value,note}) { return <div className="weather-card"><Icon size={20}/><span>{label}</span><strong>{value}</strong><small>{note}</small></div>; }
function Resource({icon:Icon,title,desc}) { return <article className="panel resource-card"><span className="resource-icon"><Icon size={21}/></span><h3>{title}</h3><p>{desc}</p></article>; }