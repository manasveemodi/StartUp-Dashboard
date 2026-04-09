import React, { useState, useEffect, useCallback, useRef } from "react";
// Change line 2 to:
import { useParams, Link, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import {
  ArrowLeft, Building2, Plus, Mic, FileText,
  Trash2, Play, Pause, Square, RotateCcw, Upload,
  AlertCircle, Calendar, Clock, CheckCircle,
  Tag, Pin, PinOff, Edit3, X, Users, ChevronDown, ChevronRight,
  Layers, Radio, Paperclip, FolderOpen, Download, File, FileImage, FileCode, FileSpreadsheet,
  Link as LinkIcon, Globe, ExternalLink
} from "lucide-react";
import { companiesAPI, meetingsAPI, notesAPI, recordingsAPI } from "../utils/api";
/* filesAPI is handled locally in this file via useFilesStore */
import { useToast }       from "../context/ToastContext";
import { useCompanyTime } from "../context/CompanyTimeContext";
import { useVoiceRecorder } from "../hooks/useVoiceRecorder";
import TopBar           from "../components/TopBar";

/* ─── helpers ─────────────────────────────────────────────── */
const fmtDur   = s => { if(!s)return"0:00"; return `${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,"0")}`; };
const fmtBytes = b => { if(!b)return"—"; const u=["B","KB","MB"],i=Math.floor(Math.log(b)/Math.log(1024)); return `${parseFloat((b/Math.pow(1024,i)).toFixed(1))} ${u[i]}`; };
const fmtTotal = s => { if(!s)return"0m"; const h=Math.floor(s/3600),m=Math.floor((s%3600)/60); return h>0?`${h}h ${m}m`:`${m}m`; };

const statusConf  = { active:{color:"#059669",bg:"#d1fae5"}, inactive:{color:"#6b7280",bg:"#f3f4f6"}, prospect:{color:"#d97706",bg:"#fef3c7"}, client:{color:"#4f46e5",bg:"#ede9fe"} };
const mStatusConf = { scheduled:{color:"#6366f1",bg:"#ede9fe"}, ongoing:{color:"#059669",bg:"#d1fae5"}, completed:{color:"#0891b2",bg:"#cffafe"} };
const prioConf    = { high:{color:"var(--rose)",bg:"var(--rose-soft)"}, medium:{color:"var(--amber)",bg:"var(--amber-soft)"}, low:{color:"var(--green)",bg:"var(--green-soft)"} };

/* ════════════════════════════════════════════
   STATUS DROPDOWN  (reusable pill-style)
════════════════════════════════════════════ */
const STATUS_OPTIONS = [
  { value:"scheduled", label:"Scheduled", color:"#6366f1", bg:"#ede9fe", dot:"#6366f1" },
  { value:"ongoing",   label:"Ongoing",   color:"#059669", bg:"#d1fae5", dot:"#059669" },
  { value:"completed", label:"Completed", color:"#0891b2", bg:"#cffafe", dot:"#0891b2" },
  
];

function StatusDropdown({ value, onChange, small=false }) {
  const [open, setOpen] = useState(false);
  const ref             = useRef(null);
  const current         = STATUS_OPTIONS.find(o => o.value === value) || STATUS_OPTIONS[0];

  /* close on outside click */
  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} style={{ position:"relative", display:"inline-block" }}>
      {/* Trigger pill */}
      <button
        type="button"
        onClick={e => { e.stopPropagation(); setOpen(o => !o); }}
        style={{
          display:"flex", alignItems:"center", gap:6,
          padding: small ? "3px 8px 3px 7px" : "6px 10px 6px 9px",
          borderRadius:999,
          background: current.bg,
          border:`1.5px solid ${current.color}30`,
          cursor:"pointer",
          fontSize: small ? 10 : 12,
          fontWeight:700,
          color: current.color,
          whiteSpace:"nowrap",
          transition:"all 0.15s",
        }}
      >
        <span style={{ width: small?6:7, height: small?6:7, borderRadius:"50%", background:current.dot, flexShrink:0 }}/>
        {current.label}
        <ChevronDown size={small?10:12} style={{ marginLeft:1, opacity:0.7 }}/>
      </button>

      {/* Dropdown panel */}
      {open && (
        <div style={{
          position:"absolute", top:"calc(100% + 6px)", left:0, zIndex:999,
          background:"var(--bg-card)", border:"1px solid var(--border)",
          borderRadius:"var(--radius-sm)", boxShadow:"0 8px 24px rgba(0,0,0,0.12)",
          minWidth:148, overflow:"hidden",
        }}>
          {STATUS_OPTIONS.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={e => { e.stopPropagation(); onChange(opt.value); setOpen(false); }}
              style={{
                display:"flex", alignItems:"center", gap:9,
                width:"100%", padding:"9px 13px",
                background: value === opt.value ? opt.bg : "transparent",
                border:"none", cursor:"pointer", textAlign:"left",
                fontSize:12, fontWeight: value===opt.value ? 700 : 500,
                color: value === opt.value ? opt.color : "var(--text-primary)",
                transition:"background 0.12s",
              }}
              onMouseEnter={e => { if (value !== opt.value) e.currentTarget.style.background = "var(--bg-elevated)"; }}
              onMouseLeave={e => { if (value !== opt.value) e.currentTarget.style.background = "transparent"; }}
            >
              <span style={{ width:8, height:8, borderRadius:"50%", background:opt.dot, flexShrink:0 }}/>
              {opt.label}
              {value === opt.value && <CheckCircle size={12} style={{ marginLeft:"auto" }} color={opt.color}/>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

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
  const navigate = useNavigate(); // Add this line here
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
  const [queuedFiles, setQueuedFiles] = useState([]); // [{file, label}]

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

      // convert queued files to persistent entries and bubble up via onSaved
      const newFileEntries = queuedFiles.map(qf => {
        let objectUrl = null;
        if (qf.base64) {
          try {
            const [header, data] = qf.base64.split(",");
            const mime  = header.match(/:(.*?);/)?.[1] || "application/octet-stream";
            const bytes = atob(data);
            const arr   = new Uint8Array(bytes.length);
            for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
            objectUrl = URL.createObjectURL(new Blob([arr], { type: mime }));
          } catch {}
        }
        return {
          id:        `${Date.now()}-${Math.random()}`,
          meetingId: newId,
          name:      qf.file.name,
          size:      qf.file.size,
          base64:    qf.base64 || null,
          objectUrl,
          createdAt: new Date().toISOString(),
        };
      });

      toast.success(`Meeting "${form.title}" created!`);
      onSaved(newFileEntries);
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
    { id:"files",     label:"Files",     icon:Paperclip, accent:"var(--teal)"   },
  ];

  return (
    <div
      style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:16 }}
      onClick={e=>e.target===e.currentTarget&&onClose()}
    >
      <div className="card animate-scaleIn" style={{ width:"100%",maxWidth:560,maxHeight:"90vh",display:"flex",flexDirection:"column",boxShadow:"var(--shadow-xl)",overflow:"hidden" }}>

        {/* ── Modal header ── */}
       {/* ── Modal header ── */}
<div style={{ 
  height: "72px",                  // Set a fixed height to prevent "jumping"
  padding: "0 20px",               // Horizontal padding only
  borderBottom: "1px solid var(--border)",
  display: "flex", 
  alignItems: "center",            // Vertically centers everything perfectly
  justifyContent: "space-between",
  flexShrink: 0,                   // CRITICAL: Prevents header from squishing
  background: "var(--bg-card)"     // Ensures background is solid
}}>
  <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
    <h2 style={{ 
      fontSize: 15, 
      fontWeight: 800, 
      color: "var(--text-primary)", 
      margin: 0,                   // Reset margins to prevent clipping
      lineHeight: 1.2 
    }}>
      New Meeting
    </h2>
    <p style={{ 
      fontSize: 11, 
      color: "var(--text-muted)", 
      margin: 0,                   // Reset margins
      lineHeight: 1.2 
    }}>
      Fill details, optionally add notes &amp; recordings.
    </p>
  </div>
  
  <button 
    onClick={onClose} 
    className="btn btn-ghost btn-sm" 
    style={{ 
      width: 32, 
      height: 32, 
      display: "flex", 
      alignItems: "center", 
      justifyContent: "center",
      padding: 0 
    }}
  >
    <X size={16}/>
  </button>
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
              {t.id==="notes"     && notes.length>0        && <span style={{ fontSize:9,fontWeight:800,padding:"1px 5px",borderRadius:99,background:"var(--amber-soft)",color:"var(--amber)" }}>{notes.length}</span>}
              {t.id==="recording" && savedBlobs.length>0   && <span style={{ fontSize:9,fontWeight:800,padding:"1px 5px",borderRadius:99,background:"var(--rose-soft)",color:"var(--rose)" }}>{savedBlobs.length}</span>}
              {t.id==="files"     && queuedFiles.length>0  && <span style={{ fontSize:9,fontWeight:800,padding:"1px 5px",borderRadius:99,background:"var(--teal-soft,#ccfbf1)",color:"var(--teal)" }}>{queuedFiles.length}</span>}
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
                  <StatusDropdown value={form.status} onChange={v=>set("status",v)}/>
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

          {/* ════ FILES TAB ════ */}
          {tab==="files" && (
            <div>
              {/* Inline file picker — no meetingId yet, just queue locally */}
              {(()=>{
                const ref = React.createRef();
                return (
                  <>
                    <input ref={ref} type="file" multiple style={{ display:"none" }}
                      onChange={async e=>{
                        const picked = Array.from(e.target.files||[]);
                        const withB64 = await Promise.all(picked.map(async f => {
                          let base64 = null;
                          try { base64 = await fileToBase64(f); } catch {}
                          return { id:Date.now()+Math.random(), file:f, base64 };
                        }));
                        setQueuedFiles(q=>[...q,...withB64]);
                        e.target.value="";
                      }}
                    />
                    <div
                      onClick={()=>ref.current?.click()}
                      style={{ border:"2px dashed var(--teal,#0891b2)",borderRadius:"var(--radius-sm)",padding:"26px 20px",textAlign:"center",cursor:"pointer",background:"var(--teal-soft,#f0fdfa)",marginBottom:14,transition:"background 0.15s" }}
                      onMouseEnter={e=>e.currentTarget.style.background="rgba(8,145,178,0.1)"}
                      onMouseLeave={e=>e.currentTarget.style.background="var(--teal-soft,#f0fdfa)"}
                    >
                      <div style={{ width:40,height:40,borderRadius:"50%",background:"#fff",border:"1.5px solid var(--teal,#0891b2)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 10px" }}>
                        <Paperclip size={17} color="var(--teal,#0891b2)"/>
                      </div>
                      <div style={{ fontSize:13,fontWeight:600,color:"var(--teal,#0891b2)",marginBottom:3 }}>Click to browse files</div>
                      <div style={{ fontSize:11,color:"var(--text-muted)" }}>PDFs, images, spreadsheets, documents — any type</div>
                    </div>
                  </>
                );
              })()}

              {queuedFiles.length===0
                ? <div style={{ textAlign:"center",padding:"16px 0",color:"var(--text-muted)" }}>
                    <Paperclip size={26} style={{ marginBottom:8,opacity:0.35 }}/>
                    <p style={{ fontSize:12 }}>No files queued yet. Click above to attach files.</p>
                    <p style={{ fontSize:11,marginTop:4 }}>Files will be uploaded when you click <strong>Create Meeting</strong>.</p>
                  </div>
                : <div style={{ display:"flex",flexDirection:"column",gap:7 }}>
                    <p style={{ fontSize:11,color:"var(--text-muted)",marginBottom:2 }}>
                      {queuedFiles.length} file{queuedFiles.length!==1?"s":""} queued — will be uploaded with the meeting
                    </p>
                    {queuedFiles.map((qf,i)=>{
                      const Icon = fileIconFor(qf.file.name);
                      const ac   = fileAccentFor(qf.file.name);
                      return (
                        <div key={qf.id} style={{ display:"flex",alignItems:"center",gap:10,padding:"9px 12px",borderRadius:"var(--radius-xs)",background:"var(--bg-elevated)",border:"1px solid var(--border)" }}>
                          <div style={{ width:32,height:32,borderRadius:"var(--radius-xs)",background:ac.bg,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                            <Icon size={14} color={ac.color}/>
                          </div>
                          <div style={{ flex:1,minWidth:0 }}>
                            <div style={{ fontSize:12,fontWeight:600,color:"var(--text-primary)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{qf.file.name}</div>
                            <div style={{ fontSize:10,color:"var(--text-muted)" }}>{fmtBytes(qf.file.size)}</div>
                          </div>
                          <button onClick={()=>setQueuedFiles(q=>q.filter((_,j)=>j!==i))}
                            className="btn btn-ghost btn-sm" style={{ padding:"2px 4px",color:"var(--text-muted)",flexShrink:0 }}
                            onMouseEnter={e=>e.currentTarget.style.color="var(--rose)"}
                            onMouseLeave={e=>e.currentTarget.style.color="var(--text-muted)"}
                          ><Trash2 size={11}/></button>
                        </div>
                      );
                    })}
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
            {queuedFiles.length>0&&<span style={{ fontSize:11,color:"var(--teal,#0891b2)",fontWeight:600,flexShrink:0 }}>{queuedFiles.length} file{queuedFiles.length!==1?"s":""}</span>}
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
                :<><Calendar size={14}/>Create Meeting{notes.length+savedBlobs.length+queuedFiles.length>0?` + ${notes.length+savedBlobs.length+queuedFiles.length} item${notes.length+savedBlobs.length+queuedFiles.length!==1?"s":""}`:""}</>
              }
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

/* ════════════════════════════════════════════
   FILE HELPERS
════════════════════════════════════════════ */
const fileIconFor = (name="") => {
  const ext = name.split(".").pop().toLowerCase();
  if (["jpg","jpeg","png","gif","webp","svg"].includes(ext)) return FileImage;
  if (["js","ts","jsx","tsx","py","java","cpp","html","css","json"].includes(ext)) return FileCode;
  if (["xls","xlsx","csv"].includes(ext)) return FileSpreadsheet;
  if (["pdf"].includes(ext)) return File;
  return Paperclip;
};
const fileAccentFor = (name="") => {
  const ext = name.split(".").pop().toLowerCase();
  if (["jpg","jpeg","png","gif","webp","svg"].includes(ext)) return { color:"var(--teal)",  bg:"var(--teal-soft)"  };
  if (["js","ts","jsx","tsx","py","java","cpp","html","css","json"].includes(ext)) return { color:"var(--accent)", bg:"var(--accent-soft)" };
  if (["xls","xlsx","csv"].includes(ext)) return { color:"var(--green)", bg:"var(--green-soft)" };
  if (["pdf"].includes(ext)) return { color:"var(--rose)",   bg:"var(--rose-soft)"  };
  return { color:"var(--amber)", bg:"var(--amber-soft)" };
};

/* ════════════════════════════════════════════
   FILE PREVIEW MODAL — Enterprise grade
════════════════════════════════════════════ */
function FilePreviewModal({ file, onClose }) {
  const name = file.name || file.originalName || file.filename || "File";
  const url  = file.objectUrl || file.url || null;
  const ext  = name.split(".").pop().toLowerCase();
  const ac   = fileAccentFor(name);

  const isImage = ["jpg","jpeg","png","gif","webp","svg"].includes(ext);
  const isPdf   = ext === "pdf";
  const isText  = ["txt","md","json","js","ts","jsx","tsx","py","html","css","csv"].includes(ext);

  const [textContent, setTextContent] = useState(null);

  useEffect(() => {
    if (isText && url) {
      fetch(url).then(r=>r.text()).then(setTextContent).catch(()=>setTextContent("Could not load file content."));
    }
  }, [url, isText]);

  useEffect(() => {
    const handler = e => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  const Icon     = fileIconFor(name);
  const lineCount = textContent ? textContent.split("\n").length : 0;

  return (
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{
        position:"fixed", inset:0, zIndex:4000,
        background:"rgba(8,10,18,0.80)",
        backdropFilter:"blur(10px) saturate(1.4)",
        display:"flex", alignItems:"center", justifyContent:"center",
        padding:"28px 20px",
      }}
    >
      <div style={{
  width:"100%",
  maxWidth: isImage ? 960 : 820,

  minHeight:"60vh",
  maxHeight:"90vh",

  paddingTop: "80px",
  display:"flex",
  flexDirection:"column",

  borderRadius:14,
  overflow:"hidden",

  background:"var(--bg-card,#ffffff)",
  border:"1px solid var(--border)",
}}>
        {/* ══ TOPBAR ══ */}
          <div style={{
            height: "60px",          // Fixed height
            minHeight: "60px",       // Force it to stay this size
            flexShrink: 0,           // Prevents content below from squishing it
            display: "flex", 
            alignItems: "center", 
            justifyContent: "space-between", // Pushes download button to the right
            padding: "0 16px",
            background: "#f8f9fb",
            zIndex: 10,              // Keeps it on top layer
          }}>
          {/* Icon badge */}
          <div style={{
            width:38, height:38, borderRadius:10,
            background:ac.bg, border:`1.5px solid ${ac.color}30`,
            display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0,
          }}>
            <Icon size={17} color={ac.color}/>
          </div>

          {/* Name + meta */}
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:14, fontWeight:700, color:"var(--text-primary)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", lineHeight:1.3 }}>
              {name}
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:12, marginTop:3, flexWrap:"wrap" }}>
              {/* ext tag */}
              <span style={{ fontSize:9, fontWeight:800, letterSpacing:"0.7px", textTransform:"uppercase", padding:"2px 7px", borderRadius:99, background:ac.bg, color:ac.color }}>
                {ext}
              </span>
              {file.size && <span style={{ fontSize:11, color:"var(--text-muted)" }}>{fmtBytes(file.size)}</span>}
              {file.createdAt && <span style={{ fontSize:11, color:"var(--text-muted)", fontFamily:"JetBrains Mono" }}>{format(new Date(file.createdAt),"MMM d, yyyy · HH:mm")}</span>}
              {isText && lineCount > 0 && <span style={{ fontSize:11, color:"var(--text-muted)" }}>{lineCount} lines</span>}
            </div>
          </div>

          {/* Actions */}
          <div style={{ 
              display:"flex", 
              alignItems:"center", 
              gap:8, 
              flexShrink:0,
              flexWrap:"wrap"   // 👈 ADD THIS
            }}>    
            {url && (
              <a href={url} download={name} target="_blank" rel="noreferrer"
                style={{
                  display:"inline-flex", alignItems:"center", gap:6,
                  padding:"7px 14px", borderRadius:8, textDecoration:"none",
                  background:"var(--accent-soft)", color:"var(--accent)",
                  border:"1px solid var(--accent)25",
                  fontSize:12, fontWeight:600, transition:"all 0.15s",
                }}
                onMouseEnter={e=>{e.currentTarget.style.background="var(--accent)";e.currentTarget.style.color="#fff";}}
                onMouseLeave={e=>{e.currentTarget.style.background="var(--accent-soft)";e.currentTarget.style.color="var(--accent)";}}>
                <Download size={13}/> Download
              </a>
            )}
            <button onClick={onClose}
              style={{
                width:34, height:34, borderRadius:8,
                border:"1px solid var(--border)", background:"var(--bg-card)",
                cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
                color:"var(--text-muted)", transition:"all 0.15s",
              }}
              onMouseEnter={e=>{e.currentTarget.style.background="var(--rose-soft,#fff1f2)";e.currentTarget.style.borderColor="var(--rose)";e.currentTarget.style.color="var(--rose)";}}
              onMouseLeave={e=>{e.currentTarget.style.background="var(--bg-card)";e.currentTarget.style.borderColor="var(--border)";e.currentTarget.style.color="var(--text-muted)";}}>
              <X size={15}/>
            </button>
          </div>
        </div>

        {/* ══ SCROLLABLE BODY ══ */}
        <div style={{
          flex:1, overflowY:"auto", overflowX:"hidden",
          scrollbarWidth:"thin", scrollbarColor:"var(--border) transparent",paddingBottom: "20px"
        }}>

          {/* Image — checkered background like Figma */}
          {isImage && url && (
            <div style={{
              display:"flex", alignItems:"flex-start", justifyContent:"center",
              padding:"36px 36px 44px",
              minHeight:"100%",
              background:"repeating-conic-gradient(#e8eaed 0% 25%, #f5f6f8 0% 50%) 0 0 / 22px 22px",
            }}>
              <img src={url} alt={name} style={{
                maxWidth:"100%", height:"auto", display:"block",
                borderRadius:10,
                boxShadow:"0 12px 48px rgba(0,0,0,0.2), 0 0 0 1px rgba(0,0,0,0.06)",
              }}/>
            </div>
          )}

          {/* PDF */}
          {isPdf && url && (
            <iframe src={url} title={name}
              style={{ width:"100%", height:"100%", minHeight:"calc(100vh - 200px)", border:"none", display:"block" }}
            />
          )}

          {/* Text / Code — with line numbers */}
          {isText && (
            <div style={{ display:"flex", height:"100%", minHeight:400 }}>
              {/* Line number gutter */}
              {textContent && (
                <div aria-hidden style={{
                  flexShrink:0, width:56, paddingTop:24, paddingBottom:24,
                  borderRight:"1px solid var(--border)",
                  background:"var(--bg-elevated,#f8f9fb)",
                  textAlign:"right", userSelect:"none", overflowY:"hidden",
                }}>
                  {textContent.split("\n").map((_,i)=>(
                    <div key={i} style={{ fontSize:12, lineHeight:"1.85", paddingRight:14, color:"var(--text-muted)", fontFamily:"JetBrains Mono, monospace", opacity:0.55 }}>
                      {i+1}
                    </div>
                  ))}
                </div>
              )}
              {/* Code area */}
              <div style={{ flex:1, padding:"24px 28px", overflowX:"auto" }}>
                {textContent === null
                  ? (
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:200, gap:10, color:"var(--text-muted)", fontSize:13 }}>
                      <div style={{ width:20,height:20,border:"2.5px solid var(--border)",borderTopColor:"var(--accent)",borderRadius:"50%",animation:"spin 0.8s linear infinite" }}/>
                      Loading file content…
                    </div>
                  )
                  : (
                    <pre style={{
                      margin:0, padding:0,
                      fontSize:13, lineHeight:1.85,
                      color:"var(--text-primary)",
                      fontFamily:"JetBrains Mono, 'Fira Code', 'Cascadia Code', monospace",
                      whiteSpace:"pre-wrap", wordBreak:"break-word",
                      background:"transparent",
                    }}>
                      {textContent}
                    </pre>
                  )
                }
              </div>
            </div>
          )}

          {/* Unsupported */}
          {!isImage && !isPdf && !isText && (
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:440, padding:52, textAlign:"center" }}>
              <div style={{
                width:84, height:84, borderRadius:22,
                background:ac.bg, border:`2px solid ${ac.color}20`,
                display:"flex", alignItems:"center", justifyContent:"center",
                marginBottom:24, boxShadow:`0 10px 28px ${ac.color}18`,
              }}>
                <Icon size={38} color={ac.color}/>
              </div>
              <span style={{ fontSize:10, fontWeight:800, letterSpacing:"0.7px", textTransform:"uppercase", color:ac.color, background:ac.bg, padding:"3px 10px", borderRadius:99, marginBottom:14 }}>
                .{ext} file
              </span>
              <p style={{ fontSize:17, fontWeight:700, color:"var(--text-primary)", marginBottom:8, marginTop:0 }}>{name}</p>
              <p style={{ fontSize:13, color:"var(--text-muted)", marginBottom:30, maxWidth:360, lineHeight:1.7, marginTop:0 }}>
                This file type can't be previewed in the browser. Download it to open with the appropriate application on your device.
              </p>
              {url && (
                <a href={url} download={name} target="_blank" rel="noreferrer"
                  style={{
                    display:"inline-flex", alignItems:"center", gap:8,
                    padding:"12px 26px", borderRadius:10, textDecoration:"none",
                    background:"var(--accent)", color:"#fff",
                    fontSize:13, fontWeight:700,
                    boxShadow:"0 4px 18px var(--accent)35",
                    transition:"opacity 0.15s",
                  }}
                  onMouseEnter={e=>e.currentTarget.style.opacity="0.87"}
                  onMouseLeave={e=>e.currentTarget.style.opacity="1"}>
                  <Download size={15}/> Download File
                </a>
              )}
            </div>
          )}
        </div>

        {/* ══ STATUS BAR ══ */}
        <div style={{
          flexShrink:0, height:32,
          borderTop:"1px solid var(--border)",
          background:"var(--bg-elevated,#f8f9fb)",
          display:"flex", alignItems:"center", padding:"0 20px", gap:16,
        }}>
          <span style={{ fontSize:10, color:"var(--text-muted)", display:"flex", alignItems:"center", gap:5 }}>
            <span style={{ width:6,height:6,borderRadius:"50%",background:ac.color,display:"inline-block" }}/>
            {isImage ? "Image Preview" : isPdf ? "PDF Viewer" : isText ? "Text Viewer" : "File Info"}
          </span>
          <span style={{ marginLeft:"auto", fontSize:10, color:"var(--text-muted)", display:"flex", alignItems:"center", gap:5 }}>
            Press <kbd style={{ fontSize:9, padding:"1px 6px", borderRadius:4, border:"1px solid var(--border)", background:"var(--bg-card)", fontFamily:"monospace", letterSpacing:"0.3px" }}>Esc</kbd> to close
          </span>
        </div>

      </div>
    </div>
  );
}

/* ── File Card ── */
function FileCard({ file, onDelete }) {
  const [preview, setPreview] = useState(false);
  const Icon = fileIconFor(file.name || file.originalName || file.filename || "");
  const ac   = fileAccentFor(file.name || file.originalName || file.filename || "");
  const displayName = file.name || file.originalName || file.filename || "Unknown file";
  const downloadUrl = file.objectUrl || file.url || null;
  return (
    <>
      <div
        onClick={() => setPreview(true)}
        style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 12px", borderRadius:"var(--radius-sm)", background:"var(--bg-elevated)", border:"1px solid var(--border)", transition:"all 0.15s", cursor:"pointer" }}
        onMouseEnter={e=>{ e.currentTarget.style.background="var(--bg-card-hover,#f8f9fa)"; e.currentTarget.style.borderColor="var(--accent)30"; }}
        onMouseLeave={e=>{ e.currentTarget.style.background="var(--bg-elevated)"; e.currentTarget.style.borderColor="var(--border)"; }}
      >
        <div style={{ width:36,height:36,borderRadius:"var(--radius-xs)",background:ac.bg,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
          <Icon size={16} color={ac.color}/>
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:12,fontWeight:600,color:"var(--text-primary)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{displayName}</div>
          <div style={{ fontSize:10,color:"var(--text-muted)",display:"flex",alignItems:"center",gap:8,marginTop:2 }}>
            {file.size && <span>{fmtBytes(file.size)}</span>}
            {file.createdAt && <span style={{ fontFamily:"JetBrains Mono" }}>{format(new Date(file.createdAt),"MMM d · HH:mm")}</span>}
            <span style={{ color:"var(--accent)",fontWeight:500 }}>Click to preview</span>
          </div>
        </div>
        <div style={{ display:"flex",gap:4,flexShrink:0 }} onClick={e=>e.stopPropagation()}>
          {downloadUrl && (
            <a href={downloadUrl} download={displayName} target="_blank" rel="noreferrer"
              className="btn btn-ghost btn-sm" style={{ padding:"3px 6px",color:"var(--text-muted)" }}
              onMouseEnter={e=>{e.currentTarget.style.color="var(--accent)";e.currentTarget.style.background="var(--accent-soft)";}}
              onMouseLeave={e=>{e.currentTarget.style.color="var(--text-muted)";e.currentTarget.style.background="transparent";}}>
              <Download size={12}/>
            </a>
          )}
          {onDelete && (
            <button onClick={()=>onDelete(file.id||file._id)} className="btn btn-ghost btn-sm" style={{ padding:"3px 6px",color:"var(--text-muted)" }}
              onMouseEnter={e=>{e.currentTarget.style.color="var(--rose)";e.currentTarget.style.background="var(--rose-soft)";}}
              onMouseLeave={e=>{e.currentTarget.style.color="var(--text-muted)";e.currentTarget.style.background="transparent";}}>
              <Trash2 size={12}/>
            </button>
          )}
        </div>
      </div>

      {preview && <FilePreviewModal file={file} onClose={()=>setPreview(false)}/>}
    </>
  );
}

/* ── Drop Zone — stores files locally, no API needed ── */
function FileDropZone({ meetingId, onUploaded, compact=false }) {
  const toast    = useToast();
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const processFiles = async (rawFiles) => {
    if (!rawFiles?.length) return;
    const list = Array.from(rawFiles);
    const newEntries = await Promise.all(list.map(async f => {
      let base64 = null;
      try { base64 = await fileToBase64(f); } catch {}
      return {
        id:        `${Date.now()}-${Math.random()}`,
        meetingId,
        name:      f.name,
        size:      f.size,
        base64,                                 // stored in localStorage
        objectUrl: base64 ? URL.createObjectURL(
          // rebuild blob from base64 for immediate use
          (() => {
            const [header, data] = base64.split(",");
            const mime = header.match(/:(.*?);/)?.[1] || "application/octet-stream";
            const bytes = atob(data);
            const arr = new Uint8Array(bytes.length);
            for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
            return new Blob([arr], { type: mime });
          })()
        ) : null,
        createdAt: new Date().toISOString(),
      };
    }));
    onUploaded?.(newEntries);
    toast.success(`${list.length} file${list.length !== 1 ? "s" : ""} attached!`);
  };

  const onDrop = async e => {
    e.preventDefault(); setDragging(false);
    await processFiles(e.dataTransfer.files);
  };

  if (compact) return (
    <div>
      <input ref={inputRef} type="file" multiple style={{ display:"none" }}
        onChange={async e=>{ await processFiles(e.target.files); e.target.value=""; }}/>
      <button className="btn btn-sm" onClick={()=>inputRef.current?.click()}
        style={{ width:"100%",justifyContent:"center",border:"1.5px dashed var(--border)",background:"var(--bg-elevated)",color:"var(--text-muted)",gap:6,marginBottom:10 }}
        onMouseEnter={e=>{e.currentTarget.style.borderColor="var(--teal,#0891b2)";e.currentTarget.style.color="var(--teal,#0891b2)";}}
        onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--border)";e.currentTarget.style.color="var(--text-muted)";}}>
        <Paperclip size={12}/> Attach Files
      </button>
    </div>
  );

  return (
    <div>
      <input ref={inputRef} type="file" multiple style={{ display:"none" }}
        onChange={async e=>{ await processFiles(e.target.files); e.target.value=""; }}/>
      <div
        onDragOver={e=>{e.preventDefault();setDragging(true);}}
        onDragLeave={()=>setDragging(false)}
        onDrop={onDrop}
        onClick={()=>inputRef.current?.click()}
        style={{
          border:`2px dashed ${dragging?"var(--teal,#0891b2)":"var(--border)"}`,
          borderRadius:"var(--radius-sm)", padding:"28px 20px", textAlign:"center",
          cursor:"pointer", marginBottom:14, transition:"all 0.18s",
          background: dragging ? "rgba(8,145,178,0.07)" : "var(--bg-elevated)",
        }}
      >
        <div style={{ width:42,height:42,borderRadius:"50%",background:"var(--bg-base)",border:`1.5px solid ${dragging?"var(--teal,#0891b2)":"var(--border)"}`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 10px" }}>
          <Paperclip size={18} color={dragging?"var(--teal,#0891b2)":"var(--text-muted)"}/>
        </div>
        <div style={{ fontSize:13,fontWeight:600,color:dragging?"var(--teal,#0891b2)":"var(--text-primary)",marginBottom:4 }}>
          {dragging ? "Drop files here" : "Click to browse or drag & drop"}
        </div>
        <div style={{ fontSize:11,color:"var(--text-muted)" }}>
          PDFs, images, spreadsheets, documents — any file type
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════
   LINK CARD
════════════════════════════════════════════ */
function LinkCard({ link, onDelete }) {
  const lt = linkTypeFor(link.url);
  const displayUrl = link.url.replace(/^https?:\/\/(www\.)?/, "").slice(0, 60) + (link.url.length > 70 ? "…" : "");
  return (
    <div
      style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 12px", borderRadius:"var(--radius-sm)", background:"var(--bg-elevated)", border:"1px solid var(--border)", transition:"all 0.15s" }}
      onMouseEnter={e=>{ e.currentTarget.style.background="var(--bg-card-hover,#f8f9fa)"; e.currentTarget.style.borderColor=lt.color+"40"; }}
      onMouseLeave={e=>{ e.currentTarget.style.background="var(--bg-elevated)"; e.currentTarget.style.borderColor="var(--border)"; }}
    >
      {/* Icon */}
      <div style={{ width:34, height:34, borderRadius:"var(--radius-xs)", background:lt.bg, border:`1.5px solid ${lt.color}25`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
        <Globe size={15} color={lt.color}/>
      </div>

      {/* Info */}
<div style={{ flex:1, minWidth:0 }}>
  {link.label && (
    <div style={{ fontSize:12, fontWeight:700, color:"var(--text-primary)", marginBottom:2 }}>
      {link.label}
    </div>
  )}

  {/* ✅ FIXED ANCHOR TAG */}
  <a
    href={link.url}
    target="_blank"
    rel="noreferrer"
    style={{
      fontSize:11,
      color:"#2563eb",
      textDecoration:"underline",
      wordBreak:"break-all",
      whiteSpace:"normal",
      overflowWrap:"anywhere",
      display:"block",
    }}
  >
    {link.url}
  </a>

  <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:4 }}>
    <span style={{
      fontSize:9,
      fontWeight:800,
      letterSpacing:"0.5px",
      textTransform:"uppercase",
      padding:"1px 6px",
      borderRadius:99,
      background:lt.bg,
      color:lt.color
    }}>
      {lt.label}
    </span>

    {link.createdAt && (
      <span style={{ fontSize:10, color:"var(--text-muted)", fontFamily:"JetBrains Mono" }}>
        {format(new Date(link.createdAt), "MMM d · HH:mm")}
      </span>
    )}
  </div>
</div>

      {/* Actions */}
      <div style={{ display:"flex", gap:4, flexShrink:0 }}>
        <a
          href={link.url} target="_blank" rel="noreferrer"
          className="btn btn-ghost btn-sm"
          style={{ padding:"3px 6px", color:"var(--text-muted)", display:"flex", alignItems:"center" }}
          onMouseEnter={e=>{ e.currentTarget.style.color="var(--accent)"; e.currentTarget.style.background="var(--accent-soft)"; }}
          onMouseLeave={e=>{ e.currentTarget.style.color="var(--text-muted)"; e.currentTarget.style.background="transparent"; }}
          title="Open in new tab"
        >
          <ExternalLink size={12}/>
        </a>
        {onDelete && (
          <button onClick={()=>onDelete(link.id)} className="btn btn-ghost btn-sm" style={{ padding:"3px 6px", color:"var(--text-muted)" }}
            onMouseEnter={e=>{ e.currentTarget.style.color="var(--rose)"; e.currentTarget.style.background="var(--rose-soft)"; }}
            onMouseLeave={e=>{ e.currentTarget.style.color="var(--text-muted)"; e.currentTarget.style.background="transparent"; }}>
            <Trash2 size={12}/>
          </button>
        )}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════
   FILES TAB PANEL  — two sections side by side
   LEFT:  File upload (existing, unchanged)
   RIGHT: Link manager (new)
════════════════════════════════════════════ */
function FilesTabPanel({ meetings, allFiles, onFilesChange, allLinks, onLinksChange }) {
  const [selectedMtg, setSelectedMtg] = useState(meetings[0]?._id || "");

  /* file helpers */
  const visibleFiles = allFiles
    .filter(f => f.meetingId === selectedMtg)
    .sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
  const handleUploaded = (newEntries) => onFilesChange(prev => [...prev, ...newEntries]);
  const handleDeleteFile = (id) => onFilesChange(prev => prev.filter(f => f.id !== id));

  /* link helpers */
  const visibleLinks = allLinks
    .filter(l => l.meetingId === selectedMtg)
    .sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));

  const [linkUrl,   setLinkUrl]   = useState("");
  const [linkLabel, setLinkLabel] = useState("");
  const [linkError, setLinkError] = useState("");
  const toast = useToast();

  const addLink = () => {
    const trimmed = linkUrl.trim();
    if (!trimmed) { setLinkError("Please enter a URL"); return; }
    const withProto = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    try { new URL(withProto); } catch { setLinkError("Invalid URL — please check the format"); return; }
    if (!selectedMtg) { setLinkError("Select a meeting first"); return; }
    onLinksChange(prev => [...prev, {
      id:        `lnk-${Date.now()}-${Math.random()}`,
      meetingId: selectedMtg,
      url:       withProto,
      label:     linkLabel.trim() || "",
      createdAt: new Date().toISOString(),
    }]);
    setLinkUrl(""); setLinkLabel(""); setLinkError("");
    toast.success("Link saved!");
  };

  const lbl = { fontSize:11, fontWeight:700, color:"var(--text-muted)", display:"block", marginBottom:5, textTransform:"uppercase", letterSpacing:"0.5px" };

  return (
    <div style={{ padding:18 }}>

      {/* ── Meeting picker (full width) ── */}
      <div style={{ marginBottom:18, padding:"12px 14px", borderRadius:"var(--radius-sm)", background:"var(--bg-elevated)", border:"1px solid var(--border)" }}>
        <label style={lbl}>Select Meeting</label>
        {meetings.length === 0
          ? <p style={{ fontSize:12, color:"var(--text-muted)", margin:0 }}>No meetings yet — create one first.</p>
          : <div style={{ position:"relative" }}>
              <Calendar size={12} color="var(--text-muted)" style={{ position:"absolute", left:11, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }}/>
              <select className="input" value={selectedMtg} onChange={e => setSelectedMtg(e.target.value)} style={{ paddingLeft:30, fontSize:13 }}>
                {meetings.map(m => <option key={m._id} value={m._id}>{m.title}</option>)}
              </select>
            </div>
        }
      </div>

      {/* ── Two-column body ── */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, alignItems:"start" }}>

        {/* ════ LEFT: FILES ════ */}
        <div>
          {/* Section header */}
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12, paddingBottom:10, borderBottom:"1px solid var(--border)" }}>
            <div style={{ width:28, height:28, borderRadius:8, background:"var(--teal-soft,#f0fdfa)", border:"1px solid var(--teal,#0891b2)20", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <Paperclip size={13} color="var(--teal,#0891b2)"/>
            </div>
            <div>
              <div style={{ fontSize:13, fontWeight:700, color:"var(--text-primary)" }}>Uploaded Files</div>
              <div style={{ fontSize:10, color:"var(--text-muted)" }}>{visibleFiles.length} file{visibleFiles.length!==1?"s":""} attached</div>
            </div>
          </div>

          {/* Drop zone */}
          {selectedMtg && <FileDropZone meetingId={selectedMtg} onUploaded={handleUploaded}/>}

          {/* Files list */}
          {!selectedMtg
            ? <div style={{ textAlign:"center", padding:"28px 0" }}>
                <FolderOpen size={28} color="var(--text-muted)" style={{ marginBottom:8, opacity:0.5 }}/>
                <p style={{ fontSize:12, color:"var(--text-muted)" }}>Select a meeting to manage files.</p>
              </div>
            : visibleFiles.length === 0
              ? <div style={{ textAlign:"center", padding:"24px 0", border:"1px dashed var(--border)", borderRadius:"var(--radius-sm)", background:"var(--bg-elevated)" }}>
                  <Paperclip size={24} color="var(--text-muted)" style={{ marginBottom:6, opacity:0.4 }}/>
                  <p style={{ fontSize:12, color:"var(--text-muted)", margin:0 }}>No files yet.</p>
                  <p style={{ fontSize:11, color:"var(--text-muted)", marginTop:3 }}>Use the drop zone above.</p>
                </div>
              : <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
                  {visibleFiles.map(f => <FileCard key={f.id} file={f} onDelete={handleDeleteFile}/>)}
                </div>
          }
        </div>

        {/* ════ RIGHT: LINKS ════ */}
        <div>
          {/* Section header */}
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12, paddingBottom:10, borderBottom:"1px solid var(--border)" }}>
            <div style={{ width:28, height:28, borderRadius:8, background:"#ede9fe", border:"1px solid #4f46e520", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <LinkIcon size={13} color="#4f46e5"/>
            </div>
            <div>
              <div style={{ fontSize:13, fontWeight:700, color:"var(--text-primary)" }}>Saved Links</div>
              <div style={{ fontSize:10, color:"var(--text-muted)" }}>{visibleLinks.length} link{visibleLinks.length!==1?"s":""} saved</div>
            </div>
          </div>

          {/* Add link form */}
          <div style={{ padding:12, borderRadius:"var(--radius-sm)", background:"var(--bg-elevated)", border:"1px solid var(--border)", marginBottom:14 }}>
            <div style={{ marginBottom:8 }}>
              <label style={{ ...lbl, marginBottom:4 }}>Label (optional)</label>
              <input
                className="input"
                value={linkLabel}
                onChange={e => setLinkLabel(e.target.value)}
                placeholder="e.g. Project Brief, Drive Folder…"
                style={{ fontSize:12 }}
              />
            </div>
            <div style={{ marginBottom:linkError ? 6 : 10 }}>
              <label style={{ ...lbl, marginBottom:4 }}>URL <span style={{ color:"var(--rose)" }}>*</span></label>
              <div style={{ position:"relative" }}>
                <Globe size={12} color="var(--text-muted)" style={{ position:"absolute", left:11, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }}/>
                <input
                  className="input"
                  value={linkUrl}
                  onChange={e => { setLinkUrl(e.target.value); setLinkError(""); }}
                  onKeyDown={e => e.key === "Enter" && addLink()}
                  placeholder="https://drive.google.com/… or any URL"
                  style={{ paddingLeft:30, fontSize:12, ...(linkError ? { borderColor:"var(--rose)", boxShadow:"0 0 0 3px var(--rose-soft)" } : {}) }}
                />
              </div>
              {linkError && <p style={{ fontSize:11, color:"var(--rose)", marginTop:4, marginBottom:0 }}>{linkError}</p>}
            </div>
            <button
              onClick={addLink}
              disabled={!selectedMtg}
              className="btn btn-sm"
              style={{ width:"100%", justifyContent:"center", background:"#4f46e5", color:"#fff", border:"none", gap:6 }}
              onMouseEnter={e => e.currentTarget.style.opacity="0.88"}
              onMouseLeave={e => e.currentTarget.style.opacity="1"}
            >
              <LinkIcon size={12}/> Save Link
            </button>
          </div>

          {/* Links list */}
          {!selectedMtg
            ? <div style={{ textAlign:"center", padding:"28px 0" }}>
                <Globe size={28} color="var(--text-muted)" style={{ marginBottom:8, opacity:0.5 }}/>
                <p style={{ fontSize:12, color:"var(--text-muted)" }}>Select a meeting to manage links.</p>
              </div>
            : visibleLinks.length === 0
              ? <div style={{ textAlign:"center", padding:"24px 0", border:"1px dashed var(--border)", borderRadius:"var(--radius-sm)", background:"var(--bg-elevated)" }}>
                  <LinkIcon size={24} color="var(--text-muted)" style={{ marginBottom:6, opacity:0.4 }}/>
                  <p style={{ fontSize:12, color:"var(--text-muted)", margin:0 }}>No links yet.</p>
                  <p style={{ fontSize:11, color:"var(--text-muted)", marginTop:3 }}>Paste any URL above.</p>
                </div>
              : <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
                  {visibleLinks.map(l => (
                    <LinkCard
                      key={l.id} link={l}
                      onDelete={id => onLinksChange(prev => prev.filter(x => x.id !== id))}
                    />
                  ))}
                </div>
          }
        </div>

      </div>
    </div>
  );
}

/* ════════════════════════════════════════════
   EXPANDED MEETING ROW  (notes + recordings inline)
════════════════════════════════════════════ */
function MeetingRow({ meeting, notes, recordings, files, onNoteDelete, onNoteEdit, onNotePin, onRecDelete, onFilesChange, onDelete, onStatusChange, onReload, companyId }) {
  const [open,       setOpen]       = useState(false);
  const [innerTab,   setInnerTab]   = useState("notes");   // "notes" | "recordings" | "files"
  const [showNote,   setShowNote]   = useState(false);
  const [editNote,   setEditNote]   = useState(null);
  const [showRec,    setShowRec]    = useState(false);

  const pc      = prioConf[meeting.priority]  || prioConf.medium;
  const nCount  = notes.length;
  const rCount  = recordings.length;
  const fCount  = (files||[]).length;

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
            {fCount > 0 && <span style={{ fontSize:10,color:"var(--text-muted)",display:"flex",alignItems:"center",gap:3 }}><Paperclip size={9}/>{fCount} file{fCount!==1?"s":""}</span>}
          </div>
        </div>

        {/* Status dropdown + Priority badge + Delete */}
        <div style={{ display:"flex", alignItems:"center", gap:6, flexShrink:0 }} onClick={e=>e.stopPropagation()}>
          <StatusDropdown
            value={meeting.status}
            onChange={v => onStatusChange?.(meeting._id, v)}
            small
          />
          <span className="badge" style={{ background:pc.bg,color:pc.color,fontSize:9 }}>{meeting.priority}</span>
          <button
            onClick={() => onDelete?.(meeting._id)}
            className="btn btn-ghost btn-sm"
            style={{ padding:"3px 5px", color:"var(--text-muted)" }}
            title="Delete meeting"
            onMouseEnter={e=>{e.currentTarget.style.color="var(--rose)";e.currentTarget.style.background="var(--rose-soft)";}}
            onMouseLeave={e=>{e.currentTarget.style.color="var(--text-muted)";e.currentTarget.style.background="transparent";}}
          >
            <Trash2 size={13}/>
          </button>
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
                { id:"notes",      label:`Notes (${nCount})`,      icon:FileText  },
                { id:"recordings", label:`Recordings (${rCount})`, icon:Mic       },
                { id:"files",      label:`Files (${fCount})`,      icon:Paperclip },
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
              <button
                className="btn btn-sm"
                style={{ background:"var(--teal-soft)",color:"var(--teal)",border:"1px solid var(--teal)",gap:5 }}
                onClick={()=>setInnerTab("files")}
              >
                <Paperclip size={11}/> Files
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

          {/* Files panel */}
          {innerTab==="files" && (
            <div>
              <FileDropZone
                meetingId={meeting._id}
                onUploaded={newEntries => onFilesChange(prev => [...prev, ...newEntries])}
                compact
              />
              {(files||[]).length === 0
                ? <div style={{ textAlign:"center",padding:"20px 0" }}>
                    <Paperclip size={22} color="var(--text-muted)" style={{ marginBottom:7,opacity:0.5 }}/>
                    <p style={{ fontSize:12,color:"var(--text-muted)" }}>No files attached yet. Use the button above.</p>
                  </div>
                : <div style={{ display:"flex",flexDirection:"column",gap:7,marginTop:10 }}>
                    <div style={{ fontSize:11,color:"var(--text-muted)",marginBottom:2 }}>
                      {(files||[]).length} file{(files||[]).length!==1?"s":""} attached
                    </div>
                    {(files||[]).map(f=>(
                      <FileCard key={f.id} file={f}
                        onDelete={id => onFilesChange(prev => prev.filter(x => x.id !== id))}
                      />
                    ))}
                  </div>
              }
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
   FILE PERSISTENCE — localStorage keyed by companyId
   Stores file metadata + base64 data so files
   survive navigation and page refresh.
════════════════════════════════════════════ */
const FILES_KEY = (companyId) => `crm_files_${companyId}`;

/* Convert a File object → base64 string */
const fileToBase64 = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload  = () => resolve(reader.result); // data:mime;base64,...
  reader.onerror = reject;
  reader.readAsDataURL(file);
});

/* Save full file list for a company to localStorage */
const persistFiles = (companyId, entries) => {
  try {
    // Only persist serialisable fields — objectUrl is regenerated from base64
    const serialisable = entries.map(({ objectUrl, ...rest }) => rest);
    localStorage.setItem(FILES_KEY(companyId), JSON.stringify(serialisable));
  } catch (e) {
    console.warn("File persistence failed (storage full?):", e);
  }
};

/* Load saved files and restore objectUrls from base64 */
const loadPersistedFiles = (companyId) => {
  try {
    const raw = localStorage.getItem(FILES_KEY(companyId));
    if (!raw) return [];
    const entries = JSON.parse(raw);
    return entries.map(entry => {
      // Rebuild the blob URL from stored base64 so download/preview works
      let objectUrl = null;
      if (entry.base64) {
        try {
          const [header, data] = entry.base64.split(",");
          const mime  = header.match(/:(.*?);/)?.[1] || "application/octet-stream";
          const bytes = atob(data);
          const arr   = new Uint8Array(bytes.length);
          for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
          const blob  = new Blob([arr], { type: mime });
          objectUrl   = URL.createObjectURL(blob);
        } catch {}
      }
      return { ...entry, objectUrl };
    });
  } catch (e) {
    return [];
  }
};

/* ════════════════════════════════════════════
   LINK PERSISTENCE — localStorage keyed by companyId
════════════════════════════════════════════ */
const LINKS_KEY          = (companyId) => `crm_links_${companyId}`;
const persistLinks       = (companyId, entries) => { try { localStorage.setItem(LINKS_KEY(companyId), JSON.stringify(entries)); } catch {} };
const loadPersistedLinks = (companyId) => { try { const r = localStorage.getItem(LINKS_KEY(companyId)); return r ? JSON.parse(r) : []; } catch { return []; } };

/* Detect link type for badge colouring */
const linkTypeFor = (url="") => {
  if (/drive\.google\.com/i.test(url))  return { label:"Drive",  color:"#059669", bg:"#d1fae5" };
  if (/docs\.google\.com/i.test(url))   return { label:"Docs",   color:"#4f46e5", bg:"#ede9fe" };
  if (/sheets\.google\.com/i.test(url)) return { label:"Sheets", color:"#0891b2", bg:"#cffafe" };
  if (/slides\.google\.com/i.test(url)) return { label:"Slides", color:"#d97706", bg:"#fef3c7" };
  if (/youtube\.com|youtu\.be/i.test(url)) return { label:"YouTube", color:"#e11d48", bg:"#ffe4e6" };
  if (/github\.com/i.test(url))         return { label:"GitHub", color:"#374151", bg:"#f3f4f6" };
  return { label:"Link", color:"#6366f1", bg:"#ede9fe" };
};

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
  /* Files: initialise from localStorage so they survive navigation */
  const [files, setFilesState] = useState(() => loadPersistedFiles(companyId));
  /* Links: initialise from localStorage so they survive navigation */
  const [links, setLinksState] = useState(() => loadPersistedLinks(companyId));
  const [loading,    setLoading]    = useState(true);

  /* Wrapper: always keep localStorage in sync when files change */
  const setFiles = useCallback((updater) => {
    setFilesState(prev => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      persistFiles(companyId, next);
      return next;
    });
  }, [companyId]);

  /* Wrapper: always keep localStorage in sync when links change */
  const setLinks = useCallback((updater) => {
    setLinksState(prev => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      persistLinks(companyId, next);
      return next;
    });
  }, [companyId]);

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
        setMeetings(m   || []);
        setNotes(n      || []);
        setRecordings(rec || []);
        // Note: files are stored in local state only — not reset on reload
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

  const delNote    = async id => { if(!window.confirm("Delete this note?")) return; await notesAPI.delete(id); toast.success("Deleted"); load(); };
  const delRec     = async id => { if(!window.confirm("Delete this recording?")) return; await recordingsAPI.delete(id); toast.success("Deleted"); load(); };
  const delMeeting = async id => { if(!window.confirm("Delete this meeting? All its notes and recordings will also be removed.")) return; await meetingsAPI.delete(id); toast.success("Meeting deleted"); load(); };
  const updateMeetingStatus = async (id, status) => { try { await meetingsAPI.update(id,{status}); load(); } catch { toast.error("Failed to update status"); } };
  const pinNote    = async id => { await notesAPI.togglePin(id); load(); };

  /* Sort all notes for global tab */
  const allNotes = [...notes].sort((a,b)=>(b.isPinned?1:0)-(a.isPinned?1:0)||new Date(b.createdAt)-new Date(a.createdAt));

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
    { id:"meetings",   label:"Meetings",   icon:Calendar,  count:meetings.length,   accent:"var(--accent)" },
    { id:"notes",      label:"Notes",      icon:FileText,  count:notes.length,      accent:"var(--amber)"  },
    { id:"recordings", label:"Recordings", icon:Mic,       count:recordings.length, accent:"var(--rose)"   },
    { id:"files",      label:"Files",      icon:Paperclip, count:files.length + links.length, accent:"var(--teal,#0891b2)" },
  ];

  return (
    <div style={{ background:"var(--bg-base)", minHeight:"100vh" }}>
      <TopBar
        title={company.name}
        subtitle={`${company.industry||"Company"} · ${meetings.length} meetings · ${notes.length} notes`}
      />

      <div style={{ maxWidth:960, margin:"0 auto", padding:"20px 24px 60px" }}>
        <Link to="/companies" className="btn btn-ghost btn-sm" style={{ marginBottom:20, display:"inline-flex" }}>
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
                      files={files.filter(f=>f.meetingId===m._id)}
                      onNoteDelete={delNote}
                      onNotePin={pinNote}
                      onRecDelete={delRec}
                      onFilesChange={setFiles}
                      onDelete={delMeeting}
                      onStatusChange={updateMeetingStatus}
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
              allRecordings={[...recordings].sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt))}
              onDelete={delRec}
              onReload={load}
            />
          )}

          {/* ── FILES tab ── */}
          {topTab === "files" && (
            <FilesTabPanel
              meetings={meetings}
              allFiles={files}
              onFilesChange={setFiles}
              allLinks={links}
              onLinksChange={setLinks}
            />
          )}
        </div>
      </div>

      {showNewMtg && (
        <NewMeetingModal
          companyId={companyId}
          onClose={()=>setShowNewMtg(false)}
          onSaved={(newFileEntries=[])=>{
            setShowNewMtg(false);
            if (newFileEntries.length) setFiles(prev => [...prev, ...newFileEntries]);
            load();
          }}
        />
      )}
    </div>
  );
}
