import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { deleteProperty } from "./actions";

const MODALITY_LABELS: Record<string, string> = {
  annual_lease: "Locação anual",
  short_stay: "Temporada",
  under_construction: "Na planta",
};

const MODALITY_COLORS: Record<string, string> = {
  annual_lease: "#2D4A3E",
  short_stay: "#3B82F6",
  under_construction: "#F59E0B",
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

  if (!user) redirect("/login");

  const { data: properties, error } = await supabase
    .from("properties")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) redirect("/error?message=" + encodeURIComponent(error.message));

  return (
    <main className="min-h-screen bg-surface">
      {/* Header */}
      <header className="bg-header text-white shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="font-display text-xl italic">
            My<span style={{ color: "#6BA68A" }}>Asset</span>
          </Link>
          <Link
            href="/dashboard"
            className="text-xs text-gray-400 hover:text-white transition-colors uppercase tracking-wider"
          >
            ← Dashboard
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Título + botão */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <p className="section-title">Portfólio</p>
            <p className="text-sm text-ink-2">
              {properties?.length ?? 0}{" "}
              {properties?.length === 1 ? "imóvel cadastrado" : "imóveis cadastrados"}
            </p>
          </div>
          <Link
            href="/dashboard/properties/new"
            className="self-start px-6 py-3 bg-forest text-white font-bold tracking-wider uppercase text-sm hover:bg-forest-light transition-colors rounded"
          >
            + Novo imóvel
          </Link>
        </div>

        {(!properties || properties.length === 0) && (
          <div className="card text-center py-16">
            <p className="text-4xl mb-4">🏠</p>
            <p className="text-xs font-bold uppercase tracking-widest text-ink-3 mb-3">
              Nenhum imóvel
            </p>
            <p className="text-base font-semibold text-ink mb-2">
              Comece adicionando seu primeiro ativo
            </p>
            <p className="text-sm text-ink-2 max-w-md mx-auto mb-6">
              Cadastre imóveis de locação anual, temporada ou na planta.
            </p>
            <Link
              href="/dashboard/properties/new"
              className="inline-block px-6 py-3 bg-forest text-white font-bold tracking-wider uppercase text-sm hover:bg-forest-light transition-colors rounded"
            >
              Cadastrar imóvel
            </Link>
          </div>
        )}

        {properties && properties.length > 0 && (
          <div className="card divide-y divide-border p-0 overflow-hidden">
            {properties.map((property) => {
              const modality = property.modality || "annual_lease";
              const isPlanta = modality === "under_construction";
              const color = MODALITY_COLORS[modality] || "#2D4A3E";

              // Gauge
              let gaugeValue = 0;
              let gaugeLabel = "";
              if (isPlanta && property.total_investment && property.acquisition_value) {
                gaugeValue = Math.min((property.acquisition_value / property.total_investment) * 100, 100);
                gaugeLabel = `${Math.round(gaugeValue)}%`;
              } else if (property.current_value && property.monthly_rent) {
                const y = (Number(property.monthly_rent) / Number(property.current_value)) * 12 * 100;
                gaugeValue = Math.min(y * 5, 100);
                gaugeLabel = `${y.toFixed(1)}%`;
              }

              const radius = 18;
              const circumference = 2 * Math.PI * radius;
              const strokeDashoffset = circumference - (gaugeValue / 100) * circumference;

              return (
                <div key={property.id} className="flex items-center gap-5 px-6 py-5 hover:bg-surface transition-colors">
                  {/* Gauge */}
                  <div className="shrink-0 relative" style={{ width: 48, height: 48 }}>
                    <svg width="48" height="48" viewBox="0 0 48 48">
                      <circle cx="24" cy="24" r={radius} fill="none" stroke="#E5E7EB" strokeWidth="4" />
                      {gaugeValue > 0 && (
                        <circle
                          cx="24" cy="24" r={radius}
                          fill="none"
                          stroke={color}
                          strokeWidth="4"
                          strokeDasharray={circumference}
                          strokeDashoffset={strokeDashoffset}
                          strokeLinecap="round"
                          transform="rotate(-90 24 24)"
                        />
                      )}
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span style={{ fontSize: 8, fontWeight: 700, color, lineHeight: 1 }}>
                        {gaugeLabel || "—"}
                      </span>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color }}>
                        {MODALITY_LABELS[modality]}
                      </span>
                    </div>
                    <Link
                      href={`/dashboard/properties/${property.id}`}
                      className="text-base font-semibold text-ink hover:text-forest transition-colors truncate block"
                    >
                      {property.name}
                    </Link>
                    {(property.city || property.state) && (
                      <p className="text-sm text-ink-3">
                        {[property.city, property.state].filter(Boolean).join(" · ")}
                      </p>
                    )}
                  </div>

                  {/* Valores */}
                  <div className="hidden md:block text-right shrink-0">
                    <p className="text-xs text-ink-3 uppercase tracking-wider">
                      {isPlanta ? "Já pago" : "Valor atual"}
                    </p>
                    <p className="text-base font-bold text-ink">
                      {formatCurrency(isPlanta ? property.acquisition_value : property.current_value)}
                    </p>
                  </div>

                  <div className="hidden lg:block text-right shrink-0 ml-6 w-32">
                    <p className="text-xs text-ink-3 uppercase tracking-wider">
                      {isPlanta ? "VGV" : "Aluguel"}
                    </p>
                    <p className="text-base font-bold text-positive">
                      {formatCurrency(isPlanta ? property.total_investment : property.monthly_rent)}
                    </p>
                  </div>

                  {/* Ações */}
                  <div className="flex items-center gap-3 shrink-0 ml-2">
                    <Link
                      href={`/dashboard/properties/${property.id}/edit`}
                      className="text-xs text-ink-3 hover:text-forest transition-colors uppercase tracking-wider"
                    >
                      Editar
                    </Link>
                    <form action={deleteProperty}>
                      <input type="hidden" name="id" value={property.id} />
                      <button
                        type="submit"
                        className="text-xs text-ink-3 hover:text-negative transition-colors uppercase tracking-wider"
                      >
                        Remover
                      </button>
                    </form>
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
