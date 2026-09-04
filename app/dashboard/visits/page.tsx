import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import BrandMark from "../_components/BrandMark";
import { markVisitDone, cancelVisit } from "../visitActions";

type VisitRow = {
  id: string;
  property_id: string;
  lead_id: string | null;
  visitor_name: string;
  visitor_phone: string | null;
  scheduled_at: string;
  notes: string | null;
  status: "scheduled" | "done" | "canceled";
  properties: { name: string } | null;
};

const STATUS_LABEL: Record<string, string> = { scheduled: "Agendada", done: "Realizada", canceled: "Cancelada" };
const STATUS_COLOR: Record<string, string> = { scheduled: "#D9A05B", done: "#5FBF8A", canceled: "#E0686C" };

const FILTERS: { key: string; label: string }[] = [
  { key: "scheduled", label: "Agendadas" },
  { key: "done", label: "Realizadas" },
  { key: "canceled", label: "Canceladas" },
  { key: "all", label: "Todas" },
];

// A visita é gravada como o corretor digitou (horário local); formatamos em
// UTC pra ecoar exatamente o que foi digitado, sem deslocar fuso.
function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "short", day: "2-digit", month: "2-digit",
    hour: "2-digit", minute: "2-digit", timeZone: "UTC",
  }).format(new Date(iso));
}

export default async function VisitsPage({
  searchParams,
}: {
  searchParams: { filtro?: string };
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("user_profiles").select("agency_name").eq("id", user.id).single();

  const { data: visits, error } = await supabase
    .from("property_visits")
    .select("id, property_id, lead_id, visitor_name, visitor_phone, scheduled_at, notes, status, properties(name)")
    .eq("user_id", user.id)
    .order("scheduled_at", { ascending: false });
  if (error) redirect("/error?message=" + encodeURIComponent(error.message));

  const allVisits = (visits ?? []) as unknown as VisitRow[];

  const activeFilter = FILTERS.find((f) => f.key === searchParams.filtro) ?? FILTERS[0];
  const filtered = activeFilter.key === "all"
    ? allVisits
    : allVisits.filter((v) => v.status === activeFilter.key);
  const sorted = activeFilter.key === "scheduled"
    ? [...filtered].sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at))
    : filtered;

  const counts = {
    scheduled: allVisits.filter((v) => v.status === "scheduled").length,
    done: allVisits.filter((v) => v.status === "done").length,
    canceled: allVisits.filter((v) => v.status === "canceled").length,
  };

  return (
    <main className="min-h-screen bg-surface">
      <header className="bg-header text-ink ">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <BrandMark agencyName={profile?.agency_name} />
          <Link href="/dashboard" className="text-xs text-gray-400 hover:text-white transition-colors uppercase tracking-wider">
            ← Dashboard
          </Link>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <p className="section-title">Visitas</p>
            <p className="text-sm text-ink-2">
              {counts.scheduled} {counts.scheduled === 1 ? "agendada" : "agendadas"} · {counts.done} {counts.done === 1 ? "realizada" : "realizadas"}
            </p>
          </div>
          <Link
            href="/dashboard/visits/new"
            className="self-start px-6 py-3 bg-forest text-white font-bold tracking-wider uppercase text-sm hover:bg-forest-light transition-colors rounded"
          >
            + Agendar visita
          </Link>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {FILTERS.map((f) => (
            <Link
              key={f.key}
              href={f.key === "scheduled" ? "/dashboard/visits" : `/dashboard/visits?filtro=${f.key}`}
              className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider border transition-colors ${
                activeFilter.key === f.key
                  ? "bg-forest text-white border-forest"
                  : "bg-card text-ink-2 border-border hover:border-forest hover:text-forest"
              }`}
            >
              {f.label}
            </Link>
          ))}
        </div>

        {sorted.length === 0 ? (
          <div className="card text-center py-16">
            <p className="text-4xl mb-4">🗓️</p>
            <p className="text-xs font-bold uppercase tracking-widest text-ink-3 mb-3">Nenhuma visita</p>
            <p className="text-base font-semibold text-ink mb-2">
              {activeFilter.key === "scheduled" ? "Nenhuma visita agendada" : `Nenhuma visita em "${activeFilter.label}"`}
            </p>
            <Link
              href="/dashboard/visits/new"
              className="inline-block mt-3 px-6 py-3 bg-forest text-white font-bold tracking-wider uppercase text-sm hover:bg-forest-light transition-colors rounded"
            >
              Agendar visita
            </Link>
          </div>
        ) : (
          <div className="card divide-y divide-border p-0 overflow-hidden">
            {sorted.map((v) => {
              const waLink = v.visitor_phone
                ? `https://wa.me/55${v.visitor_phone.replace(/\D/g, "")}?text=${encodeURIComponent(
                    `Olá ${v.visitor_name.split(" ")[0]}! Confirmando nossa visita ao imóvel ${v.properties?.name ?? ""}. 😊`
                  )}`
                : null;
              return (
                <div key={v.id} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-6 py-5">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border"
                        style={{ color: STATUS_COLOR[v.status], borderColor: STATUS_COLOR[v.status] + "4D" }}
                      >
                        {STATUS_LABEL[v.status]}
                      </span>
                      <span className="text-xs text-ink-3">{formatDateTime(v.scheduled_at)}</span>
                    </div>
                    <p className="text-sm text-ink">
                      <strong>{v.properties?.name ?? "Imóvel"}</strong>
                      {" · "}
                      {v.lead_id ? (
                        <Link href={`/dashboard/contacts/${v.lead_id}`} className="text-forest hover:text-forest-light transition-colors">
                          {v.visitor_name}
                        </Link>
                      ) : (
                        v.visitor_name
                      )}
                      {v.visitor_phone && <span className="text-ink-3"> · {v.visitor_phone}</span>}
                    </p>
                    {v.notes && <p className="text-xs text-ink-3 mt-1 truncate">{v.notes}</p>}
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
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
                    {v.status === "scheduled" && (
                      <>
                        <form action={markVisitDone}>
                          <input type="hidden" name="visit_id" value={v.id} />
                          <button type="submit" className="px-4 py-2 bg-forest text-white text-xs font-bold uppercase tracking-wider rounded hover:bg-forest-light transition-colors">
                            ✓ Realizada
                          </button>
                        </form>
                        <form action={cancelVisit}>
                          <input type="hidden" name="visit_id" value={v.id} />
                          <button type="submit" className="text-xs text-ink-3 hover:text-negative transition-colors uppercase tracking-wider">
                            Cancelar
                          </button>
                        </form>
                      </>
                    )}
                    <Link
                      href={`/dashboard/properties/${v.property_id}`}
                      className="text-xs text-ink-2 hover:text-forest transition-colors uppercase tracking-wider"
                    >
                      Ver imóvel →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
