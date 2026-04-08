import React, { useState } from "react";
import { User, Mail, Building, Lock, Eye, EyeOff, Save, Shield, CheckCircle } from "lucide-react";
import { API } from "../context/AuthContext";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

function Avatar({ name, size = 52 }) {
  const initials = (name || "U").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const colors = ["#7c6dff", "#00d4c8", "#ff5e7a", "#ffb830", "#00e5a0"];
  const color = colors[(name?.charCodeAt(0) || 0) % colors.length];
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: `${color}30`, border: `3px solid ${color}50`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.36, fontWeight: 700, color }}>
      {initials}
    </div>
  );
}

const roleConfig = {
  admin:   { color: "var(--rose)",  bg: "var(--rose-soft)",  label: "Admin"   },
  manager: { color: "var(--amber)", bg: "var(--amber-soft)", label: "Manager" },
  member:  { color: "var(--teal)",  bg: "var(--teal-soft)",  label: "Member"  },
};

export default function Profile() {
  const { user, updateUser } = useAuth();
  const toast = useToast();

  const [profile, setProfile]   = useState({ name: user?.name || "", department: user?.department || "" });
  const [savingProfile, setSavingProfile] = useState(false);

  const [pw, setPw]         = useState({ current: "", newPw: "", confirm: "" });
  const [showPw, setShowPw] = useState({ current: false, newPw: false, confirm: false });
  const [savingPw, setSavingPw] = useState(false);
  const [pwSuccess, setPwSuccess] = useState(false);

  const rc = roleConfig[user?.role] || roleConfig.member;

  const handleProfileSave = async () => {
    if (!profile.name.trim()) { toast.error("Name is required"); return; }
    setSavingProfile(true);
    try {
      const { data } = await API.patch("/auth/me", profile);
      updateUser(data.data);
      toast.success("Profile updated successfully");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update profile");
    } finally { setSavingProfile(false); }
  };

  const handlePasswordChange = async () => {
    if (!pw.current || !pw.newPw) { toast.error("Fill in all password fields"); return; }
    if (pw.newPw !== pw.confirm) { toast.error("New passwords do not match"); return; }
    if (pw.newPw.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    setSavingPw(true);
    try {
      await API.patch("/auth/change-password", { currentPassword: pw.current, newPassword: pw.newPw });
      setPwSuccess(true);
      setPw({ current: "", newPw: "", confirm: "" });
      toast.success("Password changed successfully");
      setTimeout(() => setPwSuccess(false), 3000);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to change password");
    } finally { setSavingPw(false); }
  };

  const inp = { width: "100%", padding: "11px 14px 11px 40px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-accent)", background: "var(--bg-elevated)", color: "var(--text-primary)", fontSize: 14, fontFamily: "Syne", outline: "none" };
  const lbl = { fontSize: 11, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 6, letterSpacing: 0.5 };

  return (
    <div style={{ padding: "32px 36px", maxWidth: 800 }}>
      <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.4px", marginBottom: 6 }}>My Profile</h1>
      <p style={{ color: "var(--text-secondary)", fontSize: 14, marginBottom: 32 }}>Manage your account information and security</p>

      {/* Profile card */}
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius)", overflow: "hidden", marginBottom: 20 }}>
        
        {/* Banner - Increased height to 100 for better spacing */}
        <div style={{ height: 100, background: "linear-gradient(135deg, var(--accent-soft), var(--teal-soft))", position: "relative" }} />

        <div style={{ padding: "0 28px 28px" }}>
          {/* Avatar and Name Row - Reduced negative margin and adjusted alignment */}
          <div style={{ display: "flex", alignItems: "flex-end", gap: 16, marginTop: -40, marginBottom: 28, position: "relative", zIndex: 2 }}>
            <div style={{ border: "4px solid var(--bg-card)", borderRadius: "50%", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
              <Avatar name={user?.name} size={80} />
            </div>
            {/* Added paddingBottom to the text container so the name sits comfortably below the banner line */}
            <div style={{ paddingBottom: 6 }}>
              <div style={{ fontSize: 20, fontWeight: 800, lineHeight: 1.2, color: "var(--text-primary)" }}>{user?.name}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{user?.email}</span>
                <span style={{ padding: "2px 8px", borderRadius: 99, fontSize: 10, fontWeight: 700, textTransform: "uppercase", background: rc.bg, color: rc.color }}>
                  {rc.label}
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label style={lbl}>FULL NAME</label>
              <div style={{ position: "relative" }}>
                <User size={14} color="var(--text-muted)" style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)" }} />
                <input value={profile.name} onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))} style={inp}
                  onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
                  onBlur={(e) => (e.target.style.borderColor = "var(--border-accent)")} />
              </div>
            </div>
            <div>
              <label style={lbl}>DEPARTMENT</label>
              <div style={{ position: "relative" }}>
                <Building size={14} color="var(--text-muted)" style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)" }} />
                <input value={profile.department} onChange={(e) => setProfile((p) => ({ ...p, department: e.target.value }))} placeholder="e.g. Engineering" style={inp}
                  onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
                  onBlur={(e) => (e.target.style.borderColor = "var(--border-accent)")} />
              </div>
            </div>
            <div>
              <label style={lbl}>EMAIL</label>
              <div style={{ position: "relative" }}>
                <Mail size={14} color="var(--text-muted)" style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)" }} />
                <input value={user?.email || ""} disabled style={{ ...inp, opacity: 0.5, cursor: "not-allowed" }} />
              </div>
            </div>
            <div>
              <label style={lbl}>ROLE</label>
              <div style={{ position: "relative" }}>
                <Shield size={14} color="var(--text-muted)" style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)" }} />
                <input value={rc.label} disabled style={{ ...inp, opacity: 0.5, cursor: "not-allowed" }} />
              </div>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
            <button onClick={handleProfileSave} disabled={savingProfile} style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 20px", borderRadius: "var(--radius-sm)", border: "none", cursor: savingProfile ? "wait" : "pointer", background: "linear-gradient(135deg, var(--accent), var(--teal))", color: "#fff", fontFamily: "Syne", fontWeight: 700, fontSize: 14, boxShadow: "0 0 20px var(--accent-glow)", opacity: savingProfile ? 0.7 : 1 }}>
              <Save size={15} /> {savingProfile ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </div>
      </div>

      {/* Change password card */}
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "var(--rose-soft)", border: "1px solid var(--rose)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Lock size={16} color="var(--rose)" />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>Change Password</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Keep your account secure</div>
          </div>
          {pwSuccess && (
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6, color: "var(--green)", fontSize: 13, fontWeight: 600 }}>
              <CheckCircle size={15} /> Updated!
            </div>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {[
            { key: "current", label: "CURRENT PASSWORD", placeholder: "Your current password" },
            { key: "newPw",   label: "NEW PASSWORD",     placeholder: "Min 8 chars, uppercase + number" },
            { key: "confirm", label: "CONFIRM NEW PASSWORD", placeholder: "Repeat new password" },
          ].map(({ key, label, placeholder }) => (
            <div key={key}>
              <label style={lbl}>{label}</label>
              <div style={{ position: "relative" }}>
                <Lock size={14} color="var(--text-muted)" style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)" }} />
                <input
                  type={showPw[key] ? "text" : "password"}
                  value={pw[key]}
                  onChange={(e) => setPw((p) => ({ ...p, [key]: e.target.value }))}
                  placeholder={placeholder}
                  style={{ ...inp, paddingRight: 44 }}
                  onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
                  onBlur={(e) => (e.target.style.borderColor = "var(--border-accent)")}
                />
                <button type="button" onClick={() => setShowPw((s) => ({ ...s, [key]: !s[key] }))} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
                  {showPw[key] ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
          <button onClick={handlePasswordChange} disabled={savingPw} style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 20px", borderRadius: "var(--radius-sm)", border: "none", cursor: savingPw ? "wait" : "pointer", background: "linear-gradient(135deg, var(--rose), #ff3366)", color: "#fff", fontFamily: "Syne", fontWeight: 700, fontSize: 14, boxShadow: "0 0 20px #ff5e7a40", opacity: savingPw ? 0.7 : 1 }}>
            <Lock size={15} /> {savingPw ? "Changing…" : "Change Password"}
          </button>
        </div>
      </div>
    </div>
  );
}