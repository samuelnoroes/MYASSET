import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

type PropertyRow = {
  id: string;
  user_id: string;
  name: string;
  modality: string;
  monthly_rent: number | null;
  current_value: number | null;
  acquisition_value: number | null;
  lease_due_day: number | null;
  lease_renewal_date: string | null;
  adjustment_index: string | null;
  daily_rate: number | null;
  target_occupancy: number | null;
  total_investment: number | null;
  delivery_date: string | null;
  next_installment_date: string | null;
  installment_amount: number | null;
  city: string | null;
  state: string | null;
};

type TransactionRow = {
  property_id: string;
  user_id: string;
  transaction_type: string;
  transaction_date: string;
};

function calcPropertyHealth(p: PropertyRow, recentTxPropertyIds: Set<string>): { score: number; missing: string[] } {
  const missing: string[] = [];
  const checks: { field: string; label: string; ok: boolean }[] = [];

  checks.push({ field: "acquisition_value", label: "Valor de compra", ok: !!p.acquisition_value });
  checks.push({ field: "current_value", label: "Valor atual", ok: !!p.current_value });
  checks.push({ field: "city", label: "Localização", ok: !!(p.city || p.state) });

  if (p.modality === "annual_lease") {
    checks.push({ field: "monthly_rent", label: "Valor do aluguel", ok: !!p.monthly_rent });
    checks.push({ field: "lease_due_day", label: "Dia de vencimento", ok: !!p.lease_due_day });
    checks.push({ field: "lease_renewal_date", label: "Data de renovação", ok: !!p.lease_renewal_date });
    checks.push({ field: "adjustment_index", label: "Índice de reajuste", ok: !!p.adjustment_index });
    checks.push({ field: "activity", label: "Transação nos últimos 60 dias", ok: recentTxPropertyIds.has(p.id) });
  } else if (p.modality === "short_stay") {
    checks.push({ field: "daily_rate", label: "Diária média", ok: !!p.daily_rate });
    checks.push({ field: "target_occupancy", label: "Ocupação esperada", ok: !!p.target_occupancy });
    checks.push({ field: "monthly_rent", label: "Receita mensal estimada", ok: !!p.monthly_rent });
    checks.push({ field: "activity", label: "Reserva nos últimos 90 dias", ok: recentTxPropertyIds.has(p.id) });
  } else if (p.modality === "under_construction") {
    checks.push({ field: "total_investment", label: "VGV total", ok: !!p.total_investment });
    checks.push({ field: "next_installment_date", label: "Data da próxima parcela", ok: !!p.next_installment_date });
    checks.push({ field: "installment_amount", label: "Valor da parcela", ok: !!p.installment_amount });
    checks.push({ field: "delivery_date", label: "Previsão de entrega", ok: !!p.delivery_date });
    checks.push({ field: "activity", label: "Aporte registrado", ok: recentTxPropertyIds.has(p.id) });
  }

  const total = checks.length;
  const filled = checks.filter(c => c.ok).length;
  checks.filter(c => !c.ok).forEach(c => missing.push(c.label));

  return { score: total > 0 ? Math.round((filled / total) * 100) : 0, missing };
}

function scoreColor(score: number): string {
  if (score >= 90) return "#5FBF8A";
  if (score >= 70) return "#D9A05B";
  if (score >= 50) return "#EA580C";
  return "#E0686C";
}

function scoreEmoji(score: number): string {
  if (score >= 90) return "🟢";
  if (score >= 70) return "🟡";
  if (score >= 50) return "🟠";
  return "🔴";
}

function formatCurrency(v: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

function daysAgo(dateStr: string | null): string {
  if (!dateStr) return "Nunca";
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return "Hoje";
  if (diff === 1) return "Ontem";
  return `${diff} dias atrás`;
}

function daysAgoNum(dateStr: string | null): number {
  if (!dateStr) return 999;
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "short", year: "numeric" })
    .format(new Date(y, m - 1, d));
}

