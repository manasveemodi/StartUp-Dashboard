import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from "react";
import { companiesAPI } from "../utils/api";

const CompanyTimeContext = createContext(null);

export function CompanyTimeProvider({ children }) {
  const [activeCompanyId,   setActiveCompanyId]   = useState(null);
  const [activeCompanyName, setActiveCompanyName] = useState("");
  const [sessionId,         setSessionId]         = useState(null);
  const [isRunning,         setIsRunning]         = useState(false);
  const [sessionSecs,       setSessionSecs]       = useState(0);
  const [totalSavedSecs,    setTotalSavedSecs]    = useState(0);

  const startRef = useRef(null);

  const loadTotal = useCallback(async (companyId) => {
    try {
      const r = await companiesAPI.getTime(companyId);
      // BUG FIX: Checks both nested and flat data structures from API
      const savedSeconds = r.data?.data?.totalSeconds ?? r.data?.totalSeconds ?? 0;
      setTotalSavedSecs(savedSeconds);
    } catch (err) { 
      console.error("Error loading total time:", err);
      setTotalSavedSecs(0); 
    }
  }, []);

  const enterCompany = useCallback(async (id, name) => {
    setActiveCompanyId(id);
    setActiveCompanyName(name || "");
    await loadTotal(id);
  }, [loadTotal]);

  const leaveCompany = useCallback(async () => {
    if (isRunning && sessionId && activeCompanyId) {
      const finalTime = Math.floor((Date.now() - startRef.current) / 1000);
      try {
        await companiesAPI.endSession(activeCompanyId, sessionId, { elapsed: finalTime });
      } catch (err) {}
    }
    setIsRunning(false);
    setSessionId(null);
    setSessionSecs(0);
    setActiveCompanyId(null);
    setActiveCompanyName("");
    setTotalSavedSecs(0);
  }, [isRunning, sessionId, activeCompanyId]);

  useEffect(() => {
    let interval = null;
    if (isRunning) {
      interval = setInterval(() => {
        const now = Date.now();
        setSessionSecs(Math.floor((now - startRef.current) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const startTimer = useCallback(async () => {
    if (!activeCompanyId || isRunning) return;
    try {
      const res = await companiesAPI.startSession(activeCompanyId);
      setSessionId(res.data.data._id);
      setSessionSecs(0);
      startRef.current = Date.now();
      setIsRunning(true);
    } catch (err) {
      console.error("Failed to start timer:", err);
    }
  }, [activeCompanyId, isRunning]);

  const stopTimer = useCallback(async () => {
    if (!isRunning || !sessionId) return;
    
    const finalSessionTime = sessionSecs;
    setIsRunning(false);

    try {
      await companiesAPI.endSession(activeCompanyId, sessionId, { 
        elapsed: finalSessionTime 
      });
      // Optimistic update so UI feels instant
      setTotalSavedSecs(prev => prev + finalSessionTime);
      
      // Sync with server
      if (activeCompanyId) await loadTotal(activeCompanyId);
    } catch (err) {
      console.error("Failed to stop timer:", err);
    }

    setSessionId(null);
    setSessionSecs(0);
  }, [isRunning, sessionId, sessionSecs, activeCompanyId, loadTotal]);

  const liveTotal = totalSavedSecs + (isRunning ? sessionSecs : 0);
  const totalH    = Math.floor(liveTotal / 3600);
  const totalM    = Math.floor((liveTotal % 3600) / 60);
  const totalS    = liveTotal % 60;

  return (
    <CompanyTimeContext.Provider value={{
      activeCompanyId, activeCompanyName,
      isRunning, sessionSecs, liveTotal,
      totalH, totalM, totalS,
      enterCompany, leaveCompany, startTimer, stopTimer,
      loadTotal,
    }}>
      {children}
    </CompanyTimeContext.Provider>
  );
}

export const useCompanyTime = () => {
  const ctx = useContext(CompanyTimeContext);
  if (!ctx) throw new Error("useCompanyTime must be inside CompanyTimeProvider");
  return ctx;
};