import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import {
  Building2, Plus, Search, Trash2, ArrowRight,
  Globe, Mail, Phone, Tag, Clock, Filter, PlusCircle
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

function fmtTime(s) {
  if (!s) return null;
  const h = Math.floor(s/3600), m = Math.floor((s%3600)/60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function CompanyCard({ company, onDelete }) {
  const sc  = statusConf[company.status] || statusConf.active;
  const ini = company.name.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();
  const pal = ["#4f46e5","#0891b2","#059669","#d97706","#7c3aed","#e11d48"];
  const col = pal[company.name.charCodeAt(0) % pal.length];
  const timeStr = fmtTime(company.totalTimeSpent);

  return (
    <div className="card card-hover animate-fadeUp" style={{ display:"flex", flexDirection:"column", overflow:"hidden", cursor:"pointer" }}>
      <div style={{ height:3, background:col }}/>
      <div style={{ padding:"18px 18px 14px" }}>
        <div style={{ display:"flex", alignItems:"flex-start", gap:12, marginBottom:12 }}>
          <div style={{ width:44, height:44, borderRadius:"var(--radius-sm)", flexShrink:0, background:`${col}15`, border:`1.5px solid ${col}30`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:800, color:col }}>
            {ini}
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:8, marginBottom:2 }}>
              <h3 style={{ fontSize:14, fontWeight:700, color:"var(--text-primary)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{company.name}</h3>
              <span className="badge" style={{ background:sc.bg, color:sc.color, flexShrink:0 }}>{sc.label}</span>
            </div>
            {company.industry && <div style={{ fontSize:11, color:"var(--text-muted)" }}>{company.industry}</div>}
            {/* Formatted creation date */}
            {company.createdAt && (
              <div style={{ fontSize:11, color:"var(--text-muted)" }}>
                Joined: {format(new Date(company.createdAt), 'dd/MM/yyyy')}
              </div>
            )}
          </div>
        </div>

        {company.description && (
          <p style={{ fontSize:12, color:"var(--text-secondary)", lineHeight:1.6, marginBottom:10, display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" }}>
            {company.description}
          </p>
        )}

        <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
          {company.email   && <div style={{ display:"flex", alignItems:"center", gap:5 }}><Mail  size={10} color="var(--text-muted)"/><span style={{ fontSize:11, color:"var(--text-muted)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{company.email}</span></div>}
          {company.website && <div style={{ display:"flex", alignItems:"center", gap:5 }}><Globe size={10} color="var(--text-muted)"/><span style={{ fontSize:11, color:"var(--text-muted)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{company.website}</span></div>}
          {company.phone   && <div style={{ display:"flex", alignItems:"center", gap:5 }}><Phone size={10} color="var(--text-muted)"/><span style={{ fontSize:11, color:"var(--text-muted)" }}>{company.phone}</span></div>}
        </div>

        {company.tags?.length > 0 && (
          <div style={{ display:"flex", flexWrap:"wrap", gap:4, marginTop:10 }}>
            {company.tags.slice(0,3).map(t=>(
              <span key={t} style={{ display:"flex", alignItems:"center", gap:3, padding:"2px 7px", borderRadius:99, fontSize:10, background:"var(--bg-elevated)", color:"var(--text-muted)", border:"1px solid var(--border)" }}>
                <Tag size={8}/>{t}
              </span>
            ))}
          </div>
        )}
      </div>

      <div style={{ padding:"10px 18px", borderTop:"1px solid var(--border)", background:"var(--bg-elevated)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ display:"flex", gap:12 }}>
          {company.meetingCount > 0 && <span style={{ fontSize:11, color:"var(--text-muted)" }}>{company.meetingCount} meetings</span>}
          {timeStr && (
            <div style={{ display:"flex", alignItems:"center", gap:4 }}>
              <Clock size={10} color="var(--teal)"/>
              <span style={{ fontSize:11, color:"var(--teal)", fontWeight:600 }}>{timeStr}</span>
            </div>
          )}
        </div>
        <div style={{ display:"flex", gap:4 }}>
          <button onClick={e=>{ e.preventDefault(); e.stopPropagation(); onDelete(company._id); }}
            className="btn btn-ghost btn-sm" style={{ padding:"4px 7px", color:"var(--text-muted)" }}
            onMouseEnter={e=>{e.currentTarget.style.color="var(--rose)";e.currentTarget.style.background="var(--rose-soft)";}}
            onMouseLeave={e=>{e.currentTarget.style.color="var(--text-muted)";e.currentTarget.style.background="transparent";}}>
            <Trash2 size={12}/>
          </button>
          <span style={{ display:"flex", alignItems:"center", padding:"4px 7px", borderRadius:"var(--radius-xs)", background:"var(--accent-soft)" }}>
            <ArrowRight size={12} color="var(--accent)"/>
          </span>
        </div>
      </div>
    </div>
  );
}

export default function CompanyList() {
  const [companies, setCompanies] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState("");
  const [statusF,   setStatusF]   = useState("all");
  const toast = useToast();

  const load = useCallback(() => {
    setLoading(true);
    const params = { limit:100 };
    if (statusF !== "all") params.status = statusF;
    if (search.trim()) params.search = search.trim();
    companiesAPI.getAll(params)
      .then(r => setCompanies(r.data.data || []))
      .finally(() => setLoading(false));
  }, [statusF, search]);

  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t); }, [load]);

  const handleDelete = async id => {
    if (!window.confirm("Remove this company?")) return;
    try { await companiesAPI.delete(id); toast.success("Company removed."); load(); }
    catch { toast.error("Could not remove company."); }
  };

  return (
    <div style={{ background:"var(--bg-base)", minHeight:"100vh" }}>
      <TopBar title="Companies" subtitle={`${companies.length} registered companies`}/>

      <div style={{ padding:"24px 32px", maxWidth:1280 }}>
        {/* Toolbar */}
        <div style={{ display:"flex", gap:10, marginBottom:24, flexWrap:"wrap", alignItems:"center" }}>
          <div style={{ flex:1, minWidth:220, position:"relative" }}>
            <Search size={13} color="var(--text-muted)" style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)" }}/>
            <input className="input" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search companies…" style={{ paddingLeft:34 }}/>
          </div>
          <div style={{ display:"flex", gap:6 }}>
            <Filter size={13} color="var(--text-muted)" style={{ alignSelf:"center" }}/>
            {["all","active","client","prospect","inactive"].map(f=>(
              <button key={f} onClick={()=>setStatusF(f)} className={`btn btn-sm ${statusF===f?"btn-primary":"btn-secondary"}`} style={{ textTransform:"capitalize" }}>{f}</button>
            ))}
          </div>
          <Link to="/companies/new" className="btn btn-primary btn-sm"><Plus size={14}/> Add Company</Link>
          
        </div>

        {/* Grid */}
        {loading ? (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(290px,1fr))", gap:16 }}>
            {Array(6).fill(0).map((_,i)=>(
              <div key={i} className="card" style={{ height:200, padding:20 }}>
                {[70,50,40].map((w,j)=><div key={j} style={{ height:11, background:"var(--bg-elevated)", borderRadius:4, width:`${w}%`, marginBottom:10, animation:"shimmer 1.4s ease infinite", backgroundImage:"linear-gradient(90deg,var(--bg-elevated) 25%,var(--border) 50%,var(--bg-elevated) 75%)", backgroundSize:"200% 100%" }}/>)}
              </div>
            ))}
          </div>
        ) : companies.length === 0 ? (
          <div style={{ textAlign:"center", padding:"80px 40px" }}>
            <div style={{ width:72, height:72, borderRadius:"var(--radius-lg)", background:"var(--accent-soft)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 20px" }}>
              <Building2 size={30} color="var(--accent)"/>
            </div>
            <h3 style={{ fontSize:18, fontWeight:700, color:"var(--text-primary)", marginBottom:8 }}>No companies yet</h3>
            <p style={{ fontSize:13, color:"var(--text-muted)", marginBottom:24, maxWidth:360, margin:"0 auto 24px" }}>
              Register your first company to start tracking meetings, notes, recordings, and time spent.
            </p>
            <Link to="/companies/new" className="btn btn-primary btn-lg"><PlusCircle size={15}/> Register First Company</Link>
          </div>
        ) : (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(290px,1fr))", gap:16 }}>
            {companies.map(c=>(
              <Link key={c._id} to={`/meetings/${c._id}`} style={{ textDecoration:"none" }}>
                <CompanyCard company={c} onDelete={handleDelete}/>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}