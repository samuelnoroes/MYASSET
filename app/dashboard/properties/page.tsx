import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { deleteProperty } from "./actions";

const PURPOSE_LABELS: Record<string, string> = {
  sale: "Venda",
  rent: "Locação",
};

const PURPOSE_COLORS: Record<string, string> = {
  sale: "#C4A96B",
  rent: "#3B82F6",
};

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  available: { label: "Disponível", cls: "bg-emerald-500/10 text-emerald-300 border-emerald-400/30" },
  reserved:  { label: "Reservado",  cls: "bg-amber-500/10 text-amber-300 border-amber-400/30" },
  closed:    { label: "Fechado",    cls: "bg-white/5 text-ink-3 border-border" },
};

function formatCurrency(value: number | null): string {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function formatCurrencyShort(value: number | null): string {
  if (value === null || value === undefined || value === 0) return "—";
  if (value >= 1_000_000) return `R$ ${(value / 1_000_000).toFixed(1).replace(".", ",")}M`;
  if (value >= 1_000) return `R$ ${Math.round(value / 1_000)}K`;
  return formatCurrency(value);
}

function visitLabel(iso: string): string {
  const date = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", timeZone: "UTC" }).format(new Date(iso));
  const time = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" }).format(new Date(iso));
  return `${date} ${time}`;
}

type Property = {
  id: string;
  name: string;
  nickname: string;
  property_type: string;
  city: string | null;
  state: string | null;
  current_value: number | null;
  monthly_rent: number | null;
  acquisition_value: number | null;
  iptu_amount: number | null;
  condo_fee: number | null;
  listing_purpose: string | null;
  listing_status: string | null;
  parent_property_id: string | null;
  unit_identifier: string | null;
};

function PropertyRow({
  property,
  nextVisit,
  isChild = false,
}: {
  property: Property;
  nextVisit?: string;
  isChild?: boolean;
}) {
  const purpose = property.listing_purpose === "rent" ? "rent" : "sale";
  const status = STATUS_CONFIG[property.listing_status || "available"] ?? STATUS_CONFIG.available;
  const color = PURPOSE_COLORS[purpose];

  const mainValue = purpose === "sale"
    ? property.current_value ?? property.acquisition_value
    : property.monthly_rent;

  return (
    <div
      className={`flex items-center gap-5 px-6 py-5 hover:bg-surface transition-colors ${
        isChild ? "pl-14 bg-surface/50 border-l-2 border-border" : ""
      }`}
    >
      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color }}>
            {PURPOSE_LABELS[purpose]}
          </span>
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${status.cls}`}>
            {status.label}
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
        <p className="text-sm text-ink-3">
          {[property.city, property.state].filter(Boolean).join(" · ")}
          {nextVisit && (
            <span className="text-forest">
              {(property.city || property.state) ? " · " : ""}🗓️ visita {visitLabel(nextVisit)}
            </span>
          )}
        </p>
      </div>

      {/* Valores */}
      <div className="hidden md:block text-right shrink-0">
        <p className="text-xs text-ink-3 uppercase tracking-wider">
          {purpose === "sale" ? "Valor de venda" : "Aluguel"}
        </p>
        <p className="text-base font-bold text-ink">
          {mainValue ? `${formatCurrencyShort(Number(mainValue))}${purpose === "rent" ? "/mês" : ""}` : "—"}
        </p>
      </div>

      <div className="hidden lg:block text-right shrink-0 ml-6 w-28">
        <p className="text-xs text-ink-3 uppercase tracking-wider">IPTU · Cond.</p>
        <p className="text-sm font-semibold text-ink-2">
          {formatCurrencyShort(property.iptu_amount ? Number(property.iptu_amount) : null)}
          {" · "}
          {formatCurrencyShort(property.condo_fee ? Number(property.condo_fee) : null)}
        </p>
      </div>

      {/* Ações */}
      <div className="flex items-center gap-3 shrink-0 ml-2">
        <Link
          href={`/dashboard/visits/new?property=${property.id}`}
          className="text-xs text-forest hover:text-forest-light transition-colors uppercase tracking-wider font-semibold"
        >
          Visita
        </Link>
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

const FILTERS: { key: string; label: string; match: (p: Property) => boolean }[] = [
  { key: "all",       label: "Todos",       match: () => true },
  { key: "available", label: "Disponíveis", match: (p) => (p.listing_status || "available") === "available" },
  { key: "reserved",  label: "Reservados",  match: (p) => p.listing_status === "reserved" },
  { key: "closed",    label: "Fechados",    match: (p) => p.listing_status === "closed" },
  { key: "sale",      label: "Venda",       match: (p) => (p.listing_purpose || "sale") === "sale" },
  { key: "rent",      label: "Locação",     match: (p) => p.listing_purpose === "rent" },
];

export default async function PropertiesPage({
  searchParams,
}: {
  searchParams: { filtro?: string };
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: properties, error } = await supabase
    .from("properties")
    .select("id, name, nickname, property_type, city, state, current_value, monthly_rent, acquisition_value, iptu_amount, condo_fee, listing_purpose, listing_status, parent_property_id, unit_identifier")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) redirect("/error?message=" + encodeURIComponent(error.message));

  const allProps = (properties || []) as Property[];

  // Próxima visita agendada por imóvel
  const { data: upcomingVisits } = await supabase
    .from("property_visits")
    .select("property_id, scheduled_at")
    .eq("user_id", user.id)
    .eq("status", "scheduled")
    .gte("scheduled_at", new Date().toISOString().slice(0, 10))
    .order("scheduled_at", { ascending: true });

  const nextVisitByProperty = new Map<string, string>();
  for (const v of upcomingVisits ?? []) {
    if (!nextVisitByProperty.has(v.property_id)) {
      nextVisitByProperty.set(v.property_id, String(v.scheduled_at));
    }
  }

  const activeFilter = FILTERS.find(f => f.key === searchParams.filtro) ?? FILTERS[0];
  const isFiltering = activeFilter.key !== "all";
  const filteredProps = allProps.filter(activeFilter.match);

  // Agrupamento pai/filho (só sem filtro; com filtro, lista plana)
  const childrenByParent = new Map<string, Property[]>();
  const parentIds = new Set(allProps.map((p) => p.parent_property_id).filter(Boolean) as string[]);

  allProps.forEach((p) => {
    if (p.parent_property_id) {
      const siblings = childrenByParent.get(p.parent_property_id) || [];
      siblings.push(p);
      childrenByParent.set(p.parent_property_id, siblings);
    }
  });

  const parents = allProps.filter((p) => parentIds.has(p.id));
  const standalone = allProps.filter((p) => !p.parent_property_id && !parentIds.has(p.id));
  const orphanChildren = allProps.filter(
    (p) => p.parent_property_id && !allProps.find((pp) => pp.id === p.parent_property_id)
  );

  const orderedGroups = parents.map((p) => ({
    parent: p,
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
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <p className="section-title">Carteira</p>
            <p className="text-sm text-ink-2">
              {totalCount} {totalCount === 1 ? "imóvel na carteira" : "imóveis na carteira"}
              {isFiltering && ` · ${filteredProps.length} no filtro "${activeFilter.label}"`}
            </p>
          </div>
          <Link
            href="/dashboard/properties/new"
            className="self-start px-6 py-3 bg-forest text-white font-bold tracking-wider uppercase text-sm hover:bg-forest-light transition-colors rounded"
          >
            + Captar imóvel
          </Link>
        </div>

        {/* Filtros */}
        {totalCount > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {FILTERS.map((f) => (
              <Link
                key={f.key}
                href={f.key === "all" ? "/dashboard/properties" : `/dashboard/properties?filtro=${f.key}`}
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
        )}

        {totalCount === 0 && (
          <div className="card text-center py-16">
            <p className="text-4xl mb-4">🏠</p>
            <p className="text-xs font-bold uppercase tracking-widest text-ink-3 mb-3">Carteira vazia</p>
            <p className="text-base font-semibold text-ink mb-2">Capte seu primeiro imóvel</p>
            <p className="text-sm text-ink-2 max-w-md mx-auto mb-6">
              Cadastre imóveis para venda ou locação e tenha a ficha completa pronta para compartilhar com clientes.
            </p>
            <Link
              href="/dashboard/properties/new"
              className="inline-block px-6 py-3 bg-forest text-white font-bold tracking-wider uppercase text-sm hover:bg-forest-light transition-colors rounded"
            >
              Captar imóvel
            </Link>
          </div>
        )}

        {totalCount > 0 && isFiltering && (
          filteredProps.length === 0 ? (
            <div className="card text-center py-12">
              <p className="text-sm text-ink-2">Nenhum imóvel no filtro "{activeFilter.label}".</p>
            </div>
          ) : (
            <div className="card divide-y divide-border p-0 overflow-hidden">
              {filteredProps.map((property) => (
                <PropertyRow
                  key={property.id}
                  property={property}
                  nextVisit={nextVisitByProperty.get(property.id)}
                />
              ))}
            </div>
          )
        )}

        {totalCount > 0 && !isFiltering && (
          <div className="space-y-4">
            {/* Empreendimentos com unidades */}
            {orderedGroups.map(({ parent, children }) => (
              <div key={parent.id} className="card p-0 overflow-hidden">
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
                  <PropertyRow property={parent} nextVisit={nextVisitByProperty.get(parent.id)} />
                </div>
                {children.map((child) => (
                  <div key={child.id} className="border-b border-border last:border-b-0">
                    <PropertyRow property={child} nextVisit={nextVisitByProperty.get(child.id)} isChild />
                  </div>
                ))}
              </div>
            ))}

            {/* Imóveis avulsos */}
            {(standalone.length > 0 || orphanChildren.length > 0) && (
              <div className="card divide-y divide-border p-0 overflow-hidden">
                {standalone.map((property) => (
                  <PropertyRow key={property.id} property={property} nextVisit={nextVisitByProperty.get(property.id)} />
                ))}
                {orphanChildren.map((property) => (
                  <PropertyRow key={property.id} property={property} nextVisit={nextVisitByProperty.get(property.id)} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