export default async function AdminPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: me } = await supabase
    .from("user_profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!me?.is_admin) redirect("/dashboard");

  const { data: allProfiles } = await supabase
    .from("user_profiles")
    .select("id, full_name, phone, last_login_at, is_admin")
    .eq("is_admin", false);

  const profiles = allProfiles ?? [];

  const { data: allProperties } = await supabase
    .from("properties")
    .select("id, user_id, name, modality, monthly_rent, current_value, acquisition_value, lease_due_day, lease_renewal_date, adjustment_index, daily_rate, target_occupancy, total_investment, delivery_date, next_installment_date, installment_amount, city, state");

  const properties = (allProperties ?? []) as PropertyRow[];

  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  const { data: recentTxs } = await supabase
    .from("transactions")
    .select("property_id, user_id, transaction_type, transaction_date")
    .gte("transaction_date", ninetyDaysAgo.toISOString().split("T")[0]);

  const txs = (recentTxs ?? []) as TransactionRow[];
  const recentTxPropertyIds = new Set(txs.map(t => t.property_id));

  // ── COMISSÕES (platform_fees) ───────────────────────────
  const now = new Date();
  const startOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

  const { data: allFees } = await supabase
    .from("platform_fees")
    .select(`
      id, gross_amount, asaas_fee, platform_fee, net_to_owner, created_at,
      user_id,
      rent_charges (
        due_date, payment_method,
        properties ( name )
      )
    `)
    .order("created_at", { ascending: false })
    .limit(50);

  const fees = allFees ?? [];

  const totalPlatformFeeAllTime = fees.reduce((a, f) => a + Number(f.platform_fee), 0);
  const totalPlatformFeeMonth = fees
    .filter(f => f.created_at >= startOfMonth)
    .reduce((a, f) => a + Number(f.platform_fee), 0);
  const totalGrossMonth = fees
    .filter(f => f.created_at >= startOfMonth)
    .reduce((a, f) => a + Number(f.gross_amount), 0);
  const totalTransactions = fees.length;

  // Perfis para lookup de nome
  const profileMap = Object.fromEntries(profiles.map(p => [p.id, p.full_name || "Sem nome"]));

  // ── CLIENTES ────────────────────────────────────────────
  type ClientData = {
    id: string;
    name: string;
    phone: string | null;
    lastLogin: string | null;
    lastLoginDays: number;
    properties: (PropertyRow & { healthScore: number; missing: string[] })[];
    avgScore: number;
    totalValue: number;
    totalProperties: number;
    recentTxCount: number;
    alertsCount: number;
  };

  const clients: ClientData[] = profiles.map(p => {
    const clientProps = properties.filter(pr => pr.user_id === p.id);
    const propsWithHealth = clientProps.map(pr => {
      const { score, missing } = calcPropertyHealth(pr, recentTxPropertyIds);
      return { ...pr, healthScore: score, missing };
    });

    const totalValue = propsWithHealth.reduce((acc, pr) => acc + Number(pr.current_value || pr.acquisition_value || 0), 0);
    let avgScore = 0;
    if (totalValue > 0) {
      avgScore = Math.round(
        propsWithHealth.reduce((acc, pr) => {
          const val = Number(pr.current_value || pr.acquisition_value || 0);
          return acc + pr.healthScore * (val / totalValue);
        }, 0)
      );
    } else if (propsWithHealth.length > 0) {
      avgScore = Math.round(propsWithHealth.reduce((a, pr) => a + pr.healthScore, 0) / propsWithHealth.length);
    }

    const clientTxs = txs.filter(t => t.user_id === p.id);

    return {
      id: p.id,
      name: p.full_name || "Sem nome",
      phone: p.phone,
      lastLogin: p.last_login_at,
      lastLoginDays: daysAgoNum(p.last_login_at),
      properties: propsWithHealth,
      avgScore,
      totalValue,
      totalProperties: clientProps.length,
      recentTxCount: clientTxs.length,
      alertsCount: propsWithHealth.filter(pr => pr.healthScore < 70).length,
    };
  });

  clients.sort((a, b) => a.avgScore - b.avgScore);

  const totalClients = clients.length;
  const totalProps = properties.length;
  const avgHealthScore = totalClients > 0 ? Math.round(clients.reduce((a, c) => a + c.avgScore, 0) / totalClients) : 0;
  const clientsAtRisk = clients.filter(c => c.avgScore < 70).length;
  const clientsInactive = clients.filter(c => c.lastLoginDays > 10).length;
  const totalAUM = clients.reduce((a, c) => a + c.totalValue, 0);

  return (
    <main className="min-h-screen bg-surface">
      <header style={{ backgroundColor: "#141618" }} className="text-white ">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="font-display text-xl italic">
              My<span style={{ color: "#C4A96B" }}>Asset</span>
            </Link>
            <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-card/10 text-white/70">
              Admin
            </span>
          </div>
          <Link href="/dashboard" className="text-xs text-white/50 hover:text-white transition-colors uppercase tracking-wider">
            ← Dashboard
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">

        {/* ── KPIs ADMIN ────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="card">
            <p className="kpi-label">Clientes</p>
            <p className="kpi-value-lg">{totalClients}</p>
          </div>
          <div className="card">
            <p className="kpi-label">Imóveis sob gestão</p>
            <p className="kpi-value-lg">{totalProps}</p>
          </div>
          <div className="card">
            <p className="kpi-label">AUM total</p>
            <p className="kpi-value">{formatCurrency(totalAUM)}</p>
          </div>
          <div className="card">
            <p className="kpi-label">Health Score médio</p>
            <p className="kpi-value" style={{ color: scoreColor(avgHealthScore) }}>
              {scoreEmoji(avgHealthScore)} {avgHealthScore}
            </p>
          </div>
          <div className="card">
            <p className="kpi-label">Em risco</p>
            <p className="kpi-value" style={{ color: clientsAtRisk > 0 ? "#E0686C" : "#5FBF8A" }}>
              {clientsAtRisk}
            </p>
            <p className="text-xs text-ink-3 mt-1">score &lt; 70</p>
          </div>
          <div className="card">
            <p className="kpi-label">Inativos</p>
            <p className="kpi-value" style={{ color: clientsInactive > 0 ? "#D9A05B" : "#5FBF8A" }}>
              {clientsInactive}
            </p>
            <p className="text-xs text-ink-3 mt-1">10+ dias sem login</p>
          </div>
        </div>

        {/* ── COMISSÕES MYASSET ─────────────────────────── */}
        <div className="space-y-4">
          <p className="section-title">Comissões MyAsset — Cobrança de aluguel</p>

          {/* KPIs de comissão */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="card bg-emerald-500/10 border border-emerald-400/30">
              <p className="kpi-label text-emerald-300">Comissão este mês</p>
              <p className="kpi-value text-positive">{formatCurrency(totalPlatformFeeMonth)}</p>
              <p className="text-xs text-emerald-300 mt-1">
                de {formatCurrency(totalGrossMonth)} em aluguéis
              </p>
            </div>
            <div className="card">
              <p className="kpi-label">Comissão total</p>
              <p className="kpi-value text-positive">{formatCurrency(totalPlatformFeeAllTime)}</p>
              <p className="text-xs text-ink-3 mt-1">histórico completo</p>
            </div>
            <div className="card">
              <p className="kpi-label">Transações</p>
              <p className="kpi-value-lg">{totalTransactions}</p>
              <p className="text-xs text-ink-3 mt-1">cobranças processadas</p>
            </div>
            <div className="card">
              <p className="kpi-label">Taxa média</p>
              <p className="kpi-value">5%</p>
              <p className="text-xs text-ink-3 mt-1">por transação</p>
            </div>
          </div>

          {/* Tabela de comissões */}
          {fees.length === 0 ? (
            <div className="card text-center py-10">
              <p className="text-2xl mb-2">🏦</p>
              <p className="text-sm text-ink-3">Nenhuma cobrança de aluguel processada ainda.</p>
              <p className="text-xs text-ink-3 mt-1">As comissões aparecerão aqui quando os inquilinos pagarem.</p>
            </div>
          ) : (
            <div className="card">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      {["Data", "Proprietário", "Imóvel", "Aluguel bruto", "Taxa Asaas", "Comissão MyAsset", "Proprietário recebeu", "Método"].map(h => (
                        <th key={h} className="text-left py-3 px-3 text-xs font-bold uppercase tracking-wider text-ink-3 whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {fees.map((fee: any) => (
                      <tr key={fee.id} className="hover:bg-surface transition-colors">
                        <td className="py-3 px-3 text-ink-3 whitespace-nowrap text-xs">
                          {fee.created_at ? formatDate(fee.created_at.split("T")[0]) : "—"}
                        </td>
                        <td className="py-3 px-3 font-medium text-ink">
                          {profileMap[fee.user_id] || "—"}
                        </td>
                        <td className="py-3 px-3 text-ink-2">
                          {fee.rent_charges?.properties?.name || "—"}
                        </td>
                        <td className="py-3 px-3 font-semibold text-ink">
                          {formatCurrency(Number(fee.gross_amount))}
                        </td>
                        <td className="py-3 px-3 text-negative">
                          -{formatCurrency(Number(fee.asaas_fee))}
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-bold text-positive">
                            +{formatCurrency(Number(fee.platform_fee))}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-ink-2">
                          {formatCurrency(Number(fee.net_to_owner))}
                        </td>
                        <td className="py-3 px-3">
                          <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-400/30">
                            {fee.rent_charges?.payment_method === "PIX" ? "Pix"
                              : fee.rent_charges?.payment_method === "CREDIT_CARD" ? "Cartão"
                              : fee.rent_charges?.payment_method || "—"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-border bg-surface">
                      <td colSpan={3} className="py-3 px-3 text-xs font-bold uppercase tracking-wider text-ink-3">
                        Total ({fees.length} transações)
                      </td>
                      <td className="py-3 px-3 font-bold text-ink">
                        {formatCurrency(fees.reduce((a, f: any) => a + Number(f.gross_amount), 0))}
                      </td>
                      <td className="py-3 px-3 font-bold text-negative">
                        -{formatCurrency(fees.reduce((a, f: any) => a + Number(f.asaas_fee), 0))}
                      </td>
                      <td className="py-3 px-3 font-bold text-positive">
                        +{formatCurrency(fees.reduce((a, f: any) => a + Number(f.platform_fee), 0))}
                      </td>
                      <td colSpan={2} className="py-3 px-3 font-bold text-ink-2">
                        {formatCurrency(fees.reduce((a, f: any) => a + Number(f.net_to_owner), 0))}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* ── ALERTAS ESTRATÉGICOS ───────────────────────── */}
        {(() => {
          const adminAlerts: { icon: string; text: string; color: string; clientId: string; phone: string | null }[] = [];

          clients.forEach(c => {
            if (c.lastLoginDays > 15 && c.alertsCount > 0) {
              adminAlerts.push({
                icon: "🔴", color: "#E0686C",
                text: `${c.name} não acessa há ${c.lastLoginDays} dias e tem ${c.alertsCount} ${c.alertsCount === 1 ? "alerta" : "alertas"} pendentes — risco de churn`,
                clientId: c.id, phone: c.phone,
              });
            }
            c.properties.filter(p => p.healthScore < 50).forEach(p => {
              adminAlerts.push({
                icon: "🟠", color: "#EA580C",
                text: `${p.name} (${c.name}) — score ${p.healthScore}: faltam ${p.missing.slice(0, 3).join(", ")}`,
                clientId: c.id, phone: c.phone,
              });
            });
            if (c.lastLoginDays > 10 && c.lastLoginDays <= 15) {
              adminAlerts.push({
                icon: "🟡", color: "#D9A05B",
                text: `${c.name} está sem acessar há ${c.lastLoginDays} dias`,
                clientId: c.id, phone: c.phone,
              });
            }
          });

          if (adminAlerts.length === 0) return null;

          return (
            <div className="card">
              <p className="section-title" style={{ marginBottom: 12 }}>
                Alertas estratégicos ({adminAlerts.length})
              </p>
              <div className="divide-y divide-border">
                {adminAlerts.slice(0, 10).map((a, i) => (
                  <div key={i} className="flex items-center justify-between py-3 gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="shrink-0">{a.icon}</span>
                      <p className="text-sm text-ink truncate">{a.text}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {a.phone && (
                        <a
                          href={`https://wa.me/55${a.phone.replace(/\D/g, "")}?text=${encodeURIComponent(`Olá ${a.text.split(" ")[0]}! Tudo bem? Vi que você tem algumas pendências no MyAsset — posso te ajudar a resolver em 5 minutos. 😊`)}`}
                          target="_blank" rel="noopener noreferrer"
                          className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded text-white"
                          style={{ backgroundColor: "#25D366" }}
                        >
                          WhatsApp
                        </a>
                      )}
                      <Link
                        href={`/admin/clients/${a.clientId}`}
                        className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded border border-border text-ink hover:border-forest hover:text-forest transition-colors"
                      >
                        Ver →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* ── LISTA DE CLIENTES ─────────────────────────── */}
        <div className="card">
          <p className="section-title" style={{ marginBottom: 12 }}>
            Clientes — ranqueados por urgência
          </p>

          {clients.length === 0 ? (
            <p className="text-sm text-ink-3 text-center py-10">Nenhum cliente cadastrado.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {["Cliente", "Imóveis", "Score", "Último login", "Alertas", "AUM", ""].map(h => (
                      <th key={h} className="text-left py-3 px-3 text-xs font-bold uppercase tracking-wider text-ink-3 whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {clients.map(c => (
                    <tr key={c.id} className="hover:bg-surface transition-colors">
                      <td className="py-3 px-3">
                        <p className="font-semibold text-ink">{c.name}</p>
                        {c.phone && <p className="text-xs text-ink-3 mt-0.5">{c.phone}</p>}
                      </td>
                      <td className="py-3 px-3 text-ink">{c.totalProperties}</td>
                      <td className="py-3 px-3">
                        <span
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold"
                          style={{
                            backgroundColor: `${scoreColor(c.avgScore)}15`,
                            color: scoreColor(c.avgScore),
                            border: `1px solid ${scoreColor(c.avgScore)}30`,
                          }}
                        >
                          {scoreEmoji(c.avgScore)} {c.avgScore}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`text-sm ${c.lastLoginDays > 10 ? "text-negative font-semibold" : c.lastLoginDays > 5 ? "text-amber-300" : "text-ink-2"}`}>
                          {daysAgo(c.lastLogin)}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        {c.alertsCount > 0 ? (
                          <span className="text-xs font-bold text-negative bg-red-500/10 px-2 py-1 rounded-full border border-red-400/30">
                            {c.alertsCount}
                          </span>
                        ) : (
                          <span className="text-xs text-ink-3">0</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-ink font-medium whitespace-nowrap">
                        {formatCurrency(c.totalValue)}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          {c.phone && (
                            <a
                              href={`https://wa.me/55${c.phone.replace(/\D/g, "")}?text=${encodeURIComponent(`Olá ${c.name.split(" ")[0]}! Tudo certo? Queria trocar uma ideia rápida sobre seus imóveis no MyAsset. 😊`)}`}
                              target="_blank" rel="noopener noreferrer"
                              title="WhatsApp"
                              className="w-7 h-7 rounded-full flex items-center justify-center text-white"
                              style={{ backgroundColor: "#25D366" }}
                            >
                              <svg width="14" height="14" viewBox="0 0 32 32" fill="white"><path d="M16 2C8.268 2 2 8.268 2 16c0 2.478.675 4.796 1.851 6.782L2 30l7.438-1.82A13.93 13.93 0 0016 30c7.732 0 14-6.268 14-14S23.732 2 16 2z"/></svg>
                            </a>
                          )}
                          <Link
                            href={`/admin/clients/${c.id}`}
                            className="text-xs text-ink-3 hover:text-forest transition-colors font-bold uppercase tracking-wider"
                          >
                            Ver →
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </main>
  );
}
