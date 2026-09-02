import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { deleteTransaction } from "./transactions/actions";
import { setListingStatus } from "../actions";
import { markVisitDone, cancelVisit } from "../../visitActions";
import MarketDataCard from "../_components/MarketDataCard";
import SharePropertyCard from "../_components/SharePropertyCard";
import { buildPropertyShareMessage } from "@/app/lib/propertyShareMessage";

const CATEGORY_LABELS: Record<string, string> = {
  rent: "Aluguel", iptu: "IPTU", condominium: "Condomínio",
  admin_fee: "Taxa de administração", maintenance: "Manutenção",
  insurance: "Seguro", investment: "Aporte / Parcela", other: "Outros",
};
const PURPOSE_LABELS: Record<string, string> = {
  sale: "Venda",
  rent: "Locação",
};
const PURPOSE_COLORS: Record<string, string> = {
  sale: "#C4A96B",
  rent: "#3B82F6",
};
const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  available: { label: "Disponível", color: "#5FBF8A" },
  reserved:  { label: "Reservado",  color: "#D9A05B" },
  closed:    { label: "Fechado",    color: "#9CA3AF" },
};
const TYPE_LABELS: Record<string, string> = {
  residential: "Residencial", commercial: "Comercial", land: "Terreno", mixed: "Misto",
};

function formatCurrency(value: number | null): string {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}
function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR", {
    day: "numeric", month: "short", year: "numeric",
  }).format(new Date(y, m - 1, d));
}
function formatDateShort(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR", {
    day: "numeric", month: "short",
  }).format(new Date(y, m - 1, d));
}
function formatPercent(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "percent", minimumFractionDigits: 1, maximumFractionDigits: 1,
  }).format(value);
}
function visitDateTime(iso: string): string {
  const date = new Intl.DateTimeFormat("pt-BR", {
    weekday: "short", day: "2-digit", month: "2-digit", timeZone: "UTC",
  }).format(new Date(iso));
  const time = new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit", minute: "2-digit", timeZone: "UTC",
  }).format(new Date(iso));
  return `${date} · ${time}`;
}

type Props = { params: { id: string } };

