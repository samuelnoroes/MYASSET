import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { registerInterest } from "./actions";

const BANKS = [
  { name: "Itaú",     color: "#EC7000" },
  { name: "Nubank",   color: "#820AD1" },
  { name: "Bradesco", color: "#CC0000" },
  { name: "Santander",color: "#EC0000" },
  { name: "Caixa",    color: "#005CA9" },
  { name: "BB",       color: "#F9C400" },
  { name: "Inter",    color: "#FF7A00" },
  { name: "XP",       color: "#000000" },
];

const FEATURES = [
  {
    icon: "⚡",
    title: "Lançamento automático",
    desc: "O PIX do aluguel que cai na sua conta é identificado automaticamente e lançado no imóvel correto — sem digitar nada.",
  },
  {
    icon: "✅",
    title: "Conciliação real",
    desc: "Saiba exatamente quando cada aluguel foi pago, com quanto atraso e se foi parcial. Dados do banco, não declarados.",
  },
  {
    icon: "📂",
    title: "Despesas automáticas",
    desc: "IPTU, condomínio e manutenção são identificados e categorizados direto do seu extrato. Você só confirma as exceções.",
  },
  {
    icon: "💡",
    title: "Oportunidades inteligentes",
    desc: "Detectamos dinheiro parado que poderia virar entrada de um imóvel, ou transações de imóveis que você ainda não cadastrou.",
  },
  {
    icon: "📊",
    title: "Visão patrimonial completa",
    desc: "Imóveis + investimentos + caixa + crédito. Seu patrimônio real, não só a parte imobiliária.",
  },
  {
    icon: "🔒",
    title: "Só leitura, nunca movimenta",
    desc: "Open Finance é read-only. O MyAsset nunca acessa sua senha, nunca move dinheiro. Autorizado pelo Banco Central.",
  },
];

export default async function OpenFinancePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Verificar se já respondeu
  const { data: existing } = await supabase
    .from("open_finance_interest")
    .select("interested, updated_at")
    .eq("user_id", user.id)
    .single();

  const alreadyAnswered = !!existing;
  const wantsIt = existing?.interested === true;

  return (
    <main className="min-h-screen bg-surface">
      <div className="max-w-4xl mx-auto px-6 py-10 space-y-10">

        {/* ── CABEÇALHO ──────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <p className="text-xs font-bold uppercase tracking-widest text-forest/70">
                Próxima funcionalidade
              </p>
              <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                Em breve
              </span>
            </div>
            <h1 className="text-4xl font-bold text-ink mb-3">
              Open Finance
            </h1>
            <p className="text-lg text-ink-2 leading-relaxed max-w-xl">
              Conecte suas contas bancárias ao MyAsset e deixe o app trabalhar por você.
              Lançamentos automáticos, conciliação real e oportunidades que você nunca viu.
            </p>
          </div>
          <div className="hidden md:flex items-center justify-center w-20 h-20 rounded-2xl shrink-0"
            style={{ background: "linear-gradient(135deg, #2D4A3E 0%, #1B3564 100%)" }}>
            <span style={{ fontSize: 36 }}>🔗</span>
          </div>
        </div>

        {/* ── BANCOS SUPORTADOS ───────────────────────────── */}
        <div className="card">
          <p className="text-xs font-bold uppercase tracking-widest text-ink-3 mb-4">
            Bancos compatíveis na primeira versão
          </p>
          <div className="flex flex-wrap gap-3">
            {BANKS.map((b) => (
              <div
                key={b.name}
                className="flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-surface text-sm font-semibold"
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: b.color }}
                />
                {b.name}
              </div>
            ))}
            <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-dashed border-border text-sm text-ink-3">
              + outros
            </div>
          </div>
        </div>

        {/* ── FUNCIONALIDADES ─────────────────────────────── */}
        <div>
          <p className="section-title">O que muda no seu dia a dia</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {FEATURES.map((f) => (
              <div key={f.title} className="card flex gap-4">
                <span className="text-2xl shrink-0 mt-0.5">{f.icon}</span>
                <div>
                  <p className="font-bold text-ink mb-1">{f.title}</p>
                  <p className="text-sm text-ink-2 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── SEGURANÇA ───────────────────────────────────── */}
        <div
          className="rounded-card px-6 py-5 flex gap-5 items-start"
          style={{ backgroundColor: "#F0FDF4", border: "1px solid #BBF7D0" }}
        >
          <span className="text-2xl shrink-0">🏛️</span>
          <div>
            <p className="font-bold text-green-800 mb-1">Regulado pelo Banco Central do Brasil</p>
            <p className="text-sm text-green-700 leading-relaxed">
              O Open Finance brasileiro é o mais avançado do mundo. Seu consentimento é
              explícito, revogável a qualquer momento diretamente no app do seu banco,
              e o MyAsset só terá acesso de <strong>leitura</strong> — nunca movimenta valores.
              Nenhuma senha bancária é compartilhada.
            </p>
          </div>
        </div>

        {/* ── CTA ─────────────────────────────────────────── */}
        <div className="card">
          {!alreadyAnswered ? (
            <>
              <p className="font-bold text-ink text-lg mb-2">
                Faz sentido para você?
              </p>
              <p className="text-sm text-ink-2 mb-6 leading-relaxed">
                Nos diga se quer ser avisado quando o Open Finance estiver disponível.
                Sua resposta nos ajuda a priorizar o lançamento.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <form action={registerInterest} className="flex-1">
                  <input type="hidden" name="interested" value="true" />
                  <button
                    type="submit"
                    className="w-full py-4 bg-forest text-white font-bold tracking-wider uppercase text-sm hover:bg-forest-light transition-colors rounded"
                  >
                    ✓ Quero quando estiver disponível
                  </button>
                </form>
                <form action={registerInterest} className="flex-1">
                  <input type="hidden" name="interested" value="false" />
                  <button
                    type="submit"
                    className="w-full py-4 bg-surface border border-border text-ink font-bold tracking-wider uppercase text-sm hover:border-forest hover:text-forest transition-colors rounded"
                  >
                    Não por enquanto
                  </button>
                </form>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-4 mb-5">
                <span className="text-3xl">{wantsIt ? "🎉" : "👍"}</span>
                <div>
                  <p className="font-bold text-ink text-lg">
                    {wantsIt
                      ? "Você está na lista — avisaremos assim que lançar."
                      : "Tudo certo. Você pode mudar de ideia quando quiser."}
                  </p>
                  <p className="text-sm text-ink-3 mt-0.5">
                    Resposta registrada · você pode atualizar abaixo
                  </p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <form action={registerInterest} className="flex-1">
                  <input type="hidden" name="interested" value="true" />
                  <button
                    type="submit"
                    className={`w-full py-3 font-bold tracking-wider uppercase text-sm transition-colors rounded border ${wantsIt ? "bg-forest text-white border-forest" : "bg-surface border-border text-ink hover:border-forest hover:text-forest"}`}
                  >
                    ✓ Quero quando lançar
                  </button>
                </form>
                <form action={registerInterest} className="flex-1">
                  <input type="hidden" name="interested" value="false" />
                  <button
                    type="submit"
                    className={`w-full py-3 font-bold tracking-wider uppercase text-sm transition-colors rounded border ${!wantsIt ? "bg-ink text-white border-ink" : "bg-surface border-border text-ink hover:border-ink"}`}
                  >
                    Não por enquanto
                  </button>
                </form>
              </div>
            </>
          )}
        </div>

      </div>
    </main>
  );
}
