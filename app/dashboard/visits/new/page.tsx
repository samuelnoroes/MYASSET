import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { createVisit } from "../../visitActions";

export default async function NewVisitPage({
  searchParams,
}: {
  searchParams: { property?: string };
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Sem filtro de user_id: inclui imóveis da imobiliária (RLS controla a visibilidade)
  const { data: properties } = await supabase
    .from("properties")
    .select("id, name, city, listing_status")
    .eq("is_active", true)
    .order("name");

  const props = (properties ?? []).filter(p => p.listing_status !== "closed");
  const preselected = searchParams.property ?? "";

  return (
    <main className="min-h-screen bg-surface">
      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-ink">Agendar visita</h1>
            <p className="text-sm text-ink-2 mt-1">
              Marque a visita de um interessado a um imóvel da sua carteira.
            </p>
          </div>
          <Link href="/dashboard" className="text-xs text-ink-3 hover:text-forest transition-colors uppercase tracking-wider">
            ← Voltar
          </Link>
        </div>

        <div className="card">
          {props.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-ink-2 mb-2">Você ainda não tem imóveis disponíveis na carteira.</p>
              <Link href="/dashboard/properties/new" className="inline-block mt-3 px-6 py-3 bg-forest text-white text-xs font-bold uppercase tracking-wider rounded hover:bg-forest-light transition-colors">
                + Cadastrar imóvel
              </Link>
            </div>
          ) : (
            <form action={createVisit} className="space-y-5">
              <div>
                <label htmlFor="property_id" className="block text-xs font-semibold uppercase tracking-wider text-ink-2 mb-2">
                  Imóvel <span className="text-forest">*</span>
                </label>
                <select
                  id="property_id"
                  name="property_id"
                  required
                  defaultValue={preselected}
                  className="w-full px-4 py-3 bg-surface border border-border rounded focus:border-forest focus:outline-none transition-colors text-ink text-sm"
                >
                  <option value="" disabled>Selecione o imóvel</option>
                  {props.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}{p.city ? ` — ${p.city}` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="visitor_name" className="block text-xs font-semibold uppercase tracking-wider text-ink-2 mb-2">
                  Nome do interessado <span className="text-forest">*</span>
                </label>
                <input
                  id="visitor_name"
                  name="visitor_name"
                  type="text"
                  required
                  placeholder="Quem vai visitar o imóvel"
                  className="w-full px-4 py-3 bg-surface border border-border rounded focus:border-forest focus:outline-none transition-colors text-ink text-sm"
                />
              </div>

              <div>
                <label htmlFor="visitor_phone" className="block text-xs font-semibold uppercase tracking-wider text-ink-2 mb-2">
                  WhatsApp do interessado
                </label>
                <input
                  id="visitor_phone"
                  name="visitor_phone"
                  type="tel"
                  placeholder="(85) 99999-9999"
                  className="w-full px-4 py-3 bg-surface border border-border rounded focus:border-forest focus:outline-none transition-colors text-ink text-sm"
                />
                <p className="text-xs text-ink-3 mt-1">
                  Com o número salvo, você chama o interessado direto do alerta de visita.
                </p>
              </div>

              <div>
                <label htmlFor="scheduled_at" className="block text-xs font-semibold uppercase tracking-wider text-ink-2 mb-2">
                  Data e hora da visita <span className="text-forest">*</span>
                </label>
                <input
                  id="scheduled_at"
                  name="scheduled_at"
                  type="datetime-local"
                  required
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
                  rows={3}
                  placeholder="Ex.: cliente prefere fim de tarde, levar chave com o porteiro…"
                  className="w-full px-4 py-3 bg-surface border border-border rounded focus:border-forest focus:outline-none transition-colors text-ink text-sm resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-forest text-white font-bold tracking-wider uppercase text-sm hover:bg-forest-light transition-colors rounded"
              >
                Agendar visita
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
