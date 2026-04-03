import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Building2, Plus, Search, Trash2, Edit3, Globe, Mail,
  Phone, Tag, Filter, ChevronRight, X, Check, MapPin
} from "lucide-react";
import { companiesAPI } from "../utils/api";
import { useToast }     from "../context/ToastContext";
import TopBar           from "../components/TopBar";

const statusConf = {
  active:   { color:"#059669", bg:"#d1fae5", label:"Active"   },
  inactive: { color:"#6b7280", bg:"#f3f4f6", label:"Inactive" },
  prospect: { color:"#d97706", bg:"#fef3c7", label:"Prospect" },
  client:   { color:"#4f46e5", bg:"#ede9fe", label:"Client"   },
};

const INDUSTRIES = [
  "Technology","Finance","Healthcare","Retail","Education",
  "Manufacturing","Real Estate","Media","Consulting","Legal","Other"
];

function Avatar({ name, size=44 }) {
  const ini = name.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();
  const pal = ["#4f46e5","#0891b2","#059669","#d97706","#7c3aed","#e11d48"];
  const c   = pal[name.charCodeAt(0) % pal.length];
  return (
    <div style={{ width:size,height:size,borderRadius:10,flexShrink:0,
      background:`${c}15`,border:`1.5px solid ${c}30`,
      display:"flex",alignItems:"center",justifyContent:"center",
      fontSize:size*0.36,fontWeight:800,color:c }}>
      {ini}
    </div>
  );
}

/* ── Company Form (shared by create + edit) ── */
function CompanyForm({ initial={}, onSubmit, onCancel, saving }) {
  const [form, setForm] = useState({
    name:"", industry:"", website:"", email:"",
    phone:"", address:"", description:"", status:"active", tags:"",
    ...initial,
    tags: Array.isArray(initial.tags) ? initial.tags.join(", ") : (initial.tags||""),
  });
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  const lbl = { fontSize:11,fontWeight:700,color:"var(--text-muted)",display:"block",marginBottom:5,textTransform:"uppercase",letterSpacing:"0.5px" };

  return (
    <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
      <div>
        <label style={lbl}>Company Name *</label>
        <input className="input" value={form.name} onChange={e=>set("name",e.target.value)}
          placeholder="Acme Corporation" style={{ fontSize:15,fontWeight:500 }} />
      </div>
      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12 }}>
        <div>
          <label style={lbl}>Industry</label>
          <select className="input" value={form.industry} onChange={e=>set("industry",e.target.value)}>
            <option value="">Select industry</option>
            {INDUSTRIES.map(i=><option key={i} value={i}>{i}</option>)}
          </select>
        </div>
        <div>
          <label style={lbl}>Status</label>
          <select className="input" value={form.status} onChange={e=>set("status",e.target.value)}>
            {Object.entries(statusConf).map(([v,c])=><option key={v} value={v}>{c.label}</option>)}
          </select>
        </div>
      </div>
      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12 }}>
        <div>
          <label style={lbl}>Email</label>
          <div style={{ position:"relative" }}>
            <Mail size={13} color="var(--text-muted)" style={{ position:"absolute",left:11,top:"50%",transform:"translateY(-50%)" }}/>
            <input className="input" type="email" value={form.email} onChange={e=>set("email",e.target.value)} placeholder="contact@company.com" style={{ paddingLeft:32 }}/>
          </div>
        </div>
        <div>
          <label style={lbl}>Phone</label>
          <div style={{ position:"relative" }}>
            <Phone size={13} color="var(--text-muted)" style={{ position:"absolute",left:11,top:"50%",transform:"translateY(-50%)" }}/>
            <input className="input" value={form.phone} onChange={e=>set("phone",e.target.value)} placeholder="+1 (555) 000-0000" style={{ paddingLeft:32 }}/>
          </div>
        </div>
      </div>
      <div>
        <label style={lbl}>Website</label>
        <div style={{ position:"relative" }}>
          <Globe size={13} color="var(--text-muted)" style={{ position:"absolute",left:11,top:"50%",transform:"translateY(-50%)" }}/>
          <input className="input" value={form.website} onChange={e=>set("website",e.target.value)} placeholder="https://company.com" style={{ paddingLeft:32 }}/>
        </div>
      </div>
      <div>
        <label style={lbl}>Address</label>
        <div style={{ position:"relative" }}>
          <MapPin size={13} color="var(--text-muted)" style={{ position:"absolute",left:11,top:"50%",transform:"translateY(-50%)" }}/>
          <input className="input" value={form.address} onChange={e=>set("address",e.target.value)} placeholder="123 Business Ave, City, Country" style={{ paddingLeft:32 }}/>
        </div>
      </div>
      <div>
        <label style={lbl}>Description</label>
        <textarea className="input" value={form.description} onChange={e=>set("description",e.target.value)}
          placeholder="Brief description of the company and your relationship…" rows={3}/>
      </div>
      <div>
        <label style={lbl}>Tags (comma separated)</label>
        <div style={{ position:"relative" }}>
          <Tag size={13} color="var(--text-muted)" style={{ position:"absolute",left:11,top:"50%",transform:"translateY(-50%)" }}/>
          <input className="input" value={form.tags} onChange={e=>set("tags",e.target.value)} placeholder="saas, b2b, enterprise, startup" style={{ paddingLeft:32 }}/>
        </div>
      </div>
      <div style={{ display:"flex",gap:10,paddingTop:4 }}>
        {onCancel && <button onClick={onCancel} className="btn btn-secondary btn-lg" style={{ flex:1 }}>Cancel</button>}
        <button onClick={()=>onSubmit({ ...form, tags:form.tags.split(",").map(t=>t.trim().toLowerCase()).filter(Boolean) })}
          disabled={saving||!form.name.trim()} className="btn btn-primary btn-lg" style={{ flex:2,justifyContent:"center" }}>
          {saving?<><div style={{ width:14,height:14,border:"2px solid rgba(255,255,255,0.4)",borderTopColor:"#fff",borderRadius:"50%",animation:"spin 0.7s linear infinite" }}/>Saving…</>:<><Check size={14}/>Save Company</>}
        </button>
      </div>
    </div>
  );
}

