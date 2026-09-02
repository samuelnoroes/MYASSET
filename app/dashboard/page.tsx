import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { markVisitDone, cancelVisit } from "./visitActions";
import BrokerCharts from "./_components/BrokerCharts";
import KpiCard from "./_components/KpiCard";
import VisitsPanel, { type VisitAlert } from "./_components/VisitsPanel";
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

// A visita é gravada como o corretor digitou (horário local); formatamos em UTC
// para ecoar exatamente o que foi digitado, sem deslocar fuso.
function visitTime(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(new Date(iso));
}

function visitDate(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    timeZone: "UTC",
  }).format(new Date(iso));
}

// Data de "hoje" no fuso do Brasil (o servidor roda em UTC)
function todayInBrazil(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Fortaleza",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Buscar plano e trial do usuário
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("plan, trial_started_at")
    .eq("id", user.id)
    .single();

  const plan = profile?.plan ?? "trial";
  const trialStarted = profile?.trial_started_at ? new Date(profile.trial_started_at) : null;
  const now = new Date();
  const daysSinceStart = trialStarted
    ? Math.floor((now.getTime() - trialStarted.getTime()) / (1000 * 60 * 60 * 24))
    : 0;
  const daysLeft = Math.max(0, 30 - daysSinceStart);
  const showTrialBanner = plan === "trial" && daysLeft <= 10 && daysLeft > 0;
  const showUrgentBanner = plan === "trial" && daysLeft <= 3 && daysLeft > 0;

  const { data: properties } = await supabase
    .from("properties").select("*").eq("user_id", user.id).eq("is_active", true);
  const props = properties ?? [];
  const totalProperties = props.length;

  const monthName = new Intl.DateTimeFormat("pt-BR", { month: "long" }).format(now);
  const startOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  const historyStart = `${sixMonthsAgo.getFullYear()}-${String(sixMonthsAgo.getMonth() + 1).padStart(2, "0")}-01`;

  // ── Visitas ──────────────────────────────────────────
  const { data: allVisits } = await supabase
    .from("property_visits")
    .select("id, property_id, visitor_name, visitor_phone, scheduled_at, status, properties(name)")
    .eq("user_id", user.id)
    .gte("scheduled_at", historyStart)
    .order("scheduled_at", { ascending: true });
  const visits = allVisits ?? [];

  const todayStr = todayInBrazil();
  const in7days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const in5days = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const scheduled = visits.filter(v => v.status === "scheduled");
  const doneVisits = visits.filter(v => v.status === "done");

  const visitAlerts: VisitAlert[] = scheduled
    .filter(v => String(v.scheduled_at).slice(0, 10) <= in5days)
    .map(v => {
      const dateStr = String(v.scheduled_at).slice(0, 10);
      const isToday = dateStr === todayStr;
      const isPast = dateStr < todayStr;
      const propName = (v.properties as unknown as { name: string } | null)?.name ?? "Imóvel";
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      const dayLabel = isToday
        ? "Hoje"
        : dateStr === tomorrow
        ? "Amanhã"
        : visitDate(String(v.scheduled_at));
      return {
        id: v.id,
        propertyId: v.property_id,
        propertyName: propName,
        visitorName: v.visitor_name,
        visitorPhone: v.visitor_phone,
        dateLabel: `${dayLabel} · ${visitTime(String(v.scheduled_at))}`,
        isToday,
        isPast,
      };
    })
    .sort((a, b) => (a.isPast === b.isPast ? 0 : a.isPast ? -1 : 1));

  const visitsThisWeek = scheduled.filter(v => {
    const d = String(v.scheduled_at).slice(0, 10);
    return d >= todayStr && d <= in7days;
  }).length;
  const visitsDoneThisMonth = doneVisits.filter(v => String(v.scheduled_at).slice(0, 10) >= startOfMonth).length;

  // ── Fechamentos (deals) ──────────────────────────────
  const { data: allDeals } = await supabase
    .from("deals")
    .select("deal_type, deal_value, closed_at")
    .eq("user_id", user.id)
    .gte("closed_at", historyStart);
  const deals = allDeals ?? [];

  const dealsThisMonth = deals.filter(d => String(d.closed_at) >= startOfMonth);
  const salesThisMonth = dealsThisMonth.filter(d => d.deal_type === "sale");
  const rentalsThisMonth = dealsThisMonth.filter(d => d.deal_type === "rent");
  const vgvSoldThisMonth = salesThisMonth.reduce((acc, d) => acc + Number(d.deal_value), 0);

  // ── KPIs da carteira ─────────────────────────────────
  const openProps = props.filter(p => p.listing_status !== "closed");
  const availableProps = props.filter(p => p.listing_status === "available");
  const availableSale = availableProps.filter(p => p.listing_purpose === "sale").length;
  const availableRent = availableProps.filter(p => p.listing_purpose === "rent").length;

  const portfolioValue = openProps.reduce(
    (acc, p) => acc + Number(p.current_value || p.acquisition_value || 0), 0
  );

  const captadosThisMonth = props.filter(p => p.listed_at && String(p.listed_at) >= startOfMonth).length;

  // ── Séries de 6 meses (atividade) ────────────────────
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(); d.setMonth(d.getMonth() - i);
    months.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: new Intl.DateTimeFormat("pt-BR", { month: "short" }).format(d).replace(".", ""),
    });
  }
  const activityData = months.map(({ key, label }) => ({
    month: label.charAt(0).toUpperCase() + label.slice(1),
    visitas: doneVisits.filter(v => String(v.scheduled_at).startsWith(key)).length,
    fechamentos: deals.filter(d => String(d.closed_at).startsWith(key)).length,
  }));

  // ── Donut: carteira por finalidade ───────────────────
  const saleValue = openProps
    .filter(p => p.listing_purpose === "sale")
    .reduce((acc, p) => acc + Number(p.current_value || p.acquisition_value || 0), 0);
  const rentValue = openProps
    .filter(p => p.listing_purpose === "rent")
    .reduce((acc, p) => acc + Number(p.current_value || p.acquisition_value || 0), 0);
  const closedValue = props
    .filter(p => p.listing_status === "closed")
    .reduce((acc, p) => acc + Number(p.current_value || p.acquisition_value || 0), 0);
  const totalForChart = saleValue + rentValue + closedValue || 1;
  const pct = (v: number) => `${Math.round((v / totalForChart) * 100)}%`;
  const segmentData = [
    { name: "Venda", value: saleValue, color: "#C4A96B", percentage: pct(saleValue) },
    { name: "Locação", value: rentValue, color: "#3B82F6", percentage: pct(rentValue) },
    { name: "Fechados", value: closedValue, color: "#5FBF8A", percentage: pct(closedValue) },
  ];

  // Próxima visita agendada por imóvel
  const nextVisitByProperty = new Map<string, string>();
  for (const v of scheduled) {
    const d = String(v.scheduled_at).slice(0, 10);
    if (d < todayStr) continue;
    if (!nextVisitByProperty.has(v.property_id)) {
      nextVisitByProperty.set(v.property_id, String(v.scheduled_at));
    }
  }

  const statusConfig: Record<string, { label: string; cls: string }> = {
    available: { label: "Disponível", cls: "bg-emerald-500/10 text-emerald-300 border-emerald-400/30" },
    reserved:  { label: "Reservado",  cls: "bg-amber-500/10 text-amber-300 border-amber-400/30" },
    closed:    { label: "Fechado",    cls: "bg-white/5 text-ink-3 border-border" },
  };
  const purposeConfig: Record<string, { label: string; color: string }> = {
    sale: { label: "Venda",   color: "#C4A96B" },
    rent: { label: "Locação", color: "#3B82F6" },
  };

  return (
    <main className="min-h-screen bg-surface">

      {/* Tabs */}
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-8">
            <span className="py-4 text-sm font-bold text-forest border-b-2 border-forest cursor-default">Posição</span>
            <Link href="/dashboard/properties" className="py-4 text-sm text-ink-2 hover:text-ink transition-colors">Carteira</Link>
            <Link href="/dashboard/goals" className="py-4 text-sm text-ink-2 hover:text-ink transition-colors">Metas</Link>
          </div>
        </div>
      </div>

      {/* ── BANNER DE TRIAL ───────────────────────────── */}
      {showTrialBanner && (
        <div className={`border-b px-6 py-3 ${showUrgentBanner ? "bg-red-500/10 border-red-400/30" : "bg-amber-500/10 border-amber-400/30"}`}>
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-lg">{showUrgentBanner ? "🔴" : "🟡"}</span>
              <p className={`text-sm font-semibold ${showUrgentBanner ? "text-red-300" : "text-amber-300"}`}>
                {showUrgentBanner
                  ? `Seu trial expira em ${daysLeft} ${daysLeft === 1 ? "dia" : "dias"}! Escolha um plano para não perder o acesso.`
                  : `Seu trial gratuito expira em ${daysLeft} dias. Escolha um plano para continuar usando o MyAsset.`
                }
              </p>
            </div>
            <Link
              href="/dashboard/plans"
              className="shrink-0 px-4 py-2 rounded text-white text-xs font-bold uppercase tracking-wider transition-colors"
              style={{ backgroundColor: showUrgentBanner ? "#E0686C" : "#D9A05B" }}
            >
              Ver planos
            </Link>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-6 space-y-5">

        {/* ═══ AGENDA DE VISITAS ═══════════════════════ */}
        {visitAlerts.length > 0 ? (
          <VisitsPanel visits={visitAlerts} onMarkDone={markVisitDone} onCancel={cancelVisit} />
        ) : (
          <div className="flex items-center justify-between px-5 py-4 rounded-card border border-border bg-card">
            <p className="text-sm text-ink-2">
              🗓️ Nenhuma visita agendada para os próximos dias.
            </p>
            <Link
              href="/dashboard/visits/new"
              className="text-xs text-forest font-semibold uppercase tracking-wider hover:text-forest-light transition-colors shrink-0 ml-4"
            >
              + Agendar visita
            </Link>
          </div>
        )}

        {/* ═══ SEÇÃO 1 — VISÃO GERAL ═══════════════════ */}
        <section id="visao-geral" className="scroll-mt-6 space-y-4">
          <BrokerCharts segmentData={segmentData} activityData={activityData} totalPortfolioValue={portfolioValue} totalProperties={openProps.length} />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KpiCard label="Imóveis na carteira" tooltip="Total de imóveis ativos cadastrados na sua carteira, incluindo reservados e fechados.">
              <p className="kpi-value-lg">{totalProperties}</p>
            </KpiCard>
            <KpiCard label="Disponíveis" tooltip="Imóveis disponíveis para negócio agora. Não conta reservados nem fechados.">
              <p className="kpi-value">{availableProps.length}</p>
              <p className="text-xs text-ink-3 mt-1">{availableSale} venda · {availableRent} locação</p>
            </KpiCard>
            <KpiCard label="Visitas da semana" tooltip="Visitas agendadas para os próximos 7 dias. O subtexto mostra quantas você já realizou neste mês.">
              <p className="kpi-value">{visitsThisWeek}</p>
              <p className="text-xs text-ink-3 mt-1">{visitsDoneThisMonth} realizadas no mês</p>
            </KpiCard>
            <KpiCard label="VGV da carteira" tooltip="Soma do valor dos imóveis em aberto (disponíveis + reservados). É o potencial de negócio que você tem em mãos.">
              <p className="kpi-value">{formatCurrencyShort(portfolioValue)}</p>
            </KpiCard>
          </div>
        </section>

        {/* ═══ SEÇÃO 2 — MÊS ATUAL ═════════════════════ */}
        <section id="mes-atual" className="scroll-mt-6">
          <p className="text-xs font-bold uppercase tracking-widest text-ink-3 mb-3 px-1">
            {monthName.charAt(0).toUpperCase() + monthName.slice(1)} — Mês atual
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KpiCard label="Visitas realizadas" tooltip="Visitas marcadas como realizadas neste mês.">
              <p className="kpi-value">{visitsDoneThisMonth}</p>
            </KpiCard>
            <KpiCard label="Captados" tooltip="Imóveis novos que entraram na sua carteira neste mês.">
              <p className="kpi-value">{captadosThisMonth}</p>
            </KpiCard>
            <KpiCard label="Fechados" tooltip="Negócios concluídos neste mês — vendas e locações registradas.">
              <p className="kpi-value text-positive">{dealsThisMonth.length}</p>
              <p className="text-xs text-ink-3 mt-1">{salesThisMonth.length} venda · {rentalsThisMonth.length} locação</p>
            </KpiCard>
            <KpiCard label="VGV vendido" tooltip="Soma do valor das vendas fechadas neste mês. É o número que conta para a sua meta.">
              <p className="kpi-value text-positive">{formatCurrencyShort(vgvSoldThisMonth)}</p>
              <Link href="/dashboard/goals" className="text-xs text-forest font-semibold uppercase tracking-wider hover:text-forest-light transition-colors mt-1 inline-block">
                Ver metas →
              </Link>
            </KpiCard>
          </div>
        </section>

        {/* ═══ SEÇÃO CARTEIRA ══════════════════════════ */}
        <section id="carteira" className="scroll-mt-6">
          <div className="card">
            <div className="flex items-center justify-between mb-5">
              <p className="section-title" style={{ marginBottom: 0 }}>Sua carteira</p>
              <div className="flex items-center gap-4">
                <Link href="/dashboard/deals/new" className="text-xs text-positive font-semibold uppercase tracking-wider hover:opacity-80 transition-opacity">+ Fechamento</Link>
                <Link href="/dashboard/properties" className="text-xs text-forest font-semibold uppercase tracking-wider hover:text-forest-light transition-colors">Ver todos →</Link>
              </div>
            </div>
            {totalProperties === 0 ? (
              <div className="text-center py-10">
                <p className="text-ink-2 mb-2">Nenhum imóvel na carteira ainda.</p>
                <Link href="/dashboard/properties/new" className="inline-block mt-3 px-6 py-3 bg-forest text-white text-xs font-bold uppercase tracking-wider rounded hover:bg-forest-light transition-colors">+ Cadastrar imóvel</Link>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {props.slice(0, 5).map((p) => {
                  const purpose = purposeConfig[p.listing_purpose === "sale" ? "sale" : "rent"];
                  const status = statusConfig[p.listing_status || "available"] ?? statusConfig.available;
                  const color = purpose.color;

                  // Yield só quando o imóvel tem dados de renda (imóvel de investidor);
                  // sem dados, o gauge fica em branco.
                  let gaugeValue = 0, gaugeLabel = "";
                  if (p.current_value && p.monthly_rent) {
                    const y = (Number(p.monthly_rent) / Number(p.current_value)) * 12 * 100;
                    gaugeValue = Math.min(y * 5, 100);
                    gaugeLabel = `${y.toFixed(1)}%`;
                  }

                  const radius = 20, circumference = 2 * Math.PI * radius;
                  const strokeDashoffset = circumference - (gaugeValue / 100) * circumference;

                  const nextVisit = nextVisitByProperty.get(p.id);
                  const mainValue = p.listing_purpose === "sale"
                    ? Number(p.current_value || p.acquisition_value || 0)
                    : Number(p.monthly_rent || 0);

                  return (
                    <div key={p.id} className="flex items-center gap-5 py-4">
                      <div className="shrink-0 relative" style={{ width: 52, height: 52 }}>
                        <svg width="52" height="52" viewBox="0 0 52 52">
                          <circle cx="26" cy="26" r={radius} fill="none" stroke="#2A2D33" strokeWidth="5" />
                          {gaugeValue > 0 && <circle cx="26" cy="26" r={radius} fill="none" stroke={color} strokeWidth="5" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" transform="rotate(-90 26 26)" />}
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span style={{ fontSize: 9, fontWeight: 700, color, lineHeight: 1 }}>{gaugeLabel || "—"}</span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color }}>{purpose.label}</span>
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${status.cls}`}>{status.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Link href={`/dashboard/properties/${p.id}`} className="text-base font-semibold text-ink hover:text-forest transition-colors truncate">{p.name}</Link>
                        </div>
                        <p className="text-sm text-ink-3">
                          {[p.city, p.state].filter(Boolean).join(" · ")}
                          {nextVisit && (
                            <span className="text-forest"> · 🗓️ visita {visitDate(nextVisit)} {visitTime(nextVisit)}</span>
                          )}
                        </p>
                      </div>
                      <div className="hidden md:block text-right shrink-0">
                        <p className="text-xs text-ink-3 uppercase tracking-wider">{p.listing_purpose === "sale" ? "Valor de venda" : "Aluguel"}</p>
                        <p className="text-base font-bold text-ink">
                          {mainValue > 0 ? `${formatCurrencyShort(mainValue)}${p.listing_purpose === "sale" ? "" : "/mês"}` : "—"}
                        </p>
                      </div>
                      <div className="hidden lg:block text-right shrink-0 ml-6">
                        <p className="text-xs text-ink-3 uppercase tracking-wider">IPTU · Cond.</p>
                        <p className="text-sm font-semibold text-ink-2">
                          {p.iptu_amount ? formatCurrencyShort(Number(p.iptu_amount)) : "—"}
                          {" · "}
                          {p.condo_fee ? formatCurrencyShort(Number(p.condo_fee)) : "—"}
                        </p>
                      </div>
                      <Link href={`/dashboard/properties/${p.id}`} className="shrink-0 ml-4 text-xs text-ink-3 hover:text-forest transition-colors">→</Link>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Footer A5 */}
        <div className="flex items-center justify-center gap-3 py-4 opacity-50">
          <span className="text-xs text-ink-3 uppercase tracking-wider">Uma solução</span>
          <A5Logo light height={18} />
        </div>
      </div>
    </main>
  );
}
