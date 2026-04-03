import React, { useState, useEffect } from "react";
import { X, Plus, Trash2, FileText, Flag, Tag, ListChecks, Type, AlignLeft, Save } from "lucide-react";
import { notesAPI } from "../utils/api";

const priorities = ["low", "medium", "high"];

export default function CreateNoteModal({ meetingId, note, onClose, onSaved }) {
  const editing = !!note;
  const [form, setForm] = useState({ title: "", content: "", topic: "", priority: "medium", actionItems: [], tags: [] });
  const [newAction, setNewAction] = useState("");
  const [newTag, setNewTag] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (note) setForm({ ...note });
  }, [note]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      editing ? await notesAPI.update(note._id, form) : await notesAPI.create({ ...form, meetingId });
      onSaved();
    } finally { setSaving(false); }
  };

  return (
    <div style={styles.backdrop} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="animate-slideIn" style={styles.sideSheet}>
        <header style={styles.header}>
          <div style={styles.headerContent}>
            <div style={styles.iconBox}><FileText size={20} color="var(--accent)" /></div>
            <div>
              <h2 style={styles.headline}>{editing ? "Edit Note" : "New Meeting Note"}</h2>
              <p style={styles.subHeadline}>Draft insights and assign deliverables.</p>
            </div>
          </div>
          <button onClick={onClose} style={styles.closeBtn}><X size={20} /></button>
        </header>

        <div style={styles.scrollArea}>
          <div style={styles.formGroup}>
            <label style={styles.label}><Type size={14} /> Note Title</label>
            <input value={form.title} onChange={(e) => set("title", e.target.value)} style={styles.input} placeholder="Main focus..." />
            
            <div style={{ display: "flex", gap: 16 }}>
              <div style={{ flex: 1 }}>
                <label style={styles.label}><Tag size={14} /> Topic</label>
                <input value={form.topic} onChange={(e) => set("topic", e.target.value)} style={styles.input} placeholder="e.g. Design" />
              </div>
              <div style={{ flex: 1 }}>
                <label style={styles.label}><Flag size={14} /> Priority</label>
                <div style={styles.priorityToggle}>
                  {priorities.map(p => (
                    <button key={p} onClick={() => set("priority", p)} style={{
                      ...styles.pBtn,
                      background: form.priority === p ? "#fff" : "transparent",
                      boxShadow: form.priority === p ? "var(--shadow-sm)" : "none",
                      color: form.priority === p ? "var(--text-primary)" : "var(--text-muted)"
                    }}>{p}</button>
                  ))}
                </div>
              </div>
            </div>

            <label style={styles.label}><AlignLeft size={14} /> Content</label>
            <textarea value={form.content} onChange={(e) => set("content", e.target.value)} style={styles.textarea} placeholder="Start typing..." />
          </div>
        </div>

        <footer style={styles.footer}>
          <button onClick={onClose} style={styles.cancelBtn}>Cancel</button>
          <button onClick={handleSubmit} disabled={saving} style={styles.saveBtn}>
            <Save size={18} /> {saving ? "Saving..." : "Create Note"}
          </button>
        </footer>
      </div>
    </div>
  );
}

const styles = {
  backdrop: { position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.4)", backdropFilter: "blur(4px)", display: "flex", justifyContent: "flex-end", zIndex: 2000 },
  sideSheet: { width: "100%", maxWidth: "500px", background: "#fff", height: "100vh", display: "flex", flexDirection: "column", boxShadow: "-10px 0 30px rgba(0,0,0,0.05)" },
  header: { padding: "24px 32px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" },
  headerContent: { display: "flex", alignItems: "center", gap: 16 },
  iconBox: { width: 40, height: 40, borderRadius: 10, background: "var(--accent-soft)", display: "flex", alignItems: "center", justifyContent: "center" },
  headline: { fontSize: 18, fontWeight: 700, margin: 0, color: "var(--text-primary)" },
  subHeadline: { fontSize: 12, color: "var(--text-muted)", marginTop: 2 },
  closeBtn: { background: "none", border: "none", color: "#94a3b8", cursor: "pointer" },
  scrollArea: { flex: 1, overflowY: "auto", padding: "32px" },
  formGroup: { display: "flex", flexDirection: "column", gap: 24 },
  label: { fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", display: "flex", alignItems: "center", gap: 6 },
  input: { padding: "12px", borderRadius: 8, border: "1px solid var(--border)", background: "#f8fafc", fontSize: 14, outline: "none" },
  priorityToggle: { display: "flex", background: "#f1f5f9", padding: 4, borderRadius: 10 },
  pBtn: { flex: 1, padding: "8px", border: "none", borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: "pointer", textTransform: "capitalize" },
  textarea: { minHeight: "200px", padding: "16px", borderRadius: 12, border: "1px solid var(--border)", background: "#f8fafc", fontSize: 14, lineHeight: 1.6, resize: "none", outline: "none" },
  footer: { padding: "24px 32px", borderTop: "1px solid var(--border)", display: "flex", gap: 12 },
  cancelBtn: { flex: 1, padding: "12px", borderRadius: 10, border: "1px solid var(--border)", background: "#fff", color: "var(--text-secondary)", fontWeight: 600, cursor: "pointer" },
  saveBtn: { flex: 2, padding: "12px", borderRadius: 10, border: "none", background: "var(--accent)", color: "#fff", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }
};