export default async function PropertyDetailPage({ params }: Props) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Sem filtro de user_id: a RLS libera imóveis próprios e da mesma imobiliária
  const { data: property, error } = await supabase
    .from("properties").select("*").eq("id", params.id).single();
  if (error || !property) notFound();

  const isOwner = property.user_id === user.id;

  const { data: myProfile } = await supabase
    .from("user_profiles")
    .select("agency_id, agency_role")
    .eq("id", user.id)
    .single();
  const isGestor = !!myProfile?.agency_id && myProfile?.agency_role === "gestor";
  const canEdit = isOwner || isGestor;

  const { data: ownerProfile } = isOwner
    ? { data: null }
    : await supabase
        .from("user_profiles")
        .select("full_name, phone")
        .eq("id", property.user_id)
        .single();

  const { data: transactions } = await supabase
    .from("transactions").select("*").eq("property_id", params.id).eq("user_id", user.id)
    .order("transaction_date", { ascending: false });

  // Visitas deste imóvel (inclui as de colegas da imobiliária via RLS)
  const { data: propertyVisits } = await supabase
    .from("property_visits")
    .select("id, user_id, visitor_name, visitor_phone, scheduled_at, status, notes")
    .eq("property_id", params.id)
    .order("scheduled_at", { ascending: false })
    .limit(12);
  const visits = propertyVisits ?? [];

  // Parent property (se for unidade)
  const { data: parentProperty } = property.parent_property_id
    ? await supabase
        .from("properties")
        .select("id, name, nickname")
        .eq("id", property.parent_property_id)
        .single()
    : { data: null };

  // Units (se for empreendimento pai)
  const { data: units } = await supabase
    .from("properties")
    .select("id, name, nickname, listing_purpose, listing_status, unit_identifier, monthly_rent, current_value")
    .eq("parent_property_id", params.id)
    .order("unit_identifier", { ascending: true });

  const propertyUnits = units || [];

  const allTxs = transactions ?? [];
  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const monthTxs = allTxs.filter(t => t.transaction_date.startsWith(currentMonthStr));

  const monthlyIncome = monthTxs.filter(t => t.transaction_type === "income").reduce((acc, t) => acc + Number(t.amount), 0);
  const monthlyExpense = monthTxs.filter(t => t.transaction_type === "expense").reduce((acc, t) => acc + Number(t.amount), 0);
  const monthlySaldo = monthlyIncome - monthlyExpense;

  const purpose = property.listing_purpose === "rent" ? "rent" : "sale";
  const status = STATUS_CONFIG[property.listing_status || "available"] ?? STATUS_CONFIG.available;
  const color = PURPOSE_COLORS[purpose];

  const yieldAnual = property.current_value && property.monthly_rent
    ? (Number(property.monthly_rent) / Number(property.current_value)) * 12 : null;

  const daysListed = property.listed_at
    ? Math.max(0, Math.floor((now.getTime() - new Date(`${property.listed_at}T12:00:00`).getTime()) / (1000 * 60 * 60 * 24)))
    : null;

  const ownerWaUrl = property.owner_phone
    ? `https://wa.me/55${String(property.owner_phone).replace(/\D/g, "")}?text=${encodeURIComponent(
        `Olá ${(property.owner_name || "").split(" ")[0] || ""}! Sobre o imóvel ${property.name}: `.replace("  ", " ")
      )}`
    : null;

  const shareMessage = buildPropertyShareMessage(property);

  return (
    <main className="min-h-screen bg-surface">
      {/* Header */}
      <header className="bg-header text-white ">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="font-display text-xl italic">
            My<span style={{ color: "#C4A96B" }}>Asset</span>
          </Link>
          <Link href="/dashboard/properties" className="text-xs text-gray-400 hover:text-white transition-colors uppercase tracking-wider">
            ← Carteira
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-5">

        {/* Breadcrumb pai */}
        {parentProperty && (
          <div className="flex items-center gap-2 text-sm text-ink-2">
            <Link href="/dashboard/properties" className="hover:text-forest transition-colors">Carteira</Link>
            <span className="text-ink-3">›</span>
            <Link href={`/dashboard/properties/${parentProperty.id}`} className="hover:text-forest transition-colors font-medium">
              {parentProperty.name}
            </Link>
            <span className="text-ink-3">›</span>
            <span className="text-ink font-semibold">{property.unit_identifier || property.name}</span>
          </div>
        )}

        {/* Identificação + ações */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color }}>
              {PURPOSE_LABELS[purpose]}
              <span
                className="ml-3 px-2 py-0.5 rounded-full text-[10px] border"
                style={{ color: status.color, borderColor: `${status.color}55`, backgroundColor: `${status.color}15` }}
              >
                {status.label}
              </span>
            </p>
            <h1 className="font-display text-5xl text-ink leading-tight mb-1">{property.name}</h1>
            <p className="text-sm text-ink-3 font-mono">@{property.nickname}</p>
            {!isOwner && ownerProfile && (
              <p className="text-xs text-ink-2 mt-1">
                👤 Captado por <strong className="text-ink">{ownerProfile.full_name || "colega da equipe"}</strong>
              </p>
            )}
            {(property.city || property.state) && (
              <p className="text-sm text-ink-2 mt-1">
                {[property.address, property.city, property.state].filter(Boolean).join(" · ")}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2 shrink-0">
            {canEdit && (
              <Link
                href={`/dashboard/properties/${params.id}/edit`}
                className="px-4 py-2 bg-surface border border-border text-ink text-xs font-bold uppercase tracking-wider rounded hover:border-forest hover:text-forest transition-colors text-center"
              >
                Editar imóvel
              </Link>
            )}
            <Link
              href={`/dashboard/visits/new?property=${params.id}`}
              className="px-4 py-2 bg-forest text-white text-xs font-bold uppercase tracking-wider rounded hover:bg-forest-light transition-colors text-center"
            >
              + Agendar visita
            </Link>
            <Link
              href={`/dashboard/deals/new?property=${params.id}`}
              className="px-4 py-2 text-white text-xs font-bold uppercase tracking-wider rounded transition-opacity hover:opacity-85 text-center"
              style={{ backgroundColor: "#5FBF8A" }}
            >
              Registrar fechamento
            </Link>

            {/* Troca rápida de status */}
            {canEdit && (
            <div className="flex gap-1 mt-1">
              {(["available", "reserved", "closed"] as const).map((s) => {
                const cfg = STATUS_CONFIG[s];
                const isCurrent = (property.listing_status || "available") === s;
                return (
                  <form action={setListingStatus} key={s} className="flex-1">
                    <input type="hidden" name="id" value={property.id} />
                    <input type="hidden" name="status" value={s} />
                    <button
                      type="submit"
                      disabled={isCurrent}
                      className="w-full px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded border transition-colors disabled:cursor-default"
                      style={isCurrent
                        ? { color: "#fff", backgroundColor: cfg.color, borderColor: cfg.color }
                        : { color: cfg.color, borderColor: `${cfg.color}55`, backgroundColor: "transparent" }}
                    >
                      {cfg.label}
                    </button>
                  </form>
                );
              })}
            </div>
            )}
          </div>
        </div>

        {/* ── FICHA DO NEGÓCIO ──────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card">
            <p className="kpi-label">{purpose === "sale" ? "Valor de venda" : "Valor do imóvel"}</p>
            <p className="kpi-value">{formatCurrency(property.current_value)}</p>
          </div>
          <div className="card">
            <p className="kpi-label">Aluguel pretendido</p>
            <p className="kpi-value text-positive">{property.monthly_rent ? `${formatCurrency(property.monthly_rent)}` : "—"}</p>
            {property.monthly_rent && <p className="text-xs text-ink-3 mt-1">por mês</p>}
          </div>
          <div className="card">
            <p className="kpi-label">IPTU</p>
            <p className="kpi-value">{property.iptu_amount ? formatCurrency(property.iptu_amount) : "—"}</p>
            {property.iptu_amount && <p className="text-xs text-ink-3 mt-1">por mês</p>}
          </div>
          <div className="card">
            <p className="kpi-label">Condomínio</p>
            <p className="kpi-value">{property.condo_fee ? formatCurrency(property.condo_fee) : "—"}</p>
            {property.condo_fee && <p className="text-xs text-ink-3 mt-1">por mês</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card">
            <p className="kpi-label">Proprietário</p>
            <p className="text-base font-semibold text-ink truncate">{property.owner_name || "—"}</p>
            {ownerWaUrl && (
              <a
                href={ownerWaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 mt-2 text-xs font-bold uppercase tracking-wider transition-opacity hover:opacity-80"
                style={{ color: "#25D366" }}
              >
                <svg width="12" height="12" viewBox="0 0 32 32" fill="#25D366">
                  <path d="M16 2C8.268 2 2 8.268 2 16c0 2.478.675 4.796 1.851 6.782L2 30l7.438-1.82A13.93 13.93 0 0016 30c7.732 0 14-6.268 14-14S23.732 2 16 2z"/>
                </svg>
                Chamar no WhatsApp
              </a>
            )}
          </div>
          <div className="card">
            <p className="kpi-label">Na carteira há</p>
            <p className="text-base font-semibold text-ink">
              {daysListed !== null ? `${daysListed} ${daysListed === 1 ? "dia" : "dias"}` : "—"}
            </p>
            {property.listed_at && <p className="text-xs text-ink-3 mt-1">desde {formatDate(property.listed_at)}</p>}
          </div>
          <div className="card">
            <p className="kpi-label">Tipo</p>
            <p className="text-base font-semibold text-ink">{TYPE_LABELS[property.property_type] || "—"}</p>
          </div>
          <div className="card">
            <p className="kpi-label">Yield anual</p>
            <p className="text-base font-semibold text-ink">{yieldAnual !== null ? formatPercent(yieldAnual) : "—"}</p>
            <p className="text-xs text-ink-3 mt-1">
              {yieldAnual !== null ? "aluguel ÷ valor do imóvel" : "sem dados de investidor"}
            </p>
          </div>
        </div>

        {/* ── COMPARTILHAR COM CLIENTE ──────────────────── */}
        <SharePropertyCard message={shareMessage} />

        {/* Card Inteligência de Mercado */}
        <MarketDataCard
          propertyId={params.id}
          propertyName={property.name}
          acquisitionValue={Number(property.acquisition_value) || null}
          currentValue={Number(property.current_value) || null}
          monthlyRent={Number(property.monthly_rent) || null}
          marketData={property.market_data ?? null}
        />

        {/* Unidades do empreendimento */}
        {propertyUnits.length > 0 && (
          <div className="card p-0 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-forest">Unidades</p>
                <p className="text-sm text-ink-2 mt-0.5">
                  {propertyUnits.length} {propertyUnits.length === 1 ? "unidade cadastrada" : "unidades cadastradas"}
                </p>
              </div>
              <Link
                href={`/dashboard/properties/new?parent=${params.id}`}
                className="px-4 py-2 bg-forest text-white text-xs font-bold uppercase tracking-wider rounded hover:bg-forest-light transition-colors"
              >
                + Nova unidade
              </Link>
            </div>
            <div className="divide-y divide-border">
              {propertyUnits.map((unit) => {
                const unitColor = PURPOSE_COLORS[unit.listing_purpose === "rent" ? "rent" : "sale"];
                const unitStatus = STATUS_CONFIG[unit.listing_status || "available"] ?? STATUS_CONFIG.available;
                return (
                  <Link
                    key={unit.id}
                    href={`/dashboard/properties/${unit.id}`}
                    className="flex items-center gap-4 px-6 py-4 hover:bg-surface transition-colors"
                  >
                    <div className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold"
                      style={{ backgroundColor: unitColor }}>
                      {(unit.unit_identifier || unit.nickname || "?").substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-ink truncate">{unit.name}</p>
                      <p className="text-xs" style={{ color: unitStatus.color }}>{unitStatus.label}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-positive">
                        {unit.listing_purpose === "rent"
                          ? (unit.monthly_rent ? `${formatCurrency(Number(unit.monthly_rent))}/mês` : "—")
                          : (unit.current_value ? formatCurrency(Number(unit.current_value)) : "—")}
                      </p>
                    </div>
                    <span className="text-ink-3 text-lg">›</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* ── VISITAS DO IMÓVEL ─────────────────────────── */}
        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <p className="section-title" style={{ marginBottom: 0 }}>Visitas</p>
            <Link
              href={`/dashboard/visits/new?property=${params.id}`}
              className="px-4 py-2 bg-forest text-white font-bold tracking-wider uppercase text-xs rounded hover:bg-forest-light transition-colors"
            >
              + Agendar visita
            </Link>
          </div>

          {visits.length === 0 ? (
            <div className="text-center py-8 text-ink-2 text-sm">
              Nenhuma visita agendada para este imóvel ainda.
            </div>
          ) : (
            <div className="divide-y divide-border">
              {visits.map((v) => {
                const isScheduled = v.status === "scheduled";
                const statusBadge = v.status === "done"
                  ? { label: "Realizada", cls: "bg-emerald-500/10 text-emerald-300 border-emerald-400/30" }
                  : v.status === "canceled"
                  ? { label: "Cancelada", cls: "bg-white/5 text-ink-3 border-border" }
                  : { label: "Agendada", cls: "bg-amber-500/10 text-amber-300 border-amber-400/30" };
                return (
                  <div key={v.id} className="flex items-center justify-between py-3.5 gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-ink truncate">{v.visitor_name}</p>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border shrink-0 ${statusBadge.cls}`}>
                          {statusBadge.label}
                        </span>
                      </div>
                      <p className="text-xs text-ink-3 mt-0.5">
                        {visitDateTime(String(v.scheduled_at))}
                        {v.notes ? ` · ${v.notes}` : ""}
                      </p>
                    </div>
                    {isScheduled && v.user_id === user.id && (
                      <div className="flex items-center gap-2 shrink-0">
                        <form action={markVisitDone}>
                          <input type="hidden" name="visit_id" value={v.id} />
                          <button type="submit" className="px-3 py-1.5 bg-forest text-white text-[10px] font-bold uppercase tracking-wider rounded hover:bg-forest-light transition-colors">
                            ✓ Realizada
                          </button>
                        </form>
                        <form action={cancelVisit}>
                          <input type="hidden" name="visit_id" value={v.id} />
                          <button type="submit" className="text-[10px] text-ink-3 hover:text-negative transition-colors uppercase tracking-wider">
                            Cancelar
                          </button>
                        </form>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── FINANCEIRO DO IMÓVEL (só o captador vê) ───── */}
        {isOwner && (
        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="section-title" style={{ marginBottom: 0 }}>Financeiro do imóvel</p>
              <p className="text-xs text-ink-3 mt-1">
                Para imóveis que você administra — receitas e despesas do mês:
                <span className="text-positive font-semibold"> {formatCurrency(monthlyIncome)}</span> ·
                <span className="text-negative font-semibold"> {formatCurrency(monthlyExpense)}</span> ·
                saldo <span className={`font-semibold ${monthlySaldo >= 0 ? "text-positive" : "text-negative"}`}>{formatCurrency(monthlySaldo)}</span>
              </p>
            </div>
            <div className="flex gap-3">
              <Link href={`/dashboard/properties/${params.id}/transactions/new?type=income`} className="px-4 py-2 bg-forest text-white font-bold tracking-wider uppercase text-xs rounded hover:bg-forest-light transition-colors">
                + Receita
              </Link>
              <Link href={`/dashboard/properties/${params.id}/transactions/new?type=expense`} className="px-4 py-2 bg-header text-white font-bold tracking-wider uppercase text-xs rounded hover:opacity-80 transition-opacity">
                + Despesa
              </Link>
            </div>
          </div>

          {allTxs.length === 0 ? (
            <div className="text-center py-8 text-ink-2 text-sm">
              Nenhum lançamento ainda. Use para controlar receitas e despesas de imóveis que você administra.
            </div>
          ) : (
            <div className="divide-y divide-border">
              {allTxs.map((t) => (
                <div key={t.id} className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-5 flex-1 min-w-0">
                    <span className="text-sm text-ink-3 shrink-0 w-16">{formatDateShort(t.transaction_date)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold uppercase tracking-wider text-ink-2">{CATEGORY_LABELS[t.category] || t.category}</p>
                      {t.description && <p className="text-xs text-ink-3 truncate mt-0.5">{t.description}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <span className={`font-bold text-sm ${t.transaction_type === "income" ? "text-positive" : "text-negative"}`}>
                      {t.transaction_type === "income" ? "+" : "-"}{formatCurrency(Number(t.amount))}
                    </span>
                    <form action={deleteTransaction}>
                      <input type="hidden" name="id" value={t.id} />
                      <input type="hidden" name="property_id" value={params.id} />
                      <button type="submit" className="text-ink-3 hover:text-negative transition-colors text-lg leading-none">×</button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        )}
      </div>
    </main>
  );
}
