import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { logout } from "./actions";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatPercent(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "percent",
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value);
}

type AlertType = "warning" | "danger";

type PropertyAlert = {
  propertyId: string;
  propertyName: string;
  type: AlertType;
  message: string;
  detail: string;
  daysOverdue: number;
};

export default async function DashboardPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Imóveis
  const { data: properties } = await supabase
    .from("properties")
    .select("*")
    .eq("user_id", user.id);

  const props = properties ?? [];
  const totalProperties = props.length;

  // KPIs patrimoniais
  const totalCurrentValue = props.reduce(
    (acc, p) => acc + Number(p.current_value || 0),
    0
  );
  const totalAcquisitionValue = props.reduce(
    (acc, p) => acc + Number(p.acquisition_value || 0),
    0
  );
  const appreciation =
    totalAcquisitionValue > 0
      ? (totalCurrentValue - totalAcquisitionValue) / totalAcquisitionValue
      : 0;

  // Yield médio
  const propsWithYield = props.filter(
    (p) => p.current_value && p.monthly_rent && p.modality !== "under_construction"
  );
  const avgYield =
    propsWithYield.length > 0
      ? propsWithYield.reduce(
          (acc, p) =>
            acc + (Number(p.monthly_rent) / Number(p.current_value)) * 12,
          0
        ) / propsWithYield.length
      : null;

  // Transações do mês corrente
  const now = new Date();
  const monthName = new Intl.DateTimeFormat("pt-BR", {
    month: "long",
  }).format(now);

  const startOfMonth = `${now.getFullYear()}-${String(
    now.getMonth() + 1
  ).padStart(2, "0")}-01`;

  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const endOfMonth = `${nextMonth.getFullYear()}-${String(
    nextMonth.getMonth() + 1
  ).padStart(2, "0")}-01`;

  const { data: monthlyTransactions } = await supabase
    .from("transactions")
    .select("transaction_type, amount, property_id")
    .eq("user_id", user.id)
    .gte("transaction_date", startOfMonth)
    .lt("transaction_date", endOfMonth);

  const txs = monthlyTransactions ?? [];

  const totalMonthlyIncome = txs
    .filter((t) => t.transaction_type === "income")
    .reduce((acc, t) => acc + Number(t.amount), 0);

  const totalMonthlyExpense = txs
    .filter((t) => t.transaction_type === "expense")
    .reduce((acc, t) => acc + Number(t.amount), 0);

  const totalMonthlySaldo = totalMonthlyIncome - totalMonthlyExpense;

  // ── ALERTAS DE COBRANÇA E INADIMPLÊNCIA ─────────────────
  // Só pra imóveis de locação anual com aluguel esperado
  const today = now.getDate(); // dia do mês atual (1-31)

  const alerts: PropertyAlert[] = [];

  for (const p of props) {
    // Só locação anual com aluguel esperado preenchido
    if (p.modality !== "annual_lease" || !p.monthly_rent) continue;

    // Dia de vencimento (padrão 5 se não preenchido)
    const dueDay = p.lease_due_day ?? 5;

    // Verificar se já tem receita lançada este mês pra este imóvel
    const hasIncomeThisMonth = txs.some(
      (t) => t.transaction_type === "income" && t.property_id === p.id
    );

    if (hasIncomeThisMonth) continue; // Aluguel já recebido, sem alerta

    const daysUntilDue = dueDay - today; // negativo = passou do vencimento
    const daysOverdue = today - dueDay;  // positivo = dias em atraso

    if (daysUntilDue <= 5 && daysUntilDue > 0) {
      // Falta 5 dias ou menos pro vencimento → alerta de cobrança
      alerts.push({
        propertyId: p.id,
        propertyName: p.name,
        type: "warning",
        message: `Efetue a cobrança`,
        detail: `Vence em ${daysUntilDue} ${daysUntilDue === 1 ? "dia" : "dias"} · ${formatCurrency(p.monthly_rent)} esperado`,
        daysOverdue: 0,
      });
    } else if (daysUntilDue === 0) {
      // Vence hoje
      alerts.push({
        propertyId: p.id,
        propertyName: p.name,
        type: "danger",
        message: `Em atraso`,
        detail: `Venceu hoje · ${formatCurrency(p.monthly_rent)} pendente`,
        daysOverdue: 0,
      });
    } else if (daysOverdue > 0) {
      // Passou do vencimento
      alerts.push({
        propertyId: p.id,
        propertyName: p.name,
        type: "danger",
        message: `Em atraso`,
        detail: `${daysOverdue} ${daysOverdue === 1 ? "dia" : "dias"} em atraso · ${formatCurrency(p.monthly_rent)} pendente`,
        daysOverdue,
      });
    }
  }

  // Ordena: danger primeiro, depois por dias em atraso
  alerts.sort((a, b) => {
    if (a.type === "danger" && b.type !== "danger") return -1;
    if (a.type !== "danger" && b.type === "danger") return 1;
    return b.daysOverdue - a.daysOverdue;
  });

  return (
    <main className="min-h-screen bg-cream">
      {/* Header */}
      <header className="border-b border-ink/10">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <h1 className="font-display text-2xl text-ink">
            My<span className="italic text-forest">Asset</span>
          </h1>
          <form action={logout}>
            <button
              type="submit"
              className="text-xs uppercase tracking-wider text-ink/60 hover:text-forest transition-colors"
            >
              Sair
            </button>
          </form>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Cabeçalho */}
        <div className="mb-10">
          <p className="text-xs tracking-[0.3em] uppercase text-forest/60 mb-3">
            Visão geral
          </p>
          <h2 className="font-display text-4xl md:text-5xl text-ink mb-2">
            Seu portfólio
          </h2>
          <p className="text-ink/60 text-sm">{user.email}</p>
        </div>

        {/* ── ALERTAS ───────────────────────────────────── */}
        {alerts.length > 0 && (
          <div className="mb-10 space-y-3">
            <p className="text-[10px] uppercase tracking-[0.25em] text-ink/30 mb-3">
              Atenção
            </p>
            {alerts.map((alert) => (
              <Link
                key={alert.propertyId}
                href={`/dashboard/properties/${alert.propertyId}`}
                className={`flex items-center justify-between px-5 py-4 border transition-colors group ${
                  alert.type === "danger"
                    ? "border-red-200 bg-red-50 hover:bg-red-100"
                    : "border-amber-200 bg-amber-50 hover:bg-amber-100"
                }`}
              >
                <div className="flex items-center gap-4">
                  <span className="text-lg select-none">
                    {alert.type === "danger" ? "🔴" : "🟡"}
                  </span>
                  <div>
                    <p
                      className={`text-xs uppercase tracking-wider font-medium ${
                        alert.type === "danger"
                          ? "text-red-700"
                          : "text-amber-700"
                      }`}
                    >
                      {alert.message}
                    </p>
                    <p className="text-sm text-ink/80 mt-0.5">
                      <strong>{alert.propertyName}</strong> · {alert.detail}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] uppercase tracking-wider text-ink/40 group-hover:text-forest transition-colors shrink-0">
                  Ver →
                </span>
              </Link>
            ))}
          </div>
        )}

        {/* ── PATRIMÔNIO ────────────────────────────────── */}
        <p className="text-[10px] uppercase tracking-[0.25em] text-ink/30 mb-2">
          Patrimônio
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-ink/10 mb-2 border border-ink/10">
          <div className="bg-cream p-6">
            <p className="text-[10px] uppercase tracking-wider text-ink/40 mb-2">
              Imóveis
            </p>
            <p className="font-display text-3xl text-ink">{totalProperties}</p>
          </div>
          <div className="bg-cream p-6">
            <p className="text-[10px] uppercase tracking-wider text-ink/40 mb-2">
              Patrimônio
            </p>
            <p className="font-display text-2xl text-ink">
              {formatCurrency(totalCurrentValue)}
            </p>
          </div>
          <div className="bg-cream p-6">
            <p className="text-[10px] uppercase tracking-wider text-ink/40 mb-2">
              Valorização
            </p>
            <p
              className={`font-display text-2xl ${
                appreciation >= 0 ? "text-forest" : "text-red-700"
              }`}
            >
              {totalAcquisitionValue > 0 ? formatPercent(appreciation) : "—"}
            </p>
          </div>
          <div className="bg-cream p-6">
            <p className="text-[10px] uppercase tracking-wider text-ink/40 mb-2">
              Yield médio
            </p>
            <p className="font-display text-2xl text-ink">
              {avgYield !== null ? formatPercent(avgYield) : "—"}
            </p>
            <p className="text-[9px] text-ink/30 mt-1">ao ano</p>
          </div>
        </div>

        {/* ── MÊS CORRENTE ──────────────────────────────── */}
        <p className="text-[10px] uppercase tracking-[0.25em] text-ink/30 mb-2 mt-6">
          {monthName}
        </p>
        <div className="grid grid-cols-3 gap-px bg-ink/10 mb-12 border border-ink/10">
          <div className="bg-cream p-6">
            <p className="text-[10px] uppercase tracking-wider text-ink/40 mb-2">
              Receitas
            </p>
            <p className="font-display text-2xl text-forest">
              {formatCurrency(totalMonthlyIncome)}
            </p>
          </div>
          <div className="bg-cream p-6">
            <p className="text-[10px] uppercase tracking-wider text-ink/40 mb-2">
              Despesas
            </p>
            <p className="font-display text-2xl text-ink">
              {formatCurrency(totalMonthlyExpense)}
            </p>
          </div>
          <div className="bg-cream p-6">
            <p className="text-[10px] uppercase tracking-wider text-ink/40 mb-2">
              Saldo
            </p>
            <p
              className={`font-display text-2xl ${
                totalMonthlySaldo >= 0 ? "text-forest" : "text-red-700"
              }`}
            >
              {formatCurrency(totalMonthlySaldo)}
            </p>
          </div>
        </div>

        {/* ── PORTFÓLIO ─────────────────────────────────── */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-xs tracking-[0.3em] uppercase text-forest/60 mb-2">
              Imóveis
            </p>
            <h3 className="font-display text-2xl text-ink">
              Seu portfólio detalhado
            </h3>
          </div>
          {totalProperties > 0 && (
            <Link
              href="/dashboard/properties"
              className="text-xs uppercase tracking-wider text-forest hover:text-ink transition-colors"
            >
              Ver todos →
            </Link>
          )}
        </div>

        {totalProperties === 0 ? (
          <div className="border border-dashed border-ink/15 p-12 text-center">
            <p className="text-xs tracking-[0.3em] uppercase text-ink/40 mb-3">
              Comece aqui
            </p>
            <p className="font-display text-2xl text-ink/70 mb-3">
              Cadastre seu primeiro imóvel
            </p>
            <p className="text-sm text-ink/50 max-w-md mx-auto mb-6">
              Adicione imóveis de locação anual, temporada ou na planta.
            </p>
            <Link
              href="/dashboard/properties/new"
              className="inline-block px-6 py-3 bg-forest text-cream font-medium tracking-wider uppercase text-xs hover:bg-ink transition-colors"
            >
              + Cadastrar imóvel
            </Link>
          </div>
        ) : (
          <div className="border border-ink/10 p-6 bg-white">
            <p className="text-sm text-ink/70 mb-4">
              Você tem{" "}
              <strong className="text-ink">{totalProperties}</strong>{" "}
              {totalProperties === 1
                ? "imóvel cadastrado"
                : "imóveis cadastrados"}
              . Clique num imóvel pra ver e lançar transações.
            </p>
            <Link
              href="/dashboard/properties"
              className="inline-block px-6 py-3 bg-forest text-cream font-medium tracking-wider uppercase text-xs hover:bg-ink transition-colors"
            >
              Gerenciar portfólio →
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
