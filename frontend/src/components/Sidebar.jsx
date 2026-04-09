import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Building2, FileText,
  Mic, LogOut, ChevronRight, ChevronDown, Zap,
  User, Users, X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useSidebar } from "../context/SidebarContext";

/* ─── Avatar ─────────────────────────────────────────────── */
function Avatar({ name, size = 28 }) {
  const ini = (name || "U").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const pal = ["#4f46e5", "#0891b2", "#e11d48", "#d97706", "#059669", "#7c3aed"];
  const c   = pal[(name?.charCodeAt(0) || 65) % pal.length];
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: `${c}18`, border: `1.5px solid ${c}40`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.36, fontWeight: 700, color: c,
    }}>
      {ini}
    </div>
  );
}

const roleConf = {
  admin:   { color: "#e11d48", label: "Admin" },
  manager: { color: "#d97706", label: "Manager" },
  member:  { color: "#0891b2", label: "Member" },
};

/* ─── Nav link ─────────────────────────────────────────────── */
function NL({ to, icon: Icon, label, exact = false, sub = false, onClick }) {
  return (
    <NavLink
      to={to}
      end={exact}
      onClick={onClick}
      style={({ isActive }) => ({
        display: "flex", alignItems: "center", gap: sub ? 8 : 9,
        padding: sub ? "6px 12px 6px 30px" : "8px 12px",
        borderRadius: "var(--radius-sm)", marginBottom: 2, textDecoration: "none",
        background: isActive ? "var(--accent-soft)" : "transparent",
        color:      isActive ? "var(--accent-text)" : "var(--text-secondary)",
        fontWeight: isActive ? 600 : 400, fontSize: sub ? 12 : 13,
        transition: "all 0.15s",
        border: isActive ? "1px solid var(--accent-glow)" : "1px solid transparent",
        ...(sub && { borderLeft: "2px solid var(--border)", marginLeft: 8 }),
      })}
    >
      {({ isActive }) => (
        <>
          <Icon size={15} strokeWidth={isActive ? 2.2 : 1.8} />
          <span style={{ flex: 1 }}>{label}</span>
          {isActive && !sub && <ChevronRight size={11} />}
        </>
      )}
    </NavLink>
  );
}

/* ─── Main Sidebar ─────────────────────────────────────────── */
export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const toast            = useToast();
  const navigate         = useNavigate();
  const [userOpen, setUserOpen] = useState(false);
  const rc = roleConf[user?.role] || roleConf.member;

  return (
    <>
      <aside
        style={{
          width: "var(--sidebar-width)",
          minHeight: "100vh",
          position: "fixed",
          top: 0,
          left: 0,
          zIndex: 100,                        /* above overlay (98) and topbar (50) */
          background: "var(--bg-sidebar)",
          borderRight: "1px solid var(--border)",
          display: "flex",
          flexDirection: "column",
          transition: "transform 0.28s cubic-bezier(0.4,0,0.2,1)",
          /* Mobile: off-screen by default; .sidebar-open slides it in */
        }}
        className={`sidebar-panel${isOpen ? " sidebar-open" : ""}`}
      >

        {/* Logo row + mobile close button */}
        <div style={{
          padding: "20px 18px 16px",
          borderBottom: "1px solid var(--border)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10,
              background: "linear-gradient(135deg,var(--accent),var(--teal))",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Zap size={16} color="#fff" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 15 }}>StartUp Portal</div>
              <div style={{ fontSize: 10, color: "var(--text-muted)" }}>
                ENTERPRISE PLATFORM
              </div>
            </div>
          </div>

          {/* Close button — only visible on mobile */}
          <button
            onClick={onClose}
            className="sidebar-close-btn"
            style={{
              display: "none",          /* hidden on desktop, shown via CSS on mobile */
              alignItems: "center",
              justifyContent: "center",
              width: 30, height: 30,
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--border)",
              background: "var(--bg-elevated)",
              cursor: "pointer",
              color: "var(--text-secondary)",
            }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: "12px 10px", overflowY: "auto" }}>
          <NL to="/"           icon={LayoutDashboard} label="Dashboard"  exact onClick={onClose} />
          <NL to="/companies"  icon={Building2}       label="Companies"  exact onClick={onClose} />
          <NL to="/notes"      icon={FileText}         label="All Notes"       onClick={onClose} />
          <NL to="/recordings" icon={Mic}              label="Recordings"      onClick={onClose} />

          {user?.role === "admin" && (
            <>
              <div style={{
                fontSize: 10, fontWeight: 700, letterSpacing: "1px",
                color: "var(--text-muted)", padding: "14px 12px 6px",
                textTransform: "uppercase",
              }}>
                Admin
              </div>
              <NL to="/admin/users" icon={Users} label="User Management" onClick={onClose} />
            </>
          )}
        </nav>

        {/* User panel */}
        <div style={{ padding: "10px", borderTop: "1px solid var(--border)" }}>
          <button
            onClick={() => setUserOpen(!userOpen)}
            style={{
              width: "100%", display: "flex", alignItems: "center", gap: 10,
              padding: "10px 12px", borderRadius: "var(--radius-sm)",
              border: "1px solid var(--border)",
              background: "var(--bg-elevated)", cursor: "pointer",
            }}
          >
            <Avatar name={user?.name} size={28} />
            <div style={{ flex: 1, textAlign: "left" }}>
              <div style={{ fontSize: 12, fontWeight: 600 }}>{user?.name || "User"}</div>
              <div style={{ fontSize: 10, color: rc.color }}>{rc.label}</div>
            </div>
            <ChevronDown size={12} />
          </button>

          {userOpen && (
            <div style={{
              marginTop: 6,
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-sm)",
            }}>
              <NavLink
                to="/profile"
                onClick={onClose}
                style={{
                  display: "flex", gap: 8, padding: "9px 12px",
                  textDecoration: "none", color: "var(--text-secondary)",
                }}
              >
                <User size={13} /> My Profile
              </NavLink>

              <button
                onClick={() => {
                  logout();
                  toast.info("Signed out. See you soon!");
                  navigate("/login");
                  onClose?.();
                }}
                style={{
                  width: "100%", display: "flex", gap: 8,
                  padding: "9px 12px", border: "none",
                  background: "none", color: "var(--rose)",
                  cursor: "pointer",
                }}
              >
                <LogOut size={13} /> Sign Out
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Responsive styles scoped to sidebar */}
      <style>{`
        @media (max-width: 768px) {
          .sidebar-panel {
            transform: translateX(-100%);
          }
          .sidebar-panel.sidebar-open {
            transform: translateX(0);
          }
          .sidebar-close-btn {
            display: flex !important;
          }
        }
        @media (min-width: 769px) {
          .sidebar-panel {
            transform: translateX(0) !important;
          }
        }
      `}</style>
    </>
  );
}
