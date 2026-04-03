import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FileText, Search, Filter, Calendar, Pin } from "lucide-react";
import { notesAPI, meetingsAPI } from "../utils/api";
import { useToast } from "../context/ToastContext";
import NoteCard from "../components/NoteCard";
import { NoteCardSkeleton } from "../components/Skeleton";

export default function AllNotes() {
  const [notes, setNotes]     = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");
  const [priority, setPriority] = useState("all");
  const [pinned, setPinned]   = useState(false);
  const toast = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const meetingsRes = await meetingsAPI.getAll({ limit: 100 });
      const allMeetings = meetingsRes.data.data || [];
      setMeetings(allMeetings);
      const map = {};
      allMeetings.forEach((m) => (map[m._id] = m.title));

      const noteResults = await Promise.all(
        allMeetings.map((m) => notesAPI.getByMeeting(m._id, { limit: 100 }).then((r) => (r.data.data || []).map((n) => ({ ...n, meetingTitle: map[n.meetingId] || "Unknown" }))))
      );
      const all = noteResults.flat().sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
      setNotes(all);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this note?")) return;
    try { await notesAPI.delete(id); toast.success("Note deleted"); load(); }
    catch { toast.error("Failed to delete note"); }
  };

  const handlePin = async (id) => {
    try { await notesAPI.togglePin(id); load(); }
    catch { toast.error("Failed to pin note"); }
  };

  const filtered = notes.filter((n) => {
    const matchSearch = !search.trim() ||
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.content.toLowerCase().includes(search.toLowerCase()) ||
      (n.topic || "").toLowerCase().includes(search.toLowerCase());
    const matchPriority = priority === "all" || n.priority === priority;
    const matchPinned = !pinned || n.isPinned;
    return matchSearch && matchPriority && matchPinned;
  });

  return (
    <div style={{ padding: "32px 36px", maxWidth: 1200 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.4px", marginBottom: 4 }}>All Notes</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>{notes.length} notes across {meetings.length} meetings</p>
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 220, position: "relative" }}>
          <Search size={15} color="var(--text-muted)" style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)" }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search notes, topics, content…"
            style={{ width: "100%", padding: "10px 14px 10px 38px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-accent)", background: "var(--bg-card)", color: "var(--text-primary)", fontSize: 14, fontFamily: "Syne", outline: "none" }} />
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
          <Filter size={13} color="var(--text-muted)" />
          {["all", "high", "medium", "low"].map((p) => (
            <button key={p} onClick={() => setPriority(p)} style={{ padding: "9px 13px", borderRadius: "var(--radius-sm)", fontSize: 12, border: priority === p ? "1px solid var(--accent)" : "1px solid var(--border)", background: priority === p ? "var(--accent-soft)" : "var(--bg-card)", color: priority === p ? "var(--accent)" : "var(--text-secondary)", cursor: "pointer", fontFamily: "Syne", textTransform: "capitalize" }}>{p}</button>
          ))}
          <button onClick={() => setPinned(!pinned)} style={{ display: "flex", alignItems: "center", gap: 5, padding: "9px 13px", borderRadius: "var(--radius-sm)", fontSize: 12, border: pinned ? "1px solid var(--amber)" : "1px solid var(--border)", background: pinned ? "var(--amber-soft)" : "var(--bg-card)", color: pinned ? "var(--amber)" : "var(--text-secondary)", cursor: "pointer", fontFamily: "Syne" }}>
            <Pin size={12} /> Pinned
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(330px, 1fr))", gap: 16 }}>
          {Array(6).fill(0).map((_, i) => <NoteCardSkeleton key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60 }}>
          <FileText size={48} color="var(--text-muted)" style={{ marginBottom: 16 }} />
          <p style={{ color: "var(--text-muted)", fontSize: 16 }}>No notes found</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(330px, 1fr))", gap: 16 }}>
          {filtered.map((note) => (
            <div key={note._id}>
              <Link to={`/meetings/${note.meetingId}`} style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--accent)", textDecoration: "none", fontWeight: 500, marginBottom: 6, padding: "3px 8px", borderRadius: 99, background: "var(--accent-soft)", border: "1px solid var(--accent-glow)" }}>
                <Calendar size={10} /> {note.meetingTitle}
              </Link>
              <NoteCard note={note} onDelete={handleDelete} onPin={handlePin} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
