import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

interface MissingField {
  field: string;
  label: string;
  impact: string;
}

const MODALITY_LABELS: Record<string, string> = {
  annual_lease: "Locação anual", short_stay: "Temporada", under_construction: "Na planta",
};

const REQUIRED_FIELDS: Record<string, MissingField[]> = {
  annual_lease: [
    { field: "monthly_rent", label: "Valor do aluguel", impact: "Yield não calcula, alerta de cobrança não dispara" },
    { field: "lease_due_day", label: "Dia de vencimento", impact: "Alerta de cobrança não dispara" },
    { field: "lease_renewal_date", label: "Data de renovação", impact: "Sem alerta de reajuste" },
    { field: "adjustment_index", label: "Índice de reajuste", impact: "Reajuste não pode ser simulado" },
    { field: "acquisition_value", label: "Valor de compra", impact: "Valorização não calcula" },
    { field: "current_value", label: "Valor atual", impact: "Yield e valorização zerados" },
  ],
  short_stay: [
    { field: "daily_rate", label: "Diária média", impact: "Sem referência de receita" },
    { field: "target_occupancy", label: "Ocupação esperada", impact: "Sem benchmark de performance" },
    { field: "monthly_rent", label: "Receita mensal estimada", impact: "Yield não calcula" },
    { field: "acquisition_value", label: "Valor de compra", impact: "Valorização não calcula" },
    { field: "current_value", label: "Valor atual", impact: "Yield zerado" },
  ],
  under_construction: [
    { field: "total_investment", label: "VGV total", impact: "Progresso de pagamento não calcula" },
    { field: "next_installment_date", label: "Data da próxima parcela", impact: "Sem alerta de parcela" },
    { field: "installment_amount", label: "Valor da parcela", impact: "Alerta sem valor" },
    { field: "delivery_date", label: "Previsão de entrega", impact: "Sem acompanhamento de obra" },
    { field: "acquisition_value", label: "Valor já pago", impact: "Progresso zerado" },
  ],
};

function scoreColor(s: number) { return s >= 90 ? "#16A34A" : s >= 70 ? "#D97706" : s >= 50 ? "#EA580C" : "#DC2626"; }
function scoreEmoji(s: number) { return s >= 90 ? "🟢" : s >= 70 ? "🟡" : s >= 50 ? "🟠" : "🔴"; }
function formatCurrency(v: number) { return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v); }
function daysAgo(d: string | null): string { if (!d) return "Nunca"; const diff = Math.floor((Date.now() - new Date(d).getTime()) / 86400000); return diff === 0 ? "Hoje" : diff === 1 ? "Ontem" : `${diff} dias atrás`; }

type Props = { params: { id: string } };

