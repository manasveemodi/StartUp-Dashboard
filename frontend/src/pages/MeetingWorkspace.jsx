import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { format } from "date-fns";
import {
  ArrowLeft, Building2, Plus, Mic, FileText,
  Trash2, Play, Pause, Square, RotateCcw, Upload,
  AlertCircle, Calendar, Clock, CheckCircle,
  Tag, Pin, PinOff, Edit3, X, Users, ChevronDown, ChevronRight,
  Layers, Radio
} from "lucide-react";
import { companiesAPI, meetingsAPI, notesAPI, recordingsAPI } from "../utils/api";
import { useToast }       from "../context/ToastContext";
import { useCompanyTime } from "../context/CompanyTimeContext";
import { useVoiceRecorder } from "../hooks/useVoiceRecorder";
import TopBar           from "../components/TopBar";

/* ─── helpers ─────────────────────────────────────────────── */
const fmtDur   = s => { if(!s)return"0:00"; return `${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,"0")}`; };
const fmtBytes = b => { if(!b)return"—"; const u=["B","KB","MB"],i=Math.floor(Math.log(b)/Math.log(1024)); return `${parseFloat((b/Math.pow(1024,i)).toFixed(1))} ${u[i]}`; };
const fmtTotal = s => { if(!s)return"0m"; const h=Math.floor(s/3600),m=Math.floor((s%3600)/60); return h>0?`${h}h ${m}m`:`${m}m`; };

const statusConf  = { active:{color:"#059669",bg:"#d1fae5"}, inactive:{color:"#6b7280",bg:"#f3f4f6"}, prospect:{color:"#d97706",bg:"#fef3c7"}, client:{color:"#4f46e5",bg:"#ede9fe"} };
const mStatusConf = { scheduled:{color:"#6366f1",bg:"#ede9fe"}, ongoing:{color:"#059669",bg:"#d1fae5"}, completed:{color:"#0891b2",bg:"#cffafe"}, cancelled:{color:"#e11d48",bg:"#ffe4e6"} };
const prioConf    = { high:{color:"var(--rose)",bg:"var(--rose-soft)"}, medium:{color:"var(--amber)",bg:"var(--amber-soft)"}, low:{color:"var(--green)",bg:"var(--green-soft)"} };

/* ════════════════════════════════════════════
   AUDIO PLAYER
════════════════════════════════════════════ */
function AudioPlayer({ recording, onDelete }) {
  const [playing,  setPlaying]  = useState(false);
  const [progress, setProgress] = useState(0);
  const ref = useRef(null);
  const toggle = () => {
    if (!ref.current) return;
    if (playing) { ref.current.pause(); setPlaying(false); }
    else { ref.current.play().catch(()=>{}); setPlaying(true); }
  };
  return (
    <div style={{ padding:"12px 14px", borderRadius:"var(--radius-sm)", background:"var(--bg-elevated)", border:"1px solid var(--border)" }}>
      <audio ref={ref} src={recordingsAPI.getUrl(recording.filename)}
        onEnded={()=>{ setPlaying(false); setProgress(0); }}
        onTimeUpdate={e=>setProgress((e.target.currentTime/(e.target.duration||1))*100)}
        onError={()=>setPlaying(false)}/>
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
        <button onClick={toggle} style={{ width:32,height:32,borderRadius:"50%",border:"none",cursor:"pointer",flexShrink:0,background:"linear-gradient(135deg,var(--rose),#ff3366)",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 2px 8px #ff5e7a30" }}>
          {playing ? <Pause size={12} color="#fff" fill="#fff"/> : <Play size={12} color="#fff" fill="#fff"/>}
        </button>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:12,fontWeight:600,color:"var(--text-primary)",marginBottom:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{recording.label}</div>
          <div style={{ fontSize:10,color:"var(--text-muted)",fontFamily:"JetBrains Mono" }}>{fmtDur(recording.duration)} · {fmtBytes(recording.fileSize)}</div>
        </div>
        {onDelete && (
          <button onClick={()=>onDelete(recording._id)} className="btn btn-ghost btn-sm" style={{ padding:"3px 6px",color:"var(--text-muted)" }}
            onMouseEnter={e=>{e.currentTarget.style.color="var(--rose)";e.currentTarget.style.background="var(--rose-soft)";}}
            onMouseLeave={e=>{e.currentTarget.style.color="var(--text-muted)";e.currentTarget.style.background="transparent";}}>
            <Trash2 size={12}/>
          </button>
        )}
      </div>
      <div style={{ height:3,background:"var(--border)",borderRadius:99,overflow:"hidden",cursor:"pointer",marginBottom:6 }}
        onClick={e=>{ if(!ref.current) return; const r=e.currentTarget.getBoundingClientRect(); ref.current.currentTime=((e.clientX-r.left)/r.width)*(ref.current.duration||0); }}>
        <div style={{ height:"100%",background:"linear-gradient(90deg,var(--rose),var(--accent))",width:`${progress}%`,transition:"width 0.1s",borderRadius:99 }}/>
      </div>
      <div style={{ fontSize:10,color:"var(--text-muted)",fontFamily:"JetBrains Mono" }}>
        🕐 {format(new Date(recording.createdAt),"MMM d, yyyy · HH:mm:ss")}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════
   NOTE CARD
════════════════════════════════════════════ */
function NoteCard({ note, onDelete, onEdit, onPin }) {
  const pc = prioConf[note.priority] || prioConf.medium;
  const done  = (note.actionItems||[]).filter(a=>a.done).length;
  const total = (note.actionItems||[]).length;
  return (
    <div style={{ padding:14, borderRadius:"var(--radius-sm)", background:"var(--bg-card)", border:"1px solid var(--border)", borderLeft:`3px solid ${pc.color}`, transition:"background 0.15s" }}
      onMouseEnter={e=>e.currentTarget.style.background="var(--bg-card-hover)"}
      onMouseLeave={e=>e.currentTarget.style.background="var(--bg-card)"}>
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:8, marginBottom:6 }}>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:2 }}>
            {note.isPinned && <Pin size={11} color="var(--amber)" fill="var(--amber)"/>}
            <h4 style={{ fontSize:13, fontWeight:700, color:"var(--text-primary)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{note.title}</h4>
          </div>
          {note.topic && <span style={{ fontSize:10, color:"var(--accent-text)", display:"flex", alignItems:"center", gap:3 }}><Tag size={9}/>{note.topic}</span>}
        </div>
        <span className="badge" style={{ background:pc.bg, color:pc.color, fontSize:10, flexShrink:0 }}>{note.priority}</span>
      </div>
      <p style={{ fontSize:12, color:"var(--text-secondary)", lineHeight:1.6, marginBottom:6, display:"-webkit-box", WebkitLineClamp:3, WebkitBoxOrient:"vertical", overflow:"hidden" }}>{note.content}</p>
      {total > 0 && (
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6, padding:"5px 8px", borderRadius:"var(--radius-xs)", background:"var(--bg-elevated)", border:"1px solid var(--border)" }}>
          <CheckCircle size={11} color="var(--teal)"/>
          <div style={{ flex:1, height:3, background:"var(--border)", borderRadius:99, overflow:"hidden" }}>
            <div style={{ height:"100%", width:`${(done/total)*100}%`, background:"var(--teal)", borderRadius:99 }}/>
          </div>
          <span style={{ fontSize:10, color:"var(--text-muted)" }}><span style={{ color:"var(--teal)", fontWeight:700 }}>{done}</span>/{total}</span>
        </div>
      )}
      {note.tags?.length > 0 && (
        <div style={{ display:"flex", flexWrap:"wrap", gap:3, marginBottom:6 }}>
          {note.tags.slice(0,4).map(t=><span key={t} style={{ padding:"1px 7px", borderRadius:99, fontSize:10, background:"var(--accent-soft)", color:"var(--accent-text)" }}>{t}</span>)}
        </div>
      )}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ display:"flex", alignItems:"center", gap:4 }}>
          <Clock size={10} color="var(--text-muted)"/>
          <span style={{ fontSize:10, color:"var(--text-muted)", fontFamily:"JetBrains Mono" }}>
            {format(new Date(note.createdAt),"MMM d, yyyy · HH:mm:ss")}
          </span>
        </div>
        <div style={{ display:"flex", gap:2 }}>
          {onPin && <button onClick={()=>onPin(note._id)} className="btn btn-ghost btn-sm" style={{ padding:"3px 5px", color:note.isPinned?"var(--amber)":"var(--text-muted)" }}
            onMouseEnter={e=>{e.currentTarget.style.color="var(--amber)";e.currentTarget.style.background="var(--amber-soft)";}}
            onMouseLeave={e=>{e.currentTarget.style.color=note.isPinned?"var(--amber)":"var(--text-muted)";e.currentTarget.style.background="transparent";}}>
            {note.isPinned?<PinOff size={12}/>:<Pin size={12}/>}
          </button>}
          {onEdit && <button onClick={()=>onEdit(note)} className="btn btn-ghost btn-sm" style={{ padding:"3px 5px", color:"var(--text-muted)" }}
            onMouseEnter={e=>{e.currentTarget.style.color="var(--accent)";e.currentTarget.style.background="var(--accent-soft)";}}
            onMouseLeave={e=>{e.currentTarget.style.color="var(--text-muted)";e.currentTarget.style.background="transparent";}}><Edit3 size={12}/></button>}
          {onDelete && <button onClick={()=>onDelete(note._id)} className="btn btn-ghost btn-sm" style={{ padding:"3px 5px", color:"var(--text-muted)" }}
            onMouseEnter={e=>{e.currentTarget.style.color="var(--rose)";e.currentTarget.style.background="var(--rose-soft)";}}
            onMouseLeave={e=>{e.currentTarget.style.color="var(--text-muted)";e.currentTarget.style.background="transparent";}}><Trash2 size={12}/></button>}
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════
   VOICE PANEL (inline inside meeting)
