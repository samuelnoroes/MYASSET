import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { deleteProperty } from "./actions";

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  residential: "Residencial",
  commercial: "Comercial",
  land: "Terreno",
  mixed: "Misto",
};

function formatCurrency(value: number | null): string {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export default async function PropertiesPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: properties, error } = await supabase
    .from("properties")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    redirect("/error?message=" + encodeURIComponent(error.message));
  }

  return (
    <main className="min-h-screen bg-cream">
      {/* Header */}
      <header className="border-b border-ink/10">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <Link href="/dashboard" className="font-display text-2xl text-ink">
            My<span className="italic text-forest">Asset</span>
          </Link>
          <Link
            href="/dashboard"
            className="text-xs uppercase tracking-wider text-ink/60 hover:text-forest transition-colors"
          >
            ← Dashboard
          </Link>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
          <div>
            <p className="text-xs tracking-[0.3em] uppercase text-forest/60 mb-3">
              Portfólio
            </p>
            <h1 className="font-display text-4xl text-ink">Seus imóveis</h1>
            <p className="text-sm text-ink/60 mt-2">
              {properties?.length ?? 0}{" "}
              {properties?.length === 1
                ? "imóvel cadastrado"
                : "imóveis cadastrados"}
            </p>
          </div>
          <Link
            href="/dashboard/properties/new"
            className="self-start md:self-end px-6 py-3 bg-forest text-cream font-medium tracking-wider uppercase text-xs hover:bg-ink transition-colors"
          >
            + Novo imóvel
          </Link>
        </div>

        {(!properties || properties.length === 0) && (
          <div className="border border-dashed border-ink/15 p-12 text-center">
            <p className="text-xs tracking-[0.3em] uppercase text-ink/40 mb-3">
              Nenhum imóvel
            </p>
            <p className="font-display text-2xl text-ink/70 mb-3">
              Comece adicionando seu primeiro ativo
            </p>
            <p className="text-sm text-ink/50 max-w-md mx-auto mb-6">
              Cadastre cada imóvel do seu portfólio pra acompanhar yield, ROI e
              fluxo de caixa.
            </p>
            <Link
              href="/dashboard/properties/new"
              className="inline-block px-6 py-3 bg-forest text-cream font-medium tracking-wider uppercase text-xs hover:bg-ink transition-colors"
            >
              Cadastrar imóvel
            </Link>
          </div>
        )}

        {properties && properties.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {properties.map((property) => (
              <div
                key={property.id}
                className="bg-white border border-ink/10 p-6"
              >
                <div className="flex items-start justify-between mb-4 gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] tracking-[0.25em] uppercase text-forest/60 mb-1">
                      {PROPERTY_TYPE_LABELS[property.property_type] ||
                        property.property_type}
                    </p>
                    <h3 className="font-display text-2xl text-ink leading-tight mb-1 truncate">
                      {property.name}
                    </h3>
                    <p className="text-xs text-ink/40 font-mono">
                      @{property.nickname}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <Link
                      href={`/dashboard/properties/${property.id}/edit`}
                      className="text-[10px] uppercase tracking-wider text-ink/40 hover:text-forest transition-colors whitespace-nowrap"
                    >
                      Editar
                    </Link>
                    <form action={deleteProperty}>
                      <input type="hidden" name="id" value={property.id} />
                      <button
                        type="submit"
                        className="text-[10px] uppercase tracking-wider text-ink/30 hover:text-red-700 transition-colors whitespace-nowrap"
                        title="Remover imóvel"
                      >
                        Remover
                      </button>
                    </form>
                  </div>
                </div>

                {(property.city || property.state) && (
                  <p className="text-xs text-ink/50 mb-4">
                    {[property.city, property.state].filter(Boolean).join(" — ")}
                  </p>
                )}

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-ink/10">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-ink/40 mb-1">
                      Valor atual
                    </p>
                    <p className="text-sm text-ink font-medium">
                      {formatCurrency(property.current_value)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-ink/40 mb-1">
                      Aluguel esperado
                    </p>
                    <p className="text-sm text-ink font-medium">
                      {formatCurrency(property.monthly_rent)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
