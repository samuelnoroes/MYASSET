import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { createDeal } from "../actions";

export default async function NewDealPage({
  searchParams,
}: {
  searchParams: { property?: string };
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Sem filtro de user_id: o corretor pode fechar negócio em imóvel de colega da imobiliária
  const { data: properties } = await supabase
    .from("properties")
    .select("id, name, city, listing_purpose")
    .eq("is_active", true)
    .order("name");
  const props = properties ?? [];

  const preselected = searchParams.property ?? "";
  const today = new Date().toISOString().slice(0, 10);

  return (
    <main className="min-h-screen bg-surface">
      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-ink">Registrar fechamento</h1>
            <p className="text-sm text-ink-2 mt-1">
              Vendeu ou alugou? Registre aqui — vendas contam para a sua meta de VGV.
            </p>
          </div>
          <Link href="/dashboard/goals" className="text-xs text-ink-3 hover:text-forest transition-colors uppercase tracking-wider">
            ← Voltar
          </Link>
        </div>

        <div className="card">
          <form action={createDeal} className="space-y-5">
            <div>
              <label htmlFor="property_id" className="block text-xs font-semibold uppercase tracking-wider text-ink-2 mb-2">
                Imóvel
              </label>
              <select
                id="property_id"
                name="property_id"
                defaultValue={preselected}
                className="w-full px-4 py-3 bg-surface border border-border rounded focus:border-forest focus:outline-none transition-colors text-ink text-sm"
              >
                <option value="">Fora da carteira (avulso)</option>
                {props.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}{p.city ? ` — ${p.city}` : ""}
                  </option>
                ))}
              </select>
              <p className="text-xs text-ink-3 mt-1">
                Fechou um negócio de um imóvel que não está na carteira? Deixe em "avulso" e descreva nas observações.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label htmlFor="deal_type" className="block text-xs font-semibold uppercase tracking-wider text-ink-2 mb-2">
                  Tipo <span className="text-forest">*</span>
                </label>
                <select
                  id="deal_type"
                  name="deal_type"
                  required
                  defaultValue="sale"
                  className="w-full px-4 py-3 bg-surface border border-border rounded focus:border-forest focus:outline-none transition-colors text-ink text-sm"
                >
                  <option value="sale">Venda</option>
                  <option value="rent">Locação</option>
                </select>
              </div>
              <div>
                <label htmlFor="closed_at" className="block text-xs font-semibold uppercase tracking-wider text-ink-2 mb-2">
                  Data do fechamento <span className="text-forest">*</span>
                </label>
                <input
                  id="closed_at"
                  name="closed_at"
                  type="date"
                  required
                  defaultValue={today}
                  className="w-full px-4 py-3 bg-surface border border-border rounded focus:border-forest focus:outline-none transition-colors text-ink text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="deal_value" className="block text-xs font-semibold uppercase tracking-wider text-ink-2 mb-2">
                Valor do negócio <span className="text-forest">*</span>
              </label>
              <input
                id="deal_value"
                name="deal_value"
                type="text"
                inputMode="numeric"
                required
                placeholder="Ex.: 920.000 (venda) ou 5.500 (aluguel mensal)"
                className="w-full px-4 py-3 bg-surface border border-border rounded focus:border-forest focus:outline-none transition-colors text-ink text-sm"
              />
            </div>

            <div>
              <label htmlFor="notes" className="block text-xs font-semibold uppercase tracking-wider text-ink-2 mb-2">
                Observações
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={2}
                placeholder="Ex.: apartamento 3 quartos na Aldeota, comprador indicado pelo João…"
                className="w-full px-4 py-3 bg-surface border border-border rounded focus:border-forest focus:outline-none transition-colors text-ink text-sm resize-none"
              />
            </div>

            <label className="flex items-start gap-3 cursor-pointer border border-border rounded p-4 bg-surface">
              <input
                type="checkbox"
                name="mark_closed"
                defaultChecked
                className="mt-0.5 h-4 w-4 accent-forest flex-shrink-0"
              />
              <span className="text-xs text-ink-2 leading-relaxed">
                Marcar o imóvel como <strong>Fechado</strong> na carteira (só vale quando um imóvel da carteira for selecionado).
              </span>
            </label>

            <button
              type="submit"
              className="w-full py-3 bg-forest text-white font-bold tracking-wider uppercase text-sm hover:bg-forest-light transition-colors rounded"
            >
              Registrar fechamento
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
