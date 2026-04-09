import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Zap, Mail, Lock, Eye, EyeOff,
  AlertCircle, ArrowRight, Menu, X
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

export default function Login() {
  const [form, setForm]       = useState({ email:"", password:"" });
  const [showPw, setShowPw]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const { login } = useAuth();
  const toast     = useToast();
  const navigate  = useNavigate();

  const set = (k,v) => setForm(f => ({ ...f, [k]:v }));

  // ✅ detect screen resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
      setError(err.response?.data?.message || "Invalid credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight:"100vh", display:"flex", background:"var(--bg-base)" }}>

      {/* ✅ MOBILE HAMBURGER */}
      {isMobile && (
        <div style={{ position:"fixed", top:16, right:16, zIndex:1000 }}>
          <button onClick={()=>setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={20}/> : <Menu size={20}/>}
          </button>
        </div>
      )}

      {/* ✅ MOBILE MENU */}
      {isMobile && menuOpen && (
        <div style={{
          position:"fixed",
          top:60,
          right:16,
          width:200,
          background:"#fff",
          padding:12,
          borderRadius:10,
          boxShadow:"0 10px 30px rgba(0,0,0,0.15)",
          zIndex:999
        }}>
          <div
            style={{ cursor:"pointer", marginBottom:10 }}
            onClick={()=>{
              navigate("/");
              setMenuOpen(false);
            }}
          >
            Home
          </div>

          <div
            style={{ cursor:"pointer", fontWeight:600 }}
            onClick={()=>{
              navigate("/login");
              setMenuOpen(false);
            }}
          >
            Sign In
          </div>
        </div>
      )}

      {/* LEFT PANEL (ALWAYS SHOW) */}
      <div
        style={{
          flex:"1 1 480px",
          minWidth:300,
          background:"linear-gradient(135deg, #0f0e2e 0%, #1a1040 50%, #0c1a2e 100%)",
          display:"flex",
          flexDirection:"column",
          justifyContent:"center",
          padding:"60px 56px",
          position:"relative",
          overflow:"hidden"
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

          <h1 style={{ fontSize:32, fontWeight:800, color:"#f1f5f9", marginBottom:16 }}>
            Every meeting.<br />Captured perfectly.
          </h1>

          <p style={{ fontSize:14, color:"#94a3b8", marginBottom:40 }}>
            The enterprise meeting platform that captures notes and recordings.
          </p>
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
             {[ 
              "📝 Structured notes per discussion topic",
               "🎤 Voice recording with instant playback", 
               "✅ Action items with assignees & due dates",
               "📊 Analytics dashboard for your entire team" ].map(item => ( <div key={item} 
               style={{ fontSize:13, color:"#cbd5e1", display:"flex", gap:8 }}>
                {item} 
                </div>
               ))}
             </div>
        </div>
      </div>

      {/* ✅ RIGHT PANEL (DESKTOP ONLY) */}
      {!isMobile && (
        <div
          style={{
            flex:"1 1 400px",
            display:"flex",
            alignItems:"center",
            justifyContent:"center",
            padding:"20px"
          }}
        >
          <div style={{ width:"100%", maxWidth:380, margin:"0 auto" }}>

            <h2 style={{ fontSize:24, fontWeight:800 }}>
              Sign in to your account
            </h2>

            {error && <div style={{ color:"red" }}>{error}</div>}

            <form onSubmit={handleSubmit} style={{ display:"flex", flexDirection:"column", gap:16, marginTop:20 }}>

              <input
                className="input"
                type="email"
                placeholder="Email"
                value={form.email}
                onChange={e=>set("email",e.target.value)}
              />

              <input
                className="input"
                type="password"
                placeholder="Password"
                value={form.password}
                onChange={e=>set("password",e.target.value)}
              />

              <button className="btn btn-primary">
                {loading ? "Signing in..." : "Sign In"}
              </button>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}