import React from "react";
import { Sun, Moon, Bell } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";

function Avatar({ name, size = 30 }) {
  const initials = (name || "U").split(" ").map(w => w[0]).join("").slice(0,2).toUpperCase();
  const palette  = ["#4f46e5","#0891b2","#e11d48","#d97706","#059669","#7c3aed"];
  const color    = palette[(name?.charCodeAt(0) || 65) % palette.length];
  return (
    <div style={{ width:size, height:size, borderRadius:"50%", flexShrink:0,
      background:`${color}18`, border:`1.5px solid ${color}40`,
      display:"flex", alignItems:"center", justifyContent:"center",
      fontSize:size*0.36, fontWeight:700, color }}>
      {initials}
    </div>
  );
}

export default function TopBar({ title, subtitle }) {
  const { theme, toggle } = useTheme();
  const { user } = useAuth();
  const isDark = theme === "dark";

  return (
    <div style={{
      position:"sticky", top:0, zIndex:50,
      background:"var(--bg-surface)", borderBottom:"1px solid var(--border)",
      padding:"0 32px", height:"var(--header-height)",
      display:"flex", alignItems:"center", justifyContent:"space-between",
      backdropFilter:"blur(12px)",
      boxShadow:"var(--shadow-xs)",
    }}>
      <div>
        <h1 style={{ fontSize:17, fontWeight:700, color:"var(--text-primary)", letterSpacing:"-0.3px", lineHeight:1 }}>{title}</h1>
        {subtitle && <p style={{ fontSize:12, color:"var(--text-muted)", marginTop:2 }}>{subtitle}</p>}
      </div>

      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
        {/* Dark mode toggle */}
        <button onClick={toggle} title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          style={{
            width:36, height:36, borderRadius:"var(--radius-sm)",
            border:"1px solid var(--border)", background:"var(--bg-elevated)",
            display:"flex", alignItems:"center", justifyContent:"center",
            cursor:"pointer", color:"var(--text-secondary)", transition:"all 0.15s",
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor="var(--accent)"; e.currentTarget.style.color="var(--accent)"; e.currentTarget.style.background="var(--accent-soft)"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor="var(--border)"; e.currentTarget.style.color="var(--text-secondary)"; e.currentTarget.style.background="var(--bg-elevated)"; }}>
          {isDark ? <Sun size={15} /> : <Moon size={15} />}
        </button>

        {/* Notifications */}
        <button title="Notifications" style={{ width:36, height:36, borderRadius:"var(--radius-sm)", border:"1px solid var(--border)", background:"var(--bg-elevated)", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:"var(--text-secondary)", transition:"all 0.15s", position:"relative" }}
          onMouseEnter={e => { e.currentTarget.style.borderColor="var(--border-accent)"; e.currentTarget.style.color="var(--text-primary)"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor="var(--border)"; e.currentTarget.style.color="var(--text-secondary)"; }}>
          <Bell size={15} />
          <span style={{ position:"absolute", top:7, right:7, width:6, height:6, borderRadius:"50%", background:"var(--rose)", border:"2px solid var(--bg-surface)" }} />
        </button>

        {/* User avatar */}
        <div style={{ display:"flex", alignItems:"center", gap:8, padding:"4px 10px", borderRadius:"var(--radius-sm)", border:"1px solid var(--border)", background:"var(--bg-elevated)" }}>
          <Avatar name={user?.name} size={24} />
          <span style={{ fontSize:12, fontWeight:500, color:"var(--text-primary)" }}>{user?.name?.split(" ")[0]}</span>
        </div>
      </div>
    </div>
  );
}
