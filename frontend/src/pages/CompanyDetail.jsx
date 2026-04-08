import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { format, formatDistanceToNow } from "date-fns";
import {
  ArrowLeft, Building2, MapPin, Phone, Mail, Globe,
  FileText, Mic, Clock, Plus, Trash2, Edit3, Pin, PinOff,
  Play, Pause, Volume2, RotateCcw, Upload, Square,
  CheckSquare, Tag, AlertCircle, ChevronDown, ChevronUp,
  TrendingUp, Calendar, Users, Sparkles, BarChart2,
  PlayCircle, StopCircle, Timer, Activity,
} from "lucide-react";
import { companiesAPI, notesAPI, recordingsAPI } from "../utils/api";
import { useToast } from "../context/ToastContext";
import { useVoiceRecorder } from "../hooks/useVoiceRecorder";
import CreateNoteModal from "../components/CreateNoteModal";
import TopBar from "../components/TopBar";

/* ─── Helpers ─── */
function fmtTime(min) {
  if (!min || min === 0) return "0 min";
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60), m = min % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}
function fmtDur(s) {
  if (!s) return "0:00";
  const m = Math.floor(s / 60), sec = Math.floor(s % 60).toString().padStart(2, "0");
  return `${m}:${sec}`;
}
function fmtBytes(b) {
  if (!b) return "";
  const sizes = ["B", "KB", "MB"];
  const i = Math.floor(Math.log(b) / Math.log(1024));
  return `${parseFloat((b / Math.pow(1024, i)).toFixed(1))} ${sizes[i]}`;
}
function fmtTimer(sec) {
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
  if (h > 0) return `${h}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
  return `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
}

const STATUS_CONFIG = {
  active:   { label: "Active",   color: "#059669", bg: "#d1fae5" },
  inactive: { label: "Inactive", color: "#6b7280", bg: "#f3f4f6" },
};
const PRIORITY_CONFIG = {
  high:   { color: "#e11d48", bg: "#ffe4e6" },
  medium: { color: "#d97706", bg: "#fef3c7" },
  low:    { color: "#059669", bg: "#d1fae5" },
};

