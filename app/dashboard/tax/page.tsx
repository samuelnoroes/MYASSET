import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

// ── TABELA CARNÊ-LEÃO 2025 ───────────────────────────────────
function calcCarneLeao(
  rendimentoBruto: number,
  despesasDedut: number = 0,
  dependentes: number = 0,
  inss: number = 0,
  pensao: number = 0,
): {
  base: number;
  aliquota: number;
  deducao: number;
  imposto: number;
  deducoesExtras: number;
} {
  const DEDUCAO_DEPENDENTE = 189.59;
  const deducoesExtras = (dependentes * DEDUCAO_DEPENDENTE) + inss + pensao;
  const base = Math.max(0, rendimentoBruto - despesasDedut - deducoesExtras);

  let aliquota = 0;
  let deducao = 0;

  if (base <= 2259.20) {
    aliquota = 0; deducao = 0;
  } else if (base <= 2826.65) {
    aliquota = 0.075; deducao = 169.44;
  } else if (base <= 3751.05) {
    aliquota = 0.15; deducao = 381.44;
  } else if (base <= 4664.68) {
    aliquota = 0.225; deducao = 662.77;
  } else {
    aliquota = 0.275; deducao = 896.00;
  }

  const imposto = Math.max(0, base * aliquota - deducao);
  return { base, aliquota, deducao, imposto, deducoesExtras };
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

const MONTH_NAMES = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

const DEDUCTIBLE_CATEGORIES = ["iptu", "condominium", "maintenance", "insurance"];

type TaxProfile = {
  tax_person_type: string | null;
  tax_declaration: string | null;
  tax_tenant_type: string | null;
  tax_uses_carne: boolean | null;
  tax_has_planning: boolean | null;
  tax_dependentes: number | null;
  tax_inss_mensal: number | null;
  tax_pensao: number | null;
};

export default async function TaxPage({
  searchParams,
}: {
  searchParams: { year?: string };
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Busca perfil fiscal
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("tax_person_type, tax_declaration, tax_tenant_type, tax_uses_carne, tax_has_planning, tax_dependentes, tax_inss_mensal, tax_pensao, full_name")
    .eq("id", user.id)
    .single();

  // Se não tem perfil fiscal → redireciona para onboarding
  if (!profile?.tax_person_type) {
    redirect("/dashboard/tax/profile");
  }

  const taxProfile = profile as TaxProfile;
  const isPF = taxProfile.tax_person_type === "pf";
  const hasPFTenants = taxProfile.tax_tenant_type !== "pj";

  // Ano fiscal
  const currentYear = new Date().getFullYear();
  const selectedYear = parseInt(searchParams.year || String(currentYear));

  // Busca imóveis
  const { data: properties } = await supabase
    .from("properties")
    .select("id, name, modality, monthly_rent")
    .eq("user_id", user.id)
    .neq("modality", "under_construction");

  const props = properties ?? [];

  // Busca transações do ano selecionado
  const { data: transactions } = await supabase
    .from("transactions")
    .select("property_id, transaction_type, category, amount, transaction_date")
    .eq("user_id", user.id)
    .gte("transaction_date", `${selectedYear}-01-01`)
    .lte("transaction_date", `${selectedYear}-12-31`)
    .order("transaction_date");

  const txs = transactions ?? [];

  // ── CÁLCULOS POR MÊS ────────────────────────────────────────
  const monthlyData = Array.from({ length: 12 }, (_, i) => {
    const monthStr = `${selectedYear}-${String(i + 1).padStart(2, "0")}`;
    const monthTxs = txs.filter(t => t.transaction_date.startsWith(monthStr));

    const rendimentos = monthTxs
      .filter(t => t.transaction_type === "income")
      .reduce((acc, t) => acc + Number(t.amount), 0);

    const despesasDedut = monthTxs
      .filter(t => t.transaction_type === "expense" && DEDUCTIBLE_CATEGORIES.includes(t.category))
      .reduce((acc, t) => acc + Number(t.amount), 0);

    const carne = isPF && hasPFTenants ? calcCarneLeao(
      rendimentos,
      despesasDedut,
      taxProfile.tax_dependentes ?? 0,
      taxProfile.tax_inss_mensal ?? 0,
      taxProfile.tax_pensao ?? 0,
    ) : null;

    return {
      month: MONTH_NAMES[i],
      monthStr,
      rendimentos,
      despesasDedut,
      carne,
    };
  });

  const totalRendimentos = monthlyData.reduce((acc, m) => acc + m.rendimentos, 0);
  const totalDespesasDedut = monthlyData.reduce((acc, m) => acc + m.despesasDedut, 0);
  const totalCarneLeao = monthlyData.reduce((acc, m) => acc + (m.carne?.imposto ?? 0), 0);
  const totalBase = monthlyData.reduce((acc, m) => acc + (m.carne?.base ?? m.rendimentos), 0);

  // ── RENDIMENTOS POR IMÓVEL ───────────────────────────────────
  const byProperty = props.map(p => {
    const propTxs = txs.filter(t => t.property_id === p.id);
    const receitas = propTxs.filter(t => t.transaction_type === "income").reduce((acc, t) => acc + Number(t.amount), 0);
    const despesas = propTxs.filter(t => t.transaction_type === "expense" && DEDUCTIBLE_CATEGORIES.includes(t.category)).reduce((acc, t) => acc + Number(t.amount), 0);
    return { ...p, receitas, despesas, liquido: receitas - despesas };
  }).filter(p => p.receitas > 0);

  // Tensão fiscal — quanto pode estar "sobrando" com planejamento
  const economiaEstimada = totalCarneLeao * 0.35; // estimativa de 35% de economia

  const WA_MSG = encodeURIComponent(
    `Olá! Sou cliente do MyAsset e vi que paguei estimados ${formatCurrency(totalCarneLeao)} em Carnê-Leão em ${selectedYear}. Quero entender se estou no caminho mais eficiente para o meu portfólio imobiliário.`
  );
  const WA_URL = `https://wa.me/5511987266842?text=${WA_MSG}`;

  return (
    <main className="min-h-screen bg-surface">
      <header className="bg-header text-white shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="font-display text-xl italic">
            My<span style={{ color: "#6BA68A" }}>Asset</span>
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/dashboard/tax/profile" className="text-xs text-gray-400 hover:text-white transition-colors uppercase tracking-wider">
              Perfil Fiscal
            </Link>
            <Link href="/dashboard" className="text-xs text-gray-400 hover:text-white transition-colors uppercase tracking-wider">
              ← Dashboard
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">

        {/* Cabeçalho */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-forest/70 mb-2">
              Imposto de Renda
            </p>
            <h1 className="text-3xl font-bold text-ink">
              Relatório Fiscal {selectedYear}
            </h1>
            <p className="text-sm text-ink-2 mt-1">
              {profile.full_name || user.email} · {isPF ? "Pessoa Física" : "Pessoa Jurídica"}
              {taxProfile.tax_tenant_type === "pf" ? " · Inquilinos PF" : taxProfile.tax_tenant_type === "pj" ? " · Inquilinos PJ" : " · Inquilinos PF e PJ"}
            </p>
          </div>

          {/* Seletor de ano */}
          <div className="flex items-center gap-2">
            {[currentYear - 2, currentYear - 1, currentYear].map(y => (
              <Link
                key={y}
                href={`/dashboard/tax?year=${y}`}
                className={`px-4 py-2 text-sm font-bold rounded transition-colors ${selectedYear === y ? "bg-forest text-white" : "bg-white border border-border text-ink hover:border-forest hover:text-forest"}`}
              >
                {y}
              </Link>
            ))}
          </div>
        </div>

        {/* ── KPIs FISCAIS ─────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card">
            <p className="kpi-label">Rendimentos brutos</p>
            <p className="kpi-value text-positive">{formatCurrency(totalRendimentos)}</p>
            <p className="text-xs text-ink-3 mt-1">ano {selectedYear}</p>
          </div>
          <div className="card">
            <p className="kpi-label">Despesas dedutíveis</p>
            <p className="kpi-value">{formatCurrency(totalDespesasDedut)}</p>
            <p className="text-xs text-ink-3 mt-1">IPTU, cond., manut., seguro</p>
          </div>
          <div className="card">
            <p className="kpi-label">Base tributável</p>
            <p className="kpi-value">{formatCurrency(totalBase)}</p>
            <p className="text-xs text-ink-3 mt-1">rendimentos − deduções</p>
          </div>
          <div className="card">
            <p className="kpi-label">
              {isPF && hasPFTenants ? "Carnê-Leão estimado" : "IR estimado"}
            </p>
            <p className="kpi-value text-negative">{formatCurrency(totalCarneLeao)}</p>
            <p className="text-xs text-ink-3 mt-1">
            {taxProfile.tax_dependentes || taxProfile.tax_inss_mensal || taxProfile.tax_pensao
              ? "cálculo detalhado 2025"
              : "estimativa — tabela 2025"}
          </p>
          </div>
        </div>

        {/* ── AVISO PARA PJ ─────────────────────────────────── */}
        {!isPF && (
          <div className="card border-l-4 border-amber-400 bg-amber-50">
            <p className="text-sm font-bold text-amber-700 mb-1">Atenção — Pessoa Jurídica</p>
            <p className="text-sm text-amber-700">
              A tributação de PJ sobre rendimentos imobiliários varia conforme o regime (Simples Nacional, Lucro Presumido ou Lucro Real). Os valores acima são uma estimativa base. Consulte um especialista para calcular corretamente.
            </p>
          </div>
        )}

        {/* ── TABELA MENSAL ─────────────────────────────────── */}
        <div className="card">
          <p className="section-title" style={{ marginBottom: "16px" }}>
            {isPF && hasPFTenants ? "Rendimentos e Carnê-Leão por mês" : "Rendimentos por mês"}
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-2 text-xs font-bold uppercase tracking-wider text-ink-3">Mês</th>
                  <th className="text-right py-3 px-2 text-xs font-bold uppercase tracking-wider text-ink-3">Rendimento Bruto</th>
                  <th className="text-right py-3 px-2 text-xs font-bold uppercase tracking-wider text-ink-3">Despesas Dedutíveis</th>
                  <th className="text-right py-3 px-2 text-xs font-bold uppercase tracking-wider text-ink-3">Base Tributável</th>
                  {isPF && hasPFTenants && (
                    <>
                      <th className="text-right py-3 px-2 text-xs font-bold uppercase tracking-wider text-ink-3">Alíquota</th>
                      <th className="text-right py-3 px-2 text-xs font-bold uppercase tracking-wider text-ink-3 text-negative">Carnê-Leão</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {monthlyData.map((m) => (
                  <tr key={m.monthStr} className={m.rendimentos === 0 ? "opacity-40" : "hover:bg-surface transition-colors"}>
                    <td className="py-3 px-2 font-semibold text-ink">{m.month}</td>
                    <td className="py-3 px-2 text-right text-positive font-medium">
                      {m.rendimentos > 0 ? formatCurrency(m.rendimentos) : "—"}
                    </td>
                    <td className="py-3 px-2 text-right text-ink-2">
                      {m.despesasDedut > 0 ? formatCurrency(m.despesasDedut) : "—"}
                    </td>
                    <td className="py-3 px-2 text-right text-ink">
                      {m.carne ? formatCurrency(m.carne.base) : m.rendimentos > 0 ? formatCurrency(m.rendimentos) : "—"}
                    </td>
                    {isPF && hasPFTenants && (
                      <>
                        <td className="py-3 px-2 text-right text-ink-2">
                          {m.carne && m.rendimentos > 0 ? formatPercent(m.carne.aliquota) : "Isento"}
                        </td>
                        <td className={`py-3 px-2 text-right font-bold ${m.carne?.imposto ? "text-negative" : "text-ink-3"}`}>
                          {m.carne?.imposto ? formatCurrency(m.carne.imposto) : "—"}
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-border bg-surface">
                  <td className="py-3 px-2 font-bold text-ink">Total</td>
                  <td className="py-3 px-2 text-right font-bold text-positive">{formatCurrency(totalRendimentos)}</td>
                  <td className="py-3 px-2 text-right font-bold text-ink">{formatCurrency(totalDespesasDedut)}</td>
                  <td className="py-3 px-2 text-right font-bold text-ink">{formatCurrency(totalBase)}</td>
                  {isPF && hasPFTenants && (
                    <>
                      <td className="py-3 px-2" />
                      <td className="py-3 px-2 text-right font-bold text-negative">{formatCurrency(totalCarneLeao)}</td>
                    </>
                  )}
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* ── RENDIMENTOS POR IMÓVEL ────────────────────────── */}
        {byProperty.length > 0 && (
          <div className="card">
            <p className="section-title" style={{ marginBottom: "16px" }}>
              Rendimentos por imóvel
            </p>
            <div className="divide-y divide-border">
              {byProperty.map(p => (
                <div key={p.id} className="flex items-center justify-between py-4">
                  <div>
                    <p className="font-semibold text-ink">{p.name}</p>
                    <p className="text-xs text-ink-3 uppercase tracking-wider mt-0.5">
                      {p.modality === "annual_lease" ? "Locação anual" : "Temporada"}
                    </p>
                  </div>
                  <div className="flex gap-8 text-right">
                    <div>
                      <p className="text-xs text-ink-3 uppercase tracking-wider">Receitas</p>
                      <p className="font-bold text-positive">{formatCurrency(p.receitas)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-ink-3 uppercase tracking-wider">Dedutíveis</p>
                      <p className="font-medium text-ink">{formatCurrency(p.despesas)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-ink-3 uppercase tracking-wider">Líquido</p>
                      <p className={`font-bold ${p.liquido >= 0 ? "text-positive" : "text-negative"}`}>{formatCurrency(p.liquido)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── NOTA LEGAL ───────────────────────────────────── */}
        <div className="card bg-surface border border-border">
          <p className="text-xs font-bold uppercase tracking-wider text-ink-3 mb-2">⚠️ Importante</p>
          <p className="text-sm text-ink-2 leading-relaxed">
            Os valores apresentados são <strong>estimativas baseadas nas transações registradas</strong> e na tabela progressiva do Carnê-Leão 2025.
            Não consideram deduções de dependentes, pensão alimentícia, contribuição ao INSS ou outras despesas pessoais.
            Este relatório não substitui a orientação de um contador ou consultor tributário especializado.
          </p>
        </div>

        {/* ── GATILHO COMERCIAL A5 ─────────────────────────── */}
        {totalCarneLeao > 0 && (
          <div
            className="rounded-card p-6 text-white"
            style={{ background: "linear-gradient(135deg, #1B3564 0%, #2D4A3E 100%)" }}
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <p className="text-xs uppercase tracking-widest text-white/60 mb-2">
                  Consultoria Fiscal A5
                </p>
                <h3 className="text-xl font-bold text-white mb-2">
                  Você pagou {formatCurrency(totalCarneLeao)} em IR em {selectedYear}.
                </h3>
                <p className="text-sm text-white/80 leading-relaxed max-w-lg">
                  Investidores com portfólio similar ao seu pagam em média{" "}
                  <strong className="text-white">30–40% menos</strong> com planejamento tributário adequado.
                  Isso representa uma economia potencial de{" "}
                  <strong className="text-yellow-300">{formatCurrency(economiaEstimada)}/ano</strong> no seu caso.
                  Nossa equipe analisa seu perfil e apresenta o caminho mais eficiente.
                </p>
              </div>
              <div className="shrink-0">
                <a
                  href={WA_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-6 py-4 rounded font-bold text-sm uppercase tracking-wider text-white transition-colors"
                  style={{ backgroundColor: "#25D366" }}
                >
                  <svg width="18" height="18" viewBox="0 0 32 32" fill="white">
                    <path d="M16 2C8.268 2 2 8.268 2 16c0 2.478.675 4.796 1.851 6.782L2 30l7.438-1.82A13.93 13.93 0 0016 30c7.732 0 14-6.268 14-14S23.732 2 16 2zm6.29 19.927c-.344-.172-2.035-1.003-2.35-1.118-.316-.115-.546-.172-.776.172-.23.344-.888 1.118-1.088 1.348-.2.23-.4.258-.744.086-.344-.172-1.454-.535-2.768-1.703-1.023-.912-1.714-2.037-1.914-2.381-.2-.344-.022-.53.15-.701.155-.154.344-.4.516-.601.172-.2.23-.344.344-.573.115-.23.057-.43-.028-.601-.086-.172-.776-1.872-1.062-2.564-.28-.672-.565-.58-.776-.59l-.66-.012c-.23 0-.601.086-.916.43-.315.344-1.204 1.175-1.204 2.866 0 1.69 1.233 3.324 1.405 3.553.172.23 2.428 3.71 5.882 5.203.822.355 1.464.567 1.965.726.826.262 1.578.225 2.173.137.663-.098 2.035-.832 2.322-1.635.287-.803.287-1.49.2-1.635-.086-.144-.315-.23-.659-.4z"/>
                  </svg>
                  Quero economizar no IR
                </a>
                <p className="text-xs text-white/50 mt-2 text-center">
                  Consultoria com especialista A5
                </p>
              </div>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
