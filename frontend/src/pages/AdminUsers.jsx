import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { Users, Search, Shield, UserCheck, UserX, ChevronDown } from "lucide-react";
import { adminAPI } from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useNavigate } from "react-router-dom";

const roleConfig = {
  admin:   { color: "var(--rose)",  bg: "var(--rose-soft)"  },
  manager: { color: "var(--amber)", bg: "var(--amber-soft)" },
  member:  { color: "var(--teal)",  bg: "var(--teal-soft)"  },
};

function Avatar({ name, size = 36 }) {
  const initials = (name || "U").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const colors = ["#7c6dff", "#00d4c8", "#ff5e7a", "#ffb830", "#00e5a0"];
  const color = colors[(name?.charCodeAt(0) || 0) % colors.length];
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", flexShrink: 0, background: `${color}30`, border: `2px solid ${color}50`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.36, fontWeight: 700, color }}>
      {initials}
    </div>
  );
}

export default function AdminUsers() {
  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");
  const [roleFilter, setRole] = useState("all");
  const { user: me }          = useAuth();
  const toast                 = useToast();
  const navigate              = useNavigate();

  useEffect(() => {
    if (me?.role !== "admin") { navigate("/"); return; }
    load();
  }, [me]);

  const load = () => {
    setLoading(true);
    adminAPI.getUsers({ limit: 100 })
      .then((r) => setUsers(r.data.data || []))
      .finally(() => setLoading(false));
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await adminAPI.updateUser(userId, { role: newRole });
      toast.success("Role updated");
      load();
    } catch { toast.error("Failed to update role"); }
  };

  const handleToggleActive = async (userId, currentStatus) => {
    try {
      await adminAPI.updateUser(userId, { isActive: !currentStatus });
      toast.success(currentStatus ? "User deactivated" : "User activated");
      load();
    } catch { toast.error("Failed to update user"); }
  };

  const filtered = users.filter((u) => {
    const matchSearch = !search.trim() || u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  return (
    <div style={{ padding: "32px 36px", maxWidth: 1100 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: "var(--rose-soft)", border: "1px solid var(--rose)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Shield size={18} color="var(--rose)" />
        </div>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.4px" }}>User Management</h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)" }}>{users.length} total users</p>
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, margin: "24px 0", flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 220, position: "relative" }}>
          <Search size={14} color="var(--text-muted)" style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)" }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search users…"
            style={{ width: "100%", padding: "10px 14px 10px 37px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-accent)", background: "var(--bg-card)", color: "var(--text-primary)", fontSize: 14, fontFamily: "Syne", outline: "none" }} />
        </div>
        {["all", "admin", "manager", "member"].map((r) => (
          <button key={r} onClick={() => setRole(r)} style={{ padding: "9px 14px", borderRadius: "var(--radius-sm)", fontSize: 12, border: roleFilter === r ? "1px solid var(--accent)" : "1px solid var(--border)", background: roleFilter === r ? "var(--accent-soft)" : "var(--bg-card)", color: roleFilter === r ? "var(--accent)" : "var(--text-secondary)", cursor: "pointer", fontFamily: "Syne", textTransform: "capitalize" }}>{r}</button>
        ))}
      </div>

      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius)", overflow: "hidden" }}>
        {/* Table header */}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 2fr 1fr 1fr 1fr 1fr", gap: 12, padding: "12px 20px", borderBottom: "1px solid var(--border)", background: "var(--bg-elevated)" }}>
          {["User", "Email", "Role", "Status", "Last Login", "Actions"].map((h) => (
            <div key={h} style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", letterSpacing: 0.5 }}>{h.toUpperCase()}</div>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>Loading users…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center" }}>
            <Users size={36} color="var(--text-muted)" style={{ marginBottom: 12 }} />
            <p style={{ color: "var(--text-muted)" }}>No users found</p>
          </div>
        ) : filtered.map((u, i) => {
          const rc = roleConfig[u.role] || roleConfig.member;
          const isMe = u._id === me?._id;
          return (
            <div key={u._id} style={{ display: "grid", gridTemplateColumns: "2fr 2fr 1fr 1fr 1fr 1fr", gap: 12, padding: "14px 20px", borderBottom: i < filtered.length - 1 ? "1px solid var(--border)" : "none", alignItems: "center", transition: "background 0.15s", opacity: u.isActive ? 1 : 0.55 }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-card-hover)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "none")}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Avatar name={u.name} size={34} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{u.name}{isMe && <span style={{ fontSize: 10, color: "var(--accent)", marginLeft: 6 }}>(you)</span>}</div>
                  {u.department && <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{u.department}</div>}
                </div>
              </div>
              <div style={{ fontSize: 13, color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.email}</div>
              <div>
                {isMe ? (
                  <span style={{ padding: "3px 9px", borderRadius: 99, fontSize: 11, fontWeight: 700, background: rc.bg, color: rc.color, textTransform: "capitalize" }}>{u.role}</span>
                ) : (
                  <div style={{ position: "relative", display: "inline-block" }}>
                    <select value={u.role} onChange={(e) => handleRoleChange(u._id, e.target.value)}
                      style={{ padding: "4px 24px 4px 8px", borderRadius: 99, fontSize: 11, fontWeight: 700, background: rc.bg, color: rc.color, border: "none", cursor: "pointer", fontFamily: "Syne", appearance: "none" }}>
                      <option value="admin">Admin</option>
                      <option value="manager">Manager</option>
                      <option value="member">Member</option>
                    </select>
                    <ChevronDown size={10} color={rc.color} style={{ position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                  </div>
                )}
              </div>
              <div>
                <span style={{ padding: "3px 9px", borderRadius: 99, fontSize: 11, fontWeight: 600, background: u.isActive ? "var(--green-soft)" : "var(--rose-soft)", color: u.isActive ? "var(--green)" : "var(--rose)" }}>
                  {u.isActive ? "Active" : "Inactive"}
                </span>
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "JetBrains Mono" }}>
                {u.lastLogin ? format(new Date(u.lastLogin), "MMM d, HH:mm") : "Never"}
              </div>
              <div>
                {!isMe && (
                  <button onClick={() => handleToggleActive(u._id, u.isActive)}
                    title={u.isActive ? "Deactivate" : "Activate"}
                    style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: "var(--radius-xs)", border: `1px solid ${u.isActive ? "var(--rose)" : "var(--green)"}`, background: u.isActive ? "var(--rose-soft)" : "var(--green-soft)", color: u.isActive ? "var(--rose)" : "var(--green)", cursor: "pointer", fontSize: 11, fontFamily: "Syne", fontWeight: 600 }}>
                    {u.isActive ? <UserX size={12} /> : <UserCheck size={12} />}
                    {u.isActive ? "Deactivate" : "Activate"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
