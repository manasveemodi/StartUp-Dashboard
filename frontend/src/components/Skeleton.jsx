import React from "react";

function Skeleton({ width = "100%", height = 16, borderRadius = 6, style = {} }) {
  return (
    <div style={{
      width, height, borderRadius,
      background: "linear-gradient(90deg, var(--bg-elevated) 25%, var(--bg-card-hover) 50%, var(--bg-elevated) 75%)",
      backgroundSize: "200% 100%",
      animation: "shimmer 1.4s ease-in-out infinite",
      ...style,
    }} />
  );
}

export function MeetingCardSkeleton() {
  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: 22 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
        <Skeleton width="60%" height={18} />
        <Skeleton width={60} height={22} borderRadius={99} />
      </div>
      <Skeleton height={13} style={{ marginBottom: 8 }} />
      <Skeleton width="80%" height={13} style={{ marginBottom: 16 }} />
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <Skeleton width={120} height={12} />
        <Skeleton width={60} height={12} />
      </div>
    </div>
  );
}

export function NoteCardSkeleton() {
  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: 20, borderLeft: "3px solid var(--bg-elevated)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
        <Skeleton width="55%" height={16} />
        <Skeleton width={50} height={20} borderRadius={99} />
      </div>
      <Skeleton height={13} style={{ marginBottom: 6 }} />
      <Skeleton width="90%" height={13} style={{ marginBottom: 6 }} />
      <Skeleton width="70%" height={13} style={{ marginBottom: 14 }} />
      <Skeleton width={140} height={11} />
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: 24 }}>
      <Skeleton width={44} height={44} borderRadius={12} style={{ marginBottom: 12 }} />
      <Skeleton width={60} height={28} style={{ marginBottom: 6 }} />
      <Skeleton width={100} height={13} />
    </div>
  );
}

// Inject shimmer keyframes once
const style = document.createElement("style");
style.textContent = `@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`;
if (!document.head.querySelector("[data-skeleton]")) {
  style.setAttribute("data-skeleton", "1");
  document.head.appendChild(style);
}

export default Skeleton;
