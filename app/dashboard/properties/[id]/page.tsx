import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { deleteTransaction } from "./transactions/actions";

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  residential: "Residencial",
  commercial: "Comercial",
  land: "Terreno",
  mixed: "Misto",
};

const CATEGORY_LABELS: Record<string, string> = {
  rent: "Aluguel",
  iptu: "IPTU",
  condominium: "Condomínio",
  maintenance: "Manutenção",
  insurance: "Seguro",
  other: "Outros",
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

  // Busca imóvel
  const { data: property, error: propertyError } = await supabase
    .from("properties")
    .select("*")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single();

  if (propertyError || !property) {
    notFound();
  }

  // Busca todas as transações do imóvel
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

  // Yield anual (baseado no aluguel esperado / valor atual)
  const yieldAnual =
    property.current_value && property.monthly_rent
      ? (property.monthly_rent / property.current_value) * 12
      : null;

  return (
    <main className="min-h-screen bg-cream">
      {/* Header */}
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
        {/* Identificação do imóvel */}
        <div className="mb-10 flex flex-col md:flex-row md:items-start md:justify-between gap-6">
          <div>
            <p className="text-[10px] tracking-[0.3em] uppercase text-forest/60 mb-2">
              {PROPERTY_TYPE_LABELS[property.property_type] ||
                property.property_type}
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

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-ink/10 mb-4 border border-ink/10">
          <div className="bg-cream p-6">
            <p className="text-[10px] uppercase tracking-wider text-ink/40 mb-2">
              Receitas do mês
            </p>
            <p className="font-display text-2xl text-forest">
              {formatCurrency(monthlyIncome)}
            </p>
          </div>
          <div className="bg-cream p-6">
            <p className="text-[10px] uppercase tracking-wider text-ink/40 mb-2">
              Despesas do mês
            </p>
            <p className="font-display text-2xl text-ink">
              {formatCurrency(monthlyExpense)}
            </p>
          </div>
          <div className="bg-cream p-6">
            <p className="text-[10px] uppercase tracking-wider text-ink/40 mb-2">
              Saldo do mês
            </p>
            <p
              className={`font-display text-2xl ${
                monthlySaldo >= 0 ? "text-forest" : "text-red-700"
              }`}
            >
              {formatCurrency(monthlySaldo)}
            </p>
          </div>
          <div className="bg-cream p-6">
            <p className="text-[10px] uppercase tracking-wider text-ink/40 mb-2">
              Yield anual
            </p>
            <p className="font-display text-2xl text-ink">
              {yieldAnual !== null ? formatPercent(yieldAnual) : "—"}
            </p>
            <p className="text-[9px] text-ink/30 mt-1">
              aluguel esperado / valor atual
            </p>
          </div>
        </div>

        {/* Info patrimonial secundária */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-ink/5 mb-12 border border-ink/5">
          <div className="bg-cream/50 px-6 py-4">
            <p className="text-[9px] uppercase tracking-wider text-ink/30 mb-1">
              Valor de compra
            </p>
            <p className="text-sm text-ink/70">
              {formatCurrency(property.acquisition_value)}
            </p>
          </div>
          <div className="bg-cream/50 px-6 py-4">
            <p className="text-[9px] uppercase tracking-wider text-ink/30 mb-1">
              Valor atual
            </p>
            <p className="text-sm text-ink/70">
              {formatCurrency(property.current_value)}
            </p>
          </div>
          <div className="bg-cream/50 px-6 py-4">
            <p className="text-[9px] uppercase tracking-wider text-ink/30 mb-1">
              Aluguel esperado
            </p>
            <p className="text-sm text-ink/70">
              {formatCurrency(property.monthly_rent)}
            </p>
          </div>
          <div className="bg-cream/50 px-6 py-4">
            <p className="text-[9px] uppercase tracking-wider text-ink/30 mb-1">
              Data de compra
            </p>
            <p className="text-sm text-ink/70">
              {property.acquisition_date
                ? formatDate(property.acquisition_date)
                : "—"}
            </p>
          </div>
        </div>

        {/* Transações */}
        <div>
          <div className="flex items-end justify-between mb-6">
            <div>
              <p className="text-xs tracking-[0.3em] uppercase text-forest/60 mb-2">
                Histórico
              </p>
              <h2 className="font-display text-2xl text-ink">Transações</h2>
            </div>
            <div className="flex gap-3">
              <Link
                href={`/dashboard/properties/${params.id}/transactions/new?type=income`}
                className="px-4 py-2 bg-forest text-cream font-medium tracking-wider uppercase text-xs hover:bg-ink transition-colors"
              >
                + Receita
              </Link>
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
                Comece lançando uma receita ou despesa
              </p>
              <p className="text-sm text-ink/40 max-w-sm mx-auto">
                Registre o aluguel recebido, o IPTU pago, manutenções e outros
                movimentos financeiros deste imóvel.
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
                      {formatDate(t.transaction_date)}
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
                      <input
                        type="hidden"
                        name="property_id"
                        value={params.id}
                      />
                      <button
                        type="submit"
                        className="text-[10px] uppercase tracking-wider text-ink/20 hover:text-red-700 transition-colors"
                        title="Remover transação"
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