function CompanyAvatar({ name, color, size = 52 }) {
  const initials = (name || "C").split(/\s+/).map(w => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div style={{ width: size, height: size, borderRadius: Math.floor(size * 0.28), background: `${color}18`, border: `2px solid ${color}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.33, fontWeight: 800, color, flexShrink: 0, letterSpacing: "-0.5px" }}>
      {initials}
    </div>
  );
}

/* ─── Live Session Timer ─── */
function LiveSessionTimer({ sessionStart }) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const tick = () => setElapsed(Math.floor((Date.now() - new Date(sessionStart).getTime()) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [sessionStart]);
  return (
    <span style={{ fontFamily: "JetBrains Mono", fontSize: 22, fontWeight: 700, color: "var(--green)", letterSpacing: "1px" }}>
      {fmtTimer(elapsed)}
    </span>
  );
}

/* ─── Audio Player ─── */
function AudioPlayer({ recording, onDelete }) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const ref = useRef(null);
  const url = recordingsAPI.getUrl(recording.filename);

  const toggle = () => {
    if (!ref.current) return;
    const p = ref.current.play();
    if (p !== undefined) {
      if (playing) { ref.current.pause(); setPlaying(false); }
      else { p.then(() => setPlaying(true)).catch(() => {}); }
    }
  };

  return (
    <div className="animate-fadeUp" style={{ background: "var(--bg-elevated)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", padding: "14px 16px" }}>
      <audio ref={ref} src={url}
        onEnded={() => { setPlaying(false); setProgress(0); setCurrentTime(0); }}
        onTimeUpdate={e => { setProgress((e.target.currentTime / (e.target.duration || 1)) * 100); setCurrentTime(e.target.currentTime); }}
        onError={() => {}} />
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
        <button onClick={toggle} style={{ width: 36, height: 36, borderRadius: "50%", border: "none", cursor: "pointer", background: `linear-gradient(135deg, var(--rose), #ff3366)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 2px 8px rgba(225,29,72,0.3)" }}>
          {playing ? <Pause size={13} color="#fff" fill="#fff" /> : <Play size={13} color="#fff" fill="#fff" />}
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 2 }}>{recording.label}</div>
          <div style={{ display: "flex", gap: 8, fontSize: 11, color: "var(--text-muted)" }}>
            <span style={{ fontFamily: "JetBrains Mono" }}>{fmtDur(currentTime)} / {fmtDur(recording.duration)}</span>
            {recording.fileSize > 0 && <span>· {fmtBytes(recording.fileSize)}</span>}
          </div>
        </div>
        <Volume2 size={13} color="var(--text-muted)" />
        {onDelete && (
          <button onClick={() => onDelete(recording._id)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, borderRadius: "var(--radius-xs)", color: "var(--text-muted)", transition: "all 0.15s" }}
            onMouseEnter={e => { e.currentTarget.style.color = "var(--rose)"; e.currentTarget.style.background = "var(--rose-soft)"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "var(--text-muted)"; e.currentTarget.style.background = "none"; }}>
            <Trash2 size={13} />
          </button>
        )}
      </div>
      <div style={{ height: 4, background: "var(--border)", borderRadius: 99, overflow: "hidden", cursor: "pointer" }}
        onClick={e => { if (!ref.current || !ref.current.duration) return; const rect = e.currentTarget.getBoundingClientRect(); ref.current.currentTime = ((e.clientX - rect.left) / rect.width) * ref.current.duration; }}>
        <div style={{ height: "100%", borderRadius: 99, background: "linear-gradient(90deg, var(--rose), var(--accent))", width: `${progress}%`, transition: "width 0.1s linear" }} />
      </div>
      <div style={{ marginTop: 6, fontSize: 11, color: "var(--text-muted)", fontFamily: "JetBrains Mono" }}>
        {format(new Date(recording.createdAt), "MMM d, yyyy · HH:mm:ss")}
      </div>
    </div>
  );
}

