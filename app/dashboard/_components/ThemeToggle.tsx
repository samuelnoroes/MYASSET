"use client";

import { useTheme } from "@/app/lib/theme";

export default function ThemeToggle({ sidebarOpen }: { sidebarOpen: boolean }) {
  const [theme, toggle] = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      onClick={toggle}
      title={isDark ? "Mudar para claro" : "Mudar para escuro"}
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
      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "var(--overlay-05)")}
      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "transparent")}
    >
      <span style={{ flexShrink: 0, width: 24, display: "flex", justifyContent: "center", color: "var(--ink-3)" }}>
        {isDark ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="4.5" />
            <path d="M12 2v2.5M12 19.5V22M4.2 4.2l1.8 1.8M18 18l1.8 1.8M2 12h2.5M19.5 12H22M4.2 19.8L6 18M18 6l1.8-1.8" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M20 14.5A8.5 8.5 0 019.5 4a8.5 8.5 0 1010.5 10.5z" />
          </svg>
        )}
      </span>
      {sidebarOpen && (
        <span style={{ fontSize: 14, fontWeight: 500, color: "var(--ink-3)" }}>
          {isDark ? "Modo claro" : "Modo escuro"}
        </span>
      )}
    </button>
  );
}
