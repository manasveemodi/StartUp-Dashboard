import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft, Building2, Mail, Globe, Phone,
  MapPin, Tag, FileText, CheckCircle,
  Users, Percent, X, Plus, PieChart, Briefcase
} from "lucide-react";
import { companiesAPI } from "../utils/api";
import { useToast }     from "../context/ToastContext";
import TopBar           from "../components/TopBar";

const INDUSTRIES = [
  "Technology","Finance","Healthcare","Retail","Education",
  "Manufacturing","Real Estate","Media","Consulting","Legal",
  "Logistics","Energy","Food & Beverage","Non-Profit","Other"
];

/* ─── shared label style ─── */
const lbl = {
  fontSize: 11,
  fontWeight: 700,
  color: "var(--text-muted)",
  display: "block",
  marginBottom: 6,
  textTransform: "uppercase",
  letterSpacing: "0.5px",
};

/* ─── Section header ─── */
function SectionHeader({ icon: Icon, iconBg, iconColor, title, subtitle }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:24 }}>
      <div style={{
        width:42, height:42, borderRadius:"var(--radius-sm)",
        background: iconBg,
        display:"flex", alignItems:"center", justifyContent:"center",
        flexShrink:0,
      }}>
        <Icon size={20} color={iconColor}/>
      </div>
      <div>
        <div style={{ fontSize:15, fontWeight:800, color:"var(--text-primary)", letterSpacing:"-0.2px" }}>{title}</div>
        <div style={{ fontSize:12, color:"var(--text-muted)", marginTop:1 }}>{subtitle}</div>
      </div>
    </div>
  );
}

/* ─── Pill badge ─── */
function Pill({ label, onRemove }) {
  return (
    <span style={{
      display:"inline-flex", alignItems:"center", gap:5,
      background:"var(--accent-soft)", color:"var(--accent-text)",
      fontSize:11, fontWeight:600, padding:"3px 8px 3px 11px",
      borderRadius:999, border:"1px solid rgba(79,70,229,0.15)",
    }}>
      {label}
      <button type="button" onClick={onRemove} style={{
        background:"none", border:"none", padding:0, cursor:"pointer",
        display:"flex", alignItems:"center", color:"var(--text-muted)",
        lineHeight:1,
      }}>
        <X size={11}/>
      </button>
    </span>
  );
}

