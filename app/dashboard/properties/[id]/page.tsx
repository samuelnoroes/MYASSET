import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { deleteTransaction } from "./transactions/actions";
import { toggleAvailableForSale } from "../actions";

const CATEGORY_LABELS: Record<string, string> = {
  rent: "Aluguel", iptu: "IPTU", condominium: "Condomínio",
  maintenance: "Manutenção", insurance: "Seguro",
  investment: "Aporte / Parcela", other: "Outros",
};
const ADJUSTMENT_LABELS: Record<string, string> = {
  igpm: "IGP-M", ipca: "IPCA", ivar: "IVAR", inpc: "INPC", other: "Outro",
};
const MODALITY_LABELS: Record<string, string> = {
  annual_lease: "Locação anual",
  short_stay: "Temporada / Airbnb",
  under_construction: "Na planta",
};
const MODALITY_COLORS: Record<string, string> = {
  annual_lease: "#2D4A3E",
  short_stay: "#3B82F6",
  under_construction: "#F59E0B",
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

function buildProposalWhatsAppUrl(property: any): string {
  const phone = "5511987266842";
  const modality = MODALITY_LABELS[property.modality] || property.modality;
  const location = [property.address, property.city, property.state].filter(Boolean).join(", ") || "Não informada";
  const lines = [
    `Olá! Tenho um imóvel disponível para propostas no MyAsset.`,
    ``,
    `🏠 *${property.name}*`,
    `📋 Modalidade: ${modality}`,
    `📍 Localização: ${location}`,
    property.modality === "under_construction"
      ? `💰 VGV total: ${formatCurrency(Number(property.total_investment))}`
      : `💰 Valor atual: ${formatCurrency(Number(property.current_value))}`,
    `🔑 ${property.modality === "under_construction" ? "Aluguel projetado" : "Aluguel/mês"}: ${formatCurrency(Number(property.monthly_rent))}`,
    ``,
    `Gostaria de receber propostas ou uma avaliação da A5 Asset.`,
  ];
  return `https://wa.me/${phone}?text=${encodeURIComponent(lines.join("\n"))}`;
}

type Props = { params: { id: string } };

export default async function PropertyDetailPage({ params }: Props) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: property, error } = await supabase
    .from("properties").select("*").eq("id", params.id).eq("user_id", user.id).single();
  if (error || !property) notFound();

  const { data: transactions } = await supabase
    .from("transactions").select("*").eq("property_id", params.id).eq("user_id", user.id)
    .order("transaction_date", { ascending: false });

  const allTxs = transactions ?? [];
  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const monthTxs = allTxs.filter(t => t.transaction_date.startsWith(currentMonthStr));

  const monthlyIncome = monthTxs.filter(t => t.transaction_type === "income").reduce((acc, t) => acc + Number(t.amount), 0);
  const monthlyExpense = monthTxs.filter(t => t.transaction_type === "expense" && t.category !== "investment").reduce((acc, t) => acc + Number(t.amount), 0);
  const monthlySaldo = monthlyIncome - monthlyExpense;

  const modality = property.modality || "annual_lease";
  const isAnnual = modality === "annual_lease";
  const isShortStay = modality === "short_stay";
  const isPlanta = modality === "under_construction";
  const color = MODALITY_COLORS[modality] || "#2D4A3E";

  const yieldAnual = property.current_value && property.monthly_rent
    ? (Number(property.monthly_rent) / Number(property.current_value)) * 12 : null;
  const progressPago = property.total_investment && property.acquisition_value
    ? Number(property.acquisition_value) / Number(property.total_investment) : null;

  const proposalUrl = buildProposalWhatsAppUrl(property);

  // Alertas de parcela
  const nextInstallmentDays = property.next_installment_date
    ? Math.ceil((new Date(property.next_installment_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : null;
  const balloonDays = property.balloon_date
    ? Math.ceil((new Date(property.balloon_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const showInstallmentAlert = nextInstallmentDays !== null && nextInstallmentDays <= 5;
  const showBalloonAlert = balloonDays !== null && balloonDays >= 0 && balloonDays <= 30;

  return (
    <main className="min-h-screen bg-surface">
      {/* Header */}
      <header className="bg-header text-white shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="font-display text-xl italic">
            My<span style={{ color: "#6BA68A" }}>Asset</span>
          </Link>
          <Link href="/dashboard/properties" className="text-xs text-gray-400 hover:text-white transition-colors uppercase tracking-wider">
            ← Portfólio
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-5">

        {/* Identificação + ações */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color }}>
              {MODALITY_LABELS[modality]}
              {property.available_for_sale && (
                <span className="ml-3 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-[10px] border border-blue-200">
                  Disponível para proposta
                </span>
              )}
            </p>
            <h1 className="font-display text-5xl text-ink leading-tight mb-1">{property.name}</h1>
            <p className="text-sm text-ink-3 font-mono">@{property.nickname}</p>
            {(property.city || property.state) && (
              <p className="text-sm text-ink-2 mt-1">
                {[property.address, property.city, property.state].filter(Boolean).join(" · ")}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2 shrink-0">
            <Link
              href={`/dashboard/properties/${params.id}/edit`}
              className="px-4 py-2 bg-surface border border-border text-ink text-xs font-bold uppercase tracking-wider rounded hover:border-forest hover:text-forest transition-colors text-center"
            >
              Editar imóvel
            </Link>
            <form action={toggleAvailableForSale}>
              <input type="hidden" name="id" value={property.id} />
              <input type="hidden" name="current" value={String(property.available_for_sale)} />
              <button type="submit" className={`w-full px-4 py-2 text-xs font-bold uppercase tracking-wider rounded transition-colors text-center ${property.available_for_sale ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-surface border border-border text-ink hover:border-blue-500 hover:text-blue-600"}`}>
                {property.available_for_sale ? "✓ Disponível para proposta" : "Marcar para proposta"}
              </button>
            </form>
            {property.available_for_sale && (
              <a
                href={proposalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider rounded text-white transition-colors"
                style={{ backgroundColor: "#25D366" }}
              >
                <svg width="14" height="14" viewBox="0 0 32 32" fill="white">
                  <path d="M16 2C8.268 2 2 8.268 2 16c0 2.478.675 4.796 1.851 6.782L2 30l7.438-1.82A13.93 13.93 0 0016 30c7.732 0 14-6.268 14-14S23.732 2 16 2zm6.29 19.927c-.344-.172-2.035-1.003-2.35-1.118-.316-.115-.546-.172-.776.172-.23.344-.888 1.118-1.088 1.348-.2.23-.4.258-.744.086-.344-.172-1.454-.535-2.768-1.703-1.023-.912-1.714-2.037-1.914-2.381-.2-.344-.022-.53.15-.701.155-.154.344-.4.516-.601.172-.2.23-.344.344-.573.115-.23.057-.43-.028-.601-.086-.172-.776-1.872-1.062-2.564-.28-.672-.565-.58-.776-.59l-.66-.012c-.23 0-.601.086-.916.43-.315.344-1.204 1.175-1.204 2.866 0 1.69 1.233 3.324 1.405 3.553.172.23 2.428 3.71 5.882 5.203.822.355 1.464.567 1.965.726.826.262 1.578.225 2.173.137.663-.098 2.035-.832 2.322-1.635.287-.803.287-1.49.2-1.635-.086-.144-.315-.23-.659-.4z"/>
                </svg>
                Enviar para A5 Asset
              </a>
            )}
          </div>
        </div>

        {/* ── KPIs PRINCIPAIS ──────────────────────────── */}
        {isPlanta ? (
          <>
            {/* Alerta de parcela mensal */}
            {showInstallmentAlert && (
              <div className={`flex items-center gap-4 px-5 py-4 rounded-card border ${nextInstallmentDays! < 0 ? "border-red-200 bg-red-50" : "border-amber-200 bg-amber-50"}`}>
                <span className="text-lg">{nextInstallmentDays! < 0 ? "🔴" : "🟡"}</span>
                <div>
                  <p className={`text-xs font-bold uppercase tracking-wider ${nextInstallmentDays! < 0 ? "text-red-700" : "text-amber-700"}`}>
                    {nextInstallmentDays! < 0
                      ? `Parcela em atraso — ${Math.abs(nextInstallmentDays!)} ${Math.abs(nextInstallmentDays!) === 1 ? "dia" : "dias"}`
                      : nextInstallmentDays === 0
                      ? "Parcela vence hoje"
                      : `Parcela vence em ${nextInstallmentDays} ${nextInstallmentDays === 1 ? "dia" : "dias"}`}
                  </p>
                  <p className="text-sm text-ink mt-0.5">
                    {formatCurrency(property.installment_amount)} · {formatDate(property.next_installment_date)}
                  </p>
                </div>
                <a
                  href={`/dashboard/properties/${params.id}/transactions/new?type=expense`}
                  className="ml-auto text-xs font-bold uppercase tracking-wider px-3 py-2 rounded text-white"
                  style={{ backgroundColor: nextInstallmentDays! < 0 ? "#DC2626" : "#2D4A3E" }}
                >
                  Registrar
                </a>
              </div>
            )}

            {/* Alerta de balão */}
            {showBalloonAlert && (
              <div className="flex items-center gap-4 px-5 py-4 rounded-card border border-blue-200 bg-blue-50">
                <span className="text-lg">🏗️</span>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-blue-700">
                    Balão / parcela especial — {balloonDays === 0 ? "vence hoje" : `vence em ${balloonDays} ${balloonDays === 1 ? "dia" : "dias"}`}
                  </p>
                  <p className="text-sm text-ink mt-0.5">
                    {formatCurrency(property.balloon_amount)} · {formatDate(property.balloon_date)}
                  </p>
                </div>
                <a
                  href={`/dashboard/properties/${params.id}/transactions/new?type=expense`}
                  className="ml-auto text-xs font-bold uppercase tracking-wider px-3 py-2 rounded text-white bg-blue-600"
                >
                  Registrar
                </a>
              </div>
            )}

            {/* KPIs planta */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="card"><p className="kpi-label">Já pago</p><p className="kpi-value">{formatCurrency(property.acquisition_value)}</p></div>
              <div className="card"><p className="kpi-label">VGV total</p><p className="kpi-value">{formatCurrency(property.total_investment)}</p></div>
              <div className="card"><p className="kpi-label">% Pago</p><p className="kpi-value text-positive">{progressPago !== null ? formatPercent(progressPago) : "—"}</p></div>
              <div className="card">
                <p className="kpi-label">Próxima parcela</p>
                {property.next_installment_date ? (
                  <>
                    <p className="kpi-value" style={{ color: "#3B82F6" }}>
                      {formatCurrency(property.installment_amount)}
                    </p>
                    <p className="text-xs text-ink-3 mt-1">{formatDate(property.next_installment_date)}</p>
                  </>
                ) : (
                  <p className="kpi-value text-ink-3">—</p>
                )}
              </div>
            </div>

            {/* KPIs secundários planta */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="card"><p className="kpi-label">Previsão de entrega</p><p className="text-base font-semibold text-ink">{property.delivery_date ? formatDate(property.delivery_date) : "—"}</p></div>
              <div className="card"><p className="kpi-label">Assinatura</p><p className="text-base font-semibold text-ink">{property.acquisition_date ? formatDate(property.acquisition_date) : "—"}</p></div>
              <div className="card"><p className="kpi-label">Aluguel projetado</p><p className="text-base font-semibold text-positive">{formatCurrency(property.monthly_rent)}/mês</p></div>
              {property.balloon_date ? (
                <div className="card">
                  <p className="kpi-label">Balão / parcela especial</p>
                  <p className="text-base font-semibold" style={{ color: "#3B82F6" }}>{formatCurrency(property.balloon_amount)}</p>
                  <p className="text-xs text-ink-3 mt-1">{formatDate(property.balloon_date)}</p>
                </div>
              ) : (
                <div className="card"><p className="kpi-label">Modelo de pagamento</p><p className="text-sm text-ink mt-1">{property.payment_notes || "—"}</p></div>
              )}
            </div>

            {/* Modelo de pagamento quando há balão */}
            {property.balloon_date && property.payment_notes && (
              <div className="card">
                <p className="kpi-label">Modelo de pagamento</p>
                <p className="text-sm text-ink mt-1">{property.payment_notes}</p>
              </div>
            )}
          </>
        ) : isShortStay ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="card"><p className="kpi-label">Receitas do mês</p><p className="kpi-value text-positive">{formatCurrency(monthlyIncome)}</p></div>
              <div className="card"><p className="kpi-label">Despesas do mês</p><p className="kpi-value">{formatCurrency(monthlyExpense)}</p></div>
              <div className="card"><p className="kpi-label">Saldo do mês</p><p className={`kpi-value ${monthlySaldo >= 0 ? "text-positive" : "text-negative"}`}>{formatCurrency(monthlySaldo)}</p></div>
              <div className="card"><p className="kpi-label">Yield anual</p><p className="kpi-value">{yieldAnual !== null ? formatPercent(yieldAnual) : "—"}</p><p className="text-xs text-ink-3 mt-1">aluguel esperado / valor atual</p></div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="card"><p className="kpi-label">Valor de compra</p><p className="text-base font-semibold text-ink">{formatCurrency(property.acquisition_value)}</p></div>
              <div className="card"><p className="kpi-label">Valor atual</p><p className="text-base font-semibold text-ink">{formatCurrency(property.current_value)}</p></div>
              <div className="card"><p className="kpi-label">Diária média</p><p className="text-base font-semibold text-ink">{formatCurrency(property.daily_rate)}</p></div>
              <div className="card"><p className="kpi-label">Ocupação esperada</p><p className="text-base font-semibold text-ink">{property.target_occupancy ? `${property.target_occupancy}%` : "—"}</p></div>
            </div>
          </>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="card"><p className="kpi-label">Receitas do mês</p><p className="kpi-value text-positive">{formatCurrency(monthlyIncome)}</p></div>
              <div className="card"><p className="kpi-label">Despesas do mês</p><p className="kpi-value">{formatCurrency(monthlyExpense)}</p></div>
              <div className="card"><p className="kpi-label">Saldo do mês</p><p className={`kpi-value ${monthlySaldo >= 0 ? "text-positive" : "text-negative"}`}>{formatCurrency(monthlySaldo)}</p></div>
              <div className="card"><p className="kpi-label">Yield anual</p><p className="kpi-value">{yieldAnual !== null ? formatPercent(yieldAnual) : "—"}</p><p className="text-xs text-ink-3 mt-1">aluguel esperado / valor atual</p></div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="card"><p className="kpi-label">Valor de compra</p><p className="text-base font-semibold text-ink">{formatCurrency(property.acquisition_value)}</p></div>
              <div className="card"><p className="kpi-label">Valor atual</p><p className="text-base font-semibold text-ink">{formatCurrency(property.current_value)}</p></div>
              <div className="card">
                <p className="kpi-label">Aluguel contratual{property.lease_due_day ? ` · vence dia ${property.lease_due_day}` : ""}</p>
                <p className="text-base font-semibold text-positive">{formatCurrency(property.monthly_rent)}/mês</p>
              </div>
              <div className="card">
                <p className="kpi-label">Renovação{property.adjustment_index ? ` · ${ADJUSTMENT_LABELS[property.adjustment_index] || property.adjustment_index}` : ""}</p>
                <p className="text-base font-semibold text-ink">{property.lease_renewal_date ? formatDate(property.lease_renewal_date) : "—"}</p>
              </div>
            </div>
          </>
        )}

        {/* ── TRANSAÇÕES ──────────────────────────────── */}
        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <p className="section-title" style={{ marginBottom: 0 }}>
              {isPlanta ? "Aportes e custos" : "Transações"}
            </p>
            <div className="flex gap-3">
              {!isPlanta && (
                <Link href={`/dashboard/properties/${params.id}/transactions/new?type=income`} className="px-4 py-2 bg-forest text-white font-bold tracking-wider uppercase text-xs rounded hover:bg-forest-light transition-colors">
                  + Receita
                </Link>
              )}
              <Link href={`/dashboard/properties/${params.id}/transactions/new?type=expense`} className="px-4 py-2 bg-header text-white font-bold tracking-wider uppercase text-xs rounded hover:opacity-80 transition-opacity">
                {isPlanta ? "+ Aporte" : "+ Despesa"}
              </Link>
            </div>
          </div>

          {allTxs.length === 0 ? (
            <div className="text-center py-10 text-ink-2 text-sm">
              {isPlanta ? "Registre os aportes e parcelas do imóvel." : "Comece lançando uma receita ou despesa."}
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
                    <span className={`font-bold text-sm ${t.transaction_type === "income" ? "text-positive" : t.category === "investment" ? "" : "text-negative"}`}
                      style={{ color: t.category === "investment" ? "#3B82F6" : undefined }}>
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
      </div>
    </main>
  );
}
