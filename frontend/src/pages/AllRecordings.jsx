import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { Mic, Play, Pause, Trash2, Calendar, Search } from "lucide-react";
import { recordingsAPI, meetingsAPI } from "../utils/api";
import { useToast } from "../context/ToastContext";

function fmtDur(s) { 
  if (!s) return "0:00"; 
  const m = Math.floor(s / 60); 
  return `${m}:${Math.floor(s % 60).toString().padStart(2, "0")}`; 
}

function fmtBytes(b) { 
  if (!b) return "—"; 
  const sizes = ["B", "KB", "MB"]; 
  const i = Math.floor(Math.log(b) / Math.log(1024)); 
  return `${parseFloat((b / Math.pow(1024, i)).toFixed(1))} ${sizes[i]}`; 
}

function RecordingRow({ recording, meetingTitle, onDelete }) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef(null);

  // Safely get the URL
  const audioUrl = recording.filename ? recordingsAPI.getUrl(recording.filename) : null;

  const toggle = () => {
    if (!audioRef.current || !audioUrl) {
      console.error("No audio source found for this recording.");
      return;
    }

    if (playing) {
      audioRef.current.pause();
    } else {
      // Wrap play in a promise check to prevent "Uncaught (in promise)" errors
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error("Playback failed: Element has no supported sources or file is missing.", error);
          setPlaying(false);
        });
      }
    }
    setPlaying(!playing);
  };

  return (
    <div className="animate-fade" style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: 20, transition: "border 0.2s" }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--border-accent)")}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}>
      
      {/* Hidden Audio Element with Error Handling */}
      <audio 
        ref={audioRef} 
        src={audioUrl}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => { setPlaying(false); setProgress(0); }}
        onError={(e) => {
          console.error("Audio Load Error:", e);
          setPlaying(false);
        }}
        onTimeUpdate={(e) => setProgress((e.target.currentTime / (e.target.duration || 1)) * 100)} 
      />

      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 10 }}>
        <button onClick={toggle} style={{ width: 44, height: 44, borderRadius: "50%", border: playing ? "1px solid var(--rose)" : "none", cursor: "pointer", flexShrink: 0, background: playing ? "var(--rose-soft)" : "linear-gradient(135deg, var(--rose), #ff3366)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: playing ? "none" : "0 0 16px #ff5e7a40" }}>
          {playing ? <Pause size={17} color="var(--rose)" fill="var(--rose)" /> : <Play size={17} color="#fff" fill="#fff" />}
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{recording.label || "Untitled Recording"}</span>
            <div style={{ display: "flex", gap: 6, flexShrink: 0, marginLeft: 10 }}>
              <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "JetBrains Mono" }}>{fmtDur(recording.duration)}</span>
              <span style={{ fontSize: 11, color: "var(--text-muted)" }}>·</span>
              <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{fmtBytes(recording.fileSize)}</span>
            </div>
          </div>
          <div style={{ height: 4, background: "var(--border)", borderRadius: 99, overflow: "hidden", cursor: "pointer", marginBottom: 6 }}
            onClick={(e) => { 
              if (!audioRef.current || !audioRef.current.duration) return; 
              const rect = e.currentTarget.getBoundingClientRect(); 
              audioRef.current.currentTime = ((e.clientX - rect.left) / rect.width) * audioRef.current.duration; 
            }}>
            <div style={{ height: "100%", background: "linear-gradient(90deg, var(--rose), var(--accent))", width: `${progress}%`, transition: "width 0.1s linear", borderRadius: 99 }} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {meetingTitle && (
              <Link to={`/meetings/${recording.meetingId}`} style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--accent)", textDecoration: "none", fontWeight: 500, padding: "2px 7px", borderRadius: 99, background: "var(--accent-soft)" }}>
                <Calendar size={10} /> {meetingTitle}
              </Link>
            )}
            <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "JetBrains Mono" }}>{format(new Date(recording.createdAt), "MMM d, yyyy · HH:mm")}</span>
          </div>
        </div>
        <button onClick={() => onDelete(recording._id)} style={{ background: "none", border: "none", cursor: "pointer", padding: 8, borderRadius: "var(--radius-xs)", color: "var(--text-muted)", transition: "all 0.2s" }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "var(--rose)"; e.currentTarget.style.background = "var(--rose-soft)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-muted)"; e.currentTarget.style.background = "none"; }}>
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  );
}

export default function AllRecordings() {
  const [recordings, setRecordings] = useState([]);
  const [meetingMap, setMeetingMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const toast = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const meetingsRes = await meetingsAPI.getAll({ limit: 100 });
      const allMeetings = meetingsRes.data.data || [];
      const map = {};
      allMeetings.forEach((m) => (map[m._id] = m.title));
      setMeetingMap(map);
      
      const recResults = await Promise.all(allMeetings.map((m) => 
        recordingsAPI.getByMeeting(m._id)
          .then((r) => r.data.data || [])
          .catch(() => []) // Handle individual meeting fetch failures
      ));
      
      setRecordings(recResults.flat().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    } catch (err) {
      console.error("Failed to load recordings:", err);
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this recording?")) return;
    try { 
      await recordingsAPI.delete(id); 
      toast.success("Recording deleted"); 
      load(); 
    } catch { 
      toast.error("Failed to delete recording"); 
    }
  };

  const totalDur = recordings.reduce((a, r) => a + (r.duration || 0), 0);
  const filtered = recordings.filter((r) => 
    !search.trim() || 
    r.label?.toLowerCase().includes(search.toLowerCase()) || 
    (meetingMap[r.meetingId] || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: "32px 36px", maxWidth: 900 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.4px", marginBottom: 4 }}>All Recordings</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>{recordings.length} recordings · {fmtDur(totalDur)} total audio</p>
      </div>
      <div style={{ position: "relative", marginBottom: 24 }}>
        <Search size={15} color="var(--text-muted)" style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)" }} />
        <input 
          value={search} 
          onChange={(e) => setSearch(e.target.value)} 
          placeholder="Search recordings or meetings…"
          style={{ width: "100%", padding: "10px 14px 10px 38px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-accent)", background: "var(--bg-card)", color: "var(--text-primary)", fontSize: 14, fontFamily: "Syne", outline: "none" }} 
        />
      </div>
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {Array(4).fill(0).map((_, i) => (
            <div key={i} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: 20, height: 80, display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: "50%", background: "var(--bg-elevated)", flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ height: 14, background: "var(--bg-elevated)", borderRadius: 4, marginBottom: 8, width: "60%" }} />
                <div style={{ height: 4, background: "var(--bg-elevated)", borderRadius: 99 }} />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60 }}>
          <Mic size={48} color="var(--text-muted)" style={{ marginBottom: 16 }} />
          <p style={{ color: "var(--text-muted)", fontSize: 16 }}>No recordings found</p>
          <p style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 6 }}>Open a meeting and use the Voice Recorder to capture audio.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.map((rec) => (
            <RecordingRow 
              key={rec._id} 
              recording={rec} 
              meetingTitle={meetingMap[rec.meetingId]} 
              onDelete={handleDelete} 
            />
          ))}
        </div>
      )}
    </div>
  );
}