export default function CompanyRegister() {
  const navigate = useNavigate();
  const toast    = useToast();
  const [saving, setSaving] = useState(false);
  const [done,   setDone]   = useState(false);
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    name:"", industry:"", website:"", email:"",
    phone:"", address:"", description:"", tags:"",
  });

  /* Shareholding */
  const [holders, setHolders] = useState([{ id: Date.now(), name:"", percent:"" }]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  /* ── Shareholding helpers ── */
  const addHolder = () =>
    setHolders(h => [...h, { id: Date.now(), name:"", percent:"" }]);
  const removeHolder = (id) => setHolders(h => h.filter(x => x.id !== id));
  const updateHolder = (id, key, val) =>
    setHolders(h => h.map(x => x.id === id ? { ...x, [key]: val } : x));

  const totalPercent = holders.reduce((s, h) => s + (parseFloat(h.percent) || 0), 0);

  /* ── Validation ── */
  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Company name is required";
    if (form.email && !/\S+@\S+\.\S+/.test(form.email)) e.email = "Invalid email address";
    if (form.website && !/^https?:\/\//.test(form.website))
      e.website = "URL must start with http:// or https://";
    if (totalPercent > 100)
      e.shareholding = `Total shareholding is ${totalPercent.toFixed(2)}% — cannot exceed 100%`;
    setErrors(e);
    return !Object.keys(e).length;
  };

  /* ── Submit ── */
  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await companiesAPI.create({
        ...form,
        tags: form.tags.split(",").map(t => t.trim().toLowerCase()).filter(Boolean),
        shareholding: holders
          .filter(h => h.name.trim())
          .map(h => ({ name: h.name.trim(), percent: parseFloat(h.percent) || 0 })),
      });
      setDone(true);
      toast.success(`${form.name} registered successfully!`);
      setTimeout(() => navigate("/companies"), 1600);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to register company.");
    } finally { setSaving(false); }
  };

  /* ── Success screen ── */
  if (done) return (
    <div style={{ background:"var(--bg-base)", minHeight:"100vh" }}>
      <TopBar title="Register Company" subtitle=""/>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:"70vh" }}>
        <div style={{ textAlign:"center" }}>
          <div style={{ width:72, height:72, borderRadius:"50%", background:"var(--green-soft)", border:"2px solid var(--green)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 20px" }}>
            <CheckCircle size={32} color="var(--green)"/>
          </div>
          <h2 style={{ fontSize:20, fontWeight:800, color:"var(--text-primary)", marginBottom:8 }}>{form.name} registered!</h2>
          <p style={{ fontSize:13, color:"var(--text-muted)" }}>Redirecting to company list…</p>
        </div>
      </div>
    </div>
  );

  /* ── Text field helper ── */
  const field = (key, label, icon, placeholder, type="text", required=false) => (
    <div>
      <label style={lbl}>{label}{required && <span style={{ color:"var(--rose)", marginLeft:2 }}>*</span>}</label>
      <div style={{ position:"relative" }}>
        {React.createElement(icon, {
          size:13, color:"var(--text-muted)",
          style:{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }
        })}
        <input
          className="input" type={type}
          value={form[key]} onChange={e => set(key, e.target.value)}
          placeholder={placeholder}
          style={{ paddingLeft:34, ...(errors[key] ? { borderColor:"var(--rose)", boxShadow:"0 0 0 3px var(--rose-soft)" } : {}) }}
        />
      </div>
      {errors[key] && <p style={{ fontSize:11, color:"var(--rose)", marginTop:4 }}>{errors[key]}</p>}
    </div>
  );

  /* ── Percent bar colour ── */
  const barColor = totalPercent > 100 ? "var(--rose)" : totalPercent === 100 ? "var(--green)" : "var(--accent)";

  return (
    <div style={{ background:"var(--bg-base)", minHeight:"100vh" }}>
      <TopBar title="Register Company" subtitle="Add a new company to your workspace"/>

      <div style={{ maxWidth:700, margin:"0 auto", padding:"24px 24px 60px" }}>
        <Link to="/companies" className="btn btn-ghost btn-sm" style={{ marginBottom:28, display:"inline-flex" }}>
          <ArrowLeft size={13}/> Back to Companies
        </Link>

        {/* ── 1. Company Information ── */}
        <div className="card animate-fadeUp" style={{ padding:30, marginBottom:16 }}>
          <SectionHeader
            icon={Building2} iconBg="var(--accent-soft)" iconColor="var(--accent)"
            title="Company Information"
            subtitle="Core identity and classification details"
          />

          <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
            {field("name", "Company Name", Building2, "e.g. Acme Corporation", "text", true)}

            <div>
              <label style={lbl}>Industry</label>
              <div style={{ position:"relative" }}>
                <Briefcase size={13} color="var(--text-muted)" style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }}/>
                <select className="input" value={form.industry} onChange={e => set("industry", e.target.value)} style={{ paddingLeft:34 }}>
                  <option value="">Select industry…</option>
                  {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label style={lbl}>Description</label>
              <div style={{ position:"relative" }}>
                <FileText size={13} color="var(--text-muted)" style={{ position:"absolute", left:12, top:13, pointerEvents:"none" }}/>
                <textarea
                  className="input" value={form.description}
                  onChange={e => set("description", e.target.value)}
                  placeholder="Brief description of this company and your relationship with them…"
                  rows={3} style={{ paddingLeft:34, resize:"vertical" }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── 2. Contact Details ── */}
        <div className="card animate-fadeUp delay-1" style={{ padding:30, marginBottom:16 }}>
          <SectionHeader
            icon={Mail} iconBg="var(--teal-soft)" iconColor="var(--teal)"
            title="Contact Details"
            subtitle="Primary communication channels for this company"
          />

          <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
              {field("email", "Email Address", Mail,  "contact@company.com", "email")}
              {field("phone", "Phone Number",  Phone, "+1 (555) 000-0000")}
            </div>
            {field("website", "Website", Globe, "https://company.com")}
            <div>
              <label style={lbl}>Registered Address</label>
              <div style={{ position:"relative" }}>
                <MapPin size={13} color="var(--text-muted)" style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }}/>
                <input className="input" value={form.address} onChange={e => set("address", e.target.value)}
                  placeholder="123 Business Ave, City, State, PIN" style={{ paddingLeft:34 }}/>
              </div>
            </div>
          </div>
        </div>

        {/* ── 3. Shareholding Structure ── */}
        <div className="card animate-fadeUp delay-3" style={{ padding:30, marginBottom:16 }}>
          <SectionHeader
            icon={PieChart} iconBg="var(--amber-soft, #fef3c7)" iconColor="var(--amber, #d97706)"
            title="Shareholding Structure"
            subtitle="Equity distribution across shareholders and stakeholders"
          />

          {/* Header row */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 160px 36px", gap:10, marginBottom:8 }}>
            <span style={lbl}>Shareholder Name</span>
            <span style={lbl}>Holding (%)</span>
            <span/>
          </div>

          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {holders.map((h, idx) => (
              <div key={h.id} style={{ display:"grid", gridTemplateColumns:"1fr 160px 36px", gap:10, alignItems:"center" }}>
                {/* Name */}
                <div style={{ position:"relative" }}>
                  <Users size={13} color="var(--text-muted)" style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }}/>
                  <input
                    className="input"
                    value={h.name}
                    onChange={e => updateHolder(h.id, "name", e.target.value)}
                    placeholder={`Shareholder ${idx + 1}`}
                    style={{ paddingLeft:34 }}
                  />
                </div>

                {/* Percent */}
                <div style={{ position:"relative" }}>
                  <Percent size={13} color="var(--text-muted)" style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }}/>
                  <input
                    className="input" type="number" min="0" max="100" step="0.01"
                    value={h.percent}
                    onChange={e => updateHolder(h.id, "percent", e.target.value)}
                    placeholder="0.00"
                    style={{ paddingLeft:34 }}
                  />
                </div>

                {/* Remove */}
                {holders.length > 1 ? (
                  <button
                    type="button" onClick={() => removeHolder(h.id)}
                    style={{
                      width:36, height:36, borderRadius:"var(--radius-sm)",
                      background:"var(--rose-soft, #fff1f2)", border:"1px solid var(--rose-border, #fecdd3)",
                      cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
                      transition:"all 0.15s",
                    }}
                    title="Remove row"
                  >
                    <X size={13} color="var(--rose, #e11d48)"/>
                  </button>
                ) : <div/>}
              </div>
            ))}
          </div>

          {/* Add row */}
          <button
            type="button" onClick={addHolder}
            style={{
              marginTop:14, width:"100%", padding:"9px 0",
              borderRadius:"var(--radius-sm)", border:"1.5px dashed var(--border)",
              background:"var(--bg-elevated)", cursor:"pointer",
              display:"flex", alignItems:"center", justifyContent:"center", gap:7,
              fontSize:12, fontWeight:600, color:"var(--text-muted)",
              transition:"all 0.15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.color = "var(--accent)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-muted)"; }}
          >
            <Plus size={14}/> Add Shareholder
          </button>

          {/* Progress bar */}
          <div style={{ marginTop:18 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:7 }}>
              <span style={{ fontSize:11, fontWeight:700, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"0.5px" }}>
                Total Allocated
              </span>
              <span style={{
                fontSize:13, fontWeight:800,
                color: totalPercent > 100 ? "var(--rose)" : totalPercent === 100 ? "var(--green)" : "var(--text-primary)",
              }}>
                {totalPercent.toFixed(2)}%
              </span>
            </div>
            <div style={{ height:6, borderRadius:999, background:"var(--border)", overflow:"hidden" }}>
              <div style={{
                height:"100%", borderRadius:999,
                width:`${Math.min(totalPercent, 100)}%`,
                background: barColor,
                transition:"width 0.35s ease, background 0.2s",
              }}/>
            </div>
            {totalPercent > 0 && totalPercent < 100 && (
              <p style={{ fontSize:11, color:"var(--text-muted)", marginTop:5 }}>
                {(100 - totalPercent).toFixed(2)}% remaining to allocate
              </p>
            )}
            {totalPercent === 100 && (
              <p style={{ fontSize:11, color:"var(--green)", marginTop:5, fontWeight:600 }}>
                ✓ Shareholding fully allocated
              </p>
            )}
            {errors.shareholding && (
              <p style={{ fontSize:11, color:"var(--rose)", marginTop:5 }}>{errors.shareholding}</p>
            )}
          </div>
        </div>

        {/* ── 5. Tags ── */}
        <div className="card animate-fadeUp delay-3" style={{ padding:30, marginBottom:28 }}>
          <SectionHeader
            icon={Tag} iconBg="var(--teal-soft)" iconColor="var(--teal)"
            title="Tags &amp; Labels"
            subtitle="Categorise this company for faster filtering and search"
          />

          <div style={{ position:"relative" }}>
            <Tag size={13} color="var(--text-muted)" style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }}/>
            <input
              className="input" value={form.tags}
              onChange={e => set("tags", e.target.value)}
              placeholder="saas, b2b, enterprise, key-account"
              style={{ paddingLeft:34 }}
            />
          </div>
          <p style={{ fontSize:11, color:"var(--text-muted)", marginTop:6, lineHeight:1.6 }}>
            Separate multiple tags with commas. Tags are stored in lowercase.
          </p>

          {form.tags && (
            <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginTop:12 }}>
              {form.tags.split(",").map(t => t.trim()).filter(Boolean).map(t => (
                <span key={t} className="badge" style={{ background:"var(--accent-soft)", color:"var(--accent-text)", fontSize:11, padding:"3px 10px" }}>{t}</span>
              ))}
            </div>
          )}
        </div>

        {/* ── Actions ── */}
        <div style={{ display:"flex", gap:12 }}>
          <Link to="/companies" className="btn btn-secondary btn-lg" style={{ flex:1, justifyContent:"center" }}>
            Cancel
          </Link>
          <button
            onClick={handleSubmit} disabled={saving}
            className="btn btn-primary btn-xl"
            style={{ flex:2, justifyContent:"center" }}
          >
            {saving ? (
              <>
                <div style={{ width:15, height:15, border:"2px solid rgba(255,255,255,0.4)", borderTopColor:"#fff", borderRadius:"50%", animation:"spin 0.7s linear infinite" }}/>
                Registering…
              </>
            ) : (
              <>
                <Building2 size={15}/>
                Register Company
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
