import Link from "next/link";
import { createClient } from "@/utils/supabase/server";

const STAGE_LABEL: Record<string, string> = {
  novo: "Novo", contato: "Em contato", visita: "Visita", proposta: "Proposta", fechado: "Fechado", perdido: "Perdido",
};

function formatCurrency(value: number | null): string {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(value);
}

export default async function MatchedContacts({ propertyId }: { propertyId: string }) {
  const supabase = createClient();
  const { data: matches, error } = await supabase.rpc("match_leads_for_listing", { p_property: propertyId });

  if (error) {
    return <p className="text-sm text-negative">Não deu pra buscar contatos: {error.message}</p>;
  }

  const rows = (matches ?? []) as { lead_id: string; score: number; reasons: string[] }[];
  if (rows.length === 0) {
    return <p className="text-sm text-ink-2">Nenhum contato seu bate com esse imóvel ainda.</p>;
  }

  const ids = rows.map((r) => r.lead_id);
  const { data: leads } = await supabase
    .from("leads")
    .select("id, name, phone, stage, budget_min, budget_max, city")
    .in("id", ids);
  const byId = new Map((leads ?? []).map((l) => [l.id, l]));

  return (
    <div className="divide-y divide-border">
      {rows.map((m) => {
        const l = byId.get(m.lead_id);
        if (!l) return null;
        return (
          <div key={m.lead_id} className="flex items-center justify-between gap-3 py-3">
            <div className="min-w-0">
              <Link href={`/dashboard/contacts/${m.lead_id}`} className="text-sm font-semibold text-ink hover:text-forest transition-colors">
                {l.name}
              </Link>
              <p className="text-xs text-ink-3">
                {STAGE_LABEL[l.stage] ?? l.stage} · {l.city ?? "—"} ·{" "}
                {l.budget_min || l.budget_max ? `${formatCurrency(l.budget_min)} – ${formatCurrency(l.budget_max)}` : "sem faixa"}
                {l.phone && ` · ${l.phone}`}
              </p>
            </div>
            <span className="shrink-0 text-sm font-bold text-forest">{Math.round(m.score * 100)}%</span>
          </div>
        );
      })}
    </div>
  );
}
