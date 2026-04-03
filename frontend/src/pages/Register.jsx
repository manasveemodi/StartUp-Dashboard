import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Zap, Mail, Lock, User, Building, Eye, EyeOff, AlertCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

export default function Register() {
  const [form, setForm]       = useState({ name: "", email: "", password: "", department: "" });
  const [showPw, setShowPw]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors]   = useState({});
  const { register }          = useAuth();
  const toast                 = useToast();
  const navigate              = useNavigate();

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.email) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Invalid email";
    if (!form.password) e.password = "Password is required";
    else if (form.password.length < 8) e.password = "Min 8 characters";
    else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(form.password)) e.password = "Must have uppercase, lowercase, and number";
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const e2 = validate();
    if (Object.keys(e2).length) { setErrors(e2); return; }
    setErrors({});
    setLoading(true);
    try {
      await register(form);
      toast.success("Account created! Welcome to StartUp Portal.");
      navigate("/");
    } catch (err) {
      const msg = err.response?.data?.message || "Registration failed.";
      if (err.response?.data?.errors) {
        const fieldErrors = {};
        err.response.data.errors.forEach(({ field, message }) => { fieldErrors[field] = message; });
        setErrors(fieldErrors);
      } else {
        setErrors({ general: msg });
      }
    } finally {
      setLoading(false);
    }
  };

  const inp = (hasErr) => ({
    width: "100%", padding: "12px 14px 12px 42px",
    borderRadius: "var(--radius-sm)",
    border: `1px solid ${hasErr ? "var(--rose)" : "var(--border-accent)"}`,
    background: "var(--bg-elevated)", color: "var(--text-primary)",
    fontSize: 14, fontFamily: "Syne", outline: "none",
  });

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "var(--bg-primary)", padding: 20,
      backgroundImage: `linear-gradient(rgba(124,109,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(124,109,255,0.04) 1px, transparent 1px)`,
      backgroundSize: "40px 40px",
    }}>
      <div style={{ width: "100%", maxWidth: 440 }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, margin: "0 auto 14px", background: "linear-gradient(135deg, var(--accent), var(--teal))", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 32px var(--accent-glow)" }}>
            <Zap size={24} color="#fff" fill="#fff" />
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.5px" }}>StartUp Portal</h1>
          <p style={{ fontSize: 14, color: "var(--text-muted)", marginTop: 4 }}>Enterprise Meeting Platform</p>
        </div>

        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-accent)", borderRadius: "var(--radius)", padding: 32, boxShadow: "0 8px 48px #00000050" }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>Create account</h2>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 24 }}>Set up your workspace access</p>

          {errors.general && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: "var(--radius-sm)", background: "var(--rose-soft)", border: "1px solid var(--rose)", marginBottom: 20, fontSize: 13, color: "var(--rose)" }}>
              <AlertCircle size={15} />{errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              { key: "name",       label: "FULL NAME",   type: "text",     icon: User,     placeholder: "Jane Smith"          },
              { key: "email",      label: "EMAIL",       type: "email",    icon: Mail,     placeholder: "you@company.com"     },
              { key: "department", label: "DEPARTMENT",  type: "text",     icon: Building, placeholder: "Engineering (opt.)" },
            ].map(({ key, label, type, icon: Icon, placeholder }) => (
              <div key={key}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", letterSpacing: 0.5, display: "block", marginBottom: 6 }}>{label}</label>
                <div style={{ position: "relative" }}>
                  <Icon size={15} color="var(--text-muted)" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
                  <input type={type} value={form[key]} onChange={(e) => set(key, e.target.value)}
                    placeholder={placeholder} style={inp(!!errors[key])} />
                </div>
                {errors[key] && <div style={{ fontSize: 11, color: "var(--rose)", marginTop: 4 }}>{errors[key]}</div>}
              </div>
            ))}

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", letterSpacing: 0.5, display: "block", marginBottom: 6 }}>PASSWORD</label>
              <div style={{ position: "relative" }}>
                <Lock size={15} color="var(--text-muted)" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
                <input type={showPw ? "text" : "password"} value={form.password} onChange={(e) => set("password", e.target.value)}
                  placeholder="Min 8 chars, uppercase + number" style={{ ...inp(!!errors.password), paddingRight: 44 }} />
                <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.password && <div style={{ fontSize: 11, color: "var(--rose)", marginTop: 4 }}>{errors.password}</div>}
            </div>

            <button type="submit" disabled={loading} style={{ padding: "13px", borderRadius: "var(--radius-sm)", border: "none", background: "linear-gradient(135deg, var(--accent), var(--teal))", color: "#fff", fontFamily: "Syne", fontWeight: 700, fontSize: 15, cursor: loading ? "wait" : "pointer", marginTop: 6, boxShadow: "0 0 24px var(--accent-glow)", opacity: loading ? 0.7 : 1 }}>
              {loading ? "Creating account…" : "Create Account"}
            </button>
          </form>

          <div style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: "var(--text-muted)" }}>
            Already have an account?{" "}
            <Link to="/login" style={{ color: "var(--accent)", textDecoration: "none", fontWeight: 600 }}>Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
