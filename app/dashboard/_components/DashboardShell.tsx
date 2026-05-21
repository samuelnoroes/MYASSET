"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

const SIDEBAR_EXPANDED = 220;
const SIDEBAR_COLLAPSED = 64;
const PANEL_WIDTH = 284;
const WA_PHONE = "5511987266842";
const WA_MESSAGE = encodeURIComponent("Olá! Preciso de suporte com o MyAsset. 👋");

type Notification = {
  id: string;
  title: string;
  body: string;
  type: "opportunity" | "optimization" | "news";
  created_at: string;
  contact_label: string | null;
  contact_url: string | null;
};

const TYPE_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; icon: string; btnBg: string }
> = {
  opportunity: { label: "Oportunidade", color: "#D97706", bg: "#FFFBEB", icon: "💡", btnBg: "#D97706" },
  optimization: { label: "Otimização",  color: "#2D4A3E", bg: "#F0FDF4", icon: "📈", btnBg: "#2D4A3E" },
  news:         { label: "Mercado",     color: "#3B82F6", bg: "#EFF6FF", icon: "📰", btnBg: "#3B82F6" },
};

const NAV_ITEMS = [
  { href: "/dashboard",             label: "Dashboard",  icon: "⊞" },
  { href: "/dashboard/properties",  label: "Portfólio",  icon: "🏢" },
  { href: "/dashboard/tax",         label: "IR",         icon: "📊" },
  { href: "/dashboard/profile",     label: "Perfil",     icon: "⚙️" },
];

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Hoje";
  if (diffDays === 1) return "Ontem";
  if (diffDays < 7) return `${diffDays} dias atrás`;
  return new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "short" }).format(date);
}

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mounted, setMounted]         = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [panelOpen, setPanelOpen]     = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [dismissed, setDismissed]     = useState<Set<string>>(new Set());
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    // Sidebar — localStorage (persiste entre sessões)
    const savedSidebar = localStorage.getItem("sidebar-open");
    setSidebarOpen(savedSidebar === null ? true : savedSidebar === "true");

    // Painel — sessionStorage (retorna a cada login)
    const savedPanel = sessionStorage.getItem("notif-panel-open");
    setPanelOpen(savedPanel === null ? true : savedPanel === "true");

    // Notificações descartadas — sessionStorage (retorna a cada login)
    const savedDismissed = sessionStorage.getItem("notif-dismissed");
    if (savedDismissed) {
      try { setDismissed(new Set(JSON.parse(savedDismissed))); } catch {}
    }

    setMounted(true);

    const supabase = createClient();
    supabase
      .from("notifications")
      .select("id, title, body, type, created_at, contact_label, contact_url")
      .eq("active", true)
      .order("created_at", { ascending: false })
      .limit(30)
      .then(({ data }) => {
        setNotifications(data ?? []);
        setLoading(false);
      });
  }, []);

  function toggleSidebar() {
    const next = !sidebarOpen;
    setSidebarOpen(next);
    localStorage.setItem("sidebar-open", String(next));
  }

  function togglePanel(open: boolean) {
    setPanelOpen(open);
    sessionStorage.setItem("notif-panel-open", String(open));
  }

  function dismissNotification(id: string) {
    const next = new Set(dismissed);
    next.add(id);
    setDismissed(next);
    sessionStorage.setItem("notif-dismissed", JSON.stringify([...next]));
  }

  if (!mounted) return <>{children}</>;

  const sidebarWidth = sidebarOpen ? SIDEBAR_EXPANDED : SIDEBAR_COLLAPSED;
  const visibleNotifs = notifications.filter(n => !dismissed.has(n.id));

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#F2F2F0" }}>

      {/* ── SIDEBAR ──────────────────────────────────────── */}
      <aside
        style={{
          width: sidebarWidth,
          minWidth: sidebarWidth,
          backgroundColor: "#1F2937",
          display: "flex",
          flexDirection: "column",
          transition: "width 0.25s ease, min-width 0.25s ease",
          position: "fixed",
          top: 0,
          left: 0,
          height: "100vh",
          zIndex: 50,
          overflow: "hidden",
        }}
      >
        {/* Logo + botão colapsar */}
        <div
          style={{
            padding: sidebarOpen ? "20px 12px 16px 20px" : "20px 0 16px",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: sidebarOpen ? "space-between" : "center",
            whiteSpace: "nowrap",
            overflow: "hidden",
          }}
        >
          {sidebarOpen && (
            <Link href="/dashboard" style={{ textDecoration: "none" }}>
              <span style={{ fontFamily: "var(--font-display, serif)", fontSize: 22, fontStyle: "italic", fontWeight: 700, color: "#fff", letterSpacing: "-0.5px" }}>
                My<span style={{ color: "#6BA68A" }}>Asset</span>
              </span>
            </Link>
          )}
          <button
            onClick={toggleSidebar}
            title={sidebarOpen ? "Recolher menu" : "Expandir menu"}
            style={{
              background: "rgba(255,255,255,0.08)",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              color: "#9CA3AF",
              fontSize: 18,
              fontWeight: 700,
              width: 32,
              height: 32,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              transition: "background 0.15s, color 0.15s",
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255,255,255,0.15)";
              (e.currentTarget as HTMLElement).style.color = "#fff";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255,255,255,0.08)";
              (e.currentTarget as HTMLElement).style.color = "#9CA3AF";
            }}
          >
            {sidebarOpen ? "‹" : "›"}
          </button>
        </div>

        {/* Nav items */}
        <nav style={{ flex: 1, padding: "16px 0", overflowY: "auto" }}>
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                title={!sidebarOpen ? item.label : undefined}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: sidebarOpen ? "10px 20px" : "10px 0",
                  justifyContent: sidebarOpen ? "flex-start" : "center",
                  backgroundColor: isActive ? "rgba(109,166,138,0.15)" : "transparent",
                  borderLeft: isActive ? "3px solid #6BA68A" : "3px solid transparent",
                  textDecoration: "none",
                  transition: "background 0.15s",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                }}
                onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255,255,255,0.05)"; }}
                onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"; }}
              >
                <span style={{ fontSize: 18, flexShrink: 0, width: 24, textAlign: "center" }}>{item.icon}</span>
                {sidebarOpen && (
                  <span style={{ fontSize: 14, fontWeight: isActive ? 700 : 500, color: isActive ? "#fff" : "#9CA3AF", letterSpacing: "0.01em" }}>
                    {item.label}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Painel de informativos — toggle */}
        <div style={{ padding: sidebarOpen ? "0 12px 8px" : "0 0 8px", borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 12 }}>
          <button
            onClick={() => togglePanel(!panelOpen)}
            title={panelOpen ? "Fechar informativos" : "Abrir informativos"}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              width: "100%",
              padding: sidebarOpen ? "8px 8px" : "8px 0",
              justifyContent: sidebarOpen ? "flex-start" : "center",
              background: panelOpen ? "rgba(109,166,138,0.15)" : "transparent",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              transition: "background 0.15s",
              whiteSpace: "nowrap",
              overflow: "hidden",
            }}
          >
            <span style={{ fontSize: 18, flexShrink: 0, width: 24, textAlign: "center" }}>🔔</span>
            {sidebarOpen && (
              <>
                <span style={{ fontSize: 14, fontWeight: 500, color: panelOpen ? "#fff" : "#9CA3AF", flex: 1, textAlign: "left" }}>
                  Informativos
                </span>
                {visibleNotifs.length > 0 && (
                  <span style={{
                    fontSize: 10, fontWeight: 700, backgroundColor: "#D97706",
                    color: "#fff", borderRadius: 999, padding: "1px 6px", flexShrink: 0,
                  }}>
                    {visibleNotifs.length}
                  </span>
                )}
              </>
            )}
          </button>
        </div>

        {/* Sair */}
        <div style={{ padding: sidebarOpen ? "0 12px 12px" : "0 0 12px" }}>
          <form action="/dashboard/logout" method="post">
            <button
              type="submit"
              title={!sidebarOpen ? "Sair" : undefined}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                width: "100%",
                padding: sidebarOpen ? "8px 8px" : "8px 0",
                justifyContent: sidebarOpen ? "flex-start" : "center",
                background: "transparent",
                border: "none",
                borderRadius: 6,
                cursor: "pointer",
                whiteSpace: "nowrap",
                overflow: "hidden",
              }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255,255,255,0.05)"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"}
            >
              <span style={{ fontSize: 18, flexShrink: 0, width: 24, textAlign: "center" }}>🚪</span>
              {sidebarOpen && <span style={{ fontSize: 14, fontWeight: 500, color: "#9CA3AF" }}>Sair</span>}
            </button>
          </form>
        </div>


      </aside>

      {/* ── CONTEÚDO PRINCIPAL ───────────────────────────── */}
      <div
        style={{
          marginLeft: sidebarWidth,
          marginRight: panelOpen ? PANEL_WIDTH : 0,
          flex: 1,
          transition: "margin 0.25s ease",
          minWidth: 0,
        }}
      >
        {children}
      </div>

      {/* ── PAINEL DE INFORMATIVOS ───────────────────────── */}
      <aside
        style={{
          width: PANEL_WIDTH,
          minWidth: PANEL_WIDTH,
          position: "fixed",
          top: 0,
          right: 0,
          height: "100vh",
          backgroundColor: "#fff",
          borderLeft: "1px solid #E5E7EB",
          display: "flex",
          flexDirection: "column",
          transform: panelOpen ? "translateX(0)" : `translateX(${PANEL_WIDTH}px)`,
          transition: "transform 0.3s ease",
          zIndex: 40,
          boxShadow: panelOpen ? "-4px 0 16px rgba(0,0,0,0.06)" : "none",
        }}
      >
        {/* Header do painel */}
        <div style={{
          padding: "20px 16px 14px",
          borderBottom: "1px solid #F3F4F6",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
        }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#9CA3AF", marginBottom: 2 }}>
              A5 Asset
            </p>
            <p style={{ fontSize: 14, fontWeight: 700, color: "#1A1A1A" }}>Informativos</p>
          </div>
          <button
            onClick={() => togglePanel(false)}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", fontSize: 20, lineHeight: 1, padding: "4px 6px", borderRadius: 4 }}
            title="Fechar painel"
          >
            ×
          </button>
        </div>

        {/* Lista de notificações */}
        <div style={{ flex: 1, overflowY: "auto", padding: "12px", display: "flex", flexDirection: "column", gap: 10 }}>
          {loading ? (
            <p style={{ fontSize: 13, color: "#9CA3AF", textAlign: "center", marginTop: 32 }}>Carregando...</p>
          ) : visibleNotifs.length === 0 ? (
            <div style={{ textAlign: "center", marginTop: 40 }}>
              <p style={{ fontSize: 32, marginBottom: 12 }}>📭</p>
              <p style={{ fontSize: 13, color: "#9CA3AF", lineHeight: 1.6 }}>
                Nenhum informativo no momento.<br />Novidades aparecerão aqui.
              </p>
            </div>
          ) : (
            visibleNotifs.map((n) => {
              const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.news;
              return (
                <div
                  key={n.id}
                  style={{
                    backgroundColor: cfg.bg,
                    borderLeft: `3px solid ${cfg.color}`,
                    borderRadius: "0 6px 6px 0",
                    padding: "10px 12px",
                    position: "relative",
                  }}
                >
                  {/* Botão fechar individual */}
                  <button
                    onClick={() => dismissNotification(n.id)}
                    title="Fechar este informativo"
                    style={{
                      position: "absolute", top: 6, right: 8,
                      background: "none", border: "none", cursor: "pointer",
                      color: "#9CA3AF", fontSize: 16, lineHeight: 1, padding: "2px 4px",
                    }}
                  >
                    ×
                  </button>

                  {/* Tipo + data */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5, paddingRight: 16 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <span style={{ fontSize: 12 }}>{cfg.icon}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: cfg.color }}>
                        {cfg.label}
                      </span>
                    </div>
                    <span style={{ fontSize: 10, color: "#9CA3AF" }}>{formatDate(n.created_at)}</span>
                  </div>

                  {/* Título */}
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#1A1A1A", lineHeight: 1.4, marginBottom: 4 }}>
                    {n.title}
                  </p>

                  {/* Corpo */}
                  <p style={{ fontSize: 12, color: "#6B7280", lineHeight: 1.6, marginBottom: n.contact_label ? 10 : 0 }}>
                    {n.body}
                  </p>

                  {/* CTA WhatsApp */}
                  {n.contact_label && n.contact_url && (
                    <a
                      href={n.contact_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "inline-flex", alignItems: "center", gap: 6,
                        padding: "5px 10px", borderRadius: 5,
                        backgroundColor: cfg.btnBg, color: "#fff",
                        fontSize: 11, fontWeight: 700, textDecoration: "none",
                        textTransform: "uppercase", letterSpacing: "0.06em",
                      }}
                    >
                      <svg width="12" height="12" viewBox="0 0 32 32" fill="white">
                        <path d="M16 2C8.268 2 2 8.268 2 16c0 2.478.675 4.796 1.851 6.782L2 30l7.438-1.82A13.93 13.93 0 0016 30c7.732 0 14-6.268 14-14S23.732 2 16 2zm6.29 19.927c-.344-.172-2.035-1.003-2.35-1.118-.316-.115-.546-.172-.776.172-.23.344-.888 1.118-1.088 1.348-.2.23-.4.258-.744.086-.344-.172-1.454-.535-2.768-1.703-1.023-.912-1.714-2.037-1.914-2.381-.2-.344-.022-.53.15-.701.155-.154.344-.4.516-.601.172-.2.23-.344.344-.573.115-.23.057-.43-.028-.601-.086-.172-.776-1.872-1.062-2.564-.28-.672-.565-.58-.776-.59l-.66-.012c-.23 0-.601.086-.916.43-.315.344-1.204 1.175-1.204 2.866 0 1.69 1.233 3.324 1.405 3.553.172.23 2.428 3.71 5.882 5.203.822.355 1.464.567 1.965.726.826.262 1.578.225 2.173.137.663-.098 2.035-.832 2.322-1.635.287-.803.287-1.49.2-1.635-.086-.144-.315-.23-.659-.4z"/>
                      </svg>
                      {n.contact_label}
                    </a>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer do painel — WhatsApp suporte */}
        <div style={{ padding: "12px 16px", borderTop: "1px solid #F3F4F6", flexShrink: 0 }}>
          <a
            href={`https://wa.me/${WA_PHONE}?text=${WA_MESSAGE}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "10px 14px", borderRadius: 8,
              backgroundColor: "#F0FDF4", border: "1px solid #BBF7D0",
              textDecoration: "none",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 32 32" fill="#16A34A">
              <path d="M16 2C8.268 2 2 8.268 2 16c0 2.478.675 4.796 1.851 6.782L2 30l7.438-1.82A13.93 13.93 0 0016 30c7.732 0 14-6.268 14-14S23.732 2 16 2zm6.29 19.927c-.344-.172-2.035-1.003-2.35-1.118-.316-.115-.546-.172-.776.172-.23.344-.888 1.118-1.088 1.348-.2.23-.4.258-.744.086-.344-.172-1.454-.535-2.768-1.703-1.023-.912-1.714-2.037-1.914-2.381-.2-.344-.022-.53.15-.701.155-.154.344-.4.516-.601.172-.2.23-.344.344-.573.115-.23.057-.43-.028-.601-.086-.172-.776-1.872-1.062-2.564-.28-.672-.565-.58-.776-.59l-.66-.012c-.23 0-.601.086-.916.43-.315.344-1.204 1.175-1.204 2.866 0 1.69 1.233 3.324 1.405 3.553.172.23 2.428 3.71 5.882 5.203.822.355 1.464.567 1.965.726.826.262 1.578.225 2.173.137.663-.098 2.035-.832 2.322-1.635.287-.803.287-1.49.2-1.635-.086-.144-.315-.23-.659-.4z"/>
            </svg>
            <div>
              <p style={{ fontSize: 12, fontWeight: 700, color: "#16A34A", lineHeight: 1 }}>Suporte A5</p>
              <p style={{ fontSize: 11, color: "#6B7280", lineHeight: 1.4, marginTop: 2 }}>Fale com a equipe</p>
            </div>
          </a>
        </div>
      </aside>

      {/* Botão reabrir painel quando fechado */}
      {!panelOpen && (
        <button
          onClick={() => togglePanel(true)}
          title="Abrir informativos"
          style={{
            position: "fixed",
            right: 0,
            top: "50%",
            transform: "translateY(-50%)",
            backgroundColor: "#1F2937",
            color: "#fff",
            border: "none",
            borderRadius: "6px 0 0 6px",
            padding: "12px 8px",
            cursor: "pointer",
            zIndex: 41,
            writingMode: "vertical-rl",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          {visibleNotifs.length > 0 ? `${visibleNotifs.length} informativos` : "Informativos"}
        </button>
      )}

      {/* WhatsApp flutuante (quando painel fechado) */}
      {!panelOpen && (
        <a
          href={`https://wa.me/${WA_PHONE}?text=${WA_MESSAGE}`}
          target="_blank"
          rel="noopener noreferrer"
          title="Suporte A5"
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            width: 52,
            height: 52,
            borderRadius: "50%",
            backgroundColor: "#25D366",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 16px rgba(37,211,102,0.4)",
            zIndex: 50,
            textDecoration: "none",
          }}
        >
          <svg width="26" height="26" viewBox="0 0 32 32" fill="white">
            <path d="M16 2C8.268 2 2 8.268 2 16c0 2.478.675 4.796 1.851 6.782L2 30l7.438-1.82A13.93 13.93 0 0016 30c7.732 0 14-6.268 14-14S23.732 2 16 2zm6.29 19.927c-.344-.172-2.035-1.003-2.35-1.118-.316-.115-.546-.172-.776.172-.23.344-.888 1.118-1.088 1.348-.2.23-.4.258-.744.086-.344-.172-1.454-.535-2.768-1.703-1.023-.912-1.714-2.037-1.914-2.381-.2-.344-.022-.53.15-.701.155-.154.344-.4.516-.601.172-.2.23-.344.344-.573.115-.23.057-.43-.028-.601-.086-.172-.776-1.872-1.062-2.564-.28-.672-.565-.58-.776-.59l-.66-.012c-.23 0-.601.086-.916.43-.315.344-1.204 1.175-1.204 2.866 0 1.69 1.233 3.324 1.405 3.553.172.23 2.428 3.71 5.882 5.203.822.355 1.464.567 1.965.726.826.262 1.578.225 2.173.137.663-.098 2.035-.832 2.322-1.635.287-.803.287-1.49.2-1.635-.086-.144-.315-.23-.659-.4z"/>
          </svg>
        </a>
      )}

    </div>
  );
}