/* ── Company Card ── */
function CompanyCard({ company, onDelete, onEdit }) {
  const navigate = useNavigate(); 
  const { user } = useAuth();   // ✅ ADD THIS

  const sc = statusConf[company.status] || statusConf.active;

  return (
    <div
      className="card card-hover animate-fadeUp"
      onClick={() => navigate(`/companies/${company._id}`)}
      style={{ display:"flex",flexDirection:"column",overflow:"hidden", cursor:"pointer" }}
    >
      <div style={{ height:3,background:sc.color }}/>

      <div style={{ padding:"16px 18px 12px" }}>
        <div style={{ display:"flex",alignItems:"flex-start",gap:12,marginBottom:12 }}>
          <Avatar name={company.name} size={42} />

          <div style={{ flex:1,minWidth:0 }}>
            <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:3 }}>
              <h3 style={{ fontSize:14,fontWeight:700,color:"var(--text-primary)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>
                {company.name}
              </h3>

              <span className="badge" style={{ background:sc.bg,color:sc.color,flexShrink:0,fontSize:10 }}>
                {sc.label}
              </span>
            </div>

            {/* ✅ CREATED BY */}
            <div style={{ fontSize:10, color:"var(--text-muted)", marginBottom:2 }}>
              Created by: {company.createdBy?.name || "You"}
            </div>

            {company.industry && (
              <div style={{ fontSize:11,color:"var(--text-muted)" }}>
                {company.industry}
              </div>
            )}
          </div>
        </div>

        {company.description && (
          <p style={{
            fontSize:12,color:"var(--text-secondary)",lineHeight:1.6,
            marginBottom:10,display:"-webkit-box",WebkitLineClamp:2,
            WebkitBoxOrient:"vertical",overflow:"hidden"
          }}>
            {company.description}
          </p>
        )}

        <div style={{ display:"flex",flexDirection:"column",gap:4 }}>
          {company.email && (
            <div style={{ display:"flex",alignItems:"center",gap:5 }}>
              <Mail size={11} color="var(--text-muted)"/>
              <span style={{ fontSize:11,color:"var(--text-muted)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>
                {company.email}
              </span>
            </div>
          )}

          {company.phone && (
            <div style={{ display:"flex",alignItems:"center",gap:5 }}>
              <Phone size={11} color="var(--text-muted)"/>
              <span style={{ fontSize:11,color:"var(--text-muted)" }}>
                {company.phone}
              </span>
            </div>
          )}

          {company.website && (
            <div style={{ display:"flex",alignItems:"center",gap:5 }}>
              <Globe size={11} color="var(--text-muted)"/>
              <span style={{ fontSize:11,color:"var(--text-muted)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>
                {company.website}
              </span>
            </div>
          )}
        </div>

        {company.tags?.length>0 && (
          <div style={{ display:"flex",flexWrap:"wrap",gap:4,marginTop:10 }}>
            {company.tags.slice(0,3).map(t=>(
              <span key={t} style={{
                fontSize:10,padding:"2px 7px",borderRadius:99,
                background:"var(--bg-elevated)",color:"var(--text-muted)",
                border:"1px solid var(--border)"
              }}>
                {t}
              </span>
            ))}
          </div>
        )}
      </div>

      <div style={{
        padding:"10px 18px",
        borderTop:"1px solid var(--border)",
        display:"flex",
        alignItems:"center",
        justifyContent:"space-between",
        background:"var(--bg-elevated)"
      }}>
        
        {/* ✅ ADMIN ONLY BUTTONS */}
        <div style={{ display:"flex",gap:6 }}>
          {user?.role === "admin" && (
            <>
              <button
                onClick={(e)=>{ e.stopPropagation(); onEdit(company); }}
                className="btn btn-ghost btn-sm"
                style={{ padding:"4px 8px",color:"var(--text-muted)",fontSize:11 }}
                onMouseEnter={e=>{e.currentTarget.style.color="var(--accent)";e.currentTarget.style.background="var(--accent-soft)";}}
                onMouseLeave={e=>{e.currentTarget.style.color="var(--text-muted)";e.currentTarget.style.background="transparent";}}
              >
                <Edit3 size={12}/> Edit
              </button>

              <button
                onClick={(e)=>{ e.stopPropagation(); onDelete(company._id); }}
                className="btn btn-ghost btn-sm"
                style={{ padding:"4px 8px",color:"var(--text-muted)",fontSize:11 }}
                onMouseEnter={e=>{e.currentTarget.style.color="var(--rose)";e.currentTarget.style.background="var(--rose-soft)";}}
                onMouseLeave={e=>{e.currentTarget.style.color="var(--text-muted)";e.currentTarget.style.background="transparent";}}
              >
                <Trash2 size={12}/> Delete
              </button>
            </>
          )}
        </div>

        <span style={{ fontSize:11,color:"var(--text-muted)" }}>
          {company.meetingCount||0} meetings
        </span>
      </div>
    </div>
  );
}

/* ── Edit Modal ── */
function EditModal({ company, onClose, onSaved }) {
  const [saving,setSaving]=useState(false);
  const toast=useToast();
  const handleSubmit=async(data)=>{
    setSaving(true);
    try{ await companiesAPI.update(company._id,data); toast.success("Company updated!"); onSaved(); }
    catch{ toast.error("Failed to update."); }
    finally{setSaving(false);}
  };
  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:20 }}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="card animate-scaleIn" style={{ width:"100%",maxWidth:560,maxHeight:"90vh",overflowY:"auto",boxShadow:"var(--shadow-xl)" }}>
        <div style={{ padding:"16px 22px",borderBottom:"1px solid var(--border)",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,background:"var(--bg-card)",zIndex:10 }}>
          <h2 style={{ fontSize:16,fontWeight:700,color:"var(--text-primary)" }}>Edit Company</h2>
          <button onClick={onClose} className="btn btn-ghost btn-sm" style={{ padding:4 }}><X size={15}/></button>
        </div>
        <div style={{ padding:22 }}>
          <CompanyForm initial={company} onSubmit={handleSubmit} onCancel={onClose} saving={saving}/>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════ MAIN PAGE ════════════════════════ */
export default function Companies() {
  const [companies,setCompanies]=useState([]);
  const [loading,setLoading]=useState(true);
  const [search,setSearch]=useState("");
  const [statusF,setStatusF]=useState("all");
  const [editCompany,setEditCompany]=useState(null);
  const toast=useToast();
  const navigate = useNavigate();  // 👈 ADD HERE

  const load=useCallback(()=>{
    setLoading(true);
    const params={limit:100};
    if(statusF!=="all") params.status=statusF;
    companiesAPI.getAll(params).then(r=>setCompanies(r.data.data||[])).finally(()=>setLoading(false));
  },[statusF]);

  useEffect(()=>{load();},[load]);

  const handleDelete=async id=>{
    if(!window.confirm("Remove this company? All associated meeting data will be preserved.")) return;
    try{ await companiesAPI.delete(id); toast.success("Company removed."); load(); }
    catch{ toast.error("Could not remove company."); }
  };

  const filtered=companies.filter(c=>
    !search.trim()||c.name.toLowerCase().includes(search.toLowerCase())||
    (c.industry||"").toLowerCase().includes(search.toLowerCase())||
    (c.description||"").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ background:"var(--bg-base)",minHeight:"100vh" }}>
      <TopBar title="Companies" subtitle={`${companies.length} registered companies`}/>
      <div style={{ padding:"24px 32px",maxWidth:1280 }}>

        {/* Toolbar */}
        <div style={{ display:"flex",gap:10,marginBottom:24,flexWrap:"wrap",alignItems:"center" }}>
          <div style={{ flex:1,minWidth:220,position:"relative" }}>
            <Search size={14} color="var(--text-muted)" style={{ position:"absolute",left:12,top:"50%",transform:"translateY(-50%)" }}/>
            <input className="input" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name, industry, description…" style={{ paddingLeft:36 }}/>
          </div>
          <div style={{ display:"flex",gap:5 }}>
            <Filter size={13} color="var(--text-muted)" style={{ alignSelf:"center",marginRight:2 }}/>
            {["all","active","client","prospect","inactive"].map(f=>(
              <button key={f} onClick={()=>setStatusF(f)} className={`btn btn-sm ${statusF===f?"btn-primary":"btn-secondary"}`} style={{ textTransform:"capitalize" }}>{f}</button>
            ))}
          </div>
          <Link to="/companies/new" className="btn btn-primary btn-sm"><Plus size={14}/> Register Company</Link>
        </div>

        {/* Grid */}
        {loading?(
          <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:16 }}>
            {Array(6).fill(0).map((_,i)=>(
              <div key={i} className="card" style={{ height:200,padding:20 }}>
                {[70,50,40].map((w,j)=><div key={j} style={{ height:12,background:"var(--bg-elevated)",borderRadius:4,width:`${w}%`,marginBottom:10,animation:"shimmer 1.4s ease infinite",backgroundImage:"linear-gradient(90deg,var(--bg-elevated) 25%,var(--border) 50%,var(--bg-elevated) 75%)",backgroundSize:"200% 100%" }}/>)}
              </div>
            ))}
          </div>
        ):filtered.length===0?(
          <div style={{ textAlign:"center",padding:"80px 40px" }}>
            <div style={{ width:72,height:72,borderRadius:"var(--radius-lg)",background:"var(--accent-soft)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px" }}>
              <Building2 size={32} color="var(--accent)"/>
            </div>
            <h3 style={{ fontSize:18,fontWeight:700,color:"var(--text-primary)",marginBottom:8 }}>
              {search?"No companies match your search":"No companies registered yet"}
            </h3>
            <p style={{ fontSize:13,color:"var(--text-muted)",marginBottom:24,maxWidth:360,margin:"0 auto 24px" }}>
              {search?"Try a different search term.":"Register your first company to start tracking meetings and time."}
            </p>
            {!search&&<Link to="/companies/new" className="btn btn-primary btn-lg"><Plus size={16}/> Register First Company</Link>}
          </div>
        ):(
          <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:16 }}>
            {filtered.map(c=><CompanyCard key={c._id} company={c} onDelete={handleDelete} onEdit={setEditCompany}/>)}
          </div>
        )}
      </div>

      {editCompany&&<EditModal company={editCompany} onClose={()=>setEditCompany(null)} onSaved={()=>{setEditCompany(null);load();}}/>}
    </div>
  );
}
