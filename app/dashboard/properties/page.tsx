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
  annual_lease: "#C4A96B",
  short_stay: "#3B82F6",
  under_construction: "#D9A05B",
};

function formatCurrency(value: number | null): string {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

type Property = {
  id: string;
  name: string;
  nickname: string;
  modality: string;
  property_type: string;
  city: string | null;
  state: string | null;
  current_value: number | null;
  monthly_rent: number | null;
  acquisition_value: number | null;
  total_investment: number | null;
  parent_property_id: string | null;
  unit_identifier: string | null;
};

function PropertyRow({
  property,
  isChild = false,
}: {
  property: Property;
  isChild?: boolean;
}) {
  const modality = property.modality || "annual_lease";
  const isPlanta = modality === "under_construction";
  const color = MODALITY_COLORS[modality] || "#C4A96B";

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
    <div
      className={`flex items-center gap-5 px-6 py-5 hover:bg-surface transition-colors ${
        isChild ? "pl-14 bg-surface/50 border-l-2 border-border" : ""
      }`}
    >
      {/* Gauge */}
      <div className="shrink-0 relative" style={{ width: 48, height: 48 }}>
        <svg width="48" height="48" viewBox="0 0 48 48">
          <circle cx="24" cy="24" r={radius} fill="none" stroke="#2A2D33" strokeWidth="4" />
          {gaugeValue > 0 && (
            <circle
              cx="24" cy="24" r={radius}
              fill="none" stroke={color} strokeWidth="4"
              strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
              strokeLinecap="round" transform="rotate(-90 24 24)"
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
          {property.unit_identifier && (
            <span className="text-[10px] font-bold uppercase tracking-wider bg-border text-ink-2 px-2 py-0.5 rounded">
              {property.unit_identifier}
            </span>
          )}
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
}

export default async function PropertiesPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: properties, error } = await supabase
    .from("properties")
    .select("id, name, nickname, modality, property_type, city, state, current_value, monthly_rent, acquisition_value, total_investment, parent_property_id, unit_identifier")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) redirect("/error?message=" + encodeURIComponent(error.message));

  const allProps = properties || [];

  // Build grouped structure
  const childrenByParent = new Map<string, Property[]>();
  const parentIds = new Set(allProps.map((p) => p.parent_property_id).filter(Boolean) as string[]);

  allProps.forEach((p) => {
    if (p.parent_property_id) {
      const siblings = childrenByParent.get(p.parent_property_id) || [];
      siblings.push(p as Property);
      childrenByParent.set(p.parent_property_id, siblings);
    }
  });

  // Render order: parents (with children), then standalone
  const parents = allProps.filter((p) => parentIds.has(p.id));
  const standalone = allProps.filter((p) => !p.parent_property_id && !parentIds.has(p.id));
  const orphanChildren = allProps.filter(
    (p) => p.parent_property_id && !allProps.find((pp) => pp.id === p.parent_property_id)
  );

  const orderedGroups: { parent: Property; children: Property[] }[] = parents.map((p) => ({
    parent: p as Property,
    children: childrenByParent.get(p.id) || [],
  }));

  const totalCount = allProps.length;

  return (
    <main className="min-h-screen bg-surface">
      <header className="bg-header text-white ">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="font-display text-xl italic">
            My<span style={{ color: "#C4A96B" }}>Asset</span>
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
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <p className="section-title">Portfólio</p>
            <p className="text-sm text-ink-2">
              {totalCount} {totalCount === 1 ? "imóvel cadastrado" : "imóveis cadastrados"}
            </p>
          </div>
          <Link
            href="/dashboard/properties/new"
            className="self-start px-6 py-3 bg-forest text-white font-bold tracking-wider uppercase text-sm hover:bg-forest-light transition-colors rounded"
          >
            + Novo imóvel
          </Link>
        </div>

        {totalCount === 0 && (
          <div className="card text-center py-16">
            <p className="text-4xl mb-4">🏠</p>
            <p className="text-xs font-bold uppercase tracking-widest text-ink-3 mb-3">Nenhum imóvel</p>
            <p className="text-base font-semibold text-ink mb-2">Comece adicionando seu primeiro ativo</p>
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

        {totalCount > 0 && (
          <div className="space-y-4">
            {/* Parents with their units */}
            {orderedGroups.map(({ parent, children }) => (
              <div key={parent.id} className="card p-0 overflow-hidden">
                {/* Parent row */}
                <div className="border-b border-border">
                  <div className="flex items-center justify-between px-6 py-2 bg-surface">
                    <span className="text-xs font-bold uppercase tracking-widest text-ink-2">
                      Empreendimento · {children.length} {children.length === 1 ? "unidade" : "unidades"}
                    </span>
                    <Link
                      href={`/dashboard/properties/new?parent=${parent.id}`}
                      className="text-xs text-forest hover:text-forest-light font-semibold uppercase tracking-wider transition-colors"
                    >
                      + Nova unidade
                    </Link>
                  </div>
                  <PropertyRow property={parent} />
                </div>
                {/* Children */}
                {children.map((child) => (
                  <div key={child.id} className="border-b border-border last:border-b-0">
                    <PropertyRow property={child} isChild />
                  </div>
                ))}
              </div>
            ))}

            {/* Standalone properties */}
            {(standalone.length > 0 || orphanChildren.length > 0) && (
              <div className="card divide-y divide-border p-0 overflow-hidden">
                {standalone.map((property) => (
                  <PropertyRow key={property.id} property={property as Property} />
                ))}
                {orphanChildren.map((property) => (
                  <PropertyRow key={property.id} property={property as Property} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
