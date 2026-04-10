import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Zap, Mail, Lock, Eye, EyeOff,
  AlertCircle, ArrowRight, Menu, X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth <= breakpoint : false
  );
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= breakpoint);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [breakpoint]);
  return isMobile;
}

/* ── Mobile Landing Page (Image 1 style) ─────────────────── */
function MobileLanding({ onSignIn }) {
  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg, #0f0e2e 0%, #1a1040 45%, #0c1a2e 100%)",
      display: "flex",
      flexDirection: "column",
      position: "relative",
      overflow: "hidden",
    }}>

      {/* Hamburger top-left */}
      <div style={{
        position: "fixed",
        top: 0, left: 0, right: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "16px 20px",
      }}>
        <MobileMenu onSignIn={onSignIn} />
      </div>

      {/* Decorative blobs */}
      <div style={{
        position: "absolute", top: -100, left: -100,
        width: 340, height: 340, borderRadius: "50%",
        background: "rgba(99,102,241,0.12)",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", bottom: -80, right: -60,
        width: 260, height: 260, borderRadius: "50%",
        background: "rgba(8,145,178,0.10)",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", top: "40%", right: -40,
        width: 180, height: 180, borderRadius: "50%",
        background: "rgba(99,102,241,0.07)",
        pointerEvents: "none",
      }} />

      {/* Main content */}
      <div style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "100px 28px 60px",
        position: "relative",
        zIndex: 1,
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 52 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: "linear-gradient(135deg,#6366f1,#22d3ee)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 8px 24px rgba(99,102,241,0.4)",
          }}>
            <Zap size={20} color="#fff" fill="#fff" />
          </div>
          <span style={{
            fontSize: 20, fontWeight: 800, color: "#f1f5f9", letterSpacing: "-0.4px",
          }}>
            StartUp Portal
          </span>
        </div>

        {/* Headline */}
        <h1 style={{
          fontSize: 36, fontWeight: 900, color: "#f1f5f9",
          letterSpacing: "-1px", lineHeight: 1.15, marginBottom: 18,
        }}>
          Every meeting.<br />Captured perfectly.
        </h1>

        <p style={{
          fontSize: 15, color: "#94a3b8", lineHeight: 1.75,
          marginBottom: 44, maxWidth: 340,
        }}>
          The enterprise meeting platform that captures notes, records audio, and turns your
          discussions into actionable outcomes.
        </p>

        {/* Feature list */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 52 }}>
          {[
            "📝 Structured notes per discussion topic",
            "🎤 Voice recording with instant playback",
            "✅ Action items with assignees & due dates",
            "📊 Analytics dashboard for your entire team",
          ].map((item) => (
            <div key={item} style={{
              fontSize: 14, color: "#cbd5e1",
              display: "flex", alignItems: "center", gap: 10,
            }}>
              {item}
            </div>
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={onSignIn}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            gap: 8,
            padding: "14px 28px",
            borderRadius: 12,
            background: "linear-gradient(135deg,#6366f1,#4f46e5)",
            color: "#fff", fontWeight: 700, fontSize: 15,
            border: "none", cursor: "pointer",
            boxShadow: "0 8px 24px rgba(99,102,241,0.45)",
            width: "100%", maxWidth: 320,
          }}
        >
          Get Started <ArrowRight size={16} />
        </button>

        <p style={{ marginTop: 16, fontSize: 13, color: "#64748b", textAlign: "left" }}>
          Already have an account?{" "}
          <button
            onClick={onSignIn}
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: "#818cf8", fontWeight: 600, fontSize: 13, padding: 0,
            }}
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}

