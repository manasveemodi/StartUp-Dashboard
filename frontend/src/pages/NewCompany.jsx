import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft, Building2, Globe, Mail, Phone,
  MapPin, Tag, Check, Sparkles
} from "lucide-react";
import { companiesAPI } from "../utils/api";
import { useToast }     from "../context/ToastContext";
import TopBar           from "../components/TopBar";

const INDUSTRIES = [
  "Technology","Finance","Healthcare","Retail","Education",
  "Manufacturing","Real Estate","Media","Consulting","Legal","Other"
];
const STATUS_OPTS = [
  { value:"active",   label:"Active",   desc:"Currently working together" },
  { value:"prospect", label:"Prospect", desc:"Potential future client" },
  { value:"client",   label:"Client",   desc:"Paying client or partner" },
  { value:"inactive", label:"Inactive", desc:"No longer active" },
];
const lbl = { fontSize:11,fontWeight:700,color:"var(--text-muted)",display:"block",marginBottom:6,textTransform:"uppercase",letterSpacing:"0.5px" };

export default function NewCompany() {
  const navigate = useNavigate();
  const toast    = useToast();
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({
    name:"", industry:"", website:"", email:"",
    phone:"", address:"", description:"", status:"active", tags:"",
  });
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const validate = () => {
    const e={};
    if (!form.name.trim()) e.name="Company name is required";
    if (form.name.length>200) e.name="Max 200 characters";
    if (form.email && !/\S+@\S+\.\S+/.test(form.email)) e.email="Invalid email address";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const res = await companiesAPI.create({
        ...form,
        tags: form.tags.split(",").map(t=>t.trim().toLowerCase()).filter(Boolean),
      });
      toast.success(`${form.name} registered successfully!`);
      navigate("/companies");
    } catch(err) {
      toast.error(err.response?.data?.message || "Failed to register company.");
    } finally { setSaving(false); }
  };

  return (
    <div style={{ background:"var(--bg-base)",minHeight:"100vh" }}>
      <TopBar title="Register Company" subtitle="Add a new company to your workspace"/>
      <div style={{ maxWidth:720,margin:"0 auto",padding:"28px 24px" }}>

        <Link to="/companies" className="btn btn-ghost btn-sm animate-fadeUp" style={{ marginBottom:20,display:"inline-flex" }}>
          <ArrowLeft size={13}/> Back to Companies
        </Link>

        {/* Header banner */}
        <div className="animate-fadeUp" style={{ borderRadius:"var(--radius-lg)",padding:"24px 28px",marginBottom:24,
          background:"linear-gradient(135deg,var(--accent),var(--teal))",
          display:"flex",alignItems:"center",gap:16,
          boxShadow:"0 8px 24px var(--accent-glow)" }}>
          <div style={{ width:52,height:52,borderRadius:14,background:"rgba(255,255,255,0.2)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
            <Building2 size={26} color="#fff"/>
          </div>
          <div>
            <h2 style={{ fontSize:18,fontWeight:800,color:"#fff",letterSpacing:"-0.3px",marginBottom:4 }}>Register a Company</h2>
            <p style={{ fontSize:13,color:"rgba(255,255,255,0.8)" }}>Add a client, partner, or prospect to track meetings and time.</p>
          </div>
        </div>

        {/* Form card */}
        <div className="card animate-fadeUp delay-1" style={{ padding:28 }}>
          <div style={{ display:"flex",flexDirection:"column",gap:18 }}>

            {/* Name */}
            <div>
              <label style={lbl}>Company Name *</label>
              <input className="input" value={form.name} onChange={e=>set("name",e.target.value)}
                placeholder="e.g. Acme Corporation" style={{ fontSize:15,fontWeight:500,...(errors.name?{borderColor:"var(--rose)",boxShadow:"0 0 0 3px var(--rose-soft)"}:{}) }}/>
              {errors.name&&<p style={{ fontSize:11,color:"var(--rose)",marginTop:4 }}>{errors.name}</p>}
            </div>

            {/* Industry + Status */}
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:14 }}>
              <div>
                <label style={lbl}>Industry</label>
                <select className="input" value={form.industry} onChange={e=>set("industry",e.target.value)}>
                  <option value="">Select industry…</option>
                  {INDUSTRIES.map(i=><option key={i} value={i}>{i}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Relationship Status</label>
                <select className="input" value={form.status} onChange={e=>set("status",e.target.value)}>
                  {STATUS_OPTS.map(s=><option key={s.value} value={s.value}>{s.label} — {s.desc}</option>)}
                </select>
              </div>
            </div>

            {/* Contact */}
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:14 }}>
              <div>
                <label style={lbl}>Email Address</label>
                <div style={{ position:"relative" }}>
                  <Mail size={13} color="var(--text-muted)" style={{ position:"absolute",left:11,top:"50%",transform:"translateY(-50%)" }}/>
                  <input className="input" type="email" value={form.email} onChange={e=>set("email",e.target.value)}
                    placeholder="contact@company.com" style={{ paddingLeft:32,...(errors.email?{borderColor:"var(--rose)"}:{}) }}/>
                </div>
                {errors.email&&<p style={{ fontSize:11,color:"var(--rose)",marginTop:4 }}>{errors.email}</p>}
              </div>
              <div>
                <label style={lbl}>Phone Number</label>
                <div style={{ position:"relative" }}>
                  <Phone size={13} color="var(--text-muted)" style={{ position:"absolute",left:11,top:"50%",transform:"translateY(-50%)" }}/>
                  <input className="input" value={form.phone} onChange={e=>set("phone",e.target.value)} placeholder="+1 (555) 000-0000" style={{ paddingLeft:32 }}/>
                </div>
              </div>
            </div>

            {/* Website */}
            <div>
              <label style={lbl}>Website</label>
              <div style={{ position:"relative" }}>
                <Globe size={13} color="var(--text-muted)" style={{ position:"absolute",left:11,top:"50%",transform:"translateY(-50%)" }}/>
                <input className="input" value={form.website} onChange={e=>set("website",e.target.value)} placeholder="https://company.com" style={{ paddingLeft:32 }}/>
              </div>
            </div>

            {/* Address */}
            <div>
              <label style={lbl}>Address</label>
              <div style={{ position:"relative" }}>
                <MapPin size={13} color="var(--text-muted)" style={{ position:"absolute",left:11,top:"50%",transform:"translateY(-50%)" }}/>
                <input className="input" value={form.address} onChange={e=>set("address",e.target.value)} placeholder="123 Business Ave, City, Country" style={{ paddingLeft:32 }}/>
              </div>
            </div>

            {/* Description */}
            <div>
              <label style={lbl}>Description</label>
              <textarea className="input" value={form.description} onChange={e=>set("description",e.target.value)}
                placeholder="Describe the company and your relationship with them. What do they do? What are you working on together?" rows={4}/>
            </div>

            {/* Tags */}
            <div>
              <label style={lbl}>Tags</label>
              <div style={{ position:"relative" }}>
                <Tag size={13} color="var(--text-muted)" style={{ position:"absolute",left:11,top:"50%",transform:"translateY(-50%)" }}/>
                <input className="input" value={form.tags} onChange={e=>set("tags",e.target.value)}
                  placeholder="saas, b2b, enterprise, startup (comma separated)" style={{ paddingLeft:32 }}/>
              </div>
              <p style={{ fontSize:11,color:"var(--text-muted)",marginTop:4 }}>Tags help you search and filter companies</p>
            </div>

            {/* Actions */}
            <div style={{ display:"flex",gap:12,paddingTop:4 }}>
              <Link to="/companies" className="btn btn-secondary btn-lg" style={{ flex:1,justifyContent:"center" }}>Cancel</Link>
              <button onClick={handleSubmit} disabled={saving||!form.name.trim()} className="btn btn-primary btn-xl"
                style={{ flex:2,justifyContent:"center",boxShadow:"0 4px 16px var(--accent-glow)" }}>
                {saving
                  ?<><div style={{ width:16,height:16,border:"2px solid rgba(255,255,255,0.4)",borderTopColor:"#fff",borderRadius:"50%",animation:"spin 0.7s linear infinite" }}/>Registering…</>
                  :<><Sparkles size={16}/>Register Company</>}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
