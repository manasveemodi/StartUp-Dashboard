import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Zap, Mail, Lock, Eye, EyeOff, AlertCircle, ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

export default function Login() {
  const [form, setForm]       = useState({ email:"", password:"" });
  const [showPw, setShowPw]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const { login }             = useAuth();
  const toast                 = useToast();
  const navigate              = useNavigate();
  const set = (k,v) => setForm(f => ({ ...f, [k]:v }));

  const handleSubmit = async e => {
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
        flexWrap: "wrap", // ✅ important for mobile
        background: "var(--bg-base)"
      }}
    >

      {/* LEFT PANEL */}
      <div
        className="login-left"
        style={{
          flex: "1 1 480px",
          minWidth: 300,
          background: "linear-gradient(135deg, #0f0e2e 0%, #1a1040 50%, #0c1a2e 100%)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "60px 56px",
          position: "relative",
          overflow: "hidden"
        }}
      >
        <div style={{ position:"absolute", top:-80, left:-80, width:300, height:300, borderRadius:"50%", background:"rgba(99,102,241,0.10)" }} />
        <div style={{ position:"absolute", bottom:-60, right:-40, width:200, height:200, borderRadius:"50%", background:"rgba(8,145,178,0.08)" }} />

        <div style={{ position:"relative", zIndex:1 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:56 }}>
            <div style={{ width:38, height:38, borderRadius:10, background:"linear-gradient(135deg,#6366f1,#22d3ee)", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <Zap size={18} color="#fff" fill="#fff" />
            </div>
            <span style={{ fontSize:18, fontWeight:800, color:"#f1f5f9" }}>
              StartUp Portal
            </span>
          </div>

          <h1 style={{ fontSize:32, fontWeight:800, color:"#f1f5f9", lineHeight:1.2, marginBottom:16 }}>
            Every meeting.<br />Captured perfectly.
          </h1>

          <p style={{ fontSize:14, color:"#94a3b8", marginBottom:40 }}>
            The enterprise meeting platform that captures notes, records audio, and turns your discussions into actionable outcomes.
          </p>

          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {[
              "📝 Structured notes per discussion topic",
              "🎤 Voice recording with instant playback",
              "✅ Action items with assignees & due dates",
              "📊 Analytics dashboard for your entire team"
            ].map(item => (
              <div key={item} style={{ fontSize:13, color:"#cbd5e1", display:"flex", gap:8 }}>
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div
        style={{
          flex: "1 1 400px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px"
        }}
      >
        <div style={{ width:"100%", maxWidth:380, margin:"0 auto" }}>

          <div style={{ marginBottom:32 }}>
            <h2 className="login-title" style={{ fontSize:24, fontWeight:800, marginBottom:6 }}>
              Sign in to your account
            </h2>
            <p style={{ fontSize:13, color:"var(--text-muted)" }}>
              Access your meeting workspace
            </p>
          </div>

          {error && (
            <div style={{
              display:"flex",
              gap:8,
              padding:"11px 14px",
              borderRadius:"var(--radius-sm)",
              background:"var(--rose-soft)",
              border:"1px solid var(--rose)",
              marginBottom:20,
              fontSize:13,
              color:"var(--rose)"
            }}>
              <AlertCircle size={14} /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display:"flex", flexDirection:"column", gap:16 }}>

            {/* EMAIL */}
            <div>
              <label style={{ fontSize:11, fontWeight:700, marginBottom:6, display:"block" }}>
                Email Address
              </label>
              <div style={{ position:"relative" }}>
                <Mail size={14} style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)" }} />
                <input
                  className="input"
                  type="email"
                  value={form.email}
                  onChange={e => set("email",e.target.value)}
                  placeholder="you@company.com"
                  style={{ paddingLeft:38 }}
                />
              </div>
            </div>

            {/* PASSWORD */}
            <div>
              <label style={{ fontSize:11, fontWeight:700, marginBottom:6, display:"block" }}>
                Password
              </label>
              <div style={{ position:"relative" }}>
                <Lock size={14} style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)" }} />
                <input
                  className="input"
                  type={showPw ? "text" : "password"}
                  value={form.password}
                  onChange={e => set("password",e.target.value)}
                  placeholder="Enter your password"
                  style={{ paddingLeft:38, paddingRight:40 }}
                />
                <button
                  type="button"
                  onClick={()=>setShowPw(!showPw)}
                  style={{
                    position:"absolute",
                    right:12,
                    top:"50%",
                    transform:"translateY(-50%)",
                    background:"none",
                    border:"none",
                    cursor:"pointer"
                  }}
                >
                  {showPw ? <EyeOff size={14}/> : <Eye size={14}/>}
                </button>
              </div>
            </div>

            {/* BUTTON */}
            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={loading}
              style={{ width:"100%", justifyContent:"center", marginTop:4 }}
            >
              {loading ? "Signing in..." : <>Sign In <ArrowRight size={15}/></>}
            </button>
          </form>

          <div style={{ textAlign:"center", marginTop:20, fontSize:13 }}>
            Don't have an account?{" "}
            <Link to="/register" style={{ fontWeight:600 }}>
              Create account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}