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
import Sidebar from "../components/Sidebar";

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

/* ─── STAT CARD ───────────────────────── */
function StatCard({ icon: Icon, label, value, color, bg }) {
  return (
    <div
      style={{
        padding: "24px 20px",
        background: bg,
        borderRadius: "18px",
      }}
    >
      <div style={{ marginBottom: 14 }}>
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
          <Icon size={18} color={color} />
        </div>
      </div>

      <div style={{ fontSize: 28, fontWeight: 800, color }}>
        {value ?? "—"}
      </div>

      <div style={{ fontSize: 13, color, opacity: 0.7 }}>
        {label}
      </div>
    </div>
  );
}

/* ─── TOOLTIP ───────────────────────── */
const CTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ padding: 10, background: "#fff", border: "1px solid #ddd" }}>
      {label && <div>{label}</div>}
      {payload.map((p) => (
        <div key={p.name}>{p.name}: {p.value}</div>
      ))}
    </div>
  );
};

/* ─── MAIN DASHBOARD ───────────────────────── */
export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    meetingsAPI
      .getStats()
      .then((r) => {
        const result = r.data?.data || r.data;
        setData(result);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const today = format(new Date(), "EEEE, MMMM d, yyyy");

  const statusData = [
    { name: "Scheduled", value: data?.counts?.scheduledMeetings || 0, color: "#6366f1" },
    { name: "Ongoing", value: data?.counts?.ongoingMeetings || 0, color: "#059669" },
    { name: "Completed", value: data?.counts?.completedMeetings || 0, color: "#0891b2" },
  ];

  const priorityData = [
    { name: "High", value: data?.notesByPriority?.high || 0 },
    { name: "Medium", value: data?.notesByPriority?.medium || 0 },
    { name: "Low", value: data?.notesByPriority?.low || 0 },
  ];

  return (
    <div style={{ display: "flex" }}>

      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      {/* Main Content */}
      <div
        style={{
          flex: 1,
          marginLeft: window.innerWidth >= 768 ? "var(--sidebar-width)" : 0,
          background: "var(--bg-base)",
          minHeight: "100vh",
        }}
      >
        <TopBar
          title="Dashboard"
          subtitle={today}
          onMenuClick={() => setIsSidebarOpen(true)}
        />

        <div style={{ padding: 20 }}>

          {/* Stats */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(4,1fr)",
            gap: 16
          }}>
            <StatCard icon={Calendar} label="Meetings" value={data?.counts?.totalMeetings} color="#4f46e5" bg="#eef2ff"/>
            <StatCard icon={TrendingUp} label="Completed" value={data?.counts?.completedMeetings} color="#059669" bg="#ecfdf5"/>
            <StatCard icon={FileText} label="Notes" value={data?.counts?.totalNotes} color="#b45309" bg="#fffbeb"/>
            <StatCard icon={Mic} label="Recordings" value={data?.counts?.totalRecordings} color="#e11d48" bg="#fff1f2"/>
          </div>

          {/* Charts */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 20,
            marginTop: 30
          }}>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={statusData} dataKey="value">
                  {statusData.map((e, i) => (
                    <Cell key={i} fill={e.color} />
                  ))}
                </Pie>
                <Tooltip content={<CTooltip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>

            <ResponsiveContainer width="100%" height={250}>
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

          {/* Recent */}
          <div style={{ marginTop: 30 }}>
            <h3>Recent Meetings</h3>

            {!data?.recentMeetings?.length ? (
              <div>No meetings</div>
            ) : (
              data.recentMeetings.map((m) => (
                <div key={m._id} style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: 10,
                  borderBottom: "1px solid #eee"
                }}>
                  <div>{m.title}</div>
                  <span>{m.status}</span>
                </div>
              ))
            )}
          </div>

        </div>
      </div>
    </div>
  );
}