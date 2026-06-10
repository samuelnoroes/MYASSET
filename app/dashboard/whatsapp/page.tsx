import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { saveWhatsAppNumber } from "./actions";
import { getPlanLimits } from "@/app/lib/plans";

const BOT_NUMBER = "5511987266842";
const BOT_DISPLAY = "+55 (11) 98726-6842";

function formatDate(d: string | null): string {
  if (!d) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  }).format(new Date(d));
}

export default async function WhatsAppPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("full_name, phone, whatsapp_number, paired_at, plan")
    .eq("id", user.id)
    .single();

  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const { data: usage } = await supabase
    .from("whatsapp_usage")
    .select("message_count, last_message_at")
    .eq("user_id", user.id)
    .eq("month", monthKey)
    .single();

  const phone = profile?.whatsapp_number || profile?.phone || "";
  const isPro = ["pro", "plus", "essencial"].includes(profile?.plan ?? "");
  const limits = getPlanLimits(profile?.plan);
  const isPaired = !!profile?.paired_at;
  const waLink = `https://wa.me/${BOT_NUMBER}?text=${encodeURIComponent("Oi")}`;

  return (
    <main className="min-h-screen bg-surface">
      <div className="max-w-2xl mx-auto px-6 py-10 space-y-6">

        {/* Header */}
        <div>
          <h1 className="font-display text-4xl text-ink mb-1">WhatsApp</h1>
          <p className="text-sm text-ink-2">
            Gerencie seu portfólio pelo WhatsApp sem abrir o app.
          </p>
        </div>

        {/* Status card */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${isPaired ? "bg-green-100" : "bg-surface border border-border"}`}>
                💬
              </div>
              <div>
                <p className="font-semibold text-ink text-sm">
                  {isPaired ? "Conectado" : "Não conectado"}
                </p>
                <p className="text-xs text-ink-3">
                  {isPaired ? `Desde ${formatDate(profile?.paired_at ?? null)}` : "Envie uma mensagem para ativar"}
                </p>
              </div>
            </div>
            {isPaired && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-300 text-xs font-bold rounded-full border border-emerald-400/30">
                ✓ Ativo
              </span>
            )}
          </div>

          {/* Usage this month */}
          {isPaired && (
            <div className="flex gap-4 mb-5 p-3 bg-surface rounded-lg border border-border">
              <div className="flex-1 text-center">
                <p className="text-2xl font-bold text-ink">{usage?.message_count ?? 0}<span className="text-sm font-normal text-ink-3"> / {limits.monthlyMessages}</span></p>
                <p className="text-xs text-ink-3 mt-0.5">mensagens este mês</p>
              </div>
              <div className="w-px bg-border" />
              <div className="flex-1 text-center">
                <p className="text-sm font-semibold text-ink">
                  {usage?.last_message_at ? formatDate(usage.last_message_at) : "—"}
                </p>
                <p className="text-xs text-ink-3 mt-0.5">última mensagem</p>
              </div>
            </div>
          )}

          {/* Plano não pro */}
          {!isPro && (
            <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-400/30 rounded-lg mb-4">
              <span className="text-amber-500 text-lg">⚠️</span>
              <div>
                <p className="text-sm font-semibold text-amber-200">Disponível nos planos pagos (Essencial, Plus e Pro)</p>
                <p className="text-xs text-amber-300 mt-0.5">
                  Faça upgrade para usar o assistente WhatsApp.
                </p>
                <a href="/dashboard/plans" className="inline-block mt-2 text-xs font-bold text-amber-200 underline">
                  Ver planos →
                </a>
              </div>
            </div>
          )}

          {/* Número do usuário */}
          <div className="mb-5">
            <p className="text-xs font-bold uppercase tracking-wider text-ink-3 mb-2">
              Seu número WhatsApp
            </p>
            <form action={saveWhatsAppNumber} className="flex gap-2">
              <input
                type="tel"
                name="phone"
                defaultValue={phone}
                placeholder="5511987654321"
                className="flex-1 px-3 py-2 text-sm border border-border rounded-lg bg-card text-ink focus:outline-none focus:border-forest"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-forest text-white text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-forest-light transition-colors"
              >
                Salvar
              </button>
            </form>
            <p className="text-xs text-ink-3 mt-1.5">
              Formato: código do país + DDD + número. Ex: 5511987654321
            </p>
          </div>

          {/* CTA */}
          <a
            href={isPro ? waLink : "/dashboard/plans"}
            target={isPro ? "_blank" : undefined}
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-lg text-sm font-bold uppercase tracking-wider transition-colors text-white"
            style={{ backgroundColor: isPro ? "#25D366" : "#C4A96B" }}
          >
            <svg width="18" height="18" viewBox="0 0 32 32" fill="white">
              <path d="M16 2C8.268 2 2 8.268 2 16c0 2.478.675 4.796 1.851 6.782L2 30l7.438-1.82A13.93 13.93 0 0016 30c7.732 0 14-6.268 14-14S23.732 2 16 2zm6.29 19.927c-.344-.172-2.035-1.003-2.35-1.118-.316-.115-.546-.172-.776.172-.23.344-.888 1.118-1.088 1.348-.2.23-.4.258-.744.086-.344-.172-1.454-.535-2.768-1.703-1.023-.912-1.714-2.037-1.914-2.381-.2-.344-.022-.53.15-.701.155-.154.344-.4.516-.601.172-.2.23-.344.344-.573.115-.23.057-.43-.028-.601-.086-.172-.776-1.872-1.062-2.564-.28-.672-.565-.58-.776-.59l-.66-.012c-.23 0-.601.086-.916.43-.315.344-1.204 1.175-1.204 2.866 0 1.69 1.233 3.324 1.405 3.553.172.23 2.428 3.71 5.882 5.203.822.355 1.464.567 1.965.726.826.262 1.578.225 2.173.137.663-.098 2.035-.832 2.322-1.635.287-.803.287-1.49.2-1.635-.086-.144-.315-.23-.659-.4z"/>
            </svg>
            {isPro ? "Conversar com MyAsset" : "Fazer upgrade"}
          </a>
        </div>



        {/* O que o assistente faz */}
        <div className="card p-6">
          <p className="section-title mb-4">O que você pode fazer</p>
          <div className="grid grid-cols-1 gap-3">
            {[
              { icon: "🏠", title: "Cadastrar imóveis", desc: "Envie os dados e o assistente registra com dados de mercado da região" },
              { icon: "📊", title: "Consultar portfólio", desc: "Pergunte sobre saldo, yield, receitas e o assistente responde na hora" },
              { icon: "💡", title: "Análise e consultoria", desc: "Compare imóveis, peça recomendações e tome decisões com mais segurança" },
              { icon: "🔍", title: "Dados de mercado", desc: "Valor do m², aluguel médio e tendência de valorização da sua região" },
            ].map((item) => (
              <div key={item.title} className="flex items-start gap-3 p-3 bg-surface rounded-lg">
                <span className="text-xl mt-0.5">{item.icon}</span>
                <div>
                  <p className="text-sm font-semibold text-ink">{item.title}</p>
                  <p className="text-xs text-ink-3 mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </main>
  );
}