/* ── Mobile Hamburger Menu ───────────────────────────────── */
function MobileMenu({ onSignIn }) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ position: "relative" }}>
      {/* Hamburger button */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: 40, height: 40,
          borderRadius: 10,
          background: "rgba(255,255,255,0.08)",
          border: "1px solid rgba(255,255,255,0.12)",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", color: "#f1f5f9",
          backdropFilter: "blur(8px)",
        }}
      >
        {open ? <X size={18} /> : <Menu size={18} />}
      </button>

      {/* Dropdown */}
      {open && (
        <>
          {/* Backdrop to close */}
          <div
            onClick={() => setOpen(false)}
            style={{
              position: "fixed", inset: 0, zIndex: 40,
            }}
          />
          <div style={{
            position: "absolute",
            top: 48, left: 0,
            zIndex: 50,
            background: "rgba(15,14,46,0.95)",
            border: "1px solid rgba(99,102,241,0.25)",
            borderRadius: 12,
            padding: "6px",
            minWidth: 160,
            backdropFilter: "blur(16px)",
            boxShadow: "0 16px 40px rgba(0,0,0,0.5)",
          }}>
            <button
              onClick={() => { setOpen(false); onSignIn(); }}
              style={{
                width: "100%",
                display: "flex", alignItems: "center", gap: 8,
                padding: "10px 14px",
                borderRadius: 8,
                background: "linear-gradient(135deg,#6366f1,#4f46e5)",
                color: "#fff", fontWeight: 600, fontSize: 14,
                border: "none", cursor: "pointer",
              }}
            >
              <ArrowRight size={15} /> Sign In
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/* ── Mobile Sign In Form (Image 2 style) ─────────────────── */
function MobileSignInForm({ onBack }) {
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.email || !form.password) { setError("Please fill in all fields."); return; }
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success("Welcome back!");
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#f1f5f9",
      display: "flex",
      flexDirection: "column",
      position: "relative",
    }}>
      {/* Top bar with back hamburger */}
      <div style={{
        position: "sticky", top: 0, zIndex: 10,
        padding: "14px 20px",
        display: "flex", alignItems: "center", gap: 12,
        background: "#f1f5f9",
        borderBottom: "1px solid #e2e8f0",
      }}>
        <button
          onClick={onBack}
          style={{
            width: 38, height: 38, borderRadius: 10,
            background: "#fff", border: "1px solid #e2e8f0",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", color: "#475569",
            boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
          }}
        >
          <Menu size={17} />
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: "linear-gradient(135deg,#6366f1,#22d3ee)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Zap size={14} color="#fff" fill="#fff" />
          </div>
          <span style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.3px" }}>
            StartUp Portal
          </span>
        </div>
      </div>

      {/* Form content */}
      <div style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 24px",
      }}>
        <div style={{ width: "100%", maxWidth: 420 }}>

          <div style={{ marginBottom: 32 }}>
            <h2 style={{
              fontSize: 26, fontWeight: 800,
              color: "#0f172a", letterSpacing: "-0.6px",
              marginBottom: 6, lineHeight: 1.2,
            }}>
              Sign in to your account
            </h2>
            <p style={{ fontSize: 14, color: "#94a3b8" }}>
              Access your meeting workspace
            </p>
          </div>

          {error && (
            <div style={{
              display: "flex", alignItems: "flex-start", gap: 8,
              padding: "11px 14px",
              borderRadius: 10,
              background: "#fff1f2",
              border: "1px solid #fda4af",
              marginBottom: 20,
              fontSize: 13, color: "#e11d48", lineHeight: 1.5,
            }}>
              <AlertCircle size={14} style={{ marginTop: 2, flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>

            {/* Email */}
            <div>
              <label style={{
                fontSize: 11, fontWeight: 700, color: "#94a3b8",
                display: "block", marginBottom: 8,
                textTransform: "uppercase", letterSpacing: "0.6px",
              }}>
                Email Address
              </label>
              <div style={{ position: "relative" }}>
                <Mail size={15} color="#94a3b8" style={{
                  position: "absolute", left: 14, top: "50%",
                  transform: "translateY(-50%)", pointerEvents: "none",
                }} />
                <input
                  type="email"
                  value={form.email}
                  onChange={e => set("email", e.target.value)}
                  placeholder="you@company.com"
                  autoComplete="email"
                  style={{
                    width: "100%", boxSizing: "border-box",
                    padding: "13px 14px 13px 42px",
                    borderRadius: 10,
                    border: "1.5px solid #e2e8f0",
                    background: "#fff",
                    fontSize: 14, color: "#0f172a",
                    outline: "none",
                    transition: "border-color 0.15s",
                  }}
                  onFocus={e => e.target.style.borderColor = "#6366f1"}
                  onBlur={e => e.target.style.borderColor = "#e2e8f0"}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label style={{
                fontSize: 11, fontWeight: 700, color: "#94a3b8",
                display: "block", marginBottom: 8,
                textTransform: "uppercase", letterSpacing: "0.6px",
              }}>
                Password
              </label>
              <div style={{ position: "relative" }}>
                <Lock size={15} color="#94a3b8" style={{
                  position: "absolute", left: 14, top: "50%",
                  transform: "translateY(-50%)", pointerEvents: "none",
                }} />
                <input
                  type={showPw ? "text" : "password"}
                  value={form.password}
                  onChange={e => set("password", e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  style={{
                    width: "100%", boxSizing: "border-box",
                    padding: "13px 44px 13px 42px",
                    borderRadius: 10,
                    border: "1.5px solid #e2e8f0",
                    background: "#fff",
                    fontSize: 14, color: "#0f172a",
                    outline: "none",
                    transition: "border-color 0.15s",
                  }}
                  onFocus={e => e.target.style.borderColor = "#6366f1"}
                  onBlur={e => e.target.style.borderColor = "#e2e8f0"}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  style={{
                    position: "absolute", right: 14, top: "50%",
                    transform: "translateY(-50%)",
                    background: "none", border: "none", cursor: "pointer",
                    color: "#94a3b8", padding: 0,
                    display: "flex", alignItems: "center",
                  }}
                >
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%", marginTop: 4,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                padding: "14px",
                borderRadius: 12,
                background: loading ? "#818cf8" : "linear-gradient(135deg,#6366f1,#4f46e5)",
                color: "#fff", fontWeight: 700, fontSize: 15,
                border: "none", cursor: loading ? "not-allowed" : "pointer",
                boxShadow: "0 6px 20px rgba(99,102,241,0.4)",
                transition: "opacity 0.15s",
              }}
            >
              {loading ? (
                <>
                  <div style={{
                    width: 16, height: 16,
                    border: "2px solid rgba(255,255,255,0.4)",
                    borderTopColor: "#fff", borderRadius: "50%",
                    animation: "spin 0.7s linear infinite",
                  }} />
                  Signing in…
                </>
              ) : (
                <> Sign In <ArrowRight size={16} /> </>
              )}
            </button>
          </form>

          <div style={{ textAlign: "center", marginTop: 22, fontSize: 14, color: "#94a3b8" }}>
            Don't have an account?{" "}
            <Link to="/register" style={{ color: "#6366f1", textDecoration: "none", fontWeight: 700 }}>
              Create account
            </Link>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

/* ── Desktop Login (unchanged) ───────────────────────────── */
function DesktopLogin() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.email || !form.password) { setError("Please fill in all fields."); return; }
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success("Welcome back!");
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "row",
      background: "var(--bg-base)", overflowX: "hidden",
    }}>
      {/* Left decorative panel */}
      <div style={{
        flex: "0 0 480px",
        background: "linear-gradient(135deg, #0f0e2e 0%, #1a1040 50%, #0c1a2e 100%)",
        display: "flex", flexDirection: "column", justifyContent: "center",
        padding: "60px 56px", position: "relative", overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", top: -80, left: -80, width: 300, height: 300,
          borderRadius: "50%", background: "rgba(99,102,241,0.10)",
        }} />
        <div style={{
          position: "absolute", bottom: -60, right: -40, width: 200, height: 200,
          borderRadius: "50%", background: "rgba(8,145,178,0.08)",
        }} />

        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 56 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10,
              background: "linear-gradient(135deg,#6366f1,#22d3ee)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Zap size={18} color="#fff" fill="#fff" />
            </div>
            <span style={{ fontSize: 18, fontWeight: 800, color: "#f1f5f9", letterSpacing: "-0.3px" }}>
              StartUp Portal
            </span>
          </div>

          <h1 style={{
            fontSize: 32, fontWeight: 800, color: "#f1f5f9",
            letterSpacing: "-0.8px", lineHeight: 1.2, marginBottom: 16,
          }}>
            Every meeting.<br />Captured perfectly.
          </h1>

          <p style={{
            fontSize: 14, color: "#94a3b8", lineHeight: 1.7, marginBottom: 40, maxWidth: 360,
          }}>
            The enterprise meeting platform that captures notes, records audio, and turns your
            discussions into actionable outcomes.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              "📝 Structured notes per discussion topic",
              "🎤 Voice recording with instant playback",
              "✅ Action items with assignees & due dates",
              "📊 Analytics dashboard for your entire team",
            ].map(item => (
              <div key={item} style={{ fontSize: 13, color: "#cbd5e1", display: "flex", alignItems: "center", gap: 8 }}>
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div style={{
        flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
        padding: "40px 60px", width: "100%",
      }}>
        <div style={{ width: "100%", maxWidth: 420 }}>
          <div style={{ marginBottom: 32 }}>
            <h2 style={{
              fontSize: 24, fontWeight: 800, color: "var(--text-primary)",
              letterSpacing: "-0.5px", marginBottom: 6, lineHeight: 1.2,
            }}>
              Sign in to your account
            </h2>
            <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
              Access your meeting workspace
            </p>
          </div>

          {error && (
            <div style={{
              display: "flex", alignItems: "flex-start", gap: 8,
              padding: "11px 14px", borderRadius: "var(--radius-sm)",
              background: "var(--rose-soft)", border: "1px solid var(--rose)",
              marginBottom: 20, fontSize: 13, color: "var(--rose)", lineHeight: 1.5,
            }}>
              <AlertCircle size={14} style={{ marginTop: 2, flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={{
                fontSize: 11, fontWeight: 700, color: "var(--text-muted)",
                display: "block", marginBottom: 6,
                textTransform: "uppercase", letterSpacing: "0.5px",
              }}>
                Email Address
              </label>
              <div style={{ position: "relative" }}>
                <Mail size={14} color="var(--text-muted)" style={{
                  position: "absolute", left: 12, top: "50%",
                  transform: "translateY(-50%)", pointerEvents: "none",
                }} />
                <input
                  className="input"
                  type="email"
                  value={form.email}
                  onChange={e => set("email", e.target.value)}
                  placeholder="you@company.com"
                  style={{ paddingLeft: 38, width: "100%", boxSizing: "border-box" }}
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label style={{
                fontSize: 11, fontWeight: 700, color: "var(--text-muted)",
                display: "block", marginBottom: 6,
                textTransform: "uppercase", letterSpacing: "0.5px",
              }}>
                Password
              </label>
              <div style={{ position: "relative" }}>
                <Lock size={14} color="var(--text-muted)" style={{
                  position: "absolute", left: 12, top: "50%",
                  transform: "translateY(-50%)", pointerEvents: "none",
                }} />
                <input
                  className="input"
                  type={showPw ? "text" : "password"}
                  value={form.password}
                  onChange={e => set("password", e.target.value)}
                  placeholder="Enter your password"
                  style={{ paddingLeft: 38, paddingRight: 40, width: "100%", boxSizing: "border-box" }}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  style={{
                    position: "absolute", right: 12, top: "50%",
                    transform: "translateY(-50%)",
                    background: "none", border: "none", cursor: "pointer",
                    color: "var(--text-muted)", padding: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={loading}
              style={{ width: "100%", justifyContent: "center", marginTop: 4, minHeight: 44 }}
            >
              {loading ? (
                <>
                  <div style={{
                    width: 15, height: 15,
                    border: "2px solid rgba(255,255,255,0.4)",
                    borderTopColor: "#fff", borderRadius: "50%",
                    animation: "spin 0.7s linear infinite",
                  }} />
                  Signing in…
                </>
              ) : (
                <> Sign In <ArrowRight size={15} /> </>
              )}
            </button>
          </form>

          <div style={{
            textAlign: "center", marginTop: 20,
            fontSize: 13, color: "var(--text-muted)", lineHeight: 1.5,
          }}>
            Don't have an account?{" "}
            <Link to="/register" style={{ color: "var(--accent-text)", textDecoration: "none", fontWeight: 600 }}>
              Create account
            </Link>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

/* ── Main Login Export ───────────────────────────────────── */
export default function Login() {
  const isMobile = useIsMobile(768);

  // Mobile has two "screens": landing → sign-in form
  const [mobileScreen, setMobileScreen] = useState("landing"); // "landing" | "signin"

  if (!isMobile) {
    // Desktop: unchanged split layout
    return <DesktopLogin />;
  }

  // Mobile: landing page first, then sign-in form
  if (mobileScreen === "landing") {
    return <MobileLanding onSignIn={() => setMobileScreen("signin")} />;
  }

  return <MobileSignInForm onBack={() => setMobileScreen("landing")} />;
}
