import React from "react";
import { format } from "date-fns";
import { Tag, Clock, Trash2, Edit3, CheckSquare, Pin, PinOff } from "lucide-react";

const priorityConfig = {
  high:   { bg: "var(--rose-soft)",  text: "var(--rose)",  border: "var(--rose)"  },
  medium: { bg: "var(--amber-soft)", text: "var(--amber)", border: "var(--amber)" },
  low:    { bg: "var(--green-soft)", text: "var(--green)", border: "var(--green)" },
};

export default function NoteCard({ note, onDelete, onEdit, onPin }) {
  const pc = priorityConfig[note.priority] || priorityConfig.medium;
  const doneCount = (note.actionItems || []).filter((a) => a.done).length;
  const totalActions = (note.actionItems || []).length;

  return (
    <div
      className="animate-fade"
      style={{
        background: "var(--bg-card)", 
        border: "1px solid var(--border)",
        borderRadius: "var(--radius)", 
        padding: 18, 
        transition: "all 0.25s",
        borderLeft: `3px solid ${pc.border}`,
        width: "100%",
        // FLEXBOX FOR UNIFORM HEIGHT
        display: "flex",
        flexDirection: "column",
        height: "100%",
        boxSizing: "border-box",
        ...(note.isPinned && { boxShadow: `0 0 0 1px var(--amber-soft)`, borderColor: "var(--amber)" }),
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-card-hover)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "var(--bg-card)")}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8, gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
            {note.isPinned && <Pin size={11} color="var(--amber)" fill="var(--amber)" />}
            <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {note.title}
            </h3>
          </div>
          {note.topic && (
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <Tag size={10} color="var(--accent)" />
              <span style={{ fontSize: 11, color: "var(--accent)", fontWeight: 500 }}>{note.topic}</span>
            </div>
          )}
        </div>
        <span style={{
          padding: "2px 8px", borderRadius: 99, fontSize: 10, fontWeight: 700,
          textTransform: "uppercase", letterSpacing: 0.5, flexShrink: 0,
          background: pc.bg, color: pc.text,
        }}>{note.priority}</span>
      </div>

      {/* Content - flexGrow ensures this area stretches to fill the card */}
      <p style={{
        fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.65,
        marginBottom: 10, display: "-webkit-box", WebkitLineClamp: 3,
        WebkitBoxOrient: "vertical", overflow: "hidden",
        flexGrow: 1, 
      }}>{note.content}</p>

      {/* Tags */}
      {note.tags?.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 10 }}>
          {note.tags.slice(0, 4).map((t) => (
            <span key={t} style={{ padding: "2px 7px", borderRadius: 99, fontSize: 10, background: "var(--accent-soft)", color: "var(--accent)" }}>{t}</span>
          ))}
        </div>
      )}

      {/* Action Items */}
      {totalActions > 0 && (
        <div style={{
          display: "flex", alignItems: "center", gap: 6, marginBottom: 10,
          padding: "5px 10px", borderRadius: "var(--radius-xs)",
          background: "var(--bg-elevated)", border: "1px solid var(--border)",
        }}>
          <CheckSquare size={12} color="var(--teal)" />
          <div style={{ flex: 1, height: 4, background: "var(--border)", borderRadius: 99, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${(doneCount / totalActions) * 100}%`, background: "var(--teal)", borderRadius: 99 }} />
          </div>
          <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>
            <span style={{ color: "var(--teal)", fontWeight: 600 }}>{doneCount}</span>/{totalActions}
          </span>
        </div>
      )}

      {/* Footer */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto", paddingTop: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <Clock size={10} color="var(--text-muted)" />
          <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "JetBrains Mono" }}>
            {format(new Date(note.createdAt), "MMM d, yyyy")}
          </span>
        </div>
        <div style={{ display: "flex", gap: 2 }}>
          {onPin && (
            <button onClick={(e) => { e.stopPropagation(); onPin(note._id); }} 
              style={{ background: "none", border: "none", cursor: "pointer", padding: 5, borderRadius: "var(--radius-xs)", color: note.isPinned ? "var(--amber)" : "var(--text-muted)" }}>
              {note.isPinned ? <PinOff size={13} /> : <Pin size={13} />}
            </button>
          )}
          {onDelete && (
            <button onClick={(e) => { e.stopPropagation(); onDelete(note._id); }}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 5, borderRadius: "var(--radius-xs)", color: "var(--text-muted)" }}>
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}