import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { deleteTransaction } from "./transactions/actions";

const CATEGORY_LABELS: Record<string, string> = {
  rent: "Aluguel",
  iptu: "IPTU",
  condominium: "Condomínio",
  maintenance: "Manutenção",
  insurance: "Seguro",
  other: "Outros",
};

const ADJUSTMENT_LABELS: Record<string, string> = {
  igpm: "IGP-M",
  ipca: "IPCA",
  ivar: "IVAR",
  inpc: "INPC",
  other: "Outro",
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
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(year, month - 1, day));
}

function formatDateShort(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR", {
    day: "numeric",
    month: "short",
  }).format(new Date(year, month - 1, day));
}

function formatPercent(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "percent",
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value);
}

type Props = { params: { id: string } };

export default async function PropertyDetailPage({ params }: Props) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: property, error } = await supabase
    .from("properties")
    .select("*")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single();

  if (error || !property) notFound();

  const { data: transactions } = await supabase
    .from("transactions")
    .select("*")
    .eq("property_id", params.id)
    .eq("user_id", user.id)
    .order("transaction_date", { ascending: false });

  const allTxs = transactions ?? [];

  // Mês corrente
  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const monthTxs = allTxs.filter((t) => t.transaction_date.startsWith(currentMonthStr));

  const monthlyIncome = monthTxs
    .filter((t) => t.transaction_type === "income")
    .reduce((acc, t) => acc + Number(t.amount), 0);
  const monthlyExpense = monthTxs
    .filter((t) => t.transaction_type === "expense")
    .reduce((acc, t) => acc + Number(t.amount), 0);
  const monthlySaldo = monthlyIncome - monthlyExpense;

  const modality = property.modality || "annual_lease";
  const isAnnual = modality === "annual_lease";
  const isShortStay = modality === "short_stay";
  const isPlanta = modality === "under_construction";
  const color = MODALITY_COLORS[modality] || "#2D4A3E";

  const yieldAnual =
    property.current_value && property.monthly_rent
      ? (Number(property.monthly_rent) / Number(property.current_value)) * 12
      : null;

  const progressPago =
    property.total_investment && property.acquisition_value
      ? Number(property.acquisition_value) / Number(property.total_investment)
      : null;

  const yieldProjetado =
    isPlanta && property.total_investment && property.monthly_rent
      ? (Number(property.monthly_rent) / Number(property.total_investment)) * 12
      : null;

  return (
    <main className="min-h-screen bg-surface">
      {/* Header */}
      <header className="bg-header text-white shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="font-display text-xl italic">
            My<span style={{ color: "#6BA68A" }}>Asset</span>
          </Link>
          <Link
            href="/dashboard/properties"
            className="text-xs text-gray-400 hover:text-white transition-colors uppercase tracking-wider"
          >
            ← Portfólio
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-5">

        {/* Identificação */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <p
              className="text-xs font-bold uppercase tracking-widest mb-2"
              style={{ color }}
            >
              {MODALITY_LABELS[modality]}
            </p>
            <h1 className="font-display text-5xl text-ink leading-tight mb-1">
              {property.name}
            </h1>
            <p className="text-sm text-ink-3 font-mono">@{property.nickname}</p>
            {(property.city || property.state) && (
              <p className="text-sm text-ink-2 mt-1">
                {[property.address, property.city, property.state]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            )}
          </div>
          <Link
            href={`/dashboard/properties/${params.id}/edit`}
            className="self-start text-xs text-ink-3 hover:text-forest transition-colors uppercase tracking-wider"
          >
            Editar imóvel
          </Link>
        </div>

        {/* ── KPIs PRINCIPAIS ───────────────────────────── */}
        {isPlanta ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="card">
              <p className="kpi-label">Já pago</p>
              <p className="kpi-value">{formatCurrency(property.acquisition_value)}</p>
            </div>
            <div className="card">
              <p className="kpi-label">VGV total</p>
              <p className="kpi-value">{formatCurrency(property.total_investment)}</p>
            </div>
            <div className="card">
              <p className="kpi-label">% Pago</p>
              <p className="kpi-value text-positive">
                {progressPago !== null ? formatPercent(progressPago) : "—"}
              </p>
            </div>
            <div className="card">
              <p className="kpi-label">Yield projetado</p>
              <p className="kpi-value">
                {yieldProjetado !== null ? formatPercent(yieldProjetado) : "—"}
              </p>
              <p className="text-xs text-ink-3 mt-1">ao ano, após entrega</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="card">
              <p className="kpi-label">Receitas do mês</p>
              <p className="kpi-value text-positive">{formatCurrency(monthlyIncome)}</p>
            </div>
            <div className="card">
              <p className="kpi-label">Despesas do mês</p>
              <p className="kpi-value">{formatCurrency(monthlyExpense)}</p>
            </div>
            <div className="card">
              <p className="kpi-label">Saldo do mês</p>
              <p className={`kpi-value ${monthlySaldo >= 0 ? "text-positive" : "text-negative"}`}>
                {formatCurrency(monthlySaldo)}
              </p>
            </div>
            <div className="card">
              <p className="kpi-label">Yield anual</p>
              <p className="kpi-value">
                {yieldAnual !== null ? formatPercent(yieldAnual) : "—"}
              </p>
              <p className="text-xs text-ink-3 mt-1">aluguel esperado / valor atual</p>
            </div>
          </div>
        )}

        {/* ── KPIs SECUNDÁRIOS ──────────────────────────── */}
        {isPlanta ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="card">
              <p className="kpi-label">Previsão de entrega</p>
              <p className="text-base font-semibold text-ink">
                {property.delivery_date ? formatDate(property.delivery_date) : "—"}
              </p>
            </div>
            <div className="card">
              <p className="kpi-label">Assinatura</p>
              <p className="text-base font-semibold text-ink">
                {property.acquisition_date ? formatDate(property.acquisition_date) : "—"}
              </p>
            </div>
            <div className="card">
              <p className="kpi-label">Aluguel projetado</p>
              <p className="text-base font-semibold text-positive">
                {formatCurrency(property.monthly_rent)}/mês
              </p>
            </div>
          </div>
        ) : isShortStay ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="card">
              <p className="kpi-label">Valor de compra</p>
              <p className="text-base font-semibold text-ink">
                {formatCurrency(property.acquisition_value)}
              </p>
            </div>
            <div className="card">
              <p className="kpi-label">Valor atual</p>
              <p className="text-base font-semibold text-ink">
                {formatCurrency(property.current_value)}
              </p>
            </div>
            <div className="card">
              <p className="kpi-label">Diária média</p>
              <p className="text-base font-semibold text-ink">
                {formatCurrency(property.daily_rate)}
              </p>
            </div>
            <div className="card">
              <p className="kpi-label">Ocupação esperada</p>
              <p className="text-base font-semibold text-ink">
                {property.target_occupancy ? `${property.target_occupancy}%` : "—"}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="card">
              <p className="kpi-label">Valor de compra</p>
              <p className="text-base font-semibold text-ink">
                {formatCurrency(property.acquisition_value)}
              </p>
            </div>
            <div className="card">
              <p className="kpi-label">Valor atual</p>
              <p className="text-base font-semibold text-ink">
                {formatCurrency(property.current_value)}
              </p>
            </div>
            <div className="card">
              <p className="kpi-label">
                Aluguel contratual
                {property.lease_due_day ? ` · vence dia ${property.lease_due_day}` : ""}
              </p>
              <p className="text-base font-semibold text-positive">
                {formatCurrency(property.monthly_rent)}/mês
              </p>
            </div>
            <div className="card">
              <p className="kpi-label">
                Renovação
                {property.adjustment_index
                  ? ` · ${ADJUSTMENT_LABELS[property.adjustment_index] || property.adjustment_index}`
                  : ""}
              </p>
              <p className="text-base font-semibold text-ink">
                {property.lease_renewal_date ? formatDate(property.lease_renewal_date) : "—"}
              </p>
            </div>
          </div>
        )}

        {/* ── TRANSAÇÕES ────────────────────────────────── */}
        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="section-title" style={{ marginBottom: 0 }}>
                {isPlanta ? "Despesas e custos" : "Transações"}
              </p>
            </div>
            <div className="flex gap-3">
              {!isPlanta && (
                <Link
                  href={`/dashboard/properties/${params.id}/transactions/new?type=income`}
                  className="px-4 py-2 bg-forest text-white font-bold tracking-wider uppercase text-xs rounded hover:bg-forest-light transition-colors"
                >
                  + Receita
                </Link>
              )}
              <Link
                href={`/dashboard/properties/${params.id}/transactions/new?type=expense`}
                className="px-4 py-2 bg-header text-white font-bold tracking-wider uppercase text-xs rounded hover:opacity-80 transition-opacity"
              >
                + Despesa
              </Link>
            </div>
          </div>

          {allTxs.length === 0 ? (
            <div className="text-center py-10 text-ink-2 text-sm">
              {isPlanta
                ? "Registre as parcelas e custos do imóvel."
                : "Comece lançando uma receita ou despesa."}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {allTxs.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between py-4"
                >
                  <div className="flex items-center gap-5 flex-1 min-w-0">
                    <span className="text-sm text-ink-3 shrink-0 w-16">
                      {formatDateShort(t.transaction_date)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold uppercase tracking-wider text-ink-2">
                        {CATEGORY_LABELS[t.category] || t.category}
                      </p>
                      {t.description && (
                        <p className="text-xs text-ink-3 truncate mt-0.5">
                          {t.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <span
                      className={`font-bold text-sm ${
                        t.transaction_type === "income"
                          ? "text-positive"
                          : "text-negative"
                      }`}
                    >
                      {t.transaction_type === "income" ? "+" : "-"}
                      {formatCurrency(Number(t.amount))}
                    </span>
                    <form action={deleteTransaction}>
                      <input type="hidden" name="id" value={t.id} />
                      <input type="hidden" name="property_id" value={params.id} />
                      <button
                        type="submit"
                        className="text-ink-3 hover:text-negative transition-colors text-lg leading-none"
                      >
                        ×
                      </button>
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
