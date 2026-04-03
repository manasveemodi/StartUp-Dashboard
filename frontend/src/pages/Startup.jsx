import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import {
  Rocket, Plus, Calendar, FileText, Mic, ChevronRight,
  Sparkles, Clock, Users, ArrowRight, Zap, Target,
  TrendingUp, CheckCircle2, PlayCircle,
} from "lucide-react";
import { meetingsAPI, notesAPI, recordingsAPI } from "../utils/api";
import { useToast } from "../context/ToastContext";
import TopBar from "../components/TopBar";
import CreateNoteModal from "../components/CreateNoteModal";
import VoiceRecorder from "../components/VoiceRecorder";

const statusConf = {
  scheduled: { color:"#6366f1", bg:"#ede9fe", label:"Scheduled" },
  ongoing:   { color:"#059669", bg:"#d1fae5", label:"Ongoing"   },
  completed: { color:"#0891b2", bg:"#cffafe", label:"Completed" },
  cancelled: { color:"#e11d48", bg:"#ffe4e6", label:"Cancelled" },
};

function FeatureCard({ icon:Icon, title, desc, color, bg }) {
  return (
    <div style={{ display:"flex", gap:14, padding:"16px 18px", borderRadius:"var(--radius-sm)", background:bg, border:`1px solid ${color}30` }}>
      <div style={{ width:38, height:38, borderRadius:"var(--radius-sm)", background:color, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
        <Icon size={17} color="#fff" strokeWidth={2} />
      </div>
      <div>
        <div style={{ fontSize:13, fontWeight:700, color:"var(--text-primary)", marginBottom:3 }}>{title}</div>
        <div style={{ fontSize:12, color:"var(--text-secondary)", lineHeight:1.5 }}>{desc}</div>
      </div>
    </div>
  );
}

export default function Startup() {
  const navigate = useNavigate();
  const toast    = useToast();

  const [meetings,  setMeetings]  = useState([]);
  const [selected,  setSelected]  = useState(null); // meeting to work on
  const [notes,     setNotes]     = useState([]);
  const [recordings,setRecordings]= useState([]);
  const [loading,   setLoading]   = useState(true);
  const [showNote,  setShowNote]  = useState(false);
  const [showRec,   setShowRec]   = useState(false);
  const [creating,  setCreating]  = useState(false);
  const [quickForm, setQuickForm] = useState({ title:"", description:"" });

  const loadMeetings = () => {
    setLoading(true);
    meetingsAPI.getAll({ limit:10, sortBy:"createdAt", sortOrder:"desc" })
      .then(r => setMeetings(r.data.data || []))
      .finally(() => setLoading(false));
  };

  const loadMeetingData = (m) => {
    setSelected(m);
    Promise.all([
      notesAPI.getByMeeting(m._id, { limit:20 }),
      recordingsAPI.getByMeeting(m._id),
    ]).then(([nr, rr]) => {
      setNotes(nr.data.data || []);
      setRecordings(rr.data.data || []);
    });
  };

  useEffect(() => { loadMeetings(); }, []);

  const handleQuickCreate = async () => {
    if (!quickForm.title.trim()) { toast.error("Please enter a meeting title"); return; }
    setCreating(true);
    try {
      const res = await meetingsAPI.create({ title: quickForm.title.trim(), description: quickForm.description.trim(), status:"ongoing", priority:"medium" });
      toast.success("Meeting created! You can now add notes and record audio.");
      loadMeetings();
      loadMeetingData(res.data.data);
      setQuickForm({ title:"", description:"" });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create meeting");
    } finally { setCreating(false); }
  };

  const afterNote = () => {
    setShowNote(false);
    if (selected) loadMeetingData(selected);
  };

  const afterRec = () => {
    setShowRec(false);
    if (selected) loadMeetingData(selected);
  };

  return (
    <div style={{ background:"var(--bg-base)", minHeight:"100vh" }}>
      <TopBar title="Startup Hub" subtitle="Create meetings and capture notes in one place" />

      <div style={{ maxWidth:1200, padding:"28px 32px", margin:"0 auto" }}>

        {/* Hero banner */}
        <div className="animate-fadeUp" style={{ borderRadius:"var(--radius-lg)", padding:"28px 32px", marginBottom:28, background:"linear-gradient(135deg, #1e1b4b 0%, #0f172a 50%, #0c1a2e 100%)", border:"1px solid #2d2b7a", display:"flex", alignItems:"center", justifyContent:"space-between", gap:24, overflow:"hidden", position:"relative" }}>
          <div style={{ position:"absolute", top:-40, right:120, width:200, height:200, borderRadius:"50%", background:"rgba(99,102,241,0.12)" }} />
          <div style={{ position:"absolute", bottom:-60, right:-20, width:160, height:160, borderRadius:"50%", background:"rgba(8,145,178,0.08)" }} />
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
              <Rocket size={18} color="#818cf8" />
              <span style={{ fontSize:11, fontWeight:700, color:"#818cf8", letterSpacing:"1px", textTransform:"uppercase" }}>Startup Hub</span>
            </div>
            <h2 style={{ fontSize:22, fontWeight:800, color:"#f1f5f9", letterSpacing:"-0.5px", marginBottom:8 }}>Launch your meeting in seconds</h2>
            <p style={{ fontSize:13, color:"#94a3b8", lineHeight:1.6, maxWidth:480 }}>
              Create a meeting, take structured notes on every topic discussed, and record audio — all from one unified workspace. Built for teams that move fast.
            </p>
          </div>
          <Link to="/meetings/new" className="btn btn-xl" style={{ background:"#4f46e5", color:"#fff", flexShrink:0, boxShadow:"0 8px 24px rgba(79,70,229,0.4)" }}>
            <Plus size={18} /> Create Full Meeting
          </Link>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:24 }}>

          {/* LEFT: Quick create + meetings list */}
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

            {/* Quick create card */}
            <div className="card animate-fadeUp delay-1" style={{ padding:24 }}>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:20 }}>
                <div style={{ width:36, height:36, borderRadius:"var(--radius-sm)", background:"var(--accent-soft)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <Zap size={16} color="var(--accent)" />
                </div>
                <div>
                  <div style={{ fontSize:14, fontWeight:700, color:"var(--text-primary)" }}>Quick Start</div>
                  <div style={{ fontSize:11, color:"var(--text-muted)" }}>Create a meeting and start immediately</div>
                </div>
              </div>

              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                <div>
                  <label style={{ fontSize:11, fontWeight:700, color:"var(--text-muted)", display:"block", marginBottom:5, textTransform:"uppercase", letterSpacing:"0.5px" }}>Meeting Title *</label>
                  <input className="input" value={quickForm.title} onChange={e => setQuickForm(f=>({...f,title:e.target.value}))}
                    placeholder="e.g. Daily standup, Client call…"
                    onKeyDown={e => e.key === "Enter" && handleQuickCreate()} />
                </div>
                <div>
                  <label style={{ fontSize:11, fontWeight:700, color:"var(--text-muted)", display:"block", marginBottom:5, textTransform:"uppercase", letterSpacing:"0.5px" }}>Brief Description</label>
                  <input className="input" value={quickForm.description} onChange={e => setQuickForm(f=>({...f,description:e.target.value}))}
                    placeholder="What's this meeting about? (optional)" />
                </div>
                <button className="btn btn-primary btn-lg" onClick={handleQuickCreate} disabled={creating} style={{ width:"100%", justifyContent:"center" }}>
                  {creating ? (<><div style={{ width:15, height:15, border:"2px solid rgba(255,255,255,0.4)", borderTopColor:"#fff", borderRadius:"50%", animation:"spin 0.7s linear infinite" }} />Creating…</>) : (<><Rocket size={15} />Create Meeting & Start</>)}
                </button>
                <div style={{ textAlign:"center" }}>
                  <Link to="/meetings/new" style={{ fontSize:12, color:"var(--accent-text)", textDecoration:"none", fontWeight:500 }}>
                    Want more options? Use full form →
                  </Link>
                </div>
              </div>
            </div>

            {/* Recent meetings */}
            <div className="card animate-fadeUp delay-2" style={{ padding:0, overflow:"hidden" }}>
              <div style={{ padding:"16px 20px", borderBottom:"1px solid var(--border)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <Calendar size={14} color="var(--accent)" />
                  <span style={{ fontSize:13, fontWeight:700, color:"var(--text-primary)" }}>Recent Meetings</span>
                </div>
                <span style={{ fontSize:11, color:"var(--text-muted)" }}>Click to work on</span>
              </div>

              {loading ? (
                <div style={{ padding:32, textAlign:"center" }}>
                  <div style={{ width:28, height:28, border:"3px solid var(--border)", borderTopColor:"var(--accent)", borderRadius:"50%", animation:"spin 0.8s linear infinite", margin:"0 auto" }} />
                </div>
              ) : meetings.length === 0 ? (
                <div style={{ padding:32, textAlign:"center" }}>
                  <Rocket size={32} color="var(--text-muted)" style={{ marginBottom:10 }} />
                  <p style={{ fontSize:13, color:"var(--text-muted)" }}>No meetings yet. Create your first one above!</p>
                </div>
              ) : meetings.map((m, i) => {
                const sc = statusConf[m.status] || statusConf.scheduled;
                const isSelected = selected?._id === m._id;
                return (
                  <div key={m._id} onClick={() => loadMeetingData(m)}
                    style={{ padding:"12px 20px", borderBottom: i < meetings.length-1 ? "1px solid var(--border)" : "none", cursor:"pointer", transition:"background 0.15s",
                      background: isSelected ? "var(--accent-soft)" : "none",
                      borderLeft: isSelected ? "3px solid var(--accent)" : "3px solid transparent" }}
                    onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background="var(--bg-elevated)"; }}
                    onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background="none"; }}>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:13, fontWeight:isSelected?700:500, color: isSelected ? "var(--accent-text)" : "var(--text-primary)", marginBottom:2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{m.title}</div>
                        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                          <Clock size={10} color="var(--text-muted)" />
                          <span style={{ fontSize:11, color:"var(--text-muted)", fontFamily:"JetBrains Mono" }}>{format(new Date(m.createdAt), "MMM d · HH:mm")}</span>
                        </div>
                      </div>
                      <span className="badge" style={{ background:sc.bg, color:sc.color, marginLeft:10, flexShrink:0 }}>{sc.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT: Notes + Recording workspace */}
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
            {!selected ? (
              <div className="card animate-fadeUp delay-2" style={{ padding:40, textAlign:"center", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:400 }}>
                <div style={{ width:64, height:64, borderRadius:"var(--radius)", background:"var(--accent-soft)", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:16 }}>
                  <Target size={28} color="var(--accent)" />
                </div>
                <h3 style={{ fontSize:16, fontWeight:700, color:"var(--text-primary)", marginBottom:8 }}>Select a meeting to get started</h3>
                <p style={{ fontSize:13, color:"var(--text-muted)", lineHeight:1.6, marginBottom:20, maxWidth:280 }}>Create a new meeting or click an existing one from the list to add notes and recordings.</p>
                <div style={{ display:"flex", flexDirection:"column", gap:10, width:"100%", maxWidth:280 }}>
                  <FeatureCard icon={FileText}  title="Structured Notes"     desc="Capture each topic discussed with priority and action items" color="#4f46e5" bg="var(--accent-soft)" />
                  <FeatureCard icon={Mic}        title="Voice Recording"      desc="Record the full session and play it back anytime"            color="#059669" bg="var(--green-soft)" />
                </div>
              </div>
            ) : (
              <>
                {/* Selected meeting header */}
                <div className="card animate-scaleIn" style={{ padding:"16px 20px" }}>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:11, fontWeight:700, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:4 }}>Active Meeting</div>
                      <div style={{ fontSize:15, fontWeight:700, color:"var(--text-primary)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{selected.title}</div>
                      {selected.participants?.length > 0 && (
                        <div style={{ display:"flex", alignItems:"center", gap:4, marginTop:4 }}>
                          <Users size={11} color="var(--text-muted)" />
                          <span style={{ fontSize:11, color:"var(--text-muted)" }}>{selected.participants.join(", ")}</span>
                        </div>
                      )}
                    </div>
                    <Link to={`/meetings/${selected._id}`} className="btn btn-ghost btn-sm" style={{ flexShrink:0 }}>
                      Full View <ArrowRight size={13} />
                    </Link>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="animate-fadeUp" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                  <button onClick={() => setShowNote(true)} className="card card-hover" style={{ padding:"18px", textAlign:"center", cursor:"pointer", border:"1px solid var(--border)", background:"var(--bg-card)", transition:"all 0.2s" }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor="var(--accent)"; e.currentTarget.style.background="var(--accent-soft)"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor="var(--border)"; e.currentTarget.style.background="var(--bg-card)"; }}>
                    <div style={{ width:40, height:40, borderRadius:"var(--radius-sm)", background:"var(--accent-soft)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 10px" }}>
                      <FileText size={18} color="var(--accent)" />
                    </div>
                    <div style={{ fontSize:13, fontWeight:700, color:"var(--text-primary)", marginBottom:3 }}>Create Note</div>
                    <div style={{ fontSize:11, color:"var(--text-muted)" }}>Capture discussion points</div>
                  </button>

                  <button onClick={() => setShowRec(!showRec)} className="card card-hover" style={{ padding:"18px", textAlign:"center", cursor:"pointer", border:`1px solid ${showRec ? "var(--rose)" : "var(--border)"}`, background: showRec ? "var(--rose-soft)" : "var(--bg-card)", transition:"all 0.2s" }}>
                    <div style={{ width:40, height:40, borderRadius:"var(--radius-sm)", background:"var(--rose-soft)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 10px" }}>
                      {showRec ? <PlayCircle size={18} color="var(--rose)" /> : <Mic size={18} color="var(--rose)" />}
                    </div>
                    <div style={{ fontSize:13, fontWeight:700, color:"var(--text-primary)", marginBottom:3 }}>{showRec ? "Recording Panel" : "Start Recording"}</div>
                    <div style={{ fontSize:11, color:"var(--text-muted)" }}>Record meeting audio</div>
                  </button>
                </div>

                {/* Voice recorder */}
                {showRec && (
                  <div className="animate-scaleIn">
                    <VoiceRecorder meetingId={selected._id} onSaved={afterRec} />
                  </div>
                )}

                {/* Notes list */}
                {notes.length > 0 && (
                  <div className="card animate-fadeUp" style={{ padding:0, overflow:"hidden" }}>
                    <div style={{ padding:"12px 16px", borderBottom:"1px solid var(--border)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                        <FileText size={13} color="var(--accent)" />
                        <span style={{ fontSize:12, fontWeight:600, color:"var(--text-primary)" }}>Notes ({notes.length})</span>
                      </div>
                    </div>
                    {notes.slice(0,3).map((n,i) => (
                      <div key={n._id} style={{ padding:"10px 16px", borderBottom: i < Math.min(notes.length,3)-1 ? "1px solid var(--border)" : "none" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                          <span className="badge" style={{ fontSize:10, background: n.priority==="high" ? "var(--rose-soft)" : n.priority==="medium" ? "var(--amber-soft)" : "var(--green-soft)", color: n.priority==="high" ? "var(--rose)" : n.priority==="medium" ? "var(--amber)" : "var(--green)" }}>{n.priority}</span>
                          <span style={{ fontSize:12, fontWeight:600, color:"var(--text-primary)", flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{n.title}</span>
                        </div>
                        {n.topic && <div style={{ fontSize:11, color:"var(--text-muted)", marginTop:2 }}>Topic: {n.topic}</div>}
                      </div>
                    ))}
                    {notes.length > 3 && (
                      <div style={{ padding:"10px 16px", textAlign:"center" }}>
                        <Link to={`/meetings/${selected._id}`} style={{ fontSize:12, color:"var(--accent-text)", textDecoration:"none", fontWeight:500 }}>
                          View all {notes.length} notes →
                        </Link>
                      </div>
                    )}
                  </div>
                )}

                {/* Recordings list */}
                {recordings.length > 0 && (
                  <div className="card animate-fadeUp" style={{ padding:0, overflow:"hidden" }}>
                    <div style={{ padding:"12px 16px", borderBottom:"1px solid var(--border)" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                        <Mic size={13} color="var(--rose)" />
                        <span style={{ fontSize:12, fontWeight:600, color:"var(--text-primary)" }}>Recordings ({recordings.length})</span>
                      </div>
                    </div>
                    {recordings.slice(0,2).map((r,i) => (
                      <div key={r._id} style={{ padding:"10px 16px", borderBottom: i < Math.min(recordings.length,2)-1 ? "1px solid var(--border)" : "none" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                          <Mic size={12} color="var(--rose)" />
                          <span style={{ fontSize:12, fontWeight:500, color:"var(--text-primary)", flex:1 }}>{r.label}</span>
                          <span style={{ fontSize:11, color:"var(--text-muted)", fontFamily:"JetBrains Mono" }}>{r.duration ? `${Math.floor(r.duration/60)}:${String(Math.floor(r.duration%60)).padStart(2,"0")}` : "0:00"}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {notes.length === 0 && recordings.length === 0 && !showRec && (
                  <div className="card animate-fadeUp" style={{ padding:28, textAlign:"center" }}>
                    <Sparkles size={28} color="var(--text-muted)" style={{ marginBottom:10 }} />
                    <p style={{ fontSize:13, color:"var(--text-muted)", lineHeight:1.6 }}>No notes or recordings yet.<br />Use the buttons above to get started.</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {showNote && selected && (
        <CreateNoteModal meetingId={selected._id} onClose={() => setShowNote(false)} onSaved={afterNote} />
      )}
    </div>
  );
}