export default async function AdminClientDetailPage({ params }: Props) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: me } = await supabase.from("user_profiles").select("is_admin").eq("id", user.id).single();
  if (!me?.is_admin) redirect("/dashboard");

  // Dados do cliente
  const { data: client } = await supabase
    .from("user_profiles")
    .select("id, full_name, phone, last_login_at, tax_person_type, tax_has_planning")
    .eq("id", params.id)
    .single();

  if (!client) notFound();

  // Imóveis do cliente
  const { data: properties } = await supabase
    .from("properties")
    .select("*")
    .eq("user_id", params.id);

  const props = properties ?? [];

  // Transações dos últimos 90 dias
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  const { data: recentTxs } = await supabase
    .from("transactions")
    .select("id, property_id, transaction_type, category, amount, transaction_date, description")
    .eq("user_id", params.id)
    .gte("transaction_date", ninetyDaysAgo.toISOString().split("T")[0])
    .order("transaction_date", { ascending: false });

  const txs = recentTxs ?? [];
  const recentTxPropertyIds = new Set(txs.map(t => t.property_id));

  // Open Finance interest
  const { data: ofInterest } = await supabase
    .from("open_finance_interest")
    .select("interested")
    .eq("user_id", params.id)
    .single();

  // Calcular health por propriedade
  const propsWithHealth = props.map(p => {
    const modality = p.modality || "annual_lease";
    const required = REQUIRED_FIELDS[modality] || REQUIRED_FIELDS.annual_lease;
    const missing = required.filter(r => !p[r.field as keyof typeof p]);
    const hasActivity = recentTxPropertyIds.has(p.id);
    const totalChecks = required.length + 1;
    const filledChecks = required.length - missing.length + (hasActivity ? 1 : 0);
    const score = Math.round((filledChecks / totalChecks) * 100);
    return { ...p, modality, healthScore: score, missing, hasActivity };
  });

  const avgScore = propsWithHealth.length > 0
    ? Math.round(propsWithHealth.reduce((a, p) => a + p.healthScore, 0) / propsWithHealth.length)
    : 0;

  const WA_BASE = client.phone
    ? `https://wa.me/55${client.phone.replace(/\D/g, "")}`
    : null;

  return (
    <main className="min-h-screen bg-surface">
      <header style={{ backgroundColor: "#1B3564" }} className="text-white shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="font-display text-xl italic">
              My<span style={{ color: "#6BA68A" }}>Asset</span>
            </Link>
            <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-white/10 text-white/70">Admin</span>
          </div>
          <Link href="/admin" className="text-xs text-white/50 hover:text-white transition-colors uppercase tracking-wider">
            ← Clientes
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">

        {/* ── CABEÇALHO DO CLIENTE ─────────────────────── */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: scoreColor(avgScore) }}>
              {scoreEmoji(avgScore)} Health Score {avgScore}
            </p>
            <h1 className="text-3xl font-bold text-ink">{client.full_name || "Sem nome"}</h1>
            <div className="flex flex-wrap gap-4 mt-2 text-sm text-ink-2">
              {client.phone && <span>📞 {client.phone}</span>}
              <span>🕐 Último login: {daysAgo(client.last_login_at)}</span>
              <span>🏠 {propsWithHealth.length} imóveis</span>
              {client.tax_person_type && <span>📋 {client.tax_person_type === "pf" ? "PF" : "PJ"}</span>}
              {ofInterest && <span>🔗 Open Finance: {ofInterest.interested ? "✓ Interesse" : "Sem interesse"}</span>}
            </div>
          </div>

          {WA_BASE && (
            
              href={`${WA_BASE}?text=${encodeURIComponent(`Olá ${(client.full_name || "").split(" ")[0]}! Queria trocar uma ideia rápida sobre seus imóveis no MyAsset. 😊`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-5 py-3 rounded text-white font-bold text-sm uppercase tracking-wider shrink-0"
              style={{ backgroundColor: "#25D366" }}
            >
              <svg width="16" height="16" viewBox="0 0 32 32" fill="white"><path d="M16 2C8.268 2 2 8.268 2 16c0 2.478.675 4.796 1.851 6.782L2 30l7.438-1.82A13.93 13.93 0 0016 30c7.732 0 14-6.268 14-14S23.732 2 16 2z"/></svg>
              Contatar no WhatsApp
            </a>
          )}
        </div>

        {/* ── IMÓVEIS COM HEALTH SCORE ───────────────────── */}
        <div className="space-y-4">
          <p className="section-title">Imóveis do cliente</p>

          {propsWithHealth.length === 0 ? (
            <div className="card text-center py-10 text-ink-3">Nenhum imóvel cadastrado.</div>
          ) : (
            propsWithHealth.sort((a, b) => a.healthScore - b.healthScore).map(p => (
              <div key={p.id} className="card">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold"
                        style={{
                          backgroundColor: `${scoreColor(p.healthScore)}15`,
                          color: scoreColor(p.healthScore),
                          border: `1px solid ${scoreColor(p.healthScore)}30`,
                        }}
                      >
                        {scoreEmoji(p.healthScore)} {p.healthScore}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: scoreColor(p.healthScore) }}>
                        {MODALITY_LABELS[p.modality]}
                      </span>
                      {!p.hasActivity && (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-red-50 text-red-600 rounded-full border border-red-200">
                          Sem atividade
                        </span>
                      )}
                    </div>
                    <h2 className="text-xl font-bold text-ink">{p.name}</h2>
                    {(p.city || p.state) && <p className="text-sm text-ink-3">{[p.city, p.state].filter(Boolean).join(" · ")}</p>}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-ink-3 uppercase tracking-wider">Valor</p>
                    <p className="text-base font-bold text-ink">{formatCurrency(Number(p.current_value || p.acquisition_value || 0))}</p>
                  </div>
                </div>

                {/* Campos faltantes */}
                {p.missing.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded px-4 py-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-red-700 mb-2">
                      {p.missing.length} {p.missing.length === 1 ? "campo faltando" : "campos faltando"}
                    </p>
                    <div className="space-y-1">
                      {p.missing.map((m: MissingField) => (
                        <div key={m.field} className="flex items-start gap-2">
                          <span className="text-red-400 text-xs mt-0.5">✕</span>
                          <div>
                            <span className="text-sm font-semibold text-red-700">{m.label}</span>
                            <span className="text-xs text-red-600 ml-2">→ {m.impact}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    {WA_BASE && (
                      
                        href={`${WA_BASE}?text=${encodeURIComponent(`Olá! Vi que seu imóvel "${p.name}" no MyAsset está sem ${p.missing[0].label.toLowerCase()}. Sem essa informação, ${p.missing[0].impact.toLowerCase()}. Me manda o dado que eu atualizo pra você! 😊`)}`}
                        target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 mt-3 px-3 py-2 text-xs font-bold uppercase tracking-wider rounded text-white"
                        style={{ backgroundColor: "#25D366" }}
                      >
                        Pedir dado via WhatsApp
                      </a>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* ── TRANSAÇÕES RECENTES ────────────────────────── */}
        {txs.length > 0 && (
          <div className="card">
            <p className="section-title" style={{ marginBottom: 12 }}>
              Últimas transações (90 dias)
            </p>
            <div className="divide-y divide-border">
              {txs.slice(0, 15).map(t => (
                <div key={t.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="text-xs text-ink-3 shrink-0 w-16">
                      {new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "short" }).format(new Date(t.transaction_date))}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold uppercase tracking-wider text-ink-2">{t.category}</p>
                      {t.description && <p className="text-xs text-ink-3 truncate">{t.description}</p>}
                    </div>
                  </div>
                  <span className={`font-bold text-sm ${t.transaction_type === "income" ? "text-positive" : t.category === "investment" ? "text-blue-500" : "text-negative"}`}>
                    {t.transaction_type === "income" ? "+" : "-"}{formatCurrency(Number(t.amount))}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
