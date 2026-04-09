import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Zap, Mail, Lock, Eye, EyeOff, AlertCircle, ArrowRight } from "lucide-react";
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

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const isMobile = useIsMobile(768);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.email || !form.password) {
      setError("Please fill in all fields.");
      return;
    }

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
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        background: "var(--bg-base)",
        overflowX: "hidden",
      }}
    >
      {/* Left panel */}
      {!isMobile && (
        <div
          style={{
            flex: "0 0 480px",
            background:
              "linear-gradient(135deg, #0f0e2e 0%, #1a1040 50%, #0c1a2e 100%)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "60px 56px",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: -80,
              left: -80,
              width: 300,
              height: 300,
              borderRadius: "50%",
              background: "rgba(99,102,241,0.10)",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: -60,
              right: -40,
              width: 200,
              height: 200,
              borderRadius: "50%",
              background: "rgba(8,145,178,0.08)",
            }}
          />

          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 56 }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: "linear-gradient(135deg,#6366f1,#22d3ee)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Zap size={18} color="#fff" fill="#fff" />
              </div>
              <span
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  color: "#f1f5f9",
                  letterSpacing: "-0.3px",
                }}
              >
                StartUp Portal
              </span>
            </div>

            <h1
              style={{
                fontSize: 32,
                fontWeight: 800,
                color: "#f1f5f9",
                letterSpacing: "-0.8px",
                lineHeight: 1.2,
                marginBottom: 16,
              }}
            >
              Every meeting.
              <br />
              Captured perfectly.
            </h1>

            <p
              style={{
                fontSize: 14,
                color: "#94a3b8",
                lineHeight: 1.7,
                marginBottom: 40,
                maxWidth: 360,
              }}
            >
              The enterprise meeting platform that captures notes, records audio, and turns your
              discussions into actionable outcomes.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                "📝 Structured notes per discussion topic",
                "🎤 Voice recording with instant playback",
                "✅ Action items with assignees & due dates",
                "📊 Analytics dashboard for your entire team",
              ].map((item) => (
                <div
                  key={item}
                  style={{
                    fontSize: 13,
                    color: "#cbd5e1",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Right panel */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: isMobile ? "24px 16px" : "40px 60px",
          width: "100%",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 420,
            background: isMobile ? "transparent" : "transparent",
          }}
        >
          {/* Mobile header */}
          {isMobile && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: "linear-gradient(135deg,#6366f1,#22d3ee)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Zap size={18} color="#fff" fill="#fff" />
              </div>
              <span
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  color: "var(--text-primary)",
                  letterSpacing: "-0.3px",
                }}
              >
                StartUp Portal
              </span>
            </div>
          )}

          <div style={{ marginBottom: 32 }}>
            <h2
              style={{
                fontSize: isMobile ? 22 : 24,
                fontWeight: 800,
                color: "var(--text-primary)",
                letterSpacing: "-0.5px",
                marginBottom: 6,
                lineHeight: 1.2,
              }}
            >
              Sign in to your account
            </h2>
            <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
              Access your meeting workspace
            </p>
          </div>

          {error && (
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 8,
                padding: "11px 14px",
                borderRadius: "var(--radius-sm)",
                background: "var(--rose-soft)",
                border: "1px solid var(--rose)",
                marginBottom: 20,
                fontSize: 13,
                color: "var(--rose)",
                lineHeight: 1.5,
              }}
            >
              <AlertCircle size={14} style={{ marginTop: 2, flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "var(--text-muted)",
                  display: "block",
                  marginBottom: 6,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                Email Address
              </label>
              <div style={{ position: "relative" }}>
                <Mail
                  size={14}
                  color="var(--text-muted)"
                  style={{
                    position: "absolute",
                    left: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    pointerEvents: "none",
                  }}
                />
                <input
                  className="input"
                  type="email"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  placeholder="you@company.com"
                  style={{
                    paddingLeft: 38,
                    width: "100%",
                    boxSizing: "border-box",
                  }}
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "var(--text-muted)",
                  display: "block",
                  marginBottom: 6,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                Password
              </label>
              <div style={{ position: "relative" }}>
                <Lock
                  size={14}
                  color="var(--text-muted)"
                  style={{
                    position: "absolute",
                    left: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    pointerEvents: "none",
                  }}
                />
                <input
                  className="input"
                  type={showPw ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => set("password", e.target.value)}
                  placeholder="Enter your password"
                  style={{
                    paddingLeft: 38,
                    paddingRight: 40,
                    width: "100%",
                    boxSizing: "border-box",
                  }}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  aria-label={showPw ? "Hide password" : "Show password"}
                  style={{
                    position: "absolute",
                    right: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--text-muted)",
                    padding: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
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
              style={{
                width: "100%",
                justifyContent: "center",
                marginTop: 4,
                minHeight: 44,
              }}
            >
              {loading ? (
                <>
                  <div
                    style={{
                      width: 15,
                      height: 15,
                      border: "2px solid rgba(255,255,255,0.4)",
                      borderTopColor: "#fff",
                      borderRadius: "50%",
                      animation: "spin 0.7s linear infinite",
                    }}
                  />
                  Signing in…
                </>
              ) : (
                <>
                  Sign In <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>

          <div
            style={{
              textAlign: "center",
              marginTop: 20,
              fontSize: 13,
              color: "var(--text-muted)",
              lineHeight: 1.5,
            }}
          >
            Don't have an account?{" "}
            <Link
              to="/register"
              style={{
                color: "var(--accent-text)",
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              Create account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}