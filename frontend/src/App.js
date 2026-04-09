import React, { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";

import { AuthProvider, useAuth } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import { ThemeProvider } from "./context/ThemeContext";
import { CompanyTimeProvider } from "./context/CompanyTimeContext";
import { ProtectedRoute, GuestRoute } from "./components/ProtectedRoute";
import { SidebarContext } from "./context/SidebarContext";

import Sidebar          from "./components/Sidebar";
import Dashboard        from "./pages/Dashboard";
import CompanyList      from "./pages/CompanyList";
import CompanyRegister  from "./pages/CompanyRegister";
import MeetingList      from "./pages/MeetingList";
import MeetingWorkspace from "./pages/MeetingWorkspace";
import AllNotes         from "./pages/AllNotes";
import AllRecordings    from "./pages/AllRecordings";
import Profile          from "./pages/Profile";
import Login            from "./pages/Login";
import Register         from "./pages/Register";
import AdminUsers       from "./pages/AdminUsers";


// ── Layout Wrapper ───────────────────────────────────────────
function Shell({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen(o => !o);
  const closeSidebar  = () => setSidebarOpen(false);

  return (
    <SidebarContext.Provider value={{ sidebarOpen, toggleSidebar, closeSidebar }}>
      <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-base)" }}>

        {/* Mobile overlay backdrop — sits above content, below sidebar */}
        {sidebarOpen && (
          <div
            onClick={closeSidebar}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.45)",
              zIndex: 98,        /* just below sidebar's z-index 100 */
              backdropFilter: "blur(2px)",
            }}
          />
        )}

        <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />

        <main
          style={{
            flex: 1,
            marginLeft: "var(--sidebar-width)",
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
          }}
          className="shell-main"
        >
          {children}
        </main>

        <style>{`
          @media (max-width: 768px) {
            .shell-main {
              margin-left: 0 !important;
            }
          }
        `}</style>
      </div>
    </SidebarContext.Provider>
  );
}

// ── Protected Wrapper ────────────────────────────────────────
const P = ({ children }) => (
  <ProtectedRoute>
    <Shell>{children}</Shell>
  </ProtectedRoute>
);


// ── Routes with Role Access ──────────────────────────────────
function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>

      {/* Auth */}
      <Route path="/login"    element={<GuestRoute><Login /></GuestRoute>} />
      <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />

      {/* Dashboard */}
      <Route path="/" element={<P><Dashboard /></P>} />

      {/* Companies */}
      <Route path="/companies"     element={<P><CompanyList /></P>} />
      <Route path="/companies/new" element={<P><CompanyRegister /></P>} />

      {/* Company Details Page */}
      <Route path="/companies/:companyId" element={<P><MeetingWorkspace /></P>} />

      {/* Meetings */}
      <Route path="/meetings"            element={<P><MeetingList /></P>} />
      <Route path="/meetings/:companyId" element={<P><MeetingWorkspace /></P>} />

      {/* Other */}
      <Route path="/notes"      element={<P><AllNotes /></P>} />
      <Route path="/recordings" element={<P><AllRecordings /></P>} />
      <Route path="/profile"    element={<P><Profile /></P>} />

      {/* ADMIN ONLY */}
      {user?.role === "admin" && (
        <Route path="/admin/users" element={<P><AdminUsers /></P>} />
      )}

    </Routes>
  );
}


// ── Main App ─────────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <CompanyTimeProvider>
              <AppRoutes />
            </CompanyTimeProvider>
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
