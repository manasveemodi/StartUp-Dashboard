import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Building2, Search, ArrowRight, Clock, Calendar,
  ChevronRight, Sparkles, PlusCircle
} from "lucide-react";
import { companiesAPI } from "../utils/api";
import TopBar           from "../components/TopBar";

const statusConf = {
  active:   { color:"#059669", bg:"#d1fae5", label:"Active"   },
  inactive: { color:"#6b7280", bg:"#f3f4f6", label:"Inactive" },
  
};

function fmtTime(s) {
  if (!s) return "No time recorded";
  const h = Math.floor(s/3600), m = Math.floor((s%3600)/60);
  return h > 0 ? `${h}h ${m}m spent` : `${m}m spent`;
}

export default function MeetingList() {
  const [companies, setCompanies] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState("");

  useEffect(() => {
    companiesAPI.getAll({ limit:100 })
      .then(r => setCompanies(r.data.data || []))
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

      <div style={{ padding:"24px 32px", maxWidth:900, margin:"0 auto" }}>

        {/* Hero instruction */}
        <div className="animate-fadeUp" style={{
          padding:"20px 24px", borderRadius:"var(--radius-lg)", marginBottom:24,
          background:"linear-gradient(135deg, var(--accent-soft), var(--teal-soft))",
          border:"1px solid var(--accent-glow)",
          display:"flex", alignItems:"center", gap:16,
        }}>
          <div style={{ width:44, height:44, borderRadius:"var(--radius-sm)", background:"var(--accent)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            <Sparkles size={20} color="#fff"/>
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:14, fontWeight:700, color:"var(--text-primary)", marginBottom:3 }}>Select a company to start a meeting</div>
            <div style={{ fontSize:12, color:"var(--text-secondary)", lineHeight:1.5 }}>
              Click any company below to open its workspace — create notes with timestamps, record audio, and track time spent.
            </div>
          </div>
         
        </div>

        {/* Search */}
        <div style={{ position:"relative", marginBottom:20 }}>
          <Search size={13} color="var(--text-muted)" style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)" }}/>
          <input className="input" value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="Search companies by name or industry…" style={{ paddingLeft:34 }}/>
        </div>

        {/* Company rows */}
        {loading ? (
          <div className="card" style={{ padding:0, overflow:"hidden" }}>
            {Array(5).fill(0).map((_,i)=>(
              <div key={i} style={{ padding:"16px 20px", borderBottom:"1px solid var(--border)", display:"flex", alignItems:"center", gap:14 }}>
                <div style={{ width:40, height:40, borderRadius:"var(--radius-sm)", background:"var(--bg-elevated)", flexShrink:0, animation:"shimmer 1.4s ease infinite", backgroundImage:"linear-gradient(90deg,var(--bg-elevated) 25%,var(--border) 50%,var(--bg-elevated) 75%)", backgroundSize:"200% 100%" }}/>
                <div style={{ flex:1 }}>
                  <div style={{ height:13, background:"var(--bg-elevated)", borderRadius:4, width:"40%", marginBottom:8, animation:"shimmer 1.4s ease infinite", backgroundImage:"linear-gradient(90deg,var(--bg-elevated) 25%,var(--border) 50%,var(--bg-elevated) 75%)", backgroundSize:"200% 100%" }}/>
                  <div style={{ height:11, background:"var(--bg-elevated)", borderRadius:4, width:"25%", animation:"shimmer 1.4s ease infinite", backgroundImage:"linear-gradient(90deg,var(--bg-elevated) 25%,var(--border) 50%,var(--bg-elevated) 75%)", backgroundSize:"200% 100%" }}/>
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign:"center", padding:"60px 40px" }}>
            <Building2 size={44} color="var(--text-muted)" style={{ marginBottom:16 }}/>
            <h3 style={{ fontSize:16, fontWeight:700, color:"var(--text-primary)", marginBottom:8 }}>
              {search ? "No companies match your search" : "No companies registered yet"}
            </h3>
            <p style={{ fontSize:13, color:"var(--text-muted)", marginBottom:20 }}>
              {search ? "Try a different search term." : "Register a company first to start tracking meetings."}
            </p>
            <Link to="/companies/new" className="btn btn-primary"><PlusCircle size={14}/> Register Company</Link>
          </div>
        ) : (
          <div className="card animate-fadeUp" style={{ padding:0, overflow:"hidden" }}>
            {filtered.map((c, i) => {
              const sc  = statusConf[c.status] || statusConf.active;
              const ini = c.name.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();
              const pal = ["#4f46e5","#0891b2","#059669","#d97706","#7c3aed","#e11d48"];
              const col = pal[c.name.charCodeAt(0)%pal.length];
              return (
                <Link key={c._id} to={`/meetings/${c._id}`}
                  style={{ display:"flex", alignItems:"center", gap:14, padding:"14px 20px", textDecoration:"none", borderBottom:i<filtered.length-1?"1px solid var(--border)":"none", transition:"background 0.15s", borderLeft:"3px solid transparent" }}
                  onMouseEnter={e=>{ e.currentTarget.style.background="var(--bg-elevated)"; e.currentTarget.style.borderLeftColor="var(--accent)"; }}
                  onMouseLeave={e=>{ e.currentTarget.style.background="none"; e.currentTarget.style.borderLeftColor="transparent"; }}>

                  {/* Avatar */}
                  <div style={{ width:42, height:42, borderRadius:"var(--radius-sm)", flexShrink:0, background:`${col}15`, border:`1.5px solid ${col}25`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:800, color:col }}>
                    {ini}
                  </div>

                  {/* Info */}
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:3 }}>
                      <span style={{ fontSize:14, fontWeight:700, color:"var(--text-primary)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{c.name}</span>
                      <span className="badge" style={{ background:sc.bg, color:sc.color, fontSize:10, flexShrink:0 }}>{sc.label}</span>
                    </div>
                    <div style={{ display:"flex", alignItems:"center", gap:14 }}>
                      {c.industry && <span style={{ fontSize:11, color:"var(--text-muted)" }}>{c.industry}</span>}
                      <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                        <Calendar size={10} color="var(--text-muted)"/>
                        <span style={{ fontSize:11, color:"var(--text-muted)" }}>{c.meetingCount||0} meetings</span>
                      </div>
                      <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                        <Clock size={10} color={c.totalTimeSpent>0?"var(--teal)":"var(--text-muted)"}/>
                        <span style={{ fontSize:11, color:c.totalTimeSpent>0?"var(--teal)":"var(--text-muted)", fontWeight:c.totalTimeSpent>0?600:400 }}>
                          {fmtTime(c.totalTimeSpent)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* CTA */}
                  <div style={{ display:"flex", alignItems:"center", gap:6, padding:"7px 14px", borderRadius:"var(--radius-sm)", background:"var(--accent-soft)", border:"1px solid var(--accent-glow)", flexShrink:0 }}>
                    <span style={{ fontSize:12, fontWeight:600, color:"var(--accent-text)" }}>Open</span>
                    <ChevronRight size={13} color="var(--accent)"/>
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
