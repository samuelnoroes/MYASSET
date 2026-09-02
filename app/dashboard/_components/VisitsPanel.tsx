"use client";

import Link from "next/link";

export type VisitAlert = {
  id: string;
  propertyId: string;
  propertyName: string;
  visitorName: string;
  visitorPhone: string | null;
  dateLabel: string;   // ex.: "Hoje · 14:30" / "Amanhã · 10:00"
  isToday: boolean;
  isPast: boolean;     // visita agendada que já passou e não foi marcada
};

type Props = {
  visits: VisitAlert[];
  onMarkDone: (formData: FormData) => Promise<void>;
  onCancel: (formData: FormData) => Promise<void>;
};

export default function VisitsPanel({ visits, onMarkDone, onCancel }: Props) {
  if (visits.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <p className="text-xs font-bold uppercase tracking-wider text-ink-3">
          {visits.length} {visits.length === 1 ? "visita agendada" : "visitas agendadas"}
        </p>
        <Link
          href="/dashboard/visits/new"
          className="text-xs text-forest font-semibold uppercase tracking-wider hover:text-forest-light transition-colors"
        >
          + Agendar visita
        </Link>
      </div>

      {visits.map((v) => {
        const c = v.isPast
          ? { border: "border-red-400/30", bg: "bg-red-500/10", text: "text-red-300", icon: "🔴", label: "Visita não confirmada" }
          : v.isToday
          ? { border: "border-forest/40", bg: "bg-forest/10", text: "text-forest", icon: "📍", label: "Visita hoje" }
          : { border: "border-amber-400/30", bg: "bg-amber-500/10", text: "text-amber-300", icon: "🗓️", label: "Próxima visita" };

        const waLink = v.visitorPhone
          ? `https://wa.me/55${v.visitorPhone.replace(/\D/g, "")}?text=${encodeURIComponent(
              `Olá ${v.visitorName.split(" ")[0]}! Confirmando nossa visita ao imóvel ${v.propertyName}. 😊`
            )}`
          : null;

        return (
          <div
            key={v.id}
            className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-4 py-3 sm:px-5 sm:py-4 rounded-card border ${c.border} ${c.bg}`}
          >
            <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
              <span className="text-lg select-none shrink-0">{c.icon}</span>
              <div className="min-w-0 flex-1">
                <p className={`text-xs font-bold uppercase tracking-wider ${c.text}`}>
                  {c.label} — {v.dateLabel}
                </p>
                <p className="text-sm text-ink mt-0.5 sm:truncate">
                  <strong>{v.propertyName}</strong> · {v.visitorName}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0 sm:ml-4">
              {waLink && (
                <a
                  href={waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Chamar interessado no WhatsApp"
                  className="px-3 py-2 text-xs font-bold uppercase tracking-wider rounded text-white transition-opacity hover:opacity-85"
                  style={{ backgroundColor: "#25D366" }}
                >
                  WhatsApp
                </a>
              )}

              <form action={onMarkDone}>
                <input type="hidden" name="visit_id" value={v.id} />
                <button
                  type="submit"
                  className="px-4 py-2 bg-forest text-white text-xs font-bold uppercase tracking-wider rounded hover:bg-forest-light transition-colors"
                >
                  ✓ Realizada
                </button>
              </form>

              <form action={onCancel}>
                <input type="hidden" name="visit_id" value={v.id} />
                <button
                  type="submit"
                  title="Cancelar esta visita"
                  className="text-xs text-ink-3 hover:text-negative transition-colors uppercase tracking-wider"
                >
                  Cancelar
                </button>
              </form>

              <Link
                href={`/dashboard/properties/${v.propertyId}`}
                className="text-xs text-ink-2 hover:text-forest transition-colors uppercase tracking-wider"
              >
                Ver →
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}
