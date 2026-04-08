import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  FileText, 
  Search, 
  Filter, 
  Calendar, 
  Pin, 
  X, 
  Check, 
  Building2 
} from "lucide-react";
import { notesAPI, meetingsAPI } from "../utils/api";
import { useToast } from "../context/ToastContext";
import NoteCard from "../components/NoteCard";
import { NoteCardSkeleton } from "../components/Skeleton";

// Helper: extract company name from a meeting object using all possible field shapes
const extractCompanyName = (meeting) => {
  if (!meeting) return "No Company";
  return (
    meeting.company_id?.name ||       // populated ref: { _id, name }
    meeting.company?.name ||          // alternate populated key
    meeting.company_name ||           // flat string field (snake_case)
    meeting.companyName ||            // flat string field (camelCase)
    meeting.organization?.name ||     // some APIs use "organization"
    meeting.client?.name ||           // some APIs use "client"
    meeting.client_name ||            // flat client_name
    meeting.account?.name ||          // account-based CRMs
    "No Company"                      // final fallback
  );
};

export default function AllNotes() {
  const [notes, setNotes] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [priority, setPriority] = useState("all");
  const [pinned, setPinned] = useState(false);
  
  const [selectedNote, setSelectedNote] = useState(null);
  const [editData, setEditData] = useState({ title: "", content: "", topic: "", priority: "" });
  const [saving, setSaving] = useState(false);

  const toast = useToast();

  const load = async () => {
    setLoading(true);
    try {
      // 1. Fetch meetings
      const meetingsRes = await meetingsAPI.getAll({ limit: 200 });
      const allMeetings = meetingsRes.data?.data || meetingsRes.data || [];
      setMeetings(allMeetings);

      // DEBUG: uncomment this line once to verify your meeting object shape
      // if (allMeetings.length > 0) console.log("Sample meeting object:", allMeetings[0]);

      // 2. Build a map of meetingId -> { title, companyName }
      const meetingMap = {};
      allMeetings.forEach((m) => {
        if (m && m._id) {
          meetingMap[m._id] = {
            title: m.title || "Untitled Meeting",
            companyName: extractCompanyName(m),
          };
        }
      });

      // 3. Fetch notes for every meeting, attach meeting & company info
      const noteResults = await Promise.all(
  allMeetings.map((m) =>
    notesAPI
      .getByMeeting(m._id, { limit: 50 })
      .then((r) => {
        const data = r.data?.data || r.data || [];

        return data.map((n) => {
          console.log("NOTE:", n);

          return {
            ...n,

            meetingTitle:
              meetingMap[n.meetingId?._id]?.title ||
              meetingMap[m._id]?.title ||
              "General Note",

            // 🔥 FINAL WORKING FIX
            companyName:
              n.companyId?.name ||                       // future (if saved)
              n.meetingId?.companyId?.name ||           // ✅ MOST IMPORTANT NOW
              meetingMap[n.meetingId?._id]?.companyName ||
              meetingMap[m._id]?.companyName ||
              "No Company",
          };
        });
      })
      .catch(() => [])
  )
);

      // 4. Flatten, sort pinned first then by newest
      const all = noteResults.flat().sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return new Date(b.createdAt) - new Date(a.createdAt);
      });

      setNotes(all);
    } catch (error) {
      toast.error("Failed to load notes. Please check your connection.");
      console.error("Load Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleOpenModal = (note) => {
    setSelectedNote(note);
    setEditData({
      title: note.title,
      content: note.content,
      topic: note.topic || "",
      priority: note.priority || "medium",
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await notesAPI.update(selectedNote._id, editData);
      toast.success("Note updated");
      setSelectedNote(null);
      load();
    } catch {
      toast.error("Update failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this note?")) return;
    try {
      await notesAPI.delete(id);
      toast.success("Note deleted");
      load();
    } catch {
      toast.error("Failed to delete note");
    }
  };

  const handlePin = async (id) => {
    try {
      await notesAPI.togglePin(id);
      load();
    } catch {
      toast.error("Failed to pin note");
    }
  };

  const filtered = notes.filter((n) => {
    const searchLow = search.toLowerCase();
    const matchSearch =
      !search.trim() ||
      (n.title || "").toLowerCase().includes(searchLow) ||
      (n.content || "").toLowerCase().includes(searchLow) ||
      (n.companyName || "").toLowerCase().includes(searchLow) ||
      (n.topic || "").toLowerCase().includes(searchLow);
    const matchPriority = priority === "all" || n.priority === priority;
    const matchPinned = !pinned || n.isPinned;
    return matchSearch && matchPriority && matchPinned;
  });

  return (
    <div style={{ padding: "32px 36px", maxWidth: 1200 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.4px", marginBottom: 4 }}>
          All Notes
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
          {notes.length} notes across {meetings.length} meetings
        </p>
      </div>

      {/* FILTERS */}
      <div style={{ display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 220, position: "relative" }}>
          <Search
            size={15}
            color="var(--text-muted)"
            style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)" }}
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search notes, companies, or topics…"
            style={{
              width: "100%",
              padding: "10px 14px 10px 38px",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--border-accent)",
              background: "var(--bg-card)",
              color: "var(--text-primary)",
              fontSize: 14,
              fontFamily: "Syne",
              outline: "none",
            }}
          />
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
          <Filter size={13} color="var(--text-muted)" />
          {["all", "high", "medium", "low"].map((p) => (
            <button
              key={p}
              onClick={() => setPriority(p)}
              style={{
                padding: "9px 13px",
                borderRadius: "var(--radius-sm)",
                fontSize: 12,
                border: priority === p ? "1px solid var(--accent)" : "1px solid var(--border)",
                background: priority === p ? "var(--accent-soft)" : "var(--bg-card)",
                color: priority === p ? "var(--accent)" : "var(--text-secondary)",
                cursor: "pointer",
                fontFamily: "Syne",
                textTransform: "capitalize",
              }}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => setPinned(!pinned)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              padding: "9px 13px",
              borderRadius: "var(--radius-sm)",
              fontSize: 12,
              border: pinned ? "1px solid var(--amber)" : "1px solid var(--border)",
              background: pinned ? "var(--amber-soft)" : "var(--bg-card)",
              color: pinned ? "var(--amber)" : "var(--text-secondary)",
              cursor: "pointer",
              fontFamily: "Syne",
            }}
          >
            <Pin size={12} /> Pinned
          </button>
        </div>
      </div>

      {/* GRID SECTION */}
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
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(330px, 1fr))",
          gridAutoRows: "1fr",
          gap: 20,
        }}>
          {filtered.map((note) => (
            <div
              key={note._id}
              onClick={() => handleOpenModal(note)}
              style={{ cursor: "pointer", display: "flex", flexDirection: "column" }}
            >
              {/* Meeting + Company badges */}
              <div style={{ marginBottom: 8, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                <Link
                  to={`/meetings/${note.meetingId}`}
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    fontSize: 10,
                    color: "var(--accent)",
                    textDecoration: "none",
                    fontWeight: 600,
                    padding: "3px 8px",
                    borderRadius: 99,
                    background: "var(--accent-soft)",
                    border: "1px solid var(--accent-glow)",
                    textTransform: "uppercase",
                  }}
                >
                  <Calendar size={10} /> {note.meetingTitle}
                </Link>

                {/* Company name badge — always shows actual company name */}
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    fontSize: 10,
                    color: "var(--text-secondary)",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    padding: "3px 8px",
                    borderRadius: 99,
                    background: "var(--bg-app)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <Building2 size={10} />
                  {note.companyName}
                </div>
              </div>

              <div style={{ flex: 1, display: "flex" }}>
                <NoteCard
                  note={note}
                  onDelete={handleDelete}
                  onPin={handlePin}
                  companyName={note.companyName}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* EDIT MODAL */}
      {selectedNote && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2000,
            padding: 20,
          }}
        >
          <div
            style={{
              background: "var(--bg-card)",
              width: "100%",
              maxWidth: 650,
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border)",
              boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
              overflow: "hidden",
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: "16px 24px",
                borderBottom: "1px solid var(--border)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ fontSize: 12, color: "var(--accent)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "1px" }}>
                Edit Note
              </span>
              <button
                onClick={() => setSelectedNote(null)}
                style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: 24 }}>
              <input
                value={editData.title}
                onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                style={{
                  width: "100%",
                  background: "transparent",
                  border: "none",
                  fontSize: 22,
                  fontWeight: 800,
                  color: "var(--text-primary)",
                  outline: "none",
                  marginBottom: 8,
                  fontFamily: "Syne",
                }}
                placeholder="Title"
              />

              {/* Company name + topic row */}
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 20 }}>
                {/* Company badge — clearly shows the actual company */}
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    fontSize: 12,
                    color: "var(--accent)",
                    fontWeight: 700,
                    padding: "4px 10px",
                    borderRadius: 99,
                    background: "var(--accent-soft)",
                    border: "1px solid var(--accent-glow)",
                    whiteSpace: "nowrap",
                  }}
                >
                  <Building2 size={13} />
                  {selectedNote.companyName}
                </div>

                <span style={{ color: "var(--border)", margin: "0 4px" }}>•</span>

                <input
                  value={editData.topic}
                  onChange={(e) => setEditData({ ...editData, topic: e.target.value })}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "var(--text-secondary)",
                    outline: "none",
                    fontFamily: "Syne",
                    fontSize: 13,
                    flex: 1,
                  }}
                  placeholder="Topic..."
                />
              </div>

              <textarea
                value={editData.content}
                onChange={(e) => setEditData({ ...editData, content: e.target.value })}
                style={{
                  width: "100%",
                  height: 250,
                  background: "transparent",
                  border: "none",
                  fontSize: 15,
                  color: "var(--text-secondary)",
                  outline: "none",
                  resize: "none",
                  lineHeight: 1.6,
                  fontFamily: "inherit",
                }}
                placeholder="Start typing..."
              />
            </div>

            {/* Modal Footer */}
            <div
              style={{
                padding: "16px 24px",
                background: "var(--bg-app)",
                borderTop: "1px solid var(--border)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ display: "flex", gap: 8 }}>
                {["low", "medium", "high"].map((p) => (
                  <button
                    key={p}
                    onClick={() => setEditData({ ...editData, priority: p })}
                    style={{
                      padding: "6px 12px",
                      borderRadius: 4,
                      fontSize: 11,
                      border: editData.priority === p ? "1px solid var(--accent)" : "1px solid var(--border)",
                      background: editData.priority === p ? "var(--accent-soft)" : "var(--bg-card)",
                      color: editData.priority === p ? "var(--accent)" : "var(--text-muted)",
                      cursor: "pointer",
                      textTransform: "capitalize",
                    }}
                  >
                    {p}
                  </button>
                ))}
              </div>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  background: "var(--accent)",
                  color: "white",
                  border: "none",
                  padding: "10px 20px",
                  borderRadius: "var(--radius-sm)",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: 14,
                  opacity: saving ? 0.7 : 1,
                }}
              >
                <Check size={16} /> {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
