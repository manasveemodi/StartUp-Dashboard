import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";
import {
  Calendar, FileText, Mic, TrendingUp, Clock,
  Plus, Activity, Target, ChevronRight, BarChart2, CheckCircle
} from "lucide-react";
import { Chart, registerables } from "chart.js";
import { meetingsAPI } from "../utils/api";
import { useAuth } from "../context/AuthContext";
import TopBar from "../components/TopBar";

// Register Chart.js components
Chart.register(...registerables);

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
        transition: "transform 0.2s ease",
        cursor: "default",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 14,
        }}
      >
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: "10px",
            background: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
          }}
        >
          <Icon size={18} color={color} strokeWidth={2.5} />
        </div>
      </div>

      <div
        style={{
          fontSize: 32,
          fontWeight: 800,
          color: color,
          lineHeight: 1,
          marginBottom: 4,
          letterSpacing: "-1px",
        }}
      >
        {value ?? "—"}
      </div>

      <div
        style={{
          fontSize: 13,
          color: color,
          fontWeight: 600,
          opacity: 0.7,
        }}
      >
        {label}
      </div>
    </div>
  );
}

// --- CUSTOM TOOLTIP FOR RECHARTS ---
const CTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="card"
      style={{
        padding: "10px 14px",
        fontSize: 12,
        boxShadow: "var(--shadow-lg)",
      }}
    >
      {label && (
        <div
          style={{
            color: "var(--text-muted)",
            marginBottom: 6,
            fontWeight: 500,
          }}
        >
          {label}
        </div>
      )}
      {payload.map((p) => (
        <div
          key={p.name}
          style={{ color: p.color || "var(--accent)", fontWeight: 600 }}
        >
          {p.name}: {p.value}
        </div>
      ))}
    </div>
  );
};

