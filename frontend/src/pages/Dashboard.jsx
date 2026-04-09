import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";
import {
  Calendar, FileText, Mic, TrendingUp,
  Activity, ChevronRight, BarChart2
} from "lucide-react";
import { meetingsAPI } from "../utils/api";
import { useAuth } from "../context/AuthContext";
import TopBar from "../components/TopBar";
import Sidebar from "../components/Sidebar"; // ✅ ADDED

const statusColors = {
  scheduled: "#6366f1",
  ongoing: "#059669",
  completed: "#0891b2",
  cancelled: "#e11d48",
};

const priorityColors = {
  high: "#e11d48",
  medium: "#d97706",
  low: "#059669",
};

// --- STATCARD COMPONENT ---
function StatCard({ icon: Icon, label, value, color, bg, delay = "0s" }) {
  return (
    <div
      className="animate-fadeUp"
      style={{
        padding: "24px 20px",
        animationDelay: delay,
        background: bg,
        borderRadius: "18px",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: "10px",
            background: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon size={18} color={color} strokeWidth={2.5} />
        </div>
      </div>

      <div style={{ fontSize: 32, fontWeight: 800, color, marginBottom: 4 }}>
        {value ?? "—"}
      </div>

      <div style={{ fontSize: 13, color, fontWeight: 600, opacity: 0.7 }}>
        {label}
      </div>
    </div>
  );
}

// --- TOOLTIP ---
const CTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="card" style={{ padding: "10px 14px", fontSize: 12 }}>
      {label && <div style={{ marginBottom: 6 }}>{label}</div>}
      {payload.map((p) => (
        <div key={p.name} style={{ color: p.color, fontWeight: 600 }}>
          {p.name}: {p.value}
        </div>
      ))}
    </div>
  );
};

// --- MAIN DASHBOARD ---
export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // ✅ ADDED

  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    meetingsAPI
      .getStats()
      .then((r) => {
        const result = r.data?.data || r.data;
        setData(result);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const today = format(new Date(), "EEEE, MMMM d, yyyy");

  const statusData = data?.counts
    ? [
        { name: "Scheduled", value: data.counts.scheduledMeetings || 0, color: "#6366f1" },
        { name: "Ongoing", value: data.counts.ongoingMeetings || 0, color: "#059669" },
        { name: "Completed", value: data.counts.completedMeetings || 0, color: "#0891b2" },
      ]
    : [];

  const priorityData = data?.notesByPriority
    ? [
        { name: "High", value: data.notesByPriority.high || 0 },
        { name: "Medium", value: data.notesByPriority.medium || 0 },
        { name: "Low", value: data.notesByPriority.low || 0 },
      ]
    : [];

  return (
    <div style={{ background: "var(--bg-base)", minHeight: "100vh" }}>

      {/* ✅ Sidebar (floating, no layout impact) */}
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      {/* ✅ TopBar with hamburger */}
      <TopBar
        title="Dashboard"
        subtitle={today}
        onMenuClick={() => setIsSidebarOpen(true)}
      />

      {/* ✅ ORIGINAL UI BELOW (UNCHANGED) */}
      <div style={{ padding: "28px 32px", maxWidth: 1280, margin: "0 auto" }}>

        {/* Welcome Banner */}
        <div className="animate-fadeUp" style={{
          background: "linear-gradient(135deg, var(--accent), var(--teal))",
          borderRadius: "var(--radius-lg)",
          padding: "28px 32px",
          marginBottom: 28,
          display: "flex",
          justifyContent: "space-between"
        }}>
          <div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)" }}>
              Welcome back
            </div>
            <h2 style={{ fontSize: 24, color: "#fff" }}>
              {greeting}, {user?.name?.split(" ")[0] || "there"} 👋
            </h2>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.75)" }}>
              {loading
                ? "Loading workspace..."
                : `You have ${data?.counts?.ongoingMeetings || 0} ongoing meetings`}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
          <StatCard icon={Calendar} label="Total Meetings" value={data?.counts?.totalMeetings} color="#4f46e5" bg="#eef2ff" />
          <StatCard icon={TrendingUp} label="Completed" value={data?.counts?.completedMeetings} color="#059669" bg="#ecfdf5" />
          <StatCard icon={FileText} label="Notes Created" value={data?.counts?.totalNotes} color="#b45309" bg="#fffbeb" />
          <StatCard icon={Mic} label="Recordings" value={data?.counts?.totalRecordings} color="#e11d48" bg="#fff1f2" />
        </div>

        {/* Charts */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 24 }}>
          
          {/* Pie */}
          <div className="card" style={{ padding: 20 }}>
            <span>Meetings by Status</span>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={statusData} dataKey="value" innerRadius={50} outerRadius={80}>
                  {statusData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip content={<CTooltip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Bar */}
          <div className="card" style={{ padding: 20 }}>
            <span>Notes by Priority</span>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={priorityData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip content={<CTooltip />} />
                <Bar dataKey="value">
                  {priorityData.map((e, i) => (
                    <Cell key={i} fill={priorityColors[e.name.toLowerCase()]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Meetings */}
        <div className="card" style={{ marginTop: 24 }}>
          <div style={{ padding: 16, borderBottom: "1px solid var(--border)" }}>
            Recent Meetings
          </div>

          {!data?.recentMeetings?.length ? (
            <div style={{ padding: 40, textAlign: "center" }}>
              No recent meetings
            </div>
          ) : (
            data.recentMeetings.map((m) => (
              <div key={m._id} style={{ padding: 16, borderBottom: "1px solid var(--border)" }}>
                {m.title}
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}