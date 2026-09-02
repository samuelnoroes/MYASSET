import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { saveGoals } from "./actions";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);
}

function ProgressBar({ pct, color }: { pct: number; color: string }) {
  const clamped = Math.max(0, Math.min(pct, 100));
  return (
    <div className="w-full h-3 rounded-full bg-surface border border-border overflow-hidden">
      <div
        className="h-full rounded-full transition-all"
        style={{ width: `${clamped}%`, backgroundColor: color }}
      />
    </div>
  );
}

export default async function GoalsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const now = new Date();
  const periodMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const monthLabel = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(now);

  const [{ data: goal }, { data: profile }] = await Promise.all([
    supabase
      .from("broker_goals")
      .select("agency_target, personal_target")
      .eq("user_id", user.id)
      .eq("period_month", periodMonth)
      .maybeSingle(),
    supabase
      .from("user_profiles")
      .select("agency_name, agency_id, agency_role")
      .eq("id", user.id)
      .single(),
  ]);
  const agencyName = profile?.agency_name || null;
  const hasAgency = !!profile?.agency_id;
  const isGestor = profile?.agency_role === "gestor";

  // Meta geral definida pelo gestor + vendas consolidadas do time (via RLS)
  let agencyGoalTarget: number | null = null;
  let teamVgvSold = 0;
  let teamSalesCount = 0;
  if (hasAgency) {
    const [{ data: agencyGoal }, { data: teamDeals }] = await Promise.all([
      supabase
        .from("agency_goals")
        .select("target_amount")
        .eq("agency_id", profile!.agency_id)
        .eq("period_month", periodMonth)
        .maybeSingle(),
      supabase
        .from("deals")
        .select("user_id, deal_type, deal_value")
        .gte("closed_at", periodMonth),
    ]);
    agencyGoalTarget = agencyGoal?.target_amount ? Number(agencyGoal.target_amount) : null;
    const teamSales = (teamDeals ?? []).filter(d => d.deal_type === "sale");
    teamVgvSold = teamSales.reduce((acc, d) => acc + Number(d.deal_value), 0);
    teamSalesCount = teamSales.length;
  }

  const { data: monthDeals } = await supabase
    .from("deals")
    .select("id, deal_type, deal_value, closed_at, notes, properties(name)")
    .eq("user_id", user.id)
    .gte("closed_at", periodMonth)
    .order("closed_at", { ascending: false });
  const deals = monthDeals ?? [];

  const sales = deals.filter(d => d.deal_type === "sale");
  const vgvSold = sales.reduce((acc, d) => acc + Number(d.deal_value), 0);

  const personalTarget = goal?.personal_target ? Number(goal.personal_target) : null;
  // Na imobiliária, a meta geral vem do gestor e o realizado é do time inteiro;
  // corretor solo continua informando a referência manualmente.
  const agencyTarget = hasAgency
    ? agencyGoalTarget
    : goal?.agency_target ? Number(goal.agency_target) : null;
  const agencyRealized = hasAgency ? teamVgvSold : vgvSold;

  const personalPct = personalTarget ? (vgvSold / personalTarget) * 100 : null;
  const agencyPct = agencyTarget ? (agencyRealized / agencyTarget) * 100 : null;
  const myShareOfTeam = hasAgency && teamVgvSold > 0 ? (vgvSold / teamVgvSold) * 100 : null;

  return (
    <main className="min-h-screen bg-surface">
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-ink">Metas</h1>
            <p className="text-sm text-ink-2 mt-1 capitalize">{monthLabel}</p>
          </div>
          <Link
            href="/dashboard/deals/new"
            className="px-4 py-2 bg-forest text-white text-xs font-bold uppercase tracking-wider rounded hover:bg-forest-light transition-colors shrink-0"
          >
            + Registrar fechamento
          </Link>
        </div>

        {/* ── Minha meta ─────────────────────────────── */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <p className="section-title" style={{ marginBottom: 0 }}>Minha meta do mês</p>
            <span className="text-xs text-ink-3 uppercase tracking-wider">VGV de venda</span>
          </div>

          {personalTarget ? (
            <>
              <div className="flex items-baseline justify-between mb-3">
                <p className="text-3xl font-bold text-ink">{formatCurrency(vgvSold)}</p>
                <p className="text-sm text-ink-2">
                  de <strong className="text-ink">{formatCurrency(personalTarget)}</strong>
                </p>
              </div>
              <ProgressBar pct={personalPct ?? 0} color={personalPct !== null && personalPct >= 100 ? "#5FBF8A" : "#C4A96B"} />
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-ink-3">
                  {sales.length} {sales.length === 1 ? "venda fechada" : "vendas fechadas"} no mês
                </p>
                <p className={`text-sm font-bold ${personalPct !== null && personalPct >= 100 ? "text-positive" : "text-ink"}`}>
                  {(personalPct ?? 0).toFixed(0)}%
                  {personalPct !== null && personalPct >= 100 && " 🎉"}
                </p>
              </div>
            </>
          ) : (
            <p className="text-sm text-ink-2">
              Defina sua meta pessoal de VGV abaixo para acompanhar seu progresso aqui.
            </p>
          )}
        </div>

        {/* ── Meta geral da imobiliária ──────────────── */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <p className="section-title" style={{ marginBottom: 0 }}>
              Meta geral · {agencyName || "sua imobiliária"}
            </p>
            <span className="text-xs text-ink-3 uppercase tracking-wider">Sua posição</span>
          </div>

          {agencyTarget ? (
            <>
              <div className="flex items-baseline justify-between mb-3">
                <p className="text-2xl font-bold text-ink">{formatCurrency(agencyRealized)}</p>
                <p className="text-sm text-ink-2">
                  de <strong className="text-ink">{formatCurrency(agencyTarget)}</strong>
                </p>
              </div>
              <ProgressBar pct={agencyPct ?? 0} color="#3B82F6" />
              {hasAgency ? (
                <p className="text-xs text-ink-3 mt-2">
                  {teamSalesCount} {teamSalesCount === 1 ? "venda" : "vendas"} do time no mês ·
                  meta definida pelo gestor · você contribuiu com{" "}
                  <strong className="text-ink">{formatCurrency(vgvSold)}</strong>
                  {myShareOfTeam !== null && <> ({myShareOfTeam.toFixed(0)}% do realizado)</>}
                  {" · "}o time está em <strong className="text-ink">{(agencyPct ?? 0).toFixed(1)}%</strong> da meta.
                </p>
              ) : (
                <p className="text-xs text-ink-3 mt-2">
                  Suas vendas representam <strong className="text-ink">{(agencyPct ?? 0).toFixed(1)}%</strong> da
                  meta geral da sua imobiliária neste mês. Use como lembrete da sua posição no time.
                </p>
              )}
            </>
          ) : hasAgency ? (
            <p className="text-sm text-ink-2">
              O gestor ainda não definiu a meta geral deste mês.
              {isGestor && (
                <> Defina agora no <Link href="/admin" className="text-forest font-semibold hover:text-forest-light transition-colors">console do gestor →</Link></>
              )}
            </p>
          ) : (
            <p className="text-sm text-ink-2">
              Informe a meta geral da sua imobiliária abaixo — ela fica aqui como lembrete
              para você enxergar sua posição em relação ao time.
            </p>
          )}
        </div>

        {/* ── Definir metas ──────────────────────────── */}
        <div className="card">
          <p className="section-title">Definir metas de {monthLabel}</p>
          <form action={saveGoals} className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <input type="hidden" name="period_month" value={periodMonth} />
            <div>
              <label htmlFor="personal_target" className="block text-xs font-semibold uppercase tracking-wider text-ink-2 mb-2">
                Minha meta (VGV de venda)
              </label>
              <input
                id="personal_target"
                name="personal_target"
                type="text"
                inputMode="numeric"
                defaultValue={personalTarget ? String(personalTarget) : ""}
                placeholder="Ex.: 1.500.000"
                className="w-full px-4 py-3 bg-surface border border-border rounded focus:border-forest focus:outline-none transition-colors text-ink text-sm"
              />
            </div>
            {!hasAgency ? (
              <div>
                <label htmlFor="agency_target" className="block text-xs font-semibold uppercase tracking-wider text-ink-2 mb-2">
                  Meta geral da imobiliária
                </label>
                <input
                  id="agency_target"
                  name="agency_target"
                  type="text"
                  inputMode="numeric"
                  defaultValue={agencyTarget ? String(agencyTarget) : ""}
                  placeholder="Ex.: 10.000.000"
                  className="w-full px-4 py-3 bg-surface border border-border rounded focus:border-forest focus:outline-none transition-colors text-ink text-sm"
                />
              </div>
            ) : (
              <div className="flex items-end">
                <p className="text-xs text-ink-3 pb-3">
                  A meta geral é definida pelo gestor da {agencyName || "imobiliária"} e consolida as vendas de todo o time automaticamente.
                </p>
              </div>
            )}
            <div className="sm:col-span-2">
              <button
                type="submit"
                className="w-full sm:w-auto px-8 py-3 bg-forest text-white font-bold tracking-wider uppercase text-sm hover:bg-forest-light transition-colors rounded"
              >
                Salvar metas
              </button>
            </div>
          </form>
        </div>

        {/* ── Fechamentos do mês ─────────────────────── */}
        <div className="card">
          <p className="section-title">Fechamentos de {monthLabel}</p>
          {deals.length === 0 ? (
            <p className="text-sm text-ink-2">
              Nenhum fechamento registrado neste mês ainda.{" "}
              <Link href="/dashboard/deals/new" className="text-forest font-semibold hover:text-forest-light transition-colors">
                Registrar o primeiro →
              </Link>
            </p>
          ) : (
            <div className="divide-y divide-border">
              {deals.map((d) => {
                const propName = (d.properties as unknown as { name: string } | null)?.name;
                return (
                  <div key={d.id} className="flex items-center justify-between py-3 gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-ink truncate">
                        {propName ?? d.notes ?? "Imóvel avulso"}
                      </p>
                      <p className="text-xs text-ink-3">
                        {new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" }).format(new Date(`${d.closed_at}T12:00:00`))}
                        {" · "}
                        {d.deal_type === "sale" ? "Venda" : "Locação"}
                      </p>
                    </div>
                    <p className={`text-sm font-bold shrink-0 ${d.deal_type === "sale" ? "text-positive" : "text-ink"}`}>
                      {formatCurrency(Number(d.deal_value))}
                      {d.deal_type === "rent" && <span className="text-xs font-normal text-ink-3">/mês</span>}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
          <p className="text-xs text-ink-3 mt-4">
            Apenas <strong>vendas</strong> contam para o VGV da meta. Locações aparecem aqui como atividade.
          </p>
        </div>
      </div>
    </main>
  );
}