════════════════════════════════════════════ */
function VoicePanel({ meetingId, onSaved, onClose }) {
  const { isRecording,isPaused,duration,audioBlob,error,startRecording,pauseRecording,resumeRecording,stopRecording,resetRecording } = useVoiceRecorder();
  const [lbl,      setLbl]      = useState("");
  const [uploading,setUploading]= useState(false);
  const [saved,    setSaved]    = useState(false);

  const handleSave = async () => {
    if (!audioBlob || !meetingId) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("audio",     audioBlob, `rec_${Date.now()}.webm`);
      fd.append("meetingId", meetingId);
      fd.append("duration",  duration);
      fd.append("label",     lbl || `Recording ${new Date().toLocaleTimeString()}`);
      await recordingsAPI.upload(fd);
      setSaved(true);
      setTimeout(()=>{ setSaved(false); resetRecording(); setLbl(""); onSaved?.(); }, 1400);
    } catch {} finally { setUploading(false); }
  };

  return (
    <div style={{ padding:14, borderRadius:"var(--radius-sm)", background:"var(--bg-elevated)", border:"1px solid var(--rose)", marginTop:12 }}>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
        <div style={{ display:"flex", alignItems:"center", gap:7 }}>
          <div style={{ width:24,height:24,borderRadius:"var(--radius-xs)",background:"var(--rose-soft)",display:"flex",alignItems:"center",justifyContent:"center" }}>
            <Mic size={11} color="var(--rose)"/>
          </div>
          <span style={{ fontSize:12,fontWeight:700,color:"var(--text-primary)" }}>Voice Recorder</span>
          {isRecording && <span style={{ fontSize:9,fontWeight:800,padding:"2px 6px",borderRadius:99,background:isPaused?"var(--amber)":"var(--rose)",color:"#fff" }}>{isPaused?"PAUSED":"● REC"}</span>}
        </div>
        <button onClick={onClose} className="btn btn-ghost btn-sm" style={{ padding:"2px 4px",color:"var(--text-muted)" }}><X size={12}/></button>
      </div>

      {error && <div style={{ display:"flex",alignItems:"center",gap:5,padding:"6px 10px",borderRadius:"var(--radius-xs)",background:"var(--rose-soft)",border:"1px solid var(--rose)",marginBottom:8,fontSize:11,color:"var(--rose)" }}><AlertCircle size={12}/>{error}</div>}

      {/* Waveform + timer */}
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:10 }}>
        <div style={{ flex:1, height:36,borderRadius:"var(--radius-xs)",background:"var(--bg-base)",border:"1px solid var(--border)",display:"flex",alignItems:"center",justifyContent:"center",gap:2,overflow:"hidden" }}>
          {isRecording&&!isPaused
            ? Array.from({length:16}).map((_,i)=><div key={i} style={{ width:2,borderRadius:99,background:"linear-gradient(to top,var(--rose),var(--accent))",height:"35%",animation:`wave ${0.6+(i%5)*0.13}s ease-in-out infinite`,animationDelay:`${i*0.07}s` }}/>)
            : audioBlob
              ? <span style={{ fontSize:10,color:"var(--green)",display:"flex",alignItems:"center",gap:3 }}><CheckCircle size={11}/>Ready · {fmtDur(duration)}</span>
              : <span style={{ fontSize:10,color:"var(--text-muted)" }}>{isPaused?"Paused":"Tap Start to record"}</span>
          }
        </div>
        <span style={{ fontFamily:"JetBrains Mono",fontSize:16,fontWeight:700,letterSpacing:1,color:isRecording?"var(--rose)":"var(--text-muted)",minWidth:44,textAlign:"right" }}>{fmtDur(duration)}</span>
      </div>

      {/* Controls */}
      <div style={{ display:"flex", gap:6 }}>
        {!isRecording&&!audioBlob&&<button onClick={startRecording} className="btn btn-sm" style={{ flex:1,justifyContent:"center",background:"linear-gradient(135deg,var(--rose),#ff3366)",color:"#fff",border:"none" }}><Mic size={12}/>Start</button>}
        {isRecording&&!isPaused&&<><button onClick={pauseRecording} className="btn btn-sm" style={{ flex:1,justifyContent:"center",background:"var(--amber-soft)",color:"var(--amber)",border:"1px solid var(--amber)" }}><Pause size={11}/>Pause</button><button onClick={stopRecording} className="btn btn-secondary btn-sm" style={{ flex:1,justifyContent:"center" }}><Square size={11}/>Stop</button></>}
        {isRecording&&isPaused&&<><button onClick={resumeRecording} className="btn btn-sm" style={{ flex:1,justifyContent:"center",background:"var(--green-soft)",color:"var(--green)",border:"1px solid var(--green)" }}><Play size={11}/>Resume</button><button onClick={stopRecording} className="btn btn-secondary btn-sm" style={{ flex:1,justifyContent:"center" }}><Square size={11}/>Stop</button></>}
      </div>

      {audioBlob&&!isRecording&&(
        <div style={{ borderTop:"1px solid var(--border)",paddingTop:10,marginTop:10 }}>
          <audio controls src={URL.createObjectURL(audioBlob)} style={{ width:"100%",height:28,borderRadius:6,marginBottom:8 }}/>
          <input className="input" value={lbl} onChange={e=>setLbl(e.target.value)} placeholder="Label this recording…" style={{ marginBottom:8,fontSize:12 }}/>
          <div style={{ display:"flex",gap:6 }}>
            <button onClick={()=>{resetRecording();}} className="btn btn-secondary btn-sm" style={{ flex:1,justifyContent:"center" }}><RotateCcw size={11}/>Discard</button>
            <button onClick={handleSave} disabled={uploading||saved} className="btn btn-sm" style={{ flex:2,justifyContent:"center",background:saved?"var(--green-soft)":"linear-gradient(135deg,var(--accent),var(--teal))",color:saved?"var(--green)":"#fff",border:"none" }}>
              <Upload size={11}/>{uploading?"Saving…":saved?"Saved!":"Save Recording"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════
   NEW MEETING MODAL  — 3 tabs: Details / Notes / Recording
════════════════════════════════════════════ */
function NewMeetingModal({ companyId, onClose, onSaved }) {
  const toast   = useToast();
  const lbl = { fontSize:11,fontWeight:700,color:"var(--text-muted)",display:"block",marginBottom:5,textTransform:"uppercase",letterSpacing:"0.5px" };

  /* ── step state ── */
  const [tab,     setTab]     = useState("details"); // "details" | "notes" | "recording"
  const [saving,  setSaving]  = useState(false);
  const [meetingId, setMeetingId] = useState(null); // set after meeting is created

  /* ── meeting form ── */
  const [form, setForm] = useState({ title:"", description:"", status:"ongoing", priority:"medium", participants:"" });
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  /* ── queued notes (before meeting exists) ── */
  const [notes,     setNotes]     = useState([]); // [{title,content,priority,topic,tags}]
  const [noteForm,  setNoteForm]  = useState({ title:"", content:"", priority:"medium", topic:"", tags:"" });
  const [showNF,    setShowNF]    = useState(false);
  const setN = (k,v) => setNoteForm(f=>({...f,[k]:v}));

  /* ── voice recorder (queued blob, saved after meeting created) ── */
  const { isRecording,isPaused,duration,audioBlob,error:recError,
          startRecording,pauseRecording,resumeRecording,stopRecording,resetRecording } = useVoiceRecorder();
  const [recLabel,    setRecLabel]    = useState("");
  const [savedBlobs,  setSavedBlobs]  = useState([]); // [{blob,label,duration}]

  const queueRecording = () => {
    if (!audioBlob) return;
    setSavedBlobs(b=>[...b,{ blob:audioBlob, label:recLabel||`Recording ${b.length+1}`, duration }]);
    resetRecording(); setRecLabel("");
    toast.success("Recording queued — will save when meeting is created.");
  };

  /* ── submit: create meeting then flush notes+recordings ── */
  const handleCreate = async () => {
    if (!form.title.trim()) { toast.error("Meeting title is required"); setTab("details"); return; }
    setSaving(true);
    try {
      const res = await meetingsAPI.create({
        ...form, companyId,
        participants: form.participants.split(",").map(p=>p.trim()).filter(Boolean),
      });
      const newId = res.data?.data?._id || res.data?._id;
      setMeetingId(newId);

      // flush queued notes
      await Promise.all(notes.map(n =>
        notesAPI.create({ ...n, meetingId: newId,
          tags: typeof n.tags==="string" ? n.tags.split(",").map(t=>t.trim().toLowerCase()).filter(Boolean) : n.tags })
      ));

      // flush queued recordings
      for (const r of savedBlobs) {
        const fd = new FormData();
        fd.append("audio", r.blob, `rec_${Date.now()}.webm`);
        fd.append("meetingId", newId);
        fd.append("duration",  r.duration);
        fd.append("label",     r.label);
        await recordingsAPI.upload(fd);
      }

      toast.success(`Meeting "${form.title}" created!`);
      onSaved();
    } catch { toast.error("Failed to create meeting."); }
    finally { setSaving(false); }
  };

  const PRIOS = [
    { val:"high",   color:"var(--rose)",  bg:"var(--rose-soft)"  },
    { val:"medium", color:"var(--amber)", bg:"var(--amber-soft)" },
    { val:"low",    color:"var(--green)", bg:"var(--green-soft)" },
  ];

  const TABS = [
    { id:"details",   label:"Details",   icon:Building2, accent:"var(--accent)" },
    { id:"notes",     label:"Notes",     icon:FileText,  accent:"var(--amber)"  },
    { id:"recording", label:"Recording", icon:Mic,       accent:"var(--rose)"   },
  ];

  return (
    <div
      style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:16 }}
      onClick={e=>e.target===e.currentTarget&&onClose()}
    >
      <div className="card animate-scaleIn" style={{ width:"100%",maxWidth:560,maxHeight:"90vh",display:"flex",flexDirection:"column",boxShadow:"var(--shadow-xl)",overflow:"hidden" }}>

        {/* ── Modal header ── */}
        <div style={{ padding:"15px 20px",borderBottom:"1px solid var(--border)",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0 }}>
          <div>
            <h2 style={{ fontSize:15,fontWeight:800,color:"var(--text-primary)",marginBottom:1 }}>New Meeting</h2>
            <p style={{ fontSize:11,color:"var(--text-muted)" }}>Fill details, optionally add notes &amp; recordings before saving.</p>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm" style={{ padding:5 }}><X size={14}/></button>
        </div>

        {/* ── Tab nav ── */}
        <div style={{ display:"flex",borderBottom:"1px solid var(--border)",background:"var(--bg-elevated)",flexShrink:0 }}>
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} style={{
              flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:6,
              padding:"10px 0",border:"none",cursor:"pointer",fontFamily:"inherit",
              fontSize:12,fontWeight:tab===t.id?700:400,
              color:tab===t.id?t.accent:"var(--text-muted)",
              background:tab===t.id?"var(--bg-card)":"transparent",
              borderBottom:tab===t.id?`2.5px solid ${t.accent}`:"2.5px solid transparent",
              transition:"all 0.15s",
            }}>
              <t.icon size={13}/>
              {t.label}
              {t.id==="notes"     && notes.length>0      && <span style={{ fontSize:9,fontWeight:800,padding:"1px 5px",borderRadius:99,background:"var(--amber-soft)",color:"var(--amber)" }}>{notes.length}</span>}
              {t.id==="recording" && savedBlobs.length>0 && <span style={{ fontSize:9,fontWeight:800,padding:"1px 5px",borderRadius:99,background:"var(--rose-soft)",color:"var(--rose)" }}>{savedBlobs.length}</span>}
            </button>
          ))}
        </div>

        {/* ── Scrollable body ── */}
        <div style={{ flex:1,overflowY:"auto",padding:20 }}>

          {/* ════ DETAILS TAB ════ */}
          {tab==="details" && (
            <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
              <div>
                <label style={lbl}>Title <span style={{ color:"var(--rose)" }}>*</span></label>
                <input className="input" value={form.title} onChange={e=>set("title",e.target.value)}
                  placeholder="e.g. Q3 Strategy Call" style={{ fontSize:14,fontWeight:500 }} autoFocus/>
              </div>
              <div>
                <label style={lbl}>Description</label>
                <textarea className="input" value={form.description} onChange={e=>set("description",e.target.value)}
                  placeholder="Agenda, objectives, context…" rows={3} style={{ resize:"vertical" }}/>
              </div>
              <div>
                <label style={lbl}>Participants</label>
                <div style={{ position:"relative" }}>
                  <Users size={12} color="var(--text-muted)" style={{ position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",pointerEvents:"none" }}/>
                  <input className="input" value={form.participants} onChange={e=>set("participants",e.target.value)}
                    placeholder="Alice, Bob, Carol" style={{ paddingLeft:32 }}/>
                </div>
              </div>
              <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12 }}>
                <div>
                  <label style={lbl}>Status</label>
                  <select className="input" value={form.status} onChange={e=>set("status",e.target.value)}>
                    <option value="scheduled">Scheduled</option>
                    <option value="ongoing">Ongoing</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                <div>
                  <label style={lbl}>Priority</label>
                  <select className="input" value={form.priority} onChange={e=>set("priority",e.target.value)}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
              {/* hint to continue */}
              <div style={{ display:"flex",alignItems:"center",gap:8,padding:"10px 12px",borderRadius:"var(--radius-xs)",background:"var(--accent-soft)",border:"1px solid var(--accent-glow,var(--border))" }}>
                <FileText size={12} color="var(--accent)"/>
                <span style={{ fontSize:11,color:"var(--accent-text)" }}>You can add <strong>Notes</strong> and <strong>Recordings</strong> now — they'll be saved together when you create the meeting.</span>
              </div>
            </div>
          )}

          {/* ════ NOTES TAB ════ */}
          {tab==="notes" && (
            <div>
              {/* Add note mini-form toggle */}
              {!showNF
                ? <button className="btn btn-primary btn-sm" onClick={()=>setShowNF(true)} style={{ marginBottom:14,width:"100%",justifyContent:"center" }}>
                    <Plus size={12}/> Add a Note
                  </button>
                : (
                  <div style={{ border:"1px solid var(--amber)",borderRadius:"var(--radius-sm)",marginBottom:16,overflow:"hidden" }}>
                    <div style={{ padding:"9px 14px",background:"var(--amber-soft)",borderBottom:"1px solid var(--border)",display:"flex",alignItems:"center",justifyContent:"space-between" }}>
                      <span style={{ fontSize:12,fontWeight:700,color:"var(--amber)",display:"flex",alignItems:"center",gap:6 }}><FileText size={13}/>New Note</span>
                      <button onClick={()=>setShowNF(false)} className="btn btn-ghost btn-sm" style={{ padding:"2px 4px",color:"var(--text-muted)" }}><X size={12}/></button>
                    </div>
                    <div style={{ padding:14,display:"flex",flexDirection:"column",gap:11 }}>
                      <div>
                        <label style={lbl}>Title <span style={{ color:"var(--rose)" }}>*</span></label>
                        <input className="input" value={noteForm.title} onChange={e=>setN("title",e.target.value)} placeholder="Note title…" autoFocus/>
                      </div>
                      <div>
                        <label style={lbl}>Content</label>
                        <textarea className="input" value={noteForm.content} onChange={e=>setN("content",e.target.value)}
                          placeholder="What was discussed, decided, or noted…" rows={3} style={{ resize:"vertical" }}/>
                      </div>
                      <div style={{ display:"grid",gridTemplateColumns:"1fr auto",gap:10,alignItems:"start" }}>
                        <div>
                          <label style={lbl}>Topic</label>
                          <div style={{ position:"relative" }}>
                            <Tag size={11} color="var(--text-muted)" style={{ position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",pointerEvents:"none" }}/>
                            <input className="input" value={noteForm.topic} onChange={e=>setN("topic",e.target.value)} placeholder="e.g. Strategy" style={{ paddingLeft:28,fontSize:12 }}/>
                          </div>
                        </div>
                        <div>
                          <label style={lbl}>Priority</label>
                          <div style={{ display:"flex",gap:4 }}>
                            {PRIOS.map(p=>(
                              <button key={p.val} type="button" onClick={()=>setN("priority",p.val)} style={{ padding:"6px 8px",borderRadius:"var(--radius-xs)",cursor:"pointer",fontSize:10,fontWeight:700,border:`1.5px solid ${noteForm.priority===p.val?p.color:"var(--border)"}`,background:noteForm.priority===p.val?p.bg:"var(--bg-elevated)",color:noteForm.priority===p.val?p.color:"var(--text-muted)",transition:"all 0.15s" }}>
                                {p.val.charAt(0).toUpperCase()+p.val.slice(1)}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div>
                        <label style={lbl}>Tags</label>
                        <input className="input" value={noteForm.tags} onChange={e=>setN("tags",e.target.value)} placeholder="action-item, decision (comma separated)" style={{ fontSize:12 }}/>
                      </div>
                      <div style={{ display:"flex",gap:8 }}>
                        <button onClick={()=>setShowNF(false)} className="btn btn-secondary btn-sm" style={{ flex:1,justifyContent:"center" }}>Cancel</button>
                        <button
                          onClick={()=>{
                            if (!noteForm.title.trim()) { toast.error("Note title required"); return; }
                            setNotes(n=>[...n,{...noteForm}]);
                            setNoteForm({title:"",content:"",priority:"medium",topic:"",tags:""});
                            setShowNF(false);
                            toast.success("Note queued!");
                          }}
                          className="btn btn-sm" style={{ flex:2,justifyContent:"center",background:"var(--amber)",color:"#fff",border:"none" }}
                        >
                          <CheckCircle size={12}/>Queue Note
                        </button>
                      </div>
                    </div>
                  </div>
                )
              }

              {/* Queued notes list */}
              {notes.length===0
                ? <div style={{ textAlign:"center",padding:"28px 0",color:"var(--text-muted)" }}>
                    <FileText size={28} style={{ marginBottom:8,opacity:0.4 }}/>
                    <p style={{ fontSize:12 }}>No notes queued yet. Click <strong>Add a Note</strong> above.</p>
                  </div>
                : <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
                    <p style={{ fontSize:11,color:"var(--text-muted)",marginBottom:4 }}>{notes.length} note{notes.length!==1?"s":""} queued — will be saved with the meeting</p>
                    {notes.map((n,i)=>{
                      const pc=PRIOS.find(p=>p.val===n.priority)||PRIOS[1];
                      return (
                        <div key={i} style={{ padding:"10px 12px",borderRadius:"var(--radius-xs)",border:`1px solid var(--border)`,borderLeft:`3px solid ${pc.color}`,background:"var(--bg-elevated)",display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:8 }}>
                          <div style={{ flex:1,minWidth:0 }}>
                            <div style={{ fontSize:12,fontWeight:700,color:"var(--text-primary)",marginBottom:2 }}>{n.title}</div>
                            {n.content&&<div style={{ fontSize:11,color:"var(--text-secondary)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{n.content}</div>}
                            <div style={{ display:"flex",gap:6,marginTop:4,flexWrap:"wrap" }}>
                              {n.topic&&<span style={{ fontSize:10,color:"var(--accent-text)" }}>{n.topic}</span>}
                              <span style={{ fontSize:10,fontWeight:700,color:pc.color }}>{n.priority}</span>
                            </div>
                          </div>
                          <button onClick={()=>setNotes(ns=>ns.filter((_,j)=>j!==i))} className="btn btn-ghost btn-sm" style={{ padding:"2px 4px",color:"var(--text-muted)",flexShrink:0 }}
                            onMouseEnter={e=>{e.currentTarget.style.color="var(--rose)";}}
                            onMouseLeave={e=>{e.currentTarget.style.color="var(--text-muted)";}}
                          ><Trash2 size={11}/></button>
                        </div>
                      );
                    })}
                  </div>
              }
            </div>
          )}

          {/* ════ RECORDING TAB ════ */}
          {tab==="recording" && (
            <div>
              {/* Recorder */}
              <div style={{ padding:14,borderRadius:"var(--radius-sm)",background:"var(--bg-elevated)",border:"1px solid var(--rose)",marginBottom:16 }}>
                <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:12 }}>
                  <div style={{ width:28,height:28,borderRadius:"var(--radius-xs)",background:"var(--rose-soft)",display:"flex",alignItems:"center",justifyContent:"center" }}>
                    <Mic size={13} color="var(--rose)"/>
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:12,fontWeight:700,color:"var(--text-primary)" }}>Voice Recorder</div>
                    <div style={{ fontSize:10,color:"var(--text-muted)" }}>Recordings will be attached when meeting is created</div>
                  </div>
                  {isRecording&&<span style={{ fontSize:9,fontWeight:800,padding:"2px 6px",borderRadius:99,background:isPaused?"var(--amber)":"var(--rose)",color:"#fff" }}>{isPaused?"PAUSED":"● REC"}</span>}
                </div>

                {recError&&<div style={{ display:"flex",alignItems:"center",gap:5,padding:"6px 10px",borderRadius:"var(--radius-xs)",background:"var(--rose-soft)",border:"1px solid var(--rose)",marginBottom:8,fontSize:11,color:"var(--rose)" }}><AlertCircle size={12}/>{recError}</div>}

                {/* Waveform + timer */}
                <div style={{ display:"flex",alignItems:"center",gap:12,marginBottom:10 }}>
                  <div style={{ flex:1,height:40,borderRadius:"var(--radius-xs)",background:"var(--bg-base)",border:"1px solid var(--border)",display:"flex",alignItems:"center",justifyContent:"center",gap:2,overflow:"hidden" }}>
                    {isRecording&&!isPaused
                      ?Array.from({length:18}).map((_,i)=><div key={i} style={{ width:2,borderRadius:99,background:"linear-gradient(to top,var(--rose),var(--accent))",height:"35%",animation:`wave ${0.6+(i%5)*0.13}s ease-in-out infinite`,animationDelay:`${i*0.07}s` }}/>)
                      :audioBlob
                        ?<span style={{ fontSize:10,color:"var(--green)",display:"flex",alignItems:"center",gap:3 }}><CheckCircle size={11}/>Ready · {fmtDur(duration)}</span>
                        :<span style={{ fontSize:10,color:"var(--text-muted)" }}>{isPaused?"Paused — tap Resume":"Tap Start to record"}</span>}
                  </div>
                  <span style={{ fontFamily:"JetBrains Mono",fontSize:18,fontWeight:700,letterSpacing:1,color:isRecording?"var(--rose)":"var(--text-muted)",minWidth:48,textAlign:"right" }}>{fmtDur(duration)}</span>
                </div>

                {/* Controls */}
                <div style={{ display:"flex",gap:6 }}>
                  {!isRecording&&!audioBlob&&<button onClick={startRecording} className="btn btn-sm" style={{ flex:1,justifyContent:"center",background:"linear-gradient(135deg,var(--rose),#ff3366)",color:"#fff",border:"none" }}><Mic size={12}/>Start Recording</button>}
                  {isRecording&&!isPaused&&<><button onClick={pauseRecording} className="btn btn-sm" style={{ flex:1,justifyContent:"center",background:"var(--amber-soft)",color:"var(--amber)",border:"1px solid var(--amber)" }}><Pause size={11}/>Pause</button><button onClick={stopRecording} className="btn btn-secondary btn-sm" style={{ flex:1,justifyContent:"center" }}><Square size={11}/>Stop</button></>}
                  {isRecording&&isPaused&&<><button onClick={resumeRecording} className="btn btn-sm" style={{ flex:1,justifyContent:"center",background:"var(--green-soft)",color:"var(--green)",border:"1px solid var(--green)" }}><Play size={11}/>Resume</button><button onClick={stopRecording} className="btn btn-secondary btn-sm" style={{ flex:1,justifyContent:"center" }}><Square size={11}/>Stop</button></>}
                </div>

                {audioBlob&&!isRecording&&(
                  <div style={{ borderTop:"1px solid var(--border)",paddingTop:10,marginTop:10 }}>
                    <audio controls src={URL.createObjectURL(audioBlob)} style={{ width:"100%",height:30,borderRadius:6,marginBottom:8 }}/>
                    <input className="input" value={recLabel} onChange={e=>setRecLabel(e.target.value)} placeholder="Label this recording…" style={{ marginBottom:8,fontSize:12 }}/>
                    <div style={{ display:"flex",gap:6 }}>
                      <button onClick={resetRecording} className="btn btn-secondary btn-sm" style={{ flex:1,justifyContent:"center" }}><RotateCcw size={11}/>Discard</button>
                      <button onClick={queueRecording} className="btn btn-sm" style={{ flex:2,justifyContent:"center",background:"linear-gradient(135deg,var(--rose),#ff3366)",color:"#fff",border:"none" }}>
                        <Upload size={11}/>Queue Recording
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Queued recordings list */}
              {savedBlobs.length===0
                ? <div style={{ textAlign:"center",padding:"20px 0",color:"var(--text-muted)" }}>
                    <Mic size={26} style={{ marginBottom:8,opacity:0.4 }}/>
                    <p style={{ fontSize:12 }}>No recordings queued yet. Record above and click <strong>Queue Recording</strong>.</p>
                  </div>
                : <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
                    <p style={{ fontSize:11,color:"var(--text-muted)",marginBottom:4 }}>{savedBlobs.length} recording{savedBlobs.length!==1?"s":""} queued</p>
                    {savedBlobs.map((r,i)=>(
                      <div key={i} style={{ display:"flex",alignItems:"center",gap:10,padding:"9px 12px",borderRadius:"var(--radius-xs)",background:"var(--bg-elevated)",border:"1px solid var(--border)" }}>
                        <div style={{ width:28,height:28,borderRadius:"50%",background:"var(--rose-soft)",border:"1px solid var(--rose)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                          <Mic size={12} color="var(--rose)"/>
                        </div>
                        <div style={{ flex:1,minWidth:0 }}>
                          <div style={{ fontSize:12,fontWeight:600,color:"var(--text-primary)" }}>{r.label}</div>
                          <div style={{ fontSize:10,color:"var(--text-muted)",fontFamily:"JetBrains Mono" }}>{fmtDur(r.duration)}</div>
                        </div>
                        <button onClick={()=>setSavedBlobs(b=>b.filter((_,j)=>j!==i))} className="btn btn-ghost btn-sm" style={{ padding:"2px 4px",color:"var(--text-muted)" }}
                          onMouseEnter={e=>e.currentTarget.style.color="var(--rose)"}
                          onMouseLeave={e=>e.currentTarget.style.color="var(--text-muted)"}
                        ><Trash2 size={11}/></button>
                      </div>
                    ))}
                  </div>
              }
            </div>
          )}
        </div>

        {/* ── Footer: summary + Create ── */}
        <div style={{ padding:"14px 20px",borderTop:"1px solid var(--border)",background:"var(--bg-elevated)",flexShrink:0 }}>
          {/* mini summary */}
          <div style={{ display:"flex",alignItems:"center",gap:14,marginBottom:12 }}>
            {form.title&&<span style={{ fontSize:11,color:"var(--text-primary)",fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flex:1 }}>📅 {form.title}</span>}
            {notes.length>0&&<span style={{ fontSize:11,color:"var(--amber)",fontWeight:600,flexShrink:0 }}>{notes.length} note{notes.length!==1?"s":""}</span>}
            {savedBlobs.length>0&&<span style={{ fontSize:11,color:"var(--rose)",fontWeight:600,flexShrink:0 }}>{savedBlobs.length} rec{savedBlobs.length!==1?"s":""}</span>}
          </div>
          <div style={{ display:"flex",gap:8 }}>
            <button onClick={onClose} className="btn btn-secondary btn-lg" style={{ flex:1 }}>Cancel</button>
            <button
              onClick={handleCreate}
              disabled={saving||!form.title.trim()}
              className="btn btn-primary btn-lg"
              style={{ flex:2,justifyContent:"center" }}
            >
              {saving
                ?<><div style={{ width:14,height:14,border:"2px solid rgba(255,255,255,0.4)",borderTopColor:"#fff",borderRadius:"50%",animation:"spin 0.7s linear infinite" }}/>Creating…</>
                :<><Calendar size={14}/>Create Meeting{notes.length+savedBlobs.length>0?` + ${notes.length+savedBlobs.length} item${notes.length+savedBlobs.length!==1?"s":""}`:""}</>
              }
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

/* ════════════════════════════════════════════
   EXPANDED MEETING ROW  (notes + recordings inline)
════════════════════════════════════════════ */
function MeetingRow({ meeting, notes, recordings, onNoteDelete, onNoteEdit, onNotePin, onRecDelete, onReload, companyId }) {
  const [open,       setOpen]       = useState(false);
  const [innerTab,   setInnerTab]   = useState("notes");   // "notes" | "recordings"
  const [showNote,   setShowNote]   = useState(false);
  const [editNote,   setEditNote]   = useState(null);
  const [showRec,    setShowRec]    = useState(false);

  const ms      = mStatusConf[meeting.status] || mStatusConf.scheduled;
  const pc      = prioConf[meeting.priority]  || prioConf.medium;
  const nCount  = notes.length;
  const rCount  = recordings.length;

  const sortedNotes = [...notes].sort((a,b)=>(b.isPinned?1:0)-(a.isPinned?1:0)||new Date(b.createdAt)-new Date(a.createdAt));

  return (
    <>
      {/* Row header */}
      <div
        onClick={()=>setOpen(o=>!o)}
        style={{ display:"flex", alignItems:"center", gap:12, padding:"13px 18px", cursor:"pointer", transition:"background 0.15s", borderBottom:"1px solid var(--border)", background: open?"var(--accent-soft)":"transparent", borderLeft: open?"3px solid var(--accent)":"3px solid transparent" }}
        onMouseEnter={e=>{ if(!open) e.currentTarget.style.background="var(--bg-elevated)"; }}
        onMouseLeave={e=>{ if(!open) e.currentTarget.style.background="transparent"; }}
      >
        {/* Chevron */}
        <div style={{ flexShrink:0, color: open?"var(--accent)":"var(--text-muted)", transition:"transform 0.2s", transform: open?"rotate(90deg)":"rotate(0deg)" }}>
          <ChevronRight size={14}/>
        </div>

        {/* Title + meta */}
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:13, fontWeight: open?700:500, color: open?"var(--accent-text)":"var(--text-primary)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", marginBottom:3 }}>
            {meeting.title}
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
            <span style={{ fontSize:10,color:"var(--text-muted)",fontFamily:"JetBrains Mono" }}>{format(new Date(meeting.createdAt),"MMM d, yyyy · HH:mm")}</span>
            {nCount > 0 && <span style={{ fontSize:10,color:"var(--text-muted)",display:"flex",alignItems:"center",gap:3 }}><FileText size={9}/>{nCount} note{nCount!==1?"s":""}</span>}
            {rCount > 0 && <span style={{ fontSize:10,color:"var(--text-muted)",display:"flex",alignItems:"center",gap:3 }}><Mic size={9}/>{rCount} rec{rCount!==1?"s":""}</span>}
          </div>
        </div>

        {/* Badges */}
        <div style={{ display:"flex", alignItems:"center", gap:6, flexShrink:0 }} onClick={e=>e.stopPropagation()}>
          <span className="badge" style={{ background:pc.bg,color:pc.color,fontSize:9 }}>{meeting.priority}</span>
          <span className="badge" style={{ background:ms.bg,color:ms.color,fontSize:9 }}>{meeting.status}</span>
        </div>
      </div>

      {/* Expanded body */}
      {open && (
        <div style={{ padding:"0 18px 16px 18px", background:"var(--bg-elevated)", borderBottom:"1px solid var(--border)", borderLeft:"3px solid var(--accent)" }}>

          {/* Action bar */}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", paddingTop:14, marginBottom:12 }}>
            {/* Inner tabs: Notes / Recordings */}
            <div style={{ display:"flex", gap:0, border:"1px solid var(--border)", borderRadius:"var(--radius-sm)", overflow:"hidden", background:"var(--bg-base)" }}>
              {[
                { id:"notes",      label:`Notes (${nCount})`,      icon:FileText },
                { id:"recordings", label:`Recordings (${rCount})`, icon:Mic      },
              ].map(t => (
                <button key={t.id} onClick={()=>setInnerTab(t.id)} style={{ display:"flex",alignItems:"center",gap:5,padding:"6px 12px",border:"none",cursor:"pointer",fontFamily:"inherit",fontSize:11,fontWeight:innerTab===t.id?700:400,color:innerTab===t.id?"var(--accent-text)":"var(--text-muted)",background:innerTab===t.id?"var(--accent-soft)":"transparent",transition:"all 0.15s",borderRight:"1px solid var(--border)" }}>
                  <t.icon size={11}/>{t.label}
                </button>
              ))}
            </div>

            {/* Quick-action buttons */}
            <div style={{ display:"flex", gap:6 }}>
              <button
                className="btn btn-sm"
                style={{ background:"var(--accent)",color:"#fff",border:"none",gap:5 }}
                onClick={()=>{ setEditNote(null); setShowNote(true); setInnerTab("notes"); }}
              >
                <Plus size={11}/><FileText size={11}/> Add Note
              </button>
              <button
                className="btn btn-sm"
                style={{ background:showRec?"var(--rose)":"var(--rose-soft)",color:showRec?"#fff":"var(--rose)",border:showRec?"none":"1px solid var(--rose)",gap:5 }}
                onClick={()=>{ setShowRec(r=>!r); setInnerTab("recordings"); }}
              >
                <Mic size={11}/>{showRec?"Hide Recorder":"Record"}
              </button>
            </div>
          </div>

          {/* Inline voice recorder */}
          {showRec && (
            <VoicePanel
              meetingId={meeting._id}
              onClose={()=>setShowRec(false)}
              onSaved={()=>{ setShowRec(false); setInnerTab("recordings"); onReload(); }}
            />
          )}

          {/* Notes list */}
          {innerTab==="notes" && (
            sortedNotes.length === 0
              ? <div style={{ textAlign:"center", padding:"24px 0" }}>
                  <FileText size={24} color="var(--text-muted)" style={{ marginBottom:8 }}/>
                  <p style={{ fontSize:12,color:"var(--text-muted)",marginBottom:12 }}>No notes yet. Capture what was discussed.</p>
                  <button className="btn btn-primary btn-sm" onClick={()=>setShowNote(true)}><Plus size={12}/>Add First Note</button>
                </div>
              : <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {sortedNotes.map(n=>(
                    <NoteCard
                      key={n._id} note={n}
                      onDelete={onNoteDelete}
                      onEdit={n=>{ setEditNote(n); setShowNote(true); }}
                      onPin={onNotePin}
                    />
                  ))}
                </div>
          )}

          {/* Recordings list */}
          {innerTab==="recordings" && (
            recordings.length === 0
              ? <div style={{ textAlign:"center", padding:"24px 0" }}>
                  <Mic size={24} color="var(--text-muted)" style={{ marginBottom:8 }}/>
                  <p style={{ fontSize:12,color:"var(--text-muted)",marginBottom:12 }}>No recordings yet.</p>
                  <button className="btn btn-sm" style={{ background:"var(--rose-soft)",color:"var(--rose)",border:"1px solid var(--rose)" }} onClick={()=>setShowRec(true)}><Mic size={12}/>Start Recording</button>
                </div>
              : <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {recordings.map(r=><AudioPlayer key={r._id} recording={r} onDelete={onRecDelete}/>)}
                </div>
          )}
        </div>
      )}

      {/* Inline note form scoped to this meeting */}
      {showNote && (
        <div style={{ padding:"0 18px 4px 18px", background:"var(--bg-elevated)", borderLeft:"3px solid var(--accent)" }}>
          <InlineNoteForm
            meetingId={meeting._id}
            editNote={editNote}
            onSaved={()=>{ setShowNote(false); setEditNote(null); setInnerTab("notes"); onReload(); }}
            onCancel={()=>{ setShowNote(false); setEditNote(null); }}
          />
        </div>
      )}
    </>
  );
}

/* ════════════════════════════════════════════
   INLINE NOTE FORM  (no external modal)
════════════════════════════════════════════ */
function InlineNoteForm({ meetingId, editNote, onSaved, onCancel }) {
  const toast   = useToast();
  const [saving, setSaving] = useState(false);
  const [form,   setForm]   = useState({
    title:    editNote?.title    || "",
    content:  editNote?.content  || "",
    priority: editNote?.priority || "medium",
    topic:    editNote?.topic    || "",
    tags:     editNote?.tags?.join(", ") || "",
  });
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error("Title is required"); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        meetingId,
        tags: form.tags.split(",").map(t=>t.trim().toLowerCase()).filter(Boolean),
      };
      if (editNote?._id) { await notesAPI.update(editNote._id, payload); toast.success("Note updated!"); }
      else               { await notesAPI.create(payload);               toast.success("Note saved!"); }
      onSaved();
    } catch { toast.error("Failed to save note."); }
    finally { setSaving(false); }
  };

  const lbl = { fontSize:11,fontWeight:700,color:"var(--text-muted)",display:"block",marginBottom:5,textTransform:"uppercase",letterSpacing:"0.5px" };
  const PRIOS = [
    { val:"high",   color:"var(--rose)",  bg:"var(--rose-soft)"  },
    { val:"medium", color:"var(--amber)", bg:"var(--amber-soft)" },
    { val:"low",    color:"var(--green)", bg:"var(--green-soft)" },
  ];

  return (
    <div style={{ border:"1px solid var(--accent)", borderRadius:"var(--radius-sm)", background:"var(--bg-card)", marginBottom:18, overflow:"hidden" }}>
      {/* Form header */}
      <div style={{ padding:"11px 16px", borderBottom:"1px solid var(--border)", background:"var(--accent-soft)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <FileText size={14} color="var(--accent)"/>
          <span style={{ fontSize:13, fontWeight:700, color:"var(--accent-text)" }}>
            {editNote ? "Edit Note" : "New Note"}
          </span>
        </div>
        <button onClick={onCancel} className="btn btn-ghost btn-sm" style={{ padding:"2px 5px", color:"var(--text-muted)" }}>
          <X size={13}/>
        </button>
      </div>

      <div style={{ padding:16, display:"flex", flexDirection:"column", gap:13 }}>
        {/* Title */}
        <div>
          <label style={lbl}>Title <span style={{ color:"var(--rose)" }}>*</span></label>
          <input
            className="input"
            value={form.title}
            onChange={e=>set("title",e.target.value)}
            placeholder="Note title…"
            style={{ fontSize:14, fontWeight:500 }}
            autoFocus
          />
        </div>

        {/* Content */}
        <div>
          <label style={lbl}>Content</label>
          <textarea
            className="input"
            value={form.content}
            onChange={e=>set("content",e.target.value)}
            placeholder="What was discussed, decided, or noted…"
            rows={4}
            style={{ resize:"vertical", fontSize:13, lineHeight:1.6 }}
          />
        </div>

        {/* Topic + Priority row */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr auto", gap:12, alignItems:"start" }}>
          <div>
            <label style={lbl}>Topic / Category</label>
            <div style={{ position:"relative" }}>
              <Tag size={12} color="var(--text-muted)" style={{ position:"absolute",left:11,top:"50%",transform:"translateY(-50%)",pointerEvents:"none" }}/>
              <input
                className="input"
                value={form.topic}
                onChange={e=>set("topic",e.target.value)}
                placeholder="e.g. Strategy, Follow-up…"
                style={{ paddingLeft:30, fontSize:13 }}
              />
            </div>
          </div>
          <div>
            <label style={lbl}>Priority</label>
            <div style={{ display:"flex", gap:5 }}>
              {PRIOS.map(p=>(
                <button key={p.val} type="button" onClick={()=>set("priority",p.val)}
                  style={{ padding:"6px 10px", borderRadius:"var(--radius-xs)", cursor:"pointer", fontSize:11, fontWeight:700, border:`1.5px solid ${form.priority===p.val?p.color:"var(--border)"}`, background:form.priority===p.val?p.bg:"var(--bg-elevated)", color:form.priority===p.val?p.color:"var(--text-muted)", transition:"all 0.15s" }}>
                  {p.val.charAt(0).toUpperCase()+p.val.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tags */}
        <div>
          <label style={lbl}>Tags</label>
          <input
            className="input"
            value={form.tags}
            onChange={e=>set("tags",e.target.value)}
            placeholder="action-item, decision, follow-up (comma separated)"
            style={{ fontSize:12 }}
          />
        </div>

        {/* Actions */}
        <div style={{ display:"flex", gap:8, paddingTop:2 }}>
          <button onClick={onCancel} className="btn btn-secondary btn-sm" style={{ flex:1, justifyContent:"center" }}>
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving || !form.title.trim()} className="btn btn-primary btn-sm" style={{ flex:2, justifyContent:"center" }}>
            {saving
              ? <><div style={{ width:12,height:12,border:"2px solid rgba(255,255,255,0.4)",borderTopColor:"#fff",borderRadius:"50%",animation:"spin 0.7s linear infinite" }}/>Saving…</>
              : <><CheckCircle size={13}/>{editNote?"Update Note":"Save Note"}</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════
   NOTES TAB PANEL
   — pick a meeting, write inline, see all notes
════════════════════════════════════════════ */
function NotesTabPanel({ meetings, allNotes, onDelete, onPin, onReload }) {
  const [selectedMtg, setSelectedMtg] = useState(meetings[0]?._id || "");
  const [showForm,    setShowForm]    = useState(false);
  const [editNote,    setEditNote]    = useState(null);

  const visibleNotes = allNotes
    .filter(n => n.meetingId === selectedMtg)
    .sort((a,b)=>(b.isPinned?1:0)-(a.isPinned?1:0)||new Date(b.createdAt)-new Date(a.createdAt));

  const lbl = { fontSize:11,fontWeight:700,color:"var(--text-muted)",display:"block",marginBottom:5,textTransform:"uppercase",letterSpacing:"0.5px" };

  const openNew  = ()=>{ setEditNote(null);  setShowForm(true);  };
  const openEdit = n  =>{ setEditNote(n);    setShowForm(true);  };
  const closeForm= ()=>{ setShowForm(false); setEditNote(null);  };

  return (
    <div style={{ padding:18 }}>

      {/* ── Meeting picker + Add Note button ── */}
      <div style={{ display:"flex", alignItems:"flex-end", gap:10, marginBottom:16,
                    padding:"12px 14px", borderRadius:"var(--radius-sm)",
                    background:"var(--bg-elevated)", border:"1px solid var(--border)" }}>
        <div style={{ flex:1, minWidth:0 }}>
          <label style={lbl}>Select Meeting</label>
          {meetings.length === 0
            ? <p style={{ fontSize:12, color:"var(--text-muted)", margin:0 }}>No meetings yet — create one first.</p>
            : <div style={{ position:"relative" }}>
                <Calendar size={12} color="var(--text-muted)" style={{ position:"absolute",left:11,top:"50%",transform:"translateY(-50%)",pointerEvents:"none" }}/>
                <select className="input" value={selectedMtg}
                  onChange={e=>{ setSelectedMtg(e.target.value); setShowForm(false); setEditNote(null); }}
                  style={{ paddingLeft:30, fontSize:13 }}>
                  {meetings.map(m=><option key={m._id} value={m._id}>{m.title}</option>)}
                </select>
              </div>
          }
        </div>
        <button
          className="btn btn-primary btn-sm"
          disabled={!selectedMtg || showForm}
          onClick={openNew}
          style={{ flexShrink:0, whiteSpace:"nowrap" }}
        >
          <Plus size={12}/> Add Note
        </button>
      </div>

      {/* ── Inline note form ── */}
      {showForm && selectedMtg && (
        <InlineNoteForm
          meetingId={selectedMtg}
          editNote={editNote}
          onSaved={()=>{ closeForm(); onReload(); }}
          onCancel={closeForm}
        />
      )}

      {/* ── Notes list ── */}
      {!selectedMtg
        ? <div style={{ textAlign:"center", padding:"36px 0" }}>
            <FileText size={32} color="var(--text-muted)" style={{ marginBottom:10 }}/>
            <p style={{ fontSize:13, color:"var(--text-muted)" }}>Select a meeting above to view its notes.</p>
          </div>
        : visibleNotes.length === 0 && !showForm
          ? <div style={{ textAlign:"center", padding:"36px 0" }}>
              <FileText size={32} color="var(--text-muted)" style={{ marginBottom:10 }}/>
              <p style={{ fontSize:13, color:"var(--text-muted)", marginBottom:14 }}>No notes for this meeting yet.</p>
              <button className="btn btn-primary btn-sm" onClick={openNew}><Plus size={12}/>Write First Note</button>
            </div>
          : visibleNotes.length > 0 && (
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                <div style={{ fontSize:11, color:"var(--text-muted)", marginBottom:2 }}>
                  {visibleNotes.length} note{visibleNotes.length!==1?"s":""} — pinned first, then newest
                </div>
                {visibleNotes.map(n=>(
                  <NoteCard key={n._id} note={n}
                    onDelete={onDelete}
                    onPin={onPin}
                    onEdit={openEdit}
                  />
                ))}
              </div>
            )
      }
    </div>
  );
}

/* ════════════════════════════════════════════
   RECORDINGS TAB PANEL
   — pick a meeting, record voice, see all recordings
════════════════════════════════════════════ */
function RecordingsTabPanel({ meetings, allRecordings, onDelete, onReload }) {
  const [selectedMtg, setSelectedMtg] = useState(meetings[0]?._id || "");
  const [showRec,     setShowRec]     = useState(false);

  const visibleRecs = allRecordings.filter(r => r.meetingId === selectedMtg)
    .sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));

  const lbl = { fontSize:11,fontWeight:700,color:"var(--text-muted)",display:"block",marginBottom:5,textTransform:"uppercase",letterSpacing:"0.5px" };

  return (
    <div style={{ padding:18 }}>

      {/* ── Top toolbar: meeting picker + Record button ── */}
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:18,
                    padding:"12px 14px", borderRadius:"var(--radius-sm)",
                    background:"var(--bg-elevated)", border:"1px solid var(--border)" }}>
        <div style={{ flex:1, minWidth:0 }}>
          <label style={lbl}>Select Meeting</label>
          {meetings.length === 0
            ? <p style={{ fontSize:12, color:"var(--text-muted)" }}>No meetings yet — create one in the Meetings tab.</p>
            : <div style={{ position:"relative" }}>
                <Calendar size={13} color="var(--text-muted)" style={{ position:"absolute",left:11,top:"50%",transform:"translateY(-50%)",pointerEvents:"none" }}/>
                <select
                  className="input"
                  value={selectedMtg}
                  onChange={e=>{ setSelectedMtg(e.target.value); setShowRec(false); }}
                  style={{ paddingLeft:32, fontSize:13 }}
                >
                  {meetings.map(m=>(
                    <option key={m._id} value={m._id}>{m.title}</option>
                  ))}
                </select>
              </div>
          }
        </div>
        <button
          className="btn btn-sm"
          disabled={!selectedMtg}
          onClick={()=>setShowRec(r=>!r)}
          style={{
            flexShrink:0, alignSelf:"flex-end", marginBottom:1, gap:5,
            background: showRec ? "var(--rose)"     : "var(--rose-soft)",
            color:       showRec ? "#fff"            : "var(--rose)",
            border:      showRec ? "none"            : "1px solid var(--rose)",
          }}
        >
          <Mic size={12}/>{showRec ? "Hide Recorder" : "Start Recording"}
        </button>
      </div>

      {/* ── Inline voice recorder ── */}
      {showRec && selectedMtg && (
        <VoicePanel
          meetingId={selectedMtg}
          onClose={()=>setShowRec(false)}
          onSaved={()=>{ setShowRec(false); onReload(); }}
        />
      )}

      {/* ── Recordings list ── */}
      {!selectedMtg
        ? <div style={{ textAlign:"center", padding:"36px 0" }}>
            <Mic size={32} color="var(--text-muted)" style={{ marginBottom:10 }}/>
            <p style={{ fontSize:13, color:"var(--text-muted)" }}>Select a meeting above to see its recordings.</p>
          </div>
        : visibleRecs.length === 0
          ? <div style={{ textAlign:"center", padding:"36px 0" }}>
              <Mic size={32} color="var(--text-muted)" style={{ marginBottom:10 }}/>
              <p style={{ fontSize:13, color:"var(--text-muted)", marginBottom:14 }}>No recordings yet for this meeting.</p>
              <button
                className="btn btn-sm"
                style={{ background:"var(--rose-soft)",color:"var(--rose)",border:"1px solid var(--rose)" }}
                onClick={()=>setShowRec(true)}
              >
                <Mic size={12}/>Record Now
              </button>
            </div>
          : <div style={{ display:"flex", flexDirection:"column", gap:10, marginTop: showRec ? 14 : 0 }}>
              <div style={{ fontSize:11, color:"var(--text-muted)", marginBottom:2 }}>
                {visibleRecs.length} recording{visibleRecs.length!==1?"s":""} — most recent first
              </div>
              {visibleRecs.map(r=>(
                <AudioPlayer key={r._id} recording={r} onDelete={onDelete}/>
              ))}
            </div>
      }
    </div>
  );
}

/* ════════════════════════════════════════════
   MAIN PAGE
════════════════════════════════════════════ */
export default function MeetingWorkspace() {
  const { companyId } = useParams();
  const toast = useToast();
  const { enterCompany, leaveCompany, liveTotal } = useCompanyTime();

  const [company,    setCompany]    = useState(null);
  const [meetings,   setMeetings]   = useState([]);
  const [notes,      setNotes]      = useState([]);
  const [recordings, setRecordings] = useState([]);
  const [loading,    setLoading]    = useState(true);

  /* Top-level nav: "meetings" | "notes" | "recordings" */
  const [topTab, setTopTab] = useState("meetings");

  const [showNewMtg, setShowNewMtg] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await companiesAPI.getById(companyId);
      if (r.data && r.data.data) {
        const { company:c, meetings:m, notes:n, recordings:rec } = r.data.data;
        setCompany(c);
        setMeetings(m  || []);
        setNotes(n     || []);
        setRecordings(rec || []);
      }
    } catch (error) {
      console.error("Error loading workspace:", error);
      setCompany(null);
    } finally { setLoading(false); }
  }, [companyId]);

  useEffect(()=>{ load(); }, [load]);
  useEffect(()=>{
    if (company) { enterCompany(company._id, company.name); }
    return () => { leaveCompany(); };
  }, [company?._id]);

  const delNote = async id => { if(!window.confirm("Delete this note?")) return; await notesAPI.delete(id); toast.success("Deleted"); load(); };
  const delRec  = async id => { if(!window.confirm("Delete this recording?")) return; await recordingsAPI.delete(id); toast.success("Deleted"); load(); };
  const pinNote = async id => { await notesAPI.togglePin(id); load(); };

  /* Sort all notes/recordings for global tabs */
  const allNotes      = [...notes].sort((a,b)=>(b.isPinned?1:0)-(a.isPinned?1:0)||new Date(b.createdAt)-new Date(a.createdAt));
  const allRecordings = [...recordings].sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));

  /* Loading */
  if (loading) return (
    <div style={{ background:"var(--bg-base)",minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center" }}>
      <div style={{ width:32,height:32,border:"3px solid var(--border)",borderTopColor:"var(--accent)",borderRadius:"50%",animation:"spin 0.8s linear infinite" }}/>
    </div>
  );
  if (!company) return (
    <div style={{ background:"var(--bg-base)",minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16 }}>
      <Building2 size={48} color="var(--text-muted)"/>
      <Link to="/meetings" className="btn btn-primary">← Back to Meetings</Link>
    </div>
  );

  const sc  = statusConf[company.status] || statusConf.active;
  const ini = company.name.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();
  const pal = ["#4f46e5","#0891b2","#059669","#d97706","#7c3aed","#e11d48"];
  const col = pal[company.name.charCodeAt(0) % pal.length];

  /* ── Nav tabs config ── */
  const NAV_TABS = [
    { id:"meetings",   label:"Meetings",   icon:Calendar, count:meetings.length,   accent:"var(--accent)" },
    { id:"notes",      label:"Notes",      icon:FileText, count:notes.length,      accent:"var(--amber)"  },
    { id:"recordings", label:"Recordings", icon:Mic,      count:recordings.length, accent:"var(--rose)"   },
  ];

  return (
    <div style={{ background:"var(--bg-base)", minHeight:"100vh" }}>
      <TopBar
        title={company.name}
        subtitle={`${company.industry||"Company"} · ${meetings.length} meetings · ${notes.length} notes · Total time: ${fmtTotal(liveTotal||(company.totalTimeSpent||0))}`}
      />

      <div style={{ maxWidth:960, margin:"0 auto", padding:"20px 24px 60px" }}>
        <Link to="/meetings" className="btn btn-ghost btn-sm" style={{ marginBottom:20, display:"inline-flex" }}>
          <ArrowLeft size={13}/> All Companies
        </Link>

        {/* ── Company summary strip ── */}
        <div className="card animate-fadeUp" style={{ padding:"16px 20px", marginBottom:20, position:"relative", overflow:"hidden" }}>
          <div style={{ position:"absolute",top:0,left:0,right:0,height:3,background:`linear-gradient(90deg,${col},var(--teal))` }}/>
          <div style={{ display:"flex", alignItems:"center", gap:14, marginTop:2 }}>
            <div style={{ width:44,height:44,borderRadius:"var(--radius-sm)",flexShrink:0,background:`${col}15`,border:`2px solid ${col}25`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,fontWeight:800,color:col }}>{ini}</div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
                <h2 style={{ fontSize:16,fontWeight:800,color:"var(--text-primary)" }}>{company.name}</h2>
                <span className="badge" style={{ background:sc.bg,color:sc.color,fontSize:10 }}>{company.status}</span>
                {company.industry && <span style={{ fontSize:11,color:"var(--text-muted)" }}>{company.industry}</span>}
              </div>
              <div style={{ display:"flex", gap:18, marginTop:5 }}>
                {[["Meetings",meetings.length,"var(--accent)"],["Notes",notes.length,"var(--amber)"],["Recordings",recordings.length,"var(--rose)"]].map(([l,v,c])=>(
                  <span key={l} style={{ fontSize:11,color:"var(--text-muted)" }}>
                    <span style={{ fontWeight:700,color:c,fontSize:13 }}>{v}</span> {l}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════
            TOP NAV ROW: Meetings | Notes | Recordings
        ══════════════════════════════════════ */}
        <div className="card animate-fadeUp delay-1" style={{ overflow:"hidden", marginBottom:0 }}>

          {/* Tab bar */}
          <div style={{ display:"flex", borderBottom:"1px solid var(--border)", background:"var(--bg-elevated)" }}>
            {NAV_TABS.map(t => (
              <button
                key={t.id}
                onClick={()=>setTopTab(t.id)}
                style={{
                  flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:7,
                  padding:"13px 0", border:"none", cursor:"pointer", fontFamily:"inherit",
                  fontSize:13, fontWeight: topTab===t.id ? 700 : 500,
                  color: topTab===t.id ? t.accent : "var(--text-muted)",
                  background: topTab===t.id ? "var(--bg-card)" : "transparent",
                  borderBottom: topTab===t.id ? `2.5px solid ${t.accent}` : "2.5px solid transparent",
                  transition:"all 0.18s",
                }}
              >
                <t.icon size={14}/>
                {t.label}
                <span style={{ fontSize:10,fontWeight:700,padding:"1px 7px",borderRadius:99,background: topTab===t.id?`${t.accent}18`:"var(--border)",color: topTab===t.id?t.accent:"var(--text-muted)" }}>{t.count}</span>
              </button>
            ))}
          </div>

          {/* ── MEETINGS tab ── */}
          {topTab === "meetings" && (
            <div>
              {/* Toolbar */}
              <div style={{ padding:"12px 18px", borderBottom:"1px solid var(--border)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                <span style={{ fontSize:12, color:"var(--text-muted)" }}>
                  {meetings.length === 0 ? "No meetings yet" : `${meetings.length} meeting${meetings.length!==1?"s":""}  — click any row to expand`}
                </span>
                <button className="btn btn-primary btn-sm" onClick={()=>setShowNewMtg(true)}>
                  <Plus size={12}/> New Meeting
                </button>
              </div>

              {meetings.length === 0
                ? <div style={{ textAlign:"center", padding:"48px 24px" }}>
                    <Calendar size={36} color="var(--text-muted)" style={{ marginBottom:12 }}/>
                    <h3 style={{ fontSize:14,fontWeight:700,color:"var(--text-primary)",marginBottom:6 }}>No meetings yet</h3>
                    <p style={{ fontSize:12,color:"var(--text-muted)",marginBottom:18 }}>Create your first meeting to start capturing notes and recordings.</p>
                    <button className="btn btn-primary" onClick={()=>setShowNewMtg(true)}><Plus size={14}/>Create Meeting</button>
                  </div>
                : meetings.map(m => (
                    <MeetingRow
                      key={m._id}
                      meeting={m}
                      notes={notes.filter(n=>n.meetingId===m._id)}
                      recordings={recordings.filter(r=>r.meetingId===m._id)}
                      onNoteDelete={delNote}
                      onNotePin={pinNote}
                      onRecDelete={delRec}
                      onReload={load}
                      companyId={companyId}
                    />
                  ))
              }
            </div>
          )}

          {/* ── NOTES tab ── */}
          {topTab === "notes" && (
            <NotesTabPanel
              meetings={meetings}
              allNotes={allNotes}
              onDelete={delNote}
              onPin={pinNote}
              onReload={load}
            />
          )}

          {/* ── RECORDINGS tab ── */}
          {topTab === "recordings" && (
            <RecordingsTabPanel
              meetings={meetings}
              allRecordings={allRecordings}
              onDelete={delRec}
              onReload={load}
            />
          )}
        </div>
      </div>

      {showNewMtg && (
        <NewMeetingModal
          companyId={companyId}
          onClose={()=>setShowNewMtg(false)}
          onSaved={()=>{ setShowNewMtg(false); load(); }}
        />
      )}
    </div>
  );
}
