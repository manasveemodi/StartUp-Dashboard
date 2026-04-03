import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";
import {
  Calendar, FileText, Mic, TrendingUp, Clock,
  Plus, Activity, Target, ChevronRight, BarChart2
} from "lucide-react";
import { meetingsAPI } from "../utils/api";
import { useAuth } from "../context/AuthContext";
import TopBar from "../components/TopBar";

const statusColors = { scheduled: "#6366f1", ongoing: "#059669", completed: "#0891b2", cancelled: "#e11d48" };
const priorityColors = { high: "#e11d48", medium: "#d97706", low: "#059669" };

// --- FIXED STATCARD COMPONENT ---
function StatCard({ icon: Icon, label, value, color, bg, delay = "0s" }) {
  return (
    <div className="animate-fadeUp" style={{ 
      padding: "24px 20px", 
      animationDelay: delay,
      background: bg, 
      borderRadius: "18px", 
      display: "flex", 
      flexDirection: "column",
      transition: "transform 0.2s ease",
      cursor: "default"
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        {/* White Icon Box for high contrast */}
        <div style={{ 
          width: 38, height: 38, 
          borderRadius: "10px", 
          background: "#fff", 
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 4px 12px rgba(0,0,0,0.03)" 
        }}>
          <Icon size={18} color={color} strokeWidth={2.5} />
        </div>
      </div>
      
      {/* Large Value - Uses the deep version of the theme color */}
      <div style={{ 
        fontSize: 32, 
        fontWeight: 800, 
        color: color, 
        lineHeight: 1, 
        marginBottom: 4, 
        letterSpacing: "-1px" 
      }}>
        {value ?? "—"}
      </div>
      
      {/* Label - Uses semi-transparent theme color */}
      <div style={{ 
        fontSize: 13, 
        color: color, 
        fontWeight: 600, 
        opacity: 0.7 
      }}>
        {label}
      </div>
    </div>
  );
}

const CTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="card" style={{ padding: "10px 14px", fontSize: 12, boxShadow: "var(--shadow-lg)" }}>
      {label && <div style={{ color: "var(--text-muted)", marginBottom: 6, fontWeight: 500 }}>{label}</div>}
      {payload.map(p => <div key={p.name} style={{ color: p.color || "var(--accent)", fontWeight: 600 }}>{p.name}: {p.value}</div>)}
    </div>
  );
};

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    meetingsAPI.getStats().then(r => setData(r.data.data)).catch(() => { }).finally(() => setLoading(false));
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const today = format(new Date(), "EEEE, MMMM d, yyyy");

  const statusData = data ? [
    { name: "Scheduled", value: data.counts.scheduledMeetings, color: "#6366f1" },
    { name: "Ongoing", value: data.counts.ongoingMeetings, color: "#059669" },
    { name: "Completed", value: data.counts.completedMeetings, color: "#0891b2" },
  ] : [];

  const priorityData = data ? [
    { name: "High", value: data.notesByPriority?.high || 0 },
    { name: "Medium", value: data.notesByPriority?.medium || 0 },
    { name: "Low", value: data.notesByPriority?.low || 0 },
  ] : [];

  return (
    <div style={{ background: "var(--bg-base)", minHeight: "100vh" }}>
      <TopBar title="Dashboard" subtitle={today} />

      <div style={{ padding: "28px 32px", maxWidth: 1280 }}>
        {/* Welcome banner */}
        <div className="animate-fadeUp" style={{
          background: "linear-gradient(135deg, var(--accent) 0%, var(--teal) 100%)",
          borderRadius: "var(--radius-lg)", padding: "28px 32px", marginBottom: 28,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          boxShadow: "0 8px 32px var(--accent-glow)",
          position: "relative", overflow: "hidden",
        }}>
          <div style={{ position: "absolute", top: -30, right: -30, width: 180, height: 180, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
          <div style={{ position: "absolute", bottom: -50, right: 80, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.04)" }} />
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.7)", letterSpacing: "1px", marginBottom: 6, textTransform: "uppercase" }}>Welcome back</div>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: "#fff", letterSpacing: "-0.5px", marginBottom: 6 }}>{greeting}, {user?.name?.split(" ")[0] || "there"} 👋</h2>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", fontWeight: 400 }}>
              {loading ? "Loading your workspace…" : `You have ${data?.counts?.ongoingMeetings || 0} ongoing meetings and ${data?.actionItems?.total - data?.actionItems?.done || 0} pending action items.`}
            </p>
          </div>
          
        </div>

        {/* --- STAT CARDS SECTION (FIXED COLORS) --- */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 24 }}>
          <StatCard icon={Calendar}   label="Total Meetings" value={loading ? "—" : data?.counts?.totalMeetings}     color="#4f46e5" bg="#eef2ff" delay="0s" />
          <StatCard icon={TrendingUp} label="Completed"      value={loading ? "—" : data?.counts?.completedMeetings} color="#059669" bg="#ecfdf5" delay="0.05s" />
          <StatCard icon={FileText}   label="Notes Created"   value={loading ? "—" : data?.counts?.totalNotes}        color="#b45309" bg="#fffbeb" delay="0.10s" />
          <StatCard icon={Mic}        label="Recordings"      value={loading ? "—" : data?.counts?.totalRecordings}   color="#e11d48" bg="#fff1f2" delay="0.15s" />
        </div>

        {/* Charts row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 24 }}>
          <div className="card animate-fadeUp delay-2" style={{ padding: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <BarChart2 size={15} color="var(--accent)" />
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>Meetings by Status</span>
            </div>
            {loading ? <div style={{ height: 180, display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ width: 32, height: 32, border: "3px solid var(--border)", borderTopColor: "var(--accent)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /></div>
              : <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={52} outerRadius={78} paddingAngle={3} dataKey="value" strokeWidth={0}>
                    {statusData.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip content={<CTooltip />} />
                  <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 11, color: "var(--text-secondary)" }} />
                </PieChart>
              </ResponsiveContainer>
            }
          </div>

          <div className="card animate-fadeUp delay-3" style={{ padding: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <FileText size={15} color="var(--amber)" />
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>Notes by Priority</span>
            </div>
            {loading ? <div style={{ height: 180, display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ width: 32, height: 32, border: "3px solid var(--border)", borderTopColor: "var(--accent)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /></div>
              : <ResponsiveContainer width="100%" height={180}>
                <BarChart data={priorityData} barSize={28} barGap={6}>
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CTooltip />} />
                  <Bar dataKey="value" name="Notes" radius={[4, 4, 0, 0]}>
                    {priorityData.map((e, i) => <Cell key={i} fill={priorityColors[e.name.toLowerCase()] || "#6366f1"} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            }
          </div>

          <div className="card animate-fadeUp delay-4" style={{ padding: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <Target size={15} color="var(--green)" />
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>Action Items</span>
            </div>
            {loading ? <div style={{ height: 180, display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ width: 32, height: 32, border: "3px solid var(--border)", borderTopColor: "var(--accent)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /></div>
              : data && <div style={{ height: 180, display: "flex", flexDirection: "column", justifyContent: "center", gap: 16 }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 48, fontWeight: 900, color: "var(--green)", lineHeight: 1, letterSpacing: "-2px" }}>{data.actionItems?.rate || 0}<span style={{ fontSize: 24 }}>%</span></div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4, fontWeight: 500 }}>Completion Rate</div>
                </div>
                <div>
                  <div style={{ height: 6, background: "var(--bg-elevated)", borderRadius: 99, overflow: "hidden", marginBottom: 8 }}>
                    <div style={{ height: "100%", width: `${data.actionItems?.rate || 0}%`, background: "linear-gradient(90deg, var(--green), var(--teal))", borderRadius: 99, transition: "width 1.2s cubic-bezier(0.16,1,0.3,1)" }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    {[["Done", data.actionItems?.done, "var(--green)"], ["Pending", (data.actionItems?.total || 0) - (data.actionItems?.done || 0), "var(--amber)"], ["Total", data.actionItems?.total, "var(--text-secondary)"]].map(([l, v, c]) => (
                      <div key={l} style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 18, fontWeight: 800, color: c }}>{v}</div>
                        <div style={{ fontSize: 10, color: "var(--text-muted)" }}>{l}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            }
          </div>
        </div>

        {/* Recent meetings */}
        <div className="card animate-fadeUp delay-5">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Activity size={15} color="var(--accent)" />
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>Recent Meetings</span>
            </div>
            <Link to="/meetings" className="btn btn-ghost btn-sm" style={{ fontSize: 12 }}>View all <ChevronRight size={13} /></Link>
          </div>

          {loading ? (
            <div style={{ padding: 40, textAlign: "center" }}>
              <div style={{ width: 32, height: 32, border: "3px solid var(--border)", borderTopColor: "var(--accent)", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto" }} />
            </div>
          ) : !data?.recentMeetings?.length ? (
            <div style={{ padding: 48, textAlign: "center" }}>
              <Calendar size={36} color="var(--text-muted)" style={{ marginBottom: 12 }} />
              <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 16 }}>No meetings yet. Create your first one to get started.</p>
              <Link to="/meetings" className="btn btn-primary btn-sm">
                <Plus size={13} /> Create Meeting
              </Link>
            </div>
          ) : data.recentMeetings.map((m, i) => {
            const sc = statusColors[m.status] || "#6366f1";
            return (
              <Link key={m._id} to={`/meetings/${m._id}`}
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", textDecoration: "none", borderBottom: i < data.recentMeetings.length - 1 ? "1px solid var(--border)" : "none", transition: "background 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.background = "var(--bg-elevated)"}
                onMouseLeave={e => e.currentTarget.style.background = "none"}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: "var(--radius-sm)", background: `${sc}15`, border: `1px solid ${sc}30`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Calendar size={15} color={sc} />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 2 }}>{m.title}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <Clock size={10} color="var(--text-muted)" />
                      <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "JetBrains Mono" }}>{format(new Date(m.createdAt), "MMM d, yyyy · HH:mm")}</span>
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span className="badge" style={{ background: `${sc}15`, color: sc }}>{m.status}</span>
                  <ChevronRight size={14} color="var(--text-muted)" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}