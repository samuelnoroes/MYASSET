"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type Alert = {
  id: string; // propertyId + tipo para chave única
  propertyId: string;
  propertyName: string;
  type: "warning" | "danger" | "installment" | "balloon";
  message: string;
  detail: string;
  amount: string | number;
  actionType: "markPaid" | "register"; // Quitado ou Registrar aporte
};

type Props = {
  alerts: Alert[];
  onMarkPaid: (formData: FormData) => Promise<void>;
};

const SESSION_KEY = "alerts-dismissed";

export default function AlertsPanel({ alerts, onMarkPaid }: Props) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(SESSION_KEY);
      if (saved) setDismissed(new Set(JSON.parse(saved)));
    } catch {}
    setMounted(true);
  }, []);

  function dismiss(id: string) {
    const next = new Set(dismissed);
    next.add(id);
    setDismissed(next);
    try { sessionStorage.setItem(SESSION_KEY, JSON.stringify([...next])); } catch {}
  }

  function dismissAll() {
    const next = new Set(alerts.map(a => a.id));
    setDismissed(next);
    try { sessionStorage.setItem(SESSION_KEY, JSON.stringify([...next])); } catch {}
  }

  if (!mounted) return null;

  const visible = alerts.filter(a => !dismissed.has(a.id));
  if (visible.length === 0) return null;

  const colorMap = {
    danger:      { border: "border-red-400/30",    bg: "bg-red-500/10",    text: "text-red-300",    icon: "🔴" },
    warning:     { border: "border-amber-400/30",  bg: "bg-amber-500/10",  text: "text-amber-300",  icon: "🟡" },
    installment: { border: "border-amber-400/30",  bg: "bg-amber-500/10",  text: "text-amber-300",  icon: "🟡" },
    balloon:     { border: "border-blue-400/30",   bg: "bg-blue-500/10",   text: "text-blue-300",   icon: "🏗️" },
  };

  return (
    <div className="space-y-2">
      {/* Header com "dispensar todos" */}
      {visible.length > 1 && (
        <div className="flex items-center justify-between px-1">
          <p className="text-xs font-bold uppercase tracking-wider text-ink-3">
            {visible.length} {visible.length === 1 ? "alerta" : "alertas"}
          </p>
          <button
            onClick={dismissAll}
            className="text-xs text-ink-3 hover:text-negative transition-colors uppercase tracking-wider"
          >
            Dispensar todos ×
          </button>
        </div>
      )}

      {/* Alertas individuais */}
      {visible.map((alert) => {
        const c = colorMap[alert.type];
        return (
          <div
            key={alert.id}
            className={`flex items-center justify-between px-5 py-4 rounded-card border ${c.border} ${c.bg}`}
          >
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <span className="text-lg select-none shrink-0">{c.icon}</span>
              <div className="min-w-0">
                <p className={`text-xs font-bold uppercase tracking-wider ${c.text}`}>
                  {alert.message}
                </p>
                <p className="text-sm text-ink mt-0.5 truncate">
                  <strong>{alert.propertyName}</strong> · {alert.detail}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0 ml-4">
              {/* Ação principal */}
              {alert.actionType === "markPaid" ? (
                <form action={onMarkPaid}>
                  <input type="hidden" name="property_id" value={alert.propertyId} />
                  <input type="hidden" name="amount" value={alert.amount} />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-forest text-white text-xs font-bold uppercase tracking-wider rounded hover:bg-forest-light transition-colors"
                  >
                    Quitado ✓
                  </button>
                </form>
              ) : (
                <Link
                  href={`/dashboard/properties/${alert.propertyId}/transactions/new?type=expense`}
                  className="px-4 py-2 text-white text-xs font-bold uppercase tracking-wider rounded transition-colors"
                  style={{ backgroundColor: alert.type === "danger" ? "#E0686C" : alert.type === "balloon" ? "#3B82F6" : "#C4A96B" }}
                >
                  Registrar
                </Link>
              )}

              {/* Ver imóvel */}
              <Link
                href={`/dashboard/properties/${alert.propertyId}`}
                className="text-xs text-ink-2 hover:text-forest transition-colors uppercase tracking-wider"
              >
                Ver →
              </Link>

              {/* Dispensar individual */}
              <button
                onClick={() => dismiss(alert.id)}
                title="Dispensar este alerta"
                className="text-ink-3 hover:text-negative transition-colors text-lg leading-none ml-1"
              >
                ×
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
