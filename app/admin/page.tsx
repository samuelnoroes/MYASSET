import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { saveAgencyGoal } from "./actions";

function formatCurrency(v: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(v);
}

function formatCurrencyShort(value: number): string {
  if (value >= 1_000_000) return `R$ ${(value / 1_000_000).toFixed(1).replace(".", ",")}M`;
  if (value >= 1_000) return `R$ ${Math.round(value / 1_000)}K`;
  return formatCurrency(value);
}

function ProgressBar({ pct, color }: { pct: number; color: string }) {
  const clamped = Math.max(0, Math.min(pct, 100));
  return (
    <div className="w-full h-3 rounded-full bg-surface border border-border overflow-hidden">
      <div className="h-full rounded-full transition-all" style={{ width: `${clamped}%`, backgroundColor: color }} />
    </div>
  );
}

export default async function AdminPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: me } = await supabase
    .from("user_profiles")
    .select("agency_id, agency_role, is_admin, full_name")
    .eq("id", user.id)
    .single();

  const isGestor = !!me?.agency_id && me?.agency_role === "gestor";

  // Super-admin da plataforma (sem imobiliária) mantém acesso às ferramentas internas
  if (!isGestor) {
    if (me?.is_admin) {
      return (
        <main className="min-h-screen bg-surface">
          <div className="max-w-2xl mx-auto px-6 py-16 space-y-4">
            <p className="section-title">Admin da plataforma</p>
            <p className="text-sm text-ink-2">
              Este console agora é o painel do gestor de imobiliária. Suas ferramentas internas continuam aqui:
            </p>
            <div className="flex flex-col gap-2">
              <Link href="/admin/whatsapp" className="card text-sm font-semibold text-ink hover:border-forest transition-colors">💬 Conversas WhatsApp dos usuários →</Link>
              <Link href="/dashboard" className="card text-sm font-semibold text-ink hover:border-forest transition-colors">← Voltar ao dashboard</Link>
            </div>
            <p className="text-xs text-ink-3">
              Para testar o console do gestor, crie uma imobiliária no seu Perfil.
            </p>
          </div>
        </main>
      );
    }
    redirect("/dashboard");
  }

  const agencyId = me!.agency_id as string;

  const now = new Date();
  const periodMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const monthLabel = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(now);

  const [{ data: agency }, { data: members }, { data: agencyGoal }] = await Promise.all([
    supabase.from("agencies").select("name, invite_code").eq("id", agencyId).single(),
    supabase
      .from("user_profiles")
      .select("id, full_name, phone, creci, agency_role, last_login_at")
      .eq("agency_id", agencyId)
      .order("full_name"),
    supabase
      .from("agency_goals")
      .select("target_amount")
      .eq("agency_id", agencyId)
      .eq("period_month", periodMonth)
      .maybeSingle(),
  ]);

  const team = members ?? [];
  const memberIds = team.map(m => m.id);

  const [{ data: monthDeals }, { data: monthVisits }, { data: properties }, { data: personalGoals }] = await Promise.all([
    supabase
      .from("deals")
      .select("user_id, deal_type, deal_value, closed_at")
      .in("user_id", memberIds.length > 0 ? memberIds : ["00000000-0000-0000-0000-000000000000"])
      .gte("closed_at", periodMonth),
    supabase
      .from("property_visits")
      .select("user_id, status, scheduled_at")
      .in("user_id", memberIds.length > 0 ? memberIds : ["00000000-0000-0000-0000-000000000000"])
      .gte("scheduled_at", periodMonth),
    supabase
      .from("properties")
      .select("user_id, listing_status, listing_purpose, current_value, acquisition_value, is_active")
      .in("user_id", memberIds.length > 0 ? memberIds : ["00000000-0000-0000-0000-000000000000"])
      .eq("is_active", true),
    supabase
      .from("broker_goals")
      .select("user_id, personal_target")
      .in("user_id", memberIds.length > 0 ? memberIds : ["00000000-0000-0000-0000-000000000000"])
      .eq("period_month", periodMonth),
  ]);

  const deals = monthDeals ?? [];
  const visits = monthVisits ?? [];
  const props = properties ?? [];
  const goalsByUser = new Map((personalGoals ?? []).map(g => [g.user_id, g.personal_target ? Number(g.personal_target) : null]));

  const agencyVgvSold = deals.filter(d => d.deal_type === "sale").reduce((acc, d) => acc + Number(d.deal_value), 0);
  const agencyDealsCount = deals.length;
  const agencyTarget = agencyGoal?.target_amount ? Number(agencyGoal.target_amount) : null;
  const agencyPct = agencyTarget ? (agencyVgvSold / agencyTarget) * 100 : null;

  const openProps = props.filter(p => p.listing_status !== "closed");
  const availableCount = props.filter(p => p.listing_status === "available").length;
  const reservedCount = props.filter(p => p.listing_status === "reserved").length;
  const closedCount = props.filter(p => p.listing_status === "closed").length;
  const portfolioVgv = openProps.reduce((acc, p) => acc + Number(p.current_value || p.acquisition_value || 0), 0);

  const brokerRows = team.map(m => {
    const myDeals = deals.filter(d => d.user_id === m.id);
    const vgv = myDeals.filter(d => d.deal_type === "sale").reduce((acc, d) => acc + Number(d.deal_value), 0);
    const visitsDone = visits.filter(v => v.user_id === m.id && v.status === "done").length;
    const target = goalsByUser.get(m.id) ?? null;
    return {
      ...m,
      vgv,
      fechados: myDeals.length,
      visitsDone,
      target,
      pct: target ? (vgv / target) * 100 : null,
      share: agencyVgvSold > 0 ? (vgv / agencyVgvSold) * 100 : 0,
    };
  }).sort((a, b) => b.vgv - a.vgv);

  return (
    <main className="min-h-screen bg-surface">
      <header className="bg-header text-white">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="font-display text-xl italic">
            My<span style={{ color: "#C4A96B" }}>Asset</span>
          </Link>
          <Link href="/dashboard" className="text-xs text-gray-400 hover:text-white transition-colors uppercase tracking-wider">
            ← Dashboard
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Cabeçalho */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-forest mb-2">Console do gestor</p>
            <h1 className="text-3xl font-bold text-ink">{agency?.name}</h1>
            <p className="text-sm text-ink-2 mt-1 capitalize">{monthLabel} · {team.length} {team.length === 1 ? "membro" : "membros"}</p>
          </div>
          <div className="bg-card border border-border rounded px-5 py-3 text-right">
            <p className="text-[10px] font-bold uppercase tracking-wider text-ink-3">Código de convite</p>
            <p className="font-mono text-xl font-bold text-forest tracking-[0.3em]">{agency?.invite_code}</p>
          </div>
        </div>

        {/* ── META GERAL ─────────────────────────────── */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <p className="section-title" style={{ marginBottom: 0 }}>Meta geral da imobiliária</p>
            <span className="text-xs text-ink-3 uppercase tracking-wider">VGV de venda · consolidado do time</span>
          </div>

          {agencyTarget ? (
            <>
              <div className="flex items-baseline justify-between mb-3">
                <p className="text-3xl font-bold text-ink">{formatCurrency(agencyVgvSold)}</p>
                <p className="text-sm text-ink-2">de <strong className="text-ink">{formatCurrency(agencyTarget)}</strong></p>
              </div>
              <ProgressBar pct={agencyPct ?? 0} color={agencyPct !== null && agencyPct >= 100 ? "#5FBF8A" : "#3B82F6"} />
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-ink-3">{agencyDealsCount} {agencyDealsCount === 1 ? "negócio fechado" : "negócios fechados"} pelo time no mês</p>
                <p className={`text-sm font-bold ${agencyPct !== null && agencyPct >= 100 ? "text-positive" : "text-ink"}`}>
                  {(agencyPct ?? 0).toFixed(0)}%{agencyPct !== null && agencyPct >= 100 && " 🎉"}
                </p>
              </div>
            </>
          ) : (
            <p className="text-sm text-ink-2 mb-2">
              Defina a meta do mês — o progresso soma automaticamente as vendas de todos os corretores da equipe.
            </p>
          )}

          <form action={saveAgencyGoal} className="flex flex-col sm:flex-row gap-3 mt-5">
            <input type="hidden" name="period_month" value={periodMonth} />
            <input
              name="target_amount"
              type="text"
              inputMode="numeric"
              defaultValue={agencyTarget ? String(agencyTarget) : ""}
              placeholder="Meta de VGV do mês — ex.: 10.000.000"
              className="flex-1 px-4 py-3 bg-surface border border-border rounded focus:border-forest focus:outline-none transition-colors text-ink text-sm"
            />
            <button type="submit" className="px-8 py-3 bg-forest text-white font-bold tracking-wider uppercase text-xs hover:bg-forest-light transition-colors rounded">
              Salvar meta
            </button>
          </form>
        </div>

        {/* ── PORTFÓLIO DA IMOB ──────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card"><p className="kpi-label">Disponíveis</p><p className="kpi-value text-positive">{availableCount}</p></div>
          <div className="card"><p className="kpi-label">Em negociação</p><p className="kpi-value" style={{ color: "#D9A05B" }}>{reservedCount}</p><p className="text-xs text-ink-3 mt-1">reservados</p></div>
          <div className="card"><p className="kpi-label">Fechados</p><p className="kpi-value">{closedCount}</p></div>
          <div className="card"><p className="kpi-label">VGV do portfólio</p><p className="kpi-value">{formatCurrencyShort(portfolioVgv)}</p><p className="text-xs text-ink-3 mt-1">imóveis em aberto</p></div>
        </div>

        {/* ── CORRETORES ─────────────────────────────── */}
        <div className="card p-0 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-forest">Equipe</p>
              <p className="text-sm text-ink-2 mt-0.5">Desempenho do mês por corretor</p>
            </div>
            <p className="text-xs text-ink-3">Novos corretores entram com o código <span className="font-mono font-bold text-forest">{agency?.invite_code}</span></p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface">
                  <th className="text-left py-3 px-6 text-xs font-bold uppercase tracking-wider text-ink-3">Corretor</th>
                  <th className="text-right py-3 px-4 text-xs font-bold uppercase tracking-wider text-ink-3">VGV vendido</th>
                  <th className="text-right py-3 px-4 text-xs font-bold uppercase tracking-wider text-ink-3">Meta</th>
                  <th className="text-right py-3 px-4 text-xs font-bold uppercase tracking-wider text-ink-3">Fechados</th>
                  <th className="text-right py-3 px-4 text-xs font-bold uppercase tracking-wider text-ink-3">Visitas</th>
                  <th className="text-right py-3 px-4 text-xs font-bold uppercase tracking-wider text-ink-3">% do time</th>
                  <th className="py-3 px-4" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {brokerRows.map((b) => (
                  <tr key={b.id} className="hover:bg-surface transition-colors">
                    <td className="py-4 px-6">
                      <p className="font-semibold text-ink">
                        {b.full_name || "Sem nome"}
                        {b.agency_role === "gestor" && (
                          <span className="ml-2 text-[10px] font-bold uppercase tracking-wider text-forest border border-forest/40 bg-forest/10 px-2 py-0.5 rounded-full">Gestor</span>
                        )}
                      </p>
                      <p className="text-xs text-ink-3">{[b.creci, b.phone].filter(Boolean).join(" · ") || "—"}</p>
                    </td>
                    <td className="py-4 px-4 text-right font-bold text-positive">{b.vgv > 0 ? formatCurrencyShort(b.vgv) : "—"}</td>
                    <td className="py-4 px-4 text-right">
                      {b.target ? (
                        <span className={`font-semibold ${b.pct !== null && b.pct >= 100 ? "text-positive" : "text-ink"}`}>
                          {(b.pct ?? 0).toFixed(0)}%
                          <span className="text-xs text-ink-3 font-normal"> de {formatCurrencyShort(b.target)}</span>
                        </span>
                      ) : (
                        <span className="text-ink-3">sem meta</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-right text-ink">{b.fechados}</td>
                    <td className="py-4 px-4 text-right text-ink">{b.visitsDone}</td>
                    <td className="py-4 px-4 text-right text-ink-2">{b.share.toFixed(0)}%</td>
                    <td className="py-4 px-4 text-right">
                      <Link
                        href={`/admin/brokers/${b.id}`}
                        className="text-xs text-forest font-semibold uppercase tracking-wider hover:text-forest-light transition-colors"
                      >
                        Editar →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <p className="text-xs text-ink-3">
          Cada corretor vê o portfólio inteiro da imobiliária, mas só edita os imóveis que captou — você, como gestor, edita tudo.
        </p>
      </div>
    </main>
  );
}
