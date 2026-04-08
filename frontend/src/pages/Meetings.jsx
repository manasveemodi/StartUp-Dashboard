import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Building2, Search, ChevronRight, Clock, Calendar,
  TrendingUp, Globe, Mail, Phone, Plus, ArrowRight
} from "lucide-react";
import { companiesAPI } from "../utils/api";
import TopBar from "../components/TopBar";

const statusConf = {
  active:   { color:"#059669", bg:"#d1fae5", label:"Active"   },
  inactive: { color:"#6b7280", bg:"#f3f4f6", label:"Inactive" },
  
};

function fmtTime(s) {
  if (!s) return null;
  const h = Math.floor(s/3600), m = Math.floor((s%3600)/60);
  return h>0 ? `${h}h ${m}m` : `${m}m`;
}

function Avatar({ name, size=48 }) {
  const ini = name.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();
  const pal = ["#4f46e5","#0891b2","#059669","#d97706","#7c3aed","#e11d48"];
  const c   = pal[name.charCodeAt(0) % pal.length];
  return (
    <div style={{ width:size,height:size,borderRadius:12,flexShrink:0,
      background:`${c}15`,border:`2px solid ${c}25`,
      display:"flex",alignItems:"center",justifyContent:"center",
      fontSize:size*0.34,fontWeight:800,color:c }}>
      {ini}
    </div>
  );
}

export default function Meetings() {
  const [companies, setCompanies] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState("");

  useEffect(() => {
    companiesAPI.getAll({ limit:100 })
      .then(r => setCompanies(r.data.data||[]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = companies.filter(c =>
    !search.trim() ||
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.industry||"").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ background:"var(--bg-base)", minHeight:"100vh" }}>
      <TopBar title="Meetings" subtitle="Select a company to open its meeting workspace"/>

      <div style={{ padding:"24px 32px", maxWidth:1200 }}>

        {/* Search */}
        <div style={{ position:"relative", marginBottom:24, maxWidth:440 }}>
          <Search size={14} color="var(--text-muted)" style={{ position:"absolute",left:12,top:"50%",transform:"translateY(-50%)" }}/>
          <input className="input" value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="Search companies…" style={{ paddingLeft:36 }}/>
        </div>

        {loading ? (
          <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
            {Array(5).fill(0).map((_,i)=>(
              <div key={i} className="card" style={{ height:80,padding:20,display:"flex",alignItems:"center",gap:14 }}>
                <div style={{ width:48,height:48,borderRadius:12,background:"var(--bg-elevated)",flexShrink:0 }}/>
                <div style={{ flex:1 }}>
                  <div style={{ height:14,background:"var(--bg-elevated)",borderRadius:4,width:"40%",marginBottom:8,animation:"shimmer 1.4s ease infinite",backgroundImage:"linear-gradient(90deg,var(--bg-elevated) 25%,var(--border) 50%,var(--bg-elevated) 75%)",backgroundSize:"200% 100%" }}/>
                  <div style={{ height:11,background:"var(--bg-elevated)",borderRadius:4,width:"25%",animation:"shimmer 1.4s ease infinite",backgroundImage:"linear-gradient(90deg,var(--bg-elevated) 25%,var(--border) 50%,var(--bg-elevated) 75%)",backgroundSize:"200% 100%" }}/>
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign:"center",padding:"80px 40px" }}>
            <div style={{ width:72,height:72,borderRadius:"var(--radius-lg)",background:"var(--accent-soft)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px" }}>
              <Building2 size={32} color="var(--accent)"/>
            </div>
            <h3 style={{ fontSize:17,fontWeight:700,color:"var(--text-primary)",marginBottom:8 }}>
              {search ? "No companies match your search" : "No companies registered yet"}
            </h3>
            <p style={{ fontSize:13,color:"var(--text-muted)",marginBottom:24 }}>
              {search ? "Try a different search term." : "Register a company first to start creating meetings."}
            </p>
            {!search && <Link to="/companies/new" className="btn btn-primary btn-lg"><Plus size={15}/> Register Company</Link>}
          </div>
        ) : (
          <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
            <div style={{ fontSize:11,fontWeight:600,color:"var(--text-muted)",letterSpacing:"0.5px",textTransform:"uppercase",marginBottom:4 }}>
              {filtered.length} {filtered.length===1?"company":"companies"} — click to open meeting workspace
            </div>

            {filtered.map((c, i) => {
              const sc = statusConf[c.status] || statusConf.active;
              const timeStr = fmtTime(c.totalTimeSpent);
              return (
                <Link key={c._id} to={`/meetings/${c._id}`} style={{ textDecoration:"none" }}>
                  <div className="card animate-fadeUp" style={{ animationDelay:`${i*0.04}s`,
                    display:"flex",alignItems:"center",gap:16,padding:"16px 20px",
                    transition:"all 0.2s",cursor:"pointer" }}
                    onMouseEnter={e=>{ e.currentTarget.style.borderColor="var(--accent)"; e.currentTarget.style.transform="translateX(3px)"; e.currentTarget.style.boxShadow="var(--shadow-md)"; }}
                    onMouseLeave={e=>{ e.currentTarget.style.borderColor="var(--border)"; e.currentTarget.style.transform="none"; e.currentTarget.style.boxShadow="var(--shadow-sm)"; }}>

                    <Avatar name={c.name} size={48}/>

                    <div style={{ flex:1,minWidth:0 }}>
                      <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:4 }}>
                        <span style={{ fontSize:15,fontWeight:700,color:"var(--text-primary)" }}>{c.name}</span>
                        <span className="badge" style={{ background:sc.bg,color:sc.color,fontSize:10 }}>{sc.label}</span>
                      </div>
                      <div style={{ display:"flex",flexWrap:"wrap",gap:12 }}>
                        {c.industry&&<span style={{ fontSize:12,color:"var(--text-muted)" }}>{c.industry}</span>}
                        {c.email&&<div style={{ display:"flex",alignItems:"center",gap:4 }}><Mail size={11} color="var(--text-muted)"/><span style={{ fontSize:12,color:"var(--text-muted)" }}>{c.email}</span></div>}
                        {c.phone&&<div style={{ display:"flex",alignItems:"center",gap:4 }}><Phone size={11} color="var(--text-muted)"/><span style={{ fontSize:12,color:"var(--text-muted)" }}>{c.phone}</span></div>}
                      </div>
                    </div>

                    {/* Stats */}
                    <div style={{ display:"flex",gap:16,flexShrink:0 }}>
                      {(c.meetingCount||0) > 0 && (
                        <div style={{ textAlign:"center" }}>
                          <div style={{ fontSize:16,fontWeight:800,color:"var(--accent)" }}>{c.meetingCount}</div>
                          <div style={{ fontSize:10,color:"var(--text-muted)" }}>meetings</div>
                        </div>
                      )}
                      {timeStr && (
                        <div style={{ textAlign:"center" }}>
                          <div style={{ fontSize:14,fontWeight:800,color:"var(--teal)",fontFamily:"JetBrains Mono" }}>{timeStr}</div>
                          <div style={{ fontSize:10,color:"var(--text-muted)" }}>spent</div>
                        </div>
                      )}
                    </div>

                    <div style={{ width:32,height:32,borderRadius:"var(--radius-sm)",background:"var(--accent-soft)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                      <ArrowRight size={15} color="var(--accent)"/>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
