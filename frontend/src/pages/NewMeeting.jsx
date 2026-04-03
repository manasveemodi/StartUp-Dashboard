import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { format } from "date-fns";
import { ArrowLeft, Calendar, Users, Tag, MapPin, Sparkles, ChevronRight, Flag } from "lucide-react";
import { meetingsAPI } from "../utils/api";
import { useToast } from "../context/ToastContext";
import TopBar from "../components/TopBar";

const PRIORITIES = [
  { value:"low",      label:"Low",      color:"var(--green)", bg:"var(--green-soft)", desc:"Routine" },
  { value:"medium",   label:"Medium",   color:"var(--amber)", bg:"var(--amber-soft)", desc:"Important" },
  { value:"high",     label:"High",     color:"var(--rose)",  bg:"var(--rose-soft)",  desc:"Urgent" },
  { value:"critical", label:"Critical", color:"#dc2626",      bg:"#fee2e2",           desc:"Escalation" },
];
const STATUSES   = [
  { value:"scheduled", label:"Scheduled", icon:"🗓" },
  { value:"ongoing",   label:"Ongoing",   icon:"🔴" },
  { value:"completed", label:"Completed", icon:"✅" },
];
const CATEGORIES = ["Sprint Review","Product Planning","1-on-1","All Hands","Client Call","Board Meeting","Team Standup","Retrospective","Workshop","Interview","Other"];

const lbl = { fontSize:11, fontWeight:700, color:"var(--text-muted)", display:"block", marginBottom:6, letterSpacing:"0.5px", textTransform:"uppercase" };

