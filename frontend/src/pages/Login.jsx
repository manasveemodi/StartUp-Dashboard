import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Zap, Mail, Lock, Eye, EyeOff,
  AlertCircle, ArrowRight, Menu, X
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

export default function Login() {
  const [form, setForm] = useState({ email:"", password:"" });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [menuOpen, setMenuOpen] = useState(false);
  const [showLogin, setShowLogin] = useState(false); // ✅ modal control

  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

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
      setError(err.response?.data?.message || "Invalid credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight:"100vh", display:"flex", background:"var(--bg-base)" }}>

      {/* ✅ HAMBURGER */}
      <div className="mobile-menu-btn" style={{ position:"fixed", top:16, right:16, zIndex:1000 }}>
        <button onClick={()=>setMenuOpen(!menuOpen)}>
          {menuOpen ? <X size={20}/> : <Menu size={20}/>}
        </button>
      </div>

      {/* ✅ MENU */}
      {menuOpen && (
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
          <Link to="/" onClick={()=>setMenuOpen(false)}>Home</Link>

          <div
            style={{ marginTop:10, cursor:"pointer", fontWeight:600 }}
            onClick={()=>{
              setShowLogin(true);
              setMenuOpen(false);
            }}
          >
            Sign In
          </div>
        </div>
      )}

      {/* LEFT PANEL (UNCHANGED) */}
      <div className="login-left" style={{
        flex:"1",
        background:"linear-gradient(135deg,#0f0e2e,#1a1040,#0c1a2e)",
        display:"flex",
        alignItems:"center",
        justifyContent:"center"
      }}>
        <h1 style={{ color:"#fff" }}>Welcome</h1>
      </div>

      {/* ❌ REMOVED RIGHT PANEL DEFAULT */}

      {/* ✅ LOGIN MODAL */}
      {showLogin && (
        <div
          style={{
            position:"fixed",
            inset:0,
            background:"rgba(0,0,0,0.5)",
            display:"flex",
            alignItems:"center",
            justifyContent:"center",
            zIndex:2000
          }}
          onClick={()=>setShowLogin(false)}
        >
          <div
            style={{
              background:"#fff",
              padding:20,
              borderRadius:12,
              width:"90%",
              maxWidth:380
            }}
            onClick={(e)=>e.stopPropagation()}
          >

            <h2 style={{ fontWeight:800 }}>Sign in</h2>

            {error && <div style={{ color:"red" }}>{error}</div>}

            <form onSubmit={handleSubmit} style={{ display:"flex", flexDirection:"column", gap:12 }}>

              <input
                className="input"
                placeholder="Email"
                value={form.email}
                onChange={e=>set("email",e.target.value)}
              />

              <input
                className="input"
                type={showPw ? "text":"password"}
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