"use client";

import { useState, useRef, useEffect } from "react";

type Props = {
  label: string;
  tooltip: string;
  children: React.ReactNode;
  className?: string;
};

export default function KpiCard({ label, tooltip, children, className = "" }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Fechar ao clicar fora
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div ref={ref} className={`card relative ${className}`}>
      {/* Botão ? — canto superior direito */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={`Saiba mais sobre ${label}`}
        style={{
          position: "absolute",
          top: 10,
          right: 10,
          width: 20,
          height: 20,
          borderRadius: "50%",
          backgroundColor: open ? "#C4A96B" : "#2A2D33",
          color: open ? "#fff" : "#6B7280",
          border: "none",
          cursor: "pointer",
          fontSize: 11,
          fontWeight: 800,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "background 0.15s, color 0.15s",
          flexShrink: 0,
          lineHeight: 1,
        }}
        onMouseEnter={e => {
          if (!open) {
            (e.currentTarget as HTMLElement).style.backgroundColor = "#C4A96B";
            (e.currentTarget as HTMLElement).style.color = "#fff";
          }
        }}
        onMouseLeave={e => {
          if (!open) {
            (e.currentTarget as HTMLElement).style.backgroundColor = "#2A2D33";
            (e.currentTarget as HTMLElement).style.color = "#6B7280";
          }
        }}
      >
        ?
      </button>

      {/* Tooltip suspenso */}
      {open && (
        <div
          style={{
            position: "absolute",
            top: 36,
            right: 0,
            zIndex: 50,
            width: 240,
            backgroundColor: "#141618",
            color: "#141618",
            borderRadius: 8,
            padding: "12px 14px",
            fontSize: 12,
            lineHeight: 1.6,
            boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
          }}
        >
          {/* Setinha */}
          <div style={{
            position: "absolute",
            top: -6,
            right: 12,
            width: 12,
            height: 12,
            backgroundColor: "#141618",
            transform: "rotate(45deg)",
            borderRadius: 2,
          }} />
          <p style={{ fontWeight: 700, marginBottom: 4, color: "#C4A96B", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            {label}
          </p>
          <p>{tooltip}</p>
        </div>
      )}

      {/* Label */}
      <p className="kpi-label" style={{ paddingRight: 24 }}>{label}</p>

      {/* Conteúdo (valor + subtexto) */}
      {children}
    </div>
  );
}