export default function NewMeeting() {
  const navigate = useNavigate();
  const toast    = useToast();
  const [saving, setSaving] = useState(false);
  const [step, setStep]     = useState(1);
  const [errors, setErrors] = useState({});
  const [form, setForm]     = useState({
    title:"", description:"", participants:"",
    status:"scheduled", priority:"medium",
    category:"", location:"", tags:"", scheduledAt:"",
  });
  const set = (k,v) => setForm(f => ({ ...f, [k]:v }));

  const validateStep1 = () => {
    const e = {};
    if (!form.title.trim()) e.title = "Meeting title is required";
    if (form.title.length > 200) e.title = "Max 200 characters";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleCreate = async () => {
    setSaving(true);
    try {
      const res = await meetingsAPI.create({
        title: form.title.trim(),
        description: form.description.trim(),
        participants: form.participants.split(",").map(p=>p.trim()).filter(Boolean),
        status: form.status, priority: form.priority,
        category: form.category, location: form.location.trim(),
        tags: form.tags.split(",").map(t=>t.trim().toLowerCase()).filter(Boolean),
        scheduledAt: form.scheduledAt || undefined,
      });
      toast.success("Meeting created! Add your notes and start recording.");
      navigate(`/meetings/${res.data.data._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create meeting.");
    } finally { setSaving(false); }
  };

  const steps = [{ n:1, label:"Basic Info" }, { n:2, label:"Details" }, { n:3, label:"Review" }];

  return (
    <div style={{ background:"var(--bg-base)", minHeight:"100vh" }}>
      <TopBar title="Create New Meeting" subtitle="Set up your meeting workspace in 3 simple steps" />
      <div style={{ maxWidth:720, margin:"0 auto", padding:"28px 24px" }}>

        <Link to="/meetings" className="btn btn-ghost btn-sm animate-fadeUp" style={{ marginBottom:24, display:"inline-flex" }}>
          <ArrowLeft size={14} /> Back to Meetings
        </Link>

        {/* Step progress */}
        <div className="animate-fadeUp" style={{ display:"flex", alignItems:"center", marginBottom:28 }}>
          {steps.map((s,i) => (
            <React.Fragment key={s.n}>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <div style={{ width:30, height:30, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:12, fontWeight:700, transition:"all 0.3s",
                  background: step > s.n ? "var(--green)" : step===s.n ? "var(--accent)" : "var(--bg-elevated)",
                  color: step >= s.n ? "#fff" : "var(--text-muted)",
                  border: step < s.n ? "2px solid var(--border)" : "none",
                }}>{step > s.n ? "✓" : s.n}</div>
                <span style={{ fontSize:12, fontWeight:step===s.n?600:400, color:step===s.n?"var(--text-primary)":"var(--text-muted)" }}>{s.label}</span>
              </div>
              {i < 2 && <div style={{ flex:1, height:1.5, background: step > s.n+1 ? "var(--green)" : "var(--border)", margin:"0 12px", transition:"background 0.4s", borderRadius:99 }} />}
            </React.Fragment>
          ))}
        </div>

        {/* ── STEP 1 ── */}
        {step === 1 && (
          <div className="animate-scaleIn">
            <div className="card" style={{ padding:28, marginBottom:16 }}>
              <h3 style={{ fontSize:15, fontWeight:700, color:"var(--text-primary)", marginBottom:4 }}>What's this meeting about?</h3>
              <p style={{ fontSize:12, color:"var(--text-muted)", marginBottom:24 }}>Provide a clear title and context so everyone comes prepared.</p>

              <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
                <div>
                  <label style={lbl}>Meeting Title *</label>
                  <input className="input" value={form.title} onChange={e => set("title", e.target.value)}
                    placeholder="e.g. Q3 Product Roadmap Review"
                    style={{ fontSize:15, padding:"12px 14px", fontWeight:500, ...(errors.title ? { borderColor:"var(--rose)", boxShadow:"0 0 0 3px var(--rose-soft)" } : {}) }} />
                  {errors.title && <p style={{ fontSize:11, color:"var(--rose)", marginTop:4 }}>{errors.title}</p>}
                </div>

                <div>
                  <label style={lbl}>Description & Agenda</label>
                  <textarea className="input" value={form.description} onChange={e => set("description", e.target.value)}
                    placeholder="Share the agenda, goals, and any pre-read material participants should review before joining…" rows={4} />
                </div>

                <div>
                  <label style={lbl}>Priority</label>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8 }}>
                    {PRIORITIES.map(p => (
                      <button key={p.value} type="button" onClick={() => set("priority", p.value)}
                        style={{ padding:"10px 6px", borderRadius:"var(--radius-sm)", cursor:"pointer", transition:"all 0.15s", textAlign:"center",
                          border:`2px solid ${form.priority===p.value ? p.color : "var(--border)"}`,
                          background: form.priority===p.value ? p.bg : "var(--bg-elevated)" }}>
                        <div style={{ fontSize:12, fontWeight:700, color: form.priority===p.value ? p.color : "var(--text-secondary)", marginBottom:2 }}>{p.label}</div>
                        <div style={{ fontSize:10, color:"var(--text-muted)" }}>{p.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
                  <div>
                    <label style={lbl}>Status</label>
                    <div style={{ display:"flex", gap:6 }}>
                      {STATUSES.map(s => (
                        <button key={s.value} type="button" onClick={() => set("status", s.value)}
                          style={{ flex:1, padding:"8px 4px", borderRadius:"var(--radius-sm)", cursor:"pointer", fontSize:11, fontWeight:600, transition:"all 0.15s",
                            border:`1.5px solid ${form.status===s.value ? "var(--accent)" : "var(--border)"}`,
                            background: form.status===s.value ? "var(--accent-soft)" : "var(--bg-elevated)",
                            color: form.status===s.value ? "var(--accent-text)" : "var(--text-muted)" }}>
                          {s.icon} {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label style={lbl}>Category</label>
                    <select className="input" value={form.category} onChange={e => set("category", e.target.value)}>
                      <option value="">Select category…</option>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </div>
            <div style={{ display:"flex", justifyContent:"flex-end" }}>
              <button className="btn btn-primary btn-lg" onClick={() => { if (validateStep1()) setStep(2); }}>
                Continue <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 2 ── */}
        {step === 2 && (
          <div className="animate-scaleIn">
            <div className="card" style={{ padding:28, marginBottom:16 }}>
              <h3 style={{ fontSize:15, fontWeight:700, color:"var(--text-primary)", marginBottom:4 }}>Participants & Logistics</h3>
              <p style={{ fontSize:12, color:"var(--text-muted)", marginBottom:24 }}>Who's joining and where will this meeting take place?</p>

              <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
                <div>
                  <label style={lbl}>Participants</label>
                  <div style={{ position:"relative" }}>
                    <Users size={14} color="var(--text-muted)" style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)" }} />
                    <input className="input" value={form.participants} onChange={e => set("participants", e.target.value)}
                      placeholder="Alice Johnson, Bob Smith, Carol White" style={{ paddingLeft:36 }} />
                  </div>
                  <p style={{ fontSize:11, color:"var(--text-muted)", marginTop:4 }}>Separate multiple names with commas</p>
                </div>

                <div>
                  <label style={lbl}>Location or Meeting Link</label>
                  <div style={{ position:"relative" }}>
                    <MapPin size={14} color="var(--text-muted)" style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)" }} />
                    <input className="input" value={form.location} onChange={e => set("location", e.target.value)}
                      placeholder="Conference Room B or https://meet.google.com/xyz" style={{ paddingLeft:36 }} />
                  </div>
                </div>

                <div>
                  <label style={lbl}>Scheduled Date & Time</label>
                  <input className="input" type="datetime-local" value={form.scheduledAt} onChange={e => set("scheduledAt", e.target.value)} />
                </div>

                <div>
                  <label style={lbl}>Tags</label>
                  <div style={{ position:"relative" }}>
                    <Tag size={14} color="var(--text-muted)" style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)" }} />
                    <input className="input" value={form.tags} onChange={e => set("tags", e.target.value)}
                      placeholder="product, q3, engineering, roadmap" style={{ paddingLeft:36 }} />
                  </div>
                  <p style={{ fontSize:11, color:"var(--text-muted)", marginTop:4 }}>Tags help you find this meeting later</p>
                </div>
              </div>
            </div>
            <div style={{ display:"flex", justifyContent:"space-between" }}>
              <button className="btn btn-secondary btn-lg" onClick={() => setStep(1)}><ArrowLeft size={15} /> Back</button>
              <button className="btn btn-primary btn-lg" onClick={() => setStep(3)}>Review <ChevronRight size={16} /></button>
            </div>
          </div>
        )}

        {/* ── STEP 3 ── */}
        {step === 3 && (
          <div className="animate-scaleIn">
            <div className="card" style={{ padding:28, marginBottom:16 }}>
              <h3 style={{ fontSize:15, fontWeight:700, color:"var(--text-primary)", marginBottom:4 }}>Review & Confirm</h3>
              <p style={{ fontSize:12, color:"var(--text-muted)", marginBottom:24 }}>Everything look good? Click create to launch your meeting workspace.</p>

              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:10 }}>
                {[
                  ["Title",    form.title],
                  ["Category", form.category || "—"],
                  ["Priority", PRIORITIES.find(p=>p.value===form.priority)?.label],
                  ["Status",   STATUSES.find(s=>s.value===form.status)?.label],
                  ["Location", form.location || "—"],
                  ["Scheduled",form.scheduledAt ? format(new Date(form.scheduledAt), "MMM d, yyyy · HH:mm") : "—"],
                ].map(([l,v]) => (
                  <div key={l} style={{ padding:"12px 14px", background:"var(--bg-elevated)", borderRadius:"var(--radius-sm)", border:"1px solid var(--border)" }}>
                    <div style={{ fontSize:10, fontWeight:700, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:3 }}>{l}</div>
                    <div style={{ fontSize:13, fontWeight:600, color:"var(--text-primary)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{v}</div>
                  </div>
                ))}
              </div>

              {form.description && (
                <div style={{ padding:"12px 14px", background:"var(--bg-elevated)", borderRadius:"var(--radius-sm)", border:"1px solid var(--border)", marginBottom:10 }}>
                  <div style={{ fontSize:10, fontWeight:700, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:4 }}>Description</div>
                  <div style={{ fontSize:12, color:"var(--text-secondary)", lineHeight:1.65 }}>{form.description}</div>
                </div>
              )}

              {form.participants && (
                <div style={{ padding:"12px 14px", background:"var(--bg-elevated)", borderRadius:"var(--radius-sm)", border:"1px solid var(--border)" }}>
                  <div style={{ fontSize:10, fontWeight:700, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:8 }}>Participants</div>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                    {form.participants.split(",").map(p=>p.trim()).filter(Boolean).map(p => (
                      <span key={p} className="badge" style={{ background:"var(--accent-soft)", color:"var(--accent-text)", fontSize:12, padding:"4px 10px" }}>{p}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* What happens next */}
              <div style={{ marginTop:20, padding:"16px", borderRadius:"var(--radius-sm)", background:"var(--accent-soft)", border:"1px solid var(--accent-glow)" }}>
                <div style={{ fontSize:12, fontWeight:700, color:"var(--accent-text)", marginBottom:8 }}>✨ After creating this meeting you can:</div>
                <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                  {["📝 Create timestamped notes for each discussion topic","🎤 Record voice audio and play it back anytime","✅ Add action items with assignees and due dates","🏷️ Tag and pin important notes for quick access"].map(item => (
                    <div key={item} style={{ fontSize:12, color:"var(--accent-text)", opacity:0.85 }}>{item}</div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display:"flex", gap:12 }}>
              <button className="btn btn-secondary btn-lg" onClick={() => setStep(2)} style={{ flexShrink:0 }}>
                <ArrowLeft size={15} /> Back
              </button>
              <button className="btn btn-primary btn-xl" onClick={handleCreate} disabled={saving} style={{ flex:1, justifyContent:"center" }}>
                {saving ? (<><div style={{ width:16, height:16, border:"2px solid rgba(255,255,255,0.4)", borderTopColor:"#fff", borderRadius:"50%", animation:"spin 0.7s linear infinite" }} />Creating…</>) : (<><Sparkles size={16} />Create Meeting Workspace</>)}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
