import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { registerInterest } from "./actions";

const BANKS = [
  { name: "Itaú",      color: "#EC7000" },
  { name: "Nubank",    color: "#820AD1" },
  { name: "Bradesco",  color: "#CC0000" },
  { name: "Santander", color: "#EC0000" },
  { name: "Caixa",     color: "#005CA9" },
  { name: "BB",        color: "#F9C400" },
  { name: "Inter",     color: "#FF7A00" },
  { name: "XP",        color: "#000000" },
];

// ── JÁ DISPONÍVEL (via cobrança automática) ──────────────────
const FEATURES_AVAILABLE = [
  {
    icon: "⚡",
    title: "Lançamento automático",
    desc: "O PIX do aluguel cobrado via MyAsset é identificado automaticamente e lançado no imóvel correto — sem digitar nada.",
  },
  {
    icon: "✅",
    title: "Conciliação real",
    desc: "Saiba exatamente quando cada aluguel foi pago, com quanto atraso e via qual método. Dados reais, não declarados.",
  },
];

// ── EM BREVE (via Open Banking) ───────────────────────────────
const FEATURES_COMING = [
  {
    icon: "📂",
    title: "Despesas automáticas",
    desc: "IPTU, condomínio e manutenção são identificados e categorizados direto do seu extrato bancário. Você só confirma as exceções.",
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
                Inteligência financeira
              </p>
            </div>
            <h1 className="text-4xl font-bold text-ink mb-3">Open Finance</h1>
            <p className="text-lg text-ink-2 leading-relaxed max-w-xl">
              Conecte suas contas bancárias ao MyAsset e deixe o app trabalhar por você.
              Parte dessa promessa já está disponível hoje.
            </p>
          </div>
          <div className="hidden md:flex items-center justify-center w-20 h-20 rounded-2xl shrink-0"
            style={{ background: "linear-gradient(135deg, #2D4A3E 0%, #1B3564 100%)" }}>
            <span style={{ fontSize: 36 }}>🔗</span>
          </div>
        </div>

        {/* ── JÁ DISPONÍVEL ───────────────────────────────── */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <p className="section-title" style={{ marginBottom: 0 }}>
              Já disponível
            </p>
            <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-green-100 text-green-700 border border-green-200">
              Ativo agora
            </span>
          </div>
          <p className="text-sm text-ink-2 mb-4">
            Com a <strong>cobrança automática de aluguel</strong>, o MyAsset já entrega
            automaticamente as funcionalidades abaixo — sem precisar conectar sua conta bancária.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {FEATURES_AVAILABLE.map((f) => (
              <div key={f.title} className="card flex gap-4 border border-green-200 bg-green-50/50">
                <span className="text-2xl shrink-0 mt-0.5">{f.icon}</span>
                <div>
                  <p className="font-bold text-ink mb-1">{f.title}</p>
                  <p className="text-sm text-ink-2 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* CTA pra cobrança automática */}
          <div className="mt-4 flex items-center justify-between gap-4 px-5 py-4 rounded-card border border-green-200 bg-green-50">
            <div>
              <p className="text-sm font-semibold text-green-800">
                Ainda não ativou a cobrança automática?
              </p>
              <p className="text-xs text-green-700 mt-0.5">
                Configure em qualquer imóvel de locação anual e comece a receber 95% do aluguel direto na sua conta.
              </p>
            </div>
            <a
              href="/dashboard/properties"
              className="shrink-0 px-4 py-2 rounded text-white text-xs font-bold uppercase tracking-wider transition-colors"
              style={{ backgroundColor: "#2D4A3E" }}
            >
              Ver imóveis
            </a>
          </div>
        </div>

        {/* ── EM BREVE ────────────────────────────────────── */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <p className="section-title" style={{ marginBottom: 0 }}>
              Próxima fase — Open Banking
            </p>
            <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
              Em breve
            </span>
          </div>
          <p className="text-sm text-ink-2 mb-4">
            Conectando diretamente ao seu banco (via Open Finance do Banco Central),
            o MyAsset vai além dos aluguéis cobrados pela plataforma.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {FEATURES_COMING.map((f) => (
              <div key={f.title} className="card flex gap-4 opacity-75">
                <span className="text-2xl shrink-0 mt-0.5">{f.icon}</span>
                <div>
                  <p className="font-bold text-ink mb-1">{f.title}</p>
                  <p className="text-sm text-ink-2 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── BANCOS SUPORTADOS ───────────────────────────── */}
        <div className="card">
          <p className="text-xs font-bold uppercase tracking-widest text-ink-3 mb-4">
            Bancos compatíveis na primeira versão do Open Banking
          </p>
          <div className="flex flex-wrap gap-3">
            {BANKS.map((b) => (
              <div
                key={b.name}
                className="flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-surface text-sm font-semibold opacity-60"
              >
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: b.color }} />
                {b.name}
              </div>
            ))}
            <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-dashed border-border text-sm text-ink-3 opacity-60">
              + outros
            </div>
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
                Quer ser avisado quando o Open Banking estiver disponível?
              </p>
              <p className="text-sm text-ink-2 mb-6 leading-relaxed">
                Sua resposta nos ajuda a priorizar o lançamento da próxima fase.
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
