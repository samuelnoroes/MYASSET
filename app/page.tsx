import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export default async function Home() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-cream flex flex-col">
      {/* Header */}
      <header className="border-b border-ink/10">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <span className="font-display text-2xl text-ink">
            My<span className="italic text-forest">Asset</span>
          </span>
          <Link
            href="/login"
            className="text-xs uppercase tracking-wider text-ink/60 hover:text-forest transition-colors"
          >
            Entrar
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 py-24 text-center">
        <p className="text-xs tracking-[0.3em] uppercase text-forest/60 mb-10">
          Gestão de portfólio imobiliário
        </p>

        <h1 className="font-display text-6xl md:text-8xl lg:text-9xl text-ink leading-none mb-8 max-w-4xl">
          My<span className="italic text-forest">Asset</span>
        </h1>

        <p className="font-sans text-base md:text-lg text-ink/70 max-w-lg mx-auto leading-relaxed mb-14">
          A clareza que o investidor imobiliário sempre quis sobre o próprio
          patrimônio. Dashboard completo, lançamentos simples, visão real do
          seu portfólio.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/login"
            className="px-8 py-4 bg-forest text-cream font-medium tracking-wider uppercase text-xs hover:bg-ink transition-colors"
          >
            Criar conta gratuita
          </Link>
          <Link
            href="/login"
            className="px-8 py-4 bg-transparent border border-ink/20 text-ink font-medium tracking-wider uppercase text-xs hover:border-forest hover:text-forest transition-colors"
          >
            Já tenho conta
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-ink/10">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-ink/10 border border-ink/10">
            <div className="bg-cream p-8">
              <p className="text-xs tracking-[0.25em] uppercase text-forest/60 mb-4">
                01
              </p>
              <h3 className="font-display text-2xl text-ink mb-3">
                Dashboard completo
              </h3>
              <p className="text-sm text-ink/60 leading-relaxed">
                Yield, ROI, valorização e fluxo de caixa de todos os imóveis
                numa tela. Visão patrimonial e financeira em tempo real.
              </p>
            </div>

            <div className="bg-cream p-8">
              <p className="text-xs tracking-[0.25em] uppercase text-forest/60 mb-4">
                02
              </p>
              <h3 className="font-display text-2xl text-ink mb-3">
                Lançamentos simples
              </h3>
              <p className="text-sm text-ink/60 leading-relaxed">
                Registre aluguéis recebidos, IPTU, condomínio e manutenções em
                segundos. Em breve: lance pelo WhatsApp com uma mensagem.
              </p>
            </div>

            <div className="bg-cream p-8">
              <p className="text-xs tracking-[0.25em] uppercase text-forest/60 mb-4">
                03
              </p>
              <h3 className="font-display text-2xl text-ink mb-3">
                Por imóvel
              </h3>
              <p className="text-sm text-ink/60 leading-relaxed">
                Cada ativo tem seu histórico de transações, yield individual e
                saldo do mês. Veja qual imóvel performa melhor no portfólio.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-ink/10">
        <div className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
          <span className="font-display italic text-sm text-ink/40">
            MyAsset
          </span>
          <p className="text-[10px] uppercase tracking-wider text-ink/30">
            Versão beta
          </p>
        </div>
      </footer>
    </main>
  );
}
