import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { formatCurrency } from "./constants";

const PURPOSE_LABEL: Record<string, string> = { sale: "Venda", rent: "Locação" };

export default async function MatchedProperties({ leadId }: { leadId: string }) {
  const supabase = createClient();
  const { data: matches, error } = await supabase.rpc("match_listings_for_lead", { p_lead: leadId });

  if (error) {
    return <p className="text-sm text-negative">Não deu pra buscar imóveis: {error.message}</p>;
  }

  const rows = (matches ?? []) as { property_id: string; score: number; reasons: string[] }[];
  if (rows.length === 0) {
    return <p className="text-sm text-ink-3">Nenhum imóvel disponível na carteira bate com esse perfil ainda.</p>;
  }

  const ids = rows.map((r) => r.property_id);
  const { data: props } = await supabase
    .from("properties")
    .select("id, name, city, neighborhood, listing_purpose, current_value, monthly_rent, acquisition_value, bedrooms, area_m2")
    .in("id", ids);
  const byId = new Map((props ?? []).map((p) => [p.id, p]));

  return (
    <div className="divide-y divide-border">
      {rows.map((m) => {
        const p = byId.get(m.property_id);
        if (!p) return null;
        const price = p.listing_purpose === "rent" ? p.monthly_rent : p.current_value ?? p.acquisition_value;
        return (
          <div key={m.property_id} className="flex items-center justify-between gap-3 py-3">
            <div className="min-w-0">
              <Link href={`/dashboard/properties/${m.property_id}`} className="text-sm font-semibold text-ink hover:text-forest transition-colors">
                {p.name}
              </Link>
              <p className="text-xs text-ink-3">
                {PURPOSE_LABEL[p.listing_purpose ?? ""] ?? "—"} · {p.neighborhood ?? p.city ?? "—"} · {formatCurrency(price)}
                {p.bedrooms != null && ` · ${p.bedrooms}q`}
                {p.area_m2 != null && ` · ${p.area_m2}m²`}
              </p>
              {m.reasons.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-1">
                  {m.reasons.map((r) => (
                    <span key={r} className="text-[10px] font-bold uppercase tracking-wider text-forest bg-forest/10 px-2 py-0.5 rounded-full">
                      {r}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <span className="shrink-0 text-sm font-bold text-forest">{Math.round(m.score * 100)}%</span>
          </div>
        );
      })}
    </div>
  );
}
