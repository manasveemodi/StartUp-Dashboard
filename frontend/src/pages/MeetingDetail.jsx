import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { format } from "date-fns";
import {
  ArrowLeft, Building2, Calendar, Plus, Mic, FileText,
  Trash2, Play, Pause, Clock, Square, RotateCcw, Upload,
  AlertCircle, Check, Pin, PinOff, Edit3, Volume2,
  ChevronRight, Tag, Users, X, MapPin, Globe, Mail, Phone
} from "lucide-react";
import { companiesAPI, notesAPI, recordingsAPI, meetingsAPI } from "../utils/api";
import { useToast }         from "../context/ToastContext";
import { useCompanyTime }   from "../context/CompanyTimeContext";
import { useVoiceRecorder } from "../hooks/useVoiceRecorder";
import CreateNoteModal      from "../components/CreateNoteModal";
import NoteCard             from "../components/NoteCard";
import TopBar               from "../components/TopBar";

/* ── helpers ── */
function fmtDur(s) { if(!s) return "0:00"; return `${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,"0")}`; }
function fmtBytes(b) { if(!b) return "—"; const u=["B","KB","MB"],i=Math.floor(Math.log(b)/Math.log(1024)); return `${parseFloat((b/Math.pow(1024,i)).toFixed(1))} ${u[i]}`; }
function fmtTotal(s) { if(!s) return "0m"; const h=Math.floor(s/3600),m=Math.floor((s%3600)/60); return h>0?`${h}h ${m}m`:`${m}m`; }

const statusConf = {
  active:{color:"#059669",bg:"#d1fae5"},inactive:{color:"#6b7280",bg:"#f3f4f6"},
  prospect:{color:"#d97706",bg:"#fef3c7"},client:{color:"#4f46e5",bg:"#ede9fe"},
};
const mStatusConf = {
  scheduled:{color:"#6366f1",bg:"#ede9fe"},ongoing:{color:"#059669",bg:"#d1fae5"},
  completed:{color:"#0891b2",bg:"#cffafe"},cancelled:{color:"#e11d48",bg:"#ffe4e6"},
};

