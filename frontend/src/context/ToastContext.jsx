import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle, XCircle, AlertCircle, Info, X } from "lucide-react";

const ToastContext = createContext(null);

const icons = {
  success: <CheckCircle size={16} color="var(--green)" />,
  error:   <XCircle    size={16} color="var(--rose)"  />,
  warning: <AlertCircle size={16} color="var(--amber)" />,
  info:    <Info        size={16} color="var(--accent)" />,
};

const borders = {
  success: "var(--green)",
  error:   "var(--rose)",
  warning: "var(--amber)",
  info:    "var(--accent)",
};

function Toast({ id, type = "info", message, onDismiss }) {
  return (
    <div
      className="animate-fade"
      style={{
        display: "flex", alignItems: "flex-start", gap: 10,
        padding: "12px 16px", borderRadius: "var(--radius-sm)",
        background: "var(--bg-elevated)", border: "1px solid var(--border-accent)",
        borderLeft: `3px solid ${borders[type]}`,
        boxShadow: "0 8px 32px #00000050",
        minWidth: 280, maxWidth: 380, cursor: "default",
      }}
    >
      <span style={{ flexShrink: 0, marginTop: 1 }}>{icons[type]}</span>
      <span style={{ flex: 1, fontSize: 13, color: "var(--text-primary)", lineHeight: 1.5 }}>{message}</span>
      <button onClick={() => onDismiss(id)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 2, flexShrink: 0 }}>
        <X size={14} />
      </button>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const toast = useCallback((message, type = "info", duration = 4000) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    if (duration > 0) setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), duration);
    return id;
  }, []);

  const dismiss = useCallback((id) => setToasts((prev) => prev.filter((t) => t.id !== id)), []);

  const api = {
    success: (msg, dur) => toast(msg, "success", dur),
    error:   (msg, dur) => toast(msg, "error",   dur),
    warning: (msg, dur) => toast(msg, "warning", dur),
    info:    (msg, dur) => toast(msg, "info",    dur),
    dismiss,
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div style={{ position: "fixed", bottom: 24, right: 24, display: "flex", flexDirection: "column", gap: 8, zIndex: 9999 }}>
        {toasts.map((t) => <Toast key={t.id} {...t} onDismiss={dismiss} />)}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be inside ToastProvider");
  return ctx;
};
