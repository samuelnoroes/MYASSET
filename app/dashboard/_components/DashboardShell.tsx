"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";

const PANEL_WIDTH = 284;
const WA_PHONE = "5511987266842";
const WA_MESSAGE = encodeURIComponent("Olá! Preciso de suporte com o MyAsset. 👋");

type Notification = {
  id: string;
  title: string;
  body: string;
  type: "opportunity" | "optimization" | "news";
  created_at: string;
};

const TYPE_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; icon: string }
> = {
  opportunity: {
    label: "Oportunidade",
    color: "#D97706",
    bg: "#FFFBEB",
    icon: "💡",
  },
  optimization: {
    label: "Otimização",
    color: "#2D4A3E",
    bg: "#F0FDF4",
    icon: "📈",
  },
  news: {
    label: "Mercado",
    color: "#3B82F6",
    bg: "#EFF6FF",
    icon: "📰",
  },
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (diffDays === 0) return "Hoje";
  if (diffDays === 1) return "Ontem";
  if (diffDays < 7) return `${diffDays} dias atrás`;
  return new Intl.DateTimeFormat("pt-BR", {
    day: "numeric",
    month: "short",
  }).format(date);
}

export default function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restaura estado do painel (padrão: aberto)
    const saved = localStorage.getItem("notif-panel-open");
    setPanelOpen(saved === null ? true : saved === "true");
    setMounted(true);

    // Busca notificações
    const supabase = createClient();
    supabase
      .from("notifications")
      .select("id, title, body, type, created_at")
      .eq("active", true)
      .order("created_at", { ascending: false })
      .limit(30)
      .then(({ data }) => {
        setNotifications(data ?? []);
        setLoading(false);
      });
  }, []);

  function toggle(open: boolean) {
    setPanelOpen(open);
    localStorage.setItem("notif-panel-open", String(open));
  }

  // Antes do mount não renderiza o painel para evitar layout shift
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <div style={{ position: "relative" }}>
      {/* Conteúdo principal — recua quando painel está aberto */}
      <div
        style={{
          paddingRight: panelOpen ? PANEL_WIDTH : 0,
          transition: "padding-right 0.3s ease",
          minHeight: "100vh",
        }}
      >
        {children}
      </div>

      {/* ── PAINEL LATERAL ───────────────────────────────── */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: PANEL_WIDTH,
          transform: panelOpen ? "translateX(0)" : `translateX(${PANEL_WIDTH}px)`,
          transition: "transform 0.3s ease",
          zIndex: 40,
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#FFFFFF",
          borderLeft: "1px solid #E5E7EB",
          boxShadow: "-4px 0 24px rgba(0,0,0,0.10)",
        }}
      >
        {/* Header do painel */}
        <div
          style={{
            backgroundColor: "#1F2937",
            color: "white",
            padding: "14px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 14 }}>📢</span>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.12em",
              }}
            >
              Informativos A5
            </span>
          </div>
          <button
            onClick={() => toggle(false)}
            style={{
              background: "none",
              border: "none",
              color: "rgba(255,255,255,0.5)",
              fontSize: 22,
              lineHeight: 1,
              cursor: "pointer",
              padding: "2px 6px",
              borderRadius: 4,
            }}
            title="Fechar painel"
          >
            ×
          </button>
        </div>

        {/* Lista de mensagens */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: 12,
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          {loading ? (
            <p
              style={{
                textAlign: "center",
                color: "#9CA3AF",
                fontSize: 13,
                padding: "32px 0",
              }}
            >
              Carregando...
            </p>
          ) : notifications.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 16px" }}>
              <p style={{ fontSize: 32, marginBottom: 10 }}>📭</p>
              <p style={{ color: "#9CA3AF", fontSize: 13, lineHeight: 1.5 }}>
                Nenhum informativo no momento.
                <br />
                Novidades aparecerão aqui.
              </p>
            </div>
          ) : (
            notifications.map((n) => {
              const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.news;
              return (
                <div
                  key={n.id}
                  style={{
                    backgroundColor: cfg.bg,
                    borderLeft: `3px solid ${cfg.color}`,
                    borderRadius: "0 6px 6px 0",
                    padding: "10px 12px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 5,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                      }}
                    >
                      <span style={{ fontSize: 12 }}>{cfg.icon}</span>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.08em",
                          color: cfg.color,
                        }}
                      >
                        {cfg.label}
                      </span>
                    </div>
                    <span style={{ fontSize: 10, color: "#9CA3AF" }}>
                      {formatDate(n.created_at)}
                    </span>
                  </div>
                  <p
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#1A1A1A",
                      lineHeight: 1.4,
                      marginBottom: 4,
                    }}
                  >
                    {n.title}
                  </p>
                  <p
                    style={{
                      fontSize: 12,
                      color: "#4B5563",
                      lineHeight: 1.55,
                    }}
                  >
                    {n.body}
                  </p>
                </div>
              );
            })
          )}
        </div>

        {/* Rodapé do painel */}
        <div
          style={{
            padding: "10px 16px",
            borderTop: "1px solid #F3F4F6",
            flexShrink: 0,
            textAlign: "center",
          }}
        >
          <p
            style={{
              fontSize: 10,
              color: "#D1D5DB",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
            }}
          >
            A5 Asset · Informativo diário
          </p>
        </div>
      </div>

      {/* ── ABA PARA REABRIR ─────────────────────────────── */}
      <button
        onClick={() => toggle(true)}
        style={{
          position: "fixed",
          right: 0,
          top: "50%",
          transform: panelOpen
            ? "translateY(-50%) translateX(100%)"
            : "translateY(-50%) translateX(0)",
          transition: "transform 0.3s ease",
          zIndex: 39,
          backgroundColor: "#1F2937",
          color: "white",
          writingMode: "vertical-rl",
          padding: "14px 8px",
          fontSize: 11,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.12em",
          borderRadius: "6px 0 0 6px",
          cursor: "pointer",
          border: "none",
          boxShadow: "-3px 0 10px rgba(0,0,0,0.18)",
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        📢 Informativos
      </button>

      {/* ── BOTÃO WHATSAPP ───────────────────────────────── */}
      <a
        href={`https://wa.me/${WA_PHONE}?text=${WA_MESSAGE}`}
        target="_blank"
        rel="noopener noreferrer"
        title="Suporte A5"
        style={{
          position: "fixed",
          bottom: 24,
          right: panelOpen ? PANEL_WIDTH + 16 : 24,
          zIndex: 50,
          width: 52,
          height: 52,
          borderRadius: "50%",
          backgroundColor: "#25D366",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 14px rgba(0,0,0,0.22)",
          transition: "right 0.3s ease",
          textDecoration: "none",
        }}
      >
        <svg width="26" height="26" viewBox="0 0 32 32" fill="white">
          <path d="M16 2C8.268 2 2 8.268 2 16c0 2.478.675 4.796 1.851 6.782L2 30l7.438-1.82A13.93 13.93 0 0016 30c7.732 0 14-6.268 14-14S23.732 2 16 2zm6.29 19.927c-.344-.172-2.035-1.003-2.35-1.118-.316-.115-.546-.172-.776.172-.23.344-.888 1.118-1.088 1.348-.2.23-.4.258-.744.086-.344-.172-1.454-.535-2.768-1.703-1.023-.912-1.714-2.037-1.914-2.381-.2-.344-.022-.53.15-.701.155-.154.344-.4.516-.601.172-.2.23-.344.344-.573.115-.23.057-.43-.028-.601-.086-.172-.776-1.872-1.062-2.564-.28-.672-.565-.58-.776-.59l-.66-.012c-.23 0-.601.086-.916.43-.315.344-1.204 1.175-1.204 2.866 0 1.69 1.233 3.324 1.405 3.553.172.23 2.428 3.71 5.882 5.203.822.355 1.464.567 1.965.726.826.262 1.578.225 2.173.137.663-.098 2.035-.832 2.322-1.635.287-.803.287-1.49.2-1.635-.086-.144-.315-.23-.659-.4z" />
        </svg>
      </a>
    </div>
  );
}