/* ── Audio Player ── */
function AudioPlayer({ recording, onDelete }) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [hoverTime, setHoverTime] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const ref = useRef(null);
  const barRef = useRef(null);

  const url = recordingsAPI.getUrl(recording.filename);

  const toggle = () => {
    if (!ref.current) return;
    if (playing) {
      ref.current.pause();
      setPlaying(false);
    } else {
      ref.current.play().catch(() => {});
      setPlaying(true);
    }
  };

  // ✅ Load duration safely
  const onLoadedMetadata = () => {
    if (ref.current?.duration) {
      setDuration(ref.current.duration);
    }
  };

  // ✅ Update progress
  const onTimeUpdate = () => {
    if (!ref.current || isDragging) return;
    const pct = (ref.current.currentTime / (duration || 1)) * 100;
    setProgress(pct);
  };

  // ✅ SEEK FUNCTION (main fix)
  const seek = (clientX) => {
    if (!ref.current || !barRef.current || !duration) return;

    const rect = barRef.current.getBoundingClientRect();
    let percent = (clientX - rect.left) / rect.width;

    percent = Math.max(0, Math.min(1, percent));

    ref.current.currentTime = percent * duration;
    setProgress(percent * 100);
  };

  // ✅ DRAG HANDLERS
  const handleMouseDown = (e) => {
    setIsDragging(true);
    seek(e.clientX);
  };

  const handleMouseMove = (e) => {
    if (!barRef.current || !duration) return;

    const rect = barRef.current.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;

    setHoverTime(Math.max(0, Math.min(duration, percent * duration)));

    if (isDragging) seek(e.clientX);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Attach global mouse up
  useEffect(() => {
    window.addEventListener("mouseup", handleMouseUp);
    return () => window.removeEventListener("mouseup", handleMouseUp);
  }, []);

  const formatTime = (t) => {
    if (!t && t !== 0) return "0:00";
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="card" style={{ padding: 12 }}>
      <audio
        ref={ref}
        src={url}
        onLoadedMetadata={onLoadedMetadata}
        onTimeUpdate={onTimeUpdate}
        onEnded={() => {
          setPlaying(false);
          setProgress(0);
        }}
      />

      {/* Top Row */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button onClick={toggle}>
          {playing ? <Pause size={14} /> : <Play size={14} />}
        </button>

        <div style={{ flex: 1 }}>
          <div>{recording.label}</div>
          <div style={{ fontSize: 11, opacity: 0.6 }}>
            {formatTime((progress / 100) * duration)} / {formatTime(duration)}
          </div>
        </div>

        {onDelete && (
          <button onClick={() => onDelete(recording._id)}>
            <Trash2 size={14} />
          </button>
        )}
      </div>

      {/* 🔥 SEEK BAR */}
      <div
        ref={barRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        style={{
          height: 6,
          background: "#ddd",
          borderRadius: 999,
          marginTop: 10,
          position: "relative",
          cursor: "pointer",
        }}
      >
        {/* progress */}
        <div
          style={{
            width: `${progress}%`,
            height: "100%",
            background: "red",
            borderRadius: 999,
          }}
        />

        {/* hover preview */}
        {hoverTime !== null && (
          <div
            style={{
              position: "absolute",
              top: -20,
              left: `${(hoverTime / duration) * 100}%`,
              transform: "translateX(-50%)",
              fontSize: 10,
              background: "#000",
              color: "#fff",
              padding: "2px 6px",
              borderRadius: 4,
            }}
          >
            {formatTime(hoverTime)}
          </div>
        )}
      </div>
    </div>
  );
}
/* ── Voice Recorder Panel ── */
function VoicePanel({ meetingId, onSaved }) {
  const { isRecording,isPaused,duration,audioBlob,error,
    startRecording,pauseRecording,resumeRecording,stopRecording,resetRecording } = useVoiceRecorder();
  const [lbl, setLbl]           = useState("");
  const [uploading,setUploading] = useState(false);
  const [saved, setSaved]       = useState(false);

  const handleSave = async () => {
    if (!audioBlob||!meetingId) return;
    setUploading(true);
    try {
      const fd=new FormData();
      fd.append("audio",audioBlob,`rec_${Date.now()}.webm`);
      fd.append("meetingId",meetingId);
      fd.append("duration",duration);
      fd.append("label",lbl||`Recording ${new Date().toLocaleTimeString()}`);
      await recordingsAPI.upload(fd);
      setSaved(true);
      setTimeout(()=>{setSaved(false);resetRecording();setLbl("");onSaved?.();},1400);
    } catch{} finally{setUploading(false);}
  };

  return (
    <div className="card" style={{ padding:18,background:"var(--bg-elevated)" }}>
      <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:14 }}>
        <div style={{ width:30,height:30,borderRadius:"var(--radius-sm)",background:"var(--rose-soft)",border:"1px solid var(--rose)",display:"flex",alignItems:"center",justifyContent:"center" }}>
          <Mic size={14} color="var(--rose)"/>
        </div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:13,fontWeight:700,color:"var(--text-primary)" }}>Voice Recorder</div>
          <div style={{ fontSize:11,color:"var(--text-muted)" }}>Capture audio for this meeting</div>
        </div>
        {isRecording&&<span style={{ fontSize:9,fontWeight:800,padding:"2px 7px",borderRadius:99,background:isPaused?"var(--amber)":"var(--rose)",color:"#fff" }}>{isPaused?"PAUSED":"● REC"}</span>}
      </div>

      {error&&<div style={{ display:"flex",alignItems:"center",gap:6,padding:"7px 10px",borderRadius:"var(--radius-sm)",background:"var(--rose-soft)",border:"1px solid var(--rose)",marginBottom:10,fontSize:11,color:"var(--rose)" }}><AlertCircle size={12}/>{error}</div>}

      {/* Waveform */}
      <div style={{ height:52,borderRadius:"var(--radius-sm)",background:"var(--bg-card)",border:"1px solid var(--border)",display:"flex",alignItems:"center",justifyContent:"center",gap:2,marginBottom:10,overflow:"hidden" }}>
        {isRecording&&!isPaused
          ?Array.from({length:20}).map((_,i)=><div key={i} style={{ width:3,borderRadius:99,background:"linear-gradient(to top,var(--rose),var(--accent))",height:"40%",animation:`wave ${0.6+(i%5)*0.13}s ease-in-out infinite`,animationDelay:`${i*0.07}s` }}/>)
          :audioBlob?<span style={{ fontSize:12,color:"var(--green)",display:"flex",alignItems:"center",gap:5 }}><Check size={14}/>Ready · {fmtDur(duration)}</span>
          :<span style={{ fontSize:11,color:"var(--text-muted)" }}>{isPaused?"Paused":"Press Start to begin recording"}</span>}
      </div>

      {/* Timer */}
      <div style={{ textAlign:"center",marginBottom:10 }}>
        <span style={{ fontFamily:"JetBrains Mono",fontSize:24,fontWeight:700,letterSpacing:2,color:isRecording?"var(--rose)":"var(--text-muted)" }}>{fmtDur(duration)}</span>
      </div>

      {/* Controls */}
      <div style={{ display:"flex",gap:7,marginBottom:isRecording||!audioBlob?0:10 }}>
        {!isRecording&&!audioBlob&&<button onClick={startRecording} className="btn btn-lg" style={{ flex:1,justifyContent:"center",background:"linear-gradient(135deg,var(--rose),#ff3366)",color:"#fff",border:"none",boxShadow:"0 4px 14px #ff5e7a30" }}><Mic size={14}/>Start Recording</button>}
        {isRecording&&!isPaused&&<>
          <button onClick={pauseRecording} className="btn btn-sm" style={{ flex:1,justifyContent:"center",background:"var(--amber-soft)",color:"var(--amber)",border:"1px solid var(--amber)" }}><Pause size={12}/>Pause</button>
          <button onClick={stopRecording} className="btn btn-secondary btn-sm" style={{ flex:1,justifyContent:"center" }}><Square size={12}/>Stop</button>
        </>}
        {isRecording&&isPaused&&<>
          <button onClick={resumeRecording} className="btn btn-sm" style={{ flex:1,justifyContent:"center",background:"var(--green-soft)",color:"var(--green)",border:"1px solid var(--green)" }}><Play size={12}/>Resume</button>
          <button onClick={stopRecording} className="btn btn-secondary btn-sm" style={{ flex:1,justifyContent:"center" }}><Square size={12}/>Stop</button>
        </>}
      </div>

      {audioBlob&&!isRecording&&(
        <div style={{ borderTop:"1px solid var(--border)",paddingTop:10,marginTop:10 }}>
          <audio controls src={URL.createObjectURL(audioBlob)} style={{ width:"100%",height:32,borderRadius:6,marginBottom:8 }}/>
          <input className="input" value={lbl} onChange={e=>setLbl(e.target.value)} placeholder="Label this recording…" style={{ marginBottom:8,fontSize:12 }}/>
          <div style={{ display:"flex",gap:7 }}>
            <button onClick={resetRecording} className="btn btn-secondary btn-sm" style={{ flex:1,justifyContent:"center" }}><RotateCcw size={12}/>Discard</button>
            <button onClick={handleSave} disabled={uploading||saved} className="btn btn-sm" style={{ flex:2,justifyContent:"center",background:saved?"var(--green-soft)":"linear-gradient(135deg,var(--accent),var(--teal))",color:saved?"var(--green)":"#fff",border:"none" }}>
              <Upload size={12}/>{uploading?"Saving…":saved?"Saved!":"Save Recording"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Create Meeting Modal ── */
function CreateMeetingModal({ companyId, onClose, onSaved }) {
  const [form,setForm]=useState({title:"",description:"",status:"ongoing",priority:"medium"});
  const [saving,setSaving]=useState(false);
  const toast=useToast();
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const submit=async()=>{
    if(!form.title.trim()) return;
    setSaving(true);
    try{ await meetingsAPI.create({...form,companyId}); toast.success("Meeting created!"); onSaved(); }
    catch{ toast.error("Failed to create meeting."); }
    finally{setSaving(false);}
  };
  const lbl={fontSize:11,fontWeight:700,color:"var(--text-muted)",display:"block",marginBottom:5,textTransform:"uppercase",letterSpacing:"0.5px"};
  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:20 }}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="card animate-scaleIn" style={{ width:"100%",maxWidth:440,boxShadow:"var(--shadow-xl)" }}>
        <div style={{ padding:"16px 20px",borderBottom:"1px solid var(--border)",display:"flex",alignItems:"center",justifyContent:"space-between" }}>
          <h2 style={{ fontSize:15,fontWeight:700,color:"var(--text-primary)" }}>New Meeting</h2>
          <button onClick={onClose} className="btn btn-ghost btn-sm" style={{ padding:4 }}><X size={15}/></button>
        </div>
        <div style={{ padding:20,display:"flex",flexDirection:"column",gap:12 }}>
          <div><label style={lbl}>Meeting Title *</label>
            <input className="input" value={form.title} onChange={e=>set("title",e.target.value)} placeholder="e.g. Quarterly Review Call" style={{ fontSize:14 }} onKeyDown={e=>e.key==="Enter"&&submit()}/>
          </div>
          <div><label style={lbl}>Description</label>
            <textarea className="input" value={form.description} onChange={e=>set("description",e.target.value)} placeholder="Agenda, goals, context…" rows={2}/>
          </div>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10 }}>
            <div><label style={lbl}>Status</label>
              <select className="input" value={form.status} onChange={e=>set("status",e.target.value)}>
                <option value="scheduled">Scheduled</option>
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div><label style={lbl}>Priority</label>
              <select className="input" value={form.priority} onChange={e=>set("priority",e.target.value)}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
          <div style={{ display:"flex",gap:8,paddingTop:4 }}>
            <button onClick={onClose} className="btn btn-secondary btn-lg" style={{ flex:1 }}>Cancel</button>
            <button onClick={submit} disabled={saving||!form.title.trim()} className="btn btn-primary btn-lg" style={{ flex:2,justifyContent:"center" }}>
              {saving?<><div style={{ width:14,height:14,border:"2px solid rgba(255,255,255,0.4)",borderTopColor:"#fff",borderRadius:"50%",animation:"spin 0.7s linear infinite" }}/>Creating…</>:<><Calendar size={13}/>Create Meeting</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════ MAIN PAGE ═══════════════════════ */
export default function MeetingDetail() {
  const { id }   = useParams();
  const toast    = useToast();
  const { enterCompany, leaveCompany, liveTotal } = useCompanyTime();

  const [company,    setCompany]    = useState(null);
  const [meetings,   setMeetings]   = useState([]);
  const [notes,      setNotes]      = useState([]);
  const [recordings, setRecordings] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [activeTab,  setActiveTab]  = useState("notes");
  const [activeMtg,  setActiveMtg]  = useState(null);
  const [showNote,   setShowNote]   = useState(false);
  const [editNote,   setEditNote]   = useState(null);
  const [showRec,    setShowRec]    = useState(false);
  const [showNewMtg, setShowNewMtg] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await companiesAPI.getById(id);
      const { company:c, meetings:m, notes:n, recordings:rec } = r.data.data;
      setCompany(c);
      setMeetings(m||[]);
      setNotes(n||[]);
      setRecordings(rec||[]);
      if (m?.length) setActiveMtg(prev => m.find(x=>x._id===prev?._id) || m[0]);
    } finally { setLoading(false); }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  // Register this company in the time tracker context (powers sidebar widget)
  useEffect(() => {
    if (company) enterCompany(company._id, company.name);
    return () => { leaveCompany(); };
  }, [company?._id]);

  const filtNotes = activeMtg ? notes.filter(n=>n.meetingId===activeMtg._id) : [];
  const filtRecs  = activeMtg ? recordings.filter(r=>r.meetingId===activeMtg._id) : [];

  const delNote = async nid => { if(!window.confirm("Delete this note?")) return; await notesAPI.delete(nid); toast.success("Note deleted"); load(); };
  const delRec  = async rid => { if(!window.confirm("Delete recording?"))  return; await recordingsAPI.delete(rid); toast.success("Recording deleted"); load(); };
  const pinNote = async nid => { await notesAPI.togglePin(nid); load(); };

  if (loading) return (
    <div style={{ background:"var(--bg-base)",minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center" }}>
      <div style={{ width:32,height:32,border:"3px solid var(--border)",borderTopColor:"var(--accent)",borderRadius:"50%",animation:"spin 0.8s linear infinite" }}/>
    </div>
  );
  if (!company) return (
    <div style={{ background:"var(--bg-base)",minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center" }}>
      <div style={{ textAlign:"center" }}><Building2 size={48} color="var(--text-muted)" style={{ marginBottom:14 }}/><h2 style={{ color:"var(--text-primary)",marginBottom:16 }}>Company not found</h2><Link to="/meetings" className="btn btn-primary">← Back to Meetings</Link></div>
    </div>
  );

  const sc  = statusConf[company.status]||statusConf.active;
  const ini = company.name.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();
  const pal = ["#4f46e5","#0891b2","#059669","#d97706","#7c3aed","#e11d48"];
  const ac  = pal[company.name.charCodeAt(0)%pal.length];

  return (
    <div style={{ background:"var(--bg-base)",minHeight:"100vh" }}>
      <TopBar
        title={company.name}
        subtitle={`${company.industry||"Company"} · ${meetings.length} meetings · ${fmtTotal(liveTotal + (company.totalTimeSpent||0))} spent`}
      />

      <div style={{ padding:"20px 28px", maxWidth:1300 }}>
        <Link to="/meetings" className="btn btn-ghost btn-sm" style={{ marginBottom:16,display:"inline-flex" }}>
          <ArrowLeft size={13}/> Back to Meetings
        </Link>

        <div style={{ display:"grid",gridTemplateColumns:"1fr 320px",gap:20,alignItems:"start" }}>

          {/* ── LEFT ── */}
          <div>
            {/* Company header */}
            <div className="card animate-fadeUp" style={{ padding:22,marginBottom:16,position:"relative",overflow:"hidden" }}>
              <div style={{ position:"absolute",top:0,left:0,right:0,height:3,background:`linear-gradient(90deg,${ac},var(--teal))` }}/>
              <div style={{ display:"flex",alignItems:"flex-start",gap:14,marginTop:4 }}>
                <div style={{ width:52,height:52,borderRadius:12,flexShrink:0,background:`${ac}15`,border:`2px solid ${ac}25`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:800,color:ac }}>{ini}</div>
                <div style={{ flex:1,minWidth:0 }}>
                  <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:3 }}>
                    <h1 style={{ fontSize:20,fontWeight:800,color:"var(--text-primary)",letterSpacing:"-0.3px" }}>{company.name}</h1>
                    <span className="badge" style={{ background:sc.bg,color:sc.color }}>{company.status}</span>
                  </div>
                  {company.industry&&<div style={{ fontSize:12,color:"var(--text-muted)",marginBottom:8 }}>{company.industry}</div>}
                  <div style={{ display:"flex",flexWrap:"wrap",gap:14 }}>
                    {company.email&&<div style={{ display:"flex",alignItems:"center",gap:4 }}><Mail size={11} color="var(--text-muted)"/><span style={{ fontSize:11,color:"var(--text-secondary)" }}>{company.email}</span></div>}
                    {company.website&&<div style={{ display:"flex",alignItems:"center",gap:4 }}><Globe size={11} color="var(--text-muted)"/><span style={{ fontSize:11,color:"var(--text-secondary)" }}>{company.website}</span></div>}
                    {company.phone&&<div style={{ display:"flex",alignItems:"center",gap:4 }}><Phone size={11} color="var(--text-muted)"/><span style={{ fontSize:11,color:"var(--text-secondary)" }}>{company.phone}</span></div>}
                  </div>
                </div>
              </div>
              {company.description&&<p style={{ fontSize:12,color:"var(--text-secondary)",lineHeight:1.65,marginTop:12,paddingTop:12,borderTop:"1px solid var(--border)" }}>{company.description}</p>}
            </div>

            {/* Meetings list */}
            <div className="card animate-fadeUp delay-1" style={{ marginBottom:16,overflow:"hidden" }}>
              <div style={{ padding:"13px 18px",borderBottom:"1px solid var(--border)",display:"flex",alignItems:"center",justifyContent:"space-between" }}>
                <div style={{ display:"flex",alignItems:"center",gap:7 }}>
                  <Calendar size={14} color="var(--accent)"/>
                  <span style={{ fontSize:13,fontWeight:700,color:"var(--text-primary)" }}>Meetings <span style={{ color:"var(--text-muted)",fontWeight:400 }}>({meetings.length})</span></span>
                </div>
                <button className="btn btn-primary btn-sm" onClick={()=>setShowNewMtg(true)}><Plus size={13}/> New Meeting</button>
              </div>
              {meetings.length===0?(
                <div style={{ padding:28,textAlign:"center" }}>
                  <Calendar size={28} color="var(--text-muted)" style={{ marginBottom:10 }}/>
                  <p style={{ fontSize:12,color:"var(--text-muted)",marginBottom:14 }}>No meetings yet with this company</p>
                  <button className="btn btn-primary btn-sm" onClick={()=>setShowNewMtg(true)}><Plus size={12}/>Create First Meeting</button>
                </div>
              ):meetings.map((m,i)=>{
                const msc=mStatusConf[m.status]||mStatusConf.scheduled;
                const isAct=activeMtg?._id===m._id;
                const noteCount=notes.filter(n=>n.meetingId===m._id).length;
                const recCount=recordings.filter(r=>r.meetingId===m._id).length;
                return (
                  <div key={m._id} onClick={()=>setActiveMtg(m)}
                    style={{ padding:"11px 18px",borderBottom:i<meetings.length-1?"1px solid var(--border)":"none",cursor:"pointer",transition:"background 0.15s",
                      background:isAct?"var(--accent-soft)":"none",
                      borderLeft:isAct?"3px solid var(--accent)":"3px solid transparent" }}
                    onMouseEnter={e=>{ if(!isAct) e.currentTarget.style.background="var(--bg-elevated)"; }}
                    onMouseLeave={e=>{ if(!isAct) e.currentTarget.style.background="none"; }}>
                    <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between" }}>
                      <div>
                        <div style={{ fontSize:13,fontWeight:isAct?700:500,color:isAct?"var(--accent-text)":"var(--text-primary)",marginBottom:2 }}>{m.title}</div>
                        <div style={{ display:"flex",alignItems:"center",gap:10,fontSize:11,color:"var(--text-muted)" }}>
                          <span style={{ fontFamily:"JetBrains Mono" }}>{format(new Date(m.createdAt),"MMM d, yyyy · HH:mm")}</span>
                          {noteCount>0&&<span>📝 {noteCount} notes</span>}
                          {recCount>0&&<span>🎤 {recCount} recordings</span>}
                        </div>
                      </div>
                      <span className="badge" style={{ background:msc.bg,color:msc.color,fontSize:10 }}>{m.status}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Notes & Recordings workspace */}
            {activeMtg&&(
              <div className="card animate-scaleIn" style={{ overflow:"hidden" }}>
                {/* Meeting banner + actions */}
                <div style={{ padding:"10px 18px",background:"var(--accent-soft)",borderBottom:"1px solid var(--accent-glow)",display:"flex",alignItems:"center",justifyContent:"space-between" }}>
                  <div>
                    <div style={{ fontSize:11,color:"var(--accent-text)",fontWeight:600,opacity:0.7 }}>Active Meeting</div>
                    <div style={{ fontSize:13,fontWeight:700,color:"var(--accent-text)" }}>{activeMtg.title}</div>
                  </div>
                  <div style={{ display:"flex",gap:7 }}>
                    <button className="btn btn-sm" style={{ background:"var(--accent)",color:"#fff",border:"none" }} onClick={()=>{setEditNote(null);setShowNote(true);}}>
                      <Plus size={12}/><FileText size={12}/>Note
                    </button>
                    <button className="btn btn-sm" style={{ background:showRec?"var(--rose)":"var(--rose-soft)",color:showRec?"#fff":"var(--rose)",border:showRec?"none":"1px solid var(--rose)" }} onClick={()=>setShowRec(!showRec)}>
                      <Mic size={12}/>{showRec?"Hide":"Record"}
                    </button>
                  </div>
                </div>

                {/* Tabs */}
                <div style={{ display:"flex",borderBottom:"1px solid var(--border)" }}>
                  {[{id:"notes",label:`Notes (${filtNotes.length})`,icon:FileText},{id:"recordings",label:`Recordings (${filtRecs.length})`,icon:Mic}].map(t=>(
                    <button key={t.id} onClick={()=>setActiveTab(t.id)} style={{ flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:6,padding:"11px",border:"none",cursor:"pointer",fontFamily:"Inter",fontSize:12,fontWeight:activeTab===t.id?700:400,background:activeTab===t.id?"var(--bg-card)":"var(--bg-elevated)",color:activeTab===t.id?"var(--text-primary)":"var(--text-muted)",borderBottom:activeTab===t.id?"2px solid var(--accent)":"2px solid transparent",transition:"all 0.15s" }}>
                      <t.icon size={13}/>{t.label}
                    </button>
                  ))}
                </div>

                <div style={{ padding:16 }}>
                  {/* Recorder (toggleable) */}
                  {showRec&&<div style={{ marginBottom:14 }}><VoicePanel meetingId={activeMtg._id} onSaved={()=>{setShowRec(false);load();}}/></div>}

                  {/* Notes */}
                  {activeTab==="notes"&&(
                    filtNotes.length===0?(
                      <div style={{ textAlign:"center",padding:28 }}>
                        <FileText size={26} color="var(--text-muted)" style={{ marginBottom:10 }}/>
                        <p style={{ fontSize:12,color:"var(--text-muted)",marginBottom:14 }}>No notes yet. Capture your first discussion point.</p>
                        <button className="btn btn-primary btn-sm" onClick={()=>setShowNote(true)}><Plus size={12}/>Add First Note</button>
                      </div>
                    ):(
                      <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
                        {filtNotes.map(n=><NoteCard key={n._id} note={n} onDelete={delNote} onEdit={n=>{setEditNote(n);setShowNote(true);}} onPin={pinNote}/>)}
                      </div>
                    )
                  )}

                  {/* Recordings */}
                  {activeTab==="recordings"&&(
                    filtRecs.length===0?(
                      <div style={{ textAlign:"center",padding:28 }}>
                        <Mic size={26} color="var(--text-muted)" style={{ marginBottom:10 }}/>
                        <p style={{ fontSize:12,color:"var(--text-muted)",marginBottom:14 }}>No recordings yet for this meeting.</p>
                        <button className="btn btn-sm" style={{ background:"var(--rose-soft)",color:"var(--rose)",border:"1px solid var(--rose)" }} onClick={()=>setShowRec(true)}><Mic size={12}/>Start Recording</button>
                      </div>
                    ):(
                      <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
                        {filtRecs.map(r=><AudioPlayer key={r._id} recording={r} onDelete={delRec}/>)}
                      </div>
                    )
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT: Stats card ── */}
          <div style={{ position:"sticky",top:80,display:"flex",flexDirection:"column",gap:14 }}>
            <div className="card animate-fadeUp delay-2" style={{ padding:0,overflow:"hidden" }}>
              <div style={{ padding:"12px 16px",borderBottom:"1px solid var(--border)",background:"var(--bg-elevated)" }}>
                <span style={{ fontSize:12,fontWeight:700,color:"var(--text-primary)" }}>Workspace Stats</span>
              </div>
              <div style={{ padding:"12px 16px" }}>
                {[
                  ["Total Meetings",    meetings.length,      "var(--accent)"],
                  ["Total Notes",       notes.length,         "var(--amber)" ],
                  ["Total Recordings",  recordings.length,    "var(--rose)"  ],
                  ["Actions Completed", notes.reduce((a,n)=>a+(n.actionItems?.filter(x=>x.done).length||0),0), "var(--green)"],
                  ["Time Spent",        fmtTotal(liveTotal+(company.totalTimeSpent||0)), "var(--teal)"],
                ].map(([l,v,c],i,arr)=>(
                  <div key={l} style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"9px 0",borderBottom:i<arr.length-1?"1px solid var(--border)":"none" }}>
                    <span style={{ fontSize:12,color:"var(--text-secondary)" }}>{l}</span>
                    <span style={{ fontSize:typeof v==="string"?13:15,fontWeight:800,color:c,fontFamily:typeof v==="string"?"JetBrains Mono":"inherit" }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Hint when no meeting selected */}
            {!activeMtg&&meetings.length>0&&(
              <div style={{ padding:"14px 16px",borderRadius:"var(--radius-sm)",background:"var(--accent-soft)",border:"1px solid var(--accent-glow)" }}>
                <div style={{ fontSize:12,fontWeight:700,color:"var(--accent-text)",marginBottom:5 }}>👆 Select a meeting</div>
                <p style={{ fontSize:11,color:"var(--accent-text)",opacity:0.8,lineHeight:1.6 }}>Click any meeting above to open its notes and recordings workspace.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showNote&&activeMtg&&(
        <CreateNoteModal meetingId={activeMtg._id} note={editNote}
          onClose={()=>{setShowNote(false);setEditNote(null);}}
          onSaved={()=>{setShowNote(false);setEditNote(null);load();}}/>
      )}
      {showNewMtg&&<CreateMeetingModal companyId={id} onClose={()=>setShowNewMtg(false)} onSaved={()=>{setShowNewMtg(false);load();}}/>}
    </div>
  );
}
