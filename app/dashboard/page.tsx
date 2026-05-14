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

  // Yield médio (apenas imóveis com current_value e monthly_rent preenchidos)
  const propsWithYield = props.filter(
    (p) => p.current_value && p.monthly_rent
  );
  const avgYield =
    propsWithYield.length > 0
      ? propsWithYield.reduce(
          (acc, p) => acc + (Number(p.monthly_rent) / Number(p.current_value)) * 12,
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
    .select("transaction_type, amount")
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

        {/* Grid patrimonial */}
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
              {totalAcquisitionValue > 0
                ? formatPercent(appreciation)
                : "—"}
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

        {/* Grid financeiro do mês */}
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

        {/* Portfólio */}
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
              Você ainda não tem imóveis cadastrados. Adicione o primeiro pra
              começar a acompanhar seu patrimônio.
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