/* ─── Compact Note Card ─── */
function NoteCard({ note, onDelete, onPin }) {
  const [expanded, setExpanded] = useState(false);
  const pc = PRIORITY_CONFIG[note.priority] || PRIORITY_CONFIG.medium;
  const doneCount = (note.actionItems || []).filter(a => a.done).length;
  const totalActions = (note.actionItems || []).length;

  return (
    <div className="animate-fadeUp" style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", borderLeft: `3px solid ${pc.color}`, transition: "all 0.2s", ...(note.isPinned ? { boxShadow: "0 0 0 1px var(--amber-soft)" } : {}) }}>
      <div style={{ padding: "14px 16px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 8 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
              {note.isPinned && <Pin size={11} color="var(--amber)" fill="var(--amber)" />}
              <h4 style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{note.title}</h4>
            </div>
            {note.topic && (
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <Tag size={10} color="var(--accent)" />
                <span style={{ fontSize: 11, color: "var(--accent-text)", fontWeight: 500 }}>{note.topic}</span>
              </div>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
            <span className="badge" style={{ background: pc.bg, color: pc.color, fontSize: 10 }}>{note.priority}</span>
            <button onClick={() => setExpanded(!expanded)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 2 }}>
              {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
          </div>
        </div>

        <p style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.65, display: "-webkit-box", WebkitLineClamp: expanded ? 999 : 2, WebkitBoxOrient: "vertical", overflow: "hidden", marginBottom: totalActions > 0 ? 10 : 0 }}>
          {note.content}
        </p>

        {totalActions > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 8px", background: "var(--bg-elevated)", borderRadius: "var(--radius-xs)", border: "1px solid var(--border)", marginBottom: 0 }}>
            <CheckSquare size={11} color="var(--teal)" />
            <div style={{ flex: 1, height: 3, background: "var(--border)", borderRadius: 99, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${(doneCount / totalActions) * 100}%`, background: "var(--teal)", borderRadius: 99, transition: "width 0.4s" }} />
            </div>
            <span style={{ fontSize: 10, color: "var(--text-secondary)", fontWeight: 600 }}>{doneCount}/{totalActions}</span>
          </div>
        )}

        {expanded && note.actionItems?.length > 0 && (
          <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 4 }}>
            {note.actionItems.map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, color: item.done ? "var(--text-muted)" : "var(--text-secondary)", textDecoration: item.done ? "line-through" : "none" }}>
                <div style={{ width: 14, height: 14, borderRadius: 3, border: `1.5px solid ${item.done ? "var(--teal)" : "var(--border-accent)"}`, background: item.done ? "var(--teal)" : "none", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {item.done && <span style={{ color: "#fff", fontSize: 9, fontWeight: 800 }}>✓</span>}
                </div>
                {item.text}
                {item.assignee && <span style={{ fontSize: 10, color: "var(--text-muted)", marginLeft: "auto" }}>@{item.assignee}</span>}
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ padding: "8px 16px", borderTop: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "JetBrains Mono" }}>{format(new Date(note.createdAt), "MMM d, yyyy · HH:mm")}</span>
        <div style={{ display: "flex", gap: 2 }}>
          {onPin && (
            <button onClick={() => onPin(note._id)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, borderRadius: "var(--radius-xs)", color: note.isPinned ? "var(--amber)" : "var(--text-muted)", transition: "all 0.15s" }}
              onMouseEnter={e => { e.currentTarget.style.color = "var(--amber)"; e.currentTarget.style.background = "var(--amber-soft)"; }}
              onMouseLeave={e => { e.currentTarget.style.color = note.isPinned ? "var(--amber)" : "var(--text-muted)"; e.currentTarget.style.background = "none"; }}>
              {note.isPinned ? <PinOff size={12} /> : <Pin size={12} />}
            </button>
          )}
          {onDelete && (
            <button onClick={() => onDelete(note._id)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, borderRadius: "var(--radius-xs)", color: "var(--text-muted)", transition: "all 0.15s" }}
              onMouseEnter={e => { e.currentTarget.style.color = "var(--rose)"; e.currentTarget.style.background = "var(--rose-soft)"; }}
              onMouseLeave={e => { e.currentTarget.style.color = "var(--text-muted)"; e.currentTarget.style.background = "none"; }}>
              <Trash2 size={12} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Inline Voice Recorder ─── */
function VoiceRecorderPanel({ companyId, onSaved }) {
  const { isRecording, isPaused, duration, audioBlob, error, startRecording, pauseRecording, resumeRecording, stopRecording, resetRecording } = useVoiceRecorder();
  const [label, setLabel]         = useState("");
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved]         = useState(false);

  const handleSave = async () => {
    if (!audioBlob || !companyId) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("audio", audioBlob, `recording_${Date.now()}.webm`);
      fd.append("companyId", companyId);
      fd.append("duration", duration);
      fd.append("label", label || `Recording ${new Date().toLocaleTimeString()}`);
      await recordingsAPI.upload(fd);
      setSaved(true);
      setTimeout(() => { setSaved(false); resetRecording(); setLabel(""); onSaved?.(); }, 1500);
    } catch { } finally { setUploading(false); }
  };

  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <div style={{ width: 32, height: 32, borderRadius: "var(--radius-sm)", background: "var(--rose-soft)", border: "1px solid var(--rose)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Mic size={14} color="var(--rose)" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>Voice Recorder</div>
          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Capture meeting audio</div>
        </div>
        {isRecording && (
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: isPaused ? "var(--amber)" : "var(--rose)", animation: isPaused ? "none" : "blink 1s infinite" }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: isPaused ? "var(--amber)" : "var(--rose)", fontFamily: "JetBrains Mono" }}>{isPaused ? "PAUSED" : "REC"}</span>
          </div>
        )}
      </div>

      {error && (
        <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 12px", borderRadius: "var(--radius-xs)", background: "var(--rose-soft)", border: "1px solid var(--rose)", marginBottom: 12, fontSize: 12, color: "var(--rose)" }}>
          <AlertCircle size={13} />{error}
        </div>
      )}

      {/* Waveform */}
      <div style={{ height: 60, borderRadius: "var(--radius-sm)", background: "var(--bg-elevated)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", gap: 3, marginBottom: 14, overflow: "hidden" }}>
        {isRecording && !isPaused
          ? Array.from({ length: 22 }).map((_, i) => (
              <div key={i} style={{ width: 3, borderRadius: 99, background: "linear-gradient(to top, var(--rose), var(--accent))", height: "40%", animation: `wave ${0.6 + (i % 5) * 0.13}s ease-in-out infinite`, animationDelay: `${i * 0.07}s` }} />
            ))
          : audioBlob
            ? <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--green)", fontWeight: 600 }}><div style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--green)" }} />Ready · {fmtDur(duration)}</div>
            : <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{isPaused ? "⏸ Paused" : "Press record to begin"}</div>
        }
      </div>

      {/* Timer */}
      <div style={{ textAlign: "center", marginBottom: 14 }}>
        <span style={{ fontFamily: "JetBrains Mono", fontSize: 26, fontWeight: 600, letterSpacing: 2, color: isRecording ? "var(--rose)" : "var(--text-muted)" }}>{fmtDur(duration)}</span>
      </div>

      {/* Controls */}
      <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 14 }}>
        {!isRecording && !audioBlob && (
          <button onClick={startRecording} className="btn btn-primary" style={{ width: "100%", justifyContent: "center", background: "linear-gradient(135deg, var(--rose), #ff3366)", boxShadow: "0 4px 12px rgba(225,29,72,0.3)" }}>
            <Mic size={15} /> Start Recording
          </button>
        )}
        {isRecording && !isPaused && (<>
          <button onClick={pauseRecording} className="btn btn-sm" style={{ flex: 1, justifyContent: "center", background: "var(--amber-soft)", color: "var(--amber)", border: "1px solid var(--amber)" }}><Pause size={13} /> Pause</button>
          <button onClick={stopRecording} className="btn btn-secondary btn-sm" style={{ flex: 1, justifyContent: "center" }}><Square size={13} /> Stop</button>
        </>)}
        {isRecording && isPaused && (<>
          <button onClick={resumeRecording} className="btn btn-sm" style={{ flex: 1, justifyContent: "center", background: "var(--green-soft)", color: "var(--green)", border: "1px solid var(--green)" }}><Play size={13} /> Resume</button>
          <button onClick={stopRecording} className="btn btn-secondary btn-sm" style={{ flex: 1, justifyContent: "center" }}><Square size={13} /> Stop</button>
        </>)}
      </div>

      {/* Save panel */}
      {audioBlob && !isRecording && (
        <div style={{ borderTop: "1px solid var(--border)", paddingTop: 14 }}>
          <audio controls src={URL.createObjectURL(audioBlob)} style={{ width: "100%", borderRadius: 6, marginBottom: 10, height: 36 }} />
          <input className="input" value={label} onChange={e => setLabel(e.target.value)} placeholder="Label this recording…" style={{ marginBottom: 10, fontSize: 12 }} />
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={resetRecording} className="btn btn-secondary btn-sm" style={{ flex: 0 }}><RotateCcw size={12} /> Discard</button>
            <button onClick={handleSave} disabled={uploading || saved} className="btn btn-sm" style={{ flex: 1, justifyContent: "center", background: saved ? "var(--green-soft)" : "linear-gradient(135deg, var(--accent), var(--teal))", color: saved ? "var(--green)" : "#fff", border: "none", boxShadow: saved ? "none" : "0 2px 8px var(--accent-glow)" }}>
              <Upload size={12} />{uploading ? "Saving…" : saved ? "Saved!" : "Save Recording"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Time Tracking Card ─── */
function TimeTracker({ company, onSessionUpdate }) {
  const toast = useToast();
  const [working, setWorking] = useState(false);
  const [activeSession, setActiveSession] = useState(null);
  const [stopping, setStopping] = useState(false);

  useEffect(() => {
    if (!company) return;
    const openSession = company.sessions?.find(s => s.startedAt && !s.endedAt);
    if (openSession) { setActiveSession(openSession); setWorking(true); }
    else { setActiveSession(null); setWorking(false); }
  }, [company]);

  const handleStart = async () => {
    try {
      const res = await companiesAPI.startSession(company._id, "Work session");
      const sessions = res.data.data.sessions;
      const open = sessions?.find(s => !s.endedAt);
      setActiveSession(open);
      setWorking(true);
      toast.success("Session started. Time is now being tracked.");
      onSessionUpdate(res.data.data);
    } catch { toast.error("Failed to start session."); }
  };

  const handleStop = async () => {
    if (!activeSession) return;
    setStopping(true);
    try {
      const res = await companiesAPI.endSession(company._id, activeSession._id);
      setWorking(false); setActiveSession(null);
      toast.success("Session recorded successfully.");
      onSessionUpdate(res.data.data);
    } catch { toast.error("Failed to end session."); }
    finally { setStopping(false); }
  };

  const totalMins = company?.totalMinutes || 0;
  const sessions  = company?.sessions || [];
  const completedSessions = sessions.filter(s => s.endedAt);

  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius)", overflow: "hidden" }}>
      <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 8 }}>
        <Timer size={15} color="var(--teal)" />
        <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>Time Tracking</span>
      </div>

      <div style={{ padding: 20 }}>
        {/* Total */}
        <div style={{ textAlign: "center", padding: "20px 0", borderBottom: "1px solid var(--border)", marginBottom: 16 }}>
          <div style={{ fontSize: 36, fontWeight: 900, color: "var(--accent)", letterSpacing: "-1px", lineHeight: 1, marginBottom: 4 }}>
            {fmtTime(totalMins)}
          </div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 500 }}>Total time invested</div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{completedSessions.length} completed sessions</div>
        </div>

        {/* Live timer */}
        {working && activeSession ? (
          <div style={{ textAlign: "center", padding: "16px", background: "var(--green-soft)", borderRadius: "var(--radius-sm)", border: "1px solid var(--green)", marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--green)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.5px" }}>🟢 Session Active</div>
            <LiveSessionTimer sessionStart={activeSession.startedAt} />
            <div style={{ fontSize: 11, color: "var(--green)", marginTop: 4, opacity: 0.8 }}>
              Started {format(new Date(activeSession.startedAt), "HH:mm")}
            </div>
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "12px", background: "var(--bg-elevated)", borderRadius: "var(--radius-sm)", marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>No active session</div>
          </div>
        )}

        {/* Button */}
        {working ? (
          <button onClick={handleStop} disabled={stopping} className="btn btn-danger" style={{ width: "100%", justifyContent: "center" }}>
            <StopCircle size={15} />{stopping ? "Saving…" : "End Session"}
          </button>
        ) : (
          <button onClick={handleStart} className="btn btn-primary" style={{ width: "100%", justifyContent: "center", background: "linear-gradient(135deg, var(--green), var(--teal))", boxShadow: "0 4px 12px rgba(5,150,105,0.25)" }}>
            <PlayCircle size={15} /> Start Session
          </button>
        )}

        {/* Recent sessions */}
        {completedSessions.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>Recent Sessions</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {completedSessions.slice(-4).reverse().map((s, i) => (
                <div key={s._id || i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "7px 10px", background: "var(--bg-elevated)", borderRadius: "var(--radius-xs)", border: "1px solid var(--border)" }}>
                  <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>
                    {s.startedAt ? format(new Date(s.startedAt), "MMM d · HH:mm") : "—"}
                  </div>
                  <span className="badge" style={{ background: "var(--teal-soft)", color: "var(--teal)", fontSize: 10 }}>
                    {fmtTime(s.durationMinutes)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── MAIN PAGE ─── */
export default function CompanyDetail() {
  const { id }          = useParams();
  const toast           = useToast();
  const [company, setCompany]       = useState(null);
  const [notes, setNotes]           = useState([]);
  const [recordings, setRecordings] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [activeTab, setActiveTab]   = useState("notes");
  const [showNoteModal, setNoteModal] = useState(false);
  const [editNote, setEditNote]     = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    companiesAPI.getById(id)
      .then(r => {
        setCompany(r.data.data.company);
        setNotes(r.data.data.notes || []);
        setRecordings(r.data.data.recordings || []);
      })
      .catch(() => toast.error("Failed to load company."))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const handleDeleteNote = async nid => {
    if (!window.confirm("Delete this note?")) return;
    try { await notesAPI.delete(nid); toast.success("Note deleted."); load(); }
    catch { toast.error("Could not delete note."); }
  };

  const handlePinNote = async nid => {
    try { await notesAPI.togglePin(nid); load(); }
    catch { toast.error("Could not pin note."); }
  };

  const handleDeleteRecording = async rid => {
    if (!window.confirm("Delete this recording?")) return;
    try { await recordingsAPI.delete(rid); toast.success("Recording deleted."); load(); }
    catch { toast.error("Could not delete recording."); }
  };

  const handleSessionUpdate = updatedCompany => setCompany(updatedCompany);

  if (loading) return (
    <div style={{ background: "var(--bg-base)", minHeight: "100vh" }}>
      <div style={{ height: "var(--header-height)", background: "var(--bg-surface)", borderBottom: "1px solid var(--border)" }} />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 36, height: 36, border: "3px solid var(--border)", borderTopColor: "var(--accent)", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
          <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Loading company workspace…</div>
        </div>
      </div>
    </div>
  );

  if (!company) return (
    <div style={{ background: "var(--bg-base)", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <Building2 size={48} color="var(--text-muted)" style={{ marginBottom: 16 }} />
        <h3 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>Company not found</h3>
        <Link to="/startup/companies" className="btn btn-primary btn-sm">Back to Companies</Link>
      </div>
    </div>
  );

  const sc = STATUS_CONFIG[company.status] || STATUS_CONFIG.active;
  const totalMins = company.totalMinutes || 0;

  const tabs = [
    { id: "notes",      label: "Notes",      count: notes.length,      icon: FileText },
    { id: "recordings", label: "Recordings", count: recordings.length, icon: Mic      },
  ];

  return (
    <div style={{ background: "var(--bg-base)", minHeight: "100vh" }}>
      <TopBar
        title={company.name}
        subtitle={[company.industry, company.location].filter(Boolean).join(" · ") || "Company Workspace"}
      />

      <div style={{ padding: "24px 32px", maxWidth: 1280 }}>

        {/* Back */}
        <Link to="/startup/companies" className="btn btn-ghost btn-sm animate-fadeUp" style={{ marginBottom: 20, display: "inline-flex" }}>
          <ArrowLeft size={13} /> Back to Companies
        </Link>

        {/* ── Company Header Card ── */}
        <div className="card animate-fadeUp" style={{ padding: 0, overflow: "hidden", marginBottom: 20 }}>
          {/* Color bar */}
          <div style={{ height: 4, background: `linear-gradient(90deg, ${company.color || "var(--accent)"}, var(--teal))` }} />

          <div style={{ padding: "24px 28px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 20, flexWrap: "wrap" }}>

              {/* Left: identity */}
              <div style={{ display: "flex", alignItems: "flex-start", gap: 18 }}>
                <CompanyAvatar name={company.name} color={company.color || "#4f46e5"} size={60} />
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                    <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.4px", lineHeight: 1 }}>{company.name}</h1>
                    <span className="badge" style={{ background: sc.bg, color: sc.color }}>{sc.label}</span>
                  </div>
                  {company.industry && <div style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 500, marginBottom: 10 }}>{company.industry}</div>}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
                    {company.location && (
                      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <MapPin size={12} color="var(--text-muted)" />
                        <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{company.location}</span>
                      </div>
                    )}
                    {company.phone && (
                      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <Phone size={12} color="var(--text-muted)" />
                        <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{company.phone}</span>
                      </div>
                    )}
                    {company.email && (
                      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <Mail size={12} color="var(--text-muted)" />
                        <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{company.email}</span>
                      </div>
                    )}
                    {company.website && (
                      <a href={company.website} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: 5, textDecoration: "none" }}>
                        <Globe size={12} color="var(--accent)" />
                        <span style={{ fontSize: 12, color: "var(--accent-text)" }}>{company.website.replace(/^https?:\/\//, "")}</span>
                      </a>
                    )}
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <Calendar size={12} color="var(--text-muted)" />
                      <span style={{ fontSize: 12, color: "var(--text-secondary)", fontFamily: "JetBrains Mono" }}>
                        Added {format(new Date(company.createdAt), "MMM d, yyyy")}
                      </span>
                    </div>
                  </div>
                  {company.description && (
                    <p style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.65, marginTop: 10, maxWidth: 520 }}>{company.description}</p>
                  )}
                </div>
              </div>

              {/* Right: KPIs */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, flexShrink: 0 }}>
                {[
                  { label: "Time Invested", value: fmtTime(totalMins), icon: Clock, color: "var(--teal)", bg: "var(--teal-soft)" },
                  { label: "Notes Created", value: notes.length, icon: FileText, color: "var(--amber)", bg: "var(--amber-soft)" },
                  { label: "Recordings",    value: recordings.length, icon: Mic, color: "var(--rose)", bg: "var(--rose-soft)" },
                ].map(({ label, value, icon: Icon, color, bg }) => (
                  <div key={label} style={{ padding: "14px 16px", background: "var(--bg-elevated)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", textAlign: "center", minWidth: 90 }}>
                    <div style={{ width: 32, height: 32, borderRadius: "var(--radius-xs)", background: bg, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px" }}>
                      <Icon size={14} color={color} />
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)", lineHeight: 1, marginBottom: 3 }}>{value}</div>
                    <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 500 }}>{label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Action Buttons ── */}
        <div className="animate-fadeUp delay-1" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, marginBottom: 24 }}>
          <button onClick={() => { setEditNote(null); setNoteModal(true); }} className="btn btn-lg" style={{ justifyContent: "center", background: "var(--accent-soft)", color: "var(--accent-text)", border: "1px solid var(--accent-glow)", padding: "14px" }}>
            <FileText size={17} />
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>Create Note</div>
              <div style={{ fontSize: 11, color: "var(--accent-text)", opacity: 0.75, fontWeight: 400 }}>Capture discussion points and action items</div>
            </div>
          </button>
          <button onClick={() => setActiveTab("recordings")} className="btn btn-lg" style={{ justifyContent: "center", background: "var(--rose-soft)", color: "var(--rose)", border: "1px solid rgba(225,29,72,0.2)", padding: "14px" }}>
            <Mic size={17} />
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>Record Audio</div>
              <div style={{ fontSize: 11, color: "var(--rose)", opacity: 0.75, fontWeight: 400 }}>Record meeting audio and play it back anytime</div>
            </div>
          </button>
        </div>

        {/* ── Main layout ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20, alignItems: "start" }}>

          {/* LEFT — Tabs */}
          <div>
            {/* Tab bar */}
            <div style={{ display: "flex", gap: 4, background: "var(--bg-card)", padding: 4, borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", marginBottom: 16 }}>
              {tabs.map(({ id: tid, label, count, icon: Icon }) => (
                <button key={tid} onClick={() => setActiveTab(tid)} style={{
                  flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                  padding: "9px", borderRadius: "var(--radius-xs)", border: "none", cursor: "pointer",
                  background: activeTab === tid ? "var(--bg-elevated)" : "none",
                  color: activeTab === tid ? "var(--text-primary)" : "var(--text-muted)",
                  fontFamily: "Inter, sans-serif", fontWeight: activeTab === tid ? 700 : 400, fontSize: 13,
                  transition: "all 0.15s",
                }}>
                  <Icon size={13} />
                  {label}
                  <span style={{ padding: "1px 6px", borderRadius: 99, fontSize: 11, fontWeight: 700, background: activeTab === tid ? "var(--accent-soft)" : "var(--bg-elevated)", color: activeTab === tid ? "var(--accent-text)" : "var(--text-muted)" }}>{count}</span>
                </button>
              ))}
            </div>

            {/* Notes */}
            {activeTab === "notes" && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
                    {notes.length === 0 ? "No notes yet" : `${notes.length} note${notes.length !== 1 ? "s" : ""} recorded`}
                  </div>
                  <button onClick={() => { setEditNote(null); setNoteModal(true); }} className="btn btn-primary btn-sm">
                    <Plus size={13} /> Add Note
                  </button>
                </div>

                {notes.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "56px 40px", background: "var(--bg-card)", borderRadius: "var(--radius)", border: "1px dashed var(--border-accent)" }}>
                    <div style={{ width: 52, height: 52, borderRadius: "var(--radius-sm)", background: "var(--accent-soft)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
                      <FileText size={22} color="var(--accent)" />
                    </div>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>No notes yet</h3>
                    <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6, marginBottom: 20, maxWidth: 300, margin: "0 auto 20px" }}>
                      Start capturing discussion points, decisions, and action items from your meetings with {company.name}.
                    </p>
                    <button onClick={() => setNoteModal(true)} className="btn btn-primary btn-sm">
                      <Plus size={13} /> Create First Note
                    </button>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {notes.map(n => (
                      <NoteCard key={n._id} note={n} onDelete={handleDeleteNote} onPin={handlePinNote} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Recordings */}
            {activeTab === "recordings" && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
                    {recordings.length === 0 ? "No recordings yet" : `${recordings.length} recording${recordings.length !== 1 ? "s" : ""} saved`}
                  </div>
                </div>

                {recordings.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "56px 40px", background: "var(--bg-card)", borderRadius: "var(--radius)", border: "1px dashed var(--border-accent)" }}>
                    <div style={{ width: 52, height: 52, borderRadius: "var(--radius-sm)", background: "var(--rose-soft)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
                      <Mic size={22} color="var(--rose)" />
                    </div>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>No recordings yet</h3>
                    <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6, maxWidth: 300, margin: "0 auto" }}>
                      Use the Voice Recorder panel on the right to capture audio from your meetings with {company.name}.
                    </p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {recordings.map(r => (
                      <AudioPlayer key={r._id} recording={r} onDelete={handleDeleteRecording} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* RIGHT — Sticky panels */}
          <div style={{ position: "sticky", top: 24, display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Time tracker */}
            <TimeTracker company={company} onSessionUpdate={handleSessionUpdate} />

            {/* Voice recorder */}
            <VoiceRecorderPanel companyId={id} onSaved={() => { load(); setActiveTab("recordings"); }} />
          </div>
        </div>
      </div>

      {showNoteModal && (
        <CreateNoteModal
          companyId={id}
          note={editNote}
          onClose={() => { setNoteModal(false); setEditNote(null); }}
          onSaved={() => { setNoteModal(false); setEditNote(null); load(); }}
        />
      )}
    </div>
  );
}
