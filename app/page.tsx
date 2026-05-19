import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import A5Logo from "@/app/components/A5Logo";

export default async function Home() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  return (
    <main className="min-h-screen bg-header text-white flex flex-col">
      {/* Header */}
      <header className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="font-display text-2xl italic">
              My<span style={{ color: "#6BA68A" }}>Asset</span>
            </h1>
            <div className="w-px h-5 bg-white/20" />
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-gray-500 uppercase tracking-wider">by</span>
              <A5Logo light height={20} />
            </div>
          </div>
          <Link href="/login" className="text-sm text-gray-400 hover:text-white transition-colors uppercase tracking-wider">
            Entrar
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 py-24 text-center">
        <p className="text-xs tracking-[0.3em] uppercase text-gray-400 mb-8">
          Gestão de portfólio imobiliário
        </p>
        <h2 className="font-display text-6xl md:text-8xl italic mb-8 leading-tight">
          My<span style={{ color: "#6BA68A" }}>Asset</span>
        </h2>
        <p className="text-base md:text-lg text-gray-400 max-w-lg mx-auto leading-relaxed mb-12">
          A clareza que o investidor imobiliário sempre quis sobre o próprio patrimônio.
          Dashboard completo, gráficos reais, alertas automáticos.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/login" className="px-8 py-4 bg-forest text-white font-bold tracking-wider uppercase text-sm hover:bg-forest-light transition-colors rounded">
            Criar conta gratuita
          </Link>
          <Link href="/login" className="px-8 py-4 bg-transparent border border-white/20 text-white font-bold tracking-wider uppercase text-sm hover:border-white/50 transition-colors rounded">
            Já tenho conta
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <p className="text-xs tracking-[0.25em] uppercase mb-3" style={{ color: "#6BA68A" }}>01</p>
              <h3 className="text-lg font-bold text-white mb-3">Dashboard completo</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Yield, ROI, valorização e fluxo de caixa. Donut chart de distribuição
                e histórico de 6 meses — tudo numa tela.
              </p>
            </div>
            <div>
              <p className="text-xs tracking-[0.25em] uppercase mb-3" style={{ color: "#6BA68A" }}>02</p>
              <h3 className="text-lg font-bold text-white mb-3">Alertas inteligentes</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Cobrança 5 dias antes do vencimento. Alerta de inadimplência no dia.
                Quite com um clique — o saldo atualiza automaticamente.
              </p>
            </div>
            <div>
              <p className="text-xs tracking-[0.25em] uppercase mb-3" style={{ color: "#6BA68A" }}>03</p>
              <h3 className="text-lg font-bold text-white mb-3">3 perfis de investidor</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Locação anual, temporada/Airbnb ou na planta. Cada perfil com
                KPIs e fluxos específicos — sem campo desnecessário.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer com A5 */}
      <footer className="border-t border-white/10 py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="font-display italic text-sm text-gray-500">MyAsset</span>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-600 uppercase tracking-wider">Uma solução</span>
            <A5Logo light height={22} />
            <span className="text-xs text-gray-600 uppercase tracking-wider">Asset</span>
          </div>
          <p className="text-xs uppercase tracking-wider text-gray-600">Versão beta</p>
        </div>
      </footer>
    </main>
  );
}