// --- MEETING TRENDS CHART ---
function MeetingTrendsChart({ data, loading }) {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (loading || !chartRef.current) return;

    if (chartInstance.current) {
      chartInstance.current.destroy();
      chartInstance.current = null;
    }

    const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const gridColor = isDark
      ? "rgba(255,255,255,0.06)"
      : "rgba(0,0,0,0.06)";
    const tickColor = isDark ? "#888" : "#999";

    const monthly = data?.monthlyTrends || [
      { month: "Nov", scheduled: 18, completed: 14, cancelled: 4 },
      { month: "Dec", scheduled: 22, completed: 17, cancelled: 5 },
      { month: "Jan", scheduled: 14, completed: 11, cancelled: 3 },
      { month: "Feb", scheduled: 28, completed: 21, cancelled: 7 },
      { month: "Mar", scheduled: 25, completed: 20, cancelled: 5 },
      { month: "Apr", scheduled: 31, completed: 26, cancelled: 5 },
    ];

    chartInstance.current = new Chart(chartRef.current, {
      type: "line",
      data: {
        labels: monthly.map((m) => m.month),
        datasets: [
          {
            label: "Scheduled",
            data: monthly.map((m) => m.scheduled),
            borderColor: "#6366f1",
            backgroundColor: "rgba(99,102,241,0.08)",
            borderWidth: 2,
            pointBackgroundColor: "#6366f1",
            pointRadius: 4,
            pointHoverRadius: 6,
            tension: 0.4,
            fill: true,
          },
          {
            label: "Completed",
            data: monthly.map((m) => m.completed),
            borderColor: "#059669",
            backgroundColor: "rgba(5,150,105,0.06)",
            borderWidth: 2,
            pointBackgroundColor: "#059669",
            pointRadius: 4,
            pointHoverRadius: 6,
            pointStyle: "rectRot",
            tension: 0.4,
            fill: true,
          },
          {
            label: "Cancelled",
            data: monthly.map((m) => m.cancelled),
            borderColor: "#e11d48",
            backgroundColor: "transparent",
            borderWidth: 2,
            borderDash: [5, 3],
            pointBackgroundColor: "#e11d48",
            pointRadius: 4,
            pointHoverRadius: 6,
            pointStyle: "triangle",
            tension: 0.4,
            fill: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: isDark ? "#1e1e1e" : "#ffffff",
            borderColor: isDark
              ? "rgba(255,255,255,0.1)"
              : "rgba(0,0,0,0.08)",
            borderWidth: 1,
            titleColor: isDark ? "#cccccc" : "#444444",
            bodyColor: isDark ? "#aaaaaa" : "#666666",
            padding: 10,
            cornerRadius: 8,
            callbacks: {
              label: (ctx) => `  ${ctx.dataset.label}: ${ctx.parsed.y}`,
            },
          },
        },
        scales: {
          x: {
            grid: { color: gridColor, drawTicks: false },
            border: { display: false },
            ticks: {
              color: tickColor,
              font: { size: 11 },
              padding: 6,
            },
          },
          y: {
            grid: { color: gridColor, drawTicks: false },
            border: { display: false },
            ticks: {
              color: tickColor,
              font: { size: 11 },
              padding: 6,
              stepSize: 10,
            },
            beginAtZero: true,
          },
        },
      },
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
        chartInstance.current = null;
      }
    };
  }, [data, loading]);

  if (loading) {
    return (
      <div
        style={{
          height: 180,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          className="spinner"
          style={{
            width: 32,
            height: 32,
            border: "3px solid var(--border)",
            borderTopColor: "var(--accent)",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }}
        />
      </div>
    );
  }

  return (
    <div style={{ position: "relative", width: "100%", height: 180 }}>
      <canvas
        ref={chartRef}
        role="img"
        aria-label="Line chart showing scheduled, completed, and cancelled meetings over the last 6 months"
      />
    </div>
  );
}

// --- MAIN DASHBOARD ---
export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    meetingsAPI
      .getStats()
      .then((r) => {
        const result = r.data?.data || r.data;
        console.log("DEBUG: Dashboard Data Received ->", result);
        setData(result);
      })
      .catch((err) => console.error("Stats fetch error:", err))
      .finally(() => setLoading(false));
  }, []);

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const today = format(new Date(), "EEEE, MMMM d, yyyy");

  const priorityData = data?.notesByPriority
    ? [
        { name: "High", value: data.notesByPriority.high || 0 },
        { name: "Medium", value: data.notesByPriority.medium || 0 },
        { name: "Low", value: data.notesByPriority.low || 0 },
      ]
    : [
        { name: "High", value: 0 },
        { name: "Medium", value: 0 },
        { name: "Low", value: 0 },
      ];

  return (
    <div style={{ background: "var(--bg-base)", minHeight: "100vh" }}>
      <TopBar title="Dashboard" subtitle={today} />

      <div style={{ padding: "28px 32px", maxWidth: 1280, margin: "0 auto" }}>

        {/* Welcome Banner */}
        <div
          className="animate-fadeUp"
          style={{
            background:
              "linear-gradient(135deg, var(--accent) 0%, var(--teal) 100%)",
            borderRadius: "var(--radius-lg)",
            padding: "28px 32px",
            marginBottom: 28,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxShadow: "0 8px 32px var(--accent-glow)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "rgba(255,255,255,0.7)",
                letterSpacing: "1px",
                marginBottom: 6,
                textTransform: "uppercase",
              }}
            >
              Welcome back
            </div>
            <h2
              style={{
                fontSize: 24,
                fontWeight: 800,
                color: "#fff",
                letterSpacing: "-0.5px",
                marginBottom: 6,
              }}
            >
              {greeting}, {user?.name?.split(" ")[0] || "there"} 👋
            </h2>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.75)" }}>
              {loading
                ? "Loading workspace..."
                : `You have ${data?.counts?.ongoingMeetings || 0} ongoing meetings and ${data?.counts?.scheduledMeetings || 0} scheduled upcoming.`}
            </p>
          </div>
        </div>

        {/* Stats Row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4,1fr)",
            gap: 16,
            marginBottom: 24,
          }}
        >
          <StatCard
            icon={Calendar}
            label="Total Meetings"
            value={loading ? "—" : data?.counts?.totalMeetings}
            color="#4f46e5"
            bg="#eef2ff"
            delay="0s"
          />
          <StatCard
            icon={TrendingUp}
            label="Completed"
            value={loading ? "—" : data?.counts?.completedMeetings}
            color="#059669"
            bg="#ecfdf5"
            delay="0.05s"
          />
          <StatCard
            icon={FileText}
            label="Notes Created"
            value={loading ? "—" : data?.counts?.totalNotes}
            color="#b45309"
            bg="#fffbeb"
            delay="0.10s"
          />
          <StatCard
            icon={Mic}
            label="Recordings"
            value={loading ? "—" : data?.counts?.totalRecordings}
            color="#e11d48"
            bg="#fff1f2"
            delay="0.15s"
          />
        </div>

        {/* Charts Row — 1/3 + 2/3 split */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 2fr",
            gap: 16,
            marginBottom: 24,
          }}
        >

          {/* Chart 1: Notes by Priority (Bar) */}
          <div className="card" style={{ padding: 20 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 16,
              }}
            >
              <FileText size={15} color="var(--amber)" />
              <span style={{ fontSize: 13, fontWeight: 600 }}>
                Notes by Priority
              </span>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={priorityData} barSize={36}>
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CTooltip />} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {priorityData.map((e, i) => (
                    <Cell
                      key={i}
                      fill={
                        priorityColors[e.name.toLowerCase()] || "#6366f1"
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Chart 2: Meeting Trends (Line) */}
          <div className="card" style={{ padding: 20 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 16,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <TrendingUp size={15} color="var(--green)" />
                <span style={{ fontSize: 13, fontWeight: 600 }}>
                  Meeting Trends
                </span>
              </div>
              {/* Inline legend */}
              <div
                style={{
                  display: "flex",
                  gap: 10,
                  fontSize: 10,
                  color: "var(--text-muted)",
                  alignItems: "center",
                }}
              >
                {[
                  ["#6366f1", "Sched."],
                  ["#059669", "Done"],
                  ["#e11d48", "Cancel."],
                ].map(([color, label]) => (
                  <span
                    key={label}
                    style={{ display: "flex", alignItems: "center", gap: 4 }}
                  >
                    <span
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: "50%",
                        background: color,
                        display: "inline-block",
                        flexShrink: 0,
                      }}
                    />
                    {label}
                  </span>
                ))}
              </div>
            </div>
            <MeetingTrendsChart data={data} loading={loading} />
          </div>

        </div>

        {/* Recent Meetings */}
        <div className="card">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "16px 20px",
              borderBottom: "1px solid var(--border)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Activity size={15} color="var(--accent)" />
              <span style={{ fontSize: 13, fontWeight: 700 }}>
                Recent Meetings
              </span>
            </div>
            <Link
              to="/companies"
              className="btn btn-ghost btn-sm"
              style={{ fontSize: 12 }}
            >
              View all <ChevronRight size={13} />
            </Link>
          </div>
          <div style={{ minHeight: 100 }}>
            {!data?.recentMeetings?.length ? (
              <div
                style={{
                  padding: 40,
                  textAlign: "center",
                  color: "var(--text-muted)",
                  fontSize: 13,
                }}
              >
                No recent meetings
              </div>
            ) : (
              data.recentMeetings.map((m, i) => (
                <div
                  key={m._id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "14px 20px",
                    borderBottom:
                      i < data.recentMeetings.length - 1
                        ? "1px solid var(--border)"
                        : "none",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: "8px",
                        background: `${statusColors[m.status]}15`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Calendar size={15} color={statusColors[m.status]} />
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>
                        {m.title}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: "var(--text-muted)",
                        }}
                      >
                        {format(new Date(m.createdAt), "MMM d, HH:mm")} •{" "}
                        {m.company?.name || "No Company"}
                      </div>
                    </div>
                  </div>
                  <span
                    className="badge"
                    style={{
                      background: `${statusColors[m.status]}15`,
                      color: statusColors[m.status],
                    }}
                  >
                    {m.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
