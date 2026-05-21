import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { logout } from "./actions";
import { markAsPaid } from "./alertActions";
import PortfolioCharts from "./_components/PortfolioCharts";
import A5Logo from "@/app/components/A5Logo";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatCurrencyShort(value: number): string {
  if (value >= 1_000_000) return `R$ ${(value / 1_000_000).toFixed(1).replace(".", ",")}M`;
  if (value >= 1_000) return `R$ ${Math.round(value / 1_000)}K`;
  return formatCurrency(value);
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
  amount: number;
};

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: properties } = await supabase
    .from("properties").select("*").eq("user_id", user.id);
  const props = properties ?? [];
  const totalProperties = props.length;

  const totalCurrentValue = props.reduce((acc, p) => acc + Number(p.current_value || 0), 0);
  const totalAcquisitionValue = props.reduce((acc, p) => acc + Number(p.acquisition_value || 0), 0);
  const appreciation = totalAcquisitionValue > 0
    ? (totalCurrentValue - totalAcquisitionValue) / totalAcquisitionValue : 0;

  const propsWithYield = props.filter(p => p.current_value && p.monthly_rent && p.modality !== "under_construction");
  const avgYield = propsWithYield.length > 0
    ? propsWithYield.reduce((acc, p) => acc + (Number(p.monthly_rent) / Number(p.current_value)) * 12, 0) / propsWithYield.length
    : null;

  const now = new Date();
  const monthName = new Intl.DateTimeFormat("pt-BR", { month: "long" }).format(now);
  const startOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const endOfMonth = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, "0")}-01`;

  const { data: monthlyTransactions } = await supabase
    .from("transactions").select("transaction_type, amount, property_id, category")
    .eq("user_id", user.id).gte("transaction_date", startOfMonth).lt("transaction_date", endOfMonth);
  const txs = monthlyTransactions ?? [];

  const totalMonthlyIncome = txs.filter(t => t.transaction_type === "income").reduce((acc, t) => acc + Number(t.amount), 0);
  // Despesas operacionais (manutenção, IPTU, condomínio, seguro, etc.)
  const totalMonthlyExpense = txs
    .filter(t => t.transaction_type === "expense" && t.category !== "investment")
    .reduce((acc, t) => acc + Number(t.amount), 0);

  // Aportes de investimento (parcelas de imóveis na planta)
  const totalMonthlyInvestment = txs
    .filter(t => t.transaction_type === "expense" && t.category === "investment")
    .reduce((acc, t) => acc + Number(t.amount), 0);

  // Saldo operacional (não inclui aportes)
  const totalMonthlySaldo = totalMonthlyIncome - totalMonthlyExpense;

  const annualLeaseProps = props.filter(p => p.modality === "annual_lease" && p.monthly_rent);
  const totalExpectedThisMonth = annualLeaseProps.reduce((acc, p) => acc + Number(p.monthly_rent), 0);
  const collectionEfficiency = totalExpectedThisMonth > 0
    ? Math.min(totalMonthlyIncome / totalExpectedThisMonth, 1) : null;

  // Últimos 6 meses
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  const historyStart = `${sixMonthsAgo.getFullYear()}-${String(sixMonthsAgo.getMonth() + 1).padStart(2, "0")}-01`;
  const { data: allTransactions } = await supabase
    .from("transactions").select("transaction_type, amount, transaction_date, category")
    .eq("user_id", user.id).gte("transaction_date", historyStart).order("transaction_date", { ascending: true });

  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(); d.setMonth(d.getMonth() - i);
    months.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: new Intl.DateTimeFormat("pt-BR", { month: "short" }).format(d).replace(".", ""),
    });
  }
  const monthlyData = months.map(({ key, label }) => {
    const mt = allTransactions?.filter(t => t.transaction_date.startsWith(key)) ?? [];
    return {
      month: label.charAt(0).toUpperCase() + label.slice(1),
      receitas: mt.filter(t => t.transaction_type === "income").reduce((acc, t) => acc + Number(t.amount), 0),
      despesas: mt.filter(t => t.transaction_type === "expense" && t.category !== "investment").reduce((acc, t) => acc + Number(t.amount), 0),
    };
  });

  // Donut
  const annualValue = props.filter(p => p.modality === "annual_lease").reduce((acc, p) => acc + Number(p.current_value || 0), 0);
  const shortStayValue = props.filter(p => p.modality === "short_stay").reduce((acc, p) => acc + Number(p.current_value || 0), 0);
  const constructionValue = props.filter(p => p.modality === "under_construction").reduce((acc, p) => acc + Number(p.total_investment || p.acquisition_value || 0), 0);
  const totalForChart = annualValue + shortStayValue + constructionValue || 1;
  const pct = (v: number) => totalForChart > 0 ? `${Math.round((v / totalForChart) * 100)}%` : "0%";
  const modalityData = [
    { name: "Locação anual", value: annualValue, color: "#2D4A3E", percentage: pct(annualValue) },
    { name: "Temporada / Airbnb", value: shortStayValue, color: "#3B82F6", percentage: pct(shortStayValue) },
    { name: "Na planta", value: constructionValue, color: "#F59E0B", percentage: pct(constructionValue) },
  ];

  // Alertas
  const today = now.getDate();
  const alerts: PropertyAlert[] = [];
  for (const p of props) {
    if (p.modality !== "annual_lease" || !p.monthly_rent) continue;
    const dueDay = p.lease_due_day ?? 5;
    const hasIncome = txs.some(t => t.transaction_type === "income" && t.property_id === p.id);
    if (hasIncome) continue;
    const daysUntilDue = dueDay - today;
    const daysOverdue = today - dueDay;
    if (daysUntilDue <= 5 && daysUntilDue > 0) {
      alerts.push({ propertyId: p.id, propertyName: p.name, type: "warning", message: "Efetue a cobrança", detail: `Vence em ${daysUntilDue} ${daysUntilDue === 1 ? "dia" : "dias"} · ${formatCurrency(p.monthly_rent)} esperado`, daysOverdue: 0, amount: p.monthly_rent });
    } else if (daysUntilDue === 0) {
      alerts.push({ propertyId: p.id, propertyName: p.name, type: "danger", message: "Em atraso", detail: `Venceu hoje · ${formatCurrency(p.monthly_rent)} pendente`, daysOverdue: 0, amount: p.monthly_rent });
    } else if (daysOverdue > 0) {
      alerts.push({ propertyId: p.id, propertyName: p.name, type: "danger", message: "Em atraso", detail: `${daysOverdue} ${daysOverdue === 1 ? "dia" : "dias"} em atraso · ${formatCurrency(p.monthly_rent)} pendente`, daysOverdue, amount: p.monthly_rent });
    }
  }
  alerts.sort((a, b) => {
    if (a.type === "danger" && b.type !== "danger") return -1;
    if (a.type !== "danger" && b.type === "danger") return 1;
    return b.daysOverdue - a.daysOverdue;
  });

  // Alertas de parcela (imóveis na planta)
  type InstallmentAlert = {
    propertyId: string;
    propertyName: string;
    alertType: "installment" | "balloon";
    daysUntil: number;
    amount: number | null;
    dateLabel: string;
  };
  const installmentAlerts: InstallmentAlert[] = [];

  for (const p of props) {
    if (p.modality !== "under_construction") continue;

    // Parcela mensal
    if (p.next_installment_date) {
      const due = new Date(p.next_installment_date);
      const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays <= 5) {
        installmentAlerts.push({
          propertyId: p.id,
          propertyName: p.name,
          alertType: "installment",
          daysUntil: diffDays,
          amount: p.installment_amount ? Number(p.installment_amount) : null,
          dateLabel: diffDays < 0 ? `${Math.abs(diffDays)} dias em atraso` : diffDays === 0 ? "vence hoje" : `vence em ${diffDays} ${diffDays === 1 ? "dia" : "dias"}`,
        });
      }
    }

    // Balão
    if (p.balloon_date) {
      const due = new Date(p.balloon_date);
      const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays >= 0 && diffDays <= 30) {
        installmentAlerts.push({
          propertyId: p.id,
          propertyName: p.name,
          alertType: "balloon",
          daysUntil: diffDays,
          amount: p.balloon_amount ? Number(p.balloon_amount) : null,
          dateLabel: diffDays === 0 ? "vence hoje" : `vence em ${diffDays} ${diffDays === 1 ? "dia" : "dias"}`,
        });
      }
    }
  }

  return (
    <main className="min-h-screen bg-surface">
      {/* ── HEADER ───────────────────────────────────────── */}
      <header className="bg-header text-white shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-6">
          <div className="flex items-center gap-4 shrink-0">
            <h1 className="font-display text-xl italic">
              My<span style={{ color: "#6BA68A" }}>Asset</span>
            </h1>
            <div className="w-px h-5 bg-white/20" />
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-gray-500 uppercase tracking-wider">by</span>
              <A5Logo light height={20} />
            </div>
          </div>

          <div className="hidden md:flex items-center gap-6 flex-1 justify-center">
            <div className="text-center">
              <p className="text-[10px] uppercase tracking-widest text-gray-400">Patrimônio</p>
              <p className="text-sm font-bold text-white">{formatCurrencyShort(totalCurrentValue)}</p>
            </div>
            <div className="w-px h-8 bg-gray-600" />
            <div className="text-center">
              <p className="text-[10px] uppercase tracking-widest text-gray-400">Receitas de {monthName}</p>
              <p className="text-sm font-bold text-green-400">{formatCurrency(totalMonthlyIncome)}</p>
            </div>
            <div className="w-px h-8 bg-gray-600" />
            <div className="text-center">
              <p className="text-[10px] uppercase tracking-widest text-gray-400">Yield médio</p>
              <p className="text-sm font-bold text-white">{avgYield !== null ? formatPercent(avgYield) : "—"}</p>
            </div>
            {alerts.length > 0 && (
              <>
                <div className="w-px h-8 bg-gray-600" />
                <div className="text-center">
                  <p className="text-[10px] uppercase tracking-widest text-gray-400">Alertas</p>
                  <p className="text-sm font-bold text-red-400">{alerts.length}</p>
                </div>
              </>
            )}
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <Link href="/dashboard/tax" className="text-xs text-gray-400 hover:text-white transition-colors uppercase tracking-wider">IR</Link>
            <Link href="/dashboard/profile" className="text-xs text-gray-400 hover:text-white transition-colors uppercase tracking-wider">Perfil</Link>
            <form action={logout}>
              <button type="submit" className="text-xs text-gray-400 hover:text-white transition-colors uppercase tracking-wider">Sair</button>
            </form>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b border-border">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-8">
            <span className="py-4 text-sm font-bold text-forest border-b-2 border-forest cursor-default">Posição</span>
            <Link href="/dashboard/properties" className="py-4 text-sm text-ink-2 hover:text-ink transition-colors">Imóveis</Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-6 space-y-5">
        {/* Alertas */}
        {alerts.length > 0 && (
          <div className="space-y-2">
            {alerts.map((alert) => (
              <div key={alert.propertyId} className={`flex items-center justify-between px-5 py-4 rounded-card border ${alert.type === "danger" ? "border-red-200 bg-red-50" : "border-amber-200 bg-amber-50"}`}>
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <span className="text-lg select-none shrink-0">{alert.type === "danger" ? "🔴" : "🟡"}</span>
                  <div className="min-w-0">
                    <p className={`text-xs font-bold uppercase tracking-wider ${alert.type === "danger" ? "text-red-700" : "text-amber-700"}`}>{alert.message}</p>
                    <p className="text-sm text-ink mt-0.5 truncate"><strong>{alert.propertyName}</strong> · {alert.detail}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-4">
                  <form action={markAsPaid}>
                    <input type="hidden" name="property_id" value={alert.propertyId} />
                    <input type="hidden" name="amount" value={alert.amount} />
                    <button type="submit" className="px-4 py-2 bg-forest text-white text-xs font-bold uppercase tracking-wider rounded hover:bg-forest-light transition-colors">Quitado ✓</button>
                  </form>
                  <Link href={`/dashboard/properties/${alert.propertyId}`} className="text-xs text-ink-2 hover:text-forest transition-colors uppercase tracking-wider">Ver →</Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Alertas de parcela e balão */}
        {installmentAlerts.length > 0 && (
          <div className="space-y-2">
            {installmentAlerts.map((alert, i) => (
              <div key={i} className={`flex items-center justify-between px-5 py-4 rounded-card border ${alert.daysUntil < 0 ? "border-red-200 bg-red-50" : alert.alertType === "balloon" ? "border-blue-200 bg-blue-50" : "border-amber-200 bg-amber-50"}`}>
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <span className="text-lg select-none shrink-0">
                    {alert.daysUntil < 0 ? "🔴" : alert.alertType === "balloon" ? "🏗️" : "🟡"}
                  </span>
                  <div className="min-w-0">
                    <p className={`text-xs font-bold uppercase tracking-wider ${alert.daysUntil < 0 ? "text-red-700" : alert.alertType === "balloon" ? "text-blue-700" : "text-amber-700"}`}>
                      {alert.alertType === "balloon" ? "Balão / parcela especial" : "Parcela a pagar"} — {alert.dateLabel}
                    </p>
                    <p className="text-sm text-ink mt-0.5 truncate">
                      <strong>{alert.propertyName}</strong>
                      {alert.amount ? ` · ${formatCurrency(alert.amount)}` : ""}
                    </p>
                  </div>
                </div>
                <a
                  href={`/dashboard/properties/${alert.propertyId}/transactions/new?type=expense`}
                  className="text-xs font-bold uppercase tracking-wider px-3 py-2 rounded transition-colors shrink-0 ml-4 text-white"
                  style={{ backgroundColor: alert.daysUntil < 0 ? "#DC2626" : alert.alertType === "balloon" ? "#3B82F6" : "#2D4A3E" }}
                >
                  Registrar
                </a>
              </div>
            ))}
          </div>
        )}

        <PortfolioCharts modalityData={modalityData} monthlyData={monthlyData} totalCurrentValue={totalCurrentValue} totalProperties={totalProperties} />

        {/* KPIs */}
        {/* KPIs portfólio */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card"><p className="kpi-label">Imóveis</p><p className="kpi-value-lg">{totalProperties}</p></div>
          <div className="card"><p className="kpi-label">Valorização</p><p className={`kpi-value ${appreciation >= 0 ? "text-positive" : "text-negative"}`}>{totalAcquisitionValue > 0 ? formatPercent(appreciation) : "—"}</p></div>
          <div className="card"><p className="kpi-label">Yield médio</p><p className="kpi-value">{avgYield !== null ? formatPercent(avgYield) : "—"}</p><p className="text-xs text-ink-3 mt-1">ao ano</p></div>
          <div className="card">
            <p className="kpi-label">Eficiência</p>
            <p className={`kpi-value ${collectionEfficiency === null ? "text-ink" : collectionEfficiency >= 1 ? "text-positive" : collectionEfficiency >= 0.8 ? "text-warning" : "text-negative"}`}>
              {collectionEfficiency !== null ? formatPercent(collectionEfficiency) : "—"}
            </p>
            {collectionEfficiency !== null && <p className="text-xs text-ink-3 mt-1">recebido / esperado</p>}
          </div>
        </div>

        {/* KPIs do mês */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card"><p className="kpi-label">Receitas — {monthName}</p><p className="kpi-value text-positive">{formatCurrency(totalMonthlyIncome)}</p></div>
          <div className="card"><p className="kpi-label">Despesas — {monthName}</p><p className="kpi-value">{formatCurrency(totalMonthlyExpense)}</p><p className="text-xs text-ink-3 mt-1">operacional</p></div>
          <div className="card"><p className="kpi-label">Aportes — {monthName}</p><p className="kpi-value" style={{ color: "#3B82F6" }}>{formatCurrency(totalMonthlyInvestment)}</p><p className="text-xs text-ink-3 mt-1">parcelas planta</p></div>
          <div className="card"><p className="kpi-label">Saldo — {monthName}</p><p className={`kpi-value ${totalMonthlySaldo >= 0 ? "text-positive" : "text-negative"}`}>{formatCurrency(totalMonthlySaldo)}</p></div>
        </div>

        {/* Portfólio */}
        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <p className="section-title" style={{ marginBottom: 0 }}>Seus imóveis</p>
            <Link href="/dashboard/properties" className="text-xs text-forest font-semibold uppercase tracking-wider hover:text-forest-light transition-colors">Ver todos →</Link>
          </div>
          {totalProperties === 0 ? (
            <div className="text-center py-10">
              <p className="text-ink-2 mb-2">Nenhum imóvel cadastrado ainda.</p>
              <Link href="/dashboard/properties/new" className="inline-block mt-3 px-6 py-3 bg-forest text-white text-xs font-bold uppercase tracking-wider rounded hover:bg-forest-light transition-colors">+ Cadastrar imóvel</Link>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {props.slice(0, 5).map((p) => {
                const modality = p.modality || "annual_lease";
                const isPlanta = modality === "under_construction";
                const isAirbnb = modality === "short_stay";
                const modalityColors: Record<string, string> = { annual_lease: "#2D4A3E", short_stay: "#3B82F6", under_construction: "#F59E0B" };
                const modalityLabels: Record<string, string> = { annual_lease: "Locação anual", short_stay: "Temporada", under_construction: "Na planta" };
                const color = modalityColors[modality] || "#2D4A3E";

                let gaugeValue = 0, gaugeLabel = "";
                if (isPlanta && p.total_investment && p.acquisition_value) {
                  gaugeValue = Math.min((p.acquisition_value / p.total_investment) * 100, 100);
                  gaugeLabel = `${Math.round(gaugeValue)}%`;
                } else if (p.current_value && p.monthly_rent) {
                  const y = (Number(p.monthly_rent) / Number(p.current_value)) * 12 * 100;
                  gaugeValue = Math.min(y * 5, 100);
                  gaugeLabel = `${y.toFixed(1)}%`;
                }

                const radius = 20, circumference = 2 * Math.PI * radius;
                const strokeDashoffset = circumference - (gaugeValue / 100) * circumference;

                return (
                  <div key={p.id} className="flex items-center gap-5 py-4">
                    <div className="shrink-0 relative" style={{ width: 52, height: 52 }}>
                      <svg width="52" height="52" viewBox="0 0 52 52">
                        <circle cx="26" cy="26" r={radius} fill="none" stroke="#E5E7EB" strokeWidth="5" />
                        {gaugeValue > 0 && <circle cx="26" cy="26" r={radius} fill="none" stroke={color} strokeWidth="5" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" transform="rotate(-90 26 26)" />}
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span style={{ fontSize: 9, fontWeight: 700, color, lineHeight: 1 }}>{gaugeLabel || "—"}</span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color }}>{modalityLabels[modality]}</span>
                        {p.available_for_sale && (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full border border-blue-200">Disponível</span>
                        )}
                      </div>
                      <Link href={`/dashboard/properties/${p.id}`} className="text-base font-semibold text-ink hover:text-forest transition-colors truncate block">{p.name}</Link>
                      {(p.city || p.state) && <p className="text-sm text-ink-3">{[p.city, p.state].filter(Boolean).join(" · ")}</p>}
                    </div>
                    <div className="hidden md:block text-right shrink-0">
                      <p className="text-xs text-ink-3 uppercase tracking-wider">{isPlanta ? "Já pago" : "Valor atual"}</p>
                      <p className="text-base font-bold text-ink">{formatCurrencyShort(Number(isPlanta ? p.acquisition_value : p.current_value || 0))}</p>
                    </div>
                    <div className="hidden lg:block text-right shrink-0 ml-6">
                      <p className="text-xs text-ink-3 uppercase tracking-wider">{isPlanta ? "VGV" : isAirbnb ? "Receita est." : "Aluguel"}</p>
                      <p className="text-base font-bold text-positive">{formatCurrencyShort(Number(p.monthly_rent || 0))}</p>
                    </div>
                    <Link href={`/dashboard/properties/${p.id}`} className="shrink-0 ml-4 text-xs text-ink-3 hover:text-forest transition-colors">→</Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer A5 */}
        <div className="flex items-center justify-center gap-3 py-4 opacity-50">
          <span className="text-xs text-ink-3 uppercase tracking-wider">Uma solução</span>
          <A5Logo height={18} />
        </div>
      </div>
    </main>
  );
}
