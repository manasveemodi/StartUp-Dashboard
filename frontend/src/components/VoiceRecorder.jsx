import React, { useState, useRef } from "react";
import { Mic, Square, Pause, Play, Upload, RotateCcw, AlertCircle } from "lucide-react";
import { useVoiceRecorder } from "../hooks/useVoiceRecorder";
import { recordingsAPI } from "../utils/api";

function formatTime(s) {
  const m = Math.floor(s / 60).toString().padStart(2, "0");
  const sec = (s % 60).toString().padStart(2, "0");
  return `${m}:${sec}`;
}

export default function VoiceRecorder({ meetingId, onSaved }) {
  const { isRecording, isPaused, duration, audioBlob, error, startRecording, pauseRecording, resumeRecording, stopRecording, resetRecording } = useVoiceRecorder();
  const [label, setLabel] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    if (!audioBlob || !meetingId) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("audio", audioBlob, `recording_${Date.now()}.webm`);
      fd.append("meetingId", meetingId);
      fd.append("duration", duration);
      fd.append("label", label || `Recording ${new Date().toLocaleTimeString()}`);
      await recordingsAPI.upload(fd);
      setSaved(true);
      setTimeout(() => { setSaved(false); resetRecording(); setLabel(""); onSaved?.(); }, 1500);
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{
      background: "var(--bg-card)", border: "1px solid var(--border)",
      borderRadius: "var(--radius)", padding: 24,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <Mic size={18} color="var(--rose)" />
        <h3 style={{ fontSize: 16, fontWeight: 700 }}>Voice Recorder</h3>
      </div>

      {error && (
        <div style={{
          display: "flex", alignItems: "center", gap: 8, padding: "10px 14px",
          borderRadius: "var(--radius-sm)", background: "var(--rose-soft)",
          border: "1px solid var(--rose)", marginBottom: 16, fontSize: 13, color: "var(--rose)"
        }}>
          <AlertCircle size={15} /> {error}
        </div>
      )}

      {/* Visualizer */}
      <div style={{
        height: 72, borderRadius: "var(--radius-sm)", background: "var(--bg-elevated)",
        border: "1px solid var(--border)", display: "flex", alignItems: "center",
        justifyContent: "center", gap: 3, marginBottom: 20, overflow: "hidden"
      }}>
        {isRecording && !isPaused ? (
          Array.from({ length: 28 }).map((_, i) => (
            <div key={i} style={{
              width: 3, borderRadius: 99,
              background: `linear-gradient(to top, var(--rose), var(--accent))`,
              height: "40%",
              animation: `wave ${0.6 + (i % 5) * 0.12}s ease-in-out infinite`,
              animationDelay: `${i * 0.06}s`,
            }} />
          ))
        ) : audioBlob ? (
          <div style={{ fontSize: 13, color: "var(--green)", display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--green)" }} />
            Recording ready — {formatTime(duration)}
          </div>
        ) : (
          <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
            {isPaused ? "⏸ Paused" : "Press record to start"}
          </div>
        )}
      </div>

      {/* Timer */}
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <span style={{
          fontFamily: "JetBrains Mono", fontSize: 32, fontWeight: 500,
          color: isRecording ? "var(--rose)" : "var(--text-muted)",
          letterSpacing: 2,
        }}>{formatTime(duration)}</span>
        {isRecording && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 6 }}>
            <div style={{
              width: 8, height: 8, borderRadius: "50%",
              background: isPaused ? "var(--amber)" : "var(--rose)",
              animation: isPaused ? "none" : "blink 1s infinite",
            }} />
            <span style={{ fontSize: 12, color: isPaused ? "var(--amber)" : "var(--rose)", fontWeight: 500 }}>
              {isPaused ? "PAUSED" : "RECORDING"}
            </span>
          </div>
        )}
      </div>

      {/* Controls */}
      <div style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 20 }}>
        {!isRecording && !audioBlob && (
          <button onClick={startRecording} style={{
            display: "flex", alignItems: "center", gap: 8, padding: "12px 24px",
            borderRadius: 99, border: "none", cursor: "pointer", fontFamily: "Syne",
            fontWeight: 700, fontSize: 14,
            background: "linear-gradient(135deg, var(--rose), #ff3366)",
            color: "#fff", boxShadow: "0 0 24px #ff5e7a50",
          }}>
            <Mic size={16} /> Start Recording
          </button>
        )}

        {isRecording && !isPaused && (
          <>
            <button onClick={pauseRecording} style={{
              display: "flex", alignItems: "center", gap: 6, padding: "10px 18px",
              borderRadius: 99, border: "1px solid var(--amber)", cursor: "pointer",
              background: "var(--amber-soft)", color: "var(--amber)", fontFamily: "Syne", fontWeight: 600, fontSize: 13,
            }}>
              <Pause size={15} /> Pause
            </button>
            <button onClick={stopRecording} style={{
              display: "flex", alignItems: "center", gap: 6, padding: "10px 18px",
              borderRadius: 99, border: "none", cursor: "pointer",
              background: "var(--bg-elevated)", color: "var(--text-secondary)", fontFamily: "Syne", fontWeight: 600, fontSize: 13,
            }}>
              <Square size={15} /> Stop
            </button>
          </>
        )}

        {isRecording && isPaused && (
          <>
            <button onClick={resumeRecording} style={{
              display: "flex", alignItems: "center", gap: 6, padding: "10px 18px",
              borderRadius: 99, border: "1px solid var(--green)", cursor: "pointer",
              background: "var(--green-soft)", color: "var(--green)", fontFamily: "Syne", fontWeight: 600, fontSize: 13,
            }}>
              <Play size={15} /> Resume
            </button>
            <button onClick={stopRecording} style={{
              display: "flex", alignItems: "center", gap: 6, padding: "10px 18px",
              borderRadius: 99, border: "none", cursor: "pointer",
              background: "var(--bg-elevated)", color: "var(--text-secondary)", fontFamily: "Syne", fontWeight: 600, fontSize: 13,
            }}>
              <Square size={15} /> Stop
            </button>
          </>
        )}
      </div>

      {/* Save panel */}
      {audioBlob && !isRecording && (
        <div className="animate-fade" style={{ borderTop: "1px solid var(--border)", paddingTop: 16 }}>
          <audio controls src={URL.createObjectURL(audioBlob)} style={{ width: "100%", marginBottom: 12, borderRadius: 8 }} />
          <input
            type="text" value={label} onChange={(e) => setLabel(e.target.value)}
            placeholder="Label this recording (optional)…"
            style={{
              width: "100%", padding: "10px 14px", borderRadius: "var(--radius-sm)",
              border: "1px solid var(--border-accent)", background: "var(--bg-elevated)",
              color: "var(--text-primary)", fontSize: 13, fontFamily: "Syne",
              outline: "none", marginBottom: 12,
            }}
          />
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={resetRecording} style={{
              flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              padding: "10px", borderRadius: "var(--radius-sm)",
              border: "1px solid var(--border-accent)", background: "none",
              color: "var(--text-muted)", cursor: "pointer", fontFamily: "Syne", fontSize: 13,
            }}>
              <RotateCcw size={14} /> Discard
            </button>
            <button onClick={handleSave} disabled={uploading || saved} style={{
              flex: 2, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              padding: "10px", borderRadius: "var(--radius-sm)", border: "none",
              background: saved ? "var(--green-soft)" : "linear-gradient(135deg, var(--accent), var(--teal))",
              color: saved ? "var(--green)" : "#fff",
              cursor: uploading ? "wait" : "pointer", fontFamily: "Syne", fontWeight: 700, fontSize: 13,
            }}>
              <Upload size={14} /> {uploading ? "Saving…" : saved ? "Saved!" : "Save Recording"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
