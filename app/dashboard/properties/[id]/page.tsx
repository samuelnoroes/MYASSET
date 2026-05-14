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

function formatCurrency(value: number | null): string {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return new Intl.DateTimeFormat("pt-BR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatDateShort(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return new Intl.DateTimeFormat("pt-BR", {
    day: "numeric",
    month: "short",
  }).format(date);
}

function formatPercent(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "percent",
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value);
}

type PropertyDetailPageProps = {
  params: { id: string };
};

export default async function PropertyDetailPage({
  params,
}: PropertyDetailPageProps) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: property, error: propertyError } = await supabase
    .from("properties")
    .select("*")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single();

  if (propertyError || !property) {
    notFound();
  }

  const { data: transactions } = await supabase
    .from("transactions")
    .select("*")
    .eq("property_id", params.id)
    .eq("user_id", user.id)
    .order("transaction_date", { ascending: false });

  const allTransactions = transactions ?? [];

  // KPIs do mês corrente
  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(
    now.getMonth() + 1
  ).padStart(2, "0")}`;

  const monthlyTransactions = allTransactions.filter((t) =>
    t.transaction_date.startsWith(currentMonthStr)
  );

  const monthlyIncome = monthlyTransactions
    .filter((t) => t.transaction_type === "income")
    .reduce((acc, t) => acc + Number(t.amount), 0);

  const monthlyExpense = monthlyTransactions
    .filter((t) => t.transaction_type === "expense")
    .reduce((acc, t) => acc + Number(t.amount), 0);

  const monthlySaldo = monthlyIncome - monthlyExpense;

  const modality = property.modality || "annual_lease";
  const isAnnual = modality === "annual_lease";
  const isShortStay = modality === "short_stay";
  const isPlanta = modality === "under_construction";

  // Cálculos específicos por modalidade
  const yieldAnual =
    property.current_value && property.monthly_rent
      ? (property.monthly_rent / property.current_value) * 12
      : null;

  const progressPago =
    property.total_investment && property.acquisition_value
      ? property.acquisition_value / property.total_investment
      : null;

  const yieldProjetado =
    isPlanta && property.total_investment && property.monthly_rent
      ? (property.monthly_rent / property.total_investment) * 12
      : null;

  const receita30Estimada =
    isShortStay && property.daily_rate && property.target_occupancy
      ? (property.daily_rate *
          30 *
          (property.target_occupancy / 100))
      : null;

  return (
    <main className="min-h-screen bg-cream">
      <header className="border-b border-ink/10">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <Link href="/dashboard" className="font-display text-2xl text-ink">
            My<span className="italic text-forest">Asset</span>
          </Link>
          <Link
            href="/dashboard/properties"
            className="text-xs uppercase tracking-wider text-ink/60 hover:text-forest transition-colors"
          >
            ← Portfólio
          </Link>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Identificação */}
        <div className="mb-10 flex flex-col md:flex-row md:items-start md:justify-between gap-6">
          <div>
            <p className="text-[10px] tracking-[0.3em] uppercase mb-2"
              style={{
                color: isPlanta ? "#d97706" : isShortStay ? "#2563eb" : "#2D4A3E",
                opacity: 0.7,
              }}>
              {MODALITY_LABELS[modality] || modality}
            </p>
            <h1 className="font-display text-4xl md:text-5xl text-ink leading-tight mb-2">
              {property.name}
            </h1>
            <p className="text-sm text-ink/40 font-mono mb-2">
              @{property.nickname}
            </p>
            {(property.city || property.state) && (
              <p className="text-sm text-ink/60">
                {[property.address, property.city, property.state]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            )}
          </div>
          <Link
            href={`/dashboard/properties/${params.id}/edit`}
            className="self-start text-xs uppercase tracking-wider text-ink/40 hover:text-forest transition-colors whitespace-nowrap"
          >
            Editar imóvel
          </Link>
        </div>

        {/* ── KPIs — PLANTA ─────────────────────────────── */}
        {isPlanta && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-ink/10 mb-4 border border-ink/10">
              <div className="bg-cream p-6">
                <p className="text-[10px] uppercase tracking-wider text-ink/40 mb-2">Já pago</p>
                <p className="font-display text-2xl text-ink">
                  {formatCurrency(property.acquisition_value)}
                </p>
              </div>
              <div className="bg-cream p-6">
                <p className="text-[10px] uppercase tracking-wider text-ink/40 mb-2">VGV total</p>
                <p className="font-display text-2xl text-ink">
                  {formatCurrency(property.total_investment)}
                </p>
              </div>
              <div className="bg-cream p-6">
                <p className="text-[10px] uppercase tracking-wider text-ink/40 mb-2">% Pago</p>
                <p className="font-display text-2xl text-forest">
                  {progressPago !== null ? formatPercent(progressPago) : "—"}
                </p>
              </div>
              <div className="bg-cream p-6">
                <p className="text-[10px] uppercase tracking-wider text-ink/40 mb-2">Yield projetado</p>
                <p className="font-display text-2xl text-ink">
                  {yieldProjetado !== null ? formatPercent(yieldProjetado) : "—"}
                </p>
                <p className="text-[9px] text-ink/30 mt-1">ao ano, após entrega</p>
              </div>
            </div>

            {/* Info planta */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-px bg-ink/5 mb-12 border border-ink/5">
              <div className="bg-cream/50 px-6 py-4">
                <p className="text-[9px] uppercase tracking-wider text-ink/30 mb-1">Previsão de entrega</p>
                <p className="text-sm text-ink/70">
                  {property.delivery_date ? formatDate(property.delivery_date) : "—"}
                </p>
              </div>
              <div className="bg-cream/50 px-6 py-4">
                <p className="text-[9px] uppercase tracking-wider text-ink/30 mb-1">Assinatura</p>
                <p className="text-sm text-ink/70">
                  {property.acquisition_date ? formatDate(property.acquisition_date) : "—"}
                </p>
              </div>
              <div className="bg-cream/50 px-6 py-4">
                <p className="text-[9px] uppercase tracking-wider text-ink/30 mb-1">Aluguel projetado</p>
                <p className="text-sm text-ink/70">
                  {formatCurrency(property.monthly_rent)}/mês
                </p>
              </div>
            </div>
          </>
        )}

        {/* ── KPIs — TEMPORADA ──────────────────────────── */}
        {isShortStay && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-ink/10 mb-4 border border-ink/10">
              <div className="bg-cream p-6">
                <p className="text-[10px] uppercase tracking-wider text-ink/40 mb-2">Receitas do mês</p>
                <p className="font-display text-2xl text-forest">
                  {formatCurrency(monthlyIncome)}
                </p>
              </div>
              <div className="bg-cream p-6">
                <p className="text-[10px] uppercase tracking-wider text-ink/40 mb-2">Despesas do mês</p>
                <p className="font-display text-2xl text-ink">
                  {formatCurrency(monthlyExpense)}
                </p>
              </div>
              <div className="bg-cream p-6">
                <p className="text-[10px] uppercase tracking-wider text-ink/40 mb-2">Saldo do mês</p>
                <p className={`font-display text-2xl ${monthlySaldo >= 0 ? "text-forest" : "text-red-700"}`}>
                  {formatCurrency(monthlySaldo)}
                </p>
              </div>
              <div className="bg-cream p-6">
                <p className="text-[10px] uppercase tracking-wider text-ink/40 mb-2">Yield anual</p>
                <p className="font-display text-2xl text-ink">
                  {yieldAnual !== null ? formatPercent(yieldAnual) : "—"}
                </p>
                <p className="text-[9px] text-ink/30 mt-1">estimativa / valor atual</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-ink/5 mb-12 border border-ink/5">
              <div className="bg-cream/50 px-6 py-4">
                <p className="text-[9px] uppercase tracking-wider text-ink/30 mb-1">Diária média</p>
                <p className="text-sm text-ink/70">{formatCurrency(property.daily_rate)}</p>
              </div>
              <div className="bg-cream/50 px-6 py-4">
                <p className="text-[9px] uppercase tracking-wider text-ink/30 mb-1">Ocupação esperada</p>
                <p className="text-sm text-ink/70">
                  {property.target_occupancy ? `${property.target_occupancy}%` : "—"}
                </p>
              </div>
              <div className="bg-cream/50 px-6 py-4">
                <p className="text-[9px] uppercase tracking-wider text-ink/30 mb-1">Receita estimada/mês</p>
                <p className="text-sm text-ink/70">{formatCurrency(receita30Estimada)}</p>
              </div>
              <div className="bg-cream/50 px-6 py-4">
                <p className="text-[9px] uppercase tracking-wider text-ink/30 mb-1">Valor atual</p>
                <p className="text-sm text-ink/70">{formatCurrency(property.current_value)}</p>
              </div>
            </div>
          </>
        )}

        {/* ── KPIs — LOCAÇÃO ANUAL ──────────────────────── */}
        {isAnnual && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-ink/10 mb-4 border border-ink/10">
              <div className="bg-cream p-6">
                <p className="text-[10px] uppercase tracking-wider text-ink/40 mb-2">Receitas do mês</p>
                <p className="font-display text-2xl text-forest">
                  {formatCurrency(monthlyIncome)}
                </p>
              </div>
              <div className="bg-cream p-6">
                <p className="text-[10px] uppercase tracking-wider text-ink/40 mb-2">Despesas do mês</p>
                <p className="font-display text-2xl text-ink">
                  {formatCurrency(monthlyExpense)}
                </p>
              </div>
              <div className="bg-cream p-6">
                <p className="text-[10px] uppercase tracking-wider text-ink/40 mb-2">Saldo do mês</p>
                <p className={`font-display text-2xl ${monthlySaldo >= 0 ? "text-forest" : "text-red-700"}`}>
                  {formatCurrency(monthlySaldo)}
                </p>
              </div>
              <div className="bg-cream p-6">
                <p className="text-[10px] uppercase tracking-wider text-ink/40 mb-2">Yield anual</p>
                <p className="font-display text-2xl text-ink">
                  {yieldAnual !== null ? formatPercent(yieldAnual) : "—"}
                </p>
                <p className="text-[9px] text-ink/30 mt-1">aluguel esperado / valor atual</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-ink/5 mb-12 border border-ink/5">
              <div className="bg-cream/50 px-6 py-4">
                <p className="text-[9px] uppercase tracking-wider text-ink/30 mb-1">Valor de compra</p>
                <p className="text-sm text-ink/70">{formatCurrency(property.acquisition_value)}</p>
              </div>
              <div className="bg-cream/50 px-6 py-4">
                <p className="text-[9px] uppercase tracking-wider text-ink/30 mb-1">Valor atual</p>
                <p className="text-sm text-ink/70">{formatCurrency(property.current_value)}</p>
              </div>
              <div className="bg-cream/50 px-6 py-4">
                <p className="text-[9px] uppercase tracking-wider text-ink/30 mb-1">
                  Aluguel contratual
                  {property.lease_due_day ? ` · vence dia ${property.lease_due_day}` : ""}
                </p>
                <p className="text-sm text-ink/70">{formatCurrency(property.monthly_rent)}/mês</p>
              </div>
              <div className="bg-cream/50 px-6 py-4">
                <p className="text-[9px] uppercase tracking-wider text-ink/30 mb-1">
                  Renovação · {property.adjustment_index ? ADJUSTMENT_LABELS[property.adjustment_index] || property.adjustment_index : "sem índice"}
                </p>
                <p className="text-sm text-ink/70">
                  {property.lease_renewal_date ? formatDate(property.lease_renewal_date) : "—"}
                </p>
              </div>
            </div>
          </>
        )}

        {/* ── TRANSAÇÕES ────────────────────────────────── */}
        <div>
          <div className="flex items-end justify-between mb-6">
            <div>
              <p className="text-xs tracking-[0.3em] uppercase text-forest/60 mb-2">
                Histórico
              </p>
              <h2 className="font-display text-2xl text-ink">
                {isPlanta ? "Despesas e custos" : "Transações"}
              </h2>
            </div>
            <div className="flex gap-3">
              {!isPlanta && (
                <Link
                  href={`/dashboard/properties/${params.id}/transactions/new?type=income`}
                  className="px-4 py-2 bg-forest text-cream font-medium tracking-wider uppercase text-xs hover:bg-ink transition-colors"
                >
                  + Receita
                </Link>
              )}
              <Link
                href={`/dashboard/properties/${params.id}/transactions/new?type=expense`}
                className="px-4 py-2 bg-ink text-cream font-medium tracking-wider uppercase text-xs hover:bg-forest transition-colors"
              >
                + Despesa
              </Link>
            </div>
          </div>

          {allTransactions.length === 0 ? (
            <div className="border border-dashed border-ink/15 p-10 text-center">
              <p className="text-xs tracking-[0.3em] uppercase text-ink/40 mb-3">
                Nenhuma transação
              </p>
              <p className="font-display text-xl text-ink/60 mb-2">
                {isPlanta
                  ? "Registre as parcelas e custos do imóvel"
                  : "Comece lançando uma receita ou despesa"}
              </p>
            </div>
          ) : (
            <div className="border border-ink/10 divide-y divide-ink/5">
              {allTransactions.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between px-5 py-4 bg-white hover:bg-cream/50 transition-colors"
                >
                  <div className="flex items-center gap-5 flex-1 min-w-0">
                    <span className="text-xs text-ink/40 shrink-0 w-14">
                      {formatDateShort(t.transaction_date)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs uppercase tracking-wider text-ink/60">
                        {CATEGORY_LABELS[t.category] || t.category}
                      </p>
                      {t.description && (
                        <p className="text-[11px] text-ink/40 truncate mt-0.5">
                          {t.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <span
                      className={`font-medium text-sm ${
                        t.transaction_type === "income"
                          ? "text-forest"
                          : "text-red-700"
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
                        className="text-[10px] uppercase tracking-wider text-ink/20 hover:text-red-700 transition-colors"
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
